package peerprep.matching.repositories;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import peerprep.matching.documents.WaitingQueueDoc;

@Repository
public interface WaitingQueueRepository extends MongoRepository<WaitingQueueDoc, String> {
    WaitingQueueDoc findByCategory(String category);
}
