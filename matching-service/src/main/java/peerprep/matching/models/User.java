package peerprep.matching.models;

public class User {
    private final String userId;
    private final String topic;
    private final String difficulty;
    private final String language;
    private final long joinedAt;
    private final String requestId;

    public User(String userId, String topic, String difficulty, String language, String requestId) {
        this.userId = userId;
        this.topic = topic;
        this.difficulty = difficulty;
        this.language = language;
        this.joinedAt = System.currentTimeMillis();
        this.requestId = requestId;
    }

    public String getUserId() {
        return this.userId;
    }

    public long getJoinedAt() {
        return this.joinedAt;
    }

    public String getRequestId() {
        return this.requestId;
    }

    public String getKey() {
        return topic + "|" + difficulty + "|" + language;
    }
}