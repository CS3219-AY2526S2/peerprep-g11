package peerprep.matching.infrastructure.redis;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.script.DefaultRedisScript;
import org.springframework.stereotype.Repository;

import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Repository
public class RedisUserRepository {

    private static final String USER_STATE_PREFIX = "userState:";
    private static final String REQUEST_USER_PREFIX = "requestUser:";
    private static final String USER_REQUEST_PREFIX = "userRequest:";

    private final RedisTemplate<String, Object> redisTemplate;
    private final DefaultRedisScript<Long> addUserScript;
    private final DefaultRedisScript<Long> rollbackMatchScript;

    @Autowired
    public RedisUserRepository(RedisTemplate<String, Object> redisTemplate,
                             DefaultRedisScript<Long> addUserScript,
                             DefaultRedisScript<Long> rollbackMatchScript) {
        this.redisTemplate = redisTemplate;
        this.addUserScript = addUserScript;
        this.rollbackMatchScript = rollbackMatchScript;
    }

    public String getUserState(String userId) {
        return (String) redisTemplate.opsForHash().get(USER_STATE_PREFIX + userId, "state");
    }

    public Long getJoinTime(String userId) {
        String value = (String) redisTemplate.opsForHash()
                .get(USER_STATE_PREFIX + userId, "joinTime");

        return value != null ? Long.parseLong(value) : null;
    }

    public String getUserName(String userId) {
        return (String) redisTemplate.opsForHash().get(USER_STATE_PREFIX + userId, "userName");
    }

    public Map<String, String> getUserStateMap(String userId) {
        Map<Object, Object> raw = redisTemplate.opsForHash().entries(USER_STATE_PREFIX + userId);
        Map<String, String> result = new HashMap<>();
        raw.forEach((k, v) -> result.put(String.valueOf(k), String.valueOf(v)));
        return result;
    }

    public String getRequestIdForUser(String userId) {
        return (String) redisTemplate.opsForValue().get(USER_REQUEST_PREFIX + userId);
    }

    public String getUserIdForRequest(String requestId) {
        return (String) redisTemplate.opsForValue().get(REQUEST_USER_PREFIX + requestId);
    }

    public void saveUserState(String userId, String requestId, String userName,
                              String topic, String language, String difficulty) {
        Map<String, String> userState = new HashMap<>();
        userState.put("userId", userId);
        userState.put("requestId", requestId);
        userState.put("userName", userName);
        userState.put("state", "PENDING");
        userState.put("topic", topic);
        userState.put("language", language);
        userState.put("difficulty", difficulty);
        userState.put("joinTime", String.valueOf(System.currentTimeMillis()));

        redisTemplate.opsForHash().putAll(USER_STATE_PREFIX + userId, userState);
        redisTemplate.opsForValue().set(REQUEST_USER_PREFIX + requestId, userId);
        redisTemplate.opsForValue().set(USER_REQUEST_PREFIX + userId, requestId);
    }

    public boolean addUserAtomic(String userId, String requestId, String userName,
                                String topic, String language, String difficulty) {
        List<String> keys = Arrays.asList(
                userId, requestId, userName, topic, language, difficulty);
        long now = System.currentTimeMillis();
        long expiryTime = now + 120000;
        Long result = redisTemplate.execute(addUserScript, keys,
                String.valueOf(now), String.valueOf(expiryTime));
        return result != null && result == 1L;
    }

    public void setUserState(String userId, String state) {
        redisTemplate.opsForHash().put(USER_STATE_PREFIX + userId, "state", state);
    }

    public void removeUserState(String userId) {
        String requestId = getRequestIdForUser(userId);
        if (requestId != null) {
            redisTemplate.delete(REQUEST_USER_PREFIX + requestId);
        }
        redisTemplate.delete(USER_REQUEST_PREFIX + userId);
        redisTemplate.delete(USER_STATE_PREFIX + userId);
    }

    public String getUserTopic(String userId) {
        String topic = (String) redisTemplate.opsForHash().get(USER_STATE_PREFIX + userId, "topic");
        return topic;
    }

    public String getUserLanguage(String userId) {
        String language = (String) redisTemplate.opsForHash().get(USER_STATE_PREFIX + userId, "language");
        return language;
    }

    public String getUserDifficulty(String userId) {
        String difficulty = (String) redisTemplate.opsForHash().get(USER_STATE_PREFIX + userId, "difficulty");
        return difficulty;
    }

    public void setMatchFoundAt(String userId, long timestamp) {
        redisTemplate.opsForValue().set("matchFoundAt:" + userId, String.valueOf(timestamp));
    }

    public Long getMatchFoundAt(String userId) {
        String value = (String) redisTemplate.opsForValue().get("matchFoundAt:" + userId);
        return value != null ? Long.parseLong(value) : null;
    }

    public void deleteMatchFoundAt(String userId) {
        redisTemplate.delete("matchFoundAt:" + userId);
    }

    public void setUserMatchId(String userId, String matchId) {
        redisTemplate.opsForValue().set("userMatch:" + userId, matchId);
    }

    public String getUserMatchId(String userId) {
        return (String) redisTemplate.opsForValue().get("userMatch:" + userId);
    }

    public void deleteUserMatchId(String userId) {
        redisTemplate.delete("userMatch:" + userId);
    }

    public void setCollabNotified(String matchId, boolean notified) {
        redisTemplate.opsForValue().set("collabNotified:" + matchId, notified ? "true" : "false");
    }

    public Boolean wasCollabNotified(String matchId) {
        String value = (String) redisTemplate.opsForValue().get("collabNotified:" + matchId);
        return value != null && value.equals("true");
    }

    public void deleteCollabNotified(String matchId) {
        redisTemplate.delete("collabNotified:" + matchId);
    }

    public void addToMatchFoundUsers(String userId) {
        redisTemplate.opsForSet().add("matchFoundUsers", userId);
    }

    public void removeFromMatchFoundUsers(String userId) {
        redisTemplate.opsForSet().remove("matchFoundUsers", userId);
    }

    public String popFromSet(String key) {
        return (String) redisTemplate.opsForSet().pop(key);
    }

    @SuppressWarnings("unchecked")
    public <T> T executeScript(org.springframework.data.redis.core.script.RedisScript<T> script,
                               List<String> keys, Object... args) {
        return (T) redisTemplate.execute(script, keys, args);
    }

    public void rollbackMatch(String user1, String user2) {
        List<String> keys = Arrays.asList(user1, user2);
        redisTemplate.execute(rollbackMatchScript, keys);
    }
}
