import { Component, inject, Injectable } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { map, Observable } from 'rxjs';

export interface ConfirmOptions {
  title: string;
  message?: string;
  /** Optional key/value lines shown in a summary box (e.g. "Début" -> "09:00"). */
  details?: { label: string; value: string }[];
  confirmLabel?: string;
  cancelLabel?: string;
  /** 'danger' for destructive actions (red button and icon). */
  tone?: 'primary' | 'danger';
  icon?: string;
}

/** Generic confirmation dialog. Use ConfirmService.confirm() to open it. */
@Component({
  selector: 'app-ui-confirm-dialog',
  imports: [MatDialogModule, MatButton, MatIcon],
  template: `
    <div class="head" [attr.data-tone]="data.tone ?? 'primary'">
      <span class="icon" aria-hidden="true"><mat-icon>{{ data.icon ?? (data.tone === 'danger' ? 'warning' : 'help') }}</mat-icon></span>
      <h2 mat-dialog-title>{{ data.title }}</h2>
    </div>
    <mat-dialog-content>
      @if (data.message) { <p class="message">{{ data.message }}</p> }
      @if (data.details?.length) {
        <dl class="details">
          @for (d of data.details; track d.label) {
            <div><dt>{{ d.label }}</dt><dd>{{ d.value }}</dd></div>
          }
        </dl>
      }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button type="button" [mat-dialog-close]="false">{{ data.cancelLabel ?? 'Annuler' }}</button>
      <button mat-flat-button type="button" cdkFocusInitial [mat-dialog-close]="true"
              [class.danger]="data.tone === 'danger'">{{ data.confirmLabel ?? 'Confirmer' }}</button>
    </mat-dialog-actions>
  `,
  styles: `
    .head { display: flex; align-items: center; gap: var(--space-3); padding: var(--space-5) var(--space-6) 0;
      --tone: var(--color-primary); --tone-soft: var(--color-primary-soft); }
    .head[data-tone='danger'] { --tone: var(--color-danger); --tone-soft: var(--color-danger-soft); }
    .head h2[mat-dialog-title] { padding: 0; margin: 0; font-size: var(--text-lg); font-weight: 650; }
    .head h2[mat-dialog-title]::before { display: none; }
    .icon { display: grid; place-items: center; width: 40px; height: 40px; border-radius: 50%;
      color: var(--tone); background: var(--tone-soft); flex: none; }
    .message { color: var(--color-text-muted); }
    .details { margin: var(--space-4) 0 0; padding: var(--space-3) var(--space-4); border-radius: var(--radius-md);
      background: var(--color-surface-2); border: 1px solid var(--color-border); }
    .details div { display: flex; justify-content: space-between; gap: var(--space-4); padding: 4px 0; }
    dt { color: var(--color-text-muted); }
    dd { margin: 0; font-weight: 600; }
    .danger { --mdc-filled-button-container-color: var(--color-danger); --mdc-filled-button-label-text-color: #fff; }
  `,
})
export class UiConfirmDialogComponent {
  readonly data = inject<ConfirmOptions>(MAT_DIALOG_DATA);
}

@Injectable({ providedIn: 'root' })
export class ConfirmService {
  private readonly dialog = inject(MatDialog);

  /** Emits true if the user confirmed, false otherwise. */
  confirm(options: ConfirmOptions): Observable<boolean> {
    return this.dialog
      .open(UiConfirmDialogComponent, { data: options, width: '440px', maxWidth: '92vw', autoFocus: 'dialog' })
      .afterClosed()
      .pipe(map(result => result === true));
  }
}
