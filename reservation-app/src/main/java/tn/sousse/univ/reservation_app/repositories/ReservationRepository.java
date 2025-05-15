package tn.sousse.univ.reservation_app.repositories;

import java.util.Date;
import java.util.List;
import java.util.Optional;

import org.bson.types.ObjectId;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import tn.sousse.univ.reservation_app.models.Reservation;
import tn.sousse.univ.reservation_app.models.StatusReservation;

@Repository
public interface ReservationRepository extends MongoRepository<Reservation, String> {
    List<Reservation> findByDemandeurId(String demandeurId); // Trouver les réservations par ID demandeur

    List<Reservation> findByEspaceId(ObjectId espaceId); // Trouver les réservations par ID espace

    List<Reservation> findByStatut(String statut);
    // Trouver les réservations par statut


    List<Reservation> findByEspaceIdAndStatut(ObjectId espaceId, StatusReservation statut);

    List<Reservation> findByEspaceIdAndDemandeurId(ObjectId espaceId, String demandeurId);

    Optional<Reservation> findById(ObjectId reservationId);

    List<Reservation> findByGoogleCalendarEventIdNull();

    List<Reservation> findByGoogleCalendarEventIdNotNull();

    List<Reservation> findByStatut(StatusReservation acceptée);


        List<Reservation> findByEspaceIdIn(List<String> espaceIds);
    List<Reservation> findByEspaceIdInAndStatut(List<String> espaceIds, StatusReservation statut);
    
    List<Reservation> findByStatutAndDecideePar(String statut, String decideePar);
 @Query("{ " +
        "'espaceId': ?0, " +
        "'statut': ?1, " +
        "'$or': [ " +
            "{ 'heureDebut': { '$lt': ?3 }, 'heureFin': { '$gt': ?2 } }, " + // Chevauchement partiel
            "{ 'heureDebut': { '$gte': ?2, '$lte': ?3 } }, " + // Contenu entièrement dans l'intervalle
            "{ 'heureFin': { '$gte': ?2, '$lte': ?3 } } " +    // Contenu entièrement dans l'intervalle
        "] " +
    "}")
    List<Reservation> findConflictingReservations(
        String espaceId, 
        StatusReservation statut, 
        Date heureDebut, 
        Date heureFin
    );

}
