import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { Router } from '@angular/router';
import { HostListener, ElementRef, ViewChild } from '@angular/core';
import { 
  faChalkboard , faHome, faSearch, faEdit, faTrash, faSave, 
  faArrowRight, faClock, faCheckCircle, faTimesCircle,
  faKey, faPlusSquare, faUser, faSignOutAlt, faEnvelope,
  faBriefcase, faPhone, faUserTag, faUserTie, faBuilding,
  faUniversity, faLock, faUsers , faLaptop
} from '@fortawesome/free-solid-svg-icons';
import { faLinkedin } from '@fortawesome/free-brands-svg-icons';

interface Request {
  id?: string;
  name: string;
  function: string;
  institution: 'ESSTHS' | 'ISSAT' | 'IZET' | 'ISITCOM' | '-';
  email: string;
  phone: string;
  date: string;
  status: 'pending' | 'approved' | 'rejected';
  decisionDate?: string;
  reason?: string;
  approvedEquipments?: any[];
}

interface Personnel {
  id: number;
  nom: string;
  email: string;
  telephone: string;
  fonction: string;
  structure: string;
  etablissement: string;
  salleConcernee: string;
  typePersonnel: string;
}

interface Espace {
  id: number;
  nom: string;
  capacite: number;
  equipement: string;
  responsable: string;
  etablissement: string; 
}

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, FontAwesomeModule],
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss']
})
export class AdminComponent {
  @ViewChild('profileContainer', { static: true }) profileContainer!: ElementRef;
  // Icônes
  faHome = faHome;
  faSearch = faSearch;
  faPageIcon = faArrowRight;
  faClock = faClock;
  faCheckCircle = faCheckCircle;
  faTimesCircle = faTimesCircle;
  faAccessIcon = faKey;
  faAddSpaceIcon = faPlusSquare;
  faBriefcase = faBriefcase;
  faChalkboard= faChalkboard ;
  faEnvelope = faEnvelope;
  faTrash = faTrash;
  faSave = faSave;
  faSignOutAlt = faSignOutAlt;
  faPhone = faPhone;
  faUserTag = faUserTag;
  faLinkedin = faLinkedin;
  faUserTie = faUserTie;
  faBuilding = faBuilding;
  faUniversity = faUniversity;
  faEdit = faEdit;
  faLock = faLock;
  faUsers =  faUsers; faLaptop = faLaptop;
  // États
  showProfileDropdown = false;
  activeTab: 'pending' | 'approved' | 'rejected' = 'pending';
  searchTerm = '';
  activeSection: 'add-personnel' | 'add-espace' | 'manage-personnel' | 'manage-espaces' = 'add-personnel';
  sections = [
    { id: 'add-personnel', title: 'Ajouter Personnel' },
    { id: 'add-espace', title: 'Ajouter Espace' },
    { id: 'manage-personnel', title: 'Gérer Personnel' },
    { id: 'manage-espaces', title: 'Gérer Espaces' }
  ];
  searchPersonnel: string = '';
searchEspace: string = '';


  // Données
  personnels: Personnel[] = [];
  espaces: Espace[] = [];
  currentPersonnel: Personnel = {
    id: 0,
    nom: '',
    email: '',
    telephone: '',
    fonction: '',
    structure: '',
    etablissement: '',
    salleConcernee: '',
    typePersonnel: ' ' 
  };
  currentEspace: Espace = {
    id: 0,
    nom: '',
    capacite: 0,
    equipement: '',
    responsable: '',  
    etablissement: ''
  };
  isEditing = false;

  // États des modales
  showProfileModal = false;
  showEditModal = false;
  showPasswordModal = false;

  // Profil
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

  allRequests: Request[] = [
    {
      name: 'Ali Ben Salah',
      function: 'Enseignant',
      institution: 'ISITCOM',
      email: 'ali.bensalah@isitcom.u-sousse.tn',
      phone: '12345678',
      date: '09/03/2025',
      status: 'pending', 
    },
    {
      name: 'Sarra Jouini',
      function: 'Étudiante',
      institution: 'ESSTHS',
      email: 'sarra.jouini@essths.u-sousse.tn',
      phone: '98765432',
      date: '08/03/2025',
      status: 'pending'
    },
    {
      name: 'Mohamed Khemiri',
      function: 'Technicien',
      institution: 'IZET',
      email: 'mohamed.khemiri@izet.u-sousse.tn',
      phone: '55667788',
      date: '10/03/2025',
      status: 'pending'
    },
    {
      id: 'INT-2025-001',
      name: 'Samia Ben Ahmed',
      function: 'Enseignante',
      institution: 'ESSTHS',
      email: 'samia.benahmed@essths.u-sousse.tn',
      phone: '11223344',
      date: '05/03/2025',
      decisionDate: '07/03/2025',
      status: 'approved'
    },
    {
      id: 'EXT-2025-002',
      name: 'Karim Jlassi',
      function: 'Chercheur',
      institution: 'ISSAT',
      email: 'karim.jlassi@issat.u-sousse.tn',
      phone: '99887766',
      date: '06/03/2025',
      decisionDate: '08/03/2025',
      status: 'approved'
    },
    {
      id: 'INT-2025-003',
      name: 'Hatem Smida',
      function: 'Administratif',
      institution: 'IZET',
      email: 'hatem.smida@izet.u-sousse.tn',
      phone: '44332211',
      date: '01/03/2025',
      decisionDate: '03/03/2025',
      status: 'approved'
    },
    {
      name: 'Houssem Trabelsi',
      function: 'Étudiant',
      institution: 'ESSTHS',
      email: 'houssem.trabelsi@essths.u-sousse.tn',
      phone: '77889900',
      date: '01/03/2025',
      decisionDate: '02/03/2025',
      reason: 'Double réservation',
      status: 'rejected'
    },
    {
      name: 'Leila Ben Ammar',
      function: 'Enseignante',
      institution: 'ISITCOM',
      email: 'leila.benammar@isitcom.u-sousse.tn',
      phone: '00112233',
      date: '28/02/2025',
      decisionDate: '01/03/2025',
      reason: 'Documents incomplets',
      status: 'rejected'
    }
  ];

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

