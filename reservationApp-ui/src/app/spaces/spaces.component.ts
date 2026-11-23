import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { Router, RouterLink } from '@angular/router';
import { Espace, Etablissement, EtablissementService } from '../services/etablissement/etablissement.service';
import { AuthService } from '../services/auth/auth.service';
import { UserService } from '../services/user/user.service';
import { EmptyStateComponent } from '../shared/ui/empty-state.component';
import { PageHeaderComponent } from '../shared/ui/page-header.component';
import { SkeletonComponent } from '../shared/ui/skeleton.component';

interface SpaceCategory {
  label: string;
  types: string[];
  apiValue: string;
}

/** Catalogue: établissements, then the spaces of the selected one (opens the booking calendar). */
@Component({
  selector: 'app-spaces',
  standalone: true,
  imports: [
    FormsModule, RouterLink, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatIcon,
    PageHeaderComponent, EmptyStateComponent, SkeletonComponent,
  ],
  templateUrl: './spaces.component.html',
  styleUrls: ['./spaces.component.scss']
})
export class SpacesComponent implements OnInit {
  // Data
  etablissements: Etablissement[] = [];
  allEspaces: Espace[] = [];
  filteredEspaces: Espace[] = [];
  selectedEtablissement: Etablissement | null = null;
  loading = false;
  loggedIn = false;

  // Filters
  establishmentTypes = ['FACULTE', 'INSTITUT', 'ECOLE', 'UNIVERSITE'];
  zones = ['CENTRE_VILLE_CITE_RIADH', 'SAHLOUL_HAMMAM_SOUSSE', 'CHOTT_MERIEM'];
  searchEtab = '';
  searchEspace = '';

  // User data
  currentUser: any;

  categories: SpaceCategory[] = [
    {
      label: 'Espaces administratifs & académiques',
      apiValue: 'Espaces_administratifs_academiques',
      types: ['Laboratoire_de_recherche', 'Salle_de_conference', 'Salle_de_marche/bourse']
    },
    {
      label: "Espaces d'employabilité & d'innovation",
      apiValue: "Espaces_employabilite_innovation",
      types: ['Espace_4C', 'Incubateur', 'FabLab', 'Coworking_space', 'Pole_etudiant_entrepreneur']
    }
  ];

  selectedCategory: SpaceCategory | null = null;
  selectedSubcategory: string | null = null;
  currentFilters = { type: null as string | null, zone: null as string | null };

  constructor(
    private etablissementService: EtablissementService,
    private router: Router,
    private userService: UserService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.loggedIn = this.authService.isLoggedIn();
    this.loadEtablissements();
    // Visitors can browse spaces without an account: only load the profile when logged in
    if (this.loggedIn) {
      this.loadUserProfile();
    }
  }

