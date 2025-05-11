/*ckage tn.sousse.univ.reservation_app.models;

public enum TypeEtablissement {
    FACULTE("faculté"),
    ECOLE("école"),
    INSTITUT("institut");

    private final String label;

    TypeEtablissement(String label) {
        this.label = label;
    }

    public String getLabel() {
        return label;
    }

    public static TypeEtablissement fromLabel(String label) {
        switch (label.toLowerCase()) {
            case "faculte":
                return FACULTE;
            case "ecole":
                return ECOLE;
            case "institut":
                return INSTITUT;
            default:
                throw new IllegalArgumentException("Invalid type label: " + label);
        }
    }
}*/

package tn.sousse.univ.reservation_app.models;

public enum TypeEtablissement {
    FACULTE("Faculté"),
    ECOLE("École"),
    INSTITUT("Institut"),
    UNIVERSITE("Université");
 

    private final String label;

    TypeEtablissement(String label) {
        this.label = label;
    }

    public String getLabel() {
        return label;
    }

    public static TypeEtablissement fromLabel(String label) {
        String normalized = normalizeString(label);
        for (TypeEtablissement type : values()) {
            if (normalizeString(type.label).equals(normalized)) {
                return type;
            }
        }
        throw new IllegalArgumentException("Invalid type label: " + label);
    }

    private static String normalizeString(String input) {
        return input.toLowerCase()
            .replaceAll("[éèêë]", "e")
            .replaceAll("[àâä]", "a")
            .replaceAll("[îï]", "i")
            .replaceAll("[ôö]", "o")
            .replaceAll("[ùûü]", "u")
            .replaceAll("\\s+", "-")
            .replaceAll("[^a-z0-9-]", "");
    }

    public static TypeEtablissement fromName(String name) {
        try {
            return TypeEtablissement.valueOf(name);
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid type name: " + name);
        }
    }
}
