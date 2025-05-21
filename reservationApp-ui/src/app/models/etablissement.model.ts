import { User } from "../shared/interfaces/user.model";
import { Espace } from "./espace.model";

export interface Etablissement {
  id: string;
  nom: string;
  adresse: string;
  zone: string;
  type: string;
  logo: string;
  secretaireGeneral?: User;
  responsables: User[];
  espaces: Espace[];
}