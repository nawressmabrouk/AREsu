package tn.sousse.univ.reservation_app.security;

import java.security.Key;
import java.util.Base64;
import java.util.Collections;
import java.util.Date;
import java.util.List;
import java.util.function.Function;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import tn.sousse.univ.reservation_app.models.User;

@Component
public class JwtUtil {

    // Inject JWT secret key from application.yml
    @Value("${spring.jwt.secret-key}")
    private String secret;

    // Inject JWT expiration time from application.yml
    @Value("${spring.jwt.expiration}")
    private long expiration;

    // get the signing key
    private Key getSigningKey() {

        // Decode base64 secret
        byte[] keyBytes = Base64.getDecoder().decode(secret);

        // Create HMAC-SHA(Hash-based Message Authentication Code) key
        return Keys.hmacShaKeyFor(keyBytes);
    }

    // generate a JWT token
    public String generateToken(User user) {
        // Get user role as string
        String role = user.getRole().name();

        // Ensure role starts with ROLE_ prefix
        if (!role.startsWith("ROLE_")) {
            // Add ROLE_ prefix and convert to uppercase
            role = "ROLE_" + role.toUpperCase();
        }

        // Build JWT token
        return Jwts.builder()
                // Set subject (username/email)
                .setSubject(user.getEmail())
                // Add user ID claim
                .claim("userId", user.getId())
                // Add roles claim as singleton list
                .claim("roles", Collections.singletonList(role))
                // Set issued at time
                .setIssuedAt(new Date())
                // Set expiration time
                .setExpiration(new Date(System.currentTimeMillis() + expiration))
                // Sign the token with the secret key using HMAC SHA-256 algorithm
                .signWith(getSigningKey(), SignatureAlgorithm.HS256)
                // Compact the token to a string
                .compact();
    }

    // Extract username (email) from the token
    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    // Extract roles from token
    public List<String> extractRoles(String token) {
        // Extract roles claim as List
        return extractClaim(token, claims -> claims.get("roles", List.class)); // Extraction de la liste de rôles
    }

    // Generic method to extract claim
    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        // Extract all claims
        final Claims claims = extractAllClaims(token);
        // Apply resolver function
        return claimsResolver.apply(claims);
    }

    // Validate token against user details
    public boolean validateToken(String token, UserDetails userDetails) {
        final String username = extractUsername(token);
        return (username.equals(userDetails.getUsername()) && !isTokenExpired(token));
    }

    // Extract all claims from the token
    private Claims extractAllClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    // Check if token is expired
    private boolean isTokenExpired(String token) {
        Date expirationDate = extractExpiration(token);
        return expirationDate != null && expirationDate.before(new Date());
    }

    // Extract expiration date from token
    public Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }
}
