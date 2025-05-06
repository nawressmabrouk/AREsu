package tn.sousse.univ.reservation_app.services;

import org.springframework.stereotype.Service;

import tn.sousse.univ.reservation_app.models.VerificationToken;
import tn.sousse.univ.reservation_app.repositories.VerificationTokenRepository;

import java.util.Optional;

@Service
public class VerificationTokenService {

    private final VerificationTokenRepository tokenRepository;

    public VerificationTokenService(VerificationTokenRepository tokenRepository) {
        this.tokenRepository = tokenRepository;
    }

    public void saveToken(VerificationToken token) {
        tokenRepository.save(token);
    }

    public void deleteToken(VerificationToken token) {
        tokenRepository.delete(token);
    }

    public Optional<VerificationToken> findByToken(String token) {
        return tokenRepository.findByToken(token);
    }
}
