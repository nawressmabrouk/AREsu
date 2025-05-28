import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { RouterLink } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { 
  faHome,  
  faArrowRight
} from '@fortawesome/free-solid-svg-icons';
import { trigger, transition, style, animate } from '@angular/animations';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, FontAwesomeModule , CommonModule , RouterModule , RouterLink ],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
 
})
export class HomeComponent implements OnInit {
  faHome = faHome;
etablissements: string[] = [
    'Université de Sousse',
    'Institut des Hautes Études Commerciales',
    'Institut de Finance et Fiscalité',
    'Institut des Beaux-Arts',
    'Institut Supérieur de Gestion',
    'Institut d’Informatique et Communication',
    'Institut de Musique',
    'Institut des Sciences Appliquées et de Technologie',
    'Institut de Transport et Logistique',
    'Institut Agronomique de Chott-Mariem',
    'Institut des Sciences Infirmières',
    'Faculté de Médecine',
    'Faculté de Droit et des Sciences Politiques',
    'Faculté des Lettres et des Sciences Humaines',
    'Faculté des Sciences Économiques et de Gestion',
    'École Nationale des Ingénieurs',
    'École des Sciences et Technologies de Hammam Sousse',
    'École des Sciences et Techniques de la Santé'
  ];
  currentInstitutionIndex = 0;
showAnimation = false;
  constructor(private router: Router) {}


  currentEtablissement: string = this.etablissements[0];
  currentIndex = 0;
  intervalId: any;
  navigateToLogin() {
    this.router.navigate(['/navbar/auth']);
  }
  ngOnInit() {
    this.startCarousel();
  }

   startCarousel() {
    this.intervalId = setInterval(() => {
      this.currentIndex = (this.currentIndex + 1) % this.etablissements.length;
      this.currentEtablissement = this.etablissements[this.currentIndex];
    }, 1700); // Changement toutes les 1 seconde
  }


    ngOnDestroy() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  navigateToRegister() {
    this.router.navigate(['/navbar/register']);
  }


  getLogoPath(etablissement: string): string {
  const logoMap: {[key: string]: string} = {
    'Université de Sousse': 'universitee.png',
    'Institut des Hautes Études Commerciales': 'institut-des-hautes-etudes-commerciales-de-sousse.png',
    'Institut de Finance et Fiscalité': 'isff.png',
    'Institut des Beaux-Arts': 'beauxart.png',
    'Institut Supérieur de Gestion': 'isgs-logo.png',
    'Institut d’Informatique et Communication': 'isit-logo.png',
    'Institut de Musique': 'isms.png',
    'Institut des Sciences Appliquées et de Technologie': 'ISSATSO-logo.png',
    'Institut de Transport et Logistique': 'istls-logo.png',
    'Institut Agronomique de Chott-Mariem': 'chatmariem.png',
    'Institut des Sciences Infirmières': 'logo_issis.png',
    'Faculté de Médecine': 'medecine.png',
    'Faculté de Droit et des Sciences Politiques': 'droit.png',
    'Faculté des Lettres et des Sciences Humaines': 'OIP.png', // Ajustez si nécessaire
    'Faculté des Sciences Économiques et de Gestion': 'fseg.png',
    'École Nationale des Ingénieurs': 'eniso.png',
    'École des Sciences et Technologies de Hammam Sousse': 'essths.png',
    'École des Sciences et Techniques de la Santé': 'sante.png'
  };
  return logoMap[etablissement] || 'OIP.png'; // Fallback image
}

getShortName(etablissement: string): string {
  return etablissement
    .replace('Université de Sousse', 'U. Sousse')
    .replace('Institut', 'Inst.')
    .replace('Faculté', 'Fac.')
    .replace('École', 'Éc.')
    .replace('des ', '')
    .replace('de ', '');
}

resetCurrentEtablissement() {
  if (!this.intervalId) {
    this.currentEtablissement = this.etablissements[0];
  }
}
}