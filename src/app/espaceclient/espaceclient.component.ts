// espaceclient.component.ts - Modifications pour les notifications globales
import { Component, HostListener, inject, Inject, OnInit, OnDestroy, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { KeycloakService } from 'keycloak-angular';
import { AssureService } from '../../services/assure.service';
import { NotificationService } from '../../services/notification.service';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { filter, map, mergeMap } from 'rxjs/operators';

import * as bootstrap from 'bootstrap';
import { VehicleService, Vehicle } from '../../services/vehicle.service';
import { MessageService } from '../../services/messagerie.service';

@Component({
  selector: 'app-espaceclient',
  imports: [RouterOutlet, RouterLink, CommonModule, RouterLinkActive, HttpClientModule],
  templateUrl: './espaceclient.component.html',
  styleUrl: './espaceclient.component.css'
})
export class EspaceclientComponent implements OnInit, OnDestroy {
  // Propriétés existantes
  sidebarCollapsed = false;
  sidebarHidden = false;
  vehicles: Vehicle[] = [];
  hasAssurance: boolean = true;
  vehiclesCount: number = 0;
  pageTitle: string = '';
  isMobile = false;
  sidebarVisible = false;
  claimsCount = 9;
  processingCount = 7;
  currentDate = '';
  angularReady = false;
  lastScrollTop = 0;
  email: string = '';
  originalData: any = {};
  senderId: string = '';
  receiverId: string = '';
  private messageListenerIntervalId: any = null;


  // Propriétés pour les notifications
  unreadMessagesCount: number = 0;
  hasNewMessages: boolean = false;
  private notificationSub!: Subscription;
  private hasNewMessagesSub!: Subscription;

  userData: any = {
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    adressePostale: '',
    numeroPermis: '',
    adresse: '',
    dateNaissance: '',
    sexe: 'M',
    codePostal: '',
    ville: '',
    pays: 'FR'
  };

  private keycloakService = inject(KeycloakService);
  private authService = inject(AuthService);
  public messageNotificationService = inject(NotificationService);
  private messageService = inject(MessageService);

  userid: string | null = null;
  assureId: number = 0;
  private vehiculeService = inject(VehicleService);
  private assureService = inject(AssureService);
  private conversationsSub!: Subscription; // NOUVEAU : subscription pour les nouvelles conversations

  vehicules: any[] = [];
  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private auth: AuthService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {

    this.userid = this.authService.getToken()?.['sub'] ?? null;
    if (this.userid) {
      this.assureService.getAssurerID(this.userid).subscribe({
        next: (data: any) => {
          this.assureId = data.id;
          console.log('Assure ID:', this.assureId);
          this.loadUserData();
        },
        error: (err) => {
          console.error('Erreur lors de la récupération de l\'assuré:', err);
        }
      });
    }
    this.checkWindowWidth();
  }

  async ngOnInit() {

    this.checkAssuranceStatus();
    const today = new Date();
    this.currentDate = today.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    if (isPlatformBrowser(this.platformId)) {
      this.checkScreenSize();
      this.restoreSidebarState();
      this.angularReady = true;
    }

    this.email = this.auth.getToken()?.name || '';
    const hasRole = this.auth.hasRole('ROLE_ASSURE');
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      map(() => this.activatedRoute),
      map(route => {
        while (route.firstChild) route = route.firstChild;
        return route;
      }),
      mergeMap(route => route.data)
    ).subscribe(data => {
      this.pageTitle = data['title'] || '';
    });

    // MODIFIÉ : Configuration des notifications avec attente de l'utilisateur connecté
    await this.setupMessageNotifications();
    this.setupIncomingMessageListener();
    // ⚙️ Lancer le rafraîchissement toutes les 2s
    /*setInterval(() => {
      console.log('Interval déclenché toutes les 2s');
      this.setupIncomingMessageListener();
    }, 2000);*/


  }
  checkAssuranceStatus(): void {
    // Code existant
    this.vehiculeService.refreshVehicules(this.assureId);
    this.vehiculeService.vehicules$.subscribe(vehicles => {
      this.hasAssurance = vehicles.every(v => v.nomAssurence && v.nomAssurence.trim() !== '');
      this.cdr.markForCheck();

    });

  }
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
          this.cdr.markForCheck();

        }
      );

      console.log('Notifications configurées avec succès');
    } catch (error) {
      console.error('Erreur lors de la configuration des notifications:', error);
    }
  }

  // Naviguer vers les messages et réinitialiser les notifications
  navigateToMessages(): void {
    console.log('Navigation vers les messages...');

    // Naviguer vers la page des messages
    this.router.navigate(['/clientDashboard/message']);

    // Note: On ne marque pas tous les messages comme lus ici,
    // c'est le MessageComponent qui s'en chargera quand une conversation sera sélectionnée
  }

  // Méthodes existantes inchangées
  toggleSidebar() {
    if (this.isMobile) {
      this.sidebarCollapsed = !this.sidebarCollapsed;
    } else {
      this.sidebarCollapsed = !this.sidebarCollapsed;
    }
  }

  checkWindowWidth() {
    this.isMobile = window.innerWidth < 768;
    if (!this.isMobile) {
      this.sidebarCollapsed = false;
    } else {
      this.sidebarCollapsed = true;
    }
  }

  ngAfterViewInit() {
    const tooltipElements = Array.from(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipElements.forEach(el => new bootstrap.Tooltip(el));

    const dropdownElements = Array.from(document.querySelectorAll('.dropdown-toggle'));
    dropdownElements.forEach(el => new bootstrap.Dropdown(el));
  }

  private loadUserData(): void {
    this.assureService.addAssurerGet(this.assureId).subscribe({
      next: (data: any) => {
        this.userData = {
          ...this.userData,
          ...data,
          telephone: this.formatPhoneNumber(data.telephone),
          dateNaissance: this.formatDate(data.dateNaissance)
        };
        this.originalData = { ...this.userData };
        console.log('Données utilisateur chargées :', this.userData);
      },
      error: (err) => {
        console.error('Erreur lors du chargement des données utilisateur', err);
      }
    });
  }

  private formatPhoneNumber(phone: string): string {
    return phone.replace(/(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4 $5');
  }

  private formatDate(dateString: string): string {
    return dateString ? new Date(dateString).toISOString().split('T')[0] : '';
  }

  @HostListener('window:resize', ['$event'])
  onResize() {
    if (isPlatformBrowser(this.platformId)) {
      this.checkScreenSize();
    }
    this.checkWindowWidth();
  }

  private checkScreenSize() {
    this.isMobile = window.innerWidth <= 992;
    this.sidebarVisible = !this.isMobile;
  }

  private restoreSidebarState() {
    if (this.isMobile) {
      this.sidebarVisible = false;
    }
    this.sidebarCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
  }

  recentClaims = [
    { id: 'SIN-001', status: 'Clôture', vehicle: 'Mercedes AMG', date: '15 Mai 2025' },
    { id: 'SIN-001', status: 'Clôture', vehicle: 'Mercedes AMG', date: '15 Mai 2025' },
    { id: 'SIN-001', status: 'Clôture', vehicle: 'Mercedes AMG', date: '15 Mai 2025' }
  ];

  notifications = [
    { message: 'Le sinistre-001 à été traité avec succès il y a 30 mn', read: false },
    { message: 'Documents à signer pour le sinistre-001 il y a 39 mn', read: false }
  ];

  logout() {
    console.log('Logging out...');
    this.keycloakService.logout(window.location.origin)
      .then(() => {
      })
      .catch(error => {
        console.error('Logout failed', error);
      });
  }

  @HostListener('window:scroll', [])
  onWindowScroll() {
    const toggleBtn = document.querySelector('.sidebar-toggle') as HTMLElement;
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

    if (scrollTop > this.lastScrollTop && scrollTop > 50) {
      toggleBtn?.classList.add('hide-on-scroll');
    } else {
      toggleBtn?.classList.remove('hide-on-scroll');
    }

    this.lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
  }

  // Nettoyer les subscriptions
  ngOnDestroy(): void {
    if (this.notificationSub) {
      this.notificationSub.unsubscribe();
    }
    if (this.hasNewMessagesSub) {
      this.hasNewMessagesSub.unsubscribe();
    }
    // ⛔ Stop interval
    if (this.messageListenerIntervalId) {
      clearInterval(this.messageListenerIntervalId);
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

          await this.calculateUnreadMessages();



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


}