import { Component, input } from '@angular/core';

/** Page title + optional subtitle, with an [actions] slot on the right. */
@Component({
  selector: 'app-page-header',
  template: `
    <header class="page-header">
      <div class="text">
        @if (eyebrow()) { <p class="eyebrow">{{ eyebrow() }}</p> }
        <h1>{{ title() }}</h1>
        @if (subtitle()) { <p class="subtitle">{{ subtitle() }}</p> }
      </div>
      <div class="actions"><ng-content select="[actions]" /></div>
    </header>
  `,
  styles: `
    .page-header {
      display: flex; flex-wrap: wrap; align-items: flex-end; justify-content: space-between;
      gap: var(--space-4); margin-bottom: var(--space-6);
    }
    .eyebrow {
      font-size: var(--text-xs); font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase;
      color: var(--color-primary); margin-bottom: var(--space-1);
    }
    h1 { font-size: var(--text-2xl); font-weight: 700; }
    .subtitle { margin-top: var(--space-1); color: var(--color-text-muted); max-width: 70ch; }
    .actions { display: flex; flex-wrap: wrap; gap: var(--space-2); }
    .actions:empty { display: none; }
  `,
})
export class PageHeaderComponent {
  readonly title = input.required<string>();
  readonly subtitle = input<string>();
  readonly eyebrow = input<string>();
}
