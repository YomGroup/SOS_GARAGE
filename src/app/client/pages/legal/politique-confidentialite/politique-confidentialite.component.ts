import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-politique-confidentialite',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './politique-confidentialite.component.html',
  styleUrls: ['./politique-confidentialite.component.css']
})
export class PolitiqueConfidentialiteComponent implements OnInit {
  lastUpdate: string = 'Février 2025';
  
  sections = [
    { id: 'introduction', title: '1. Introduction' },
    { id: 'responsable', title: '2. Responsable du traitement' },
    { id: 'donnees-collectees', title: '3. Données personnelles collectées' },
    { id: 'finalites', title: '4. Finalités du traitement' },
    { id: 'base-legale', title: '5. Base légale du traitement' },
    { id: 'destinataires', title: '6. Destinataires des données' },
    { id: 'duree', title: '7. Durée de conservation' },
    { id: 'securite', title: '8. Sécurité des données' },
    { id: 'droits', title: '9. Vos droits' },
    { id: 'cookies', title: '10. Cookies et technologies de suivi' },
  ];

  ngOnInit(): void {
    this.scrollToTop();
  }

  scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  scrollToSection(sectionId: string): void {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
}