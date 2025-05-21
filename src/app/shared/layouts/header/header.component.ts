import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatBadgeModule,
    MatTooltipModule
  ],
  template: `
    <header class="sticky top-0 z-10 flex-shrink-0 h-16 bg-white border-b border-gray-200 dark:bg-dark-card dark:border-gray-700 shadow-sm">
      <div class="flex justify-between px-4 sm:px-6 md:px-8 h-full">
        <div class="flex items-center">
          <!-- Toggle Sidebar Button -->
          <button 
            type="button" 
            class="text-gray-500 dark:text-gray-400 focus:outline-none"
            (click)="toggleSidebar.emit()"
            matTooltip="Toggle sidebar">
            <mat-icon *ngIf="sidebarCollapsed">menu</mat-icon>
            <mat-icon *ngIf="!sidebarCollapsed">menu_open</mat-icon>
          </button>
        </div>

        <div class="flex items-center">
          <!-- Search Bar -->
          <div class="relative mx-4 lg:mx-0 hidden md:block">
            <div class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <mat-icon class="text-gray-400">search</mat-icon>
            </div>
            <input 
              type="text" 
              placeholder="Search..." 
              class="input pl-10 py-1.5 text-sm" 
              style="width: 240px;"
            >
          </div>

          <!-- Theme Toggle -->
          <button 
            type="button" 
            class="p-1 text-gray-500 dark:text-gray-400 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 ml-3"
            (click)="toggleTheme()"
            matTooltip="Toggle theme">
            <mat-icon *ngIf="isDarkMode()">light_mode</mat-icon>
            <mat-icon *ngIf="!isDarkMode()">dark_mode</mat-icon>
          </button>

          <!-- Notifications -->
          <button
            type="button"
            class="p-1 text-gray-500 dark:text-gray-400 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 ml-3"
            [matMenuTriggerFor]="notificationsMenu"
            matTooltip="Notifications">
            <mat-icon [matBadge]="notificationCount()" matBadgeColor="warn" matBadgeSize="small">notifications</mat-icon>
          </button>
          <mat-menu #notificationsMenu="matMenu" class="w-80">
            <div class="px-4 py-3 text-sm text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700">
              <div class="font-semibold">Notifications</div>
            </div>
            <div class="divide-y divide-gray-100 dark:divide-gray-700">
              <a *ngFor="let notification of notifications()" 
                 href="#" 
                 class="flex px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700">
                <div [ngClass]="getNotificationIconClass(notification.type)" class="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center">
                  <mat-icon class="text-white text-sm">{{ getNotificationIcon(notification.type) }}</mat-icon>
                </div>
                <div class="w-full pl-3">
                  <div class="text-gray-500 text-xs mb-1.5 dark:text-gray-400">
                    {{ notification.time | date:'short' }}
                  </div>
                  <div class="text-sm font-normal text-gray-900 dark:text-white">
                    {{ notification.message }}
                  </div>
                </div>
              </a>
            </div>
            <a href="#" class="block py-2 text-sm font-medium text-center text-primary-600 dark:text-primary-500 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700">
              See all notifications
            </a>
          </mat-menu>

          <!-- Profile Dropdown -->
          <div class="ml-3 relative">
            <button 
              type="button" 
              class="flex items-center max-w-xs rounded-full focus:outline-none"
              [matMenuTriggerFor]="profileMenu">
              <span class="sr-only">Open user menu</span>
              <img 
                class="h-8 w-8 rounded-full object-cover border-2 border-gray-200 dark:border-gray-700"
                [src]="userAvatar" 
                alt="User avatar"
              >
            </button>
            <mat-menu #profileMenu="matMenu">
              <div class="px-4 py-3">
                <p class="text-sm leading-5 text-gray-900 dark:text-white">{{ userName() }}</p>
                <p class="text-xs font-medium leading-4 text-gray-500 dark:text-gray-400 truncate">{{ userEmail() }}</p>
              </div>
              <!-- <mat-divider></mat-divider> -->
              <button mat-menu-item routerLink="/profile">
                <mat-icon>account_circle</mat-icon>
                <span>Profile</span>
              </button>
              <button mat-menu-item routerLink="/admin/users">
                <mat-icon>admin_panel_settings</mat-icon>
                <span>Admin</span>
              </button>
              <button mat-menu-item (click)="logout()">
                <mat-icon>logout</mat-icon>
                <span>Sign out</span>
              </button>
            </mat-menu>
          </div>
        </div>
      </div>
    </header>
  `
})
export class HeaderComponent {
  @Input() sidebarCollapsed = false;
  @Output() toggleSidebar = new EventEmitter<void>();

  // Valeurs statiques pour le design
  isDarkMode = () => false;
  notifications = signal([
    {
      type: 'info',
      message: 'Nouveau message reçu',
      time: new Date()
    },
    {
      type: 'success',
      message: 'Tâche terminée avec succès',
      time: new Date()
    }
  ]);
  notificationCount = signal(2);
  
  userAvatar = 'https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg';
  userName = signal('Jean Dupont');
  userEmail = signal('jean.dupont@example.com');

  toggleTheme() {
    console.log('Toggle theme clicked');
  }

  getNotificationIconClass(type: string): string {
    switch(type) {
      case 'success': return 'bg-success-500';
      case 'warning': return 'bg-warning-500';
      case 'danger': return 'bg-danger-500';
      case 'info':
      default: return 'bg-primary-500';
    }
  }
  
  getNotificationIcon(type: string): string {
    switch(type) {
      case 'success': return 'check_circle';
      case 'warning': return 'warning';
      case 'danger': return 'error';
      case 'info':
      default: return 'info';
    }
  }

  logout() {
    console.log('Logout clicked');
  }
}