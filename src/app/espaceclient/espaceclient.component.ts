import { Component, HostListener, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';



@Component({
  selector: 'app-espaceclient',
  imports: [RouterOutlet, RouterLink, CommonModule, RouterLinkActive, HttpClientModule],
  templateUrl: './espaceclient.component.html',
  styleUrl: './espaceclient.component.css'
})
export class EspaceclientComponent implements OnInit {
  constructor(@Inject(PLATFORM_ID) private platformId: Object) { }

  vehiclesCount: number = 0;

  isMobile = false;
  sidebarVisible = false;
  sidebarCollapsed = false;
  claimsCount = 9;
  processingCount = 7;
  currentDate = '10 Janvier 2025';
  angularReady = false;
  lastScrollTop = 0;
  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.checkScreenSize();
      this.restoreSidebarState();
      this.angularReady = true;
    }
  }
  @HostListener('window:resize', ['$event'])
  onResize() {
    if (isPlatformBrowser(this.platformId)) {
      this.checkScreenSize();
    }
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
    // Implement logout logic
    console.log('Logging out...');
  }
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
