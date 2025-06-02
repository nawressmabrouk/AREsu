package tn.sousse.univ.reservation_app.services;

import java.util.List;
import java.util.NoSuchElementException;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;
import tn.sousse.univ.reservation_app.dto.EspaceDTO;
import tn.sousse.univ.reservation_app.dto.SuperAdminEtablissementDTO;
import tn.sousse.univ.reservation_app.mappers.UserMapper;
import tn.sousse.univ.reservation_app.models.Espace;
import tn.sousse.univ.reservation_app.models.Etablissement;
import tn.sousse.univ.reservation_app.models.Role;
import tn.sousse.univ.reservation_app.models.User;
import tn.sousse.univ.reservation_app.repositories.EspaceRepository;
import tn.sousse.univ.reservation_app.repositories.EtablissementRepository;
import tn.sousse.univ.reservation_app.repositories.UserRepository;

@Service
@RequiredArgsConstructor
public class SuperAdminService {
    private final EtablissementRepository etablissementRepository;
    private final UserRepository userRepository;
    private final EspaceRepository espaceRepository;


    //Retrieves all establishments with their secretaries, managers, and spaces details.
    public List<SuperAdminEtablissementDTO> getAllEtablissementsWithDetails() {
        List<Etablissement> etablissements = etablissementRepository.findAll();

        return etablissements.stream()
                .map(etablissement -> {
                    SuperAdminEtablissementDTO dto = new SuperAdminEtablissementDTO();
                    // Map Etablissement fields
                    dto.setId(etablissement.getId());
                    dto.setNom(etablissement.getNom());
                    dto.setAdresse(etablissement.getAdresse());
                    dto.setZone(etablissement.getZone());
                    dto.setType(etablissement.getType());
                    dto.setLogo(etablissement.getLogo());

                    // Get secretary general
                    List<User> secretaires = userRepository.findByRoleAndEtablissementId(
                            Role.SECRETAIRE_GENERALE, etablissement.getId());
                    if (!secretaires.isEmpty()) {
                        dto.setSecretaireGeneral(UserMapper.toDTO(secretaires.get(0)));
                    }

                    // Get responsables
                    List<User> responsables = userRepository.findByRoleAndEtablissementId(
                            Role.RESPONSABLE_SALLE, etablissement.getId());
                    dto.setResponsables(responsables.stream()
                            .map(UserMapper::toDTO)
                            .collect(Collectors.toList()));

                    // Get espaces with their responsables
                    List<Espace> espaces = espaceRepository.findByEtablissementId(etablissement.getId());
                    dto.setEspaces(espaces.stream()
                            .map(espace -> {
                                EspaceDTO espaceDTO = new EspaceDTO();
                                espaceDTO.setId(espace.getId());
                                espaceDTO.setNom(espace.getNom());
                                espaceDTO.setCapacite(espace.getCapacite());
                                espaceDTO.setEquipement(espace.getEquipement());
                                espaceDTO.setCategorie(espace.getCategorie());
                                espaceDTO.setType(espace.getType());

                                if (espace.getResponsableId() != null) {
                                    userRepository.findById(espace.getResponsableId())
                                            .ifPresent(resp -> espaceDTO.setResponsable(UserMapper.toDTO(resp)));
                                }
                                return espaceDTO;
                            })
                            .collect(Collectors.toList()));

                    return dto;
                })
                .collect(Collectors.toList());
    }


    // Gets detailed information about a specific establishment including staff and spaces.
    public SuperAdminEtablissementDTO getEtablissementDetails(String etablissementId) {
        Etablissement etablissement = etablissementRepository.findById(etablissementId)
                .orElseThrow(() -> new NoSuchElementException("Etablissement not found with id: " + etablissementId));

        SuperAdminEtablissementDTO dto = new SuperAdminEtablissementDTO();
        // Map Etablissement fields
        dto.setId(etablissement.getId());
        dto.setNom(etablissement.getNom());
        dto.setAdresse(etablissement.getAdresse());
        dto.setZone(etablissement.getZone());
        dto.setType(etablissement.getType());
        dto.setLogo(etablissement.getLogo());

        // Get secretary general
        List<User> secretaires = userRepository.findByRoleAndEtablissementId(
                Role.SECRETAIRE_GENERALE, etablissement.getId());
        if (!secretaires.isEmpty()) {
            dto.setSecretaireGeneral(UserMapper.toDTO(secretaires.get(0)));
        }

        // Get responsables
        List<User> responsables = userRepository.findByRoleAndEtablissementId(
                Role.RESPONSABLE_SALLE, etablissement.getId());
        dto.setResponsables(responsables.stream()
                .map(UserMapper::toDTO)
                .collect(Collectors.toList()));

        // Get espaces with their responsables
        List<Espace> espaces = espaceRepository.findByEtablissementId(etablissement.getId());
        dto.setEspaces(espaces.stream()
                .map(espace -> {
                    EspaceDTO espaceDTO = new EspaceDTO();
                    espaceDTO.setId(espace.getId());
                    espaceDTO.setNom(espace.getNom());
                    espaceDTO.setCapacite(espace.getCapacite());
                    espaceDTO.setEquipement(espace.getEquipement());
                    espaceDTO.setCategorie(espace.getCategorie());
                    espaceDTO.setType(espace.getType());

                    if (espace.getResponsableId() != null) {
                        userRepository.findById(espace.getResponsableId())
                                .ifPresent(resp -> espaceDTO.setResponsable(UserMapper.toDTO(resp)));
                    }
                    return espaceDTO;
                })
                .collect(Collectors.toList()));

        return dto;
    }
}