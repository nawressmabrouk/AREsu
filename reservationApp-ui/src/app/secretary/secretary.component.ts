import { Component, computed, inject, OnInit, signal, viewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { filter, finalize, Observable, switchMap } from 'rxjs';
import { Reservation } from '../models/reservation.model';
import { ReservationsCalendarComponent } from '../reservations-calendar/reservations-calendar.component';
import { NotificationService } from '../services/alert-notif/notification.service';
import { SecretaryService } from '../services/secretary/secretary.service';
import { UserService } from '../services/user/user.service';
import { ApproveEvent, ReservationTableComponent, reservationSummary } from '../shared/components/reservation-table/reservation-table.component';
import { apiErrorMessage } from '../shared/ui/api-error';
import { ConfirmService } from '../shared/ui/confirm-dialog.component';
import { EmptyStateComponent } from '../shared/ui/empty-state.component';
import { PageHeaderComponent } from '../shared/ui/page-header.component';
import { StatCardComponent } from '../shared/ui/stat-card.component';
import { hasStatus } from '../shared/ui/status';

type ListKey = 'toHandle' | 'toView' | 'viewed' | 'accepted' | 'refused';
type View = ListKey | 'calendar';

interface ListState {
  items: Reservation[];
  loading: boolean;
  failed: boolean;
}

const VIEWS: { key: View; label: string; icon: string; description: string }[] = [
  { key: 'toHandle', label: 'À traiter', icon: 'pending_actions',
    description: "Demandes en attente pour les espaces sans responsable : c'est à vous de les accepter ou de les refuser." },
  { key: 'toView', label: 'Non vues', icon: 'visibility_off',
    description: "Demandes des espaces gérés par un responsable, que vous n'avez pas encore consultées." },
  { key: 'viewed', label: 'Vues', icon: 'visibility',
    description: 'Demandes des espaces gérés par un responsable, déjà consultées.' },
  { key: 'accepted', label: 'Acceptées', icon: 'check_circle',
    description: "Réservations que vous avez acceptées. Celles qui n'ont pas commencé peuvent être annulées." },
  { key: 'refused', label: 'Refusées', icon: 'cancel', description: 'Réservations que vous avez refusées.' },
  { key: 'calendar', label: 'Calendrier', icon: 'calendar_month', description: 'Toutes les réservations de votre établissement.' },
];

@Component({
  selector: 'app-secretary',
  imports: [
    MatButtonModule,
    MatIcon,
    EmptyStateComponent,
    PageHeaderComponent,
    ReservationsCalendarComponent,
    ReservationTableComponent,
    StatCardComponent,
  ],
  templateUrl: './secretary.component.html',
})
export class SecretaryComponent implements OnInit {
  private readonly secretaryService = inject(SecretaryService);
  private readonly userService = inject(UserService);
  private readonly confirm = inject(ConfirmService);
  private readonly toast = inject(NotificationService);

  private readonly calendar = viewChild(ReservationsCalendarComponent);

  readonly views = VIEWS;
  readonly view = signal<View>('toHandle');
  readonly current = computed(() => VIEWS.find(v => v.key === this.view())!);

  readonly lists = signal<Record<ListKey, ListState>>({
    toHandle: { items: [], loading: true, failed: false },
    toView: { items: [], loading: true, failed: false },
    viewed: { items: [], loading: true, failed: false },
    accepted: { items: [], loading: true, failed: false },
    refused: { items: [], loading: true, failed: false },
  });

  readonly pendingCount = computed(() => this.lists().toHandle.items.filter(r => hasStatus(r.statut, 'EN_ATTENTE')).length);

  /** null while loading, '' when the account has no establishment. */
  readonly etablissementId = signal<string | null>(null);
  readonly busy = signal<ReadonlySet<string>>(new Set());

  private readonly loaders: Record<ListKey, () => Observable<Reservation[]>> = {
    toHandle: () => this.secretaryService.getToHandleReservations(),
    toView: () => this.secretaryService.getToViewReservations(),
    viewed: () => this.secretaryService.getViewedReservations(),
    accepted: () => this.secretaryService.getAcceptedReservations(),
    refused: () => this.secretaryService.getRefusedReservations(),
  };

  ngOnInit(): void {
    // The lists come from the account's establishment server-side; the profile is only needed for the calendar.
    this.userService.getProfile().subscribe({
      next: profile => this.etablissementId.set(profile.etablissementId ?? ''),
      error: () => this.etablissementId.set(''),
    });
    this.refresh();
  }

  count(key: View): number | null {
    if (key === 'calendar') return null;
    const state = this.lists()[key];
    if (state.loading) return null;
    return key === 'toHandle' ? this.pendingCount() : state.items.length;
  }

  setView(view: View): void {
    this.view.set(view);
  }

  refresh(): void {
    (Object.keys(this.loaders) as ListKey[]).forEach(key => this.load(key));
    this.calendar()?.loadSlots();
  }

  /** silent: refresh without the loading skeleton (after an action, the list stays in place). */
  load(key: ListKey, silent = false): void {
    if (!silent) this.patch(key, { loading: true, failed: false });
    this.loaders[key]().subscribe({
      next: items => this.patch(key, { items, loading: false }),
      error: () => this.patch(key, { loading: false, failed: !silent || !this.lists()[key].items.length }),
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
        switchMap(() => this.track(reservation, this.secretaryService.makeDecision(reservation.id, true, equipments))),
      )
      .subscribe({
        next: () => {
          this.toast.showSuccess('Réservation acceptée.');
          this.afterChange('toHandle', 'accepted', 'viewed');
        },
        error: err => this.toast.showError(apiErrorMessage(err, "L'acceptation a échoué.")),
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
        switchMap(() => this.track(reservation, this.secretaryService.makeDecision(reservation.id, false))),
      )
      .subscribe({
        next: () => {
          this.toast.showSuccess('Réservation refusée.');
          this.afterChange('toHandle', 'refused', 'viewed');
        },
        error: err => this.toast.showError(apiErrorMessage(err, 'Le refus a échoué.')),
      });
  }

  markSeen(reservation: Reservation): void {
    this.track(reservation, this.secretaryService.viewReservation(reservation.id)).subscribe({
      next: () => {
        this.toast.showSuccess('Demande marquée comme vue.');
        this.afterChange('toView', 'viewed');
      },
      error: err => this.toast.showError(apiErrorMessage(err, "La demande n'a pas pu être marquée comme vue.")),
    });
  }

  cancel(reservation: Reservation): void {
    this.confirm
      .prompt({
        title: 'Annuler la réservation ?',
        message: "La réservation sera annulée et retirée du calendrier. Le créneau redeviendra disponible.",
        details: reservationSummary(reservation),
        input: { label: "Motif de l'annulation (facultatif)", multiline: true },
        confirmLabel: 'Annuler la réservation',
        cancelLabel: 'Retour',
        tone: 'danger',
        icon: 'event_busy',
      })
      .pipe(
        filter((reason): reason is string => reason !== null),
        switchMap(reason => this.track(reservation, this.secretaryService.cancelReservation(reservation.id, reason || undefined))),
      )
      .subscribe({
        next: () => {
          this.toast.showSuccess('Réservation annulée.');
          this.afterChange('accepted');
        },
        error: err => this.toast.showError(apiErrorMessage(err, "L'annulation a échoué.")),
      });
  }


  /** Marks the reservation busy while the request runs. */
  private track<T>(r: Reservation, request: Observable<T>): Observable<T> {
    this.busy.update(s => new Set(s).add(r.id));
    return request.pipe(
      finalize(() =>
        this.busy.update(s => {
          const next = new Set(s);
          next.delete(r.id);
          return next;
        }),
      ),
    );
  }

  private afterChange(...keys: ListKey[]): void {
    keys.forEach(key => this.load(key, true));
    this.calendar()?.loadSlots();
  }

  private patch(key: ListKey, change: Partial<ListState>): void {
    this.lists.update(all => ({ ...all, [key]: { ...all[key], ...change } }));
  }
}
