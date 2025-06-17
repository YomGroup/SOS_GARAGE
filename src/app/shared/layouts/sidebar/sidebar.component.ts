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
  badge?: string;
  isNew?: boolean;
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
      class="flex flex-col z-10 bg-gradient-to-b from-white to-gray-50 text-gray-800 transition-all duration-300 ease-in-out h-screen overflow-y-auto"
      [class.w-64]="!collapsed"
      [class.w-20]="collapsed">
      
      <!-- Header -->
      <div class="p-6 border-b border-gray-200">
        <div class="flex items-center gap-3 mb-4" [class.justify-center]="collapsed">
          <div class="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
            <mat-icon class="text-white text-sm">shield</mat-icon>
          </div>
          <span *ngIf="!collapsed" class="text-xl font-bold text-emerald-600">SOS_GARAGE</span>
        </div>
        
        <!-- User Profile -->
        <div *ngIf="!collapsed" class="flex items-center gap-3 p-3 bg-gray-100 rounded-lg">
          <div class="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
            <img 
              class="w-10 h-10 rounded-full object-cover border border-gray-200"
              src="https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg" 
              alt="User avatar"
            >
          </div>
          <div class="flex-1">
            <div class="text-sm font-medium text-gray-800">{{ username }}</div>
            <div class="text-xs text-gray-500">{{ userRole }}</div>
          </div>
          <mat-icon class="text-gray-500 cursor-pointer hover:text-gray-800 text-base">settings</mat-icon>
        </div>
        
        <!-- Collapsed User -->
        <div *ngIf="collapsed" class="flex justify-center">
          <img 
            class="w-10 h-10 rounded-full object-cover border border-gray-200"
            src="https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg"
            alt="User avatar" 
            [matTooltip]="username"
            matTooltipPosition="right"
          >
        </div>
      </div>

      <!-- Navigation -->
      <nav class="flex-1 py-4">
        <!-- Section Title -->
        <div *ngIf="!collapsed" class="px-6 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
          MENU
        </div>
        
        <div *ngIf="!collapsed">
          <div *ngFor="let item of menuItems">
            <!-- Item with Children -->
            <div *ngIf="item.children && (!item.requiresAdmin || isAdmin)" class="mb-1">
              <div 
                class="flex items-center justify-between px-4 py-2.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg mx-2 cursor-pointer transition-all duration-200"
                (click)="toggleSubmenu(item)">
                <div class="flex items-center gap-3">
                  <mat-icon class="text-gray-500 text-lg">{{ item.icon }}</mat-icon>
                  <span class="text-sm font-medium">{{ item.title }}</span>
                  <span *ngIf="item.badge" class="bg-emerald-500 text-white text-xs px-2 py-0.5 rounded-full font-medium">
                    {{ item.badge }}
                  </span>
                  <span *ngIf="item.isNew" class="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-medium">
                    New
                  </span>
                </div>
                <div class="text-gray-500">
                  <mat-icon class="text-base">{{ item.expanded ? 'expand_less' : 'expand_more' }}</mat-icon>
                </div>
              </div>
              
              <!-- Submenu -->
              <div *ngIf="item.expanded" class="ml-10 mt-1 space-y-1">
                <a *ngFor="let child of item.children"
                   [routerLink]="child.route"
                   routerLinkActive="text-emerald-600 bg-emerald-50"
                   class="block px-4 py-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg mx-2 cursor-pointer transition-all duration-200">
                  <span class="text-sm">{{ child.title }}</span>
                </a>
              </div>
            </div>
            
            <!-- Regular Item -->
            <div *ngIf="!item.children && (!item.requiresAdmin || isAdmin)" class="mb-1">
              <a [routerLink]="item.route"
                 routerLinkActive="text-emerald-600 bg-emerald-50"
                 class="flex items-center gap-3 px-4 py-2.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg mx-2 cursor-pointer transition-all duration-200">
                <mat-icon class="text-gray-500 text-lg">{{ item.icon }}</mat-icon>
                <span class="text-sm font-medium">{{ item.title }}</span>
                <span *ngIf="item.badge" class="bg-emerald-500 text-white text-xs px-2 py-0.5 rounded-full font-medium">
                  {{ item.badge }}
                </span>
                <span *ngIf="item.isNew" class="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-medium">
                  New
                </span>
              </a>
            </div>
          </div>
        </div>
        
        <!-- Collapsed Menu -->
        <div *ngIf="collapsed" class="flex flex-col items-center pt-2 space-y-3">
          <a *ngFor="let item of menuItems" 
             [routerLink]="item.route" 
             routerLinkActive="bg-emerald-50 text-emerald-600"
             [matTooltip]="item.title"
             matTooltipPosition="right"
             class="flex items-center justify-center w-12 h-12 rounded-lg hover:bg-gray-100 transition-all duration-200">
            <mat-icon class="text-gray-500 hover:text-gray-900">{{ item.icon }}</mat-icon>
          </a>
        </div>
      </nav>
    </aside>
  `,
  styles: [`
    :host {
      .mat-mdc-tooltip {
        background-color: #1e293b;
        color: white;
      }
    }
  `]
})
export class SidebarComponent {
  @Input() collapsed = false;
  
  // private authService = inject(AuthService);
  
  isAdmin = true;
  username = 'Jesper Elenga';
  userRole = 'Administrateur';
  
  menuItems: MenuItem[] = [
    {
      title: 'Tableau de bord',
      icon: 'dashboard',
      route: '/admin/dashboard',
      badge: '3'
    },
    {
      title: 'Dossiers',
      icon: 'description',
      route: '/admin/dossiers'
    },
    {
      title: 'Garages',
      icon: 'garage',
      route: '/admin/garages'
    },
    {
      title: 'Épaves',
      icon: 'car_crash',
      route: '/admin/epaves',
      isNew: true
    },
    {
      title: 'Administration',
      icon: 'admin_panel_settings',
      requiresAdmin: true,
      expanded: false,
      children: [
        {
          title: 'Utilisateurs',
          route: '/admin/users',
          icon: 'person'
        },
        {
          title: 'Rôles',
          route: '/admin/roles',
          icon: 'security'
        }
      ]
    },
    {
      title: 'Paramètres',
      icon: 'settings',
      route: '/admin/settings'
    }
  ];
  
  toggleSubmenu(item: MenuItem) {
    item.expanded = !item.expanded;
  }
}