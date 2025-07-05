import { Component, HostListener, inject, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { KeycloakService } from 'keycloak-angular';
import { AssureService } from '../../services/assure.service';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';

import { filter, map, mergeMap } from 'rxjs/operators';

import * as bootstrap from 'bootstrap';
@Component({
  selector: 'app-espaceclient',
  imports: [RouterOutlet, RouterLink, CommonModule, RouterLinkActive, HttpClientModule],
  templateUrl: './espaceclient.component.html',
  styleUrl: './espaceclient.component.css'
})
export class EspaceclientComponent implements OnInit {
  // Dans votre composant
  sidebarCollapsed = false;
  sidebarHidden = false;
  toggleSidebar() {
    if (this.isMobile) {
      // Sur mobile, toggle entre cachée et ouverte pleine largeur
      this.sidebarCollapsed = !this.sidebarCollapsed;
    } else {
      // Sur desktop, toggle entre largeur pleine et réduite (icônes)
      this.sidebarCollapsed = !this.sidebarCollapsed;
    }
  }
  checkWindowWidth() {
    this.isMobile = window.innerWidth < 768;
    if (!this.isMobile) {
      // Par défaut sidebar visible sur desktop
      this.sidebarCollapsed = false;
    } else {
      // Sidebar cachée par défaut sur mobile
      this.sidebarCollapsed = true;
    }
  }
  ngAfterViewInit() {
    // Initialize tooltips
    const tooltipElements = Array.from(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipElements.forEach(el => new bootstrap.Tooltip(el));

    // Initialize dropdowns
    const dropdownElements = Array.from(document.querySelectorAll('.dropdown-toggle'));
    dropdownElements.forEach(el => new bootstrap.Dropdown(el));
  }
  private assureService = inject(AssureService);

  constructor(@Inject(PLATFORM_ID) private platformId: Object, private auth: AuthService, private router: Router, private activatedRoute: ActivatedRoute) {
    this.userid = this.authService.getToken()?.['sub'] ?? null;

    if (this.userid) {
      this.assureService.getAssurerID(this.userid).subscribe({
        next: (data: any) => {
          this.assureId = data.id; // adapte selon ta réponse
          console.log('Assure ID:', this.assureId);
          this.loadUserData();
        },
        error: (err) => {
          console.error('Erreur lors de la récupération de l’assure  ID :', err);
        }
      });
    }
    this.checkWindowWidth();
  }

  vehiclesCount: number = 0;
  pageTitle: string = '';
  isMobile = false;
  sidebarVisible = false;
  // sidebarCollapsed = false;
  claimsCount = 9;
  processingCount = 7;
  currentDate = '';
  angularReady = false;
  lastScrollTop = 0;
  email: string = '';
  originalData: any = {};

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
  userid: string | null = null;
  assureId: number = 0;

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
    // Formatage du numéro de téléphone
    return phone.replace(/(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4 $5');
  }

  private formatDate(dateString: string): string {
    // Formatage de la date pour l'input date
    return dateString ? new Date(dateString).toISOString().split('T')[0] : '';
  }

  ngOnInit() {

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
      // Cache la sidebar par défaut sur mobile
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
  /*
    toggleSidebar() {
      if (this.isMobile) {
        this.sidebarVisible = !this.sidebarVisible;
      } else {
        this.sidebarCollapsed = !this.sidebarCollapsed;
        localStorage.setItem('sidebarCollapsed', this.sidebarCollapsed.toString());
  
        const sidebar = document.getElementById('sidebar');
        const mainContent = document.getElementById('mainContent');
        const header = document.getElementById('header');
        const toggleBtn = document.querySelector('.sidebar-toggle');
  
        sidebar?.classList.toggle('collapsed');
        mainContent?.classList.toggle('collapsed');
        header?.classList.toggle('collapsed');
        toggleBtn?.classList.toggle('collapsed');
      }
  
    }
  */
  @HostListener('window:scroll', [])
  onWindowScroll() {
    const toggleBtn = document.querySelector('.sidebar-toggle') as HTMLElement;
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

    if (scrollTop > this.lastScrollTop && scrollTop > 50) {
      // Vers le bas → cacher
      toggleBtn?.classList.add('hide-on-scroll');
    } else {
      // Vers le haut → montrer
      toggleBtn?.classList.remove('hide-on-scroll');
    }

    this.lastScrollTop = scrollTop <= 0 ? 0 : scrollTop; // Pour éviter négatif
  }
}
