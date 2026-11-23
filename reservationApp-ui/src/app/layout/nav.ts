/** Sidebar navigation and labels per role (roles as in the JWT: ROLE_…). */
export interface NavItem {
  label: string;
  icon: string;
  link: string;
}

export const ROLE_LABELS: Record<string, string> = {
  ROLE_DEMANDEUR_INTERNE: 'Demandeur interne',
  ROLE_DEMANDEUR_EXTERNE: 'Demandeur externe',
  ROLE_SECRETAIRE_GENERALE: 'Secrétaire générale',
  ROLE_RESPONSABLE_SALLE: 'Responsable de salle',
  ROLE_ADMIN: 'Administrateur',
  ROLE_SUPER_ADMIN: 'Super administrateur',
};

const DEMANDEUR: NavItem[] = [
  { label: 'Espaces', icon: 'travel_explore', link: '/spaces' },
];

export const NAV_BY_ROLE: Record<string, NavItem[]> = {
  ROLE_DEMANDEUR_INTERNE: DEMANDEUR,
  ROLE_DEMANDEUR_EXTERNE: DEMANDEUR,
  ROLE_SECRETAIRE_GENERALE: [{ label: 'Réservations', icon: 'fact_check', link: '/secretary' }],
  ROLE_RESPONSABLE_SALLE: [{ label: 'Mes espaces & demandes', icon: 'meeting_room', link: '/room-manager' }],
  ROLE_ADMIN: [{ label: 'Administration', icon: 'admin_panel_settings', link: '/admin' }],
  ROLE_SUPER_ADMIN: [{ label: 'Établissements', icon: 'domain', link: '/super-admin/dashboard' }],
};

export function roleLabel(role: string | null | undefined): string {
  if (!role) return '';
  const key = role.toUpperCase().startsWith('ROLE_') ? role.toUpperCase() : 'ROLE_' + role.toUpperCase();
  return ROLE_LABELS[key] ?? '';
}
