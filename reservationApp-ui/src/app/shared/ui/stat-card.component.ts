import { Component, input } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { Tone } from './status';

/** KPI tile: icon, label and value. Set [active] when it acts as a filter. */
@Component({
  selector: 'app-stat-card',
  imports: [MatIcon],
  host: { '[class.active]': 'active()', '[attr.data-tone]': 'tone()' },
  template: `
    <span class="icon" aria-hidden="true"><mat-icon>{{ icon() }}</mat-icon></span>
    <span class="text">
      <span class="label">{{ label() }}</span>
      <span class="value">{{ value() }}</span>
      @if (hint()) { <span class="hint">{{ hint() }}</span> }
    </span>
  `,
  styles: `
    :host {
      display: flex; align-items: center; gap: var(--space-4);
      padding: var(--space-4) var(--space-5);
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-xs);
      transition: border-color var(--duration) var(--ease), box-shadow var(--duration) var(--ease);
      --tone: var(--color-primary); --tone-soft: var(--color-primary-soft);
    }
    :host(.active) { border-color: var(--tone); box-shadow: 0 0 0 1px var(--tone), var(--shadow-sm); }
    :host([data-tone='success']) { --tone: var(--color-success); --tone-soft: var(--color-success-soft); }
    :host([data-tone='warning']) { --tone: var(--color-warning); --tone-soft: var(--color-warning-soft); }
    :host([data-tone='danger'])  { --tone: var(--color-danger);  --tone-soft: var(--color-danger-soft); }
    :host([data-tone='info'])    { --tone: var(--color-info);    --tone-soft: var(--color-info-soft); }
    :host([data-tone='accent'])  { --tone: var(--color-accent);  --tone-soft: var(--color-accent-soft); }
    :host([data-tone='neutral']) { --tone: var(--color-neutral); --tone-soft: var(--color-neutral-soft); }
    .icon {
      display: grid; place-items: center; flex: none;
      width: 44px; height: 44px; border-radius: var(--radius-md);
      color: var(--tone); background: var(--tone-soft);
    }
    .text { display: flex; flex-direction: column; min-width: 0; }
    .label { font-size: var(--text-sm); color: var(--color-text-muted); }
    .value { font-size: var(--text-2xl); font-weight: 700; line-height: 1.2; font-variant-numeric: tabular-nums; }
    .hint { font-size: var(--text-xs); color: var(--color-text-subtle); }
  `,
})
export class StatCardComponent {
  readonly label = input.required<string>();
  readonly value = input<string | number | null>(0);
  readonly icon = input('insights');
  readonly tone = input<Tone>('primary');
  readonly hint = input<string>();
  readonly active = input(false);
}
