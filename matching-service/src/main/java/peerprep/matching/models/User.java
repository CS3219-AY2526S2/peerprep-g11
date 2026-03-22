package peerprep.matching.models;

public class User {
    public String userId;
    public String topic;
    public String difficulty;
    public String language;
    public long joinedAt;

    public User(String userId, String topic, String difficulty, String language) {
        this.userId = userId;
        this.topic = topic;
        this.difficulty = difficulty;
        this.language = language;
        this.joinedAt = System.currentTimeMillis();
    }

    public String getKey() {
        return topic + "|" + difficulty + "|" + language;
    }
}