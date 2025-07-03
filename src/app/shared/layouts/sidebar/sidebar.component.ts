import { Component, Input, OnInit, inject, ChangeDetectorRef, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { KeycloakService } from 'keycloak-angular';

interface MenuItem {
  title: string;
  icon: string;
  route?: string;
  action?: (event: MouseEvent) => void;
  children?: MenuItem[];
  expanded?: boolean;
  badge?: string;
  isNew?: boolean;
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
  
  private keycloakService = inject(KeycloakService);
  private cdr = inject(ChangeDetectorRef);

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
  }

  adminMenuItems: MenuItem[] = [
    { title: 'Tableau de bord', icon: 'bi bi-speedometer2', route: '/admin/dashboard', badge: '3' },
    { title: 'Dossiers', icon: 'bi bi-folder', route: '/admin/dossiers' },
    { title: 'Finance', icon: 'bi bi-cash-coin', route: '/admin/gestion-finance' },
    { title: 'Garages', icon: 'bi bi-building', route: '/admin/garages' },
   // { title: 'Épaves', icon: 'bi bi-car-front', route: '/admin/epaves', isNew: true },
    { title: 'Administration', icon: 'bi bi-gear', route: '/admin/administration' },
    { title: 'Paramètres', icon: 'bi bi-sliders', route: '/admin/parametre' }
    
  ];

  garageMenuItems: MenuItem[] = [
    { title: 'Tableau de bord', icon: 'bi bi-graph-up', route: '/garage/statistiques' },
    { title: 'Réception de mission', icon: 'bi bi-clipboard-check', route: '/garage/missions' },
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
    item.expanded = !item.expanded;
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

  logout() {
    this.keycloakService.logout(window.location.origin);
  }
}