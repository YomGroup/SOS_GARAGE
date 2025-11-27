import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Step {
  number: string;
  icon: string;
  title: string;
  description: string;
  duration: string;
  gradient: string;
}

interface Faq {
  question: string;
  answer: string;
}

@Component({
  selector: 'app-comment-ca-marche',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './comment-ca-marche.component.html',
  styleUrl: './comment-ca-marche.component.css'
})
export class CommentCaMarcheComponent {
  steps: Step[] = [
    {
      number: '01',
      icon: '📝',
      title: 'Déclaration',
      description:
        "Remplissez notre formulaire en ligne avec les détails de votre sinistre. Ajoutez photos, constat amiable et documents justificatifs.",
      duration: '5 minutes',
      gradient: 'linear-gradient(90deg, #004aad, #0066dd)'
    },
    {
      number: '02',
      icon: '✅',
      title: 'Validation',
      description:
        "Notre équipe vérifie votre dossier et vous contacte sous 24h pour confirmer la prise en charge de votre sinistre.",
      duration: '24 heures',
      gradient: 'linear-gradient(90deg, #0066dd, #5a2d82)'
    },
    {
      number: '03',
      icon: '🔍',
      title: 'Expertise',
      description:
        "Un expert automobile évalue les dommages de votre véhicule et établit un rapport détaillé pour l'indemnisation.",
      duration: '48 heures',
      gradient: 'linear-gradient(90deg, #5a2d82, #7b2cbf)'
    },
    {
      number: '04',
      icon: '🔧',
      title: 'Réparation',
      description:
        "Votre véhicule est pris en charge dans l'un de nos 500+ garages partenaires pour des réparations garanties.",
      duration: 'Variable',
      gradient: 'linear-gradient(90deg, #7b2cbf, #9932cc)'
    },
    {
      number: '05',
      icon: '🎉',
      title: 'Clôture',
      description:
        "Récupérez votre véhicule réparé et recevez votre indemnisation. Votre dossier est clôturé avec succès.",
      duration: '7 jours',
      gradient: 'linear-gradient(90deg, #9932cc, #aa38cb)'
    }
  ];

  faqs: Faq[] = [
    {
      question: "Combien de temps prend le traitement d'un sinistre ?",
      answer:
        "En moyenne, un sinistre est traité en 7 à 10 jours ouvrés, de la déclaration à l'indemnisation. Les délais peuvent varier selon la complexité du dossier."
    },
    {
      question: 'Dois-je avancer les frais de réparation ?',
      answer:
        "Non, dans la plupart des cas, les frais sont directement pris en charge par l'assurance. Vous n'avez aucune avance à faire dans nos garages partenaires."
    },
    {
      question: 'Puis-je choisir mon propre garage ?',
      answer:
        'Oui, vous pouvez choisir votre garage habituel. Cependant, nos garages partenaires offrent des avantages exclusifs comme le véhicule de courtoisie gratuit.'
    },
    {
      question: "Que faire en cas de désaccord avec l'expertise ?",
      answer:
        "Vous pouvez demander une contre-expertise à vos frais ou nous contacter pour une médiation avec l'assurance."
    }
  ];
}
