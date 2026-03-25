package peerprep.matching.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import peerprep.matching.models.User;
import peerprep.matching.models.MatchRequest;
import peerprep.matching.models.MatchResult;
import peerprep.matching.service.JwtService;
import peerprep.matching.service.MatchService;

@RestController
@RequestMapping("/matches")
public class MatchesController {

    @Autowired
    private MatchService matchService;

    @Autowired
    private JwtService jwtService;

    // --- End match session ---
    @DeleteMapping("/{matchId}")
    public ResponseEntity<?> endMatch(@PathVariable String matchId,
                                      @RequestHeader("Authorization") String authHeader,
                                      @CookieValue(value = "token", required = false) String cookieToken
                                    ) {
        String jwtUserId = extractUserId(authHeader, cookieToken);
        if (jwtUserId == null) return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));

        MatchResult match = matchService.getMatchResultByMatchId(matchId);
        if (match == null) {
            return ResponseEntity.status(404).body(Map.of("error", "Match not found"));
        }
        boolean isUserInMatch = match.getUser1().equals(jwtUserId) || match.getUser2().equals(jwtUserId);
        if (!isUserInMatch) {
            return ResponseEntity.status(403).body(Map.of("error", "Forbidden"));
        }

        boolean ended = matchService.endSession(matchId);
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