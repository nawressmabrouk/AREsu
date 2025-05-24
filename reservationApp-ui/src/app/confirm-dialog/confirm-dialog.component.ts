import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [MatIconModule, MatButtonModule],
  template: `
    <div class="dialog-container">
      <button mat-icon-button class="close-button" (click)="onNoClick()">
        <mat-icon>close</mat-icon>
      </button>
      
      <h2 mat-dialog-title class="dialog-title">Confirmation de réservation</h2>
      
      <div mat-dialog-content class="dialog-content">
        <div class="time-range-display">
          <span class="time-label">De</span>
          <span class="time-value">{{ data.startTime }}</span>
          <span class="time-label">à</span>
          <span class="time-value">{{ data.endTime }}</span>
        </div>
        <p class="confirmation-question">Voulez-vous confirmer cette réservation ?</p>
      </div>
      
      <div mat-dialog-actions class="dialog-actions">
        <button mat-stroked-button class="cancel-button" (click)="onNoClick()">
          Annuler
        </button>
        <button mat-raised-button class="confirm-button" (click)="onConfirm()">
          Confirmer
        </button>
      </div>
    </div>
  `,
  styles: [`
    .dialog-container {
      padding: 22px;
      border-radius: 16px;
      width: 510px;
      border: 1px solid rgba(0, 0, 0, 0.2) ; 
      position: relative;
      background: white;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
    }
    
    .close-button {
      position: absolute;
      top: 16px;
      right: 16px;
      color: #666;
      transition: all 0.3s ease;
      
      &:hover {
        color: #3b4f90;
        transform: scale(1.1);
      }
    }
    
    .dialog-title {
      color: #3b4f90;
      font-size: 1.8rem;
      font-weight: 600;
      padding-bottom: 24px;
      margin: 16px 0 24px 0;
      border-bottom: 1px solid #e0e0e0;
      display: flex;
      align-items: center;
      justify-content: center;
      text-align: center;
    }
    
    .dialog-content {
      padding: 24px 0;
      text-align: center;
      font-size: 1.1rem;
    }
    
    .time-range-display {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      margin-bottom: 32px;
      flex-wrap: wrap;
    }
    
    .time-label {
      color: #666;
      font-size: 1.1rem;
    }
    
    .time-value {
      background-color: #f5f9ff;
      color: #3b4f90;
      padding: 12px 24px;
      border-radius: 24px;
      font-weight: 500;
      border: 1px solid #d6e4ff;
      font-size: 1.1rem;
    }
    
    .confirmation-question {
      color: #444;
      font-size: 1.2rem;
      margin: 0;
    }
    
    .dialog-actions {
      display: flex;
      justify-content: center;
      gap: 24px;
      padding: 24px 0 0 0;
      margin: 0;
    }
    
    .confirm-button {
      background-color: white !important;
      color: #3b4f90 !important;
      border: 2px solid #3b4f90 !important;
      border-radius: 28px !important;
      padding: 8px 32px !important;
      font-weight: 500;
      font-size: 1.1rem;
      height: 48px;
      transition: all 0.3s ease;
      
      &:hover {
        background-color: #3b4f90 !important;
        color: white !important;
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(59, 79, 144, 0.3);
      }
    }
    
    .cancel-button {
      background-color: white !important;
      color: #e53935 !important;
      border: 2px solid #e53935 !important;
      border-radius: 28px !important;
      padding: 8px 32px !important;
      font-weight: 500;
      font-size: 1.1rem;
      height: 48px;
      transition: all 0.3s ease;
      
      &:hover {
        background-color: #e53935 !important;
        color: white !important;
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(229, 57, 53, 0.3);
      }
    }
  `]
})
export class ConfirmDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { startTime: string, endTime: string }
  ) {}

  onNoClick(): void {
    this.dialogRef.close(false);
  }

  onConfirm(): void {
    this.dialogRef.close(true);
  }
}