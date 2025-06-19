import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Notification {
  message: string;
  temps: string;
}

interface Sinistre {
  id: string;
  vehicule: string;
  date: string;
  statut: string;
  typeVehicule: string;
  notifications: Notification[];
  documents: string[];
  photos: string[];
  constat: string;
}

@Component({
  selector: 'app-sinistre',
  imports: [CommonModule],
  templateUrl: './sinistre.component.html',
  styleUrl: './sinistre.component.css'
})
export class SinistreComponent implements OnInit {

  selectedSinistre: Sinistre | null = null;
  sinistres: Sinistre[] = [];

  constructor() { }

  ngOnInit(): void {
    this.loadSinistres();
  }

  loadSinistres(): void {
    // Données de test basées sur votre maquette
    this.sinistres = [
      {
        id: 'SIN-001',
        vehicule: 'Mercedes AMG',
        date: '15 Mai 2025',
        statut: 'Clôturé',
        typeVehicule: 'roulant',
        notifications: [
          { message: 'Le sinistre-001 à été traité avec succès', temps: 'Il y\'a 30 mn' },
          { message: 'Documents à signer pour le sinistre-001', temps: 'Il y\'a 39 mn' }
        ],
        documents: ['Document 1', 'Document 2', 'Document 3'],
        photos: ['Photo avant', 'Photo arrière', 'Photo côté'],
        constat: 'Constat électronique disponible'
      },
      {
        id: 'SIN-002',
        vehicule: 'Peugeot 308',
        date: '08 Janvier 2025',
        statut: 'En cours',
        typeVehicule: 'non roulant',
        notifications: [
          { message: 'Expertise programmée pour demain', temps: 'Il y\'a 2 h' },
          { message: 'Dossier en cours de traitement', temps: 'Il y\'a 1 jour' }
        ],
        documents: ['Document 1', 'Document 2'],
        photos: ['Photo dégâts', 'Photo immatriculation'],
        constat: 'Constat papier reçu'
      },
      {
        id: 'SIN-003',
        vehicule: 'Renault Clio',
        date: '20 Décembre 2024',
        statut: 'Clôturé',
        typeVehicule: 'roulant',
        notifications: [
          { message: 'Indemnisation versée', temps: 'Il y\'a 3 semaines' },
          { message: 'Expertise terminée', temps: 'Il y\'a 1 mois' }
        ],
        documents: ['Document 1', 'Document 2', 'Document 3'],
        photos: ['Photo rayure', 'Photo pare-choc'],
        constat: 'Constat électronique'
      }
    ];
  }

  getStatutClass(statut: string): string {
    switch (statut) {
      case 'Clôturé':
        return 'badge-success';
      case 'En cours':
        return 'badge-warning';
      default:
        return 'badge-secondary';
    }
  }

  getStatutIcon(statut: string): string {
    switch (statut) {
      case 'Clôturé':
        return 'fas fa-check-circle';
      case 'En cours':
        return 'fas fa-clock';
      default:
        return 'fas fa-exclamation-circle';
    }
  }

  selectSinistre(sinistre: Sinistre): void {
    this.selectedSinistre = this.selectedSinistre?.id === sinistre.id ? null : sinistre;
  }

  viewDocument(document: string): void {
    console.log('Viewing document:', document);
    // Logique pour afficher le document
  }

  viewPhoto(photo: string): void {
    console.log('Viewing photo:', photo);
    // Logique pour afficher la photo
  }

  contactAssistance(): void {
    console.log('Contacting assistance...');
    // Logique pour contacter l'assistance
  }

  // Méthodes pour calculer les statistiques
  getSinistresEnCours(): number {
    return this.sinistres.filter(s => s.statut === 'En cours').length;
  }

  getSinistresClotures(): number {
    return this.sinistres.filter(s => s.statut === 'Clôturé').length;
  }

  getTotalVehicules(): number {
    return this.sinistres.length;
  }
}
