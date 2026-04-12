package peerprep.matching.infrastructure.redis;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.script.DefaultRedisScript;
import org.springframework.stereotype.Repository;

import java.util.Arrays;
import java.util.List;

@Repository
public class RedisMatchRepository {

    private final RedisUserRepository redisUserRepository;
    private final DefaultRedisScript<List> tryStrictMatchScript;
    private final DefaultRedisScript<List> tryRelaxedMatchScript;
    private final DefaultRedisScript<Long> finalizeMatchScript;
    private final DefaultRedisScript<Long> addToPendingFinalizationScript;

    @Autowired
    public RedisMatchRepository(
            RedisUserRepository redisUserRepository,
            DefaultRedisScript<List> tryStrictMatchScript,
            DefaultRedisScript<List> tryRelaxedMatchScript,
            DefaultRedisScript<Long> finalizeMatchScript,
            DefaultRedisScript<Long> addToPendingFinalizationScript) {
        this.redisUserRepository = redisUserRepository;
        this.tryStrictMatchScript = tryStrictMatchScript;
        this.tryRelaxedMatchScript = tryRelaxedMatchScript;
        this.finalizeMatchScript = finalizeMatchScript;
        this.addToPendingFinalizationScript = addToPendingFinalizationScript;
    }

    public List<String> tryStrictMatch(String topic, String language, String difficulty) {
        List<String> keys = Arrays.asList(topic, language, difficulty);
        String timestamp = String.valueOf(System.currentTimeMillis());
        return redisUserRepository.executeScript(tryStrictMatchScript, keys, timestamp);
    }

    public List<String> tryRelaxedMatch(String topic, String language, String diff1, String diff2) {
        List<String> keys = Arrays.asList(topic, language, diff1, diff2);
        String timestamp = String.valueOf(System.currentTimeMillis());
        return redisUserRepository.executeScript(tryRelaxedMatchScript, keys, timestamp);
    }

    public void finalizeMatch(String user1, String user2) {
        List<String> keys = Arrays.asList(user1, user2);
        redisUserRepository.executeScript(finalizeMatchScript, keys);
    }

    public void addToPendingFinalization(String user1, String user2) {
        List<String> keys = Arrays.asList(user1, user2);
        redisUserRepository.executeScript(addToPendingFinalizationScript, keys);
    }

    public String popPendingFinalization() {
        return redisUserRepository.popFromSet("pendingFinalizations");
    }
}
