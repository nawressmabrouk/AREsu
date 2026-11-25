import { Component, input } from '@angular/core';

/** Surface with an optional header (title, subtitle, [card-actions]) and padded body. */
@Component({
  selector: 'app-card',
  template: `
    @if (title()) {
      <div class="card-header">
        <div>
          <h2 class="card-title">{{ title() }}</h2>
          @if (subtitle()) { <p class="card-subtitle">{{ subtitle() }}</p> }
        </div>
        <div class="card-actions"><ng-content select="[card-actions]" /></div>
      </div>
    }
    <div class="card-body" [class.flush]="flush()"><ng-content /></div>
  `,
  styles: `
    :host {
      display: block;
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-sm);
      overflow: hidden;
    }
    .card-header {
      display: flex; align-items: center; justify-content: space-between; gap: var(--space-3);
      padding: var(--space-4) var(--space-5);
      border-bottom: 1px solid var(--color-border);
    }
    .card-title { font-size: var(--text-lg); font-weight: 650; }
    .card-subtitle { font-size: var(--text-sm); color: var(--color-text-muted); margin-top: 2px; }
    .card-actions:empty { display: none; }
    .card-body { padding: var(--space-5); }
    .card-body.flush { padding: 0; }
  `,
})
export class CardComponent {
  readonly title = input<string>();
  readonly subtitle = input<string>();
  /** Remove the body padding (for tables and lists). */
  readonly flush = input(false);
}
