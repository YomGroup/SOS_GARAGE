import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-support',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './support.component.html',
  styleUrls: ['./support.component.css']
})
export class SupportComponent {
  faqItems = [
    {
      question: 'Comment ajouter un nouveau véhicule ?',
      answer: 'Pour ajouter un nouveau véhicule, cliquez sur le bouton "Ajouter un véhicule" en haut à droite de la page de gestion. Remplissez ensuite tous les champs requis comme la marque, le modèle, l\'immatriculation, etc.',
      isOpen: false
    },
    {
      question: 'Comment modifier les informations d\'un véhicule ?',
      answer: 'Cliquez sur l\'icône de modification (crayon) dans la carte du véhicule ou dans la section Actions. Une fenêtre s\'ouvrira vous permettant de modifier toutes les informations du véhicule.',
      isOpen: false
    },
    {
      question: 'Comment filtrer les véhicules par statut ?',
      answer: 'Utilisez le menu déroulant "Statut" dans la section de filtrage en haut de la page. Vous pouvez choisir entre Actif, En réparation, Hors service ou voir tous les véhicules.',
      isOpen: false
    },
    {
      question: 'Que faire si je ne trouve pas mon véhicule ?',
      answer: 'Vérifiez d\'abord vos filtres de recherche. Essayez de rechercher par immatriculation, marque ou modèle. Si le problème persiste, contactez notre support technique.',
      isOpen: false
    },
    {
      question: 'Comment supprimer un véhicule ?',
      answer: 'Cliquez sur l\'icône de suppression (poubelle) dans la carte du véhicule. Une confirmation vous sera demandée avant la suppression définitive. Attention, cette action est irréversible.',
      isOpen: false
    }
  ];

  toggleFAQ(index: number): void {
    this.faqItems[index].isOpen = !this.faqItems[index].isOpen;
  }
}