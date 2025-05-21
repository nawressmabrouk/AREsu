export interface User {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  numTel: string;
  role: Role;
  fonction: string;
  nomEtablissement: string;
   
  password?: string; // Optional as it shouldn't be exposed
  structure: string;
  linkedInLink: string;
  enabled?: boolean;
  passwordChangeRequired?: boolean;
  isPartenaire?: boolean;
  espacesResponsables?: string[];
   etablissementId: string;
}

export enum Role {
  DEMANDEUR_INTERNE = 'DEMANDEUR_INTERNE',
  DEMANDEUR_EXTERNE = 'DEMANDEUR_EXTERNE',
  SECRETAIRE_GENERALE = 'SECRETAIRE_GENERALE',
  ADMIN = 'ADMIN',
  RESPONSABLE_SALLE = 'RESPONSABLE_SALLE'
}