  // --- labels -----------------------------------------------------------------
  getTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      'FACULTE': 'Faculté',
      'INSTITUT': 'Institut',
      'ECOLE': 'École',
      'UNIVERSITE': "Université"
    };
    return labels[type] || type;
  }

  getZoneLabel(zone: string): string {
    const labels: Record<string, string> = {
      'CENTRE_VILLE_CITE_RIADH': 'Centre-ville – Cité Riadh',
      'SAHLOUL_HAMMAM_SOUSSE': 'Sahloul – Hammam Sousse',
      'CHOTT_MERIEM': 'Chott Meriem'
    };
    return labels[zone] || zone;
  }

  /** 'Salle_de_conference' -> 'Salle de conference' */
  formatType(value: string | null | undefined): string {
    return (value || '').replace(/_/g, ' ');
  }

  initials(name: string): string {
    return (name || '?').split(/\s+/).filter(w => w.length > 2).slice(0, 2).map(w => w[0]).join('').toUpperCase() || '?';
  }

  // --- search (client side, on top of the server filters) --------------------------
  get visibleEtablissements(): Etablissement[] {
    const q = this.normalize(this.searchEtab);
    if (!q) return this.etablissements;
    return this.etablissements.filter(e => this.normalize(`${e.nom} ${e.adresse}`).includes(q));
  }

  get visibleEspaces(): Espace[] {
    const q = this.normalize(this.searchEspace);
    if (!q) return this.filteredEspaces;
    return this.filteredEspaces.filter(e =>
      this.normalize(`${e.nom} ${e.type} ${(e.equipement || []).join(' ')}`).includes(q));
  }

  private normalize(s: string | null | undefined): string {
    return (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
  }

  // --- établissements -----------------------------------------------------------------
  loadEtablissements() {
    this.loading = true;
    this.etablissements = [];
    this.etablissementService.getAllEtablissements().subscribe({
      next: (data) => {
        this.etablissements = this.removeDuplicates(data, 'id');
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  removeDuplicates(array: any[], key: string): any[] {
    const seen = new Set();
    return array.filter(item => {
      const value = item[key];
      if (seen.has(value)) {
        return false;
      }
      seen.add(value);
      return true;
    });
  }

  applyFilters() {
    this.loading = true;
    const params: any = {};
    if (this.currentFilters.type) {
      params.type = this.currentFilters.type;
    }
    if (this.currentFilters.zone) {
      params.zone = this.currentFilters.zone;
    }
    this.etablissementService.filterEtablissements(params).subscribe({
      next: (data) => {
        this.etablissements = data;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  resetFilters() {
    this.currentFilters = { type: null, zone: null };
    this.searchEtab = '';
    this.loadEtablissements();
  }

  get hasEtabFilters(): boolean {
    return !!(this.currentFilters.type || this.currentFilters.zone || this.searchEtab);
  }

  selectEtablissement(etablissement: Etablissement) {
    this.loading = true;
    this.selectedEtablissement = etablissement;
    this.allEspaces = [];
    this.filteredEspaces = [];
    this.searchEspace = '';
    this.selectedCategory = null;
    this.selectedSubcategory = null;
    this.etablissementService.getAllEspacesForEtablissement(etablissement.id).subscribe({
      next: (espaces) => {
        this.allEspaces = espaces;
        this.filteredEspaces = [...espaces];
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
    window.scrollTo({ top: 0 });
  }

  // --- espaces ---------------------------------------------------------------------------
  navigateToSelectionCalendar(espace: Espace): void {
    if (!this.selectedEtablissement || !espace.id) return;
    this.router.navigate(['/selection-calendar'], {
      queryParams: {
        etablissementId: this.selectedEtablissement.id,
        espaceId: espace.id
      },
      state: {
        etablissement: this.selectedEtablissement,
        espace: espace
      }
    });
  }

  filterSpaces() {
    if (!this.selectedEtablissement) return;
    this.loading = true;
    const filters: any = {};
    if (this.selectedCategory) {
      filters.categorie = this.selectedCategory.apiValue;
    }
    if (this.selectedSubcategory) {
      filters.type = this.selectedSubcategory;
    }
    this.etablissementService.getFilteredEspacesForEtablissement(this.selectedEtablissement.id, filters).subscribe({
      next: (espaces) => {
        this.filteredEspaces = espaces;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  onCategoryChange() {
    this.selectedSubcategory = null;
    if (this.selectedCategory) {
      this.filterSpaces();
    } else {
      this.filteredEspaces = [...this.allEspaces];
    }
  }

  resetSpaceFilters() {
    this.selectedCategory = null;
    this.selectedSubcategory = null;
    this.searchEspace = '';
    this.filteredEspaces = [...this.allEspaces];
  }

  get hasSpaceFilters(): boolean {
    return !!(this.selectedCategory || this.searchEspace);
  }

  goBackToEtablissements() {
    this.selectedEtablissement = null;
    this.allEspaces = [];
    this.filteredEspaces = [];
  }

  loadUserProfile() {
    this.userService.getProfile().subscribe(profile => {
      this.currentUser = {
        role: profile.role,
        nomPrenom: `${profile.prenom} ${profile.nom}`,
        email: profile.email
      };
    });
  }
}
