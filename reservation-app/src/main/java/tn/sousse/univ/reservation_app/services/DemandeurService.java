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

        /*
         * @Autowired
         * private ReservationMapper reservationMapper;
         */

        @Autowired
        private EspaceRepository espaceRepository;

        /*
         * public ReservationResponseDTO demanderReservation(ReservationRequestDTO
         * reservationDTO) {
         * // Fetch the demandeur from the database
         * User demandeur = userRepository.findById(reservationDTO.getDemandeurId())
         * .orElseThrow(() -> new RuntimeException(
         * "Demandeur not found with ID: " + reservationDTO.getDemandeurId()));
         * 
         * // Convert DTO to Entity
         * Reservation reservation = ReservationMapper.toEntity(reservationDTO,
         * demandeur.getId());
         * reservation.setStatut(StatusReservation.EN_ATTENTE);
         * 
         * // Save reservation
         * Reservation savedReservation = reservationRepository.save(reservation);
         * 
         * // Convert entity to DTO with demandeur details
         * return ReservationMapper.toResponseDTO(savedReservation,
         * demandeur.getEmail(), demandeur.getNom());
         * }
         */

        
        

        
        
         public List<ReservationResponseDTO> getReservationsByDemandeur(String demandeurId) {
                List<Reservation> reservations = reservationRepository.findByDemandeurId(demandeurId);

                User demandeur = userRepository.findById(demandeurId)
                                .orElseThrow(() -> new RuntimeException("Demandeur introuvable"));

                return reservations.stream()
                                .map(reservation -> {
                                        String espaceNom = espaceRepository.findById(reservation.getEspaceId())
                                                        .map(espace -> espace.getNom())
                                                        .orElse("Espace inconnu");

                                        return ReservationMapper.toResponseDTOFull(
                                                        reservation,
                                                        demandeur.getEmail(),
                                                        demandeur.getNom(),
                                                        espaceNom);
                                })
                                .collect(Collectors.toList());
        }

        public ReservationResponseDTO getReservationDtoById(String reservationId) {
                Reservation reservation = reservationRepository.findById(reservationId)
                                .orElseThrow(() -> new RuntimeException("Réservation introuvable"));

                User demandeur = userRepository.findById(reservation.getDemandeurId())
                                .orElseThrow(() -> new RuntimeException("Demandeur introuvable"));

                String espaceNom = espaceRepository.findById(reservation.getEspaceId())
                                .map(Espace::getNom)
                                .orElse("Espace inconnu");

                return ReservationMapper.toResponseDTOFull(
                                reservation,
                                demandeur.getEmail(),
                                demandeur.getNom(),
                                espaceNom);
        }

}
