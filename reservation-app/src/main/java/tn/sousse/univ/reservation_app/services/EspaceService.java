package tn.sousse.univ.reservation_app.services;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Service;

import tn.sousse.univ.reservation_app.models.Espace;
import tn.sousse.univ.reservation_app.models.Reservation;
import tn.sousse.univ.reservation_app.models.StatusReservation;
import tn.sousse.univ.reservation_app.repositories.EspaceRepository;

@Service
public class EspaceService {

    @Autowired
    private EspaceRepository espaceRepository;

    @Autowired
    private MongoTemplate mongoTemplate;

    public List<Espace> getAllEspaces() {
        return espaceRepository.findAll();
    }

    public Espace getEspaceById(String espaceId) {
        return espaceRepository.findById(espaceId)
                .orElseThrow(() -> new RuntimeException("Espace non trouvé"));
    }

    public boolean verifierDisponibilite(String espaceId) {
        Optional<Espace> espace = espaceRepository.findById(espaceId);
        return espace.map(Espace::isDisponibilite).orElse(false);
    }

    public Espace getEspaceByNom(String nom) {
        return espaceRepository.findByNom(nom)
                .orElseThrow(() -> new RuntimeException("Espace non trouvé avec le nom : " + nom));
    }

    public List<Espace> findByEtablissementId(String etablissementId) {
        return espaceRepository.findByEtablissementId(etablissementId);
    }

    public List<String> getUnavailableSlotsForSpace(String espaceId, String date) {
        try {
            SimpleDateFormat dateFormat = new SimpleDateFormat("yyyy-MM-dd");
            Date requestedDate = dateFormat.parse(date);

            // Set date range for entire day
            java.util.Calendar startOfDay = java.util.Calendar.getInstance();
            startOfDay.setTime(requestedDate);
            startOfDay.set(java.util.Calendar.HOUR_OF_DAY, 0);
            startOfDay.set(java.util.Calendar.MINUTE, 0);

            java.util.Calendar endOfDay = (java.util.Calendar) startOfDay.clone();
            endOfDay.set(java.util.Calendar.HOUR_OF_DAY, 23);
            endOfDay.set(java.util.Calendar.MINUTE, 59);

            Criteria criteria = Criteria.where("espaceId").is(espaceId)
                    .and("statut").ne(StatusReservation.REFUSÉE)
                    .and("heureDebut").gte(startOfDay.getTime())
                    .and("heureFin").lte(endOfDay.getTime());

            Query query = Query.query(criteria);
            List<Reservation> reservations = mongoTemplate.find(query, Reservation.class);

            return reservations.stream()
                    .map(r -> r.getHeureDebut().toString() + " - " + r.getHeureFin().toString())
                    .collect(Collectors.toList());

        } catch (Exception e) {
            throw new RuntimeException("Erreur lors de la récupération des créneaux", e);
        }
    }

   
    public List<Reservation> getReservationsForSpace(String espaceId, String status) {
        Criteria criteria = Criteria.where("espaceId").is(espaceId);
    
        if (status != null && !status.isBlank()) {
            try {
                StatusReservation statusEnum = StatusReservation.valueOf(status.toUpperCase());
                criteria.and("statut").is(statusEnum);
            } catch (IllegalArgumentException e) {
                throw new RuntimeException("Statut de réservation invalide : " + status);
            }
        }
    
        Query query = new Query(criteria);
        return mongoTemplate.find(query, Reservation.class);
    }

}
