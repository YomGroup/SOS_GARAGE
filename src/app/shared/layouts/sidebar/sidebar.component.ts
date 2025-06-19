import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatTooltipModule } from '@angular/material/tooltip';
import { HeaderComponent } from '../header/header.component';

// import { AuthService } from '../../services/auth.service';

interface MenuItem {
  title: string;
  icon: string;
  route?: string;
  children?: MenuItem[];
  expanded?: boolean;
  requiresAdmin?: boolean;
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
    MatTooltipModule,
    HeaderComponent
  ],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent {
  @Input() collapsed = false;
  isCollapsed = false; // define the isCollapsed property
  
  // private authService = inject(AuthService);


  

  
  isAdmin = true;
  username = 'Jesper Elenga';
  userRole = 'garagiste';
  
  adminMenuItems: MenuItem[] = [
    {
      title: 'Tableau de bord',
      icon: 'bi bi-speedometer2',
      route: '/admin/dashboard',
      badge: '3'
    },
    {
      title: 'Dossiers',
      icon: 'bi bi-folder',
      route: '/admin/dossiers'
    },
    {
      title: 'Garages',
      icon: 'bi bi-building',
      route: '/admin/garages'
    },
    {
      title: 'Épaves',
      icon: 'bi bi-car-front',
      route: '/admin/epaves',
      isNew: true
    },
    {
      title: 'Administration',
      icon: 'bi bi-gear',
      requiresAdmin: true,
      expanded: false,
      children: [
        {
          title: 'Utilisateurs',
          route: '/admin/users',
          icon: 'bi bi-people'
        },
        {
          title: 'Rôles',
          route: '/admin/roles',
          icon: 'bi bi-shield-lock'
        }
      ]
    },
    {
      title: 'Paramètres',
      icon: 'bi bi-sliders',
      route: '/admin/settings'
    }
  ];

  garageMenuItems: MenuItem[] = [
    {
      title: 'Tableau de bord',
      icon: 'bi bi-graph-up',
      route: '/garage/statistiques'
    },
    {
      title: 'Réception de mission',
      icon: 'bi bi-clipboard-check',
      route: '/garage/missions'
    },
    {
      title: 'Gestion des réparations',
      icon: 'bi bi-tools',
      route: '/garage/reparations'
    },
  ];

  get menuItems(): MenuItem[] {
    const commonItems = [
      {
        title: 'Messages',
        icon: 'bi bi-envelope',
        route: '/messages',
        badge: '2'
      }
    ];

    if (this.userRole === 'Administrateur') {
      return [...this.adminMenuItems, ...commonItems];
    } else {
      return [...this.garageMenuItems, ...commonItems];
    }
  }
  
  toggleSubmenu(item: MenuItem) {
    item.expanded = !item.expanded;
  }

  logout() {
    // this.authService.logout();
    // this.router.navigate(['/login']);
    console.log('Logout clicked');
  }
}