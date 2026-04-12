package peerprep.matching.worker;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import peerprep.matching.infrastructure.redis.RedisQueueRepository;
import peerprep.matching.infrastructure.redis.RedisUserRepository;
import peerprep.matching.service.MatchService;

import java.util.Set;

@Component
public class StuckMatchFoundHandler {

    private static final Logger logger = LoggerFactory.getLogger(StuckMatchFoundHandler.class);
    private static final long STUCK_THRESHOLD_MS = 15000;

    private final RedisUserRepository redisUserRepository;
    private final RedisQueueRepository redisQueueRepository;
    private final MatchService matchService;
    private final RedisTemplate<String, Object> redisTemplate;

    @Autowired
    public StuckMatchFoundHandler(RedisUserRepository redisUserRepository,
                                  RedisQueueRepository redisQueueRepository,
                                  MatchService matchService,
                                  RedisTemplate<String, Object> redisTemplate) {
        this.redisUserRepository = redisUserRepository;
        this.redisQueueRepository = redisQueueRepository;
        this.matchService = matchService;
        this.redisTemplate = redisTemplate;
    }

    @Scheduled(fixedRate = 5000)
    public void processStuckMatches() {
        Set<Object> userIds = redisTemplate.opsForSet().members("matchFoundUsers");
        if (userIds == null || userIds.isEmpty()) {
            return;
        }

        long now = System.currentTimeMillis();
        long threshold = now - STUCK_THRESHOLD_MS;

        for (Object userIdObj : userIds) {
            String userId = String.valueOf(userIdObj);

            String state = redisUserRepository.getUserState(userId);
            if (state == null || !state.equals("MATCH_FOUND")) {
                redisUserRepository.removeFromMatchFoundUsers(userId);
                continue;
            }

            Long matchFoundAt = redisUserRepository.getMatchFoundAt(userId);
            if (matchFoundAt == null) {
                continue;
            }

            if (matchFoundAt < threshold) {
                String matchId = redisUserRepository.getUserMatchId(userId);
                Boolean collabNotified = matchId != null ? redisUserRepository.wasCollabNotified(matchId) : null;

                if (collabNotified == null || !collabNotified) {
                    logger.warn("User {} stuck at MATCH_FOUND for >15s without collab notification, rolling back", userId);
                    rollbackStuckMatch(userId, matchId);
                }
            }
        }
    }

    private void rollbackStuckMatch(String userId, String matchId) {
        redisUserRepository.removeFromMatchFoundUsers(userId);
        Long joinTime = redisUserRepository.getJoinTime(userId);
        if (joinTime == null) {
            joinTime = System.currentTimeMillis();
        }

        if (matchId != null) {
            matchService.rollbackMatchByMatchId(matchId);
        } else {
            String topic = redisUserRepository.getUserTopic(userId);
            String language = redisUserRepository.getUserLanguage(userId);
            String difficulty = redisUserRepository.getUserDifficulty(userId);
            if (topic != null && language != null && difficulty != null) {
                redisQueueRepository.requeueUser(userId, topic, language, difficulty, joinTime);
                redisQueueRepository.addToDirtyScopes(topic, language);
            }
        }

        redisUserRepository.deleteMatchFoundAt(userId);
        redisUserRepository.deleteUserMatchId(userId);
    }
}
