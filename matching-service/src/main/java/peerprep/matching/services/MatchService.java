package peerprep.matching.services;

import java.util.*;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import peerprep.matching.clients.CollaborationServiceClient;
import peerprep.matching.clients.QuestionServiceClient;
import peerprep.matching.infrastructure.mongo.document.MatchDoc;
import peerprep.matching.infrastructure.mongo.repository.MatchRepository;
import peerprep.matching.infrastructure.redis.RedisMatchRepository;
import peerprep.matching.infrastructure.redis.RedisQueueRepository;
import peerprep.matching.infrastructure.redis.RedisUserRepository;
import peerprep.matching.domain.exception.InvalidMatchPreferenceException;
import peerprep.matching.domain.exception.MatchRequestConflictException;
import peerprep.matching.domain.UserState;
import peerprep.matching.dto.MatchNotificationRequestDto;
import peerprep.matching.dto.MatchRequest;
import peerprep.matching.dto.Participant;

@Service
public class MatchService {

    private static final long TWO_MIN_IN_MS = 120000;

    private final Logger logger = LoggerFactory.getLogger(MatchService.class);

    private final RedisUserRepository redisUserRepository;
    private final RedisQueueRepository redisQueueRepository;
    private final RedisMatchRepository redisMatchRepository;
    private final MatchRepository matchRepository;
    private final QuestionServiceClient questionServiceClient;
    private final CollaborationServiceClient collaborationServiceClient;

    @Autowired
    public MatchService(
            RedisUserRepository redisUserRepository,
            RedisQueueRepository redisQueueRepository,
            RedisMatchRepository redisMatchRepository,
            MatchRepository matchRepository,
            QuestionServiceClient questionServiceClient,
            CollaborationServiceClient collaborationServiceClient) {
        this.redisUserRepository = redisUserRepository;
        this.redisQueueRepository = redisQueueRepository;
        this.redisMatchRepository = redisMatchRepository;
        this.matchRepository = matchRepository;
        this.questionServiceClient = questionServiceClient;
        this.collaborationServiceClient = collaborationServiceClient;
    }

    /**
     * Adds user to the matching queue for the specified category.
     * 
     * The user is marked as {@code PENDING} and added to both the matching 
     * queue and the timeout management structure. The scope of the match is 
     * also marked as dirty to trigger matching attempts.
     *
     * @param req A MatchRequest object containing user id and category.
     * @return The request ID of the match request of user.
     * @throws InvalidMatchPreferenceException If there are no questions for the specified category.
     * @throws MatchRequestConflictException If user is already in waiting pool or in an active match.
     */
    public String addUser(MatchRequest req) {
        if (!questionServiceClient.hasQuestionsByTopicAndDifficulty(req.getTopic(), req.getDifficulty())) {
            throw new InvalidMatchPreferenceException(
                    "No questions are available for the selected topic and difficulty.");
        }

        String userId = req.getUserId();
        String requestId = UUID.randomUUID().toString();
        String topic = req.getTopic();
        String language = req.getLanguage();
        String difficulty = req.getDifficulty();
        String userName = req.getUserName();

        boolean success = redisUserRepository.addUserAtomic(userId, requestId, userName, topic, language, difficulty);
        if (!success) {
            String existingState = redisUserRepository.getUserState(userId);
            MatchRequestConflictException conflict = getConflictExceptionForState(existingState);
            throw conflict;
        }

        return requestId;
    }

    private MatchRequestConflictException getConflictExceptionForState(String state) {
        if (UserState.PENDING.name().equals(state)) {
            return new MatchRequestConflictException(
                    "ALREADY_IN_QUEUE",
                    "You are already in the matching queue.");
        }

        if (UserState.MATCH_FOUND.name().equals(state)
                || UserState.MATCHED.name().equals(state)) {
            return new MatchRequestConflictException(
                    "ALREADY_IN_SESSION",
                    "You are already in a session.");
        }

        return new MatchRequestConflictException(
                "ADD_USER_FAILED",
                "Please try again.");
    }

