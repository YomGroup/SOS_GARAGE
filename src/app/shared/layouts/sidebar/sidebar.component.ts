import { Component, Input, OnInit, inject, ChangeDetectorRef, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { KeycloakService } from 'keycloak-angular';
import { Router } from '@angular/router';

interface MenuItem {
  title: string;
  icon: string;
  route?: string;
  action?: (event: MouseEvent) => void;
  children?: MenuItem[];
  expanded?: boolean;
  badge?: string;
  isNew?: boolean;
  filter?: string;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule
  ],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit {
  @Input() collapsed: boolean = false;
  @Input() isMobile: boolean = false;
  @Input() isOpen: boolean = false;
  @Output() closeSidebar = new EventEmitter<void>();
  @Output() openSidebar = new EventEmitter<void>();
  @Output() dossierFilterChange = new EventEmitter<string>();
  
  private keycloakService = inject(KeycloakService);
  private cdr = inject(ChangeDetectorRef);
  private router = inject(Router);

  username: string = 'Visiteur';
  userRoles: string[] = [];
  
  async ngOnInit(): Promise<void> {
    const isLoggedIn = await this.keycloakService.isLoggedIn();
    if (isLoggedIn) {
      try {
        const userProfile = await this.keycloakService.loadUserProfile();
        this.username = userProfile.firstName || userProfile.username || 'Utilisateur';
        this.userRoles = this.keycloakService.getUserRoles();
        this.cdr.detectChanges();
      } catch (error) {
        console.error('Erreur lors du chargement du profil utilisateur', error);
      }
    }
    
    // Auto-expandre les sous-menus actifs
    this.expandActiveSubmenus();
  }

  adminMenuItems: MenuItem[] = [
    { title: 'Tableau de bord', icon: 'bi bi-speedometer2', route: '/admin/dashboard', badge: '3' },
    {
      title: 'Dossiers',
      icon: 'bi bi-folder',
      route: '/admin/dossiers',
      expanded: false,
      children: [
        { title: 'Nouveaux dossiers', icon: 'bi bi-calendar-day', filter: 'nouveaux' },
        { title: 'Dossiers non traités', icon: 'bi bi-clock-history', filter: 'nonTraites' },
        { title: 'Dossiers terminés', icon: 'bi bi-check-circle', filter: 'termines' }
      ]
    },
    { title: 'Finance', icon: 'bi bi-cash-coin', route: '/admin/gestion-finance' },
    { title: 'Garages', icon: 'bi bi-building', route: '/admin/garages' },
   // { title: 'Épaves', icon: 'bi bi-car-front', route: '/admin/epaves', isNew: true },
    { title: 'Administration', icon: 'bi bi-gear', route: '/admin/administration' },
    { title: 'Paramètres', icon: 'bi bi-sliders', route: '/admin/parametre' }
    
  ];

  garageMenuItems: MenuItem[] = [
    { title: 'Tableau de bord', icon: 'bi bi-graph-up', route: '/garage/statistiques' },
    //{ title: 'Réception de mission', icon: 'bi bi-clipboard-check', route: '/garage/missions' },
    { title: 'Gestion des réparations', icon: 'bi bi-tools', route: '/garage/reparations' },
    { title: 'Finance', icon: 'bi bi-cash-coin', route: '/garage/finance' },
    { title: 'Profil', icon: 'bi bi-person', route: '/garage/profil' }
  ];

  assureMenuItems: MenuItem[] = [
    { title: 'Tableau de bord', icon: 'bi bi-grid', route: '/clientDashboard' },
    { title: 'Mes Véhicules', icon: 'bi bi-car-front-fill', route: '/clientDashboard/vehicules' },
    { title: 'Mes Déclarations', icon: 'bi bi-file-earmark-text', route: '/clientDashboard/declarations' },
    { title: 'Mes Sinistres', icon: 'bi bi-exclamation-triangle', route: '/clientDashboard/sinistre' },
    { title: 'Mes Documents', icon: 'bi bi-folder2-open', route: '/clientDashboard/document' },
    { title: 'Support', icon: 'bi bi-question-circle', route: '/clientDashboard/support' },
  ];

  get menuItems(): MenuItem[] {
    const commonItems: MenuItem[] = [
      {
        title: 'Messages',
        icon: 'bi bi-envelope',
        route: this.userRoles.includes('ROLE_GARAGISTE')
          ? '/garage/message'
          : this.userRoles.includes('ROLE_ADMIN')
            ? '/admin/messages'
            : this.userRoles.includes('ROLE_ASSURE')
              ? '/clientDashboard/message'
              : '/message',
        badge: '2'
      },
      { 
        title: 'Déconnexion', 
        icon: 'bi bi-box-arrow-right', 
        action: (event: MouseEvent) => {
          event.preventDefault();
          this.logout();
        }
      }
    ];

    if (this.userRoles.includes('ROLE_ADMIN')) {
      return [...this.adminMenuItems, ...commonItems];
    } else if (this.userRoles.includes('ROLE_GARAGISTE')) {
      return [...this.garageMenuItems, ...commonItems];
    } else if (this.userRoles.includes('ROLE_ASSURE')) {
      return [...this.assureMenuItems, ...commonItems];
    }
    return []; // Retourne un menu vide si aucun rôle ne correspond
  }
  
  toggleSubmenu(item: MenuItem) {
    // Toggle le sous-menu ET navigue si route
    item.expanded = !item.expanded;
    if (item.route) {
      this.router.navigate([item.route]);
    }
  }

  toggleSubmenuOnly(event: MouseEvent, item: MenuItem) {
    // Empêche la navigation, toggle seulement
    event.preventDefault();
    event.stopPropagation();
    item.expanded = !item.expanded;
  }

  isParentActive(item: MenuItem): boolean {
    if (!item.route) return false;
    const currentUrl = this.router.url;
    
    // Vérifier si la route parente est active
    const isParentRouteActive = currentUrl === item.route || currentUrl.startsWith(item.route + '/');
    
    // Si l'élément a des enfants, vérifier aussi si un des enfants est actif
    if (item.children && item.children.length > 0) {
      const hasActiveChild = item.children.some(child => {
        if (!child.route) return false;
        return currentUrl === child.route || currentUrl.startsWith(child.route + '/');
      });
      return isParentRouteActive || hasActiveChild;
    }
    
    return isParentRouteActive;
  }



  onChildClick(event: MouseEvent, child: MenuItem) {
    // Empêcher la propagation pour éviter les conflits
    event.stopPropagation();
    // Naviguer si une route est définie
    if (child.route) {
      this.router.navigate([child.route]);
    }
    // Fermer le sous-menu sur mobile après clic
    if (this.isMobile) {
      this.closeSidebar.emit();
    }
  }

  onLogoClick() {
    if (this.collapsed) {
      this.openSidebar.emit();
    }
  }

  onItemClick(event: MouseEvent, item: MenuItem) {
    if (item.action) {
      item.action(event);
    }
  }

  expandActiveSubmenus() {
    const currentUrl = this.router.url;
    
    // Parcourir tous les éléments du menu pour trouver les sous-menus actifs
    this.menuItems.forEach(item => {
      if (item.children && item.children.length > 0) {
        const hasActiveChild = item.children.some(child => {
          if (!child.route) return false;
          return currentUrl === child.route || currentUrl.startsWith(child.route + '/');
        });
        
        if (hasActiveChild) {
          item.expanded = true;
        }
      }
    });
  }

  logout() {
    this.keycloakService.logout(window.location.origin);
  }

  onDossierFilterClick(event: MouseEvent, filter: string) {
    event.preventDefault();
    event.stopPropagation();
    this.dossierFilterChange.emit(filter);
  }
}