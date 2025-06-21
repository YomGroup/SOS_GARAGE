import { Component, Input, OnInit, inject } from '@angular/core';
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
  template: `
    <aside class="sidebar" [class.collapsed]="collapsed">
      <div class="sidebar-header">
        <div class="sidebar-logo">
          <img src="assets/logo_sos.png" alt="Logo" />
        </div>
      </div>
      
      <nav class="nav-menu">
        <a *ngFor="let item of menuItems"
           [routerLink]="item.route"
           (click)="item.action ? item.action($event) : null"
           routerLinkActive="active"
           [routerLinkActiveOptions]="{exact: true}"
           class="nav-item"
           [attr.data-tooltip]="item.title">
          <i [ngClass]="item.icon"></i>
          <span>{{ item.title }}</span>
        </a>
      </nav>
    </aside>
  `,
  styles: [`
    .sidebar {
      position: fixed;
      top: 0;
      left: 0;
      width: 280px;
      height: 100vh;
      background: white;
      box-shadow: 2px 0 10px rgba(0, 0, 0, 0.1);
      z-index: 1000;
      overflow-y: auto;
      padding: 0;
      transition: all 0.3s ease;
    }

    .sidebar-header {
      display: flex;
      justify-content: center;
      align-items: center;
      margin-bottom: 32px;
    }

    .sidebar-logo {
      flex: 1;
      display: flex;
      justify-content: center;
      align-items: center;
    }

    .sidebar-logo img {
      width: 100%;
      max-width: 220px;
      height: auto;
      margin: 20px auto 0 auto;
      display: block;
    }

    .nav-menu {
      display: flex;
      flex-direction: column;
      padding: 0 15px;
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 15px;
      padding: 18px 20px;
      text-decoration: none;
      color: #4a5568;
      transition: all 0.3s ease;
      cursor: pointer;
      border-radius: 12px;
      margin-bottom: 8px;
      font-size: 16px;
      font-weight: 500;
    }

    .nav-item i {
      font-size: 20px;
      width: 24px;
      text-align: center;
    }

    .nav-item:hover {
      background: linear-gradient(135deg, #e8eaf6 0%, #f3e5f5 50%);
      color: #333;
      transform: translateX(5px);
    }

    .nav-item.active {
      background: linear-gradient(135deg, #1e4db8 0%, #8b2eb8 100%);
      color: white;
      border-radius: 25px;
      transform: translateX(5px);
      box-shadow: 0 4px 15px rgba(30, 77, 184, 0.3);
    }

    /* Styles pour le mode collapsed */
    .sidebar.collapsed {
      width: 80px;
    }

    .sidebar.collapsed .sidebar-logo img {
      max-width: 40px;
    }

    .sidebar.collapsed .nav-item {
      padding: 18px;
      justify-content: center;
    }

    .sidebar.collapsed .nav-item span {
      display: none;
    }

    .sidebar.collapsed .nav-item i {
      margin: 0;
      font-size: 24px;
    }

    /* Tooltip pour le mode collapsed */
    .sidebar.collapsed .nav-item[data-tooltip]:before {
      content: attr(data-tooltip);
      position: absolute;
      left: 100%;
      top: 50%;
      transform: translateY(-50%);
      background: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 8px 12px;
      border-radius: 4px;
      font-size: 14px;
      white-space: nowrap;
      opacity: 0;
      visibility: hidden;
      transition: all 0.3s ease;
      margin-left: 10px;
    }

    .sidebar.collapsed .nav-item[data-tooltip]:hover:before {
      opacity: 1;
      visibility: visible;
    }

    @media (max-width: 768px) {
      .sidebar {
        width: 250px;
      }
      
      .sidebar.collapsed {
        width: 0;
        padding: 0;
      }
    }
  `]
})
export class SidebarComponent implements OnInit {
  @Input() collapsed = false;
  
  private keycloakService = inject(KeycloakService);

  username: string = 'Visiteur';
  userRoles: string[] = [];
  
  async ngOnInit(): Promise<void> {
    const isLoggedIn = await this.keycloakService.isLoggedIn();
    if (isLoggedIn) {
      try {
        const userProfile = await this.keycloakService.loadUserProfile();
        this.username = userProfile.firstName || userProfile.username || 'Utilisateur';
        this.userRoles = this.keycloakService.getUserRoles();
      } catch (error) {
        console.error('Erreur lors du chargement du profil utilisateur', error);
      }
    }
  }

  adminMenuItems: MenuItem[] = [
    { title: 'Tableau de bord', icon: 'bi bi-speedometer2', route: '/admin/dashboard', badge: '3' },
    { title: 'Dossiers', icon: 'bi bi-folder', route: '/admin/dossiers' },
    { title: 'Garages', icon: 'bi bi-building', route: '/admin/garages' },
    { title: 'Épaves', icon: 'bi bi-car-front', route: '/admin/epaves', isNew: true },
    {
      title: 'Administration', icon: 'bi bi-gear', expanded: false,
      children: [
        { title: 'Utilisateurs', route: '/admin/users', icon: 'bi bi-people' },
        { title: 'Rôles', route: '/admin/roles', icon: 'bi bi-shield-lock' }
      ]
    },
    { title: 'Paramètres', icon: 'bi bi-sliders', route: '/admin/settings' }
  ];

  garageMenuItems: MenuItem[] = [
    { title: 'Tableau de bord', icon: 'bi bi-graph-up', route: '/garage/statistiques' },
    { title: 'Réception de mission', icon: 'bi bi-clipboard-check', route: '/garage/missions' },
    { title: 'Gestion des réparations', icon: 'bi bi-tools', route: '/garage/reparations' },
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
      { title: 'Messages', icon: 'bi bi-envelope', route: '/message', badge: '2' },
      { title: 'Profil', icon: 'bi bi-person', route: '/clientDashboard/profiles' },
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

  logout() {
    this.keycloakService.logout(window.location.origin);
  }
}