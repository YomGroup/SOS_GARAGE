import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

interface SupportMethod {
  icon: string;
  title: string;
  value: string;
  description: string;
  link: string;
  linkText: string;
}

@Component({
  selector: 'app-support',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './support.component.html',
  styleUrl: './support.component.css'
})
export class SupportComponent {
  supportMethods: SupportMethod[] = [
    {
      icon: '✉️',
      title: 'Email',
      value: 'sosmongarage2025@gmail.com',
      description: 'Réponse sous 24h maximum',
      link: 'mailto:sosmongarage2025@gmail.com',
      linkText: 'Envoyer un email'
    },
    {
      icon: '💬',
      title: 'WhatsApp',
      value: '+33 6 10 75 31 66',
      description: 'Réponse rapide et directe',
      link: 'https://wa.me/33610753166',
      linkText: 'Ouvrir WhatsApp'
    }
  ];

  faqItems = [
    {
      id: 'faq1',
      question: 'Comment déclarer un sinistre ?',
      answer: 'Connectez-vous à votre espace client, cliquez sur "Déclarer un sinistre" et suivez les étapes. Vous devrez fournir les photos du véhicule et les détails de l\'incident.',
      isOpen: false
    },
    {
      id: 'faq2',
      question: 'Quel est le délai de traitement d\'un dossier ?',
      answer: 'Votre dossier est examiné sous 24h. Le délai total dépend de la complexité du sinistre, mais nous vous tenons informé à chaque étape.',
      isOpen: false
    },
    {
      id: 'faq3',
      question: 'Comment suivre l\'avancement de mon dossier ?',
      answer: 'Depuis votre espace client, accédez à "Mes Sinistres". Vous y verrez le statut en temps réel et recevrez des notifications à chaque mise à jour.',
      isOpen: false
    },
    {
      id: 'faq4',
      question: 'Puis-je choisir mon garage ?',
      answer: 'Vous pouvez exprimer une préférence géographique, et nous vous proposerons les options disponibles.',
      isOpen: false
    },
    {
      id: 'faq5',
      question: 'Quels documents dois-je fournir ?',
      answer: 'Photos du véhicule endommagé, constat amiable si disponible, et contrat d\'assurance. Tous ces documents peuvent être uploadés directement dans l\'application.',
      isOpen: false
    }
  ];

  toggleFaq(index: number) {
    this.faqItems[index].isOpen = !this.faqItems[index].isOpen;
  }

  openLink(link: string) {
    window.open(link, '_blank');
  }
}