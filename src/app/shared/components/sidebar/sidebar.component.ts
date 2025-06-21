import { Component, Input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatTooltipModule } from '@angular/material/tooltip';
import { KeycloakService } from 'keycloak-angular';

interface MenuItem {
  title: string;
  icon: string;
  route?: string;
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
    RouterModule,
    MatIconModule,
    MatExpansionModule,
    MatTooltipModule
  ],
  template: `
    <!-- 
      VOTRE CODE HTML VA ICI. 
      Ceci est un placeholder pour que le code compile.
      Vous devrez le remplacer par le contenu de votre sidebar.component.html
    -->
    <div class="sidebar">
      <div class="user-info">
        <p>{{ username }}</p>
      </div>
      <ul class="menu-list">
        <li *ngFor="let item of menuItems">
          <a [routerLink]="item.route">{{ item.title }}</a>
        </li>
      </ul>
      <button (click)="logout()">Logout</button>
    </div>
  `,
  styles: [`
    /* 
      VOTRE CODE CSS VA ICI. 
      Ceci est un placeholder pour que le code compile.
      Vous devrez le remplacer par le contenu de votre sidebar.component.css
    */
    .sidebar { padding: 1rem; }
    .user-info { margin-bottom: 1rem; }
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
    const commonItems = [
      { title: 'Messages', icon: 'bi bi-envelope', route: '/message', badge: '2' },
      { title: 'Profil', icon: 'bi bi-person', route: '/clientDashboard/profiles' } // Route de profil commune
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