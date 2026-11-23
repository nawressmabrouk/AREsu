import { Component, input, output, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatTooltip } from '@angular/material/tooltip';
import { Etablissement } from '../../models/etablissement.model';
import { categoryLabel, typeLabel } from '../../shared/space-catalog';
import { EmptyStateComponent } from '../../shared/ui/empty-state.component';

/** Read-only details of an establishment: general information, room managers and spaces. */
@Component({
  selector: 'app-etablissement-details',
  imports: [MatButtonModule, MatIcon, MatTooltip, EmptyStateComponent],
  templateUrl: './etablissement-details.component.html',
  styleUrl: './etablissement-details.component.scss',
})
export class EtablissementDetailsComponent {
  readonly etablissement = input<Etablissement | null>(null);
  readonly close = output<void>();

  readonly activeTab = signal<'espaces' | 'responsables'>('espaces');
  readonly typeLabel = typeLabel;
  readonly categoryLabel = categoryLabel;

  // Lists can be missing in the API data
  espaces(e: Etablissement) {
    return e.espaces ?? [];
  }

  responsables(e: Etablissement) {
    return e.responsables ?? [];
  }

  initials(r: { prenom?: string; nom?: string }): string {
    return `${r.prenom?.[0] ?? ''}${r.nom?.[0] ?? ''}`;
  }

  totalCapacity(e: Etablissement): number {
    return this.espaces(e).reduce((sum, s) => sum + (Number(s.capacite) || 0), 0);
  }

  /** The API sends each space with its room manager object (or null). */
  responsableOf(espace: unknown): string {
    const r = (espace as { responsable?: { prenom?: string; nom?: string } | null }).responsable;
    return r ? `${r.prenom ?? ''} ${r.nom ?? ''}`.trim() : '';
  }
}
