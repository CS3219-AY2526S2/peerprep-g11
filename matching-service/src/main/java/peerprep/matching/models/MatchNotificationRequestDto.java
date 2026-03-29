package peerprep.matching.models;

import java.util.List;
import peerprep.matching.models.MatchNotificationRequest;
import peerprep.matching.models.Participant;

public class MatchNotificationRequestDto {
    private String sessionId;
    private String questionId;
    private String selectedLanguage;
    private List<Participant> participants;

    public MatchNotificationRequestDto() {}

    public MatchNotificationRequestDto(String sessionId, String questionId, String selectedLanguage, List<Participant> participants) {
        this.sessionId = sessionId;
        this.questionId = questionId;
        this.selectedLanguage = selectedLanguage;
        this.participants = participants;
    }

    public String getSessionId() {
        return sessionId;
    }

    public void setSessionId(String sessionId) {
        this.sessionId = sessionId;
    }

    public String getQuestionId() {
        return questionId;
    }

    public void setQuestionId(String questionId) {
        this.questionId = questionId;
    }

    public String getSelectedLanguage() {
        return selectedLanguage;
    }

    public void setSelectedLanguage(String selectedLanguage) {
        this.selectedLanguage = selectedLanguage;
    }

    public List<Participant> getParticipants() {
        return participants;
    }

    public void setParticipants(List<Participant> participants) {
        this.participants = participants;
    }
}