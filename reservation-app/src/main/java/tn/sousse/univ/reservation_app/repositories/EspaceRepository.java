package tn.sousse.univ.reservation_app.repositories;

import java.util.List;
import java.util.Optional;

import org.bson.types.ObjectId;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;

import tn.sousse.univ.reservation_app.models.Espace;
import tn.sousse.univ.reservation_app.models.SpaceCategory;

public interface EspaceRepository extends MongoRepository<Espace, String> {

  // Finds all spaces belonging to a specific establishment
    List<Espace> findByEtablissementId(String etablissementId);

    // Finds spaces matching a list of MongoDB ObjectIds
    @Query("{ '_id' : { $in: ?0 } }")
    List<Espace> findAllByObjectIds(List<ObjectId> ids);

    // Finds a space by its name
    Optional<Espace> findByNom(String nom);
    
    // Finds spaces by their category
    List<Espace> findByCategorie(SpaceCategory categorie);

    // Finds spaces by their type
    List<Espace> findByType(String type);

    // Finds spaces by establishment ID and category
    List<Espace> findByEtablissementIdAndCategorie(String etablissementId, SpaceCategory categorie);

    // Finds spaces by responsible ID
      List<Espace> findByResponsableId(String responsableId);

     // Finds spaces by establishment ID and type
    List<Espace> findByEtablissementIdAndType(String etablissementId, String type);

    // Finds spaces by category and type
    List<Espace> findByCategorieAndType(SpaceCategory categorie, String type);

    // Finds spaces by establishment ID, category, and type
    List<Espace> findByEtablissementIdAndCategorieAndType(
            String etablissementId,
            String categorie,
            String type);
            
}