    /**
     * Try to create a match between two users. 
     * 
     * Get a question for the match from question service, notify 
     * collaboration service about the new match, and save the match details. 
     * If any of these steps fail, rollback the match and put users back to 
     * the queue. Both users are marked as matched only after all steps are 
     * successful.
     * 
     * @param user1 The first user to match.
     * @param user2 The second user to match.
     * @param difficulty The difficulty level of the match.
     * @param topic The topic of the match.
     * @param language The programming language of the match.
     * @param matchId The ID of the match.
     */
    public void createMatchFromPair(String user1, String user2, String difficulty,
                                     String topic, String language, String matchId) {
        String questionSlug = questionServiceClient.getQuestionByTopicAndDifficulty(topic, difficulty);
        if (questionSlug == null || questionSlug.isBlank()) {
            throw new IllegalStateException("Unable to assign a question for category " + topic + "|" + difficulty + "|" + language);
        }

        MatchDoc matchDoc = new MatchDoc(matchId, user1, user2);
        matchDoc.setQuestionSlug(questionSlug);

        boolean mongoSaved = saveMatchWithRetry(matchDoc);
        if (!mongoSaved) {
            rollbackMatch(user1, user2, topic, language, difficulty, matchId);
            return;
        }

        boolean collabNotified = notifyCollaborationServiceWithRetry(matchId, user1, user2, questionSlug, language);
        if (!collabNotified) {
            rollbackMatch(user1, user2, topic, language, difficulty, matchId);
            return;
        }

        redisUserRepository.setCollabNotified(matchId, true);
        redisUserRepository.setUserMatchId(user1, matchId);
        redisUserRepository.setUserMatchId(user2, matchId);

        try {
            redisMatchRepository.finalizeMatch(user1, user2);
        } catch (Exception e) {
            logger.warn("Failed to finalize match {} via Lua, scheduling background retry: {}", matchId, e.getMessage());
            redisMatchRepository.addToPendingFinalization(user1, user2);
        }
    }

    private boolean saveMatchWithRetry(MatchDoc matchDoc) {
        for (int i = 0; i < 50; i++) {
            try {
                matchRepository.save(matchDoc);
                return true;
            } catch (Exception e) {
                logger.warn("Failed to save match doc, retry {}/50: {}", i + 1, e.getMessage());
                try {
                    Thread.sleep(100);
                } catch (InterruptedException ie) {
                    Thread.currentThread().interrupt();
                    return false;
                }
            }
        }
        logger.error("Failed to save match doc after 50 retries");
        return false;
    }

    private boolean notifyCollaborationServiceWithRetry(String matchId, String user1, String user2,
                                                        String questionSlug, String language) {

        String userName1 = redisUserRepository.getUserName(user1);
        String userName2 = redisUserRepository.getUserName(user2);
        List<Participant> participants = List.of(
                new Participant(user1, userName1),
                new Participant(user2, userName2)
        );

        MatchNotificationRequestDto dto = new MatchNotificationRequestDto();
        dto.setSessionId(matchId);
        dto.setQuestionId(questionSlug);
        dto.setSelectedLanguage(language);
        dto.setParticipants(participants);

        for (int i = 0; i < 50; i++) {
            try {
                collaborationServiceClient.notifyMatchCreated(dto);
                return true;
            } catch (Exception e) {
                logger.warn("Failed to notify collab service for match {}, retry {}/50: {}", matchId, i + 1, e.getMessage());
                try {
                    Thread.sleep(100);
                } catch (InterruptedException ie) {
                    Thread.currentThread().interrupt();
                    return false;
                }
            }
        }
        logger.error("Failed to notify collab service after 50 retries for match {}", matchId);
        return false;
    }

