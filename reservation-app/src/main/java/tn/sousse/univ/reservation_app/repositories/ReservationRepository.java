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
    List<Reservation> findByDemandeurId(String demandeurId);

    List<Reservation> findByEspaceId(ObjectId espaceId);

    List<Reservation> findByStatut(String statut);

    List<Reservation> findByEspaceIdAndStatut(ObjectId espaceId, StatusReservation statut);

    List<Reservation> findByEspaceIdAndDemandeurId(ObjectId espaceId, String demandeurId);

    Optional<Reservation> findById(ObjectId reservationId);

    List<Reservation> findByGoogleEventIdNull();

    List<Reservation> findByGoogleEventIdNotNull();

    List<Reservation> findByStatut(StatusReservation acceptée);

    List<Reservation> findByEspaceIdIn(List<String> espaceIds);

    List<Reservation> findByEspaceIdInAndStatut(List<String> espaceIds, StatusReservation statut);

    List<Reservation> findByStatutAndDecideePar(String statut, String decideePar);

    List<Reservation> findByEtablissementIdAndStatut(String etablissementId, StatusReservation acceptée);

    List<Reservation> findByEtablissementIdAndEspaceIdAndStatut(String etablissementId, String espaceId,
            StatusReservation acceptée);

    @Query("{ 'etablissementId' : ?0, 'heureDebut' : { $gte: ?1, $lt: ?2 } }")
    List<Reservation> findByEtablissementIdAndHeureDebutBetween(String etablissementId, Date startOfDay, Date endOfDay);

    @Query("{ 'etablissementId' : ?0, 'espaceId' : ?1, 'heureDebut' : { $gte: ?2, $lt: ?3 } }")
    List<Reservation> findByEtablissementIdAndEspaceIdAndHeureDebutBetween(
            String etablissementId,
            String espaceId,
            Date startOfDay,
            Date endOfDay);

}
