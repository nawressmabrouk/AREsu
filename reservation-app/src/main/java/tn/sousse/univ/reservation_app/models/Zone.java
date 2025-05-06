/*ckage tn.sousse.univ.reservation_app.models;

public enum Zone {
    CENTRE_VILLE_CITE_RIADH("Centre-ville de Sousse – Cité Riadh"),
    SAHLOUL_HAMMAM_SOUSSE("Zone Sahloul – Hammam Sousse"),
    CHOTT_MERIEM("Zone Chott Meriem");

    private final String label;

    Zone(String label) {
        this.label = label;
    }

    public String getLabel() {
        return label;
    }


    public static Zone fromLabel(String label) {
        switch (label.toLowerCase()) {
            case "chott meriem": return CHOTT_MERIEM;
            case "sahloul-hammam-sousse": return SAHLOUL_HAMMAM_SOUSSE;
            case "centre-ville-cite-riadh": return CENTRE_VILLE_CITE_RIADH;
            default: throw new IllegalArgumentException("Invalid zone label: " + label);
        }
    }
}*/

package tn.sousse.univ.reservation_app.models;

public enum Zone {
    CENTRE_VILLE_CITE_RIADH("Centre-ville – Cité Riadh"),
    SAHLOUL_HAMMAM_SOUSSE("Sahloul – Hammam Sousse"),
    CHOTT_MERIEM("Chott Meriem");

    private final String label;

    Zone(String label) {
        this.label = label;
    }

    public String getLabel() {
        return label;
    }

    public static Zone fromLabel(String label) {
        String normalized = normalizeString(label);
        for (Zone zone : values()) {
            if (normalizeString(zone.label).equals(normalized)) {
                return zone;
            }
        }
        throw new IllegalArgumentException("Invalid zone label: " + label);
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

    public static Zone fromName(String name) {
        try {
            return Zone.valueOf(name);
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid zone name: " + name);
        }
    }
}






































