import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';

import { SidebarComponent } from './sidebar/sidebar.component';
import { HeaderComponent } from './header/header.component';
import { BreadcrumbsComponent } from './breadcrumbs/breadcrumbs.component';
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
    BreadcrumbsComponent
  ],
  template: `
    <div class="h-screen flex overflow-hidden bg-gray-50 dark:bg-dark-bg">
      <!-- Sidebar -->
      <app-sidebar [collapsed]="sidebarCollapsed()"></app-sidebar>

      <!-- Main Content Area -->
      <div class="flex flex-col flex-1 w-0 overflow-hidden">
        <app-header 
          [sidebarCollapsed]="sidebarCollapsed()" 
          (toggleSidebar)="toggleSidebar()">
        </app-header>

        <!-- Main Content -->
        <main class="relative flex-1 overflow-y-auto focus:outline-none">
          <div class="py-6">
            <div class="px-4 sm:px-6 md:px-8">
              <app-breadcrumbs></app-breadcrumbs>
              
              <!-- Page Content -->
              <div class="mt-4">
                <ng-content></ng-content>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  `
})
export class LayoutComponent {
  private themeService = inject(ThemeService);
  
  sidebarCollapsed = signal(false);
  isDarkMode = this.themeService.isDarkMode;
  
  toggleSidebar() {
    this.sidebarCollapsed.update(state => !state);
  }
  
  toggleTheme() {
    this.themeService.toggleTheme();
  }
} 