import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatInput } from '@angular/material/input';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltip } from '@angular/material/tooltip';
import { filter, finalize, Observable, switchMap } from 'rxjs';
import { AdminRegistrationService, AdminUser, Espace, Role } from '../services/admin/admin-registration.service';
import { NotificationService } from '../services/alert-notif/notification.service';
import { SpaceFormService, SpaceFormValue } from '../shared/components/space-form-dialog/space-form-dialog.component';
import { categoryLabel, categoryValue, SPACE_CATEGORIES, typeLabel } from '../shared/space-catalog';
import { apiErrorMessage } from '../shared/ui/api-error';
import { ConfirmService } from '../shared/ui/confirm-dialog.component';
import { EmptyStateComponent } from '../shared/ui/empty-state.component';
import { PageHeaderComponent } from '../shared/ui/page-header.component';
import { SkeletonComponent } from '../shared/ui/skeleton.component';
import { StatCardComponent } from '../shared/ui/stat-card.component';
import { ResponsableFormDialogComponent, ResponsableFormValue } from './responsable-form-dialog.component';

type View = 'espaces' | 'responsables';

interface ListState<T> {
  items: T[];
  loading: boolean;
  failed: boolean;
}

@Component({
  selector: 'app-admin',
  imports: [
    MatButtonModule,
    MatFormFieldModule,
    MatIcon,
    MatInput,
    MatPaginator,
    MatProgressSpinner,
    MatSelectModule,
    MatTooltip,
    EmptyStateComponent,
    PageHeaderComponent,
    SkeletonComponent,
    StatCardComponent,
  ],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.scss',
})
export class AdminComponent implements OnInit {
  private readonly adminService = inject(AdminRegistrationService);
  private readonly confirm = inject(ConfirmService);
  private readonly dialog = inject(MatDialog);
  private readonly spaceForm = inject(SpaceFormService);
  private readonly toast = inject(NotificationService);

  readonly view = signal<View>('espaces');
  readonly espaces = signal<ListState<Espace>>({ items: [], loading: true, failed: false });
  readonly responsables = signal<ListState<AdminUser>>({ items: [], loading: true, failed: false });
  readonly busy = signal<ReadonlySet<string>>(new Set());

  readonly categories = SPACE_CATEGORIES;
  readonly categoryLabel = categoryLabel;
  readonly typeLabel = typeLabel;

  // Filters and pages
  readonly espaceSearch = signal('');
  readonly espaceCategory = signal('');
  readonly espacePage = signal({ index: 0, size: 10 });
  readonly respSearch = signal('');
  readonly respPage = signal({ index: 0, size: 10 });

  readonly totalCapacity = computed(() => this.espaces().items.reduce((sum, e) => sum + (Number(e.capacite) || 0), 0));
  readonly unassigned = computed(() => this.espaces().items.filter(e => !e.responsableId).length);

  /** Spaces per room manager (from the spaces' responsableId). */
  readonly espacesByResponsable = computed(() => {
    const map = new Map<string, Espace[]>();
    for (const e of this.espaces().items) {
      if (!e.responsableId) continue;
      map.set(e.responsableId, [...(map.get(e.responsableId) ?? []), e]);
    }
    return map;
  });

  readonly filteredEspaces = computed(() => {
    const q = normalize(this.espaceSearch());
    const cat = this.espaceCategory();
    return this.espaces()
      .items.filter(e => !cat || categoryValue(e.categorie) === cat)
      .filter(e => !q || normalize([e.nom, e.responsableNom, typeLabel(e.type), ...(e.equipement ?? [])].join(' ')).includes(q))
      .sort((a, b) => a.nom.localeCompare(b.nom, 'fr'));
  });

  readonly filteredResponsables = computed(() => {
    const q = normalize(this.respSearch());
    return this.responsables()
      .items.filter(r => !q || normalize([r.prenom, r.nom, r.email, r.fonction, r.structure].join(' ')).includes(q))
      .sort((a, b) => `${a.nom} ${a.prenom}`.localeCompare(`${b.nom} ${b.prenom}`, 'fr'));
  });

  readonly pagedEspaces = computed(() => page(this.filteredEspaces(), this.espacePage()));
  readonly pagedResponsables = computed(() => page(this.filteredResponsables(), this.respPage()));

  ngOnInit(): void {
    this.loadEspaces();
    this.loadResponsables();
  }

  count(view: View): number | null {
    const state = view === 'espaces' ? this.espaces() : this.responsables();
    return state.loading ? null : state.items.length;
  }

  loadEspaces(silent = false): void {
    if (!silent) this.espaces.update(s => ({ ...s, loading: true, failed: false }));
    this.adminService.getAllEspaces().subscribe({
      next: items => this.espaces.set({ items, loading: false, failed: false }),
      error: () => this.espaces.update(s => ({ ...s, loading: false, failed: !silent || !s.items.length })),
    });
  }

  loadResponsables(silent = false): void {
    if (!silent) this.responsables.update(s => ({ ...s, loading: true, failed: false }));
    this.adminService.getResponsables().subscribe({
      next: items => this.responsables.set({ items, loading: false, failed: false }),
      error: () => this.responsables.update(s => ({ ...s, loading: false, failed: !silent || !s.items.length })),
    });
  }

  setEspaceSearch(v: string): void {
    this.espaceSearch.set(v);
    this.espacePage.update(p => ({ ...p, index: 0 }));
  }

  setEspaceCategory(v: string): void {
    this.espaceCategory.set(v);
    this.espacePage.update(p => ({ ...p, index: 0 }));
  }

  setRespSearch(v: string): void {
    this.respSearch.set(v);
    this.respPage.update(p => ({ ...p, index: 0 }));
  }

