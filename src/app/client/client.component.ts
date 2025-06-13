// client.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-client',
  templateUrl: './client.component.html',
  styleUrls: ['./client.component.css'],
  imports: [CommonModule]
})
export class ClientComponent {
  isModalOpen: boolean = false; // Variable pour contrôler l'affichage du modal

  // Fonction pour ouvrir le modal
  openModal() {
    this.isModalOpen = true;
  }

  // Fonction pour fermer le modal
  closeModal() {
    this.isModalOpen = false;
  }
}
