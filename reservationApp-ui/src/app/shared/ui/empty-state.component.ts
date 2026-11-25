import { Component, input } from '@angular/core';
import { MatIcon } from '@angular/material/icon';

/** Friendly placeholder for empty lists and searches without results. */
@Component({
  selector: 'app-empty-state',
  imports: [MatIcon],
  template: `
    <div class="empty" role="status">
      <span class="icon" aria-hidden="true"><mat-icon>{{ icon() }}</mat-icon></span>
      <h3>{{ title() }}</h3>
      @if (message()) { <p>{{ message() }}</p> }
      <div class="actions"><ng-content /></div>
    </div>
  `,
  styles: `
    .empty {
      display: flex; flex-direction: column; align-items: center; text-align: center;
      gap: var(--space-2); padding: var(--space-10) var(--space-6);
    }
    .icon {
      display: grid; place-items: center; width: 56px; height: 56px; border-radius: 50%;
      background: var(--color-primary-soft); color: var(--color-primary); margin-bottom: var(--space-2);
      mat-icon { font-size: 28px; width: 28px; height: 28px; }
    }
    h3 { font-size: var(--text-lg); }
    p { color: var(--color-text-muted); max-width: 46ch; }
    .actions { margin-top: var(--space-3); }
    .actions:empty { display: none; }
  `,
})
export class EmptyStateComponent {
  readonly icon = input('inbox');
  readonly title = input.required<string>();
  readonly message = input<string>();
}
