// dashboard.component.ts
import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Etablissement } from '../../models/etablissement.model';
import { SuperAdminService } from '../../services/super-admin/super-admin.service';
import { ProfileComponent } from '../../shared/components/profile/profile.component';
import { EtablissementCardComponent } from '../etablissement-card/etablissement-card.component';
import { EtablissementDetailsComponent } from '../etablissement-details/etablissement-details.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    EtablissementCardComponent,
    EtablissementDetailsComponent,
    MatProgressSpinnerModule,
    ProfileComponent,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  etablissements: Etablissement[] = [];
  selectedEtablissement: Etablissement | null = null;
  isLoading = true;
currentUser: any;

  constructor(private superAdminService: SuperAdminService) {}

  ngOnInit(): void {
    this.loadEtablissements();
  }

  loadEtablissements(): void {
    this.isLoading = true;
    this.superAdminService.getAllEtablissements().subscribe({
      next: (data) => {
        this.etablissements = data;
        this.isLoading = false;
      },
      error: () => this.isLoading = false
    });
  }

  showEtablissementDetails(etablissement: Etablissement): void {
    this.selectedEtablissement = etablissement;
  }
}