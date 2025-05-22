package tn.sousse.univ.reservation_app.repositories;

import java.util.List;
import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;

import tn.sousse.univ.reservation_app.models.Etablissement;
import tn.sousse.univ.reservation_app.models.TypeEtablissement;
import tn.sousse.univ.reservation_app.models.Zone;

public interface EtablissementRepository extends MongoRepository<Etablissement, String> {
    List<Etablissement> findByZone(Zone zone);

    List<Etablissement> findByType(TypeEtablissement type);

    List<Etablissement> findByZoneAndType(Zone zone, TypeEtablissement type);

    // Find establishments without a Google Calendar ID
    List<Etablissement> findByGoogleCalendarIdIsNull();

    Etablissement findByGoogleCalendarId(String calendarId);
     Optional<Etablissement> findByAdminId(String adminId);
}