package peerprep.matching.worker;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import peerprep.matching.service.MatchService;

@Component
public class TimeoutScheduler {

    private final MatchService matchService;

    public TimeoutScheduler(MatchService matchService) {
        this.matchService = matchService;
    }

    @Scheduled(fixedRate = 5000)
    public void cleanup() {
        this.matchService.removeTimeoutUsers();
    }
}