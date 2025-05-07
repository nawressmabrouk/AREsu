package tn.sousse.univ.reservation_app.services;

import java.util.ArrayList;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import tn.sousse.univ.reservation_app.models.Espace;
import tn.sousse.univ.reservation_app.models.Role;
import tn.sousse.univ.reservation_app.models.User;
import tn.sousse.univ.reservation_app.repositories.EspaceRepository;
import tn.sousse.univ.reservation_app.repositories.UserRepository;

@Service
public class AdminService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EspaceRepository espaceRepository;

    /*
     * @Autowired
     * private EmailService emailService;
     */

    // Ajouter un nouvel espace
    public Espace ajouterEspace(String responsableId, Espace espace) {
        User user = userRepository.findById(responsableId)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));
    
        // Modifier la vérification du rôle
        if (user.getRole() != Role.RESPONSABLE_SALLE && user.getRole() != Role.SECRETAIRE_GENERALE) {
            throw new RuntimeException("L'utilisateur doit être un Responsable Salle ou Secrétaire Générale");
        }
    
        espace.setResponsableId(responsableId);
        espace = espaceRepository.save(espace);
    
        if (user.getEspacesResponsables() == null) {
            user.setEspacesResponsables(new ArrayList<>());
        }
    
        user.getEspacesResponsables().add(espace.getId());
        userRepository.save(user);
    
        return espace;
    }

    // Modifier un espace
    public Espace modifierEspace(String espaceId, Espace espaceModifie) {
        Espace espace = espaceRepository.findById(espaceId)
                .orElseThrow(() -> new RuntimeException("Espace not found"));

        espace.setNom(espaceModifie.getNom());
        espace.setCapacite(espaceModifie.getCapacite());
        espace.setDisponibilite(espaceModifie.isDisponibilite());
        espace.setEquipement(espaceModifie.getEquipement());
        espace.setCategorie(espaceModifie.getCategorie()); 
        espace.setType(espaceModifie.getType());
        espace.setResponsableId(espaceModifie.getResponsableId());
        espace.setEtablissementId(espaceModifie.getEtablissementId());
        return espaceRepository.save(espace);
    }

    // Supprimer un espace
    public void supprimerEspace(String responsableId, String espaceId) {
        User responsable = userRepository.findById(responsableId)
                .orElseThrow(() -> new RuntimeException("Responsable not found"));

        if (!responsable.getEspacesResponsables().contains(espaceId)) {
            throw new RuntimeException("User does not manage this space.");
        }

        espaceRepository.deleteById(espaceId);

        // Remove space from user's list
        responsable.getEspacesResponsables().remove(espaceId);
        userRepository.save(responsable);
    }

}

