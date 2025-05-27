/*import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private readonly apiUrl = 'http://localhost:8080/api/chat';

  streamChat(message: string, userId: string): Observable<string> {
    return new Observable(observer => {
      // Remove manual encoding - URLSearchParams auto-encodes values
      const params = new URLSearchParams({
        userId: userId,
        message: message
      });

      const abortController = new AbortController();
      const timeoutId = setTimeout(() => {
        abortController.abort();
        observer.error('Request timeout');
        observer.complete();
      }, 30000);

      const url = `${this.apiUrl}/stream?userId=${userId}`;


fetch(url, {
  method: 'POST',
  headers: {
    'Accept': 'text/event-stream',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(message), // send message in request body
  signal: abortController.signal
})
      .then(response => {
        clearTimeout(timeoutId);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        if (!response.body) throw new Error('No response body');

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        const readChunk = () => {
          reader.read().then(({ done, value }) => {
            if (done) {
              observer.complete();
              return;
            }

            const chunk = decoder.decode(value, { stream: true });
            observer.next(chunk);
            readChunk();
          }).catch(error => {
            observer.error(error);
            observer.complete();
          });
        };

        readChunk();
      })
      .catch(error => {
        clearTimeout(timeoutId);
        observer.error(error.message || 'Service unavailable');
        observer.complete();
      });

      return () => {
        clearTimeout(timeoutId);
        abortController.abort();
      };
    });
  }
}*/

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ChatService {

  private apiUrl = 'http://localhost:8080/api/chat'; // URL de ton backend

  constructor(private http: HttpClient) {}

  askBot(question: string): Observable<string> {
    return this.http.post(this.apiUrl, question, { responseType: 'text' });
  }
}
