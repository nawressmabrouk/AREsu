package tn.sousse.univ.reservation_app.security;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

/**
 * Minimal strength policy for passwords that come from configuration
 * (e.g. the first-start SUPER_ADMIN password).
 */
public final class PasswordPolicy {

    public static final int MIN_LENGTH = 12;

    private static final List<String> FORBIDDEN_FRAGMENTS = List.of(
            "password", "motdepasse", "admin", "azerty", "qwerty", "123456", "changeme", "welcome");

    private PasswordPolicy() {
    }

    /**
     * @return the list of problems; empty if the password is acceptable.
     */
    public static List<String> validate(String password, String username) {
        List<String> problems = new ArrayList<>();
        if (password == null || password.isBlank()) {
            problems.add("le mot de passe est vide");
            return problems;
        }
        if (password.length() < MIN_LENGTH) {
            problems.add("moins de " + MIN_LENGTH + " caractères");
        }

        int classes = 0;
        if (password.chars().anyMatch(Character::isLowerCase)) classes++;
        if (password.chars().anyMatch(Character::isUpperCase)) classes++;
        if (password.chars().anyMatch(Character::isDigit)) classes++;
        if (password.chars().anyMatch(c -> !Character.isLetterOrDigit(c))) classes++;
        if (classes < 3) {
            problems.add("doit contenir au moins 3 types parmi : minuscules, majuscules, chiffres, symboles");
        }

        String lower = password.toLowerCase(Locale.ROOT);
        for (String fragment : FORBIDDEN_FRAGMENTS) {
            if (lower.contains(fragment)) {
                problems.add("contient un mot trop courant (« " + fragment + " »)");
                break;
            }
        }

        if (username != null && !username.isBlank()) {
            String localPart = username.split("@")[0].toLowerCase(Locale.ROOT);
            if (localPart.length() >= 4 && lower.contains(localPart)) {
                problems.add("ne doit pas contenir le nom d'utilisateur");
            }
        }
        return problems;
    }
}
