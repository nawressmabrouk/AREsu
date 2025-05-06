import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { 
  faUser, faEnvelope, faBriefcase, faPhone, 
  faBuilding, faLink, faLock , faHome , faArrowRight , faTasks , faPlusCircle , faUsersCog ,   
  faUsers, 
  faTools, 
  faUniversity
} from '@fortawesome/free-solid-svg-icons';
import { AdminRegistrationService } from '../services/admin/admin-registration.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProfileComponent } from '../shared/components/profile/profile.component';
import { NotificationComponent } from '../alert-notif/notification.component';
import { NotificationService } from '../services/alert-notif/notification.service';
interface Espace {
  id: string; // Optionnel car généré par MongoDB
  nom: string;
  capacite: number;
  equipement: string;
  responsableId: string;
  etablissementId: string;
}
@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule, RouterModule, FormsModule , ProfileComponent, NotificationComponent],
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss']
})


export class AdminComponent {
  faUser = faUser;
  faEnvelope = faEnvelope;
  faBriefcase = faBriefcase;
  faPhone = faPhone;
  faBuilding = faBuilding;
  faUniversity = faUniversity;
  faLink = faLink;
  faLock = faLock;
  faUsers = faUsers;
faTools = faTools;
  faHome = faHome ;
  faPageIcon = faArrowRight ;
  faUsersCog = faUsersCog ;
  faTasks = faTasks ;
  faPlusCircle = faPlusCircle ;
  showModal: string | null = null;
  currentEspaceView: string | null = null;
  showEspaceOptions: boolean = false;
  
  espace: any = {};
  espaces: Espace[] = []; // Liste des espaces
currentEspace: Espace = {
  id: '', 
  nom: '',
  capacite: 0,
  equipement: '',
  responsableId: '',
  etablissementId: ''
};

  // currentUser pour le profile
  currentUser: any = {
    role: 'ADMIN',
    nomPrenom: 'Admin',
    email: 'admin@univ-sousse.tn'
  };

// Méthodes pour gérer les modales
openModal(modalType: string): void {
  this.showModal = modalType;
  if (modalType === 'gestion-espaces') {
    this.currentEspaceView = 'ajouter-espace'; // Vue par défaut
  }
}
toggleEspaceOptions() {
  this.showEspaceOptions = !this.showEspaceOptions;
  // Si vous voulez fermer les options quand on clique ailleurs
  if (!this.showEspaceOptions) {
    this.showModal = null;
  }
}

closeModal(): void {
  this.showModal = null;
  this.currentEspaceView = null;
}
searchEspace: string = ''; // Pour la recherche
isEditingEspace: boolean = false; // Mode édition
  currentView: 'sous-admin' | 'ajouter-espace' | 'gerer-espaces' = 'sous-admin';
  selectedEspace: any = null;
  espaceFormData: any = {
    nom: '',
    capacite: null,
    equipement: '',
    etablissementId: ''
  }; 

  constructor(
    private router: Router,
    private adminService: AdminRegistrationService ,
    private notificationService: NotificationService,

  ) {}

  ngOnInit() {
    this.loadEspacesFromLocalStorage();
  }
  private loadEspacesFromLocalStorage() {
    const savedEspaces = localStorage.getItem('espaces');
    if (savedEspaces) {
      this.espaces = JSON.parse(savedEspaces);
    }
  }

  private saveEspacesToLocalStorage() {
    localStorage.setItem('espaces', JSON.stringify(this.espaces));
  }


  onSubmit(
    lastName: string,
    firstName: string,
    email: string,
    fonction: string,
    numTel: string,
    nomEtablissement: string,
    linkedInLink: string,
    structure: string,
    isSecretaire: boolean,
    isResponsable: boolean,
    espacesResponsables: string,
    event: Event
  ) {
    event.preventDefault();
  

    // Liste des champs obligatoires (sans linkedInLink)
    const requiredFields = {
      'Nom': firstName,
      'Prénom': lastName,
      'Email': email,
      'Fonction': fonction,
      'Téléphone': numTel,
      'Établissement': nomEtablissement,
      'Structure': structure,
      'espaces responsables': espacesResponsables ,
      'Rôle': (isSecretaire || isResponsable),
   
    };
  
    // Vérification des champs obligatoires
    for (const [fieldName, value] of Object.entries(requiredFields)) {
      if (!value) {
        this.notificationService.showError(`Le champ ${fieldName} est obligatoire`);
        return;
      }
    }
  
      // Validation du format de l'email
  if (!this.isValidEmail(email)) {
    this.notificationService.showError('Veuillez entrer une adresse email valide (ex: exemple@domain.com)');
    return;
  }

 
  
  
    // Préparation des données (linkedInLink reste optionnel)
    const userData = {
      nom: firstName,
      prenom: lastName,
      email: email,
      numTel: numTel,
      role: isSecretaire ? 'SECRETAIRE_GENERALE' : 'RESPONSABLE_SALLE',
      fonction: fonction,
      nomEtablissement: nomEtablissement,
      structure: structure,
      linkedin: linkedInLink, // Ce champ reste optionnel
      espacesResponsables: espacesResponsables 
        ? espacesResponsables.split(',').map(item => item.trim())
        : []
    };
  
    this.adminService.registerAdmin(userData).subscribe({
      next: (response) => {
        this.notificationService.showSuccess('Sous-admin créé avec succès !');
      },
      error: (error) => {
        console.error(error);
        this.notificationService.showError('Erreur lors de la création du compte.');
      }
    });
  }


