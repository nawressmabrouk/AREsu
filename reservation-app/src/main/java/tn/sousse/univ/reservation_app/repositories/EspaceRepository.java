package tn.sousse.univ.reservation_app.repositories;

import java.util.List;
import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;

import tn.sousse.univ.reservation_app.models.Espace;

public interface EspaceRepository extends MongoRepository<Espace, String> {
    Optional<Espace> findById(String id);
    Optional<Espace> findByNom(String nom);
    List<Espace> findByEtablissementId(String etablissementId);


}
