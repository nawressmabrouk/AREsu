package tn.sousse.univ.reservation_app.models;

public enum SpaceCategory {
    ACADEMIC("Espaces_administratifs_academiques", "Espaces administratifs & académiques"),
    INNOVATION("Espaces_employabilite_innovation", "Espaces d'employabilité & d'innovation");

    private final String apiValue;

    SpaceCategory(String apiValue, String label) {
        this.apiValue = apiValue;
    }

    public static SpaceCategory fromApiValue(String apiValue) {
        for (SpaceCategory category : values()) {
            if (category.apiValue.equalsIgnoreCase(apiValue)) {
                return category;
            }
        }
        throw new IllegalArgumentException("Invalid category: " + apiValue);
    }
}
