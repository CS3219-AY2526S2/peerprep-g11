package peerprep.matching.repositories;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Repository;
import com.mongodb.client.result.UpdateResult;
import org.springframework.dao.DuplicateKeyException;

import peerprep.matching.documents.UserStateDoc;
import peerprep.matching.models.UserState;

@Repository
public class UserStateRepositoryImpl implements UserStateRepositoryCustom {
    @Autowired
    private MongoTemplate mongoTemplate;

    @Override 
    public void updateState(String userId, UserState newState) {
        Query query = Query.query(Criteria.where("userId").is(userId));
        Update update = new Update().set("state", newState.name());
        UpdateResult result = mongoTemplate.updateFirst(query, update, UserStateDoc.class);
        if (result.getMatchedCount() == 0) {
            throw new RuntimeException("Cannot update state for non-existent user: " + userId);
        }
    }

    @Override
    public boolean upsertIfNotActive(
            String userId,
            String requestId,
            String userName,
            String category
    ) {
        Query query = Query.query(
                Criteria.where("userId").is(userId)
                        .and("state").nin(UserState.PENDING.name(), UserState.MATCH_FOUND.name(), UserState.MATCHED.name())
        );

        Update update = new Update()
                .set("requestId", requestId)
                .set("userName", userName)
                .set("state", UserState.PENDING.name())
                .set("category", category)
                .set("createdAt", System.currentTimeMillis());

        try {
            UpdateResult result = mongoTemplate.upsert(query, update, UserStateDoc.class);
            return result.getMatchedCount() > 0 || result.getUpsertedId() != null;
        } catch (DuplicateKeyException e) {
            return false;
        }
    }
}
