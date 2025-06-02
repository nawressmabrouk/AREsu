
package tn.sousse.univ.reservation_app.services;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import tn.sousse.univ.reservation_app.dto.ReservationResponseDTO;
import tn.sousse.univ.reservation_app.mappers.ReservationMapper;
import tn.sousse.univ.reservation_app.models.Espace;
import tn.sousse.univ.reservation_app.models.Reservation;
import tn.sousse.univ.reservation_app.models.User;
import tn.sousse.univ.reservation_app.repositories.EspaceRepository;
import tn.sousse.univ.reservation_app.repositories.ReservationRepository;
import tn.sousse.univ.reservation_app.repositories.UserRepository;

@Service
public class DemandeurService {

        @Autowired
        private ReservationRepository reservationRepository;

        @Autowired
        private UserRepository userRepository;

        @Autowired
        private EspaceRepository espaceRepository;

        // Gets all reservations for a specific demandeur
        public List<ReservationResponseDTO> getReservationsByDemandeur(String demandeurId) {
                List<Reservation> reservations = reservationRepository.findByDemandeurId(demandeurId);

                User demandeur = userRepository.findById(demandeurId)
                                .orElseThrow(() -> new RuntimeException("Demandeur introuvable"));
                String demandeurRole = demandeur.getRole().toString();

                // Convert reservations to DTOs with additional details
                return reservations.stream()
                                .map(reservation -> {
                                        String espaceNom = espaceRepository.findById(reservation.getEspaceId())
                                                        .map(Espace::getNom)
                                                        .orElse("Espace inconnu");

                                        return ReservationMapper.toResponseDTOFull(
                                                        reservation,
                                                        demandeur.getEmail(),
                                                        demandeur.getNom(),
                                                        espaceNom,
                                                        demandeurRole);
                                })
                                .collect(Collectors.toList());
        }

        // Gets a single reservation by ID with full details
        public ReservationResponseDTO getReservationDtoById(String reservationId) {
                Reservation reservation = reservationRepository.findById(reservationId)
                                .orElseThrow(() -> new RuntimeException("Réservation introuvable"));

                User demandeur = userRepository.findById(reservation.getDemandeurId())
                                .orElseThrow(() -> new RuntimeException("Demandeur introuvable"));

                String espaceNom = espaceRepository.findById(reservation.getEspaceId())
                                .map(Espace::getNom)
                                .orElse("Espace inconnu");

                String demandeurRole = demandeur.getRole().toString();

                return ReservationMapper.toResponseDTOFull(
                                reservation,
                                demandeur.getEmail(),
                                demandeur.getNom(),
                                espaceNom,
                                demandeurRole);
        }
}