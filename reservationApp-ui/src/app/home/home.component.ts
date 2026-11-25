import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../services/auth/auth.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, MatButtonModule, MatIcon],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);

  readonly loggedIn = this.auth.isLoggedIn();
  readonly homeRoute = this.auth.homeRouteFor(this.auth.getCurrentUser()?.role);

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

  readonly steps = [
    { icon: 'person_add', title: 'Créez votre compte', text: 'Inscrivez-vous en tant que demandeur interne ou externe et activez votre compte par e-mail.' },
    { icon: 'travel_explore', title: 'Choisissez un espace', text: 'Parcourez les établissements et filtrez les salles, amphithéâtres et espaces disponibles.' },
    { icon: 'event_available', title: 'Sélectionnez un créneau', text: 'Consultez le calendrier en temps réel et choisissez une date et un horaire libres.' },
    { icon: 'verified', title: 'Recevez la validation', text: 'Le responsable de l’espace étudie votre demande ; vous êtes notifié par e-mail.' },
  ];

  currentEtablissement: string = this.etablissements[0];
  currentIndex = 0;
  intervalId: ReturnType<typeof setInterval> | null = null;

  ngOnInit() {
    this.startCarousel();
  }

  ngOnDestroy() {
    this.stopCarousel();
  }

  startCarousel() {
    this.stopCarousel();
    this.intervalId = setInterval(() => {
      this.currentIndex = (this.currentIndex + 1) % this.etablissements.length;
      this.currentEtablissement = this.etablissements[this.currentIndex];
    }, 2200);
  }

  stopCarousel() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  // Hovering / focusing a partner shows it in the hero and pauses the rotation
  highlight(etab: string) {
    this.stopCarousel();
    this.currentEtablissement = etab;
  }

  resetCurrentEtablissement() {
    this.currentIndex = Math.max(0, this.etablissements.indexOf(this.currentEtablissement));
    this.startCarousel();
  }

  navigateToLogin() {
    this.router.navigate(['/login']);
  }

  navigateToRegister() {
    this.router.navigate(['/register']);
  }

  getLogoPath(etablissement: string): string {
    const logoMap: { [key: string]: string } = {
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
      'Faculté des Lettres et des Sciences Humaines': 'OIP.png',
      'Faculté des Sciences Économiques et de Gestion': 'fseg.png',
      'École Nationale des Ingénieurs': 'eniso.png',
      'École des Sciences et Technologies de Hammam Sousse': 'essths.png',
      'École des Sciences et Techniques de la Santé': 'sante.png'
    };
    return logoMap[etablissement] || 'OIP.png';
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
}
