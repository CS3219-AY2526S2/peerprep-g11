package peerprep.matching.models;

public class MatchResult {
    public String user1;
    public String user2;
    public String matchId;

    public MatchResult(String u1, String u2, String matchId) {
        this.user1 = u1;
        this.user2 = u2;
        this.matchId = matchId;
    }

    public String getUser1() {
        return user1;
    }

    public String getUser2() {
        return user2;
    }

    public String getOtherUser(String userId) {
        if (this.user1.equals(userId)) {
            return this.user2;
        } else if (this.user2.equals(userId)) {
            return this.user1;
        }
        return null;
    }
}