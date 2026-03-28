package peerprep.matching.documents;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import java.util.List;
import java.util.Date;

@Document(collection = "waiting_queues")
public class WaitingQueueDoc {
    @Id
    private String id;

    @Indexed(unique = true)
    private String category;  // "topic|difficulty|language"
    
    private List<String> userIds;  // List of user IDs in the queue
    private Date createdAt;

    public WaitingQueueDoc() {
    }

    public WaitingQueueDoc(String category, List<String> userIds) {
        this.category = category;
        this.userIds = userIds;
        this.createdAt = new Date();
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public List<String> getUserIds() {
        return userIds;
    }

    public void setUserIds(List<String> userIds) {
        this.userIds = userIds;
    }

    public Date getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Date createdAt) {
        this.createdAt = createdAt;
    }
}
