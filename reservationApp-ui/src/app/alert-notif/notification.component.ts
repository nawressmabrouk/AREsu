// notification.component.ts
import { Component } from '@angular/core';
import { NotificationService } from '../services/alert-notif/notification.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-notification',
  imports: [CommonModule],
  template: `
    <div *ngIf="notification" class="notification" [class.success]="notification.type === 'success'" 
                                                  [class.error]="notification.type === 'error'">
      {{ notification.message }}
      <button (click)="dismiss()">×</button>
    </div>
  `,
  styles: [`
    .notification {
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 15px 20px;
      border-radius: 5px;
      color: white;
      z-index: 1000;
      display: flex;
      align-items: center;
      justify-content: space-between;
      min-width: 250px;
      box-shadow: 0 3px 10px rgba(0,0,0,0.2);
    }
    .success { background-color: #28a745; }
    .error { background-color: #dc3545; }
    button {
      background: transparent;
      border: none;
      color: white;
      font-size: 20px;
      cursor: pointer;
      margin-left: 15px;
    }
  `]
})
export class NotificationComponent {
  notification: any;

  constructor(private notificationService: NotificationService) {
    this.notificationService.notification$.subscribe(notification => {
      this.notification = notification;
    });
  }

  dismiss() {
    this.notificationService.clear();
  }
}