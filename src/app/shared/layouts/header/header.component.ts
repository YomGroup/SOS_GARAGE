import { Component, EventEmitter, Input, Output, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { ThemeService } from '../../../core/services/theme.service';
import { AuthService } from '../../../../services/auth.service';
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
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit {
  @Input() sidebarCollapsed: boolean = false;
  @Input() isMobile: boolean = false;
  @Input() sidebarOpened: boolean = false;
  @Output() openSidebar = new EventEmitter<void>();
  @Output() closeSidebar = new EventEmitter<void>();
  @Output() toggleSidebar = new EventEmitter<void>();

  userAvatar = 'assets/images/avatar.png';
  userName = signal('Chargement...');
  userEmail = signal('Chargement...');
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

  constructor(
    themeService: ThemeService,
    private authService: AuthService
  ) {
    this.themeService = themeService;
    this.isDarkMode = this.themeService.isDarkMode;
  }

  ngOnInit(): void {
    this.loadUserInfo();
  }

  private loadUserInfo(): void {
    const token = this.authService.getToken();
    if (token) {
      // Utiliser le nom préféré ou le nom complet du token décodé
      const nomUnique = token.preferred_username || token.name || `${token.given_name || ''} ${token.family_name || ''}`.trim();
      this.userName.set(nomUnique);
      this.userEmail.set(token.email || '');
    } else {
      // Fallback si le token n'est pas disponible
      this.userName.set('Utilisateur');
      this.userEmail.set('');
    }
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  getCurrentDate(): string {
    return new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
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

  onToggleSidebar() {
    this.toggleSidebar.emit();
  }
}