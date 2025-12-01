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
      icon: '🚘',
      title: 'Véhicule',
      description:
        "Ajoutez votre véhicule à l'aide de votre plaque d'immatriculation, confirmez les informations et choisissez votre assurance en moins de 5 cliques",
      duration: '3 minutes',
      gradient: 'linear-gradient(90deg, #04316bff, #0066dd)'
    },
    {
      number: '02',
      icon: '📝',
      title: 'Déclaration',
      description:
        "Remplissez notre formulaire en ligne avec les détails de votre sinistre. Ajoutez photos, constat amiable et documents justificatifs.",
      duration: '5 minutes',
      gradient: 'linear-gradient(90deg, #004aad, #0066dd)'
    },
    {
      number: '03',
      icon: '✅',
      title: 'Validation',
      description:
        "Notre équipe vérifie votre dossier et vous contacte sous 24h pour confirmer la prise en charge de votre sinistre.",
      duration: '24 heures',
      gradient: 'linear-gradient(90deg, #0066dd, #5a2d82)'
    },
    {
      number: '04',
      icon: '🔍',
      title: 'Expertise',
      description:
        "Un expert automobile évalue les dommages de votre véhicule et établit un rapport détaillé pour l'indemnisation.",
      duration: '48 heures',
      gradient: 'linear-gradient(90deg, #5a2d82, #7b2cbf)'
    },
    {
      number: '05',
      icon: '🔧',
      title: 'Réparation',
      description:
        "Votre véhicule est pris en charge dans l'un de nos 500+ garages partenaires pour des réparations garanties.",
      duration: 'Variable',
      gradient: 'linear-gradient(90deg, #7b2cbf, #9932cc)'
    },
    {
      number: '06',
      icon: '🎉',
      title: 'Clôture',
      description:
        "Récupérez votre véhicule réparé et recevez votre indemnisation. Votre dossier est clôturé avec succès.",
      duration: ' Variable',
      gradient: 'linear-gradient(90deg, #9932cc, #aa38cb)'
    }
  ];

  faqs: Faq[] = [
    {
      question: "Combien de temps prend le traitement d'un sinistre ?",
      answer:
        "En moyenne, un sinistre est traité en 7 à 10 jours ouvrés, de la déclaration à gestion. Les délais peuvent varier selon la complexité du dossier."
    },
    {
      question: 'Dois-je avancer les frais de réparation ?',
      answer:
        "Non, les frais sont directement pris en charge par l'assurance. Vous n'avez aucune avance à faire a un garage."
    },
    // {
    //   question: 'Puis-je choisir mon propre garage ?',
    //   answer:
    //     'Oui, vous pouvez choisir votre garage habituel. Cependant, nos garages partenaires offrent des avantages exclusifs comme le véhicule de courtoisie gratuit.'
    // },
    {
      question: "Que faire en cas de désaccord avec l'expertise ?",
      answer:
        "Vous pouvez demander une contre-expertise à vos frais ou nous contacter pour une médiation avec l'assurance."
    },
    {
      question: "Le garage fournit-il un véhicule de remplacement ?",
      answer:
        "Oui, un véhicule de secours peut être mis à votre disposition selon la disponibilité du garage chargé de votre réparation."
    },
    {
      question: "Comment se passe la communication avec mon assurance ?",
      answer:
        "Nous assurons une liaison directe avec votre assurance pour le suivi du dossier, l'expertise et la validation de la prise en charge."
    },
    {
      question: "Les pièces utilisées sont-elles de qualité ?",
      answer:
        "Oui, les garages utilisent exclusivement des pièces de premier choix, conformes aux standards du marché et validées par les assureurs."
    },
    {
      question: "Que faire si le délai de réparation est plus long que prévu ?",
      answer:
        "En cas de retard, nous vous informons immédiatement et nous coordonnons avec le garage et l’assurance pour accélérer le traitement si nécessaire."
    }




  ];
}
