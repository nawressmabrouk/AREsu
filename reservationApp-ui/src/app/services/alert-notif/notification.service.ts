// Dans votre notification.service.ts
import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private notificationSubject = new Subject<any>();
  notification$ = this.notificationSubject.asObservable();
  
  private displayDuration = 5000; 

  showSuccess(message: string) {
    this.notificationSubject.next({ type: 'success', message });
    this.autoClear();
  }

  showError(message: string) {
    this.notificationSubject.next({ type: 'error', message });
    this.autoClear();
  }

  clear() {
    this.notificationSubject.next(null);
  }

  private autoClear() {
    setTimeout(() => this.clear(), this.displayDuration);
  }
}