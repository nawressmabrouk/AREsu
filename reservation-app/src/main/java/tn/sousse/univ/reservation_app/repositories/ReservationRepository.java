package tn.sousse.univ.reservation_app.repositories;

import java.util.List;

import org.bson.types.ObjectId;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import tn.sousse.univ.reservation_app.models.Reservation;

@Repository
public interface ReservationRepository extends MongoRepository<Reservation, String> {
    List<Reservation> findByDemandeurId(String demandeurId); // Trouver les réservations par ID demandeur

    List<Reservation> findByEspaceId(ObjectId espaceId); // Trouver les réservations par ID espace

    List<Reservation> findByStatut(String statut);
    // Trouver les réservations par statut
}