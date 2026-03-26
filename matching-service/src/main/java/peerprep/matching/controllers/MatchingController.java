package peerprep.matching.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import peerprep.matching.models.MatchRequest;
import peerprep.matching.service.JwtService;
import peerprep.matching.service.MatchService;
import peerprep.matching.documents.UserStateDoc;

@RestController
@RequestMapping("/matching/requests")
public class MatchingController {

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
        UserStateDoc stateDoc = matchService.addUser(req);

        return ResponseEntity.status(201).body(Map.of(
                "message", "Matching started",
                "requestId", stateDoc.getRequestId()
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

        UserStateDoc stateDoc = matchService.getStateDocByRequestId(requestId);
        if (stateDoc == null || !stateDoc.getUserId().equals(jwtUserId))
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

        UserStateDoc stateDoc = matchService.getStateDocByRequestId(requestId);
        if (stateDoc == null || !stateDoc.getUserId().equals(jwtUserId))
            return ResponseEntity.status(403).body(Map.of("error", "Forbidden"));

        Map<String, Object> statusInfo = matchService.getStatusWithMatchId(requestId);
        if (statusInfo == null) {
            return ResponseEntity.status(404).body(Map.of("error", "Status not found"));
        }
        statusInfo.put("requestId", requestId);
        return ResponseEntity.ok(statusInfo);
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