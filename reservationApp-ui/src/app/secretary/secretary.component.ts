import { CommonModule } from '@angular/common';
import { Component, ElementRef, HostListener, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faArrowRight,
  faBars,
  faBriefcase,
  faBuilding,
  faCheckCircle,
  faClock,
  faEdit,
  faEnvelope,
  faEye,
  faEyeSlash,
  faHome,
  faKey,
  faLock,
  faPhone,
  faSearch,
  faShare,
  faSignOutAlt,
  faTimesCircle,
  faUniversity,
  faUser,
  faUserTag, faUserTie
} from '@fortawesome/free-solid-svg-icons';
import { AuthService } from '../services/auth/auth.service';

import { faLinkedin } from '@fortawesome/free-brands-svg-icons';



interface Request {
  id: string;
  responsableAction: string;
  email: string;
  fonction: string;
  structure: string;
  type: 'interne' | 'externe';
  linkedin?: URL;
  approvedEquipments: string[];
  intituleAction: string;
  nbrParticipants: number;
  cible: string;
  description: string;
  nomSalle: string;
  respoSalle: string;
  date: string;
  duree: string;
  equipements: string[];
  status: 'pending' | 'approved' | 'rejected';
  decisionDate?: string;
  forwardDate?: string;
  statut?: string;
  seen: boolean;
}

@Component({
  selector: 'app-secretary',
  standalone: true,
  imports: [CommonModule, FormsModule, FontAwesomeModule],
  templateUrl: './secretary.component.html',
  styleUrls: ['./secretary.component.scss']
})
export class SecretaryComponent {
  @ViewChild('profileContainer', { static: true }) profileContainer!: ElementRef;
  // Font Awesome icons
  faHome = faHome; 
  faShare = faShare;
  faSearch = faSearch;
  faPageIcon = faArrowRight;
  faClock = faClock;
  faCheckCircle = faCheckCircle;
  faTimesCircle = faTimesCircle;
  faAccessIcon = faKey;
  faEye = faEye;
  faEyeSlash = faEyeSlash;
  faBars = faBars;
  faLock = faLock ;
  faEdit = faEdit;
  faUser = faUser;
  faBriefcase = faBriefcase ;
  faEnvelope = faEnvelope ;
    faSignOutAlt = faSignOutAlt;
    faPhone = faPhone;
    faUserTag = faUserTag;
    faLinkedin = faLinkedin ;
    faUserTie = faUserTie;
    faBuilding = faBuilding;
    faUniversity = faUniversity;
    showProfileDropdown = false;
  activeTab: 'pending' | 'approved' | 'rejected' = 'pending';
  searchTerm: string = '';
  currentPageTitle: string = 'Gestion des Réservations';
  currentPageSubtitle: string = 'Validation et contrôle des réservations des espaces';
  activeSection: 'access' | 'unseen' | 'seen' = 'access';
  isSidebarExpanded = false;
// États des modales
showDropdown = false;
showProfileModal = false;
showEditModal = false;
showReservationsModal = false;
showPasswordModal = false;
showOldPassword = false;
showNewPassword = false;
showConfirmPassword = false;

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
  // Données de mot de passe
  passwordData = {
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  };
// Données d'édition
editData = {
  nomPrenom: '',
  fonction: '',
  telephone: '',
  linkedin: '',
  structure: '',
  etablissement: ''
};

