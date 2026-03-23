package peerprep.matching.models;

public class MatchRequest {
    private String requestId = null;
    private String userId = null;
    private String topic;
    private String difficulty;
    private String language;

    public void setRequestId(String requestId) {
        this.requestId = requestId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public String getRequestId() {
        return this.requestId;
    }

    public String getUserId() {
        return this.userId;
    }

    public String getTopic() {
        return this.topic;
    }

    public String getDifficulty() {
        return this.difficulty;
    }

    public String getLanguage() {
        return this.language;
    }
}