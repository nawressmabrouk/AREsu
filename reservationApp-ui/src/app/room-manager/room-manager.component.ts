import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { Router } from '@angular/router';
import { AuthService } from './../auth/services/auth.service'; 
import { HostListener, ElementRef, ViewChild } from '@angular/core';
import { 
  faHome,  
  faArrowRight,
  faSearch,
  faClock, 
  faCheckCircle, 
  faTimesCircle, 
  faBars,
  faKey,
  faPlusSquare, 
  faSave,
  faEdit, 
  faTrash,  
  faDoorOpen,
  faBuilding,
  faChalkboard,
  faUsers,
  faTools,
  faChalkboardTeacher,
  faDesktop,
  faVolumeUp,
  faPlusCircle,
  faWifi, 
  faUser, 
  faDiagramProject, 
  faSignOutAlt,  
  faLock, 
  faBriefcase, 
  faUniversity,
  faUserTie, 
  faEye, 
  faCalendarAlt, 
  faEyeSlash,  
  faUserGraduate, 
  faPhone, 
  faEnvelope, 
  faUserTag 
} from '@fortawesome/free-solid-svg-icons';
import { faLinkedin } from '@fortawesome/free-brands-svg-icons'; 
interface Request {
  id: string;
  responsableAction: string;
  email: string;
  fonction: string;
  structure: string;
  type: 'interne' | 'externe';
  intituleAction: string;
  nbrParticipants: number;
  cible: string;
  linkedin?: string; // Nouveau champ
  nomSalle: string;
  equipements: string[];
  approvedEquipments: string[];
  startTime: string;
  endTime: string;
  description?: string; // Nouveau champ
  status: 'pending' | 'approved' | 'rejected';
  decisionDate?: string;
  reason?: string;
  role?: string;
}
interface Space {
  name: string;
  institution: string;
  capacity: number;
  type: string;
  equipments: {
    [key: string]: boolean;
    projector: boolean;
    whiteboard: boolean;
    computers: boolean;
    audio: boolean;
    wifi: boolean;
  };
}

@Component({
  selector: 'app-room-manager',
  standalone: true,
  imports: [CommonModule, FormsModule, FontAwesomeModule],
  templateUrl: './room-manager.component.html',
  styleUrls: ['./room-manager.component.scss']
})
export class RoomManagerComponent {
  @ViewChild('profileContainer', { static: true }) profileContainer!: ElementRef;
  // Font Awesome icons
  faHome = faHome; 
  faSearch = faSearch;
  faPageIcon = faArrowRight;
  faClock = faClock;
  faCheckCircle = faCheckCircle;
  faTimesCircle = faTimesCircle;
  faAccessIcon = faKey;
  faAddSpaceIcon = faPlusSquare;
  faBars = faBars;
  faSave = faSave;
  faEdit = faEdit;
  faTrash = faTrash;
  faDoorOpen = faDoorOpen;
  faBuilding = faBuilding;
  faChalkboard = faChalkboard;
  faUsers = faUsers;
  faTools = faTools;
  faPlusCircle = faPlusCircle;
  faChalkboardTeacher = faChalkboardTeacher;
  faDesktop = faDesktop;
  faVolumeUp = faVolumeUp;
  faWifi = faWifi;
  faSignOutAlt = faSignOutAlt;
  faCalendarAlt = faCalendarAlt;
  faUserTie = faUserTie;
  faDiagramProject = faDiagramProject;
  faUser = faUser;
  faUserGraduate = faUserGraduate; 
  faPhone = faPhone;
  faEnvelope = faEnvelope;
  faUserTag = faUserTag;
  faLinkedin = faLinkedin;
  faUniversity = faUniversity;
  faBriefcase = faBriefcase;
  faLock = faLock;
  faEye = faEye;
  faEyeSlash = faEyeSlash; 

  // UI State
  isTooltipVisible = false;
  isSidebarExpanded = false;
  showDropdown = false;
  showProfileDropdown = false;
  showProfileModal = false;
  showEditModal = false;
  showReservationsModal = false;
  showPasswordModal = false;
  showOldPassword = false;
  showNewPassword = false;
  showConfirmPassword = false;
  showEquipmentModal = false;

  // Data
  institutions = ['ESSTHS', 'IZET', 'ISSAT', 'ISITCOM'];
  spaceTypes = ['Amphithéâtre', 'Salle de conférence', 'Laboratoire', 'Salle de réunion', 'Salle de cours'];
  equipmentsList = ['Projecteur', 'Tableau blanc', 'Ordinateurs', 'Système audio', 'Wi-Fi'];
  customEquipment: string = '';
  
