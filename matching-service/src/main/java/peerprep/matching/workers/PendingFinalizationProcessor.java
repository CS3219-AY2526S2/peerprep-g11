package peerprep.matching.workers;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import peerprep.matching.infrastructure.redis.RedisMatchRepository;

@Component
public class PendingFinalizationProcessor {

    private static final Logger logger = LoggerFactory.getLogger(PendingFinalizationProcessor.class);

    private final RedisMatchRepository redisMatchRepository;

    @Autowired
    public PendingFinalizationProcessor(RedisMatchRepository redisMatchRepository) {
        this.redisMatchRepository = redisMatchRepository;
    }

    @Scheduled(fixedRate = 1000)
    public void processPendingFinalizations() {
        String pair = redisMatchRepository.popPendingFinalization();
        if (pair == null) {
            return;
        }

        String[] parts = pair.split(":");
        if (parts.length != 2) {
            logger.warn("Invalid pending finalization pair format: {}", pair);
            return;
        }

        String user1 = parts[0];
        String user2 = parts[1];

        try {
            redisMatchRepository.finalizeMatch(user1, user2);
            logger.info("Successfully finalized match for users {} and {}", user1, user2);
        } catch (Exception e) {
            logger.warn("Failed to finalize match for users {} and {}, re-queuing: {}", user1, user2, e.getMessage());
            redisMatchRepository.addToPendingFinalization(user1, user2);
        }
    }
}
