/**
 * Reservation statuses (backend enum StatusReservation).
 * The backend sends accented names (ACCEPTÉE, REFUSÉE…) while the frontend enum uses
 * unaccented ones (ACCEPTEE…): always compare through normalizeStatus().
 */
export type StatusKey = 'EN_ATTENTE' | 'ACCEPTEE' | 'REFUSEE' | 'ATTRIBUEE' | 'TERMINEE' | 'ANNULEE';
export type Tone = 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'accent';

export const STATUS_META: Record<StatusKey, { label: string; tone: Tone; icon: string }> = {
  EN_ATTENTE: { label: 'En attente', tone: 'warning', icon: 'schedule' },
  ACCEPTEE: { label: 'Acceptée', tone: 'success', icon: 'check_circle' },
  REFUSEE: { label: 'Refusée', tone: 'danger', icon: 'cancel' },
  ATTRIBUEE: { label: 'Attribuée', tone: 'info', icon: 'event_available' },
  TERMINEE: { label: 'Terminée', tone: 'neutral', icon: 'task_alt' },
  ANNULEE: { label: 'Annulée', tone: 'neutral', icon: 'block' },
};

/** 'ACCEPTÉE' / 'acceptee' / 'ACCEPTEE' -> 'ACCEPTEE' (null if unknown). */
export function normalizeStatus(value: string | null | undefined): StatusKey | null {
  if (!value) return null;
  const key = value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toUpperCase()
    .replace(/[\s-]+/g, '_');
  return key in STATUS_META ? (key as StatusKey) : null;
}

/** True when the reservation status equals the given status (accent-insensitive). */
export function hasStatus(value: string | null | undefined, status: StatusKey): boolean {
  return normalizeStatus(value) === status;
}
