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

@Repository
public class UserStateRepositoryImpl implements UserStateRepositoryCustom {
    @Autowired
    private MongoTemplate mongoTemplate;

    @Override
    public boolean upsertIfNotPendingOrMatched(
            String userId,
            String requestId,
            String userName,
            String category
    ) {
        Query query = Query.query(
                Criteria.where("userId").is(userId)
                        .and("state").nin("PENDING", "MATCHED")
        );

        Update update = new Update()
                .set("requestId", requestId)
                .set("userName", userName)
                .set("state", "PENDING")
                .set("category", category);

        try {
            UpdateResult result = mongoTemplate.upsert(query, update, UserStateDoc.class);
            return result.getMatchedCount() > 0 || result.getUpsertedId() != null;
        } catch (DuplicateKeyException e) {
            return false;
        }
    }
}
