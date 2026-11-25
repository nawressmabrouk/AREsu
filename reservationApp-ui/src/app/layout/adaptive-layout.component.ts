import { Component, inject } from '@angular/core';
import { AuthService } from '../services/auth/auth.service';
import { PublicLayoutComponent } from './public-layout.component';
import { ShellLayoutComponent } from './shell-layout.component';

/**
 * For pages open to everyone (the spaces catalogue): the app shell for logged-in
 * users, the public navbar for visitors. The router outlet lives in the chosen layout.
 */
@Component({
  selector: 'app-adaptive-layout',
  imports: [PublicLayoutComponent, ShellLayoutComponent],
  template: `
    @if (loggedIn) {
      <app-shell-layout />
    } @else {
      <app-public-layout />
    }
  `,
})
export class AdaptiveLayoutComponent {
  readonly loggedIn = inject(AuthService).isLoggedIn();
}
