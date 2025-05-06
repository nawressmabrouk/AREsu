import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faLinkedin } from '@fortawesome/free-brands-svg-icons';
import {
  faArrowLeft, faArrowRight, faBriefcase, faBuilding,
  faCalendarAlt, faCalendarCheck, faCheckCircle, faChevronDown,
  faDiagramProject, faEdit, faEnvelope, faEye, faEyeSlash,
  faFilter, faHome, faInfoCircle, faKey, faLink,
  faLocationDot,
  faLock,
  faMapMarker, faMicrochip, faPhone, faSave, faSearch,
  faSignOutAlt, faSpinner, faSyncAlt, faUniversity, faUser,
  faUserGraduate, faUsers, faUserTag, faUserTie
} from '@fortawesome/free-solid-svg-icons';
import { UserService } from '../services/user/user.service';
import { Espace, Etablissement, EtablissementService } from '../services/etablissement/etablissement.service';
import { ProfileComponent } from '../shared/components/profile/profile.component';
interface SpaceCategory {
  label: string;
  types: string[];
  apiValue: string;
}

@Component({
  selector: 'app-spaces',
  standalone: true,
  imports: [FontAwesomeModule, CommonModule, FormsModule , ProfileComponent],
  templateUrl: './spaces.component.html',
  styleUrls: ['./spaces.component.scss']
})
export class SpacesComponent implements OnInit {
  @ViewChild('profileContainer', { static: true }) profileContainer!: ElementRef;

  // Icons
  faCalendarCheck = faCalendarCheck;
  faMicrochip = faMicrochip;
  faUsers = faUsers;
  faArrowLeft = faArrowLeft;
  faSyncAlt = faSyncAlt;
  faKey = faKey;
  faLinkedin = faLinkedin;
  faUniversity = faUniversity;
  faBriefcase = faBriefcase;
  faCalendarAlt = faCalendarAlt;
  faInfoCircle = faInfoCircle;
  faSearch = faSearch;
  faBuilding = faBuilding;
  faCheckCircle = faCheckCircle;
  faPageIcon = faArrowRight;
  faHome = faHome;
  faUser = faUser;
  faEdit = faEdit;
  faSignOutAlt = faSignOutAlt;
  faUserTie = faUserTie;
  faDiagramProject = faDiagramProject;
  faLink = faLink;
  faUserGraduate = faUserGraduate;
  faPhone = faPhone;
  faEnvelope = faEnvelope;
  faUserTag = faUserTag;
  faSave = faSave;
  faLock = faLock;
  faEye = faEye;
  faEyeSlash = faEyeSlash;
  faMapMarker = faMapMarker;
  faChevronDown = faChevronDown;
  faFilter = faFilter;
  faSpinner = faSpinner;
  faLocationDot = faLocationDot;

  // Data
  etablissements: Etablissement[] = [];
  allEspaces: Espace[] = [];
  filteredEspaces: Espace[] = [];
  selectedEtablissement: Etablissement | null = null;
  loading = false;

  // Filters
  establishmentTypes = ['FACULTE', 'INSTITUT', 'ECOLE'];
  zones = ['CENTRE_VILLE_CITE_RIADH', 'SAHLOUL_HAMMAM_SOUSSE', 'CHOTT_MERIEM'];
   // User data
 currentUser : any ; 

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
    private router: Router , private userService: UserService
  ) {}

  ngOnInit() {
    this.loadEtablissements();
    this.loadUserProfile();
  }
 
 
 
 
 
 
 
 
 

  getTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      'FACULTE': 'Faculté',
      'INSTITUT': 'Institut',
      'ECOLE': 'École'
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

// Update your loadEtablissements method

loadEtablissements() {
  this.loading = true;
  this.etablissements = [];  // <-- Clear previous data to avoid stacking duplicates
  this.etablissementService.getAllEtablissements().subscribe({
    next: (data) => {
      console.log('Raw data from backend:', data);
      this.etablissements = this.removeDuplicates(data, 'id');
      this.loading = false;
    },
    error: (err) => {
      console.error('Error loading establishments:', err);
      this.loading = false;
    }
  });
}









// Add this helper method
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

// Ensure your trackBy function is correct
trackByEtabId(index: number, etab: Etablissement): string {
  return etab.id; // Make sure this matches your ID property name
}


    applyFilters() {
      this.loading = true;
      
      // Create clean params object
      const params: any = {};
      
      if (this.currentFilters.type) {
        params.type = this.currentFilters.type;
      }
      
      if (this.currentFilters.zone) {
        params.zone = this.currentFilters.zone;      }
    
      console.log('Applying filters:', params);
    
      this.etablissementService.filterEtablissements(params).subscribe({
        next: (data) => {
          this.etablissements = data;
          this.loading = false;
        },
        error: (err) => {
          console.error('Filter error:', err);
          this.loading = false;
        }
      });
    }

    resetFilters() {
      this.currentFilters = { type: null, zone: null }; // Reset filters
      this.loadEtablissements(); // Reload original list
    }
    

    selectEtablissement(etablissement: Etablissement) {
      console.log('Selecting establishment:', etablissement);
      this.loading = true;
      this.selectedEtablissement = etablissement;
      this.allEspaces = []; // Clear previous spaces
      this.filteredEspaces = []; // Clear filtered spaces
      
      this.etablissementService.getAllEspacesForEtablissement(etablissement.id).subscribe({
        next: (espaces) => {
          console.log('Received spaces:', espaces);
          this.allEspaces = espaces;
          this.filteredEspaces = [...espaces]; // Create a new array
          this.loading = false;
        },
        error: (err) => {
          console.error('Error loading spaces:', err);
          this.loading = false;
        }
      });
    }

// When clicking a space card

navigateToCalendar(espace: Espace): void {
  if (!this.selectedEtablissement || !espace.id) return;
  
  this.router.navigate(['/calendar'], {
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
    
    // Create clean filters object without undefined/null values
    const filters: any = {};
    
    if (this.selectedCategory) {
      filters.categorie = this.selectedCategory.apiValue;
    }
    
    if (this.selectedSubcategory) {
      filters.type = this.selectedSubcategory;
    }
  
    console.log('Sending filters:', filters); // Debug log
  
    this.etablissementService.getFilteredEspacesForEtablissement(
      this.selectedEtablissement.id,
      filters
    ).subscribe({
      next: (espaces) => {
        this.filteredEspaces = espaces;
        this.loading = false;
      },
      error: (err) => {
        console.error('Filter error:', err);
        if (err.status === 400) {
          console.error('Bad Request Details:', err.error);
        }
        this.loading = false;
      }
    });
  }

  onCategoryChange() {
    this.selectedSubcategory = null;
    this.filterSpaces();
  }
  
  resetSpaceFilters() {
    this.selectedCategory = null;
    this.selectedSubcategory = null;
    this.filteredEspaces = [...this.allEspaces];
  }

  goBackToEtablissements() {
    this.selectedEtablissement = null;
    this.allEspaces = [];
    this.filteredEspaces = [];
  }

 /*
  //Add the missing method
  reserveSpace(espace: Espace): void {
    this.router.navigate(['/reservation/new'], {
      state: { espace }
    });
  }

  // Update calendar method name for consistency
  navigateToCalendar(space: Espace): void {
    this.router.navigate(['/calendar'], {
      state: { space }
    });
  }*/
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
