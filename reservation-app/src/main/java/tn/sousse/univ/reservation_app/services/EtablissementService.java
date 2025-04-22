package tn.sousse.univ.reservation_app.services;

import tn.sousse.univ.reservation_app.dto.EtablissementWithEspacesDTO;
import tn.sousse.univ.reservation_app.models.Etablissement;
import tn.sousse.univ.reservation_app.models.TypeEtablissement;
import tn.sousse.univ.reservation_app.models.Zone;
import tn.sousse.univ.reservation_app.models.Espace;
import tn.sousse.univ.reservation_app.repositories.EtablissementRepository;
import tn.sousse.univ.reservation_app.repositories.EspaceRepository;

import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class EtablissementService {

    private final EtablissementRepository etablissementRepository;
    private final EspaceRepository espaceRepository;

    public EtablissementService(EtablissementRepository etablissementRepository, EspaceRepository espaceRepository) {
        this.etablissementRepository = etablissementRepository;
        this.espaceRepository = espaceRepository;
    }

    public List<EtablissementWithEspacesDTO> getEtablissementsWithEspaces() {
        List<Etablissement> etablissements = etablissementRepository.findAll();

        return etablissements.stream().map(etab -> {
            List<Espace> espaces = espaceRepository.findByEtablissementId(etab.getId());
            return new EtablissementWithEspacesDTO(etab.getNom(), espaces);
        }).collect(Collectors.toList());
    }

    public List<EtablissementWithEspacesDTO> getEtablissementsFiltered(Zone zone, TypeEtablissement type) {
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
    
        return etablissements.stream().map(etab -> {
            List<Espace> espaces = espaceRepository.findByEtablissementId(etab.getId());
            return new EtablissementWithEspacesDTO(etab.getNom(), espaces);
        }).collect(Collectors.toList());
    }
    
    public List<Etablissement> getAllEtablissements() {
        return etablissementRepository.findAll();
    }
}
