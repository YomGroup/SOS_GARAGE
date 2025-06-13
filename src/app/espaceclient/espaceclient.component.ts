import { Component } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-espaceclient',
  imports: [RouterOutlet, RouterLink, CommonModule],
  templateUrl: './espaceclient.component.html',
  styleUrl: './espaceclient.component.css'
})
export class EspaceclientComponent {
  menuItems = [
    { icon: 'fas fa-tachometer-alt', text: 'Tableau de bord', link: '/clientDashboard/' },
    { icon: 'fas fa-car', text: 'Mes véhicules', link: '/clientDashboard/vehicules' },
    { icon: 'fas fa-file-alt', text: 'Mes sinistres', link: '/clientDashboard/declarations' },
    { icon: 'fas fa-plus-circle', text: 'Déclarer un sinistre', link: '/clientDashboard/sinistre' },
    { icon: 'fas fa-folder', text: 'Mes documents', link: '/clientDashboard/document' },
    { icon: 'fas fa-user', text: 'Mon profil', link: '/clientDashboard/profiles' },
    { icon: 'fas fa-headset', text: 'Support', link: '/clientDashboard/support' },
    { icon: 'fas fa-sign-out-alt', text: 'Déconnexion', link: '#', class: 'mt-4 text-warning' }
  ];
  isCollapsed = false;
  toggleSidebar() {
    this.isCollapsed = !this.isCollapsed;
    // Vous pouvez aussi sauvegarder l'état dans localStorage
    // localStorage.setItem('sidebarCollapsed', String(this.isCollapsed));
  }
}
