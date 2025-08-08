import { ChangeDetectionStrategy, Component, inject, signal, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';

import { SidebarComponent } from './sidebar/sidebar.component';
import { HeaderComponent } from './header/header.component';
import { ThemeService } from '../../core/services/theme.service';
import { MessageService } from '../../../services/messagerie.service';
import { NotificationService } from '../../../services/notification.service';
import { Subscription } from 'rxjs';
import { AuthService } from '../../../services/auth.service';

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
export class LayoutComponent implements OnInit {
  private readonly themeService = inject(ThemeService);
  private readonly router = inject(Router);
  private authService = inject(AuthService);

  readonly sidebarCollapsed = signal(false);
  readonly isDarkMode = this.themeService.isDarkMode;
  public messageNotificationService = inject(NotificationService);
  private messageService = inject(MessageService);
  private conversationsSub!: Subscription;
  unreadMessagesCount: number = 0;
  hasNewMessages: boolean = false;
  private notificationSub!: Subscription;
  private hasNewMessagesSub!: Subscription;

  async ngOnInit(): Promise<void> {
    this.userid = this.authService.getToken()?.['sub'] ?? null;

    // Logique d'initialisation
    //Configuration des notifications avec attente de l'utilisateur connecté
    await this.setupMessageNotifications();

    this.setupIncomingMessageListener();
    // ⚙️ Lancer le rafraîchissement toutes les 2s
    /*setInterval(() => {
      this.setupIncomingMessageListener();
    }, 2000);*/
  }
  isMobile: boolean = false;
  isSidebarOpen: boolean = false;
  senderId: string = '';
  receiverId: string = '';
  userid: string | null = null;

  // : Configuration des notifications de messages
  public async setupMessageNotifications(): Promise<void> {
    try {
      // Attendre que l'utilisateur soit bien connecté
      if (!this.userid) {
        console.log('En attente de la connexion utilisateur...');
        // Retry après un délai si pas encore connecté
        setTimeout(() => this.setupMessageNotifications(), 1000);
        return;
      }

      console.log('Configuration des notifications pour utilisateur:', this.userid);

      // S'assurer que le service de notification est initialisé
      await this.messageNotificationService.reinitialize();

      // S'abonner au nombre de messages non lus
      this.notificationSub = this.messageNotificationService.unreadMessagesCount$.subscribe(
        count => {
          console.log('Notification reçue dans EspaceClient - Messages non lus:', count);
          this.unreadMessagesCount = count;
          this.hasNewMessages = count > 0;
          this.cdr.markForCheck();
        }
      );

      // S'abonner également au boolean hasNewMessages pour plus de réactivité
      this.hasNewMessagesSub = this.messageNotificationService.hasNewMessages$.subscribe(
        hasMessages => {
          console.log('Notification hasNewMessages reçue:', hasMessages);
          this.hasNewMessages = hasMessages;
          this.cdr.markForCheck(); // 👈 FORCER Angular à détecter le changement
        }
      );


      console.log('Notifications configurées avec succès');
    } catch (error) {
      console.error('Erreur lors de la configuration des notifications:', error);
    }
  }
  private setupIncomingMessageListener(): void {
    if (this.conversationsSub) {
      this.conversationsSub.unsubscribe(); // 🧹 évite les doublons
    }

    this.conversationsSub = this.messageService
      .listenToIncomingMessages(this.senderId)
      .subscribe({
        next: async (message) => {
          console.log('Nouveau message entrant détecté de:', message.senderId);

          // MODIFIÉ : Ne pas incrémenter ici car le service global s'en charge
          // Le service global écoute déjà et incrémente automatiquement

          // Vérifier si c'est un nouveau contact

          //await this.calculateUnreadMessages();



        },
      });
  }
  private async calculateUnreadMessages(): Promise<void> {
    try {
      // MODIFIÉ : Utiliser le service global pour recalculer
      await this.messageNotificationService.recalculateUnreadMessages();
      console.log('Messages non lus recalculés via le service global');
    } catch (error) {
      console.error('Erreur lors du calcul des messages non lus:', error);
    }
  }
  // Naviguer vers les messages et réinitialiser les notifications
  navigateToMessages(): void {
    console.log('Navigation vers les messages...');

    let target = '/clientDashboard/message';
    if (this.authService.hasRole('ROLE_GARAGISTE')) {
      target = '/garage/message';
    } else if (this.authService.hasRole('ROLE_ADMIN')) {
      target = '/admin/message';
    } else if (this.authService.hasRole('ROLE_ASSURE')) {
      target = '/clientDashboard/message';
    }

    this.router.navigate([target]);

  }

  constructor(private cdr: ChangeDetectorRef) {
    this.isMobile = window.innerWidth <= 992;
    window.addEventListener('resize', () => {
      this.isMobile = window.innerWidth <= 992;
      if (!this.isMobile) {
        this.isSidebarOpen = false;
      }
    });
    this.router.events.subscribe(event => {
      if (this.isMobile) {
        this.isSidebarOpen = false;
      }
    });
  }

  openSidebar() {
    this.isSidebarOpen = true;
  }

  closeSidebar() {
    this.isSidebarOpen = false;
  }

  toggleSidebar() {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }
}