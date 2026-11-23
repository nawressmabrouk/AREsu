/**
 * Space categories and types. `value` is what the backend stores and filters on
 * (SpaceCategory.apiValue); older forms saved the French label instead, so
 * categoryValue() accepts both.
 */
export interface SpaceCategoryDef {
  value: string;
  label: string;
  types: string[];
}

export const SPACE_CATEGORIES: SpaceCategoryDef[] = [
  {
    value: 'Espaces_administratifs_academiques',
    label: 'Espaces administratifs & académiques',
    types: ['Amphitheatre', 'Laboratoire_de_recherche', 'Salle_de_conference', 'Salle_de_marche/bourse'],
  },
  {
    value: 'Espaces_employabilite_innovation',
    label: "Espaces d'employabilité & d'innovation",
    types: ['Espace_4C', 'Incubateur', 'FabLab', 'Coworking_space', 'Pole_etudiant_entrepreneur'],
  },
];

export const COMMON_EQUIPMENTS = ['Projecteur', 'Tableau blanc', 'Ordinateurs', 'Système audio', 'Wi-Fi'];

function findCategory(value: string | null | undefined): SpaceCategoryDef | undefined {
  const v = (value ?? '').trim().toLowerCase();
  return SPACE_CATEGORIES.find(c => c.value.toLowerCase() === v || c.label.toLowerCase() === v);
}

/** API value of a category given its value or its label ('' if unknown). */
export function categoryValue(value: string | null | undefined): string {
  return findCategory(value)?.value ?? '';
}

export function categoryLabel(value: string | null | undefined): string {
  return findCategory(value)?.label ?? (value || '');
}

export function typesOf(category: string | null | undefined): string[] {
  return findCategory(category)?.types ?? [];
}

const TYPE_LABELS: Record<string, string> = {
  Amphitheatre: 'Amphithéâtre',
  Laboratoire_de_recherche: 'Laboratoire de recherche',
  Salle_de_conference: 'Salle de conférence',
  'Salle_de_marche/bourse': 'Salle de marché / bourse',
  Espace_4C: 'Espace 4C',
  Coworking_space: 'Espace de coworking',
  Pole_etudiant_entrepreneur: 'Pôle étudiant entrepreneur',
};

/** Display name of a stored type: 'Salle_de_conference' -> 'Salle de conférence' */
export function typeLabel(type: string | null | undefined): string {
  return type ? TYPE_LABELS[type] ?? type.replace(/_/g, ' ') : '';
}
