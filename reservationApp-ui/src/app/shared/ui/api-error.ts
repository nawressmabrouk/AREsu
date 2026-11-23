import { HttpErrorResponse } from '@angular/common/http';

/**
 * Readable message from an API error. The backend answers with {erreur}, {error} or {message},
 * sometimes as plain text, and some calls use responseType 'text' (body is a JSON string then).
 */
export function apiErrorMessage(err: unknown, fallback: string): string {
  if (!(err instanceof HttpErrorResponse)) return fallback;
  if (err.status === 0) return 'Serveur injoignable. Vérifiez votre connexion puis réessayez.';

  const raw: unknown = err.error;
  let body: unknown = raw;
  if (typeof raw === 'string') {
    try {
      body = JSON.parse(raw);
    } catch {
      const text = raw.trim();
      return text && text.length < 200 && !text.startsWith('<') ? text : fallback;
    }
  }
  if (body && typeof body === 'object') {
    const b = body as Record<string, unknown>;
    const msg = b['erreur'] ?? b['error'] ?? b['message'];
    if (typeof msg === 'string' && msg.trim()) return msg;
  }
  return fallback;
}
