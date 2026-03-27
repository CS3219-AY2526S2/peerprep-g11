package peerprep.matching.service;

import java.util.*;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.MongoTransactionManager;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;

import peerprep.matching.documents.MatchDoc;
import peerprep.matching.documents.UserStateDoc;
import peerprep.matching.documents.WaitingQueueDoc;
import peerprep.matching.models.MatchRequest;
import peerprep.matching.models.UserState;
import peerprep.matching.repositories.MatchRepository;
import peerprep.matching.repositories.UserStateRepository;
import peerprep.matching.repositories.WaitingQueueRepository;

@Service
public class MatchService {

    private static final long TWO_MIN_IN_MS = 120000;

    private final WaitingQueueRepository waitingQueueRepository;
    private final UserStateRepository userStateRepository;
    private final MatchRepository matchRepository;
    private final TransactionTemplate transactionTemplate;

    @Autowired
    public MatchService(
            WaitingQueueRepository waitingQueueRepository,
            UserStateRepository userStateRepository,
            MatchRepository matchRepository,
            MongoTransactionManager transactionManager) {
        this.waitingQueueRepository = waitingQueueRepository;
        this.userStateRepository = userStateRepository;
        this.matchRepository = matchRepository;
        this.transactionTemplate = new TransactionTemplate(transactionManager);
    }

    /**
     * Adds user to the waiting pool under the selected category
     * and attempt to match users within the selected category.
     * Fully transactional to prevent race conditions with cancelMatch.
     * If user is already in the waiting pool or matched, an exception is thrown.
     *
     * @param req A MatchRequest object containing user id and category.
     * @return The request ID of the match request of user.
     * @throws RuntimeException If user is already in waiting pool or in an active match.
     */
    public String addUser(MatchRequest req) {
        return transactionTemplate.execute(status -> {
            String userId = req.getUserId();
            String requestId = UUID.randomUUID().toString();
            req.setRequestId(requestId);
            String userName = req.getUserName();
            String category = req.getCategory();

            boolean success = userStateRepository.upsertIfNotPendingOrMatched(
                    userId, requestId, userName, category);
            if (!success) {
                throw new RuntimeException("User already in queue or matched");
            }

            waitingQueueRepository.createIfNotExists(category);
            waitingQueueRepository.enqueueUser(category, userId);

            tryMatchTransactional(category);

            return requestId;
        });
    }

    /**
     * Try to match users in a category inside a transaction.
     */
    private void tryMatchTransactional(String category) {
        while (true) {
            String userId1 = waitingQueueRepository.dequeueUserAndReturn(category);
            String userId2 = waitingQueueRepository.dequeueUserAndReturn(category);

            if (userId1 == null) break;
            if (userId2 == null) {
                waitingQueueRepository.enqueueFront(category, userId1);
                break;
            }

            UserStateDoc stateDoc1 = userStateRepository.findByUserId(userId1);
            UserStateDoc stateDoc2 = userStateRepository.findByUserId(userId2);

            boolean valid1 = stateDoc1 != null && stateDoc1.getState().equals(UserState.PENDING.name());
            boolean valid2 = stateDoc2 != null && stateDoc2.getState().equals(UserState.PENDING.name());

            if (!valid1 || !valid2) {
                if (valid1) waitingQueueRepository.enqueueFront(category, userId1);
                if (valid2) waitingQueueRepository.enqueueFront(category, userId2);
                continue;
            }

            stateDoc1.setState(UserState.MATCHED.name());
            stateDoc2.setState(UserState.MATCHED.name());
            userStateRepository.save(stateDoc1);
            userStateRepository.save(stateDoc2);

            String matchId = UUID.randomUUID().toString();
            MatchDoc matchDoc = new MatchDoc(matchId, userId1, userId2);
            matchRepository.save(matchDoc);
        }
    }

    /**
     * Cancel a match request safely within a transaction.
     * 
     * @param requestId Request ID of the match request of user.
     * @return true if user removed successfully, false if user was not found.
     */
    public boolean cancelMatch(String requestId) {
        return transactionTemplate.execute(status -> {
            UserStateDoc stateDoc = userStateRepository.findByRequestId(requestId);
            if (stateDoc == null) return false;

            String userId = stateDoc.getUserId();

            if (stateDoc.getState().equals(UserState.MATCHED.name())) {
                MatchDoc matchDoc = matchRepository.findActiveMatch(userId);
                if (matchDoc == null) return false;

                matchRepository.delete(matchDoc);
                userStateRepository.deleteByUserId(matchDoc.getUser1());
                userStateRepository.deleteByUserId(matchDoc.getUser2());
                return true;
            }

            String category = stateDoc.getCategory();
            waitingQueueRepository.removeUser(category, userId);
            userStateRepository.deleteByUserId(userId);
            return true;
        });
    }

