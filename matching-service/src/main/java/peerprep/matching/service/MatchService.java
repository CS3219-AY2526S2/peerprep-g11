package peerprep.matching.service;

import java.util.*;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.MongoTransactionManager;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;

import peerprep.matching.client.CollaborationServiceClient;
import peerprep.matching.client.QuestionServiceClient;
import peerprep.matching.documents.MatchDoc;
import peerprep.matching.documents.UserStateDoc;
import peerprep.matching.documents.WaitingQueueDoc;
import peerprep.matching.models.MatchNotificationRequest;
import peerprep.matching.models.MatchNotificationRequestDto;
import peerprep.matching.models.MatchRequest;
import peerprep.matching.models.Participant;
import peerprep.matching.models.UserState;
import peerprep.matching.repositories.MatchRepository;
import peerprep.matching.repositories.UserStateRepository;
import peerprep.matching.repositories.WaitingQueueRepository;

@Service
public class MatchService {

    private static final long TWO_MIN_IN_MS = 120000;

    private final Logger logger = LoggerFactory.getLogger(MatchService.class);

    private final WaitingQueueRepository waitingQueueRepository;
    private final UserStateRepository userStateRepository;
    private final MatchRepository matchRepository;
    private final TransactionTemplate transactionTemplate;
    private final QuestionServiceClient questionServiceClient;
    private final CollaborationServiceClient collaborationServiceClient;

    @Autowired
    public MatchService(
            WaitingQueueRepository waitingQueueRepository,
            UserStateRepository userStateRepository,
            MatchRepository matchRepository,
            MongoTransactionManager transactionManager,
            QuestionServiceClient questionServiceClient,
            CollaborationServiceClient collaborationServiceClient) {
        this.waitingQueueRepository = waitingQueueRepository;
        this.userStateRepository = userStateRepository;
        this.matchRepository = matchRepository;
        this.transactionTemplate = new TransactionTemplate(transactionManager);
        this.questionServiceClient = questionServiceClient;
        this.collaborationServiceClient = collaborationServiceClient;
    }

    /**
     * Adds user to the waiting pool under the selected category
     * and attempt to match users within the selected category.
     * Notify collaboration-service of the created matches, and roll back if notification fails.
     * Fully transactional to prevent race conditions with cancelMatch.
     * If user is already in the waiting pool or matched, an exception is thrown.
     *
     * @param req A MatchRequest object containing user id and category.
     * @return The request ID of the match request of user.
     * @throws RuntimeException If user is already in waiting pool or in an active match.
     */
    public String addUser(MatchRequest req) {
        if (!questionServiceClient.hasQuestionsByTopicAndDifficulty(req.getTopic(), req.getDifficulty())) {
            throw new InvalidMatchPreferenceException(
                    "No questions are available for the selected topic and difficulty.");
        }

        List<MatchNotificationRequest> createdMatches = transactionTemplate.execute(status -> {
            String userId = req.getUserId();
            String requestId = UUID.randomUUID().toString();
            req.setRequestId(requestId);
            String userName = req.getUserName();
            String category = req.getCategory();

            boolean success = userStateRepository.upsertIfNotActive(
                    userId, requestId, userName, category);
            if (!success) {
                throw new RuntimeException("User already in queue or matched");
            }

            waitingQueueRepository.createIfNotExists(category);
            waitingQueueRepository.enqueueUser(category, userId);

            return tryMatchTransactional(category);
        });

        if (createdMatches != null) {
            notifyCollaborationService(createdMatches);
        }

        return transactionTemplate.execute(status -> {
            return req.getRequestId();
        });
    }

    /**
     * Try to match users in a category inside a transaction. 
     * If match is found, assign a question and save the match document. 
     * 
     * @param category The category to match users in.
     * @return List of created match info for notification to collaboration-service.
     */
    private List<MatchNotificationRequest> tryMatchTransactional(String category) {
        List<MatchNotificationRequest> createdMatches = new ArrayList<>();

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

            stateDoc1.setState(UserState.MATCH_FOUND.name());
            stateDoc2.setState(UserState.MATCH_FOUND.name());
            userStateRepository.save(stateDoc1);
            userStateRepository.save(stateDoc2);

            String matchId = UUID.randomUUID().toString();
            MatchDoc matchDoc = new MatchDoc(matchId, userId1, userId2);
            
            String[] categoryParts = category.split("\\|");
            String topic = categoryParts[0];
            String difficulty = categoryParts[1];
            String language = categoryParts[2];
            String questionSlug = questionServiceClient.getQuestionByTopicAndDifficulty(topic, difficulty);
            if (questionSlug == null || questionSlug.isBlank()) {
                throw new IllegalStateException("Unable to assign a question for category " + category);
            }
            matchDoc.setQuestionSlug(questionSlug);
            
            matchRepository.save(matchDoc);

            createdMatches.add(new MatchNotificationRequest(matchId, userId1, userId2, questionSlug, language, category));
        }

