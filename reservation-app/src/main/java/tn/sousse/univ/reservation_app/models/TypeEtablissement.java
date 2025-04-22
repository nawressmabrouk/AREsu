package tn.sousse.univ.reservation_app.models;

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
}
