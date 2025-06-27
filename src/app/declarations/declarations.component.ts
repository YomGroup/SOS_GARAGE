import { Component, Inject, inject, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { VehicleService } from '../../services/vehicle.service';
import { AuthService } from '../../services/auth.service';
import { PdfViewerModule } from 'ng2-pdf-viewer';
import { RouterModule } from '@angular/router';
import { DOCUMENT } from '@angular/common';
import { AssureService } from '../../services/assure.service';

import { SinistreService } from '../../services/sinistre.service';
import { PDFDocument, rgb } from 'pdf-lib';

interface Document {
  id: number;
  nom: string;
  fichier: string;
  modifiedBlobUrl: string | null;
}

@Component({
  standalone: true,
  selector: 'app-declarations',
  imports: [
    FormsModule,
    CommonModule,
    PdfViewerModule,
    RouterModule
  ],
  templateUrl: './declarations.component.html',
  styleUrls: ['./declarations.component.css']
})
export class DeclarationsComponent implements OnDestroy {
  documents: Document[] = [
    {
      id: 1,
      nom: 'Mandat de gestion de sinistre',
      fichier: 'assets/documents/Mandat_Gestion_Sinistre_SOS_Mon_Garage.pdf',
      modifiedBlobUrl: null
    },
    {
      id: 2,
      nom: 'Ordre de réparation',
      fichier: 'assets/documents/Ordre_Reparation_SOS_Mon_Garage.pdf',
      modifiedBlobUrl: null
    },
    {
      id: 3,
      nom: 'Cession de créance',
      fichier: 'assets/documents/Cession_Creance_SOS_Mon_Garage.pdf',
      modifiedBlobUrl: null
    }
  ];

  // Variables d'état
  currentStep = 1;
  vehicleStatus = '';
  selectedVehicle = '';
  currentDocument = 1;
  signedDocuments = new Set<number>();
  allDocumentsSigned = false;
  isDropdownOpen = false;
  isSigning = false;
  isChecked = false;
  currentPdfError = false;
  email = '';
  constatFile?: File;
  photosFiles: File[] = [];
  vehicles: string[] = [];
  vehiclesAll: any[] = [];
  userData: any = null;
  previewPhotos: { url: string, file: File }[] = [];
  constatPreviewUrl: string | null = null;
  showPdfViewer = false;
  signatureImage: string | null = null;
  // Services
  private vehiculeService = inject(VehicleService);
  private authService = inject(AuthService);
  private assureService = inject(AssureService);
  private sinistreService = inject(SinistreService);
  constructor(@Inject(DOCUMENT) private document: Document) {
    this.loadUserData();
    this.loadVehicles();
    this.email = this.authService.getToken()?.name || '';
  }

  ngOnDestroy() {
    // Nettoyage des URLs blob
    this.documents.forEach(doc => {
      if (doc.modifiedBlobUrl) {
        URL.revokeObjectURL(doc.modifiedBlobUrl);
      }
    });
    this.previewPhotos.forEach(photo => {
      URL.revokeObjectURL(photo.url);
    });
    if (this.constatPreviewUrl) {
      URL.revokeObjectURL(this.constatPreviewUrl);
    }
  }

  private loadUserData(): void {
    const userId = 8; // Remplacer par this.authService.getToken()?.id
    if (userId) {
      this.assureService.addAssurerGet(userId).subscribe({
        next: (data: any) => {
          this.userData = data;
          this.prepareDocumentTemplates();
        },
        error: (err) => {
          console.error('Erreur lors du chargement des données utilisateur', err);
        }
      });
    }
  }

  private async prepareDocumentTemplates(): Promise<void> {
    for (const doc of this.documents) {
      try {
        const modifiedBlob = await this.modifyPdfWithUserData(doc.fichier);
        doc.modifiedBlobUrl = URL.createObjectURL(modifiedBlob);
      } catch (error) {
        console.error(`Erreur lors de la modification du document ${doc.nom}`, error);
        doc.modifiedBlobUrl = this.getPdfPath(doc.fichier);
      }
    }
  }

  private async modifyPdfWithUserData(pdfPath: string): Promise<Blob> {
    const response = await fetch(pdfPath);
    const pdfBytes = await response.arrayBuffer();
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const pages = pdfDoc.getPages();
    const firstPage = pages[0];

    // Données utilisateur
    const { nom, prenom, adressePostale, telephone, email } = this.userData;

    // Données véhicule (trouver le véhicule sélectionné)
    const vehicule = this.vehiclesAll.find(v => v.marque === this.selectedVehicle);
    console.log('Véhicule sélectionné:', vehicule);

    const textOptions = { size: 11, color: rgb(0, 0, 0) };

    // Remplir les champs communs
    firstPage.drawText(`${nom} ${prenom}`, { x: 150, y: 680, ...textOptions });
    firstPage.drawText(adressePostale, { x: 150, y: 660, ...textOptions });
    firstPage.drawText(telephone, { x: 150, y: 640, ...textOptions });
    firstPage.drawText(email, { x: 150, y: 620, ...textOptions });

    // Remplir les infos véhicule si disponibles
    if (vehicule) {
      firstPage.drawText(vehicule.immatriculation, { x: 150, y: 600, ...textOptions });
      firstPage.drawText(`${vehicule.marque} ${vehicule.modele}`, { x: 150, y: 580, ...textOptions });
      firstPage.drawText(vehicule.cylindree, { x: 150, y: 560, ...textOptions });

      // Formater la date
      const dateCirculation = new Date(vehicule.dateMiseEnCirculation).toLocaleDateString('fr-FR');
      firstPage.drawText(dateCirculation, { x: 150, y: 540, ...textOptions });
    }

    // Date du jour
    const today = new Date().toLocaleDateString('fr-FR');
    firstPage.drawText(today, { x: 450, y: 680, ...textOptions });

    const modifiedPdfBytes = await pdfDoc.save();
    return new Blob([modifiedPdfBytes], { type: 'application/pdf' });
  }

  getPdfPath(filename: string): string {
    const doc = this.documents.find(d => d.fichier === filename);
    // Correction: Utilisation de window.location.origin
    return doc?.modifiedBlobUrl || `${window.location.origin}/${filename}`;
  }


  private loadVehicles(): void {
    this.vehiculeService.getAllVehiculesPost().subscribe({
      next: (data: any) => {
        this.vehiclesAll = data;
        this.vehicles = data.map((vehicule: any) => vehicule.marque);
      },
      error: (err) => {
        console.error('Erreur lors du chargement des véhicules :', err);
      }
    });
  }

  get currentPdf(): string {
    try {
      const doc = this.documents.find(d => d.id === this.currentDocument);
      if (!doc) {
        this.currentPdfError = true;
        return '';
      }
      this.currentPdfError = false;
      return this.getPdfPath(doc.fichier);
    } catch (error) {
      this.currentPdfError = true;
      console.error('Erreur de chargement du PDF', error);
      return '';
    }
  }

  // Navigation entre étapes
  nextStep(): void {
    if (this.canProceed()) {
      this.currentStep++;
    }
  }

  previousStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }
  // Logique de signature
  signDocument(): void {
    if (this.isCurrentDocumentSigned || this.isSigning || !this.isChecked) {
      return;
    }

    this.isSigning = true;

    setTimeout(() => {
      this.signedDocuments.add(this.currentDocument);
      this.isSigning = false;
      this.isChecked = false;

      if (this.signedDocuments.size === this.documents.length) {
        this.allDocumentsSigned = true;
        this.submitSinistre();
      } else {
        this.currentDocument++;
      }
    }, 1000);
  }

  // Autres méthodes utilitaires
  canProceed(): boolean {
    switch (this.currentStep) {
      case 1: return !!this.vehicleStatus;
      case 2: return !!this.selectedVehicle;
      case 3: case 4: return true;
      case 5: return false;
      default: return false;
    }
  }

  selectVehicle(vehicle: string): void {
    this.selectedVehicle = vehicle;
    this.isDropdownOpen = false;
  }

  toggleDropdown(): void {
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  onFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      this.constatFile = input.files[0];
      this.showPdfViewer = false;

      // Nettoyer l'ancienne prévisualisation si elle existe
      if (this.constatPreviewUrl) {
        URL.revokeObjectURL(this.constatPreviewUrl);
      }

      // Générer l'URL de prévisualisation
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.constatPreviewUrl = e.target.result;
        if (this.constatFile?.type === 'application/pdf') {
          this.showPdfViewer = true;
        }
      };
      reader.readAsDataURL(this.constatFile);
    }
  }

  onPhotoSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      // Limite à 10 photos maximum
      const remainingSlots = 10 - this.previewPhotos.length;
      const filesToAdd = Array.from(input.files).slice(0, remainingSlots);

      filesToAdd.forEach(file => {
        if (!file.type.match('image.*')) {
          alert('Seules les images sont acceptées');
          return;
        }

        const reader = new FileReader();
        reader.onload = (e: any) => {
          this.previewPhotos.push({
            url: e.target.result,
            file: file
          });
          this.photosFiles.push(file); // Ajoute aussi au tableau principal
        };
        reader.readAsDataURL(file);
      });

      if (input.files.length > remainingSlots) {
        alert(`Vous avez atteint la limite de 10 photos. ${remainingSlots} photos ajoutées.`);
      }
    }
  }
  removeConstat(): void {
    if (this.constatPreviewUrl) {
      URL.revokeObjectURL(this.constatPreviewUrl);
    }
    this.constatPreviewUrl = null;
    this.constatFile = undefined;
    this.showPdfViewer = false;
  }
  removePhoto(index: number): void {
    URL.revokeObjectURL(this.previewPhotos[index].url);
    this.previewPhotos.splice(index, 1);
    this.photosFiles.splice(index, 1);
  }

  get isCurrentDocumentSigned(): boolean {
    return this.signedDocuments.has(this.currentDocument);
  }

  getSigningProgress(): number {
    return (this.signedDocuments.size / this.documents.length) * 100;
  }
  // Soumission du sinistre
  async submitSinistre(): Promise<void> {
    try {
      // 1. Traitement du constat (s'il existe)
      const constatDoc = this.constatFile
        ? await this.processFile(this.constatFile, 'CONSTAT')
        : null;

      // 2. Traitement des photos
      const photosDocs = await Promise.all(
        this.photosFiles.map(file => this.processFile(file, 'PHOTO'))
      );

      // 3-5. Traitement des documents signés
      const signedDocs = await Promise.all(
        Array.from(this.signedDocuments).map(async docId => {
          const doc = this.documents.find(d => d.id === docId);
          if (!doc) return null;

          const response = await fetch(doc.modifiedBlobUrl || doc.fichier);
          const pdfBytes = await response.arrayBuffer();

          return {
            type: doc.nom.toUpperCase().replace(/ /g, '_'),
            fichier: await this.arrayBufferToBase64(pdfBytes),
            signatureElectronique: ['signature_validee']
          };
        })
      );

      // Construction FINALE du payload avec TOUS les documents
      const sinistrePayload = {
        type: this.vehicleStatus === 'rolling' ? 'ROULANT' : 'NON_ROULANT',
        contactAssistance: this.email,
        lienConstat: constatDoc?.fichier || '', // Base64 du constat
        conditionsAcceptees: true,
        documents: [
          ...(constatDoc ? [constatDoc] : []),  // Ajout du constat
          ...photosDocs,                        // Ajout des photos
          ...signedDocs.filter(Boolean)         // Ajout des 3 documents signés
        ],
        idVehicule: this.vehiclesAll.find(v => v.marque === this.selectedVehicle)?.id || 0
      };

      console.log('Payload COMPLET:', sinistrePayload);
      // this.sinistreService.declarerSinistre(sinistrePayload).subscribe(...);
      // Appel au service pour soumettre le sinistre
      this.sinistreService.addSinistrePost(sinistrePayload).subscribe({
        next: (response) => {
          console.log('Sinistre soumis avec succès:', response);
          // Vous pouvez ajouter ici une redirection ou un message de succès
          this.currentStep = 5; // Passer à l'étape de confirmation
        },
        error: (error) => {
          console.error('Erreur lors de la soumission du sinistre:', error);
          // Gérer l'erreur (afficher un message à l'utilisateur, etc.)
        }
      });
    } catch (error) {
      console.error('Erreur soumission:', error);
    }
  }

  // Méthode utilitaire pour convertir ArrayBuffer en Base64
  private arrayBufferToBase64(buffer: ArrayBuffer): Promise<string> {
    return new Promise((resolve) => {
      const blob = new Blob([buffer], { type: 'application/pdf' });
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        resolve(dataUrl.split(',')[1]); // Retourne seulement la partie base64
      };
      reader.readAsDataURL(blob);
    });
  }

  private async processFile(file: File | undefined, type: string): Promise<any> {
    if (!file) return null;

    const base64 = await this.readFileAsBase64(file);
    return {
      type,
      fichier: base64,
      signatureElectronique: ['signature_placeholder']
    };
  }

  private readFileAsBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
}