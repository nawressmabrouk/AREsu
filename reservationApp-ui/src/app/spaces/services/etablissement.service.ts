import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class EtablissementService {
  private baseUrl = 'http://localhost:8080/api/etablissements';

  constructor(private http: HttpClient) { }

  // Récupérer tous les établissements
  getAllEtablissements(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/all`);
  }

  // Filtrer les établissements
  filterEtablissements(criteria: any): Observable<any[]> {
    return this.http.post<any[]>(`${this.baseUrl}/filter`, criteria);
  }

  // Récupérer un établissement avec ses espaces
  getEtablissementWithEspaces(id: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/with-espaces/${id}`);
  }
}       