    /**
     * Returns the state of the user (idle / pending / matched / timed out).
     *
     * @param requestId Request ID of the match request of user.
     * @return Current state of the user.
     */
    public String getStatus(String requestId) {
        UserStateDoc stateDoc = userStateRepository.findByRequestId(requestId);
        if (stateDoc == null) return null;
        System.out.println(stateDoc.getState());
        return stateDoc.getState().toLowerCase();
    }

    /**
     * Ends the active match session of the user and the matched peer, 
     * and removes them from the system. 
     * If user is not in an active match, returns false.
     *
     * @param requestId Request ID of the match request of user.
     * @return true if session ended successfully, false otherwise.
     */
    public boolean endSession(String matchId) {
        MatchDoc matchDoc = matchRepository.findByMatchId(matchId);
        if (matchDoc == null || !matchDoc.getStatus().equals("active")) return false;

        matchDoc.setStatus("ended");
        matchDoc.setEndedAt(new Date());
        matchRepository.save(matchDoc);

        userStateRepository.deleteByUserId(matchDoc.getUser1());
        userStateRepository.deleteByUserId(matchDoc.getUser2());

        return true;
    }

    /**
     * Removes all users that have been in the waiting pool for more than two minutes.
     * Fully transactional to avoid race conditions with matching or cancelling.
     */
    public void removeTimeoutUsers() {
        List<WaitingQueueDoc> queues = waitingQueueRepository.findAll();
        long now = System.currentTimeMillis();

        for (WaitingQueueDoc queueDoc : queues) {
            String category = queueDoc.getCategory();

            transactionTemplate.execute(status -> {
                List<String> userIds = new ArrayList<>(queueDoc.getUserIds());

                for (String userId : userIds) {
                    UserStateDoc stateDoc = userStateRepository.findByUserId(userId);
                    if (stateDoc == null) continue;
                    if (!stateDoc.getState().equals(UserState.PENDING.name())) continue;

                    long joinedAt = stateDoc.getCreatedAt().getTime();
                    if ((now - joinedAt) < TWO_MIN_IN_MS) continue;

                    waitingQueueRepository.removeUser(category, userId);
                    stateDoc.setState(UserState.TIMED_OUT.name());
                    userStateRepository.save(stateDoc);
                }

                return null;
            });
        }
    }

    /**
     * Finds and returns the match document using the match ID
     *
     * @param matchId Match ID of the match.
     * @return The match document corresponding to the match ID, or null if not found.
     */
    public MatchDoc getMatchDocByMatchId(String matchId) {
        return matchRepository.findByMatchId(matchId);
    }    

    /**
     * Finds and returns the user using the request ID
     *
     * @param requestId Request ID of the match request of user.
     * @return The User object corresponding to the request ID, or null if not found.
     */
    public UserStateDoc getStateDocByRequestId(String requestId) {
        return userStateRepository.findByRequestId(requestId);
    }

    /**
     * Gets the status and matchId (if matched) for a user by request ID.
     *
     * @param requestId Request ID of the match request of user.
     * @return A map containing status and optionally matchId.
     */
    public Map<String, Object> getStatusWithMatchId(String requestId) {
        UserStateDoc stateDoc = userStateRepository.findByRequestId(requestId);
        if (stateDoc == null) return null;

        String status = stateDoc.getState().toLowerCase();
        String userId = stateDoc.getUserId();

        Map<String, Object> result = new HashMap<>();
        result.put("status", status);

        if (status.equals("matched")) {
            MatchDoc matchDoc = matchRepository.findActiveMatch(stateDoc.getUserId());
            if (matchDoc != null) {
                result.put("matchId", matchDoc.getMatchId());
                
                String peerUserId;
                if (matchDoc.getUser1().equals(userId)) {
                    peerUserId = matchDoc.getUser2();
                } else {
                    peerUserId = matchDoc.getUser1();
                }
                result.put("partnerId", peerUserId);
                
                String peerUserName = userStateRepository.findByUserId(peerUserId).getUserName();
                result.put("partnerName", peerUserName);
            }
        }

        return result;
    }
}