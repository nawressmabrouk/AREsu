import { DatePipe } from '@angular/common';
import { Component, computed, input, output, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatInput } from '@angular/material/input';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltip } from '@angular/material/tooltip';
import { roleLabel } from '../../../layout/nav';
import { Reservation } from '../../../models/reservation.model';
import { EmptyStateComponent } from '../../ui/empty-state.component';
import { SkeletonComponent } from '../../ui/skeleton.component';
import { hasStatus } from '../../ui/status';
import { StatusBadgeComponent } from '../../ui/status-badge.component';

/**
 * What the list lets the user do:
 * - decide: choose approved equipment, accept or refuse (pending requests)
 * - view: mark as seen (secretary "non vues")
 * - accepted: cancel a future reservation
 * - readonly: details only
 */
export type ReservationTableMode = 'decide' | 'view' | 'accepted' | 'readonly';

export interface ApproveEvent {
  reservation: Reservation;
  equipments: string[];
}

/** Reservation list shared by the secretary and room-manager pages: search, filter, sort, pages, details. */
@Component({
  selector: 'app-reservation-table',
  imports: [
    DatePipe,
    MatButtonModule,
    MatCheckbox,
    MatFormFieldModule,
    MatIcon,
    MatInput,
    MatPaginator,
    MatProgressSpinner,
    MatSelectModule,
    MatTooltip,
    EmptyStateComponent,
    SkeletonComponent,
    StatusBadgeComponent,
  ],
  templateUrl: './reservation-table.component.html',
  styleUrl: './reservation-table.component.scss',
})
export class ReservationTableComponent {
  readonly reservations = input<Reservation[]>([]);
  readonly loading = input(false);
  readonly failed = input(false);
  readonly mode = input<ReservationTableMode>('readonly');
  /** Ids of reservations with an action in progress (buttons disabled, spinner shown). */
  readonly busyIds = input<ReadonlySet<string>>(new Set());
  readonly emptyIcon = input('inbox');
  readonly emptyTitle = input('Aucune demande');
  readonly emptyMessage = input<string>();

  readonly approve = output<ApproveEvent>();
  readonly reject = output<Reservation>();
  readonly markSeen = output<Reservation>();
  readonly cancel = output<Reservation>();
  readonly retry = output<void>();

  readonly search = signal('');
  readonly espace = signal('');
  readonly sort = signal<'asc' | 'desc'>('asc');
  readonly pageIndex = signal(0);
  readonly pageSize = signal(10);
  readonly expandedId = signal<string | null>(null);
  /** Equipment ticked for approval, per reservation id. */
  private readonly approved = signal<Record<string, string[]>>({});

  readonly roleLabel = roleLabel;

  readonly espaces = computed(() =>
    [...new Set(this.reservations().map(r => r.espaceNom).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'fr')),
  );

  readonly filtered = computed(() => {
    const q = normalize(this.search().trim());
    const espace = this.espace();
    const dir = this.sort() === 'asc' ? 1 : -1;
    return this.reservations()
      .filter(r => !espace || r.espaceNom === espace)
      .filter(r => !q || normalize([r.intituleAction, r.responsableAction, r.emailR, r.espaceNom, r.cible].join(' ')).includes(q))
      .sort((a, b) => dir * (time(a.heureDebut) - time(b.heureDebut)));
  });

  /** Current page index, kept in range when the list shrinks (after an action or a filter). */
  readonly page = computed(() => {
    const last = Math.max(0, Math.ceil(this.filtered().length / this.pageSize()) - 1);
    return Math.min(this.pageIndex(), last);
  });

  readonly paged = computed(() => {
    const start = this.page() * this.pageSize();
    return this.filtered().slice(start, start + this.pageSize());
  });

  readonly hasFilters = computed(() => !!this.search().trim() || !!this.espace());

  setSearch(value: string): void {
    this.search.set(value);
    this.pageIndex.set(0);
  }

  setEspace(value: string): void {
    this.espace.set(value);
    this.pageIndex.set(0);
  }

  resetFilters(): void {
    this.setSearch('');
    this.setEspace('');
  }

  onPage(e: PageEvent): void {
    this.pageSize.set(e.pageSize);
    this.pageIndex.set(e.pageIndex);
  }

  toggle(r: Reservation): void {
    this.expandedId.update(id => (id === r.id ? null : r.id));
  }

  /** Equipment lists can be missing in older documents. */
  eqs(r: Reservation): string[] {
    return r.equipements ?? [];
  }

  approvedEqs(r: Reservation): string[] {
    return r.approvedEquipements ?? [];
  }

  isBusy(r: Reservation): boolean {
    return this.busyIds().has(r.id);
  }

  isApproved(r: Reservation, equipment: string): boolean {
    return this.approved()[r.id]?.includes(equipment) ?? false;
  }

  toggleApproved(r: Reservation, equipment: string): void {
    this.approved.update(all => {
      const current = all[r.id] ?? [];
      const next = current.includes(equipment) ? current.filter(e => e !== equipment) : [...current, equipment];
      return { ...all, [r.id]: next };
    });
  }

  approvedCount(r: Reservation): number {
    return this.approved()[r.id]?.length ?? 0;
  }

  onApprove(r: Reservation): void {
    this.approve.emit({ reservation: r, equipments: [...(this.approved()[r.id] ?? [])] });
  }

  canCancel(r: Reservation): boolean {
    return hasStatus(r.statut, 'ACCEPTEE') && time(r.heureDebut) > Date.now();
  }

  isPending(r: Reservation): boolean {
    return hasStatus(r.statut, 'EN_ATTENTE');
  }
}

function normalize(text: string): string {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

function time(value: Date | string | null | undefined): number {
  return value ? new Date(value).getTime() : 0;
}
