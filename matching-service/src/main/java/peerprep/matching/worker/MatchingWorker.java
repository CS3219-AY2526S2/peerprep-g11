package peerprep.matching.worker;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import peerprep.matching.infrastructure.redis.RedisMatchRepository;
import peerprep.matching.infrastructure.redis.RedisQueueRepository;
import peerprep.matching.service.MatchService;

import java.util.Arrays;
import java.util.List;
import java.util.UUID;

@Component
public class MatchingWorker {

    private static final Logger logger = LoggerFactory.getLogger(MatchingWorker.class);

    private static final List<String> DIFFICULTIES = Arrays.asList("Easy", "Medium", "Hard");
    private static final List<String[]> RELAXED_PAIRS = Arrays.asList(
            new String[]{"Easy", "Medium"},
            new String[]{"Medium", "Hard"}
    );

    private static final int STRICT_CAP = 10;
    private static final int RELAXED_CAP = 3;

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

        int totalStrict = 0;
        while (totalStrict < STRICT_CAP) {
            boolean madeMatch = false;

            for (String difficulty : DIFFICULTIES) {
                List<String> pair = redisMatchRepository.tryStrictMatch(topic, language, difficulty);
                if (pair != null && pair.size() >= 2) {
                    String user1 = pair.get(0);
                    String user2 = pair.get(1);

                    String matchId = UUID.randomUUID().toString();
                    matchService.createMatchFromPair(user1, user2, difficulty, topic, language, matchId);

                    totalStrict++;
                    madeMatch = true;
                }
            }

            if (!madeMatch) {
                break;
            }
        }

        int totalRelaxed = 0;
        while (totalRelaxed < RELAXED_CAP) {
            boolean madeMatch = false;

            for (String[] pair : RELAXED_PAIRS) {
                String diff1 = pair[0];
                String diff2 = pair[1];

                List<String> matchedPair = redisMatchRepository.tryRelaxedMatch(topic, language, diff1, diff2);
                if (matchedPair != null && matchedPair.size() >= 2) {
                    String user1 = matchedPair.get(0);
                    String user2 = matchedPair.get(1);

                    String matchId = UUID.randomUUID().toString();
                    matchService.createMatchFromPair(user1, user2, diff1, topic, language, matchId);

                    totalRelaxed++;
                    madeMatch = true;
                }
            }

            if (!madeMatch) {
                break;
            }
        }

        if (redisQueueRepository.hasUsersInScope(topic, language)) {
            redisQueueRepository.addToDirtyScopes(topic, language);
        }
    }
}
