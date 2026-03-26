package peerprep.matching.documents;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.util.Date;

@Document(collection = "user_states")
public class UserStateDoc {
    @Id
    private String id;

    private String userId;
    private String requestId;
    private String state;  // IDLE, PENDING, MATCHED, TIMED_OUT
    private Date createdAt;
    private Date expiresAt;  // TTL index

    public UserStateDoc() {
    }

    public UserStateDoc(String userId, String requestId, String state) {
        this.userId = userId;
        this.requestId = requestId;
        this.state = state;
        this.createdAt = new Date();
        this.expiresAt = new Date(System.currentTimeMillis() + 24 * 60 * 60 * 1000);  // 24 hours
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public String getRequestId() {
        return requestId;
    }

    public void setRequestId(String requestId) {
        this.requestId = requestId;
    }

    public String getState() {
        return state;
    }

    public void setState(String state) {
        this.state = state;
    }

    public Date getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Date createdAt) {
        this.createdAt = createdAt;
    }

    public Date getExpiresAt() {
        return expiresAt;
    }

    public void setExpiresAt(Date expiresAt) {
        this.expiresAt = expiresAt;
    }
}
