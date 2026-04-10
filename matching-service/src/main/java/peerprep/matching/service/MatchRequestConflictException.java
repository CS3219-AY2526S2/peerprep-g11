package peerprep.matching.service;

public class MatchRequestConflictException extends RuntimeException {
    private final String reason;

    public MatchRequestConflictException(String reason, String message) {
        super(message);
        this.reason = reason;
    }

    public String getReason() {
        return reason;
    }
}
