package peerprep.matching.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import peerprep.matching.models.MatchRequest;
import peerprep.matching.service.MatchService;
import peerprep.matching.documents.UserStateDoc;

@RestController
@RequestMapping("/matching/requests")
public class MatchingController {

    @Autowired
    private MatchService matchService;

    // --- Start a new match ---
    @PostMapping
    public ResponseEntity<?> startMatch(@RequestBody MatchRequest req) {
        String[] userInfo = getAuthenticatedUser();
        if (userInfo == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }

        String jwtUserId = userInfo[0];
        String jwtUserName = userInfo[1];
        req.setUserId(jwtUserId);
        req.setUserName(jwtUserName);
        UserStateDoc stateDoc = matchService.addUser(req);

        return ResponseEntity.status(201).body(Map.of(
                "message", "Matching started",
                "requestId", stateDoc.getRequestId()
        ));
    }

    // --- Cancel match ---
    @DeleteMapping("/{requestId}")
    public ResponseEntity<?> cancelMatch(@PathVariable String requestId) {
        String[] userInfo = getAuthenticatedUser();
        if (userInfo == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }

        String jwtUserId = userInfo[0];
        UserStateDoc stateDoc = matchService.getStateDocByRequestId(requestId);
        if (stateDoc == null || !stateDoc.getUserId().equals(jwtUserId)) {
            return ResponseEntity.status(403).body(Map.of("error", "Forbidden"));
        }

        boolean cancelled = matchService.cancelMatch(requestId);
        if (cancelled) return ResponseEntity.ok(Map.of("message", "Match cancelled"));
        return ResponseEntity.status(404).body(Map.of("error", "Match not found"));
    }

    // --- Get match status ---
    @GetMapping("/{requestId}")
    public ResponseEntity<?> getMatchStatus(@PathVariable String requestId) {
        String[] userInfo = getAuthenticatedUser();
        if (userInfo == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }

        String jwtUserId = userInfo[0];
        UserStateDoc stateDoc = matchService.getStateDocByRequestId(requestId);
        if (stateDoc == null || !stateDoc.getUserId().equals(jwtUserId)) {
            return ResponseEntity.status(403).body(Map.of("error", "Forbidden"));
        }

        Map<String, Object> statusInfo = matchService.getStatusWithMatchId(requestId);
        if (statusInfo == null) {
            return ResponseEntity.status(404).body(Map.of("error", "Status not found"));
        }
        statusInfo.put("requestId", requestId);
        return ResponseEntity.ok(statusInfo);
    }

    private String[] getAuthenticatedUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            return null;
        }

        Object principal = authentication.getPrincipal();
        Object details = authentication.getDetails();

        if (!(principal instanceof String)) {
            return null;
        }

        String jwtUserId = (String) principal;
        String jwtUserName = details != null ? details.toString() : null;
        return new String[]{jwtUserId, jwtUserName};
    }
}