package peerprep.matching.service;

import peerprep.matching.models.MatchRequest;
import peerprep.matching.repositories.WaitingQueueRepository;
import peerprep.matching.repositories.MatchRepository;
import peerprep.matching.repositories.UserStateRepository;
import peerprep.matching.documents.WaitingQueueDoc;
import peerprep.matching.documents.MatchDoc;
import peerprep.matching.documents.UserStateDoc;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Autowired;

import java.util.*;
        import java.util.concurrent.*;

@Service
public class MatchService {

    private static final long TWO_MIN_IN_MS = 120000;

    @Autowired
    private WaitingQueueRepository waitingQueueRepository;

    @Autowired
    private MatchRepository matchRepository;

    @Autowired
    private UserStateRepository userStateRepository;

    // category → lock for synchronized matching
    private final Map<String, Object> locks = new ConcurrentHashMap<>();

    private Object getLock(String category) {
        locks.putIfAbsent(category, new Object());
        return locks.get(category);
    }

    public enum UserState {
        IDLE,
        PENDING,
        MATCHED,
        TIMED_OUT
    }

    /**
     * Adds user to the waiting pool under the selected category (topic|difficulty|language)
     * and attempt to match users within the selected category.
     * If user is already in the waiting pool, an exception is thrown.
     * If user is currently in an active match, an exception is thrown.
     *
     * @param req A MatchRequest object containing user id, topic, difficulty and language.
     * @return The request ID of the match request of user.
     * @throws RuntimeException If user is already in waiting pool or in an active match.
     */
    public String addUser(MatchRequest req) {
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

        synchronized (getLock(category)) {
            WaitingQueueDoc queueDoc = waitingQueueRepository.createIfNotExists(category);
            waitingQueueRepository.enqueueUser(category, userId);
            tryMatch(category);
        }

        return requestId;
    }

    /**
     * Removes user from the waiting pool.
     *
     * @param requestId Request ID of the match request of user.
     * @return true if user removed successfully, false if user was not found.
     */
    public boolean cancelMatch(String requestId) {
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
        synchronized (getLock(category)) {
            waitingQueueRepository.removeUser(category, userId);
        }

        userStateRepository.deleteByUserId(stateDoc.getUserId());
        return true;
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

    private void tryMatch(String category) {
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

            Boolean state1Valid = stateDoc1 != null && stateDoc1.getState().equals(UserState.PENDING.name());
            Boolean state2Valid = stateDoc2 != null && stateDoc2.getState().equals(UserState.PENDING.name());

            if (!state1Valid || !state2Valid) {
                if (state1Valid) {
                    waitingQueueRepository.enqueueFront(category, userId1);
                }
                if (state2Valid) {
                    waitingQueueRepository.enqueueFront(category, userId2);
                }
                continue;
            }

            stateDoc1.setState(UserState.MATCHED.name());
            userStateRepository.save(stateDoc1);
            stateDoc2.setState(UserState.MATCHED.name());
            userStateRepository.save(stateDoc2);

            String matchId = UUID.randomUUID().toString();
            MatchDoc matchDoc = new MatchDoc(matchId, userId1, userId2);
            matchRepository.save(matchDoc);
        }
    }

    /**
     * Removes all users that have entered the waiting pool more than two min ago.
     */
    public void removeTimeoutUsers() {
        long now = System.currentTimeMillis();

        for (WaitingQueueDoc queueDoc : waitingQueueRepository.findAll()) {
            String category = queueDoc.getCategory();
            synchronized (getLock(category)) {
                List<String> userIds = queueDoc.getUserIds();

                for (String userId : userIds) {
                    UserStateDoc stateDoc = userStateRepository.findByUserId(userId);
                    if (stateDoc == null || !stateDoc.getState().equals(UserState.PENDING.name())) continue;

                    long joinedAt = stateDoc.getCreatedAt().getTime();
                    if ((now - joinedAt) < TWO_MIN_IN_MS) continue;

                    stateDoc.setState(UserState.TIMED_OUT.name());
                    waitingQueueRepository.removeUser(category, userId);
                    userStateRepository.save(stateDoc);
                }
            }
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