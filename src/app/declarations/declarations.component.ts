import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

interface Sinistre {
  id: number;
  date: string;
  type: string;
  statut: string;
  description: string;
}
@Component({
  selector: 'app-declarations',
  imports: [FormsModule, CommonModule],
  templateUrl: './declarations.component.html',
  styleUrl: './declarations.component.css'
})
export class DeclarationsComponent {
  sinistres: Sinistre[] = [
    { id: 1, date: '2025-05-20', type: 'Accident', statut: 'En cours', description: 'Accrochage avant gauche, véhicule immobilisé.' },
    { id: 2, date: '2025-04-15', type: 'Vol', statut: 'Clos', description: 'Vol du véhicule, dossier traité par assurance.' },
    { id: 3, date: '2025-03-30', type: 'Incendie', statut: 'En attente', description: 'Dommages causés par un incendie de moteur.' },
  ];

  selectedSinistre: Sinistre | null = null;

  selectSinistre(sinistre: Sinistre) {
    this.selectedSinistre = sinistre;
  }

  clearSelection() {
    this.selectedSinistre = null;
  }

}
