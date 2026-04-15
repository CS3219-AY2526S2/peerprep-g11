package peerprep.matching.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Value;

@Service
public class JwtService {

    @Value("${JWT_SECRET}")
    private String secret;

    public String[] extractUserIdAndName(String token) {
        try {
            Claims claims = Jwts.parserBuilder()
                    .setSigningKey(secret.getBytes())
                    .build()
                    .parseClaimsJws(token)
                    .getBody();
            return new String[]{claims.get("id", String.class), claims.get("name", String.class)};
        } catch (Exception e) {
            System.out.println(e.toString());
            throw new RuntimeException("Invalid or expired JWT", e);
        }
    }
}