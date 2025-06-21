import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

interface Sinistre {
  id: number;
  date: string;
  type: string;
  statut: string;
  description: string;
}
@Component({
  selector: 'app-declarations',
  imports: [FormsModule, CommonModule],
  templateUrl: './declarations.component.html',
  styleUrl: './declarations.component.css'
})
export class DeclarationsComponent {
  currentStep = 1;
  vehicleStatus = '';
  selectedVehicle = '';
  currentDocument = 1;
  signedDocuments: Set<number> = new Set();
  allDocumentsSigned = false;
  isDropdownOpen = false;
  totalDocuments: number = 3;
  isSigning: boolean = false;
  isChecked: boolean = false;
  // Liste des véhicules disponibles
  vehicles: string[] = [
    'Mercedes AMG',
    'BMW X5',
    'Peugeot 208',
    'Audi A4',
    'Renault Clio'
  ];
  nextStep() {
    if (this.canProceed()) {
      this.currentStep++;
    }
  }

  previousStep() {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  canProceed(): boolean {
    switch (this.currentStep) {
      case 1:
        return this.vehicleStatus !== '';
      case 2:
        return this.selectedVehicle !== '';
      case 3:
        return true; // File upload is optional
      case 4:
        return true; // Photo upload is optional
      case 5:
        return false; // Handled by document signing
      default:
        return false;
    }
  }

  selectVehicle(vehicle: string) {
    this.selectedVehicle = vehicle;
    this.isDropdownOpen = false;
  }

  onFileSelect(event: any) {
    const file = event.target.files[0];
    if (file) {
      console.log('Constat file selected:', file.name);
    }
  }

  onPhotoSelect(event: any) {
    const files = event.target.files;
    if (files.length > 0) {
      console.log('Photos selected:', files.length);
    }
  }


  // Vérifier si le document actuel est signé
  get isCurrentDocumentSigned(): boolean {
    return this.signedDocuments.has(this.currentDocument);
  }

  // Signer le document actuel
  signDocument(): void {
    if (this.isCurrentDocumentSigned || this.isSigning) {
      return;
    }

    this.isSigning = true;

    // Simulation de signature (remplacer par votre logique réelle)
    setTimeout(() => {
      this.signedDocuments.add(this.currentDocument);
      this.isSigning = false;
      this.isChecked = false;

      this.nextDocument();


    }, 2000);
  }


  // Passer au document suivant
  nextDocument(): void {
    if (this.currentDocument < this.totalDocuments) {
      this.currentDocument++;
    } else {
      // Tous les documents sont signés
      this.allDocumentsSigned = true;
      console.log('Tous les documents ont été signés');
    }
  }



  toggleDropdown() {
    this.isDropdownOpen = !this.isDropdownOpen;
  }



  // Réinitialiser la signature (si nécessaire)
  resetDocumentSigning(): void {
    this.currentDocument = 1;
    this.signedDocuments.clear();
    this.isSigning = false;
    this.allDocumentsSigned = false;
  }

  // Obtenir le progrès de signature
  getSigningProgress(): number {
    return (this.signedDocuments.size / this.totalDocuments) * 100;
  }
}
