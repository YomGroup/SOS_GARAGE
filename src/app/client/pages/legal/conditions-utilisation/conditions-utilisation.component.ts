import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-conditions-utilisation',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './conditions-utilisation.component.html',
  styleUrls: ['./conditions-utilisation.component.css']
})
export class ConditionsUtilisationComponent implements OnInit {
  lastUpdate: string = 'Février 2025';
  effectiveDate: string = 'Février 2025';

  sections = [
    { id: 'objet', title: '1. Objet', active: false },
    { id: 'acceptation', title: '2. Acceptation des conditions', active: false },
    { id: 'inscription', title: '3. Inscription et compte utilisateur', active: false },
    { id: 'services', title: '4. Description des services', active: false },
    { id: 'obligations', title: '5. Obligations des utilisateurs', active: false },
    { id: 'donnees', title: '6. Collecte et utilisation des données', active: false },
    { id: 'propriete', title: '7. Propriété intellectuelle', active: false },
    { id: 'disponibilite', title: '8. Disponibilité et maintenance', active: false },
    { id: 'responsabilite', title: '9. Limitation de responsabilité', active: false },
    { id: 'suspension', title: '10. Suspension et résiliation', active: false },
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