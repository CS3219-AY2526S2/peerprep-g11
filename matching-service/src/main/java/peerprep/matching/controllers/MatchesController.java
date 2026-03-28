package peerprep.matching.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import peerprep.matching.service.MatchService;
import peerprep.matching.documents.MatchDoc;

@RestController
@RequestMapping("/matches")
public class MatchesController {

    @Autowired
    private MatchService matchService;

    // --- End match session ---
    @DeleteMapping("/{matchId}")
    public ResponseEntity<?> endMatch(@PathVariable String matchId) {
        String[] userInfo = getAuthenticatedUser();
        if (userInfo == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }

        String jwtUserId = userInfo[0];

        MatchDoc matchDoc = matchService.getMatchDocByMatchId(matchId);
        if (matchDoc == null) {
            return ResponseEntity.status(404).body(Map.of("error", "Match not found"));
        }

        boolean isUserInMatch = matchDoc.getUser1().equals(jwtUserId) || matchDoc.getUser2().equals(jwtUserId);
        if (!isUserInMatch) {
            return ResponseEntity.status(403).body(Map.of("error", "Forbidden"));
        }

        boolean ended = matchService.endSession(matchId);
        if (ended) return ResponseEntity.ok(Map.of("message", "Match session ended"));
        return ResponseEntity.status(404).body(Map.of("error", "No active match found"));
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