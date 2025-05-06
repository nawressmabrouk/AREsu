package tn.sousse.univ.reservation_app.repositories;

import java.util.List;
import java.util.Optional;

import org.bson.types.ObjectId;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;

import tn.sousse.univ.reservation_app.models.Espace;
import tn.sousse.univ.reservation_app.models.SpaceCategory;

public interface EspaceRepository extends MongoRepository<Espace, String> {

    // Make sure these field names match exactly with your Espace model
    List<Espace> findByEtablissementId(String etablissementId);

    @Query("{ '_id' : { $in: ?0 } }")
    List<Espace> findAllByObjectIds(List<ObjectId> ids);

    Optional<Espace> findByNom(String nom);
    
    List<Espace> findByCategorie(SpaceCategory categorie);

    List<Espace> findByType(String type);

    List<Espace> findByEtablissementIdAndCategorie(String etablissementId, SpaceCategory categorie);

    List<Espace> findByEtablissementIdAndType(String etablissementId, String type);

    List<Espace> findByCategorieAndType(SpaceCategory categorie, String type);

    List<Espace> findByEtablissementIdAndCategorieAndType(
            String etablissementId,
            String categorie,
            String type);
            
}