  onEspacePage(e: PageEvent): void {
    this.espacePage.set({ index: e.pageIndex, size: e.pageSize });
  }

  onRespPage(e: PageEvent): void {
    this.respPage.set({ index: e.pageIndex, size: e.pageSize });
  }

  responsableName(id: string | null | undefined, fallback?: string | null): string {
    const r = this.responsables().items.find(x => x.id === id);
    return r ? `${r.prenom} ${r.nom}` : fallback || '';
  }

  initials(r: AdminUser): string {
    return `${r.prenom?.[0] ?? ''}${r.nom?.[0] ?? ''}`.toUpperCase() || '?';
  }

  isBusy(id: string | undefined): boolean {
    return !!id && this.busy().has(id);
  }

  // ---------------------------------------------------------------- spaces
  addEspace(): void {
    this.openSpaceForm().pipe(
      switchMap(value => this.track('new-espace', this.adminService.ajouterEspace(value.responsableId!, { ...value, disponibilite: true } as unknown as Espace))),
    ).subscribe({
      next: () => {
        this.toast.showSuccess('Espace ajouté.');
        this.loadEspaces(true);
        this.loadResponsables(true);
      },
      error: err => this.toast.showError(apiErrorMessage(err, "L'espace n'a pas pu être ajouté.")),
    });
  }

  editEspace(espace: Espace): void {
    this.openSpaceForm(espace).pipe(
      // Send the whole space: the backend also overwrites `disponibilite`
      switchMap(value => this.track(espace.id, this.adminService.modifierEspace(espace.id, { ...espace, ...value }))),
    ).subscribe({
      next: () => {
        this.toast.showSuccess('Espace modifié.');
        this.loadEspaces(true);
      },
      error: err => this.toast.showError(apiErrorMessage(err, "L'espace n'a pas pu être modifié.")),
    });
  }

  deleteEspace(espace: Espace): void {
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
        switchMap(() => this.track(espace.id, this.adminService.supprimerEspace(espace.id))),
      )
      .subscribe({
        next: () => {
          this.toast.showSuccess('Espace supprimé.');
          this.loadEspaces(true);
        },
        error: err => this.toast.showError(apiErrorMessage(err, "L'espace n'a pas pu être supprimé.")),
      });
  }

  private openSpaceForm(espace?: Espace): Observable<SpaceFormValue> {
    const responsables = this.responsables().items
      .filter(r => r.id)
      .map(r => ({ id: r.id!, label: `${r.prenom} ${r.nom}` }));
    return this.spaceForm.open({ espace, responsables }).pipe(filter((v): v is SpaceFormValue => !!v));
  }

  // ---------------------------------------------------------- room managers
  addResponsable(): void {
    this.openResponsableForm().pipe(
      switchMap(value =>
        this.track('new-responsable', this.adminService.registerAdmin({
          ...value,
          role: Role.RESPONSABLE_SALLE,
          nomEtablissement: '',
          espacesResponsables: [],
        })),
      ),
    ).subscribe({
      next: () => {
        this.toast.showSuccess('Responsable créé : ses identifiants lui ont été envoyés par e-mail.');
        this.loadResponsables(true);
      },
      error: err => this.toast.showError(apiErrorMessage(err, 'Le responsable n\'a pas pu être créé.')),
    });
  }

  editResponsable(r: AdminUser): void {
    this.openResponsableForm(r).pipe(
      // Keep role, establishment and the managed spaces (ids maintained by the backend)
      switchMap(value => this.track(r.id!, this.adminService.updateAdmin(r.id!, { ...r, ...value }))),
    ).subscribe({
      next: () => {
        this.toast.showSuccess('Modifications enregistrées.');
        this.loadResponsables(true);
        this.loadEspaces(true);
      },
      error: err => this.toast.showError(apiErrorMessage(err, 'Les modifications n\'ont pas pu être enregistrées.')),
    });
  }

  deleteResponsable(r: AdminUser): void {
    const managed = this.espacesByResponsable().get(r.id!) ?? [];
    this.confirm
      .confirm({
        title: `Supprimer ${r.prenom} ${r.nom} ?`,
        message: managed.length
          ? `Son compte sera supprimé. Il est responsable de ${managed.length} espace${managed.length > 1 ? 's' : ''} : pensez à les réattribuer.`
          : 'Son compte sera supprimé. Cette action est définitive.',
        details: managed.length ? managed.slice(0, 5).map(e => ({ label: 'Espace', value: e.nom })) : undefined,
        confirmLabel: 'Supprimer',
        tone: 'danger',
        icon: 'person_remove',
      })
      .pipe(
        filter(Boolean),
        switchMap(() => this.track(r.id!, this.adminService.deleteAdmin(r.id!))),
      )
      .subscribe({
        next: () => {
          this.toast.showSuccess('Responsable supprimé.');
          this.loadResponsables(true);
          this.loadEspaces(true);
        },
        error: err => this.toast.showError(apiErrorMessage(err, 'Le responsable n\'a pas pu être supprimé.')),
      });
  }

  private openResponsableForm(responsable?: AdminUser): Observable<ResponsableFormValue> {
    return this.dialog
      .open<ResponsableFormDialogComponent, { responsable?: AdminUser }, ResponsableFormValue>(ResponsableFormDialogComponent, {
        data: { responsable },
        width: '620px',
        maxWidth: '94vw',
      })
      .afterClosed()
      .pipe(filter((v): v is ResponsableFormValue => !!v));
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
}

function normalize(text: string | null | undefined): string {
  return (text ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}

function page<T>(list: T[], p: { index: number; size: number }): T[] {
  const last = Math.max(0, Math.ceil(list.length / p.size) - 1);
  const start = Math.min(p.index, last) * p.size;
  return list.slice(start, start + p.size);
}