 //  méthodes pour ajouter  les espaces
 onSubmitEspace(responsableId: string) {
  // Liste des champs obligatoires
  const requiredFields = {
    'ID du responsable': responsableId,
    'Nom de l\'espace': this.espaceFormData.nom,
    'Capacité': this.espaceFormData.capacite,
    'ID de l\'établissement': this.espaceFormData.etablissementId
  };

  // Vérification des champs
  for (const [fieldName, value] of Object.entries(requiredFields)) {
    if (!value || (fieldName === 'Capacité' && value <= 0)) {
      this.notificationService.showError(`${fieldName} est requis`);
      return;
    }
  }
  
  const espaceData = {
    nom: this.espaceFormData.nom,
    capacite: this.espaceFormData.capacite,
    equipement: this.espaceFormData.equipement.split(',').map((e: string) => e.trim()),
    etablissementId: this.espaceFormData.etablissementId,
    responsableId: responsableId
  };

  this.adminService.ajouterEspace(responsableId, espaceData).subscribe({
    next: (response) => {
      // Ajout à la liste locale
      const newEspace = {
        id: response.id || Date.now().toString(), // Si l'API ne retourne pas d'ID, on en génère un
        ...espaceData,
        equipement: espaceData.equipement.join(', ')
      };
      
      this.espaces.push(newEspace);
      this.saveEspacesToLocalStorage();
      
      this.notificationService.showSuccess('Espace ajouté avec succès');
      this.currentView = 'gerer-espaces';
      this.resetEspaceForm();
    },
    error: (err) => {
      console.error(err);
      this.notificationService.showError(`Erreur: ${err.error?.message || 'Échec de l\'ajout'}`);
    }
  });
}

//  méthode pour valider le format d'email
isValidEmail(email: string): boolean {
  // Expression régulière simple pour validation d'email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

//  méthodes pour modifier  les espaces
onModifierEspace() {
  if (!this.currentEspace.id) return;

  // Formatage des données pour le backend
  const espaceData = {
    nom: this.espaceFormData.nom,
    capacite: this.espaceFormData.capacite,
    equipement: this.espaceFormData.equipement.split(',').map((e: string) => e.trim()),
    etablissementId: this.espaceFormData.etablissementId,
    responsableId: this.currentEspace.responsableId // Conservé depuis l'original
  };

  // Appel au service
  this.adminService.modifierEspace(this.currentEspace.id, espaceData).subscribe({
    next: (updatedEspace) => {
      // Met à jour le localStorage ET l'interface
      const index = this.espaces.findIndex(e => e.id === this.currentEspace.id);
      
      if (index !== -1) {
        // Fusionne les nouvelles données avec l'ID existant
        this.espaces[index] = { 
          ...this.espaces[index],
          ...updatedEspace,
          equipement: updatedEspace.equipement.join(', ') // Adaptation pour l'affichage
        };
        
        this.saveEspacesToLocalStorage();
        this.notificationService.showSuccess('Modification réussie !');
        
        // Retour à la liste
        this.currentView = 'gerer-espaces';
        this.resetEspaceForm();
        this.isEditingEspace = false;
      }
    },
    error: (err) => {
      console.error('Échec de la modification', err);
      this.notificationService.showError(`Erreur: ${err.error?.message || 'Modification échouée'}`);
    }
  });
}

// In your AdminComponent
onSupprimerEspace(responsableId: string, espaceId: string) {
  if (confirm('Confirmez la suppression de cette espace  ?')) {
    this.adminService.supprimerEspace(responsableId, espaceId).subscribe({
      next: (response) => {
        // Remove from local array
        this.espaces = this.espaces.filter(e => e.id !== espaceId);
        this.saveEspacesToLocalStorage(); // Mise à jour du localStorage
        this.notificationService.showSuccess('Supprimé avec succès');
      },
      error: (err) => {
        console.error('Erreur de suppression:', err);
        this.notificationService.showError(`Erreur: ${err.status} ${err.statusText}`);
      }
    });
  }
}
// Pour filtrer les espaces
get filteredEspaces(): Espace[] {
  return this.espaces.filter(e =>
    e.nom.toLowerCase().includes(this.searchEspace.toLowerCase()) ||
    e.responsableId.toLowerCase().includes(this.searchEspace.toLowerCase())
  );
} 
// Pour éditer un espace
onEditEspace(espace: Espace): void {
  this.currentEspace = {...espace};
  this.espaceFormData = {
    responsableId: espace.responsableId,
    nom: espace.nom,
    capacite: espace.capacite,
    equipement: espace.equipement,
    etablissementId: espace.etablissementId
  };
  this.currentView = 'ajouter-espace';
  this.isEditingEspace = true;
}
private resetEspaceForm() {
  this.espaceFormData = {
    responsableId: '',
    nom: '',
    capacite: null,
    equipement: '',
    etablissementId: ''
  };
} 
cancelEditEspace() {
  this.isEditingEspace = false;
  this.resetEspaceForm();
  this.currentView = 'gerer-espaces';
}



}