  currentPageTitle: string = 'Gestion des Réservations';
  currentPageSubtitle: string = 'Validation et contrôle des réservations des espaces';
  activeTab: 'pending' | 'approved' | 'rejected' = 'pending';
  searchTerm: string = '';
  activeSection: 'access' | 'space' = 'access';

  // New space form
  newSpace: Space = {
    name: '',
    institution: 'ESSTHS',
    capacity: 0,
    type: 'Salle de cours',
    equipments: {
      projector: false,
      whiteboard: false,
      computers: false,
      audio: false,
      wifi: false
    }
  };

  // User data
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

  // Sample data
  spaces: Space[] = [
    {
      name: 'Salle A1',
      institution: 'ESSTHS',
      capacity: 30,
      type: 'Salle de cours',
      equipments: {
        projector: true,
        whiteboard: true,
        computers: false,
        audio: false,
        wifi: true
      }
    },
    {
      name: 'Amphi B',
      institution: 'ISITCOM',
      capacity: 120,
      type: 'Amphithéâtre',
      equipments: {
        projector: true,
        whiteboard: false,
        computers: false,
        audio: true,
        wifi: true
      }
    },
    {
      name: 'Lab Info 2',
      institution: 'ISSAT',
      capacity: 25,
      type: 'Laboratoire',
      equipments: {
        projector: true,
        whiteboard: false,
        computers: true,
        audio: true,
        wifi: true
      }
    }
  ];

  allRequests: Request[] = [
    {
      id: 'RM-2023-001',
      responsableAction: 'Ali Ben Salah',
      email: 'ali.bensalah@univ.com',
      fonction: 'Enseignant',
      structure: 'Département Informatique',
      type: 'interne',
      intituleAction: 'Réunion département',
      nbrParticipants: 15,
      cible: 'Enseignants',
      linkedin: 'https://www.linkedin.com/in/ali-bensalah',
      nomSalle: 'Salle A1',
      equipements: ['Projecteur', 'Ordinateur'],
      approvedEquipments: [], 
      startTime: '14:00',
      endTime: '17:00',
      description: 'Réunion mensuelle du département',
      status: 'pending',
      role: 'Demandeur'
    },
    // ... autres exemples
  ];

  editingIndex: number | null = null;

  constructor(private router: Router , private authService: AuthService) {}


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
  // Navigation methods
  switchSection(section: 'access' | 'space') {
    this.activeSection = section;
    this.searchTerm = '';
    
    if (section === 'access') {
      this.activeTab = 'pending';
      this.currentPageTitle = 'Gestion des Réservations';
      this.currentPageSubtitle = 'Validation et contrôle des accès utilisateurs';
    } else {
      this.currentPageTitle = 'Gestion des Espaces';
      this.currentPageSubtitle = 'Création et configuration des espaces';
      this.resetSpaceForm();
    }
  }

  toggleSidebar() {
    this.isSidebarExpanded = !this.isSidebarExpanded;
  }

  // Space management methods
  addSpace() {
    if (this.editingIndex !== null && this.editingIndex >= 0) {
      this.spaces[this.editingIndex] = {...this.newSpace};
    } else {
      this.spaces.push({...this.newSpace});
    }
    this.resetSpaceForm();
  }

  editSpace(index: number) {
    this.editingIndex = index;
    this.newSpace = {...this.spaces[index]};
  }

