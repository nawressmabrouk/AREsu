import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Etablissement } from '../../models/etablissement.model';

@Injectable({
  providedIn: 'root'
})
export class SuperAdminService {
  private apiUrl = '/api/super-admin';

  constructor(private http: HttpClient) { }

  getAllEtablissements(): Observable<Etablissement[]> {
    return this.http.get<Etablissement[]>(`${this.apiUrl}/etablissements`);
  }

  getEtablissementDetails(id: string): Observable<Etablissement> {
    return this.http.get<Etablissement>(`${this.apiUrl}/etablissements/${id}`);
  }
}