import { Injectable } from '@angular/core';
import { BehaviorSubject, map } from 'rxjs';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: number;
  type: ToastType;
  message: string;
}

/**
 * Toast notifications, displayed by <app-toast-host> (rendered once in AppComponent).
 * The public API (showSuccess / showError / clear / notification$) is unchanged.
 */
@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private readonly toastsSubject = new BehaviorSubject<Toast[]>([]);
  private nextId = 1;
  private readonly displayDuration = 5000;

  /** All visible toasts (newest last). */
  readonly toasts$ = this.toastsSubject.asObservable();

  /** Latest toast or null (kept for backwards compatibility). */
  readonly notification$ = this.toasts$.pipe(map(list => list.at(-1) ?? null));

  showSuccess(message: string) {
    this.show('success', message);
  }

  showError(message: string) {
    this.show('error', message, 7000);
  }

  showInfo(message: string) {
    this.show('info', message);
  }

  showWarning(message: string) {
    this.show('warning', message, 7000);
  }

  dismiss(id: number) {
    this.toastsSubject.next(this.toastsSubject.value.filter(t => t.id !== id));
  }

  clear() {
    this.toastsSubject.next([]);
  }

  private show(type: ToastType, message: string, duration = this.displayDuration) {
    const toast: Toast = { id: this.nextId++, type, message };
    // Keep at most 4 toasts on screen
    this.toastsSubject.next([...this.toastsSubject.value, toast].slice(-4));
    setTimeout(() => this.dismiss(toast.id), duration);
  }
}