  constructor(private router: Router) {
    this.allRequests.forEach(request => {
      request.approvedEquipments = [];
    });
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

  // Navigation
  setActiveSection(section: string): void {
    this.activeSection = section as any;
    this.cancelEdit();
  }

  savePersonnel() {
    if (this.isEditing) {
      this.personnels = this.personnels.map(p => 
        p.id === this.currentPersonnel.id ? this.currentPersonnel : p
      );
    } else {
      this.currentPersonnel.id = Date.now();
      this.personnels.push({...this.currentPersonnel});
    }
    this.resetForm();
  }

  resetForm() {
    this.currentPersonnel = {
      id: 0,
      nom: '',
      email: '',
      telephone: '',
      fonction: '',
      structure: '',
      etablissement: '',
      salleConcernee: '',
      typePersonnel: 'undefined ' 
    };
    this.isEditing = false;
  }

  editPersonnel(personnel: Personnel): void {
    this.currentPersonnel = {...personnel};
    this.isEditing = true;
    this.activeSection = 'add-personnel';
  }

  deletePersonnel(personnel: Personnel): void {
    if (confirm(`Êtes-vous sûr de vouloir supprimer ${personnel.nom} ?`)) {
      this.personnels = this.personnels.filter(p => p.id !== personnel.id);
    }
  }

  saveEspace(): void {
    if (this.isEditing) {
      this.espaces = this.espaces.map(e => 
        e.id === this.currentEspace.id ? this.currentEspace : e
      );
    } else {
      this.currentEspace.id = Date.now();
      this.espaces.push({...this.currentEspace});
    }
    this.resetForms();
  }

  editEspace(espace: Espace): void {
    this.currentEspace = {...espace};
    this.isEditing = true;
    this.activeSection = 'add-espace';
  }

  deleteEspace(espace: Espace): void {
    this.espaces = this.espaces.filter(e => e.id !== espace.id);
  }

  get filteredPersonnel(): Personnel[] {
    return this.personnels.filter(p =>
      p.nom.toLowerCase().includes(this.searchPersonnel.toLowerCase()) ||
      p.fonction.toLowerCase().includes(this.searchPersonnel.toLowerCase())
    );
  }

  get filteredEspaces(): Espace[] {
    return this.espaces.filter(e =>
      e.nom.toLowerCase().includes(this.searchEspace.toLowerCase())
    );
  }

  cancelEdit(): void {
    this.isEditing = false;
    this.resetForms();
  }

  private resetForms(): void {
    this.currentPersonnel = {
      id: 0,
      nom: '',
      email: '',
      telephone: '',
      fonction: '',
      structure: '',
      etablissement: '',
      salleConcernee: '',
      typePersonnel: 'responsable' // Valeur par défaut
    };
    this.currentEspace = { id: 0, nom: '', capacite: 0 ,  equipement: '',
      responsable: '',  etablissement: '' };
  }

  // Méthodes existantes
  get stats() {
    return {
      pending: this.allRequests.filter(r => r.status === 'pending').length,
      approved: this.allRequests.filter(r => r.status === 'approved').length,
      rejected: this.allRequests.filter(r => r.status === 'rejected').length
    };
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

  get filteredRequests() {
    let requests = this.allRequests.filter(r => r.status === this.activeTab);
    
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      requests = requests.filter(r => 
        r.name.toLowerCase().includes(term) || 
        (r.id && r.id.toLowerCase().includes(term)) ||
        r.function.toLowerCase().includes(term) ||
        r.institution.toLowerCase().includes(term) ||
        r.email.toLowerCase().includes(term) ||
        r.phone.includes(term)
      );
    }
    return requests;
  }

  setActiveTab(tab: 'pending' | 'approved' | 'rejected') {
    this.activeTab = tab;
    this.searchTerm = '';
  }

  approveRequest(index: number) {
    const request = this.allRequests[index];
    if (request && request.status === 'pending') {
      request.status = 'approved';
      request.decisionDate = new Date().toLocaleDateString();
      const year = new Date().getFullYear();
      const seq = this.allRequests.filter(r => r.status === 'approved').length + 1;
      request.id = `INT-${year}-${seq.toString().padStart(3, '0')}`;
    }
  }

  rejectRequest(index: number, reason: string = 'Raison administrative') {
    const request = this.allRequests[index];
    if (request && request.status === 'pending') {
      request.status = 'rejected';
      request.reason = reason;
      request.decisionDate = new Date().toLocaleDateString();
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
    console.log("Recherche lancée pour :", this.searchTerm);
  }
  
  closeModal() {
    this.showProfileModal = false;
    this.showEditModal = false;
    this.showPasswordModal = false;
    this.passwordData = { oldPassword: '', newPassword: '', confirmPassword: '' };
  }

  saveChanges() {
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
  }

 
  

  openProfile() {
    this.showProfileModal = true;
    this.showProfileDropdown = false;
  }

  openEditProfile() {
    console.log('Opening edit modal');
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

  logout() {
    this.router.navigate(['/auth/login']);
    this.showProfileDropdown = false;
  }
  
}

