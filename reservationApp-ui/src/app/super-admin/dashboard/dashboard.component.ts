import { Component, computed, ElementRef, inject, OnInit, signal, viewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatInput } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { Etablissement } from '../../models/etablissement.model';
import { SuperAdminService } from '../../services/super-admin/super-admin.service';
import { EmptyStateComponent } from '../../shared/ui/empty-state.component';
import { PageHeaderComponent } from '../../shared/ui/page-header.component';
import { SkeletonComponent } from '../../shared/ui/skeleton.component';
import { StatCardComponent } from '../../shared/ui/stat-card.component';
import { EtablissementCardComponent } from '../etablissement-card/etablissement-card.component';
import { EtablissementDetailsComponent } from '../etablissement-details/etablissement-details.component';

/** Super-admin overview: every establishment with its spaces and room managers (read-only). */
@Component({
  selector: 'app-dashboard',
  imports: [
    MatButtonModule,
    MatFormFieldModule,
    MatIcon,
    MatInput,
    MatSelectModule,
    EmptyStateComponent,
    EtablissementCardComponent,
    EtablissementDetailsComponent,
    PageHeaderComponent,
    SkeletonComponent,
    StatCardComponent,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit {
  private readonly superAdminService = inject(SuperAdminService);
  private readonly detailsRef = viewChild<ElementRef<HTMLElement>>('details');

  readonly etablissements = signal<Etablissement[]>([]);
  readonly loading = signal(true);
  readonly failed = signal(false);
  readonly selectedId = signal<string | null>(null);
  readonly search = signal('');
  readonly typeFilter = signal('');

  readonly selected = computed(() => this.etablissements().find(e => e.id === this.selectedId()) ?? null);
  readonly types = computed(() => [...new Set(this.etablissements().map(e => e.type).filter(Boolean))].sort());

  readonly totals = computed(() => {
    const list = this.etablissements();
    const espaces = list.flatMap(e => e.espaces ?? []);
    return {
      espaces: espaces.length,
      responsables: list.reduce((n, e) => n + (e.responsables?.length ?? 0), 0),
      capacity: espaces.reduce((n, s) => n + (Number(s.capacite) || 0), 0),
    };
  });

  readonly filtered = computed(() => {
    const q = normalize(this.search());
    const type = this.typeFilter();
    return this.etablissements()
      .filter(e => !type || e.type === type)
      .filter(e => !q || normalize([e.nom, e.adresse, e.zone, e.type].join(' ')).includes(q))
      .sort((a, b) => a.nom.localeCompare(b.nom, 'fr'));
  });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.failed.set(false);
    this.superAdminService.getAllEtablissements().subscribe({
      next: data => {
        this.etablissements.set(data);
        this.loading.set(false);
        // Open the first one on large screens so the page is never half empty
        if (!this.selectedId() && data.length && window.matchMedia('(min-width: 1100px)').matches) {
          this.selectedId.set([...data].sort((a, b) => a.nom.localeCompare(b.nom, 'fr'))[0].id);
        }
      },
      error: () => {
        this.loading.set(false);
        this.failed.set(true);
      },
    });
  }

  select(e: Etablissement): void {
    this.selectedId.set(e.id);
    // On small screens the details are below the list: bring them into view
    if (!window.matchMedia('(min-width: 1100px)').matches) {
      setTimeout(() => this.detailsRef()?.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'start' }));
    }
  }
}

function normalize(text: string | null | undefined): string {
  return (text ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}
