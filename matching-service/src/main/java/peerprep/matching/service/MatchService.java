package peerprep.matching.service;

import peerprep.matching.models.User;
import peerprep.matching.models.MatchRequest;
import peerprep.matching.models.MatchResult;
import org.springframework.stereotype.Service;

import java.util.*;
        import java.util.concurrent.*;

@Service
public class MatchService {

    private static final int TWO_MIN_IN_MS = 120000;

    // category → queue
    private final Map<String, Queue<User>> waitingPool = new ConcurrentHashMap<>();

    // userId → state
    private final Map<String, UserState> userStates = new ConcurrentHashMap<>();

    // userId → match result
    private final Map<String, MatchResult> matches = new ConcurrentHashMap<>();

    // requestId → User
    private final Map<String, User> requestIdMap = new ConcurrentHashMap<>();

    // category → lock for synchronized matching
    private final Map<String, Object> locks = new ConcurrentHashMap<>();

    private Object getLock(String key) {
        locks.putIfAbsent(key, new Object());
        return locks.get(key);
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
     * @throws RuntimeException If user is already in waiting pool or in an active match.
     */
    public User addUser(MatchRequest req) {
        String userId = req.getUserId();
        UserState prev = userStates.getOrDefault(userId, UserState.IDLE);

        if (prev == UserState.PENDING) throw new RuntimeException("User already in queue");
        if (prev == UserState.MATCHED) throw new RuntimeException("User already matched");

        userStates.put(userId, UserState.PENDING);

        String requestId = UUID.randomUUID().toString();
        req.setRequestId(requestId);

        User user = new User(userId, req.getTopic(), req.getDifficulty(), req.getLanguage(), requestId);
        String key = user.getKey();
        waitingPool.putIfAbsent(key, new ConcurrentLinkedQueue<>());
        Queue<User> queue = waitingPool.get(key);

        synchronized (getLock(key)) {
            if (userStates.get(userId) != UserState.PENDING) return null;
            queue.add(user);
            requestIdMap.put(requestId, user);
            tryMatch(key);
        }

        return user;
    }

    /**
     * Removes user from the waiting pool.
     *
     * @param requestId Request ID of the match request of user.
     */
    public boolean cancelMatch(String requestId) {
        User user = requestIdMap.get(requestId);
        if (user == null) return false;

        userStates.put(user.getUserId(), UserState.IDLE);
        Queue<User> queue = waitingPool.get(user.getKey());

        synchronized (getLock(user.getKey())) {
            queue.remove(user);
        }

        requestIdMap.remove(requestId);
        return true;
    }

    /**
     * Returns the state of the user (waiting / matched / idle / timed out).
     *
     * @param requestId Request ID of the match request of user.
     * @return Current state of the user.
     */
    public String getStatus(String requestId) {
        User user = requestIdMap.get(requestId);
        if (user == null) return null;

        return userStates.getOrDefault(user.getUserId(), UserState.IDLE).name().toLowerCase();
    }

    /**
     * Reset state of the user to idle.
     *
     * @param requestId Request ID of the match request of user.
     */
    public boolean endSession(String requestId) {
        User user = requestIdMap.get(requestId);
        if (user == null) return false;

        String userId = user.getUserId();
        if (userStates.get(userId) != UserState.MATCHED) return false;

        MatchResult match = matches.remove(userId);
        if (match == null) return false;

        userStates.put(userId, UserState.IDLE);

        String otherUserId = match.getOtherUser(userId);
        if (otherUserId != null) {
            matches.remove(otherUserId);
            userStates.put(otherUserId, UserState.IDLE);
        }

        requestIdMap.remove(requestId);
        return true;
    }

    private void tryMatch(String key) {
        Queue<User> queue = waitingPool.get(key);

        while (true) {
            User u1 = queue.poll();
            User u2 = queue.poll();

            if (u1 == null || u2 == null) {
                if (u1 != null) queue.add(u1);
                if (u2 != null) queue.add(u2);
                break;
            }

            if (userStates.get(u1.getUserId()) != UserState.PENDING ||
                    userStates.get(u2.getUserId()) != UserState.PENDING) {
                if (userStates.get(u1.getUserId()) == UserState.PENDING) queue.add(u1);
                if (userStates.get(u2.getUserId()) == UserState.PENDING) queue.add(u2);
                continue;
            }

            userStates.put(u1.getUserId(), UserState.MATCHED);
            userStates.put(u2.getUserId(), UserState.MATCHED);

            MatchResult match = new MatchResult(u1.getUserId(), u2.getUserId());
            matches.put(u1.getUserId(), match);
            matches.put(u2.getUserId(), match);
        }
    }

    /**
     * Removes all users that have entered the waiting pool more than two min ago.
     */
    public void removeTimeoutUsers() {
        long now = System.currentTimeMillis();

        for (Map.Entry<String, Queue<User>> entry : waitingPool.entrySet()) {
            String key = entry.getKey();
            Queue<User> queue = entry.getValue();

            synchronized (getLock(key)) {
                queue.removeIf(user -> {
                    boolean timeout = (now - user.getJoinedAt()) > TWO_MIN_IN_MS;
                    if (timeout) userStates.put(user.getUserId(), UserState.TIMED_OUT);
                    return timeout;
                });
            }
        }
    }

    /**
     * Finds and returns the user ID using the request ID
     *
     * @param requestId Request ID of the match request of user.
     * @return User ID of the user.
     */
    public User getUserByRequestId(String requestId) {
        return requestIdMap.get(requestId);
    }
}