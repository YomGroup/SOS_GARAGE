import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

interface MainService {
  title: string;
  description: string;
  features: string[];
  gradientClass: string;
  icon: string;
}

interface AdditionalService {
  title: string;
  description: string;
  icon: string;
}

@Component({
  selector: 'app-services',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './services.component.html',
  styleUrl: './services.component.css'
})
export class ServicesComponent {

  services: MainService[] = [
    {
      icon: '📄',
      title: 'Déclaration de sinistre',
      description:
        'Déclarez votre sinistre automobile en quelques minutes, directement en ligne. Notre formulaire simplifié vous guide étape par étape pour rassembler toutes les informations nécessaires.',
      features: [
        'Formulaire en ligne 24h/24',
        'Photos et documents joints',
        // 'Constat amiable digital',
        'Prise en charge rapide'
      ],
      gradientClass: 'service-card-1'
    },
    // {
    //   icon: '🔍',
    //   title: 'Expertise automobile',
    //   description:
    //     'Nos experts certifiés évaluent les dommages de votre véhicule avec précision. Nous nous déplaçons chez vous ou dans notre réseau de garages partenaires.',
    //   features: [
    //     'Experts certifiés',
    //     'Évaluation précise des dommages',
    //     'Rapport détaillé sous 48h',
    //     'Expertise à domicile possible'
    //   ],
    //   gradientClass: 'service-card-2'
    // },
    {
      icon: '💶',
      title: 'Indemnisation rapide',
      description:
        "Recevez votre indemnisation dans les meilleurs délais. Nous négocions avec votre assurance pour vous garantir la meilleure prise en charge.",
      features: [
        "Négociation avec l'assurance",
        // 'Virement sous 7 jours',
        'Suivi en temps réel',
        'Aucun frais cachés'
      ],
      gradientClass: 'service-card-3'
    },
    {
      icon: '🔧',
      title: 'Réparation garantie',
      description:
        "Des garages assure des réparations de qualité avec des pièces d'origine et une garantie étendue.",
      features: [
        '500+ garages partenaires',
        "Pièces d'origine garanties",
        'Véhicule de courtoisie',
        'Reparations rapides'
      ],
      gradientClass: 'service-card-4'
    }
  ];

  additionalServices: AdditionalService[] = [
    {
      icon: '🚗',
      title: 'Véhicule de remplacement',
      description:
        'Restez mobile pendant les réparations avec notre service de véhicule de courtoisie.'
    },
    {
      icon: '🛡️',
      title: 'Assistance juridique',
      description:
        'En cas de litige, nos experts juridiques vous accompagnent dans vos démarches.'
    },
    {
      icon: '⏱️',
      title: 'Suivi en temps réel',
      description:
        "Suivez l'avancement de votre dossier à chaque étape via notre application."
    }
  ];
}
