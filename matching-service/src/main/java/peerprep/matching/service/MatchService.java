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

    // category → lock
    private final Map<String, Object> locks = new ConcurrentHashMap<>();

    private Object getLock(String key) {
        locks.putIfAbsent(key, new Object());
        return locks.get(key);
    }

    public enum UserState {
        IDLE,
        WAITING,
        MATCHED
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
    public void addUser(MatchRequest req) {
        String userId = req.userId;
        UserState prev = userStates.getOrDefault(userId, UserState.IDLE);

        if (prev == UserState.WAITING) {
            throw new RuntimeException("User already in queue");
        }

        if (prev == UserState.MATCHED) {
            throw new RuntimeException("User already matched");
        }

        userStates.put(userId, UserState.WAITING);
        User user = new User(req.userId, req.topic, req.difficulty, req.language);
        String key = user.getKey();
        waitingPool.putIfAbsent(key, new ConcurrentLinkedQueue<>());
        Queue<User> queue = waitingPool.get(key);

        synchronized (getLock(key)) {
            if (userStates.get(userId) != UserState.WAITING) return;

            queue.add(user);
            tryMatch(key);
        }
    }

    /**
     * Removes user from the waiting pool.
     *
     * @param userId User ID of the user to be removed.
     */
    public void cancel(String userId) {
        if (userStates.get(userId) != UserState.WAITING) return;

        userStates.put(userId, UserState.IDLE);

        for (Map.Entry<String, Queue<User>> entry : waitingPool.entrySet()) {
            String key = entry.getKey();

            synchronized (getLock(key)) {
                entry.getValue().removeIf(u -> u.userId.equals(userId));
            }
        }
    }

    /**
     * Returns the state of the user (waiting / matched / idle).
     *
     * @param userId User ID of user.
     * @return Current state of the user.
     */
    public String getStatus(String userId) {
        return userStates.getOrDefault(userId, UserState.IDLE)
                .name().toLowerCase();
    }

    private void tryMatch(String key) {
        Queue<User> queue = waitingPool.get(key);

        while (true) {
            User u1 = queue.poll();
            User u2 = queue.poll();

            if (u1 == null || u2 == null) {
                if (u1 != null) {
                    queue.add(u1);
                }
                break;
            }

            // check both still waiting
            if (userStates.get(u1.userId) != UserState.WAITING ||
                    userStates.get(u2.userId) != UserState.WAITING) {

                if (userStates.get(u1.userId) == UserState.WAITING) queue.add(u1);
                if (userStates.get(u2.userId) == UserState.WAITING) queue.add(u2);
                continue;
            }

            // WAITING → MATCHED
            userStates.put(u1.userId, UserState.MATCHED);
            userStates.put(u2.userId, UserState.MATCHED);

            MatchResult match = new MatchResult(u1.userId, u2.userId);

            matches.put(u1.userId, match);
            matches.put(u2.userId, match);
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
                    boolean timeout = (now - user.joinedAt) > TWO_MIN_IN_MS;

                    if (timeout) {
                        userStates.put(user.userId, UserState.IDLE);
                    }

                    return timeout;
                });
            }
        }
    }

    /**
     * Reset state of the user to idle.
     *
     * @param userId User ID of user.
     */
    public boolean endSession(String userId) {
        if (userStates.get(userId) != UserState.MATCHED) {
            return false;
        }

        MatchResult match = matches.remove(userId);
        if (match == null) {
            return false;
        }
        userStates.put(userId, UserState.IDLE);

        String otherUserId = match.getOtherUser(userId);
        if (otherUserId != null) {
            matches.remove(otherUserId);
            userStates.put(otherUserId, UserState.IDLE);
        }

        return true;
    }
}