        return createdMatches;
    }

    private void notifyCollaborationService(List<MatchNotificationRequest> createdMatches) {
        for (MatchNotificationRequest request : createdMatches) {
            try {
                MatchNotificationRequestDto dto = toDto(request);
                collaborationServiceClient.notifyMatchCreated(dto);
                userStateRepository.updateState(request.getUserId1(), UserState.MATCHED);
                userStateRepository.updateState(request.getUserId2(), UserState.MATCHED);
            } catch (Exception e) {
                logger.error("Failed to notify collaboration-service for match {}: {}",
                        request.getMatchId(), e.getMessage());
                rollbackMatch(request);
            }
        }
    }

    private void rollbackMatch(MatchNotificationRequest request) {
        transactionTemplate.execute(status -> {
            try {
                MatchDoc matchDoc = matchRepository.findByMatchId(request.getMatchId());
                if (matchDoc != null) {
                    matchRepository.delete(matchDoc);
                }

                UserStateDoc stateDoc1 = userStateRepository.findByUserId(request.getUserId1());
                UserStateDoc stateDoc2 = userStateRepository.findByUserId(request.getUserId2());

                if (stateDoc1 != null) {
                    stateDoc1.setState(UserState.PENDING.name());
                    userStateRepository.save(stateDoc1);
                    waitingQueueRepository.createIfNotExists(request.getCategory());
                    waitingQueueRepository.enqueueUser(request.getCategory(), request.getUserId1());
                }

                if (stateDoc2 != null) {
                    stateDoc2.setState(UserState.PENDING.name());
                    userStateRepository.save(stateDoc2);
                    waitingQueueRepository.createIfNotExists(request.getCategory());
                    waitingQueueRepository.enqueueUser(request.getCategory(), request.getUserId2());
                }

                logger.info("Rolled back match {} and re-queued users {} and {}",
                        request.getMatchId(), request.getUserId1(), request.getUserId2());
            } catch (Exception e) {
                logger.error("Failed to rollback match {}: {}", request.getMatchId(), e.getMessage());
                status.setRollbackOnly();
            }

            return null;
        });
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

            if (!stateDoc.getState().equals(UserState.PENDING.name())) {
                return false;
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
        return transactionTemplate.execute(status -> {
            MatchDoc matchDoc = matchRepository.findByMatchId(matchId);
            if (matchDoc == null || !matchDoc.getStatus().equals("active")) return false;

            matchDoc.setStatus("ended");
            matchDoc.setEndedAt(new Date());
            matchRepository.save(matchDoc);

            userStateRepository.deleteByUserId(matchDoc.getUser1());
            userStateRepository.deleteByUserId(matchDoc.getUser2());

            return true;
        });
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
                
                result.put("questionSlug", matchDoc.getQuestionSlug());
            }
        }

        return result;
    }

    private MatchNotificationRequestDto toDto(MatchNotificationRequest request) {
        List<Participant> participants = List.of(
            toParticipant(request.getUserId1()),
            toParticipant(request.getUserId2())
        );

        MatchNotificationRequestDto dto = new MatchNotificationRequestDto();
        dto.setSessionId(request.getMatchId());
        dto.setQuestionId(request.getQuestionSlug());
        dto.setSelectedLanguage(request.getLanguage());
        dto.setParticipants(participants);

        return dto;
    }

    private Participant toParticipant(String userId) {
        Participant participant = new Participant(userId);
        UserStateDoc stateDoc = userStateRepository.findByUserId(userId);
        String userName = stateDoc != null ? stateDoc.getUserName() : null;
        participant.setUsername(userName != null && !userName.isBlank() ? userName : userId);
        return participant;
    }
}
