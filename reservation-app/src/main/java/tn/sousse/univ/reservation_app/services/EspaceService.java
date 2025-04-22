package tn.sousse.univ.reservation_app.services;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import tn.sousse.univ.reservation_app.models.Espace;
import tn.sousse.univ.reservation_app.repositories.EspaceRepository;

import java.util.List;
import java.util.Optional;

@Service
public class EspaceService {

    @Autowired
    private EspaceRepository espaceRepository;

    // Récupérer tous les espaces
    public List<Espace> getAllEspaces() {
        return espaceRepository.findAll();
    }

    // Récupérer un espace par ID
    public Espace getEspaceById(String espaceId) {
        return espaceRepository.findById(espaceId)
                .orElseThrow(() -> new RuntimeException("Espace non trouvé"));
    }

    // Vérifier la disponibilité d’un espace
    public boolean verifierDisponibilite(String espaceId) {
        Optional<Espace> espace = espaceRepository.findById(espaceId);
        return espace.map(Espace::isDisponibilite).orElse(false);
    }

    public Espace getEspaceByNom(String nom) {
        return espaceRepository.findByNom(nom)
                .orElseThrow(() -> new RuntimeException("Espace non trouvé avec le nom : " + nom));
    }
    
}