  deleteSpace(index: number) {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet espace?')) {
      this.spaces.splice(index, 1);
    }
  }

  resetSpaceForm() {
    this.newSpace = {
      name: '',
      institution: 'ESSTHS',
      capacity: 0,
      type: 'Salle de cours',
      equipments: {
        projector: false,
        whiteboard: false,
        computers: false,
        audio: false,
        wifi: false
      }
    };
    this.editingIndex = null;
  }

  // Equipment methods
  showAddEquipmentModal() {
    this.showEquipmentModal = true;
 
  }

  cancelAddEquipment() {
    this.showEquipmentModal = false;
    this.customEquipment = '';
 
  }

  addCustomEquipment() {
    const newEq = this.customEquipment.trim();
    if (newEq) {
      const key = newEq.toLowerCase().replace(/\s+/g, '_');
      
      if (!this.equipmentsList.some(e => e.toLowerCase() === newEq.toLowerCase())) {
        this.equipmentsList = [...this.equipmentsList, newEq];
      }
      
      this.newSpace.equipments = {
        ...this.newSpace.equipments,
        [key]: true
      };
      
      this.customEquipment = '';
      this.showEquipmentModal = false;
    }
  }

  getEquipmentKeys(equipments: any): string[] {
    return Object.keys(equipments).filter(key => equipments[key]);
  }

  // Request management methods
  get stats() {
    return {
      pending: this.allRequests.filter(r => r.status === 'pending').length,
      approved: this.allRequests.filter(r => r.status === 'approved').length,
      rejected: this.allRequests.filter(r => r.status === 'rejected').length
    };
  }

  filteredSpaces(): Space[] {
    if (!this.searchTerm) {
      return this.spaces;
    }
    
    const term = this.searchTerm.toLowerCase();
    return this.spaces.filter(space => 
      space.name.toLowerCase().includes(term) ||
      space.institution.toLowerCase().includes(term) ||
      space.type.toLowerCase().includes(term) ||
      Object.entries(space.equipments)
        .filter(([_, value]) => value)
        .some(([key]) => key.toLowerCase().includes(term))
    );
  }

  get filteredRequests() {
    return this.allRequests.filter(request => 
      request.status === this.activeTab &&
      (this.searchTerm === '' || 
       Object.values(request).some(v => 
         v && v.toString().toLowerCase().includes(this.searchTerm.toLowerCase())
      ))
    );
  }

  setActiveTab(tab: 'pending' | 'approved' | 'rejected') {
    this.activeTab = tab;
    this.searchTerm = '';
  }
  toggleEquipment(request: Request, equipment: string): void {
    const index = request.approvedEquipments.indexOf(equipment);
    if (index === -1) {
      request.approvedEquipments.push(equipment);
    } else {
      request.approvedEquipments.splice(index, 1);
    }
  }

  approveRequest(index: number) {
    const request = this.allRequests[index];
  if (request && request.status === 'pending') {
    // Conserver uniquement les équipements approuvés
    request.equipements = [...request.approvedEquipments];
    request.status = 'approved';
    request.decisionDate = new Date().toISOString().split('T')[0];
    
    const year = new Date().getFullYear();
    const seq = this.allRequests.filter(r => r.status === 'approved').length + 1;
      
      if (request.role === 'Demandeur') {
        request.id = `${request.type === 'interne' ? 'INT' : 'EXT'}-${year}-${seq.toString().padStart(3, '0')}`;
      } else if (request.role === 'Responsable salle') {
        request.id = `RES-${year}-${seq.toString().padStart(3, '0')}`;
      } else if (request.role === 'Secrétaire générale') {
        request.id = `SEC-${year}-${seq.toString().padStart(3, '0')}`;
      }
    }
  }

  rejectRequest(index: number, reason: string = 'Raison administrative') {
    const request = this.allRequests[index];
    if (request && request.status === 'pending') {
      request.status = 'rejected';
      request.reason = reason;
      request.decisionDate = new Date().toISOString().split('T')[0];
    }
  }

  getStatusClass(status: string) {
    return {
      'status-pending': status === 'pending',
      'status-approved': status === 'approved',
      'status-rejected': status === 'rejected'
    };
  }

  onSearch() {
    // La recherche est gérée par les getters filteredRequests et filteredSpaces
  }




  
  
  openProfile() {
    this.showProfileModal = true;
    this.showProfileDropdown = false;
  }
  
  openEditProfile() {
    this.editData = {
      nomPrenom: this.profileData.nomPrenom,
      fonction: this.profileData.fonction,
      telephone: this.profileData.telephone,
      linkedin: this.profileData.linkedin,
      structure: this.profileData.structure,
      etablissement: this.profileData.etablissement
    };
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

  openPasswordModal() {
    this.showPasswordModal = true;
    this.showProfileDropdown = false;
  }

  updatePassword() {
    if (this.passwordData.newPassword !== this.passwordData.confirmPassword) {
      alert('Les mots de passe ne correspondent pas!');
      return;
    }
    
    if (this.passwordData.newPassword.length < 8) {
      alert('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }
    
    console.log('Mot de passe changé:', this.passwordData);
    this.closeModal();
  }

  saveChanges() {
    this.profileData = { ...this.profileData, ...this.editData };
    console.log('Données mises à jour:', this.profileData);
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

  // Password visibility toggles
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

  onPasswordInput(field: string) {
    // Gestion supplémentaire si nécessaire
  }
}