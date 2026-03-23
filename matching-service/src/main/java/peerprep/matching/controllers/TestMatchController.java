package peerprep.matching.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import peerprep.matching.models.MatchRequest;
import peerprep.matching.models.User;
import peerprep.matching.service.MatchService;

import java.util.Map;

@RestController
@RequestMapping("/test/match")
public class TestMatchController {

    @Autowired
    private MatchService matchService;

    // --- Start a match without JWT ---
    @PostMapping
    public ResponseEntity<?> startMatch(@RequestBody MatchRequest req) {
        // For testing, userId comes from the request body directly
        if (req.getUserId() == null || req.getUserId().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "userId is required"));
        }

        User user = matchService.addUser(req);
        return ResponseEntity.status(201).body(Map.of(
                "message", "Matching started (test mode)",
                "requestId", user.getRequestId()
        ));
    }

    // --- Cancel a match without JWT ---
    @DeleteMapping("/{requestId}")
    public ResponseEntity<?> cancelMatch(@PathVariable String requestId) {
        boolean cancelled = matchService.cancelMatch(requestId);
        if (cancelled) return ResponseEntity.ok(Map.of("message", "Match cancelled (test mode)"));
        return ResponseEntity.status(404).body(Map.of("error", "Match not found"));
    }

    // --- Get match status without JWT ---
    @GetMapping("/{requestId}")
    public ResponseEntity<?> getMatchStatus(@PathVariable String requestId) {
        String status = matchService.getStatus(requestId);
        if (status == null) return ResponseEntity.status(404).body(Map.of("error", "Match not found"));
        return ResponseEntity.ok(Map.of("requestId", requestId, "status", status));
    }

    // --- End match session without JWT ---
    @PatchMapping("/{requestId}")
    public ResponseEntity<?> endMatch(@PathVariable String requestId) {
        boolean ended = matchService.endSession(requestId);
        if (ended) return ResponseEntity.ok(Map.of("message", "Match session ended (test mode)"));
        return ResponseEntity.status(404).body(Map.of("error", "No active match found"));
    }
}
