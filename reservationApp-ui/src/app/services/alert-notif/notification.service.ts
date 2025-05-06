// notification.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private notification = new BehaviorSubject<{type: string, message: string} | null>(null);
  notification$ = this.notification.asObservable();

  showSuccess(message: string) {
    this.notification.next({ type: 'success', message });
    this.clearAfterDelay();
  }

  showError(message: string) {
    this.notification.next({ type: 'error', message });
    this.clearAfterDelay();
  }

  clear() {
    this.notification.next(null);
  }

  private clearAfterDelay(delay: number = 5000) {
    setTimeout(() => this.clear(), delay);
  }
}
