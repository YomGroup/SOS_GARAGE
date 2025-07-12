import { Component, Inject, inject, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { VehicleService } from '../../services/vehicle.service';
import { AuthService } from '../../services/auth.service';
import { PdfViewerModule } from 'ng2-pdf-viewer';
import { RouterModule } from '@angular/router';
import { DOCUMENT } from '@angular/common';
import { AssureService } from '../../services/assure.service';
import { DocumentService } from '../../services/document.service';
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
export class DeclarationsComponent implements OnDestroy, OnInit {
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
  incidentDescription: string = '';
  hasChosenDeclarationMethod: boolean = false;
  declarationMethod: 'describe' | 'upload' | null = null;
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
  userid: string | null = null;
  assureId: number = 0;
  // Add this to your component class properties
  assurances: any[] = [];
  selectedAssurance: any = null;
  showAssuranceStep = false;
  currentPhotoStep: number = 1;
  photoSteps: any = {
    1: [], // Photos d'ensemble
    2: [], // Plaque immatriculation
    3: [], // Numéro de série
    4: []  // Zones endommagées
  };

  // Services
  private vehiculeService = inject(VehicleService);
  private authService = inject(AuthService);
  private assureService = inject(AssureService);
  private sinistreService = inject(SinistreService);
  private documentService = inject(DocumentService);
  constructor(@Inject(DOCUMENT) private document: Document) {

  }
  ngOnInit(): void {
    this.userid = this.authService.getToken()?.['sub'] ?? null;

    if (this.userid) {
      this.assureService.getAssurerID(this.userid).subscribe({
        next: (data: any) => {
          this.assureId = data.id; // adapte selon ta réponse
          this.loadVehicles(this.assureId);
          this.loadUserData();
          this.email = this.authService.getToken()?.name || '';
        },
        error: (err) => {
          console.error('Erreur lors de la récupération de l’assure  ID :', err);
        }
      });
    }
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

    this.assureService.addAssurerGet(this.assureId).subscribe({
      next: (data: any) => {
        this.userData = data;
        //this.prepareDocumentTemplates();
      },
      error: (err) => {
        console.error('Erreur lors du chargement des données utilisateur', err);
      }
    });

  }
  // Add this new method to load assurances
  private loadAssurances(): void {
    this.vehiculeService.listAssuranceVehicules().subscribe({
      next: (data: any) => {
        this.assurances = data;
        console.log('Assurances chargées:', this.assurances);
      },
      error: (err) => {
        console.error('Erreur lors du chargement des assurances', err);
      }
    });
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
    const lastPage = pages[pages.length - 1]; // 👈 page 2 (index 1)

    const { nom, prenom, adressePostale, telephone, email } = this.userData;
    const vehicule = this.vehiclesAll.find(v => v.marque === this.selectedVehicle);

    const textOptions = { size: 11, color: rgb(0, 0, 0) };

    // Page 1
    firstPage.drawText(` ${prenom ?? ''}`, { x: 200, y: 680, ...textOptions });
    firstPage.drawText(telephone ?? '', { x: 200, y: 640, ...textOptions });
    firstPage.drawText(email ?? '', { x: 200, y: 620, ...textOptions });

    if (vehicule) {
      firstPage.drawText(vehicule.immatriculation ?? '', { x: 200, y: 600, ...textOptions });
      firstPage.drawText(`${vehicule.marque ?? ''} ${vehicule.modele ?? ''}`, { x: 200, y: 580, ...textOptions });
    }

    // Page 2 : bas du document
    const city = 'Casablanca';
    const today = new Date().toLocaleDateString('fr-FR');

    lastPage.drawText(`Fait à ${city}, le ${today}`, {
      x: 150,
      y: 100, // ajuste ici si besoin
      ...textOptions
    });

    const modifiedPdfBytes = await pdfDoc.save();
    return new Blob([modifiedPdfBytes], { type: 'application/pdf' });
  }


  getPdfPath(filename: string): string {
    const doc = this.documents.find(d => d.fichier === filename);
    // Correction: Utilisation de window.location.origin
    return doc?.modifiedBlobUrl || `${window.location.origin}/${filename}`;
  }


  private loadVehicles(assureId: number): void {

    this.vehiculeService.getVehiculesDataById(assureId).subscribe({
      next: (data: any) => {
        this.vehiclesAll = data;
        this.vehicles = data.map((vehicule: any) => vehicule.marque + '(' + vehicule.immatriculation + ')');

      },
      error: (err) => {
        console.error('Erreur lors de l’appel API :', err);
      }
    });
  }
  // Nouvelles méthodes
  selectDeclarationMethod(method: 'describe' | 'upload'): void {
    this.declarationMethod = method;
    this.hasChosenDeclarationMethod = true;
  }

  validateDescription(): void {
    if (this.incidentDescription.trim().length > 10) { // Validation minimale
      this.nextStep();
    } else {
      alert('Veuillez fournir une description plus détaillée');
    }
  }
  resetDeclarationMethod(): void {
    this.hasChosenDeclarationMethod = false;
    this.declarationMethod = null;
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
      window.scrollTo({
        top: 0,
        behavior: 'smooth' // Pour un défilement doux
      });

      if (this.signedDocuments.size === this.documents.length) {
        this.allDocumentsSigned = true;
        this.submitSinistre();
      } else {
        this.currentDocument++;
      }
    }, 1000);
  }
  // Ajoutez à vos propriétés
  isAssuranceDropdownOpen = false;

  // Ajoutez ces nouvelles méthodes
  toggleAssuranceDropdown(): void {
    this.isAssuranceDropdownOpen = !this.isAssuranceDropdownOpen;
  }

  selectAssurance(assurance: any): void {
    this.selectedAssurance = assurance;
    this.isAssuranceDropdownOpen = false;
  }
  // Autres méthodes utilitaires
  canProceed(): boolean {
    switch (this.currentStep) {
      case 1:
        return true;//!!this.selectedVehicle;
      case 2: return true;//return !!this.vehicleStatus;

      case 3: case 4: return true;
      case 5: return false;
      default: return false;
    }
  }
  selectVehicle(vehicle: string): void {
    this.selectedVehicle = vehicle;
    this.isDropdownOpen = false;
    this.loadAssurances();
    console.log('Véhicule sélectionné:', this.vehicleStatus);

    // Check if vehicle is non-rolling and show assurance step
    if (this.vehicleStatus === 'not-rolling') {
      this.showAssuranceStep = true;
      this.loadAssurances();
    } else {
      this.showAssuranceStep = false;
    }
    if (this.userData) {
      this.prepareDocumentTemplates();
    }
    this.nextStep();
  }
  onStatusChange() {

    if (this.canProceed()) {
      this.nextStep();
    }
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

  onPhotoSelect(event: Event, step: number): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      const files = Array.from(input.files);

      files.forEach(file => {
        if (!file.type.match('image.*')) {
          alert('Seules les images sont acceptées');
          return;
        }

        const reader = new FileReader();
        reader.onload = (e: any) => {
          this.photoSteps[step].push({
            url: e.target.result,
            file: file
          });
        };
        reader.readAsDataURL(file);
      });

      // Réinitialiser l'input pour permettre la sélection des mêmes fichiers
      input.value = '';
    }
  }
  getCurrentStepPhotos() {
    return this.photoSteps[this.currentPhotoStep];
  }

  setPhotoStep(step: number): void {
    if (this.currentPhotoStep !== step) {
      this.currentPhotoStep = step;
    }
  }

  nextPhotoStep(): void {
    if (this.currentPhotoStep < 4) {
      this.currentPhotoStep++;
    } else {
      // Toutes les étapes photos sont complétées
      this.nextStep(); // Passer à l'étape suivante du formulaire
    }
  }

  prevPhotoStep(): void {
    if (this.currentPhotoStep > 1) {
      this.currentPhotoStep--;
    }
  }

  canProceedPhotoStep(): boolean {
    // Vérifie qu'au moins une photo a été ajoutée pour l'étape courante
    return this.photoSteps[this.currentPhotoStep].length > 0;
  }

  removePhoto(index: number, step: number): void {
    URL.revokeObjectURL(this.photoSteps[step][index].url);
    this.photoSteps[step].splice(index, 1);
  }
  removeConstat(): void {
    if (this.constatPreviewUrl) {
      URL.revokeObjectURL(this.constatPreviewUrl);
    }
    this.constatPreviewUrl = null;
    this.constatFile = undefined;
    this.showPdfViewer = false;
  }
  /*
  removePhoto(index: number): void {
    URL.revokeObjectURL(this.previewPhotos[index].url);
    this.previewPhotos.splice(index, 1);
    this.photosFiles.splice(index, 1);
  }*/

  get isCurrentDocumentSigned(): boolean {
    return this.signedDocuments.has(this.currentDocument);
  }

  getSigningProgress(): number {
    return (this.signedDocuments.size / this.documents.length) * 100;
  }
  // Soumission du sinistre
  async submitSinistre(): Promise<void> {
    try {
      const savedFiles = await this.saveFilesToAssets();

      // 2. Construire le payload avec les noms de fichiers
      const sinistrePayload = {
        type: this.vehicleStatus === 'rolling' ? 'ROULANT' : 'NON_ROULANT',
        contactAssistance: this.email,
        lienConstat: this.constatFile ? this.constatFile.name : '',
        conditionsAcceptees: true,
        documents: [], // tableau vide comme demandé
        imgUrl: savedFiles.photosNames,
        idVehicule: this.vehiclesAll.find(v => v.marque + '(' + v.immatriculation + ')' === this.selectedVehicle)?.id || 0
      };
      console.log('Payload envoyé:', sinistrePayload);

      // 1. Envoyer d'abord le sinistre (comme avant)
      this.sinistreService.addSinistrePost(sinistrePayload).subscribe({
        next: async (sinistreResponse: any) => {
          const sinistreId = sinistreResponse.id; // Adaptez selon la réponse

          // 2. Envoyer les documents avec juste le nom du fichier
          await this.sendSignedDocuments(sinistreId);

          this.currentStep = 5;
        },
        error: (error) => {
          console.error('Erreur création sinistre:', error);
        }
      });
    } catch (error) {
      console.error('Erreur:', error);
    }
  }

  private async sendSignedDocuments(sinistreId: number): Promise<void> {
    for (const docId of this.signedDocuments) {
      const doc = this.documents.find(d => d.id === docId);
      if (!doc) continue;

      // Extraire juste le nom du fichier (ex: "Mandat_Gestion_Sinistre.pdf")
      const fileName = doc.fichier.split('/').pop() || doc.nom + '.pdf';

      const documentPayload = {
        type: this.getDocumentType(doc.nom), // "constat", "mandat" etc.
        fichier: fileName, // Juste le nom du fichier
        signatureElectronique: [],
        idsinistre: sinistreId
      };

      console.log('Envoi document:', documentPayload);

      await this.documentService.addDocumentPost(documentPayload).subscribe({
        next: () => console.log(`Document ${fileName} envoyé`),
        error: (err) => console.error(`Erreur document ${fileName}:`, err)
      });
    }
  }

  // Helper pour déterminer le type de document
  private getDocumentType(nomDocument: string): string {
    return nomDocument.includes('Mandat') ? 'mandat' :
      nomDocument.includes('Ordre') ? 'ordre_reparation' :
        nomDocument.includes('Cession') ? 'cession' : 'autre';
  }
  private async saveFilesToAssets(): Promise<{ photosNames: string[] }> {
    const photosNames: string[] = [];

    // Créer le répertoire si inexistant (à adapter selon votre environnement)
    const declarationDir = 'src/assets/declaration/';

    // Sauvegarder le constat
    if (this.constatFile) {
      await this.saveFileToDisk(this.constatFile, declarationDir);
    }

    // Sauvegarder les photos
    for (const file of this.photosFiles) {
      await this.saveFileToDisk(file, declarationDir);
      photosNames.push(file.name);
    }

    return { photosNames };
  }

  private saveFileToDisk(file: File, directory: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const content = event.target?.result;
          // Solution temporaire - à remplacer par une vraie sauvegarde
          console.log(`Simulation: Sauvegarde de ${file.name} dans ${directory}`);
          resolve();
        } catch (err) {
          reject(err);
        }
      };
      reader.readAsArrayBuffer(file);
    });
  }

  // Méthode utilitaire pour la conversion en base64
  private readFileAsBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        // Retourne le DataURL complet (ex: "data:image/png;base64,XXXX")
        resolve(reader.result as string);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
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


}