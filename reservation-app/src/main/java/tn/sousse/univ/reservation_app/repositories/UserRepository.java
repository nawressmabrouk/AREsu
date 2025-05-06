package tn.sousse.univ.reservation_app.repositories;

import java.util.List;
import java.util.Optional;

import org.bson.types.ObjectId;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import tn.sousse.univ.reservation_app.models.Role;
import tn.sousse.univ.reservation_app.models.User;

@Repository
public interface UserRepository extends MongoRepository<User, String> {
    Optional<User> findByEmail(String email);

    List<User> findByRole(Role role); // Trouver tous les utilisateurs par rôle

    boolean existsByEmail(String email);
    
    @Query("{ 'espacesResponsables': ?0, 'role': ?1 }")
    List<User> findByEspacesResponsablesContainsAndRole(ObjectId espaceId, Role role);

}
