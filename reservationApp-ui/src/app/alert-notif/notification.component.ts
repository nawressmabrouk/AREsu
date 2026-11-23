import { Component } from '@angular/core';

/**
 * Deprecated: toasts are now displayed once, globally, by <app-toast-host> in AppComponent.
 * This component renders nothing so the <app-notification> tags still present in some
 * pages do not show duplicates; they are removed as each page is redesigned.
 */
@Component({
  selector: 'app-notification',
  template: '',
})
export class NotificationComponent {}