  allRequests: Request[] = [
    {
      id: 'RES-2025-005',
      responsableAction: 'Nourhen Zroud',
      email: 'nourhen.zroud@univ.com',
      fonction: 'Enseignante',
      structure: 'Département Mathématiques',
      type: 'interne',
      linkedin: new URL('https://www.linkedin.com/in/nourhen-zroud'),
      intituleAction: 'Séminaire de recherche',
      nbrParticipants: 20,
      cible: 'Enseignants et étudiants',
      description: 'Présentation des dernières recherches',
      nomSalle: 'Amphi A',
      respoSalle: 'Samir Toumi',
      date: '20/03/2025',
      duree: '14:00 - 17:00',
      equipements: [],
      approvedEquipments: [], // Vide par défaut
      status: 'pending',
      seen: false
    },
    {
      id: 'RES-2025-001',
      responsableAction: 'Ali Ben Salah',
      email: 'ali.bensalah@univ.com',
      fonction: 'Enseignant',
      structure: 'Département Informatique',
      type: 'interne',
      linkedin: new URL('https://www.linkedin.com/in/ali-bensalah'),
      intituleAction: 'Réunion département informatique',
      nbrParticipants: 15,
      cible: 'Enseignants',
      description: 'Réunion mensuelle du département',
      nomSalle: 'Salle A1',
      respoSalle: 'Mohamed Khemiri',
      date: '15/03/2025',
      duree: '09:00 - 12:00',
      equipements: ['Projecteur', 'Ordinateur'],
      approvedEquipments: [], // Vide par défaut (au lieu de ['Projecteur', 'Ordinateur'])
      status: 'approved',
      decisionDate: '14/03/2025',
      statut: 'Acceptée',
      seen: false
    },
    {
      id: 'RES-2025-002',
      responsableAction: 'Sarra Jouini',
      email: 'sarra.jouini@entreprise.com',
      fonction: 'Responsable RH',
      structure: 'Entreprise XYZ',
      type: 'externe',
      linkedin: new URL('https://www.linkedin.com/in/sarra-jouini'),
      intituleAction: 'Soutenance de projet fin d\'études',
      nbrParticipants: 8,
      cible: 'Étudiants',
      description: 'Présentation des projets fin d\'études',
      nomSalle: 'Amphi B',
      respoSalle: 'Leila Ben Ammar',
      date: '16/03/2025',
      duree: '14:00 - 17:00',
      equipements: [],
      approvedEquipments: [], // Vide par défaut
      status: 'rejected',
      decisionDate: '14/03/2025',
      statut: 'Refusée',
      seen: false
    },
    {
      id: 'RES-2025-003',
      responsableAction: 'Mohamed Khemiri',
      email: 'mohamed.khemiri@univ.com',
      fonction: 'Responsable Labo',
      structure: 'Laboratoire Informatique',
      type: 'interne',
      linkedin: new URL('https://www.linkedin.com/in/mohamed-khemiri'),
      intituleAction: 'Formation enseignants nouveaux logiciels',
      nbrParticipants: 25,
      cible: 'Enseignants',
      description: 'Formation sur les nouveaux outils pédagogiques',
      nomSalle: 'Lab Info 2',
      respoSalle: 'Ali Ben Salah',
      date: '17/03/2025',
      duree: '10:00 - 16:00',
      equipements: ['Projecteur', 'Ordinateurs', 'Système audio'],
      approvedEquipments: [], // Vide par défaut (au lieu de ['Projecteur', 'Ordinateurs', 'Système audio'])
      status: 'pending',
      seen: false
    },
    {
      id: 'RES-2025-004',
      responsableAction: 'Leila Ben Ammar',
      email: 'leila.benammar@univ.com',
      fonction: 'Directrice département',
      structure: 'Département Informatique',
      type: 'interne',
      linkedin: new URL('https://www.linkedin.com/in/leila-benammar'),
      intituleAction: 'Réunion conseil pédagogique',
      nbrParticipants: 12,
      cible: 'Enseignants',
      description: 'Réunion du conseil pédagogique',
      nomSalle: 'Salle de réunion B2',
      respoSalle: 'Mohamed Khemiri',
      date: '18/03/2025',
      duree: '08:30 - 11:30',
      equipements: ['Projecteur', 'Tableau blanc'],
      approvedEquipments: [], // Vide par défaut (au lieu de ['Projecteur', 'Tableau blanc'])
      status: 'approved',
      forwardDate: '14/03/2025',
      statut: 'acceptée',
      seen: true
    }
  ];

  constructor(
    private router: Router,
    private authService: AuthService
  ) {
    // Initialize requests properly
    this.initializeRequests();
  }



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

  private initializeRequests(): void {
    // Safely initialize approvedEquipments
    this.allRequests = this.allRequests.map(request => ({
      ...request,
      approvedEquipments: request.approvedEquipments || []
    }));
  }
  // ... (le reste des méthodes reste inchangé) ...
  markAsSeen(request: Request): void {
    request.seen = true;
  }

  getUnseenRequests(): Request[] {
    return this.allRequests.filter(request => !request.seen);
  }

  getSeenRequests(): Request[] {
    return this.allRequests.filter(request => request.seen);
  }

