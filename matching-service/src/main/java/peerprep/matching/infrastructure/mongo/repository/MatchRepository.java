package peerprep.matching.infrastructure.mongo.repository;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;
import peerprep.matching.infrastructure.mongo.document.MatchDoc;

@Repository
public interface MatchRepository extends MongoRepository<MatchDoc, String> {
    MatchDoc findByMatchId(String matchId);

    @Query("{ '$or': [ { 'user1': ?0, 'status': 'active' }, { 'user2': ?0, 'status': 'active' } ] }")
    MatchDoc findActiveMatch(String userId);
}
