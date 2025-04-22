import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { faLinkedin } from '@fortawesome/free-brands-svg-icons';
import { EtablissementService } from './services/etablissement.service';
import { HostListener, ElementRef, ViewChild } from '@angular/core';
import {
  faSyncAlt ,
  faArrowRight,
  faBriefcase,
  faBuilding,
  faCalendarAlt,
  faCheckCircle,
  faChevronDown,
  faDiagramProject,
  faEdit,
  faEnvelope,
  faEye, faEyeSlash,
  faFilter,
  faCalendarCheck , 
  faMicrochip, faUsers, faArrowLeft,
  faHome,
  faInfoCircle,
  faKey,
  faLink,
  faLock,
  faMapMarker,
  faPhone,
  faSave,
  faSearch,
  faSignOutAlt,
  faUniversity,
  faUser,
  faUserGraduate,
  faUserTag,
  faUserTie
} from '@fortawesome/free-solid-svg-icons';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

@Component({
  selector: 'app-spaces',
  standalone: true,
  imports: [FontAwesomeModule, CommonModule, FormsModule ],
  templateUrl: './spaces.component.html',
  styleUrls: ['./spaces.component.scss']
})
export class SpacesComponent {
  @ViewChild('profileContainer', { static: true }) profileContainer!: ElementRef;
  // Icons
  faCalendarCheck = faCalendarCheck ;
  faMicrochip = faMicrochip ; 
  faUsers = faUsers;
  faArrowLeft = faArrowLeft;
  faSyncAlt = faSyncAlt ;
  faKey = faKey ;
  faLinkedin = faLinkedin;
  faUniversity = faUniversity ;
  faBriefcase = faBriefcase;
  faCalendarAlt = faCalendarAlt;
  faInfoCircle = faInfoCircle;
  faSearch = faSearch;
  faBuilding = faBuilding;
  faCheckCircle = faCheckCircle;
  faPageIcon= faArrowRight;
  faHome = faHome; 
  faUser = faUser;   
  faEdit = faEdit;
  faSignOutAlt = faSignOutAlt;
  faUserTie = faUserTie ;
  faDiagramProject = faDiagramProject ;
  faLink = faLink;
  faUserGraduate = faUserGraduate; 
  faPhone = faPhone;
  faEnvelope = faEnvelope ;
  faUserTag = faUserTag ;
  faSave = faSave  ;
  faLock = faLock;
  faEye = faEye;
  faEyeSlash = faEyeSlash; 
  faMapMarker = faMapMarker ;
  faChevronDown = faChevronDown;
  faFilter  = faFilter ;
// Variables
  showDropdown = false;
showProfileDropdown = false;

showProfileModal = false;
showEditModal = false;
showReservationsModal = false;
showPasswordModal = false;
showOldPassword = false;
showNewPassword = false;
showConfirmPassword = false;
selectedZone: string | null = null;
showTypeFilter = false;
selectedTypeFilter: string | null = null;
// Dans votre composant
etablissements: any[] = [];
espaces: any[] = []; 
selectedEtablissement: any = null;
loading = false;
// Filtrage
currentFilters = {
  type: '',
  zone: ''
};

resetFilters() {
  // Reset filter values
  this.currentFilters = {
    type: '',
    zone: ''
  };
  
  // Reload all establishments without filters
  this.loadEtablissements();
}

// Options de filtrage
establishmentTypes = ['Faculté', 'Institut', 'École'];
zones = ['Zone 1', 'Zone 2', 'Zone 3', 'Zone 4']; 

menuItems = [
  { 
    icon: faUser, 
    title: 'Voir votre profil', 
    action: () => this.openProfile(),
    logout: false
  },
  { 
    icon: faEdit, 
    title: 'Modifier votre profil', 
    action: () => this.openEditProfile(),
    logout: false
  },
  { 
    icon: faLock, 
    title: 'Modifier mot de passe', 
    action: () => this.openPasswordModal(),
    logout: false
  },
  { 
    icon: faCalendarAlt, 
    title: 'Consulter vos réservations', 
    action: () => this.openReservations(),
    logout: false
  },
  { 
    icon: faSignOutAlt, 
    title: 'Se déconnecter', 
    action: () => this.logout(),
    logout: true
  }
];
// Ajouter ces variables
passwordData = {
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
};

editData = {
  nomPrenom: '', 
  fonction: '',
  telephone: '',
  linkedin: '',
  structure: '',
   etablissement: ''
};
// Ajouter ces variables
profileData = {
  nomPrenom: 'Nourhene Zroud',
  email: 'nourhe****oud2003@gmail.com',
  telephone: '+216 28 473 550',
  fonction: 'Étudiante en Ingénierie Informatique',
  etablissement: 'ESSTHS',
  linkedin: 'https://www.linkedin.com/in/nourhen-zroud/',
  structure: '4C',
  type: 'Interne'
};

@HostListener('document:click', ['$event'])
onClick(event: MouseEvent) {
  console.log('Document clicked', event.target);
  if (this.profileContainer?.nativeElement) {
    console.log('Profile container contains target?', 
      this.profileContainer.nativeElement.contains(event.target));
  }
  
  if (this.profileContainer?.nativeElement && !this.profileContainer.nativeElement.contains(event.target)) {
    console.log('Closing dropdown');
    this.showProfileDropdown = false;
  }
}


