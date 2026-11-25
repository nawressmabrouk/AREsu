import { Component, DestroyRef, HostListener, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { AuthService } from '../services/auth/auth.service';
import { ChatComponent } from '../chatbot/chatbot.component';
import { ThemeToggleComponent } from '../shared/ui/theme-toggle.component';

/** Layout of the public pages: top navbar (one shared header), content, footer. */
@Component({
  selector: 'app-public-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, MatButtonModule, MatIcon, ThemeToggleComponent, ChatComponent],
  templateUrl: './public-layout.component.html',
  styleUrl: './public-layout.component.scss',
})
export class PublicLayoutComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly loggedIn = signal(this.auth.isLoggedIn());
  readonly homeRoute = signal(this.computeHome());
  readonly menuOpen = signal(false);
  readonly scrolled = signal(false);
  readonly year = new Date().getFullYear();

  constructor() {
    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd), takeUntilDestroyed(inject(DestroyRef)))
      .subscribe(() => {
        this.menuOpen.set(false);
        this.loggedIn.set(this.auth.isLoggedIn());
        this.homeRoute.set(this.computeHome());
      });
  }

  @HostListener('window:scroll')
  onScroll(): void {
    this.scrolled.set(window.scrollY > 4);
  }

  private computeHome(): string {
    return this.auth.homeRouteFor(this.auth.getCurrentUser()?.role);
  }
}
