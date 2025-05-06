package tn.sousse.univ.reservation_app.repositories;

import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;

import tn.sousse.univ.reservation_app.models.VerificationToken;

public interface VerificationTokenRepository extends MongoRepository<VerificationToken, String> {
    Optional<VerificationToken> findByToken(String token);
}
