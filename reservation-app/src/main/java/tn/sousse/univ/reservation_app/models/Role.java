package tn.sousse.univ.reservation_app.models;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum Role {
    DEMANDEUR_INTERNE,
    DEMANDEUR_EXTERNE,
    SECRETAIRE_GENERALE,
    ADMIN,
    SUPER_ADMIN,
    RESPONSABLE_SALLE;

    @JsonCreator
    public static Role fromString(String value) {
        return Role.valueOf(value.toUpperCase());
    }

    @JsonValue
    public String toJson() {
        return this.name().toLowerCase(); 
    }
}