  getStatusCircleClass(status: string): string {
    const baseClass = 'status-circle';
    switch(status) {
      case 'approved': return `${baseClass} approved`;
      case 'rejected': return `${baseClass} rejected`;
      case 'pending': return `${baseClass} pending`;
      default: return baseClass;
    }
  }

  get stats() {
    return {
      pending: this.allRequests.filter(r => r.status === 'pending').length,
      approved: this.allRequests.filter(r => r.status === 'approved').length,
      rejected: this.allRequests.filter(r => r.status === 'rejected').length
    };
  }

  get filteredRequests(): Request[] {
    let requests = this.allRequests.filter(r => r.status === this.activeTab);
    
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      requests = requests.filter(r => 
        r.responsableAction.toLowerCase().includes(term) || 
        r.id.toLowerCase().includes(term) ||
        r.intituleAction.toLowerCase().includes(term)
      );
    }
    
    return requests;
  }

  setActiveTab(tab: 'pending' | 'approved' | 'rejected'): void {
    this.activeTab = tab;
    this.searchTerm = '';
  }

  approveRequest(request: Request): void {
    if (request.status === 'pending') {
      // Seuls les équipements cochés seront conservés
      request.equipements = [...request.approvedEquipments];
      request.status = 'approved';
      request.decisionDate = new Date().toLocaleDateString();
      request.statut = 'Acceptée';
      request.seen = true;
  
      const year = new Date().getFullYear();
      const seq = this.allRequests.filter(r => r.status === 'approved').length + 1;
      request.id = `RES-${year}-${seq.toString().padStart(3, '0')}`;
    }
  }

  rejectRequest(request: Request): void {
    if (request.status === 'pending') {
      request.status = 'rejected';
      request.decisionDate = new Date().toLocaleDateString();
      request.statut = 'Refusée';
      request.seen = true;
    }
  }

  forwardRequest(request: Request): void {
    if (request.status === 'pending') {
      request.status = 'approved';
      request.forwardDate = new Date().toLocaleDateString();
      request.statut = 'En attente';
      request.seen = true;
    }
  }

  getStatusClass(status: string): { [key: string]: boolean } {
    return {
      'status-pending': status === 'pending' || status === 'En attente',
      'status-approved': status === 'approved' || status === 'Acceptée',
      'status-rejected': status === 'rejected' || status === 'Refusée',
    };
  }

  switchSection(section: 'access' | 'unseen' | 'seen'): void {
    this.activeSection = section;
    this.searchTerm = '';
    
    if (section === 'access') {
      this.activeTab = 'pending';
      this.currentPageTitle = 'Gestion des Réservations';
      this.currentPageSubtitle = 'Validation et contrôle des accès utilisateurs';
    } 
    else if (section === 'unseen') {
      this.currentPageTitle = 'Demandes non vues';
      this.currentPageSubtitle = 'Liste des demandes non encore consultées';
    }
    else {
      this.currentPageTitle = 'Demandes vues';
      this.currentPageSubtitle = 'Liste des demandes déjà consultées';
    }
  }

  toggleSidebar(): void {
    this.isSidebarExpanded = !this.isSidebarExpanded;
  }

  isEquipmentAvailable(equipment: string): boolean {
    return true;
  }

  toggleEquipment(request: Request, equipment: string): void {
    const index = request.approvedEquipments.indexOf(equipment);
    if (index === -1) {
      request.approvedEquipments.push(equipment);
    } else {
      request.approvedEquipments.splice(index, 1);
    }
  }

 
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
      icon: faSignOutAlt, 
      title: 'Se déconnecter', 
      action: () => this.logout(),
      logout: true
    }
  ];





  
  // Filter variables
 
  selectedEstablishment: string | null = null;
  selectedType: string = 'all';

  // For external users
  isExternal: boolean = false;
  selectedUserEstablishment: string = '';

 



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
  this.resetEditForm();
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
// In your component
logout() {
  this.authService.logout().subscribe({
    next: () => {
      // Optional: Show success message
    },
    error: (err) => {
      console.error('Logout error:', err);
      // Optional: Show error message
    }
  });
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

// Méthode appelée lors de la saisie (optionnelle)
onPasswordInput(field: string) {
  // Cette méthode est déclenchée à chaque saisie
  // Le *ngIf gère déjà l'affichage de l'icône
}
}