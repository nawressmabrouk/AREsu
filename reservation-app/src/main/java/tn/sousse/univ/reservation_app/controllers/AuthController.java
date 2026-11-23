package tn.sousse.univ.reservation_app.controllers;

import java.util.Date;
import java.util.Map;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
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
import tn.sousse.univ.reservation_app.services.PasswordRecoveryService;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final JwtUtil jwtUtil;
    private final TokenBlacklistRepository tokenBlacklistRepository;
    private final PasswordRecoveryService passwordRecoveryService;

    public AuthController(AuthService authService, JwtUtil jwtUtil, TokenBlacklistRepository tokenBlacklistRepository,
            PasswordRecoveryService passwordRecoveryService) {
        this.authService = authService;
        this.jwtUtil = jwtUtil;
        this.tokenBlacklistRepository = tokenBlacklistRepository;
        this.passwordRecoveryService = passwordRecoveryService;
    }

    // users login endpoint
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
            String token = jwtUtil.generateToken(user); // never log the token itself

            return ResponseEntity.ok(Map.of("token", token));

        } catch (org.springframework.security.authentication.DisabledException e) {
            // Account not activated yet: a clear 403 instead of a generic 500
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500)
                    .body(Map.of("error", "Erreur interne du serveur", "details", e.getMessage()));
        }
    }

    // users logout endpoint
    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpServletRequest request) {
        String authHeader = request.getHeader(HttpHeaders.AUTHORIZATION);

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.badRequest().body(Map.of("error", "No token found in Authorization header"));
        }

        String token = authHeader.substring(7);
        Date expiresAt;
        try {
            expiresAt = jwtUtil.extractExpiration(token);
        } catch (io.jsonwebtoken.JwtException | IllegalArgumentException e) {
            // Expired or invalid token: nothing left to revoke
            return ResponseEntity.ok(Map.of("message", "Successfully logged out"));
        }
        Date createdAt = new Date();

        TokenBlacklist blacklisted = new TokenBlacklist(null, token, createdAt, expiresAt);
        tokenBlacklistRepository.save(blacklisted);

        return ResponseEntity.ok(Map.of("message", "Successfully logged out"));
    }

    // forgot password endpoint
    @PostMapping("/forgot-password")
    public ResponseEntity<?> handleForgotPassword(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        passwordRecoveryService.processPasswordResetRequest(email);

      
        return ResponseEntity.ok().body(
                Map.of("message", "Si cet email est enregistré, vous recevrez un lien sous 15 minutes."));
    }


    // reset password endpoint
    @PostMapping("/reset-password")
    public ResponseEntity<?> handleResetPassword(@RequestBody Map<String, String> request) {
        try {
            String token = request.get("token");
            String newPassword = request.get("newPassword");
            String confirmPassword = request.get("confirmPassword");

            if (!newPassword.equals(confirmPassword)) {
                return ResponseEntity.badRequest().body(
                        Map.of("error", "Les mots de passe ne correspondent pas"));
            }

            passwordRecoveryService.validateTokenAndResetPassword(token, newPassword);

            return ResponseEntity.ok().body(
                    Map.of("message", "Mot de passe réinitialisé avec succès"));

        } catch (RuntimeException e) {

            String errorMessage = "Échec de la réinitialisation : " + e.getMessage();
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", errorMessage));
        } catch (Exception e) {

            return ResponseEntity.internalServerError().body(
                    Map.of("error", "Erreur interne du serveur"));
        }
    }

}
