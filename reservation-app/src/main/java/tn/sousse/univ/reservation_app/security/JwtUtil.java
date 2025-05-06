/*hedha first code ely te3mal meloul 
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

    @Value("${spring.jwt.secret-key}")
    private String secret;

    @Value("${spring.jwt.expiration}")
    private long expiration;

    private Key getSigningKey() {
        byte[] keyBytes = Base64.getDecoder().decode(secret);
        return Keys.hmacShaKeyFor(keyBytes);
    }

    public String generateToken(User user) {
        // Convertir l'Enum Role en String
        String role = user.getRole().name();

        // Vérifier si le rôle commence par "ROLE_"
        if (!role.startsWith("ROLE_")) {
            role = "ROLE_" + role.toUpperCase(); // S'assure d'avoir "ROLE_ADMIN"
        }

        return Jwts.builder()
                .setSubject(user.getEmail())
                .claim("roles", Collections.singletonList(role)) // Utiliser une liste pour stocker les rôles
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + expiration))
                .signWith(getSigningKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    public List<String> extractRoles(String token) {
        return extractClaim(token, claims -> claims.get("roles", List.class));
    }

    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    public boolean validateToken(String token, UserDetails userDetails) {
        final String username = extractUsername(token);
        return (username.equals(userDetails.getUsername()) && !isTokenExpired(token));
    }

    private Claims extractAllClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    private boolean isTokenExpired(String token) {
        Date expirationDate = extractExpiration(token);
        return expirationDate != null && expirationDate.before(new Date());
    }

    public  Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }
}*/
package tn.sousse.univ.reservation_app.security;

import java.security.Key;
import java.util.Base64;
import java.util.Collections;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import tn.sousse.univ.reservation_app.models.User;

@Component
public class JwtUtil {

    @Value("${spring.jwt.secret-key}")
    private String secret;
   

    @Value("${spring.jwt.expiration}")
    private long expiration;

    private Key getSigningKey() {
        byte[] keyBytes = Base64.getDecoder().decode(secret);
        return Keys.hmacShaKeyFor(keyBytes);
    }

    public String generateToken(User user) {
        // Convertir l'Enum Role en String
        String role = user.getRole().name();

        // Vérifier si le rôle commence par "ROLE_"
        if (!role.startsWith("ROLE_")) {
            role = "ROLE_" + role.toUpperCase(); // S'assure d'avoir "ROLE_ADMIN"
        }

        return Jwts.builder()
                .setSubject(user.getEmail())
                .claim("userId", user.getId()) //ajouter pour récupérer l'id de demandeur 
                .claim("roles", Collections.singletonList(role)) // Utiliser une liste pour stocker les rôles
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + expiration))
                .signWith(getSigningKey(), SignatureAlgorithm.HS256)
                .compact();
    }  

    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    public List<String> extractRoles(String token) {
        return extractClaim(token, claims -> claims.get("roles", List.class)); // Extraction de la liste de rôles
    }
    

    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    public boolean validateToken(String token, UserDetails userDetails) {
        final String username = extractUsername(token);
        return (username.equals(userDetails.getUsername()) && !isTokenExpired(token));
    }

    private Claims extractAllClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    private boolean isTokenExpired(String token) {
        Date expirationDate = extractExpiration(token);
        return expirationDate != null && expirationDate.before(new Date());
    }

    public  Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }
}

