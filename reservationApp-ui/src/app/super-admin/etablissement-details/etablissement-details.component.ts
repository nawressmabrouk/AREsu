// etablissement-details.component.ts
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Etablissement } from '../../models/etablissement.model';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-etablissement-details',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './etablissement-details.component.html',
  styleUrls: ['./etablissement-details.component.scss']
})
export class EtablissementDetailsComponent {
alert(arg0: string) {
throw new Error('Method not implemented.');
}
  @Input() etablissement: Etablissement | null = null;
  @Output() close = new EventEmitter<void>();
  activeTab: 'responsables' | 'espaces' = 'responsables';
  displayedColumns: string[] = ['name', 'type', 'capacity', 'responsable'];

  setActiveTab(tab: 'responsables' | 'espaces'): void {
    this.activeTab = tab;
  }
}