package peerprep.matching.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import peerprep.matching.models.User;
import peerprep.matching.models.MatchRequest;
import peerprep.matching.service.JwtService;
import peerprep.matching.service.MatchService;

@RestController
@RequestMapping("/match")
public class MatchController {

    @Autowired
    private MatchService matchService;

    @Autowired
    private JwtService jwtService;

    // --- Start a new match ---
    @PostMapping
    public ResponseEntity<?> startMatch(@RequestBody MatchRequest req,
                                        @RequestHeader("Authorization") String authHeader,
                                        @CookieValue(value = "token", required = false) String cookieToken
                                        ) {

        String jwtUserId = extractUserId(authHeader, cookieToken);
        if (jwtUserId == null) return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));

        req.setUserId(jwtUserId);
        User user = matchService.addUser(req);

        return ResponseEntity.status(201).body(Map.of(
                "message", "Matching started",
                "requestId", user.getRequestId()
        ));
    }

    // --- Cancel match ---
    @DeleteMapping("/{requestId}")
    public ResponseEntity<?> cancelMatch(@PathVariable String requestId,
                                         @RequestHeader("Authorization") String authHeader,
                                         @CookieValue(value = "token", required = false) String cookieToken
                                        ) {

        String jwtUserId = extractUserId(authHeader, cookieToken);
        if (jwtUserId == null) return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));

        User user = matchService.getUserByRequestId(requestId);
        if (user == null || !user.getUserId().equals(jwtUserId))
            return ResponseEntity.status(403).body(Map.of("error", "Forbidden"));

        boolean cancelled = matchService.cancelMatch(requestId);
        if (cancelled) return ResponseEntity.ok(Map.of("message", "Match cancelled"));
        return ResponseEntity.status(404).body(Map.of("error", "Match not found"));
    }

    // --- Get match status ---
    @GetMapping("/{requestId}")
    public ResponseEntity<?> getMatchStatus(@PathVariable String requestId,
                                            @RequestHeader("Authorization") String authHeader,
                                            @CookieValue(value = "token", required = false) String cookieToken
                                            ) {
        String jwtUserId = extractUserId(authHeader, cookieToken);
        if (jwtUserId == null) return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));

        User user = matchService.getUserByRequestId(requestId);
        if (user == null || !user.getUserId().equals(jwtUserId))
            return ResponseEntity.status(403).body(Map.of("error", "Forbidden"));

        String status = matchService.getStatus(requestId);
        return ResponseEntity.ok(Map.of(
                "requestId", requestId,
                "status", status
        ));
    }

    // --- End match session ---
    @PatchMapping("/{requestId}")
    public ResponseEntity<?> endMatch(@PathVariable String requestId,
                                      @RequestHeader("Authorization") String authHeader,
                                      @CookieValue(value = "token", required = false) String cookieToken
                                    ) {
        String jwtUserId = extractUserId(authHeader, cookieToken);
        if (jwtUserId == null) return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));

        User user = matchService.getUserByRequestId(requestId);
        if (user == null || !user.getUserId().equals(jwtUserId))
            return ResponseEntity.status(403).body(Map.of("error", "Forbidden"));

        boolean ended = matchService.endSession(requestId);
        if (ended) return ResponseEntity.ok(Map.of("message", "Match session ended"));
        return ResponseEntity.status(404).body(Map.of("error", "No active match found"));
    }

    private String extractUserId(String authHeader, String cookieToken) {
        String token;
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            token = cookieToken;
        } else {
            token = authHeader.substring(7);
        }
        try {
            return jwtService.extractUserId(token);
        } catch (Exception e) {
            return null;
        }
    }
}