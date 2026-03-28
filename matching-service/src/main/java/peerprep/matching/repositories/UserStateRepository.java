package peerprep.matching.repositories;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import peerprep.matching.documents.UserStateDoc;

@Repository
public interface UserStateRepository extends MongoRepository<UserStateDoc, String>, UserStateRepositoryCustom {
    UserStateDoc findByUserId(String userId);
    UserStateDoc findByRequestId(String requestId);
    void deleteByUserId(String userId);
}
