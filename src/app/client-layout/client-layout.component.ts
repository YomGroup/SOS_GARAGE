import { Component, HostListener  } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';

@Component({
  selector: 'app-client-layout',
  imports: [RouterOutlet, RouterLink],
  templateUrl: './client-layout.component.html',
  styleUrl: './client-layout.component.css'
})
export class ClientLayoutComponent {
  activeModal: string | null = null;

  openModal(id: string) {
    this.activeModal = id;
    document.body.style.overflow = 'hidden'; // bloque le scroll du fond
  }

  closeModal() {
    this.activeModal = null;
    document.body.style.overflow = ''; // rétablit le scroll
  }

  // Fermer si on clique le backdrop (mais pas le contenu)
  onBackdropClick(evt: MouseEvent) {
    if (evt.target === evt.currentTarget) this.closeModal();
  }

  // Échap pour fermer
  @HostListener('document:keydown.escape')
  onEsc() {
    if (this.activeModal) this.closeModal();
  }
}
