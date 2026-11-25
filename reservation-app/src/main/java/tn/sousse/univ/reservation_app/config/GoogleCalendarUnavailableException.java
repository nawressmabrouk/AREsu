package tn.sousse.univ.reservation_app.config;

/** Thrown when a Google Calendar operation is requested while the integration is disabled. */
public class GoogleCalendarUnavailableException extends IllegalStateException {

    public GoogleCalendarUnavailableException() {
        super("Google Calendar n'est pas configuré sur ce serveur (clé du compte de service absente ou invalide).");
    }
}
