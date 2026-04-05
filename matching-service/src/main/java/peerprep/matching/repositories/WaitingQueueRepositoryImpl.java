package peerprep.matching.repositories;

import java.util.ArrayList;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.data.mongodb.core.FindAndModifyOptions;
import org.springframework.stereotype.Repository;

import peerprep.matching.documents.WaitingQueueDoc;

@Repository
public class WaitingQueueRepositoryImpl implements WaitingQueueRepositoryCustom {

    @Autowired
    private MongoTemplate mongoTemplate;

    @Override
    public WaitingQueueDoc createIfNotExists(String category) {
        Query query = Query.query(Criteria.where("category").is(category));
        WaitingQueueDoc doc = mongoTemplate.findOne(query, WaitingQueueDoc.class);
        if (doc == null) {
            doc = new WaitingQueueDoc(category, new ArrayList<>());
            mongoTemplate.save(doc);
        }
        return doc;
    }

    @Override
    public void enqueueUser(String category, String userId) {
        Query query = Query.query(Criteria.where("category").is(category));
        Update update = new Update().push("userIds", userId);
        mongoTemplate.updateFirst(query, update, WaitingQueueDoc.class);
    }

    @Override
    public String dequeueUserAndReturn(String category) {
        Query query = Query.query(Criteria.where("category").is(category));
        Update update = new Update().pop("userIds", Update.Position.FIRST);
        FindAndModifyOptions options = FindAndModifyOptions.options().returnNew(false);

        WaitingQueueDoc doc = mongoTemplate.findAndModify(query, update, options, WaitingQueueDoc.class);
        return (doc != null && !doc.getUserIds().isEmpty()) ? doc.getUserIds().get(0) : null;
    }

    @Override
    public void removeUser(String category, String userId) {
        Query query = Query.query(Criteria.where("category").is(category));
        Update update = new Update().pull("userIds", userId);
        mongoTemplate.updateFirst(query, update, WaitingQueueDoc.class);
    }

    @Override
    public void enqueueFront(String category, String userId) {
        Query query = Query.query(Criteria.where("category").is(category));
        Update update = new Update().push("userIds").atPosition(0).value(userId);
        mongoTemplate.updateFirst(query, update, WaitingQueueDoc.class);
    }
}