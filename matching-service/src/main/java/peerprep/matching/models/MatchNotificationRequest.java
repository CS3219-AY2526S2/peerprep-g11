package peerprep.matching.models;

public class MatchNotificationRequest {
    private String matchId;
    private String userId1;
    private String userId2;
    private String questionSlug;
    private String language;
    private String category;

    public MatchNotificationRequest(String matchId, String userId1, String userId2,
                                     String questionSlug, String language, String category) {
        this.matchId = matchId;
        this.userId1 = userId1;
        this.userId2 = userId2;
        this.questionSlug = questionSlug;
        this.language = language;
        this.category = category;
    }

    public String getMatchId() {
        return matchId;
    }

    public void setMatchId(String matchId) {
        this.matchId = matchId;
    }

    public String getUserId1() {
        return userId1;
    }

    public void setUserId1(String userId1) {
        this.userId1 = userId1;
    }

    public String getUserId2() {
        return userId2;
    }

    public void setUserId2(String userId2) {
        this.userId2 = userId2;
    }

    public String getQuestionSlug() {
        return questionSlug;
    }

    public void setQuestionSlug(String questionSlug) {
        this.questionSlug = questionSlug;
    }

    public String getLanguage() {
        return language;
    }

    public void setLanguage(String language) {
        this.language = language;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }
}
