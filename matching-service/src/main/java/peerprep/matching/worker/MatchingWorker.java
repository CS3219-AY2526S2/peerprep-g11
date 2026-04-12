package peerprep.matching.worker;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import peerprep.matching.infrastructure.redis.RedisMatchRepository;
import peerprep.matching.infrastructure.redis.RedisQueueRepository;
import peerprep.matching.models.Difficulty;
import peerprep.matching.models.DifficultyPair;
import peerprep.matching.service.MatchService;

import java.util.List;
import java.util.UUID;

@Component
public class MatchingWorker {

    private static final Logger logger = LoggerFactory.getLogger(MatchingWorker.class);

    private static final List<Difficulty> DIFFICULTIES = List.of(Difficulty.values());
    private static final List<DifficultyPair> RELAXED_PAIRS = Difficulty.getAdjacentPairs();

    private static final int STRICT_ROUNDS_LIMIT = 10;
    private static final int RELAXED_ROUNDS_LIMIT = 3;

    private final RedisMatchRepository redisMatchRepository;
    private final RedisQueueRepository redisQueueRepository;
    private final MatchService matchService;

    @Autowired
    public MatchingWorker(RedisMatchRepository redisMatchRepository,
                         RedisQueueRepository redisQueueRepository,
                         MatchService matchService) {
        this.redisMatchRepository = redisMatchRepository;
        this.redisQueueRepository = redisQueueRepository;
        this.matchService = matchService;
    }

    @Scheduled(fixedRate = 100)
    public void process() {
        String scope = redisQueueRepository.popDirtyScope();
        if (scope == null) {
            return;
        }

        try {
            processScope(scope);
        } catch (Exception e) {
            logger.error("Error processing scope {}: {}", scope, e.getMessage(), e);
            String[] parts = scope.split(":");
            if (parts.length >= 2) {
                redisQueueRepository.addToDirtyScopes(parts[0], parts[1]);
            }
        }
    }

    private void processScope(String scope) {
        String[] parts = scope.split(":");
        String topic = parts[0];
        String language = parts[1];

        for (int i = 0; i < STRICT_ROUNDS_LIMIT; i++) {
            boolean madeMatch = tryStrictRound(topic, language);
            if (!madeMatch) {
                break;
            }
        }

        for (int i = 0; i < RELAXED_ROUNDS_LIMIT; i++) {
            boolean madeMatch = tryRelaxedRound(topic, language);
            if (!madeMatch) {
                break;
            }
        }

        if (redisQueueRepository.hasUsersInScope(topic, language)) {
            redisQueueRepository.addToDirtyScopes(topic, language);
        }
    }

    private boolean tryStrictRound(String topic, String language) {
        boolean madeMatch = false;

        for (Difficulty difficulty : DIFFICULTIES) {
            String diffLabel = difficulty.getLabel();
            List<String> pair = redisMatchRepository.tryStrictMatch(topic, language, diffLabel);
            if (pair != null && pair.size() >= 2) {
                String user1 = pair.get(0);
                String user2 = pair.get(1);

                String matchId = UUID.randomUUID().toString();
                matchService.createMatchFromPair(user1, user2,  diffLabel, topic, language, matchId);
                madeMatch = true;
            }
        }

        return madeMatch;
    }

    private boolean tryRelaxedRound(String topic, String language) {
        boolean madeMatch = false;

        for (DifficultyPair pair : RELAXED_PAIRS) {
            String diffLabel1 = pair.first().getLabel();
            String diffLabel2 = pair.second().getLabel();

            List<String> matchedPair = redisMatchRepository.tryRelaxedMatch(topic, language, diffLabel1, diffLabel2);
            if (matchedPair != null && matchedPair.size() >= 2) {
                String user1 = matchedPair.get(0);
                String user2 = matchedPair.get(1);

                String matchId = UUID.randomUUID().toString();
                matchService.createMatchFromPair(user1, user2, diffLabel1, topic, language, matchId);

                madeMatch = true;
            }
        }

        return madeMatch;
    }
}
