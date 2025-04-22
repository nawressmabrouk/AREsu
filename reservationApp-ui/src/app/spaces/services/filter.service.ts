import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Etablissement } from './etablissement.service';

@Injectable({
  providedIn: 'root'
})
export class FilterService {
  private readonly baseUrl = 'http://localhost:8080/api/etablissements/filter';

  constructor(private http: HttpClient) { }

  filterEtablissements(criteria: { zone?: string; type?: string }): Observable<Etablissement[]> {
    let params = new HttpParams();
    
    if (criteria.zone) {
      params = params.set('zone', criteria.zone);
    }
    
    if (criteria.type) {
      params = params.set('type', criteria.type);
    }

    return this.http.get<Etablissement[]>(this.baseUrl, { params });
  }
}