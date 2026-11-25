import { Component, computed, inject, OnInit, signal, viewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { filter, finalize, Observable, switchMap } from 'rxjs';
import { Espace } from '../models/espace.model';
import { Reservation, StatusReservation } from '../models/reservation.model';
import { ReservationsCalendarComponent } from '../reservations-calendar/reservations-calendar.component';
import { NotificationService } from '../services/alert-notif/notification.service';
import { RoomManagerService } from '../services/room-manager/room-manager.service';
import { UserService } from '../services/user/user.service';
import { ApproveEvent, ReservationTableComponent, reservationSummary } from '../shared/components/reservation-table/reservation-table.component';
import { SpaceFormService } from '../shared/components/space-form-dialog/space-form-dialog.component';
import { categoryLabel, typeLabel } from '../shared/space-catalog';
import { apiErrorMessage } from '../shared/ui/api-error';
import { ConfirmService } from '../shared/ui/confirm-dialog.component';
import { EmptyStateComponent } from '../shared/ui/empty-state.component';
import { PageHeaderComponent } from '../shared/ui/page-header.component';
import { SkeletonComponent } from '../shared/ui/skeleton.component';
import { StatCardComponent } from '../shared/ui/stat-card.component';

type ListKey = 'pending' | 'accepted' | 'refused';
type View = ListKey | 'spaces' | 'calendar';

interface ListState<T> {
  items: T[];
  loading: boolean;
  failed: boolean;
}

const VIEWS: { key: View; label: string; icon: string; description: string }[] = [
  { key: 'pending', label: 'En attente', icon: 'pending_actions',
    description: 'Demandes de réservation de vos espaces : cochez les équipements accordés puis acceptez ou refusez.' },
  { key: 'accepted', label: 'Acceptées', icon: 'check_circle',
    description: "Réservations acceptées. Celles qui n'ont pas encore commencé peuvent être annulées." },
  { key: 'refused', label: 'Refusées', icon: 'cancel', description: 'Demandes que vous avez refusées.' },
  { key: 'spaces', label: 'Mes espaces', icon: 'meeting_room', description: 'Les espaces dont vous êtes responsable.' },
  { key: 'calendar', label: 'Calendrier', icon: 'calendar_month', description: 'Toutes les réservations de votre établissement.' },
];

const STATUS_OF: Record<ListKey, StatusReservation> = {
  pending: StatusReservation.EN_ATTENTE,
  accepted: StatusReservation.ACCEPTEE,
  refused: StatusReservation.REFUSEE,
};

@Component({
  selector: 'app-room-manager',
  imports: [
    MatButtonModule,
    MatIcon,
    EmptyStateComponent,
    PageHeaderComponent,
    ReservationsCalendarComponent,
    ReservationTableComponent,
    SkeletonComponent,
    StatCardComponent,
  ],
  templateUrl: './room-manager.component.html',
  styleUrl: './room-manager.component.scss',
})
export class RoomManagerComponent implements OnInit {
  private readonly roomManagerService = inject(RoomManagerService);
  private readonly userService = inject(UserService);
  private readonly confirm = inject(ConfirmService);
  private readonly spaceForm = inject(SpaceFormService);
  private readonly toast = inject(NotificationService);

  private readonly calendar = viewChild(ReservationsCalendarComponent);

  readonly views = VIEWS;
  readonly view = signal<View>('pending');
  readonly current = computed(() => VIEWS.find(v => v.key === this.view())!);

  readonly lists = signal<Record<ListKey, ListState<Reservation>>>({
    pending: { items: [], loading: true, failed: false },
    accepted: { items: [], loading: true, failed: false },
    refused: { items: [], loading: true, failed: false },
  });
  readonly spaces = signal<ListState<Espace>>({ items: [], loading: true, failed: false });

  /** null while loading, '' when the account has no establishment. */
  readonly etablissementId = signal<string | null>(null);
  readonly busy = signal<ReadonlySet<string>>(new Set());

  readonly categoryLabel = categoryLabel;
  readonly typeLabel = typeLabel;

  ngOnInit(): void {
    this.userService.getProfile().subscribe({
      next: profile => this.etablissementId.set(profile.etablissementId ?? ''),
      error: () => this.etablissementId.set(''),
    });
    this.refresh();
  }

  count(key: View): number | null {
    if (key === 'calendar') return null;
    const state = key === 'spaces' ? this.spaces() : this.lists()[key];
    return state.loading ? null : state.items.length;
  }

  setView(view: View): void {
    this.view.set(view);
  }

  refresh(): void {
    (Object.keys(STATUS_OF) as ListKey[]).forEach(key => this.load(key));
    this.loadSpaces();
    this.calendar()?.loadSlots();
  }

  /** silent: refresh without the loading skeleton (after an action). */
  load(key: ListKey, silent = false): void {
    if (!silent) this.patch(key, { loading: true, failed: false });
    this.roomManagerService.getReservationsByStatus(STATUS_OF[key]).subscribe({
      next: items => this.patch(key, { items, loading: false, failed: false }),
      error: () => this.patch(key, { loading: false, failed: !silent || !this.lists()[key].items.length }),
    });
  }

  loadSpaces(silent = false): void {
    if (!silent) this.spaces.update(s => ({ ...s, loading: true, failed: false }));
    this.roomManagerService.getManagedSpaces().subscribe({
      next: items => this.spaces.set({ items, loading: false, failed: false }),
      error: () => this.spaces.update(s => ({ ...s, loading: false, failed: !silent || !s.items.length })),
    });
  }

  approve({ reservation, equipments }: ApproveEvent): void {
    const requested = reservation.equipements?.length ?? 0;
    this.confirm
      .confirm({
        title: 'Accepter la demande ?',
        message: requested && !equipments.length
          ? "Aucun équipement n'est coché : la réservation sera acceptée sans équipement."
          : 'Le demandeur sera informé de votre décision.',
        details: reservationSummary(reservation, requested ? equipments.join(', ') || 'Aucun' : undefined),
        confirmLabel: 'Accepter',
        icon: 'check_circle',
      })
      .pipe(
        filter(Boolean),
        switchMap(() => this.track(reservation.id, this.roomManagerService.makeDecision(reservation.id, true, equipments))),
      )
      .subscribe({
        next: () => {
          this.toast.showSuccess('Réservation acceptée.');
          this.afterChange('pending', 'accepted');
        },
        error: err => {
          this.toast.showError(apiErrorMessage(err, "L'acceptation a échoué."));
          this.afterChange('pending');
        },
      });
  }

  reject(reservation: Reservation): void {
    this.confirm
      .confirm({
        title: 'Refuser la demande ?',
        message: 'Le demandeur sera informé du refus.',
        details: reservationSummary(reservation),
        confirmLabel: 'Refuser',
        tone: 'danger',
        icon: 'cancel',
      })
      .pipe(
        filter(Boolean),
        switchMap(() => this.track(reservation.id, this.roomManagerService.makeDecision(reservation.id, false))),
      )
      .subscribe({
        next: () => {
          this.toast.showSuccess('Réservation refusée.');
          this.afterChange('pending', 'refused');
        },
        error: err => {
          this.toast.showError(apiErrorMessage(err, 'Le refus a échoué.'));
          this.afterChange('pending');
        },
      });
  }

  cancel(reservation: Reservation): void {
    this.confirm
      .prompt({
        title: 'Annuler la réservation ?',
        message: 'La réservation sera annulée et retirée du calendrier. Le créneau redeviendra disponible.',
        details: reservationSummary(reservation),
        input: { label: "Motif de l'annulation (facultatif)", multiline: true },
        confirmLabel: 'Annuler la réservation',
        cancelLabel: 'Retour',
        tone: 'danger',
        icon: 'event_busy',
      })
      .pipe(
        filter((reason): reason is string => reason !== null),
        switchMap(reason => this.track(reservation.id, this.roomManagerService.cancelReservation(reservation.id, reason || undefined))),
      )
      .subscribe({
        next: () => {
          this.toast.showSuccess('Réservation annulée.');
          this.afterChange('accepted');
        },
        error: err => this.toast.showError(apiErrorMessage(err, "L'annulation a échoué.")),
      });
  }

  editSpace(espace: Espace): void {
    this.spaceForm
      .open({ espace })
      .pipe(
        filter(value => !!value),
        switchMap(value => this.track(espace.id, this.roomManagerService.updateSpace(espace.id, { ...espace, ...value }))),
      )
      .subscribe({
        next: () => {
          this.toast.showSuccess('Espace enregistré.');
          this.loadSpaces(true);
        },
        error: err => this.toast.showError(apiErrorMessage(err, "L'espace n'a pas pu être enregistré.")),
      });
  }

  deleteSpace(espace: Espace): void {
    this.confirm
      .confirm({
        title: `Supprimer « ${espace.nom} » ?`,
        message: "L'espace ne pourra plus être réservé. Cette action est définitive.",
        confirmLabel: 'Supprimer',
        tone: 'danger',
        icon: 'delete',
      })
      .pipe(
        filter(Boolean),
        switchMap(() => this.track(espace.id, this.roomManagerService.deleteSpace(espace.id))),
      )
      .subscribe({
        next: () => {
          this.toast.showSuccess('Espace supprimé.');
          this.loadSpaces(true);
        },
        error: err => this.toast.showError(apiErrorMessage(err, "L'espace n'a pas pu être supprimé.")),
      });
  }

  isBusy(id: string): boolean {
    return this.busy().has(id);
  }


  /** Marks an item busy while the request runs. */
  private track<T>(id: string, request: Observable<T>): Observable<T> {
    this.busy.update(s => new Set(s).add(id));
    return request.pipe(
      finalize(() =>
        this.busy.update(s => {
          const next = new Set(s);
          next.delete(id);
          return next;
        }),
      ),
    );
  }

  private afterChange(...keys: ListKey[]): void {
    keys.forEach(key => this.load(key, true));
    this.calendar()?.loadSlots();
  }

  private patch(key: ListKey, change: Partial<ListState<Reservation>>): void {
    this.lists.update(all => ({ ...all, [key]: { ...all[key], ...change } }));
  }
}
