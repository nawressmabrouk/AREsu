import { AsyncPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { NotificationService, ToastType } from '../../services/alert-notif/notification.service';

const ICONS: Record<ToastType, string> = { success: 'check_circle', error: 'error', info: 'info', warning: 'warning' };

/** Renders the toasts of NotificationService. Placed once, in AppComponent. */
@Component({
  selector: 'app-toast-host',
  imports: [AsyncPipe, MatIcon],
  template: `
    <div class="toasts" aria-live="polite" aria-atomic="false">
      @for (t of notifications.toasts$ | async; track t.id) {
        <div class="toast" [attr.data-type]="t.type" [attr.role]="t.type === 'error' ? 'alert' : 'status'">
          <mat-icon class="icon" aria-hidden="true">{{ icons[t.type] }}</mat-icon>
          <p class="message">{{ t.message }}</p>
          <button type="button" class="close" (click)="notifications.dismiss(t.id)" aria-label="Fermer la notification">
            <mat-icon>close</mat-icon>
          </button>
        </div>
      }
    </div>
  `,
  styles: `
    .toasts {
      position: fixed; z-index: 2000; right: var(--space-4); bottom: var(--space-4);
      display: flex; flex-direction: column; gap: var(--space-2);
      width: min(400px, calc(100vw - 2 * var(--space-4)));
      pointer-events: none;
    }
    .toast {
      pointer-events: auto;
      display: flex; align-items: flex-start; gap: var(--space-3);
      padding: 12px 12px 12px 14px;
      background: var(--color-surface); color: var(--color-text);
      border: 1px solid var(--color-border); border-left: 4px solid var(--tone);
      border-radius: var(--radius-md); box-shadow: var(--shadow-lg);
      animation: slide-in 180ms var(--ease);
    }
    .icon { color: var(--tone); flex: none; }
    .message { flex: 1; font-size: var(--text-sm); padding-top: 2px; }
    .close {
      flex: none; border: 0; background: none; cursor: pointer; padding: 2px; border-radius: 6px;
      color: var(--color-text-muted); display: inline-flex;
      mat-icon { font-size: 18px; width: 18px; height: 18px; }
      &:hover { background: var(--color-surface-hover); color: var(--color-text); }
    }
    [data-type='success'] { --tone: var(--color-success); }
    [data-type='error'] { --tone: var(--color-danger); }
    [data-type='warning'] { --tone: var(--color-warning); }
    [data-type='info'] { --tone: var(--color-info); }
    @keyframes slide-in { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
  `,
})
export class ToastHostComponent {
  readonly notifications = inject(NotificationService);
  readonly icons = ICONS;
}
