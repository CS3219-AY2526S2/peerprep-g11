package peerprep.matching.controllers;

import peerprep.matching.models.MatchRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import peerprep.matching.service.MatchService;

@RestController
@RequestMapping("/match")
public class MatchController {

    @Autowired
    private MatchService matchService;

    @PostMapping("/start")
    public String start(@RequestBody MatchRequest req) {
        matchService.addUser(req);
        return "Matching started";
    }

    @PostMapping("/cancel")
    public String cancel(@RequestParam String userId) {
        matchService.cancel(userId);
        return "Cancelled";
    }

    @GetMapping("/status")
    public String status(@RequestParam String userId) {
        return matchService.getStatus(userId);
    }

    @PostMapping("/end")
    public String endSession(@RequestParam String userId) {
        boolean ended = matchService.endSession(userId);
        if (ended) {
            return "Match session ended for user: " + userId;
        } else {
            return "No active match found for user: " + userId;
        }
    }
}