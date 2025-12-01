// client.component.ts
import { Component, HostListener, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RoleRedirectService } from '../core/services/role-redirect.service';
import { RouterOutlet, RouterLink } from '@angular/router';

@Component({
  selector: 'app-client',
  imports: [CommonModule, RouterOutlet, RouterLink],
  templateUrl: './client.component.html',
  styleUrls: ['./client.component.css'],
})

export class ClientComponent {
  activeModal: string | null = null;

  // === Features "Pourquoi nous choisir" ===
  features = [
    {
      id: 'security',
      icon: '🛡️',
      title: 'Sécurité',
      description:
        "Vos données sont protégées et vos démarches sont sécurisées. Nous utilisons les dernières technologies de cryptage pour garantir la confidentialité de vos informations personnelles.",
      image: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=800&q=80'
    },
    {
      id: 'speed',
      icon: '⚡',
      title: 'Rapidité',
      description:
        "Traitement express de votre dossier. Notre équipe s'engage à examiner votre demande dans les 24 heures et à vous accompagner jusqu'à la résolution complète.",
      image: 'https://images.unsplash.com/photo-1504222490345-c075b6008014?w=800&q=80'
    },
    {
      id: 'experts',
      icon: '👥',
      title: 'Experts dédiés',
      description:
        "Une équipe d'experts automobiles à votre service. Chaque dossier est suivi par un conseiller dédié qui connaît votre situation et peut répondre à toutes vos questions.",
      image: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=800&q=80'
    },
    {
      id: 'support',
      icon: '🎧',
      title: 'Support 24/7',
      description:
        "Assistance disponible à tout moment. Que ce soit pour une urgence ou une simple question, notre équipe de support est là pour vous aider jour et nuit.",
      image: 'https://images.unsplash.com/photo-1534536281715-e28d76689b4d?w=800&q=80'
    }
  ];

  activeFeature = this.features[0];

  setActiveFeature(feature: any) {
    this.activeFeature = feature;
  }

  // === Modales existantes ===
  openModal(id: string) {
    this.activeModal = id;
    document.body.style.overflow = 'hidden';
  }

  closeModal() {
    this.activeModal = null;
    document.body.style.overflow = '';
  }

  onBackdropClick(evt: MouseEvent) {
    if (evt.target === evt.currentTarget) this.closeModal();
  }

  @HostListener('document:keydown.escape')
  onEsc() {
    if (this.activeModal) this.closeModal();
  }
}
