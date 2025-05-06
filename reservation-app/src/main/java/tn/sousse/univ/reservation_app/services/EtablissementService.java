package tn.sousse.univ.reservation_app.services;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import tn.sousse.univ.reservation_app.models.Espace;
import tn.sousse.univ.reservation_app.models.Etablissement;
import tn.sousse.univ.reservation_app.models.TypeEtablissement;
import tn.sousse.univ.reservation_app.models.Zone;
import tn.sousse.univ.reservation_app.repositories.EspaceRepository;
import tn.sousse.univ.reservation_app.repositories.EtablissementRepository;

@Service
public class EtablissementService {

    private final EtablissementRepository etablissementRepository;
    private final EspaceRepository espaceRepository;

    public EtablissementService(EtablissementRepository etablissementRepository, EspaceRepository espaceRepository) {
        this.etablissementRepository = etablissementRepository;
        this.espaceRepository = espaceRepository;
    }

    public List<Espace> filterEspaces(String etablissementId, String categorie, String type) {
        System.out.println(">>> Filtrage espaces : etablissementId=" + etablissementId + ", categorie=" + categorie);

        // Fetch all espaces for the given établissement
        List<Espace> espaces = espaceRepository.findByEtablissementId(etablissementId);
        System.out.println(">>> Espaces trouvés avant filtre : " + espaces.size());

        // Filter based on category string (no more enum used)
        if (categorie != null && !categorie.isBlank()) {
            espaces = espaces.stream()
                    .filter(e -> e.getCategorie().equalsIgnoreCase(categorie))
                    .collect(Collectors.toList());
            System.out.println(">>> Après filtre catégorie : " + espaces.size());
        }

        // Filter based on type string
        if (type != null && !type.isBlank()) {
            espaces = espaces.stream()
                    .filter(e -> e.getType().equalsIgnoreCase(type))
                    .collect(Collectors.toList());
            System.out.println(">>> Après filtre type : " + espaces.size());
        }

        return espaces;
    }

    private String normalizeId(String id) {
        if (id == null)
            return null;
        return id.replace("ObjectId(", "").replace(")", "").trim();
    }

    // Get all spaces for an establishment (no filters)
    public List<Espace> getAllEspacesForEtablissement(String etablissementId) {
        etablissementId = normalizeId(etablissementId);
        System.out.println("Fetching ALL spaces for establishment: " + etablissementId);

        List<Espace> espaces = espaceRepository.findByEtablissementId(etablissementId);
        System.out.println("Found " + espaces.size() + " spaces");
        return espaces;
    }

    public List<Etablissement> getEtablissementsFiltered(Zone zone, TypeEtablissement type) {
        List<Etablissement> etablissements;

        if (zone != null && type != null) {
            etablissements = etablissementRepository.findByZoneAndType(zone, type);
        } else if (zone != null) {
            etablissements = etablissementRepository.findByZone(zone);
        } else if (type != null) {
            etablissements = etablissementRepository.findByType(type);
        } else {
            etablissements = etablissementRepository.findAll();
        }

        return etablissements.stream()
                .distinct()
                .collect(Collectors.toList());
    }

    // Get filtered spaces for an establishment
    public List<Espace> getFilteredEspacesForEtablissement(
            String etablissementId,
            String categorie,
            String type) {

        etablissementId = normalizeId(etablissementId);
        System.out.println("Fetching FILTERED spaces for establishment: " + etablissementId);
        System.out.println("Filters - categorie: " + categorie + ", type: " + type);

        List<Espace> espaces = espaceRepository.findByEtablissementId(etablissementId);
        System.out.println("Found " + espaces.size() + " spaces before filtering");

        if (categorie != null && !categorie.isBlank()) {
            espaces = espaces.stream()
                    .filter(e -> e.getCategorie() != null &&
                            e.getCategorie().equalsIgnoreCase(categorie))
                    .collect(Collectors.toList());
            System.out.println("After category filter: " + espaces.size());
        }

        if (type != null && !type.isBlank()) {
            espaces = espaces.stream()
                    .filter(e -> e.getType() != null &&
                            e.getType().equalsIgnoreCase(type))
                    .collect(Collectors.toList());
            System.out.println("After type filter: " + espaces.size());
        }

        return espaces;
    }

    public List<Etablissement> getAllEtablissements() {
        return etablissementRepository.findAll();
    }

    // This method enriches an Etablissement with its associated espaces
    private Etablissement enrichWithEspaces(Etablissement etablissement) {
        List<Espace> espaces = espaceRepository.findByEtablissementId(etablissement.getId());
        etablissement.setEspaces(espaces);
        return etablissement;
    }

    // Method to get spaces based on establishment, category, and type

    public List<Espace> getEtablissementEspaces(String etablissementId, String categorie, String type) {
        etablissementId = etablissementId.replace("ObjectId(", "").replace(")", "").trim();
        System.out.println("Normalized ID: " + etablissementId);

        System.out.println("Filtering spaces for establishment: " + etablissementId);

        List<Espace> espaces = espaceRepository.findByEtablissementId(etablissementId);
        System.out.println("Found " + espaces.size() + " total spaces before filtering");

        if (categorie != null && !categorie.isBlank() && !categorie.equalsIgnoreCase("Toutes les catégories")) {
            espaces = espaces.stream()
                    .filter(e -> e.getCategorie().equalsIgnoreCase(categorie))
                    .collect(Collectors.toList());
            System.out.println("After category filter: " + espaces.size());
        }

        if (type != null && !type.isBlank()) {
            espaces = espaces.stream()
                    .filter(e -> e.getType().equalsIgnoreCase(type))
                    .collect(Collectors.toList());
            System.out.println("After type filter: " + espaces.size());
        }

        return espaces;
    }

    public Etablissement getEtablissementById(String id) {
        // Handle ObjectId if using MongoDB
        if (id.startsWith("ObjectId(") && id.endsWith(")")) {
            id = id.substring(9, id.length() - 1);
        }
        
        return etablissementRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Etablissement not found"));
    }

}
