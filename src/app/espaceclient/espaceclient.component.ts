import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';


@Component({
  selector: 'app-espaceclient',
  imports: [RouterOutlet, RouterLink, CommonModule, RouterLinkActive, HttpClientModule],
  templateUrl: './espaceclient.component.html',
  styleUrl: './espaceclient.component.css'
})
export class EspaceclientComponent {

  vehiclesCount: number = 0;


  claimsCount = 9;
  processingCount = 7;
  currentDate = '10 Janvier 2025';

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
    // Implement logout logic
    console.log('Logging out...');
  }
  toggleSidebar() {
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
