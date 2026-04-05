package peerprep.matching.repositories;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;
import peerprep.matching.documents.MatchDoc;

@Repository
public interface MatchRepository extends MongoRepository<MatchDoc, String> {
    MatchDoc findByMatchId(String matchId);

    @Query("{ '$or': [ { 'user1': ?0, 'status': 'active' }, { 'user2': ?0, 'status': 'active' } ] }")
    MatchDoc findActiveMatch(String userId);
}
