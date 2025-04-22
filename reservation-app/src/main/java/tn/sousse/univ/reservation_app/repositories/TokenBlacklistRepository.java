package tn.sousse.univ.reservation_app.repositories;

import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;

import tn.sousse.univ.reservation_app.models.TokenBlacklist;

public interface TokenBlacklistRepository extends MongoRepository<TokenBlacklist, String> {
    Optional<TokenBlacklist> findByToken(String token);

    boolean existsByToken(String token);
}