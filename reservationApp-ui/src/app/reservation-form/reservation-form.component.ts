import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { faInfoCircle, faSearch, faBuilding, faCheckCircle, faHome, faArrowRight , faPlus , faTimes } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { FormsModule, NgForm } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-reservation-form',
  standalone: true,
  imports: [FontAwesomeModule, FormsModule, CommonModule],
  templateUrl: './reservation-form.component.html',
  styleUrls: ['./reservation-form.component.scss']
})
export class ReservationFormComponent {
  faPageIcon = faArrowRight;
  faHome = faHome;
  faPlus = faPlus ;
  faTimes  = faTimes  ;
  isTooltipVisible = false;
 
// Ajoutez ces nouvelles propriétés à votre classe

selectedEquipments: string[] = [];

equipmentsList = ['Projecteur', 'Tableau blanc', 'Ordinateurs', 'Système audio', 'Wi-Fi'];
customEquipment: string = '';
 
 
  showEquipmentModal = false;
  newEquipmentName = '';
 
  
  reservation = {
    responsableAction: '',
    intituleAction: '',
    nbrParticipant: null as number | null,
    numTel: '',
    cible: '',
    email: '',
    fonction: '',
    structure: '',
    linkedin: '',
    description: ''
  };

  formSubmitted = false;

  constructor(private router: Router) {}
  showAddEquipmentModal() {
    this.showEquipmentModal = true;
    this.newEquipmentName = '';
  }
 
 // Méthode pour annuler l'ajout
cancelAddEquipment() {
  this.showEquipmentModal = false;
  this.customEquipment = ''; // Ceci vide le champ
  this.newEquipmentName = ''; // Ceci vide également l'autre variable si nécessaire
}
  // Modifiez la méthode pour ajouter un équipement
  addCustomEquipment() {
    const newEq = this.customEquipment.trim();
    if (newEq) {
      const key = newEq.toLowerCase().replace(/\s+/g, '_');
      
      // Ajout à la liste
      if (!this.equipmentsList.some(e => e.toLowerCase() === newEq.toLowerCase())) {
        this.equipmentsList = [...this.equipmentsList, newEq];
      }
      
     
      
      this.customEquipment = '';
      this.showEquipmentModal = false;
    }
  }
  // Validation email
  emailIsValid(): boolean {
    return this.reservation.email.includes('@') && 
           this.reservation.email.includes('.') &&
           this.reservation.email.length > 5;
  }
  // Réinitialiser le formulaire
  resetSpaceForm() {
   
   
   
  }
  // Validation LinkedIn URL
  linkedInIsValid(): boolean {
    if (!this.reservation.linkedin) return false;
    
    try {
      const url = new URL(this.reservation.linkedin);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
      return false;
    }
  }

  // Validation nombre de participants
  participantsIsValid(): boolean {
    return this.reservation.nbrParticipant !== null && 
           this.reservation.nbrParticipant > 0;
  }

  isFormValid(form: NgForm): boolean {
    // Check all validations in one pass
    return this.reservation.responsableAction.trim() !== '' &&
           this.reservation.intituleAction.trim() !== '' &&
           this.participantsIsValid() &&
           this.reservation.cible.trim() !== '' &&
           this.emailIsValid() &&
           this.reservation.fonction.trim() !== '' &&
           this.reservation.structure.trim() !== '' &&
           this.linkedInIsValid() &&
           this.reservation.description.trim() !== '';
  }

  onSubmit(form: NgForm) {
    this.formSubmitted = true;
    
    if (this.isFormValid(form)) {
      this.router.navigate(['/calendar'], {
        state: { reservationData: this.reservation }
      });
    } else {
      // Les erreurs seront affichées via le template
      console.warn('Formulaire invalide');
    }
  }

  goBack() {
    this.router.navigate(['/spaces']);
  }

  // Helper pour afficher les erreurs de champ
  showError(field: string): boolean {
    return this.formSubmitted && 
           (this.reservation[field as keyof typeof this.reservation] === '' || 
            (field === 'nbrParticipant' && !this.participantsIsValid()) ||
            (field === 'email' && !this.emailIsValid()) ||
            (field === 'linkedin' && !this.linkedInIsValid()));
  }
}