package peerprep.matching.infrastructure.redis;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Repository;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Set;

import peerprep.matching.models.Difficulty;

@Repository
public class RedisQueueRepository {

    private static final String QUEUE_PREFIX = "queue:";
    private static final String TIMEOUT_QUEUE = "timeout:queue";
    private static final String DIRTY_SCOPES = "dirtyScopes";

    private static final long TWO_MIN_IN_MS = 120000;
    private static final List<Difficulty> DIFFICULTIES = Arrays.asList(Difficulty.values());

    private final RedisTemplate<String, Object> redisTemplate;

    @Autowired
    public RedisQueueRepository(RedisTemplate<String, Object> redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    public void addUserToQueue(String topic, String language, String difficulty, String userId) {
        long now = System.currentTimeMillis();
        String queueKey = QUEUE_PREFIX + topic + ":" + language + ":" + difficulty;
        redisTemplate.opsForZSet().add(queueKey, userId, now);
    }

    public void addUserToTimeoutQueue(String userId, long expiryTime) {
        redisTemplate.opsForZSet().add(TIMEOUT_QUEUE, userId, expiryTime);
    }

    public void addToDirtyScopes(String topic, String language) {
        redisTemplate.opsForSet().add(DIRTY_SCOPES, topic + ":" + language);
    }

    public String popDirtyScope() {
        return (String) redisTemplate.opsForSet().pop(DIRTY_SCOPES);
    }

    public void removeFromQueue(String topic, String language, String difficulty, String userId) {
        String queueKey = QUEUE_PREFIX + topic + ":" + language + ":" + difficulty;
        redisTemplate.opsForZSet().remove(queueKey, userId);
    }

    public void removeFromTimeoutQueue(String userId) {
        redisTemplate.opsForZSet().remove(TIMEOUT_QUEUE, userId);
    }

    public void removeUserFromAllQueues(String topic, String language, String difficulty, String userId) {
        String queueKey = QUEUE_PREFIX + topic + ":" + language + ":" + difficulty;
        redisTemplate.opsForZSet().remove(queueKey, userId);
        redisTemplate.opsForZSet().remove(TIMEOUT_QUEUE, userId);
    }

    public long getQueueSize(String topic, String language, String difficulty) {
        String queueKey = QUEUE_PREFIX + topic + ":" + language + ":" + difficulty;
        Long size = redisTemplate.opsForZSet().size(queueKey);
        return size != null ? size : 0;
    }

    public boolean hasUsersInScope(String topic, String language) {
        for (Difficulty difficulty : DIFFICULTIES) {
            if (getQueueSize(topic, language, difficulty.getLabel()) > 0) {
                return true;
            }
        }
        return false;
    }

    @SuppressWarnings("unchecked")
    public Set<String> getExpiredTimeoutUsers() {
        long now = System.currentTimeMillis();
        Set<Object> expired = redisTemplate.opsForZSet().rangeByScore(TIMEOUT_QUEUE, 0, now);
        if (expired == null) return Collections.emptySet();
        Set<String> result = new java.util.HashSet<>();
        for (Object o : expired) {
            result.add(String.valueOf(o));
        }
        return result;
    }

    public void requeueUser(String userId, String topic, String language, String difficulty, long joinTime) {
        long now = System.currentTimeMillis();
        String queueKey = QUEUE_PREFIX + topic + ":" + language + ":" + difficulty;
        redisTemplate.opsForZSet().add(queueKey, userId, now);

        long expiry = joinTime + TWO_MIN_IN_MS;
        redisTemplate.opsForZSet().add(TIMEOUT_QUEUE, userId, expiry);
    }
}
