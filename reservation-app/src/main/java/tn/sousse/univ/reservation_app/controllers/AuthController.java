package tn.sousse.univ.reservation_app.controllers;

import java.util.Date;
import java.util.Map;

import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.servlet.http.HttpServletRequest;
import tn.sousse.univ.reservation_app.models.TokenBlacklist;
import tn.sousse.univ.reservation_app.models.User;
import tn.sousse.univ.reservation_app.repositories.TokenBlacklistRepository;
import tn.sousse.univ.reservation_app.security.JwtUtil;
import tn.sousse.univ.reservation_app.services.AuthService;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final JwtUtil jwtUtil;
    private final TokenBlacklistRepository tokenBlacklistRepository;

    public AuthController(AuthService authService, JwtUtil jwtUtil, TokenBlacklistRepository tokenBlacklistRepository) {
        this.authService = authService;
        this.jwtUtil = jwtUtil;
        this.tokenBlacklistRepository = tokenBlacklistRepository;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> credentials) {
        try {
            String email = credentials.get("email");
            String password = credentials.get("password");

            // Authenticate user
            User user = authService.authenticateUser(email, password);
            if (user == null) {
                return ResponseEntity.status(401).body(Map.of("error", "Identifiants invalides"));
            }

            // Generate JWT token
            String token = jwtUtil.generateToken(user);
            System.out.println("Token généré : " + token);

            return ResponseEntity.ok(Map.of("token", token));

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500)
                    .body(Map.of("error", "Erreur interne du serveur", "details", e.getMessage()));
        }
    }

    @PostMapping("/logout")
public ResponseEntity<?> logout(HttpServletRequest request) {
    String authHeader = request.getHeader(HttpHeaders.AUTHORIZATION);

    if (authHeader == null || !authHeader.startsWith("Bearer ")) {
        return ResponseEntity.badRequest().body(Map.of("error", "No token found in Authorization header"));
    }

    String token = authHeader.substring(7);
    Date expiresAt = jwtUtil.extractExpiration(token);
    Date createdAt = new Date();

    TokenBlacklist blacklisted = new TokenBlacklist(null, token, createdAt, expiresAt);
    tokenBlacklistRepository.save(blacklisted);

    return ResponseEntity.ok(Map.of("message", "Successfully logged out"));
}

}
