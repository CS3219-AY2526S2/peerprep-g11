package peerprep.matching.controllers;

import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import peerprep.matching.domain.exception.InvalidMatchPreferenceException;
import peerprep.matching.domain.exception.MatchRequestConflictException;
import peerprep.matching.dto.MatchRequest;
import peerprep.matching.services.MatchService;

@RestController
@RequestMapping("/matching/requests")
public class MatchingController {

    @Autowired
    private MatchService matchService;

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
        final String requestId;
        try {
            requestId = matchService.addUser(req);
        } catch (InvalidMatchPreferenceException e) {
            return ResponseEntity.status(400).body(Map.of("error", e.getMessage()));
        } catch (MatchRequestConflictException e) {
            String matchId = "ALREADY_IN_SESSION".equals(e.getReason())
                    ? matchService.getExistingMatchIdForUser(jwtUserId)
                    : null;

            if (matchId != null && !matchId.isBlank()) {
                return ResponseEntity.status(409).body(Map.of(
                        "error", e.getMessage(),
                        "reason", e.getReason(),
                        "matchId", matchId
                ));
            }

            return ResponseEntity.status(409).body(Map.of(
                    "error", e.getMessage(),
                    "reason", e.getReason()
            ));
        }

        return ResponseEntity.status(201).body(Map.of(
                "message", "Matching started",
                "requestId", requestId
        ));
    }

    @DeleteMapping("/{requestId}")
    public ResponseEntity<?> cancelMatch(@PathVariable String requestId) {
        String[] userInfo = getAuthenticatedUser();
        if (userInfo == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }

        String jwtUserId = userInfo[0];
        Map<String, String> stateMap = matchService.getUserStateMapByRequestId(requestId);
        if (stateMap == null || !jwtUserId.equals(stateMap.get("userId"))) {
            return ResponseEntity.status(403).body(Map.of("error", "Forbidden"));
        }

        boolean cancelled = matchService.cancelMatch(requestId);
        if (cancelled) return ResponseEntity.ok(Map.of("message", "Match cancelled"));
        return ResponseEntity.status(404).body(Map.of("error", "Match not found"));
    }

    @GetMapping("/{requestId}")
    public ResponseEntity<?> getMatchStatus(@PathVariable String requestId) {
        String[] userInfo = getAuthenticatedUser();
        if (userInfo == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }

        String jwtUserId = userInfo[0];
        Map<String, String> stateMap = matchService.getUserStateMapByRequestId(requestId);
        if (stateMap == null || !jwtUserId.equals(stateMap.get("userId"))) {
            return ResponseEntity.status(403).body(Map.of("error", "Forbidden"));
        }

        Map<String, Object> statusInfo = matchService.getStatus(requestId);
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
