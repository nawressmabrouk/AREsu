package tn.sousse.univ.reservation_app.services;

import java.util.Optional;

import org.springframework.stereotype.Service;

import tn.sousse.univ.reservation_app.models.VerificationToken;
import tn.sousse.univ.reservation_app.repositories.VerificationTokenRepository;

@Service
public class VerificationTokenService {

    private final VerificationTokenRepository tokenRepository;

    public VerificationTokenService(VerificationTokenRepository tokenRepository) {
        this.tokenRepository = tokenRepository;
    }

    // Stores a verification token in the database
    public void saveToken(VerificationToken token) {
        tokenRepository.save(token);
    }

    // Removes a verification token from the database
    public void deleteToken(VerificationToken token) {
        tokenRepository.delete(token);
    }

    // Retrieves a token entity by its string value
    public Optional<VerificationToken> findByToken(String token) {
        return tokenRepository.findByToken(token);
    }
}