 toggleProfileDropdown(event: MouseEvent) {
   event.stopPropagation(); // Prevent the click from reaching document
   this.showProfileDropdown = !this.showProfileDropdown;
 }

  toggleTypeFilter() {
    this.showTypeFilter = !this.showTypeFilter;
  }
  
 

 

  // Filter variables
  searchTerm: string = '';
  selectedEstablishment: string | null = null;
  selectedType: string = 'all';

  // For external users
  isExternal: boolean = false;
  selectedUserEstablishment: string = '';

  constructor( private etablissementService: EtablissementService,
    private router: Router) {
    
  }



 
  reserveSpace(spaceId: number) {
    console.log('Attempting to navigate to reservation for space:', spaceId);
    this.router.navigate(['/reservation', spaceId]).then(nav => {
      console.log('Navigation success:', nav);
    }, err => {
      console.error('Navigation error:', err);
    });
  }
 
  // For external users - select establishment
  selectUserEstablishment() {
    alert(`Établissement sélectionné: ${this.selectedUserEstablishment}`);
  }

  onSearch() {
    console.log("Recherche lancée pour :", this.searchTerm);
  }

  toggleDropdown() {
    this.showDropdown = !this.showDropdown;
  }
  
  
  selectEstablishment(establishment: string) {
    this.selectedEstablishment = establishment; // Conserve le nom original sans formatage
    this.showDropdown = false;
  }
  

private titleCase(str: string): string {
  return str.toLowerCase().split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
  
  // Add this to your SpacesComponent class
showTypesDropdown = false;

toggleTypesDropdown() {
  this.showTypesDropdown = !this.showTypesDropdown;
  // Close the other dropdown if open
  this.showDropdown = false;
}

selectType(type: string) {
  this.selectedType = type;
  this.showTypesDropdown = false;
}


  
  openProfile() {
    this.showProfileModal = true;
    this.showProfileDropdown = false;
  }
  
  openEditProfile() {
    console.log('Opening edit modal');
    this.showEditModal = true;
    this.showProfileDropdown = false;
  }
  
  openReservations() {
    this.showReservationsModal = true;
    this.showProfileDropdown = false;
  }
  
  closeModal() {
    this.showProfileModal = false;
    this.showEditModal = false;
    this.showReservationsModal = false;
    this.showPasswordModal = false;
  this.passwordData = { oldPassword: '', newPassword: '', confirmPassword: '' };
  }

  // Méthode d'initialisation
  ngOnInit() {
    this.loadEtablissements();
  }
  loadEtablissements() {
    this.loading = true;
    this.etablissementService.getAllEtablissements().subscribe({
      next: (data) => {
        this.etablissements = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur:', err);
        this.loading = false;
      }
    });
  }
  onFilter(criteria: any) {
    this.etablissementService.filterEtablissements(criteria).subscribe({
      next: (data) => {
        this.etablissements = data;
      }
    });
  }
  applyFilters() {
    if (this.currentFilters.type || this.currentFilters.zone) {
      this.loading = true;
      this.etablissementService.filterEtablissements(this.currentFilters).subscribe({
        next: (data) => {
          this.etablissements = data;
          this.loading = false;
        },
        error: (err) => {
          console.error('Erreur:', err);
          this.loading = false;
        }
      });
    }
  }

  selectEtablissement(etablissement: any) {
    this.loading = true;
    this.selectedEtablissement = etablissement;
    this.etablissementService.getEtablissementWithEspaces(etablissement.id).subscribe({
      next: (data) => {
        this.espaces = data.espaces || [];
        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur:', err);
        this.loading = false;
      }
    });
  }
  goBackToEtablissements() {
    this.selectedEtablissement = null;
    this.espaces = [];
  }










resetEditForm() {
  this.editData = {
    nomPrenom: this.profileData.nomPrenom, 
    fonction: this.profileData.fonction,
    telephone: this.profileData.telephone,
    linkedin: this.profileData.linkedin,
    structure: this.profileData.structure,
    etablissement: this.profileData.etablissement 
  };
}

saveChanges() {
  // Mettre à jour les données (simulation)
  this.profileData = { ...this.profileData, ...this.editData };
  console.log('Données mises à jour:', this.profileData);
  this.closeModal();
}
openPasswordModal() {
  this.showPasswordModal = true;
  this.showProfileDropdown = false;
}

updatePassword() {
  if (this.passwordData.newPassword !== this.passwordData.confirmPassword) {
    alert('Les mots de passe ne correspondent pas!');
    return;
  }
 
  
  // Ajouter la logique de mise à jour ici
  console.log('Mot de passe changé:', this.passwordData);
  this.closeModal();
}
  logout() {
    this.router.navigate(['/auth/login']);
    this.showProfileDropdown = false;
  }
  // Dans votre classe SpacesComponent

// Méthode pour gérer la visibilité du mot de passe
togglePasswordVisibility(field: 'oldPassword' | 'newPassword' | 'confirmPassword') {
  switch (field) {
    case 'oldPassword':
      this.showOldPassword = !this.showOldPassword;
      break;
    case 'newPassword':
      this.showNewPassword = !this.showNewPassword;
      break;
    case 'confirmPassword':
      this.showConfirmPassword = !this.showConfirmPassword;
      break;
  }
}





}                  