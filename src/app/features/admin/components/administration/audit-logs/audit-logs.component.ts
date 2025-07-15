import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

interface ConnexionLog {
  utilisateur: string;
  date: string;
  ip: string;
  statut: 'Succès' | 'Échec';
  details?: string;
}

interface ActionLog {
  utilisateur: string;
  date: string;
  action: string;
  cible: string;
  details?: string;
}

@Component({
  selector: 'app-audit-logs',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './audit-logs.component.html',
  styleUrls: ['./audit-logs.component.css']
})
export class AuditLogsComponent {
  connexions: ConnexionLog[] = [
    { utilisateur: 'Jean Dupont', date: '2024-06-01 09:12', ip: '192.168.1.10', statut: 'Succès', details: 'Connexion réussie depuis Chrome.' },
    { utilisateur: 'Marie Martin', date: '2024-06-01 08:55', ip: '192.168.1.22', statut: 'Échec', details: 'Mot de passe incorrect.' },
    { utilisateur: 'Pierre Durand', date: '2024-05-31 17:40', ip: '192.168.1.15', statut: 'Succès', details: 'Connexion réussie depuis mobile.' },
    { utilisateur: 'Admin', date: '2024-05-31 16:20', ip: '192.168.1.2', statut: 'Succès', details: 'Connexion admin.' },
  ];

  actionsSensibles: ActionLog[] = [
    { utilisateur: 'Admin', date: '2024-06-01 10:05', action: 'Suppression', cible: 'Utilisateur Marie Martin', details: "Suppression de l'utilisateur par Admin." },
    { utilisateur: 'Jean Dupont', date: '2024-06-01 09:30', action: 'Modification', cible: 'Dossier #2025-001', details: 'Changement du statut du dossier.' },
    { utilisateur: 'Admin', date: '2024-05-31 18:00', action: 'Ajout', cible: 'Utilisateur Pierre Durand', details: 'Invitation envoyée à Pierre Durand.' },
    { utilisateur: 'Marie Martin', date: '2024-05-31 17:50', action: 'Réinitialisation', cible: 'Mot de passe', details: 'Réinitialisation de son propre mot de passe.' },
  ];

  detailsLog: ConnexionLog | null = null;
  detailsAction: ActionLog | null = null;

  afficherDetails(log: ConnexionLog) {
    this.detailsLog = log;
  }

  fermerDetails() {
    this.detailsLog = null;
  }

  afficherDetailsAction(action: ActionLog) {
    this.detailsAction = action;
  }

  fermerDetailsAction() {
    this.detailsAction = null;
  }
} 