import { Component, computed, input } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { Etablissement } from '../../models/etablissement.model';

/** Establishment summary (logo, name, address, counts) used in the super-admin list. */
@Component({
  selector: 'app-etablissement-card',
  imports: [MatIcon],
  host: { '[class.active]': 'isActive()' },
  template: `
    @if (etablissement(); as e) {
      <span class="logo" aria-hidden="true">
        @if (e.logo) { <img [src]="e.logo" alt="" loading="lazy" /> } @else { {{ initials() }} }
      </span>
      <span class="text">
        <span class="name">{{ e.nom }}</span>
        @if (e.adresse) { <span class="address">{{ e.adresse }}</span> }
        <span class="counts">
          <span><mat-icon aria-hidden="true">meeting_room</mat-icon>{{ nbEspaces() }} espace{{ nbEspaces() > 1 ? 's' : '' }}</span>
          <span><mat-icon aria-hidden="true">badge</mat-icon>{{ nbResponsables() }} responsable{{ nbResponsables() > 1 ? 's' : '' }}</span>
        </span>
      </span>
    }
  `,
  styles: `
    :host {
      display: flex; gap: var(--space-3); align-items: flex-start;
      padding: var(--space-4);
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-xs);
      transition: border-color var(--duration) var(--ease), box-shadow var(--duration) var(--ease);
    }
    :host(:hover) { border-color: var(--color-border-strong); box-shadow: var(--shadow-sm); }
    :host(.active) { border-color: var(--color-primary); box-shadow: 0 0 0 1px var(--color-primary), var(--shadow-sm); }
    .logo {
      display: grid; place-items: center; flex: none; overflow: hidden;
      width: 48px; height: 48px; border-radius: var(--radius-md);
      background: var(--color-primary-soft); color: var(--color-primary); font-weight: 700;
    }
    .logo img { width: 100%; height: 100%; object-fit: contain; background: #fff; }
    .text { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
    .name { font-weight: 650; line-height: 1.3; }
    .address { font-size: var(--text-xs); color: var(--color-text-muted); }
    .counts { display: flex; flex-wrap: wrap; gap: var(--space-3); margin-top: var(--space-2);
      font-size: var(--text-xs); color: var(--color-text-muted); }
    .counts span { display: inline-flex; align-items: center; gap: 4px; }
    .counts mat-icon { font-size: 16px; width: 16px; height: 16px; }
  `,
})
export class EtablissementCardComponent {
  readonly etablissement = input<Etablissement>();
  readonly isActive = input(false);

  // Lists can be missing in the API data
  readonly nbEspaces = computed(() => this.etablissement()?.espaces?.length ?? 0);
  readonly nbResponsables = computed(() => this.etablissement()?.responsables?.length ?? 0);

  readonly initials = computed(() =>
    (this.etablissement()?.nom ?? '?')
      .split(/\s+/)
      .filter(w => w.length > 2 || /^[A-Z]/.test(w))
      .slice(0, 2)
      .map(w => w[0])
      .join('')
      .toUpperCase(),
  );
}
