
export interface AdminUser {
  id?: string;
  nom: string;
  prenom: string;
  email: string;
  numTel: string;
  role: string;
  fonction?: string;
  nomEtablissement?: string;
  structure?: string;
  linkedInLink?: string;
  espacesResponsables?: string[];
}