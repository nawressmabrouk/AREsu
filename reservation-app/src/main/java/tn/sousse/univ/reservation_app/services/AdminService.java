package tn.sousse.univ.reservation_app.services;

import java.util.ArrayList;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import tn.sousse.univ.reservation_app.models.Espace;
import tn.sousse.univ.reservation_app.models.Etablissement;
import tn.sousse.univ.reservation_app.models.Role;
import tn.sousse.univ.reservation_app.models.User;
import tn.sousse.univ.reservation_app.repositories.EspaceRepository;
import tn.sousse.univ.reservation_app.repositories.EtablissementRepository;
import tn.sousse.univ.reservation_app.repositories.UserRepository;
import tn.sousse.univ.reservation_app.security.CustomUserDetails;

@Service
public class AdminService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EspaceRepository espaceRepository;

    @Autowired
    private EtablissementRepository etablissementRepository;

    // Adds a new space and assigns it to a responsible user
    public Espace ajouterEspace(String responsableId, Espace espace) {
        User user = userRepository.findById(responsableId)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

        // role verification
        if (user.getRole() != Role.RESPONSABLE_SALLE && user.getRole() != Role.SECRETAIRE_GENERALE) {
            throw new RuntimeException("L'utilisateur doit être un Responsable Salle ou Secrétaire Générale");
        }

        User currentAdmin = getCurrentAdmin();
        Etablissement etablissement = etablissementRepository.findByAdminId(currentAdmin.getId())
                .orElseThrow(() -> new RuntimeException("Établissement non trouvé"));

        if (!user.getEtablissementId().equals(etablissement.getId())) {
            throw new RuntimeException("Le responsable n'appartient pas à votre établissement");
        }

        espace.setResponsableId(responsableId);
        espace.setEtablissementId(etablissement.getId());
        espace.setEtablissementNom(etablissement.getNom());
        espace = espaceRepository.save(espace);

        if (user.getEspacesResponsables() == null) {
            user.setEspacesResponsables(new ArrayList<>());
        }

        user.getEspacesResponsables().add(espace.getId());
        userRepository.save(user);

        return espace;
    }

    // Modifies an existing space's details
    public Espace modifierEspace(String espaceId, Espace espaceModifie) {
        Espace espace = espaceRepository.findById(espaceId)
                .orElseThrow(() -> new RuntimeException("Espace not found"));

        // verifies if the space belongs to the admin's establishment
        User currentAdmin = getCurrentAdmin();
        Etablissement etablissement = etablissementRepository.findByAdminId(currentAdmin.getId())
                .orElseThrow(() -> new RuntimeException("Établissement non trouvé"));

        if (!espace.getEtablissementId().equals(etablissement.getId())) {
            throw new RuntimeException("Vous n'avez pas les droits pour modifier cet espace");
        }

        espace.setNom(espaceModifie.getNom());
        espace.setCapacite(espaceModifie.getCapacite());
        espace.setDisponibilite(espaceModifie.isDisponibilite());
        espace.setEquipement(espaceModifie.getEquipement());
        espace.setCategorie(espaceModifie.getCategorie());
        espace.setType(espaceModifie.getType());
        espace.setResponsableId(espaceModifie.getResponsableId());
        return espaceRepository.save(espace);
    }

    // Deletes a space from the system
    public void supprimerEspace(String espaceId) {
        Espace espace = espaceRepository.findById(espaceId)
                .orElseThrow(() -> new IllegalArgumentException("Espace introuvable"));

        User currentAdmin = getCurrentAdmin();
        Etablissement etablissement = etablissementRepository.findByAdminId(currentAdmin.getId())
                .orElseThrow(() -> new RuntimeException("Établissement non trouvé"));

        if (!espace.getEtablissementId().equals(etablissement.getId())) {
            throw new RuntimeException("Vous n'avez pas les droits pour supprimer cet espace");
        }

        espaceRepository.delete(espace);
    }

    // Get responsables for current admin's establishment
    public List<User> getResponsablesSalle() {
        User currentAdmin = getCurrentAdmin();
        Etablissement etablissement = etablissementRepository.findByAdminId(currentAdmin.getId())
                .orElseThrow(() -> new RuntimeException("Établissement non trouvé"));

        return userRepository.findByRoleAndEtablissementId(Role.RESPONSABLE_SALLE, etablissement.getId());
    }

    // updates the responsible details by the admin
    public User updateAdmin(String adminId, User updatedUser) {
        User existingUser = userRepository.findById(adminId)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

        if (!isValidRole(updatedUser.getRole())) {
            throw new IllegalArgumentException("Rôle invalide");
        }

        User currentAdmin = getCurrentAdmin();
        Etablissement etablissement = etablissementRepository.findByAdminId(currentAdmin.getId())
                .orElseThrow(() -> new RuntimeException("Établissement non trouvé"));

        if (!existingUser.getEtablissementId().equals(etablissement.getId())) {
            throw new RuntimeException("Vous n'avez pas les droits pour modifier cet utilisateur");
        }

        existingUser.setNom(updatedUser.getNom());
        existingUser.setPrenom(updatedUser.getPrenom());
        existingUser.setEmail(updatedUser.getEmail());
        existingUser.setNumTel(updatedUser.getNumTel());
        existingUser.setRole(updatedUser.getRole());
        existingUser.setFonction(updatedUser.getFonction());
        existingUser.setNomEtablissement(updatedUser.getNomEtablissement());

        return userRepository.save(existingUser);
    }

    // Deletes a responsible from the system and cleans up associated spaces
    public void deleteAdmin(String adminId) {
        User admin = userRepository.findById(adminId)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

        User currentAdmin = getCurrentAdmin();
        Etablissement etablissement = etablissementRepository.findByAdminId(currentAdmin.getId())
                .orElseThrow(() -> new RuntimeException("Établissement non trouvé"));

        System.out.println("Admin's establishment: " + etablissement.getNom() + " (" + etablissement.getId() + ")");

        if (!admin.getNomEtablissement().equals(etablissement.getNom())) {
            throw new RuntimeException("Vous n'avez pas les droits pour supprimer cet utilisateur");
        }

        if (admin.getEspacesResponsables() != null && !admin.getEspacesResponsables().isEmpty()) {
            espaceRepository.deleteAllById(admin.getEspacesResponsables());
        }

        userRepository.delete(admin);
    }

    // Get spaces for current admin's establishment
    public List<Espace> getAllEspaces() {
        User currentAdmin = getCurrentAdmin();
        Etablissement etablissement = etablissementRepository.findByAdminId(currentAdmin.getId())
                .orElseThrow(() -> new RuntimeException("Établissement non trouvé"));

        return espaceRepository.findByEtablissementId(etablissement.getId());
    }

    // Checks if a space exists by ID
    public boolean espaceExists(String espaceId) {
        return espaceRepository.existsById(espaceId);
    }

    // Validates if the role is either SECRETAIRE_GENERALE or RESPONSABLE_SALLE
    private boolean isValidRole(Role role) {
        return role == Role.SECRETAIRE_GENERALE || role == Role.RESPONSABLE_SALLE;
    }

    // Retrieves the currently authenticated admin user
    public User getCurrentAdmin() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !authentication.isAuthenticated()) {
            throw new RuntimeException("No authenticated user found");
        }

        Object principal = authentication.getPrincipal();

        if (!(principal instanceof CustomUserDetails)) {
            throw new RuntimeException("Unexpected principal type");
        }

        CustomUserDetails userDetails = (CustomUserDetails) principal;

        User user = userRepository.findById(userDetails.getUserId())
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.getRole() != Role.ADMIN) {
            throw new RuntimeException("Current user is not an admin");
        }

        return user;
    }
}