import { Component, computed, input } from '@angular/core';
import { normalizeStatus, STATUS_META } from './status';

/** Coloured pill for a reservation status (works with accented and unaccented values). */
@Component({
  selector: 'app-status-badge',
  template: `<span class="badge" [attr.data-tone]="meta().tone"><span class="dot" aria-hidden="true"></span>{{ meta().label }}</span>`,
  styles: `
    :host { display: inline-flex; }
    .badge {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 3px 10px; border-radius: var(--radius-full);
      font-size: var(--text-xs); font-weight: 600; line-height: 1.6; white-space: nowrap;
      color: var(--tone); background: var(--tone-soft);
    }
    .dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
    [data-tone='success'] { --tone: var(--color-success); --tone-soft: var(--color-success-soft); }
    [data-tone='warning'] { --tone: var(--color-warning); --tone-soft: var(--color-warning-soft); }
    [data-tone='danger']  { --tone: var(--color-danger);  --tone-soft: var(--color-danger-soft); }
    [data-tone='info']    { --tone: var(--color-info);    --tone-soft: var(--color-info-soft); }
    [data-tone='neutral'] { --tone: var(--color-neutral); --tone-soft: var(--color-neutral-soft); }
  `,
})
export class StatusBadgeComponent {
  readonly status = input<string | null | undefined>();

  readonly meta = computed(() => {
    const key = normalizeStatus(this.status());
    return key ? STATUS_META[key] : { label: this.status() || '—', tone: 'neutral' as const, icon: 'help' };
  });
}
