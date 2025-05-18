import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { AuthService } from '../auth/auth.service';


// Interfaces remain the same
export interface Etablissement {
  id: string;
  nom: string;
  type: string;
  zone: string;
  adresse: string;
  logo: string;
  googleCalendarId?: string;
  calendarEmail?: string;
}

export interface Espace {
  id: string;
  nom: string;
  type: string;
  categorie: string;
  capacite: number;
  equipement: string[];
}

@Injectable({
  providedIn: 'root'
})
export class EtablissementService {
  private baseUrl = 'http://localhost:8080/api/etablissements';

  constructor(private http: HttpClient,
    private authService: AuthService
  ) {}


  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    if (!token) {
      throw new Error('No authentication token available');
    }
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }



  // Get all Etablissements
  getAllEtablissements(): Observable<Etablissement[]> {
    return this.http.get<Etablissement[]>(`${this.baseUrl}/all`);
  }

  filterEtablissements(filters: { type?: string, zone?: string }): Observable<Etablissement[]> {
    let params = new HttpParams();
    if (filters.type) params = params.set('type', filters.type);
    if (filters.zone) params = params.set('zone', filters.zone);
    return this.http.get<Etablissement[]>(`${this.baseUrl}/filter`, { params });
  }


  getAllEspacesForEtablissement(etablissementId: string): Observable<Espace[]> {
    // Normalize the ID by replacing common inconsistencies
    const normalizedId = etablissementId
      .replace('ObjectId(', '')
      .replace(')', '')
      .trim();
      
    console.log('Normalized establishment ID:', normalizedId);
    
    return this.http.get<Espace[]>(`${this.baseUrl}/${normalizedId}/espaces`).pipe(
      catchError(err => {
        console.error('Error fetching spaces:', err);
        return throwError(() => err);
      })
    );
  }

  // Get FILTERED spaces for an establishment
  getFilteredEspacesForEtablissement(
    etablissementId: string,
    filters: { categorie?: string, type?: string }
  ): Observable<Espace[]> {
    let params = new HttpParams();
    if (filters.categorie) params = params.set('categorie', filters.categorie);
    if (filters.type) params = params.set('type', filters.type);

    return this.validateAndGetEspaces(
      `${this.baseUrl}/${etablissementId}/espaces/filter`,
      params
    );
  }

  private validateAndGetEspaces(url: string, params?: HttpParams): Observable<Espace[]> {
    return this.http.get<Espace[]>(url, { params, observe: 'response' }).pipe(
      map(response => {
        console.log('API Response:', response);
        return response.body || [];
      }),
      catchError(err => {
        console.error('API Error:', err);
        return throwError(() => err);
      })
    );
  }

/*
  getEspaceById(espaceId: string): Observable<Espace> {
    // Normalize the ID by replacing common inconsistencies
    const normalizedId = espaceId
      .replace('ObjectId(', '')
      .replace(')', '')
      .trim();
      
    console.log('Fetching space with ID:', normalizedId);
    
    return this.http.get<Espace>(`${this.baseUrl}/espaces/id/${normalizedId}`).pipe(
      catchError(err => {
        console.error('Error fetching space:', err);
        return throwError(() => err);
      })
    );
  }*/

  getEtablissementById(etablissementId: string): Observable<Etablissement> {
    // Normalize the ID by replacing common inconsistencies
    const normalizedId = etablissementId
      .replace('ObjectId(', '')
      .replace(')', '')
      .trim();
      
    console.log('Fetching establishment with ID:', normalizedId);
    
    return this.http.get<Etablissement>(`${this.baseUrl}/id/${normalizedId}`).pipe(
      catchError(err => {
        console.error('Error fetching establishment:', err);
        return throwError(() => err);
      })
    );
}

getEspaceById(espaceId: string): Observable<any> {
  return this.http.get(
    `${this.baseUrl}/espaces/id/${espaceId}`,
    { headers: this.getAuthHeaders() }
  ).pipe(
    catchError(error => {
      if (error.status === 401 || error.status === 403) {
        this.authService.logout();
      }
      return throwError(() => error);
    })
  );
}

private handleError(error: any): Observable<never> {
  console.error('API Error:', error);
  if (error.status === 401 || error.status === 403) {
    this.authService.logout();
  }
  return throwError(() => error);
}

  }







