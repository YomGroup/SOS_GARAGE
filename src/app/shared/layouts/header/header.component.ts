import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { ThemeService } from '../../../core/services/theme.service';
import { Notification, NotificationType } from '../../models/notification.model';

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
    MatTooltipModule,
    MatDividerModule
  ],
  templateUrl: './header.component.html'
})
export class HeaderComponent {
  @Input() sidebarCollapsed = false;
  @Output() toggleSidebar = new EventEmitter<void>();

  userAvatar = 'assets/images/avatar.png';
  userName = signal('John Doe');
  userEmail = signal('john.doe@example.com');
  notificationCount = signal(3);
  notifications = signal<Notification[]>([
    {
      type: 'info',
      message: 'Nouveau message reçu',
      time: new Date()
    },
    {
      type: 'warning',
      message: 'Rappel de rendez-vous',
      time: new Date()
    },
    {
      type: 'success',
      message: 'Tâche terminée',
      time: new Date()
    }
  ]);

  private themeService: ThemeService;
  isDarkMode;

  constructor(themeService: ThemeService) {
    this.themeService = themeService;
    this.isDarkMode = this.themeService.isDarkMode;
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  getNotificationIcon(type: NotificationType): string {
    const icons = {
      info: 'info',
      warning: 'warning',
      success: 'check_circle',
      error: 'error'
    };
    return icons[type] || 'notifications';
  }

  getNotificationIconClass(type: NotificationType): string {
    const classes = {
      info: 'bg-blue-500',
      warning: 'bg-yellow-500',
      success: 'bg-green-500',
      error: 'bg-red-500'
    };
    return classes[type] || 'bg-gray-500';
  }

  logout(): void {
    // Implémenter la logique de déconnexion
  }
}