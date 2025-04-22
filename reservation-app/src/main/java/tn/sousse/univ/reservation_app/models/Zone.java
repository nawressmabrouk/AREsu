package tn.sousse.univ.reservation_app.models;

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
}
