package peerprep.matching.repositories;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import peerprep.matching.documents.MatchDoc;

@Repository
public interface MatchRepository extends MongoRepository<MatchDoc, String> {
    MatchDoc findByMatchId(String matchId);
}
