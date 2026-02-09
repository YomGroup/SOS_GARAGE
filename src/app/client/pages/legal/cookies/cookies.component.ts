import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Cookie {
  name: string;
  purpose: string;
  duration: string;
  provider?: string;
}

@Component({
  selector: 'app-cookies',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cookies.component.html',
  styleUrls: ['./cookies.component.css']
})
export class CookiesComponent implements OnInit {
  lastUpdate: string = 'Février 2025';

  essentialCookies: Cookie[] = [
    { name: 'session_id', purpose: 'Maintien de la session utilisateur', duration: 'Session' },
    { name: 'auth_token', purpose: 'Authentification sécurisée', duration: '7 jours' },
    { name: 'csrf_token', purpose: 'Protection contre les attaques CSRF', duration: 'Session' },
    { name: 'cookie_consent', purpose: 'Mémorisation des préférences de cookies', duration: '12 mois' }
  ];

  performanceCookies: Cookie[] = [
    { name: '_ga', purpose: 'Google Analytics - Analyse d\'audience', duration: '24 mois' },
    { name: '_gid', purpose: 'Google Analytics - Identification utilisateur', duration: '24 heures' },
    { name: '_gat', purpose: 'Google Analytics - Limitation du taux de requêtes', duration: '1 minute' },
    { name: 'app_analytics', purpose: 'Statistiques d\'utilisation internes', duration: '12 mois' }
  ];

  marketingCookies: Cookie[] = [
    { name: '_fbp', purpose: 'Publicité ciblée Facebook', duration: '90 jours', provider: 'Facebook' },
    { name: 'IDE', purpose: 'Publicité display personnalisée', duration: '12 mois', provider: 'Google DoubleClick' },
    { name: 'test_cookie', purpose: 'Vérification du support des cookies', duration: '15 minutes', provider: 'Google DoubleClick' },
    { name: 'ads_prefs', purpose: 'Préférences publicitaires', duration: '12 mois', provider: 'Interne' }
  ];

  ngOnInit(): void {
    this.scrollToTop();
  }

  scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  acceptAllCookies(): void {
    // Logique pour accepter tous les cookies
    console.log('Tous les cookies acceptés');
    alert('Vos préférences ont été enregistrées');
  }

  refuseOptionalCookies(): void {
    // Logique pour refuser les cookies non essentiels
    console.log('Cookies optionnels refusés');
    alert('Seuls les cookies essentiels seront utilisés');
  }
}