    private void rollbackMatch(String user1, String user2, String topic, String language,
                              String difficulty, String matchId) {
        try {
            MatchDoc matchDoc = matchRepository.findByMatchId(matchId);
            if (matchDoc != null) {
                matchRepository.delete(matchDoc);
            }
        } catch (Exception e) {
            logger.error("Failed to delete match doc during rollback: {}", e.getMessage());
        }

        redisUserRepository.setUserState(user1, UserState.PENDING.name());
        redisUserRepository.setUserState(user2, UserState.PENDING.name());

        Long joinTime1 = redisUserRepository.getJoinTime(user1);
        if (joinTime1 == null) {
            joinTime1 = System.currentTimeMillis();
        }
        Long joinTime2 = redisUserRepository.getJoinTime(user2);
        if (joinTime2 == null) {
            joinTime2 = System.currentTimeMillis();
        }

        redisQueueRepository.requeueUser(user1, topic, language, difficulty, joinTime1);
        redisQueueRepository.requeueUser(user2, topic, language, difficulty, joinTime2);
        redisQueueRepository.addToDirtyScopes(topic, language);

    }

    /**
     * Rollback a match by matchId. This is used when finalizing a match 
     * fails. 
     * 
     * Mark the involved users as @code {PENDING}, put users back to the 
     * queue, and delete the match doc.
     * 
     * @param matchId The ID of the match.
     */
    public void rollbackMatchByMatchId(String matchId) {
        MatchDoc matchDoc = matchRepository.findByMatchId(matchId);
        if (matchDoc == null) {
            logger.warn("No match doc found for matchId {} during rollback", matchId);
            return;
        }

        String user1 = matchDoc.getUser1();
        String user2 = matchDoc.getUser2();

        redisUserRepository.setUserState(user1, UserState.PENDING.name());
        redisUserRepository.setUserState(user2, UserState.PENDING.name());

        String topic = redisUserRepository.getUserTopic(user1);
        if (topic == null) {
            topic = redisUserRepository.getUserTopic(user2);
        }
        String language = redisUserRepository.getUserLanguage(user1);
        if (language == null) {
            language = redisUserRepository.getUserLanguage(user2);
        }
        String difficulty1 = redisUserRepository.getUserDifficulty(user1);
        String difficulty2 = redisUserRepository.getUserDifficulty(user2);

        if (topic != null && language != null && difficulty1 != null && difficulty2 != null) {
            try {
                matchRepository.delete(matchDoc);
            } catch (Exception e) {
                logger.error("Failed to delete match doc during rollback: {}", e.getMessage());
            }

            Long joinTime1 = redisUserRepository.getJoinTime(user1);
            if (joinTime1 == null) {
                joinTime1 = System.currentTimeMillis();
            }
            Long joinTime2 = redisUserRepository.getJoinTime(user2);
            if (joinTime2 == null) {
                joinTime2 = System.currentTimeMillis();
            }

            redisQueueRepository.requeueUser(user1, topic, language, difficulty1, joinTime1);
            redisQueueRepository.requeueUser(user2, topic, language, difficulty2, joinTime2);
            redisQueueRepository.addToDirtyScopes(topic, language);
            return;
        }

        try {
            matchRepository.delete(matchDoc);
        } catch (Exception e) {
            logger.error("Failed to delete match doc during rollback: {}", e.getMessage());
        }
    }

    /**
     * Cancel a match request.
     * 
     * The user is removed from the matching queue and timeout management 
     * structure, and user information is deleted.
     * 
     * @param requestId Request ID of the match request of user.
     * @return true if user removed successfully, false if user was not found or user state is not @code {PENDING}.
     */
    public boolean cancelMatch(String requestId) {
        String userId = redisUserRepository.getUserIdForRequest(requestId);
        if (userId == null) {
            return false;
        }

        String state = redisUserRepository.getUserState(userId);
        if (state == null || !state.equals(UserState.PENDING.name())) {
            return false;
        }

        String topic = redisUserRepository.getUserTopic(userId);
        String language = redisUserRepository.getUserLanguage(userId);
        String difficulty = redisUserRepository.getUserDifficulty(userId);
        if (topic != null && language != null && difficulty != null) {
            redisQueueRepository.removeUserFromAllQueues(topic, language, difficulty, userId);
        }

        redisUserRepository.removeUserState(userId);
        return true;
    }

