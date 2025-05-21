// etablissement-card.component.ts
import { Component, Input } from '@angular/core';
import { Etablissement } from '../../models/etablissement.model';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-etablissement-card',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './etablissement-card.component.html',
  styleUrl: './etablissement-card.component.scss'
})
export class EtablissementCardComponent {
  @Input() etablissement!: Etablissement;
  @Input() isActive = false;
}