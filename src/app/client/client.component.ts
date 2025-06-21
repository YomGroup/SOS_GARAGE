// client.component.ts
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RoleRedirectService } from '../core/services/role-redirect.service';

@Component({
  selector: 'app-client',
  templateUrl: './client.component.html',
  styleUrls: ['./client.component.css'],
  standalone: true, // Assurez-vous que le composant est standalone si ce n'est pas le cas
  imports: [CommonModule]
})
export class ClientComponent implements OnInit {
  private roleRedirectService = inject(RoleRedirectService);

  ngOnInit(): void {
    this.roleRedirectService.handleLoginRedirect();
  }

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
