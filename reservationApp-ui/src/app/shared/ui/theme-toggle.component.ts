import { Component, inject } from '@angular/core';
import { MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatTooltip } from '@angular/material/tooltip';
import { ThemeService } from './theme.service';

@Component({
  selector: 'app-theme-toggle',
  imports: [MatIconButton, MatIcon, MatTooltip],
  template: `
    <button mat-icon-button type="button" (click)="theme.toggle()"
            [attr.aria-label]="theme.mode() === 'dark' ? 'Activer le thème clair' : 'Activer le thème sombre'"
            [matTooltip]="theme.mode() === 'dark' ? 'Thème clair' : 'Thème sombre'">
      <mat-icon>{{ theme.mode() === 'dark' ? 'light_mode' : 'dark_mode' }}</mat-icon>
    </button>
  `,
})
export class ThemeToggleComponent {
  readonly theme = inject(ThemeService);
}
