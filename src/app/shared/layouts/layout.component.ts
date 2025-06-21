import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';

import { SidebarComponent } from './sidebar/sidebar.component';
import { HeaderComponent } from './header/header.component';
import { ThemeService } from '../../core/services/theme.service';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatMenuModule,
    MatBadgeModule,
    SidebarComponent,
    HeaderComponent,
  ],
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.css'],
  // Ajout pour la détection des changements
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LayoutComponent {
  private readonly themeService = inject(ThemeService);

  readonly sidebarCollapsed = signal(false);
  readonly isDarkMode = this.themeService.isDarkMode;

  toggleSidebar(): void {
    this.sidebarCollapsed.update(state => !state);
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }
}