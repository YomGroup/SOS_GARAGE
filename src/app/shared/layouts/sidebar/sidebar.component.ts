import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatTooltipModule } from '@angular/material/tooltip';

// import { AuthService } from '../../services/auth.service';

interface MenuItem {
  title: string;
  icon: string;
  route?: string;
  children?: MenuItem[];
  expanded?: boolean;
  requiresAdmin?: boolean;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatIconModule,
    MatExpansionModule,
    MatTooltipModule
  ],
  template: `
    <aside 
      class="flex flex-col z-10 bg-white dark:bg-dark-card border-r border-gray-200 dark:border-gray-700 transition-all duration-300 ease-in-out h-screen"
      [class.w-64]="!collapsed"
      [class.w-20]="collapsed">
      
      <!-- Logo -->
      <div class="flex h-16 items-center justify-center border-b border-gray-200 dark:border-gray-700">
        <div class="flex items-center" [class.justify-center]="collapsed">
          <div class="flex-shrink-0 flex items-center">
            <div class="flex items-center justify-center h-10 w-10 rounded-md bg-primary-600 text-white">
              <mat-icon class="transform scale-75">shield</mat-icon>
            </div>
            <span *ngIf="!collapsed" class="ml-2 text-xl font-semibold text-gray-900 dark:text-white">SOS_GARAGE</span>
          </div>
        </div>
      </div>
      
      <!-- Navigation -->
      <nav class="flex-1 pt-5 pb-4 overflow-y-auto">
        <div *ngIf="!collapsed">
          <div *ngFor="let item of menuItems">
            <!-- Item with Children -->
            <div *ngIf="item.children && (!item.requiresAdmin || isAdmin)">
              <div 
                class="px-3 py-2 mx-3 mb-1 flex items-center justify-between text-sm font-medium cursor-pointer rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
                (click)="toggleSubmenu(item)">
                <div class="flex items-center">
                  <mat-icon class="mr-3 text-gray-500 dark:text-gray-400">{{ item.icon }}</mat-icon>
                  <span class="text-gray-700 dark:text-gray-300">{{ item.title }}</span>
                </div>
                <mat-icon *ngIf="!item.expanded" class="text-gray-500 dark:text-gray-400">expand_more</mat-icon>
                <mat-icon *ngIf="item.expanded" class="text-gray-500 dark:text-gray-400">expand_less</mat-icon>
              </div>
              
              <!-- Submenu -->
              <div *ngIf="item.expanded" class="ml-10 space-y-1">
                <a *ngFor="let child of item.children"
                   [routerLink]="child.route"
                   routerLinkActive="sidebar-item-active"
                   class="sidebar-item py-1">
                  {{ child.title }}
                </a>
              </div>
            </div>
            
            <!-- Regular Item -->
            <a *ngIf="!item.children && (!item.requiresAdmin || isAdmin)"
               [routerLink]="item.route"
               routerLinkActive="sidebar-item-active"
               class="sidebar-item mx-3 mb-1">
              <mat-icon class="text-gray-500 dark:text-gray-400">{{ item.icon }}</mat-icon>
              <span>{{ item.title }}</span>
            </a>
          </div>
        </div>
        
        <!-- Collapsed Menu -->
        <div *ngIf="collapsed" class="flex flex-col items-center pt-2 space-y-3">
          <a *ngFor="let item of menuItems" 
             [routerLink]="item.route" 
             routerLinkActive="bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400"
             [matTooltip]="item.title"
             matTooltipPosition="right"
             class="flex items-center justify-center w-12 h-12 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
            <mat-icon class="text-gray-500 dark:text-gray-400">{{ item.icon }}</mat-icon>
          </a>
        </div>
      </nav>
      
      <!-- Bottom Actions -->
      <div class="flex-shrink-0 p-4 border-t border-gray-200 dark:border-gray-700 mt-auto">
        <div *ngIf="!collapsed" class="flex items-center">
          <div class="flex-shrink-0">
            <img 
              class="h-10 w-10 rounded-full object-cover border border-gray-200 dark:border-gray-700" 
              src="https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg" 
              alt="User avatar"
            >
          </div>
          <div class="ml-3">
            <p class="text-sm font-medium text-gray-900 dark:text-white">{{ username }}</p>
            <p class="text-xs font-medium text-gray-500 dark:text-gray-400 truncate">{{ userRole }}</p>
          </div>
        </div>
        <div *ngIf="collapsed" class="flex justify-center">
          <img 
            class="h-10 w-10 rounded-full object-cover border border-gray-200 dark:border-gray-700" 
            src="https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg"
            alt="User avatar" 
            matTooltip="John Doe"
            matTooltipPosition="right"
          >
        </div>
      </div>
    </aside>
  `
})
export class SidebarComponent {
  @Input() collapsed = false;
  
  // private authService = inject(AuthService);
  
  isAdmin = true; // Valeur statique pour le design
  username = 'Jesper elenga';
  userRole = 'Administrateur';
  
  menuItems: MenuItem[] = [
    {
      title: 'Tableau de bord',
      icon: 'dashboard',
      route: '/admin/dashboard' // correct
    },
    {
      title: 'Dossiers',
      icon: 'description',
      route: '/admin/dossiers' // corrigé
    },
    {
      title: 'Garages',
      icon: 'garage',
      route: '/admin/garages' // corrigé
    },
    {
      title: 'Épaves',
      icon: 'car_crash',
      route: '/admin/epaves' // corrigé
    },
    {
      title: 'Administration',
      icon: 'admin_panel_settings',
      requiresAdmin: true,
      expanded: false,
      children: [
        {
          title: 'Utilisateurs',
          route: '/admin/users', // à condition d’avoir UserComponent dans user/
          icon: 'person'
        },
        {
          title: 'Rôles',
          route: '/admin/roles', // corrigé
          icon: 'security'
        }
      ]
    },
    {
      title: 'Paramètres',
      icon: 'settings',
      route: '/admin/settings' // seulement si tu as ce composant
    }
  ];
  
  toggleSubmenu(item: MenuItem) {
    item.expanded = !item.expanded;
  }
}