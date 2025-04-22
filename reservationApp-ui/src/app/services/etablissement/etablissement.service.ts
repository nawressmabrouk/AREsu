import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

// Interfaces à l'extérieur de @Injectable()
export interface Etablissement {
  id: string;
  nom: string;
  type: string;
  zone: string;
}

export interface Espace {
  id: string;
  nom: string;
  type: string;
  capacite: number;
  equipements: any[]; // Tu peux créer un type plus précis si nécessaire
}

export interface EtablissementWithEspaces extends Etablissement {
  espaces: Espace[];
}

@Injectable({
  providedIn: 'root'
})
export class EtablissementService {
  private baseUrl = 'http://localhost:8080/api/etablissements';

  constructor(private http: HttpClient) {}

  // Récupérer tous les établissements
  getAllEtablissements(): Observable<Etablissement[]> {
    return this.http.get<Etablissement[]>(`${this.baseUrl}/all`);
  }

  // Filtrer les établissements
  filterEtablissements(criteria: any): Observable<Etablissement[]> {
    return this.http.post<Etablissement[]>(`${this.baseUrl}/filter`, criteria);
  }

  // Récupérer un établissement avec ses espaces
  getEtablissementWithEspaces(id: string): Observable<EtablissementWithEspaces> {
    return this.http.get<EtablissementWithEspaces>(`${this.baseUrl}/with-espaces/${id}`);
  }
  
}

