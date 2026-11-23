
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ChatService {

  private apiUrl = '/api/chat'; 

  constructor(private http: HttpClient) {}

  askBot(question: string): Observable<string> {
    return this.http.post(this.apiUrl, question, { responseType: 'text' });
  }
}
