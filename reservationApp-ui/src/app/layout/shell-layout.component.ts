import { Component, DestroyRef, HostListener, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatTooltip } from '@angular/material/tooltip';
import { ActivatedRouteSnapshot, NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { AuthService } from '../services/auth/auth.service';
import { ProfileComponent } from '../shared/components/profile/profile.component';
import { ThemeToggleComponent } from '../shared/ui/theme-toggle.component';
import { NAV_BY_ROLE, NavItem, roleLabel } from './nav';

const COLLAPSED_KEY = 'aresu-sidebar-collapsed';

/** Layout of the logged-in pages: collapsible sidebar, top bar (breadcrumb + user menu), content. */
@Component({
  selector: 'app-shell-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, MatButtonModule, MatIcon, MatTooltip, ThemeToggleComponent, ProfileComponent],
  templateUrl: './shell-layout.component.html',
  styleUrl: './shell-layout.component.scss',
})
export class ShellLayoutComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly role = this.auth.getCurrentUser()?.role ?? '';
  readonly roleLabel = roleLabel(this.role);
  readonly home = this.auth.homeRouteFor(this.role);
  readonly nav: NavItem[] = NAV_BY_ROLE[this.role] ?? [];

  readonly collapsed = signal(this.readCollapsed());
  readonly mobileOpen = signal(false);
  readonly pageTitle = signal('');

  constructor() {
    this.updateTitle();
    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd), takeUntilDestroyed(inject(DestroyRef)))
      .subscribe(() => {
        this.mobileOpen.set(false);
        this.updateTitle();
      });
  }

  toggleCollapsed(): void {
    this.collapsed.update(v => !v);
    try {
      localStorage.setItem(COLLAPSED_KEY, String(this.collapsed()));
    } catch {
      // ignore
    }
  }

  @HostListener('document:keydown.escape')
  closeMobile(): void {
    this.mobileOpen.set(false);
  }

  private updateTitle(): void {
    let snap: ActivatedRouteSnapshot | null = this.router.routerState.snapshot.root;
    let title = '';
    while (snap) {
      title = snap.title ?? title;
      snap = snap.firstChild;
    }
    this.pageTitle.set(title);
  }

  private readCollapsed(): boolean {
    try {
      return localStorage.getItem(COLLAPSED_KEY) === 'true';
    } catch {
      return false;
    }
  }
}
