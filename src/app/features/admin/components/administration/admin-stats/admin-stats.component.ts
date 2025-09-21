import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

interface StatCard {
  icon: string;
  label: string;
  value: number;
  color: string;
}

interface AlerteAdmin {
  type: string;
  message: string;
  date: string;
}

@Component({
  selector: 'app-admin-stats',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-stats.component.html',
  styleUrls: ['./admin-stats.component.css']
})
export class AdminStatsComponent {
  stats: StatCard[] = [
    { icon: 'fas fa-users', label: 'Utilisateurs', value: 124, color: '#1976d2' },
    { icon: 'fas fa-sign-in-alt', label: 'Connexions', value: 312, color: '#28a745' },
    { icon: 'fas fa-exclamation-triangle', label: 'Actions sensibles', value: 17, color: '#ffc107' },
    { icon: 'fas fa-user-plus', label: 'Invitations envoyées', value: 8, color: '#8b2eb8' },
  ];

  alertes: AlerteAdmin[] = [
    { type: 'danger', message: "Tentative de connexion échouée pour l'utilisateur Marie Martin.", date: "2024-06-01 08:55" },
    { type: 'warning', message: "Suppression d'un utilisateur par Admin.", date: "2024-06-01 10:05" },
    { type: 'info', message: "Nouvelle invitation envoyée à Pierre Durand.", date: "2024-05-31 18:00" },
    { type: 'success', message: "Réinitialisation de mot de passe réussie pour Jean Dupont.", date: "2024-05-31 17:45" },
  ];
} 