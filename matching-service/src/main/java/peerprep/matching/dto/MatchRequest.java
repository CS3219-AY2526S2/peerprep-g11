package peerprep.matching.dto;

public class MatchRequest {
    private String requestId = null;
    private String userId = null;
    private String userName = null;
    private String topic;
    private String difficulty;
    private String language;

    public String getRequestId() {
        return this.requestId;
    }

    public void setRequestId(String requestId) {
        this.requestId = requestId;
    }

    public String getUserId() {
        return this.userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public String getUserName() {
        return this.userName;
    }

    public void setUserName(String userName) {
        this.userName = userName;
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

    public String getCategory() {
        return this.topic + "|" + this.difficulty + "|" + this.language;
    }
}