    /**
     * Ends an active match session.
     *  
     * The match is marked as ended and involved users are removed from the 
     * system. 
     *
     * @param matchId Match ID of the match session.
     * @return true if session ended successfully, false otherwise.
     */
    public boolean endSession(String matchId) {
        MatchDoc matchDoc = matchRepository.findByMatchId(matchId);
        if (matchDoc == null || !matchDoc.getStatus().equals("active")) {
            return false;
        }

        matchDoc.setStatus("ended");
        matchDoc.setEndedAt(new Date());
        matchRepository.save(matchDoc);

        redisUserRepository.removeUserState(matchDoc.getUser1());
        redisUserRepository.removeUserState(matchDoc.getUser2());

        return true;
    }

    /**
     * Ends matching attempt for users that have been waiting for more than 
     * two minutes.
     * 
     * Remove users from the matching queue and timeout management structure, 
     * and mark them as timed out. This is triggered by a scheduled task that 
     * runs every 5 seconds.
     */
    public void removeTimeoutUsers() {
        Set<String> expiredUserIds = redisQueueRepository.getExpiredTimeoutUsers();

        for (String userId : expiredUserIds) {
            redisQueueRepository.removeFromTimeoutQueue(userId);

            String state = redisUserRepository.getUserState(userId);
            if (!UserState.PENDING.name().equals(state)) {
                continue;
            }

            String topic = redisUserRepository.getUserTopic(userId);
            String language = redisUserRepository.getUserLanguage(userId);
            String difficulty = redisUserRepository.getUserDifficulty(userId);
            if (topic != null && language != null && difficulty != null) {
                redisQueueRepository.removeUserFromAllQueues(topic, language, difficulty, userId);
            }
            redisUserRepository.setUserState(userId, UserState.TIMED_OUT.name());
        }
    }

    public MatchDoc getMatchDocByMatchId(String matchId) {
        return matchRepository.findByMatchId(matchId);
    }

    public Map<String, String> getUserStateMapByRequestId(String requestId) {
        String userId = redisUserRepository.getUserIdForRequest(requestId);
        if (userId == null) {
            return null;
        }
        return redisUserRepository.getUserStateMap(userId);
    }

    /**
     * Returns the state of the user (idle / pending / match found / matched / timed out).
     * If user is marked as @code {MATCHED}, also returns the match ID, 
     * partner's user ID and name, and question slug.
     *
     * @param requestId Request ID of the match request of user.
     * @return Current state of the user.
     */
    public Map<String, Object> getStatus(String requestId) {
        String userId = redisUserRepository.getUserIdForRequest(requestId);
        if (userId == null) {
            return null;
        }

        String state = redisUserRepository.getUserState(userId);
        if (state == null) {
            return null;
        }

        Map<String, Object> result = new HashMap<>();
        result.put("status", state.toLowerCase());

        if (UserState.MATCHED.name().equals(state)) {
            MatchDoc matchDoc = matchRepository.findActiveMatch(userId);
            if (matchDoc != null) {
                result.put("matchId", matchDoc.getMatchId());

                String peerUserId;
                if (matchDoc.getUser1().equals(userId)) {
                    peerUserId = matchDoc.getUser2();
                } else {
                    peerUserId = matchDoc.getUser1();
                }
                result.put("partnerId", peerUserId);

                Map<String, String> peerState = redisUserRepository.getUserStateMap(peerUserId);
                String peerUserName = peerState != null ? peerState.get("userName") : null;
                result.put("partnerName", peerUserName != null && !peerUserName.isBlank() ? peerUserName : peerUserId);

                result.put("questionSlug", matchDoc.getQuestionSlug());
            }
        }

        return result;
    }
}
