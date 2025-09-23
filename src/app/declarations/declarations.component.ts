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
import { firstValueFrom } from 'rxjs';
import { FirebaseStorageService } from '../../services/firebase-storage.service';
import { getDownloadURL, getStorage, ref, uploadBytes } from 'firebase/storage';
import { YousignService } from '../../services/yousign.service';

import { Router } from '@angular/router'

interface Document {
  id: number;
  nom: string;
  fichier: string;
  modifiedBlobUrl: string | null;
  fileBlob?: Blob;
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
    /*
    {
      id: 2,
      nom: 'Ordre de réparation',
      fichier: 'assets/documents/Ordre_Reparation_SOS_Mon_Garage.pdf',
      modifiedBlobUrl: null
    },*/
    {
      id: 2,
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
  hasAcceptedGarageWarning: boolean = false;
  showGarageWarningStep: boolean = false;

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
  lieuSinistre: string = '';
  nomAssure: string = '';
  adresseAssure: string = '';
  telephoneAssure: string = '';
  prenomAssure: string = '';

  // Ajoutez ces propriétés à votre component
  private documentSignatureRequests: Map<number, string> = new Map();
  private documentSignerIds: Map<number, string> = new Map();


  photoSteps: any = {
    1: [], // Photos d'ensemble
    2: [], // Plaque immatriculation
    3: [], // Numéro de série
    4: []  // Zones endommagées
  };
  typeassurance: string[] = [
    "STATIONNEMENT_IMPACT",
    "VANDALISME",
    "BRIS_DE_GLACE",
    "INCENDIE",
    "VOL_OU_TENTATIVE",
    "EVENEMENT_CLIMATIQUE",
    "DOMMAGE_INCONNU",
    "COLLISION_VEHICULE"
  ];
  selectedTypeAssurance: string = '';

  // Services
  private vehiculeService = inject(VehicleService);
  private authService = inject(AuthService);
  private assureService = inject(AssureService);
  private sinistreService = inject(SinistreService);
  private documentService = inject(DocumentService);
  private firebaseStorageService = inject(FirebaseStorageService);
  private yousignService = inject(YousignService);
  showProfileAlert = false;
  showvehicleAlert = false;
  currentCity: string = 'Casablanca';
  constructor(@Inject(DOCUMENT) private document: Document, private router: Router) {

  }
  ngOnInit(): void {
    this.userid = this.authService.getToken()?.['sub'] ?? null;

    // Récupérer la géolocalisation
    this.getCurrentCity();
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
      this.checkProfileCompleteness();
      this.checkVehiculeCompleteness();
    }
  }
  checkProfileCompleteness(): boolean {
    const isProfileComplete = this.nomAssure !== '' &&
      this.adresseAssure !== '' &&
      this.telephoneAssure !== '' &&
      this.prenomAssure !== '';

    this.showProfileAlert = !isProfileComplete;
    return isProfileComplete;
  }
  checkVehiculeCompleteness(): boolean {
    if (this.vehiclesAll.length === 0) {
      this.showvehicleAlert = true;
    }
    return this.vehiclesAll.length > 0;
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
    // Nouveau : Clear les Maps
    this.documentSignatureRequests.clear();
    this.documentSignerIds.clear();
  }
  goToProfile() {
    // Remplacez par votre logique de navigation
    this.router.navigate(['clientDashboard/profiles']);
  }
  goToVehicle() {
    // Remplacez par votre logique de navigation
    this.router.navigate(['clientDashboard/vehicules']);
  }

  // Méthode pour fermer l'alerte
  closeAlert() {
    this.showProfileAlert = false;
  }
  closeAlertvehicule() {
    this.showvehicleAlert = false;
  }
  private loadUserData(): void {

    this.assureService.addAssurerGet(this.assureId).subscribe({
      next: (data: any) => {
        this.userData = data;
        console.log('Données utilisateur chargées :', this.userData);
        // this.prepareDocumentTemplates();
        this.nomAssure = data.name || '';
        this.adresseAssure = data.adresse || '';
        this.telephoneAssure = data.telephone || '';
        this.prenomAssure = data.prenom || '';

        if (this.selectedVehicle) {
          this.prepareDocumentTemplates();
        }
      },
      error: (err) => {
        console.error('Erreur lors du chargement des données utilisateur', err);
      }
    });

  }
  // 2. Méthode pour récupérer la ville actuelle
  private getCurrentCity(): void {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const latitude = position.coords.latitude;
          const longitude = position.coords.longitude;
          this.getCityFromCoordinates(latitude, longitude);
        },
        (error) => {
          console.warn('Géolocalisation non disponible:', error);
          // Garder la valeur par défaut
        },
        { timeout: 10000, enableHighAccuracy: false }
      );
    }
  }
  // 3. Méthode pour convertir les coordonnées en nom de ville
  private async getCityFromCoordinates(latitude: number, longitude: number): Promise<void> {
    try {
      // Utiliser l'API de géocodage inversé gratuite
      const response = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=fr`
      );
      const data = await response.json();

      if (data.city) {
        this.currentCity = data.city;
      } else if (data.locality) {
        this.currentCity = data.locality;
      }
    } catch (error) {
      console.warn('Erreur lors de la récupération de la ville:', error);
      // Garder la valeur par défaut
    }
  }

  // Add this new method to load assurances
  private loadAssurances(): void {
    this.vehiculeService.listAssuranceVehicules().subscribe({
      next: (data: any) => {
        this.assurances = data;
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
        if (doc.modifiedBlobUrl) {
          URL.revokeObjectURL(doc.modifiedBlobUrl);
        }
        doc.modifiedBlobUrl = URL.createObjectURL(modifiedBlob);
        doc.fileBlob = modifiedBlob;  // <-- stocker le Blob modifié ici
      } catch (error) {
        console.error(`Erreur lors de la modification du document ${doc.nom}`, error);
        doc.modifiedBlobUrl = this.getPdfPath(doc.fichier);
        doc.fileBlob = undefined;  // pas modifié donc pas de blob
      }
    }
  }
  forceRefreshDocuments(): void {
    if (this.userData && this.selectedVehicle) {
      console.log('🔄 Force refresh des documents');
      this.prepareDocumentTemplates();
    }
  }
  private async generatePersonalizedDocument(docId: number): Promise<Blob> {
    const docMeta = this.documents.find(d => d.id === docId);
    if (!docMeta) throw new Error(`Document ${docId} introuvable`);

    const response = await fetch(docMeta.fichier);
    const pdfBytes = await response.arrayBuffer();
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const pages = pdfDoc.getPages();
    console.log('Page index:', pages);

    const textOptions = { size: 10, color: rgb(0, 0, 0) };
    const smallTextOptions = { size: 9, color: rgb(0, 0, 0) };

    // Remplir selon le type de document - AVEC L'INDEX DE PAGE
    if (docMeta.nom?.includes('Cession_Creance') || docMeta.fichier?.includes('Cession_Creance')) {
      pages.forEach((page, pageIndex) => {
        const pageWidth = page.getWidth();
        const pageHeight = page.getHeight();
        console.log('Page index:', pageIndex);

        this.fillCessionCreanceForm(page, pageWidth, pageHeight, textOptions, smallTextOptions, pageIndex);
      });
    }
    else if (docMeta.nom?.includes('Mandat_Gestion') || docMeta.fichier?.includes('Mandat_Gestion')) {
      pages.forEach((page, pageIndex) => {
        const pageWidth = page.getWidth();
        const pageHeight = page.getHeight();
        console.log('Page index:', pageIndex);

        this.fillMandatGestionForm(page, pageWidth, pageHeight, textOptions, smallTextOptions, pageIndex);
      });
    }
    else if (docMeta.nom?.includes('Ordre_Reparation') || docMeta.fichier?.includes('Ordre_Reparation')) {
      pages.forEach((page, pageIndex) => {
        const pageWidth = page.getWidth();
        const pageHeight = page.getHeight();
        console.log('Page index:', pageIndex);

        this.fillOrdreReparationForm(page, pageWidth, pageHeight, textOptions, smallTextOptions, pageIndex);
      });
    }
    else {
      // Fallback générique - seulement première page
      const firstPage = pages[0];
      const pageWidth = firstPage.getWidth();
      const pageHeight = firstPage.getHeight();

      this.fillGenericForm(firstPage, pageWidth, pageHeight, textOptions);
    }

    // ID unique invisible (toujours sur la dernière page)
    const lastPage = pages[pages.length - 1];
    lastPage.drawText(`ID: ${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, {
      x: 400,
      y: 20,
      size: 6,
      color: rgb(0.8, 0.8, 0.8)
    });

    const modifiedPdfBytes = await pdfDoc.save();
    const arrayBuffer = new ArrayBuffer(modifiedPdfBytes.byteLength);
    new Uint8Array(arrayBuffer).set(modifiedPdfBytes);
    return new Blob([arrayBuffer as ArrayBuffer], { type: 'application/pdf' });
  }
  private async modifyPdfWithUserData(pdfPath: string, documentName?: string): Promise<Blob> {
    const response = await fetch(pdfPath);
    const pdfBytes = await response.arrayBuffer();
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const pages = pdfDoc.getPages();
    console.log('Page index:', pages);

    // Options de texte standard
    const textOptions = { size: 10, color: rgb(0, 0, 0) };
    const smallTextOptions = { size: 9, color: rgb(0, 0, 0) };

    // Remplir selon le type de document - AVEC L'INDEX DE PAGE
    if (documentName?.includes('Cession_Creance') || pdfPath.includes('Cession_Creance')) {
      pages.forEach((page, pageIndex) => {
        const pageWidth = page.getWidth();
        const pageHeight = page.getHeight();
        console.log('Page index:', pageIndex);

        this.fillCessionCreanceForm(page, pageWidth, pageHeight, textOptions, smallTextOptions, pageIndex);
      });
    }
    else if (documentName?.includes('Mandat_Gestion') || pdfPath.includes('Mandat_Gestion')) {
      pages.forEach((page, pageIndex) => {
        const pageWidth = page.getWidth();
        const pageHeight = page.getHeight();
        console.log('Page index:', pageIndex);

        this.fillMandatGestionForm(page, pageWidth, pageHeight, textOptions, smallTextOptions, pageIndex);
      });
    }
    else if (documentName?.includes('Ordre_Reparation') || pdfPath.includes('Ordre_Reparation')) {
      pages.forEach((page, pageIndex) => {
        const pageWidth = page.getWidth();
        const pageHeight = page.getHeight();
        console.log('Page index:', pageIndex);

        this.fillOrdreReparationForm(page, pageWidth, pageHeight, textOptions, smallTextOptions, pageIndex);
      });
    }
    else {
      // Remplissage générique si le type n'est pas reconnu
      const firstPage = pages[0];
      this.fillGenericForm(firstPage, firstPage.getWidth(), firstPage.getHeight(), textOptions);
    }

    const modifiedPdfBytes = await pdfDoc.save();
    const arrayBuffer = new ArrayBuffer(modifiedPdfBytes.byteLength);
    new Uint8Array(arrayBuffer).set(modifiedPdfBytes);
    return new Blob([arrayBuffer as ArrayBuffer], { type: 'application/pdf' });
  }
  private fillCessionCreanceForm(page: any, pageWidth: number, pageHeight: number, textOptions: any, smallTextOptions: any, pageIndex: number): void {
    const { nom, prenom, adressePostale, telephone, email } = this.userData;
    const vehicule = this.vehiclesAll.find(v => v.marque + '(' + v.immatriculation + ')' === this.selectedVehicle);
    const now = new Date();
    const dateStr = now.toLocaleDateString('fr-FR');

    // Remplir seulement la première page (page d'index 0)
    if (pageIndex === 0) {
      // Nom & Prénom (ligne 3 environ)
      page.drawText(`${nom ?? ''} ${prenom ?? ''}`, {
        x: pageWidth * 0.30,
        y: pageHeight - (pageHeight * 0.33),
        ...textOptions
      });

      // Adresse (ligne 4)
      if (adressePostale) {
        page.drawText(adressePostale, {
          x: pageWidth * 0.18,
          y: pageHeight - (pageHeight * 0.15),
          ...textOptions
        });
      }
      /*

      // Téléphone (ligne 5)
      if (telephone) {
        page.drawText(telephone, {
          x: pageWidth * 0.22,
          y: pageHeight - (pageHeight * 0.18),
          ...textOptions
        });
      }

      // E-mail (ligne 6)
      if (email) {
        page.drawText(email, {
          x: pageWidth * 0.18,
          y: pageHeight - (pageHeight * 0.21),
          ...textOptions
        });
      }*/

      // Immatriculation du véhicule (ligne 7)
      page.drawText(vehicule?.immatriculation, {
        x: pageWidth * 0.33,
        y: pageHeight - (pageHeight * 0.37),
        ...textOptions
      });
      page.drawText(dateStr.replace(/\//g, ' / '), {
        x: pageWidth * 0.50,
        y: pageHeight - (pageHeight * 0.44),
        ...textOptions
      });

      // Lieu du sinistre
      if (this.lieuSinistre) {
        page.drawText(this.lieuSinistre, {
          x: pageWidth * 0.19,
          y: pageHeight - (pageHeight * 0.46),
          ...textOptions
        });
      }
      // Marque / Modèle (ligne 8)
      if (vehicule) {
        page.drawText(vehicule?.marque, {
          x: pageWidth * 0.33,
          y: pageHeight - (pageHeight * 0.35),
          ...textOptions
        });
        page.drawText(`${vehicule.nomAssurence ?? ''} `, {
          x: pageWidth * 0.25,
          y: pageHeight - (pageHeight * 0.39),
          ...textOptions
        });
      }
    }

    // Date et lieu - dernière page seulement
    if (pageIndex === 1) { // Page 2 (index 1)

      page.drawText(this.currentCity, {
        x: pageWidth * 0.22,
        y: pageHeight - (pageHeight * 0.32),
        ...textOptions
      });

      page.drawText(dateStr.replace(/\//g, ' / '), {
        x: pageWidth * 0.38,
        y: pageHeight - (pageHeight * 0.33),
        ...textOptions
      });
    }
  }
  private fillMandatGestionForm(page: any, pageWidth: number, pageHeight: number, textOptions: any, smallTextOptions: any, pageIndex: number): void {
    const { nom, prenom, adressePostale, adresse, email } = this.userData;
    const vehicule = this.vehiclesAll.find(v => v.marque + '(' + v.immatriculation + ')' === this.selectedVehicle);
    const adress = 'N/A';
    console.log('vehicule:', vehicule);
    console.log('Page index:', pageIndex);
    const now = new Date();

    const dateStr = now.toLocaleDateString('fr-FR');

    // Remplir seulement la première page
    if (pageIndex === 0) {
      // Section "Le Mandant"
      page.drawText(`${nom ?? ''} ${prenom ?? ''}`, {
        x: pageWidth * 0.30,
        y: pageHeight - (pageHeight * 0.41),
        ...textOptions
      });

      // Adresse
      if (adress) {
        page.drawText(adress, {
          x: pageWidth * 0.60,
          y: pageHeight - (pageHeight * 0.41),
          ...textOptions
        });
      }

      // Lieu du sinistre
      if (this.lieuSinistre) {
        page.drawText(this.lieuSinistre, {
          x: pageWidth * 0.60,
          y: pageHeight - (pageHeight * 0.53),
          ...textOptions
        });
      }
      // Immatriculation
      if (vehicule?.immatriculation) {
        page.drawText(vehicule.immatriculation, {
          x: pageWidth * 0.23,
          y: pageHeight - (pageHeight * 0.45),
          ...textOptions
        });
      }
      page.drawText(dateStr.replace(/\//g, ' / '), {
        x: pageWidth * 0.28,
        y: pageHeight - (pageHeight * 0.53),
        ...textOptions
      });
      // Marque/Modèle
      if (vehicule) {
        page.drawText(`${vehicule.marque ?? ''} ${vehicule.modele ?? ''}`, {
          x: pageWidth * 0.32,
          y: pageHeight - (pageHeight * 0.43),
          ...textOptions
        });
        page.drawText(`${vehicule.nomAssurence ?? ''} `, {
          x: pageWidth * 0.63,
          y: pageHeight - (pageHeight * 0.45),
          ...textOptions
        });
      }
    }
    // Date et lieu - page spécifique (ajustez selon votre layout)
    if (pageIndex === 1) { // Page 2 par exemple

      page.drawText(this.currentCity, {
        x: pageWidth * 0.28,
        y: pageHeight - (pageHeight * 0.48),
        ...textOptions
      });

      page.drawText(dateStr.replace(/\//g, ' / '), {
        x: pageWidth * 0.42,
        y: pageHeight - (pageHeight * 0.48),
        ...textOptions
      });
      page.drawText(`${nom ?? ''} ${prenom ?? ''}`, {
        x: pageWidth * 0.42,
        y: pageHeight - (pageHeight * 0.69),
        ...textOptions
      });
    }
  }

  private fillOrdreReparationForm(page: any, pageWidth: number, pageHeight: number, textOptions: any, smallTextOptions: any, pageIndex: number): void {
    const { nom, prenom, adressePostale, telephone, email } = this.userData;
    const vehicule = this.vehiclesAll.find(v => v.marque + '(' + v.immatriculation + ')' === this.selectedVehicle);
    const now = new Date();

    const dateStr = now.toLocaleDateString('fr-FR');
    // Première page - informations client
    if (pageIndex === 0) {
      // Section "Client (Donneur d'ordre)"
      page.drawText(`${nom ?? ''} ${prenom ?? ''}`, {
        x: pageWidth * 0.30,
        y: pageHeight - (pageHeight * 0.37),
        ...textOptions
      });

      // Adresse
      if (adressePostale) {
        page.drawText(adressePostale, {
          x: pageWidth * 0.18,
          y: pageHeight - (pageHeight * 0.18),
          ...textOptions
        });
      }/*

      // Téléphone
      if (telephone) {
        page.drawText(telephone, {
          x: pageWidth * 0.22,
          y: pageHeight - (pageHeight * 0.23),
          ...textOptions
        });
      }

      // E-mail
      if (email) {
        page.drawText(email, {
          x: pageWidth * 0.18,
          y: pageHeight - (pageHeight * 0.26),
          ...textOptions
        });
      }
*/
      // Immatriculation
      if (vehicule?.immatriculation) {
        page.drawText(vehicule.immatriculation, {
          x: pageWidth * 0.30,
          y: pageHeight - (pageHeight * 0.52),
          ...textOptions
        });
      }

      // Marque / Modèle

      if (vehicule) {
        page.drawText(`${vehicule.nomAssurence ?? ''} `, {
          x: pageWidth * 0.62,
          y: pageHeight - (pageHeight * 0.37),
          ...textOptions
        });
        page.drawText(`${vehicule.marque ?? ''} `, {
          x: pageWidth * 0.30,
          y: pageHeight - (pageHeight * 0.48),
          ...textOptions
        });
        page.drawText(`${vehicule.modele ?? ''}`, {
          x: pageWidth * 0.30,
          y: pageHeight - (pageHeight * 0.50),
          ...textOptions
        });
        page.drawText(`${vehicule.kilometrage ?? ''}`, {
          x: pageWidth * 0.30,
          y: pageHeight - (pageHeight * 0.52),
          ...textOptions
        });
      }
    }

    // Deuxième page - section autorisation
    if (pageIndex === 1) {
      page.drawText(this.currentCity, {
        x: pageWidth * 0.28,
        y: pageHeight - (pageHeight * 0.62),
        ...textOptions
      });

      page.drawText(dateStr.replace(/\//g, ' / '), {
        x: pageWidth * 0.42,
        y: pageHeight - (pageHeight * 0.62),
        ...textOptions
      });
      // Nom du client dans la section autorisation
      page.drawText(`${prenom ?? ''} ${nom ?? ''}`, {
        x: pageWidth * 0.30,
        y: pageHeight - (pageHeight * 0.71),
        ...textOptions
      });
    }


  }

  private fillGenericForm(page: any, pageWidth: number, pageHeight: number, textOptions: any): void {
    // Remplissage générique pour les documents non identifiés
    const { nom, prenom, telephone, email } = this.userData;
    const vehicule = this.vehiclesAll.find(v => v.marque === this.selectedVehicle);

    // Informations de base en haut de page
    page.drawText(`${prenom ?? ''} ${nom ?? ''}`, {
      x: pageWidth * 0.25,
      y: pageHeight - 100,
      ...textOptions
    });

    if (telephone) {
      page.drawText(telephone, {
        x: pageWidth * 0.25,
        y: pageHeight - 130,
        ...textOptions
      });
    }

    if (email) {
      page.drawText(email, {
        x: pageWidth * 0.25,
        y: pageHeight - 160,
        ...textOptions
      });
    }

    if (vehicule) {
      page.drawText(`${vehicule.marque ?? ''} ${vehicule.modele ?? ''} - ${vehicule.immatriculation ?? ''}`, {
        x: pageWidth * 0.25,
        y: pageHeight - 190,
        ...textOptions
      });
    }
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
  private async prepareDocumentsWithAllData(): Promise<void> {
    console.log('📋 Vérification des données avant préparation:');
    console.log('- Véhicule:', this.selectedVehicle);
    console.log('- Lieu sinistre:', this.lieuSinistre);
    console.log('- Type assurance:', this.selectedTypeAssurance);
    console.log('- Description:', this.incidentDescription);
    console.log('- Données utilisateur:', !!this.userData);

    if (!this.userData) {
      console.error('❌ Données utilisateur non disponibles');
      return;
    }

    if (!this.selectedVehicle) {
      console.error('❌ Aucun véhicule sélectionné');
      return;
    }

    if (!this.lieuSinistre) {
      console.warn('⚠️ Lieu du sinistre non renseigné');
    }

    // Maintenant préparer les documents avec toutes les informations
    await this.prepareDocumentTemplates();
  }
  // Navigation entre étapes
  nextStep(): void {
    if (this.canProceed()) {

      this.currentStep++;

      if (this.currentStep === 3) {
        console.log('📝 Préparation des documents avec toutes les informations...');
        this.prepareDocumentsWithAllData();
      }
    }
  }
  // Nouvelle méthode pour accepter le warning garage
  acceptGarageWarning(): void {
    this.hasAcceptedGarageWarning = true;
    this.showGarageWarningStep = false;
    this.currentStep = 3;
    console.log('📝 Préparation des documents avec toutes les informations...');
    this.prepareDocumentsWithAllData();
  }

  // Nouvelle méthode pour refuser le warning garage
  declineGarageWarning(): void {
    this.showGarageWarningStep = false;
    // Reste à l'étape actuelle
  }
  previousStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  // Dans votre DeclarationsComponent, modifiez la méthode signDocument() :
  async signDocument(): Promise<void> {
    if (this.isCurrentDocumentSigned || this.isSigning || !this.isChecked) return;
    this.isSigning = true;
    try {
      // 1) Générer le document personnalisé

      const docMeta = this.documents.find(d => d.id === this.currentDocument);
      if (!docMeta) throw new Error('Document introuvable');
      const personalizedBlob = await this.generatePersonalizedDocument(this.currentDocument);

      // 2) Créer signature request
      const sr = await firstValueFrom(
        this.yousignService.createSignatureRequest(
          `${docMeta.nom}_${this.userData?.prenom || 'User'}_${Date.now()}`.replace(/[^a-zA-Z0-9_-]/g, '_'),
          { deliveryMode: 'none' }
        )
      );

      const currentSignatureRequestId = sr.id;
      this.documentSignatureRequests.set(this.currentDocument, currentSignatureRequestId);

      // 3) Upload document
      const uploaded = await firstValueFrom(
        this.yousignService.uploadDocument(
          currentSignatureRequestId,
          personalizedBlob,
          `${docMeta.nom}_${Date.now()}.pdf`
        )
      );

      // 4) Ajouter signataire
      const firstName = this.userData?.prenom?.trim() || '';
      const lastName = this.userData?.name?.trim() || '';
      const email = this.userData?.email?.trim() || this.email?.trim() || '';

      const signerResp = await firstValueFrom(
        this.yousignService.addSignerWithField(
          currentSignatureRequestId,
          { firstName, lastName, email, phone_number: '', locale: 'fr' },
          { documentId: uploaded.id, page: 2, x: 350, y: 100 }
        )
      );

      this.documentSignerIds.set(this.currentDocument, signerResp.id);

      // 5) Activer
      await firstValueFrom(
        this.yousignService.activateSignatureRequest(currentSignatureRequestId)
      );

      // 6) Récupérer le lien et ouvrir la signature
      const signer = await firstValueFrom(
        this.yousignService.getSigner(currentSignatureRequestId, signerResp.id)
      );

      const signingUrl = signer.signature_link || signer.embedded_url;
      if (!signingUrl) throw new Error('Aucun lien de signature trouvé');

      // Stocker le blob pour plus tard
      docMeta.fileBlob = personalizedBlob;

      // 7) Ouvrir la fenêtre et commencer la surveillance
      this.startSignatureProcess(signingUrl, currentSignatureRequestId, signerResp.id);

    } catch (error) {
      alert(`Erreur lors de la signature: ${(error as any)?.message || error}`);
      this.isSigning = false;
    }
  }
  // Dans votre déclarations.component.ts, remplacez la méthode existante
  private startSignatureProcess(signingUrl: string, signatureRequestId: string, signerId: string): void {
    const signatureWindow = window.open(signingUrl, '_blank', 'width=900,height=700');

    if (!signatureWindow) {
      alert('Impossible d\'ouvrir la fenêtre de signature.');
      this.isSigning = false;
      return;
    }

    let isComplete = false;

    const monitor = async () => {
      if (isComplete) return;

      try {
        // Vérifier le statut de signature en priorité
        const signer = await firstValueFrom(
          this.yousignService.getSigner(signatureRequestId, signerId)
        );

        if (signer.status === 'signed') {
          isComplete = true;
          signatureWindow.close(); // Fermeture automatique immédiate
          this.handleSignatureSuccess();
          return;
        }

        // Vérifier si fermé manuellement (annulation)
        if (signatureWindow.closed) {
          isComplete = true;
          this.handleSignatureCancel();
          return;
        }

        // Continuer la surveillance toutes les 2 secondes
        setTimeout(monitor, 2000);

      } catch (error) {
        console.error('Erreur vérification:', error);
        setTimeout(monitor, 3000);
      }
    };

    // Démarrer la surveillance après 1 seconde
    setTimeout(monitor, 1000);

    // Timeout de sécurité (2 minutes maximum)
    setTimeout(() => {
      if (!isComplete) {
        isComplete = true;
        signatureWindow.close();
        this.handleSignatureTimeout();
      }
    }, 120000);
  }
  private async handleWindowClosed(signatureRequestId: string, signerId: string): Promise<void> {
    try {
      // Délai réduit pour la vérification finale
      await new Promise(resolve => setTimeout(resolve, 1000)); // 1 seconde au lieu de 2

      const finalStatus = await firstValueFrom(
        this.yousignService.getSigner(signatureRequestId, signerId)
      );

      if (finalStatus.status === 'signed') {
        this.handleSignatureSuccess();
      } else {
        this.handleSignatureCancel();
      }

    } catch (error) {
      this.handleSignatureCancel();
    }
  }
  private handleSignatureSuccess(): void {

    // Marquer comme signé
    this.signedDocuments.add(this.currentDocument);
    this.isChecked = false;
    this.isSigning = false;

    // Vérifier si c'est terminé
    if (this.signedDocuments.size >= this.documents.length) {
      this.allDocumentsSigned = true;
      setTimeout(() => this.submitSinistre(), 1000);
    } else {
      // Passer au document suivant
      this.moveToNextDocument();
    }
  }

  // Gérer l'annulation
  private handleSignatureCancel(): void {
    this.isSigning = false;
    this.isChecked = false;

    // Optionnel : afficher un message à l'utilisateur
    alert('Signature annulée. Veuillez réessayer.');
  }

  // Gérer le timeout
  private handleSignatureTimeout(): void {
    this.isSigning = false;
    this.isChecked = false;

    alert('Délai de signature dépassé. Veuillez réessayer.');
  }
  private moveToNextDocument(): void {
    const nextDocId = this.findNextUnsignedDocument();

    if (nextDocId !== null) {
      this.currentDocument = nextDocId;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      this.allDocumentsSigned = true;
      setTimeout(() => this.submitSinistre(), 1000);
    }
  }

  // Trouver le prochain document non signé
  private findNextUnsignedDocument(): number | null {
    for (const doc of this.documents) {
      if (!this.signedDocuments.has(doc.id)) {
        return doc.id;
      }
    }
    return null; // Tous signés
  }
  private async openSignatureAndWaitForCompletion(
    signingUrl: string,
    signatureRequestId: string,
    signerId: string
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      // Ouvrir la fenêtre de signature
      const signatureWindow = window.open(signingUrl, '_blank', 'width=800,height=600');

      if (!signatureWindow) {
        reject(new Error('Impossible d\'ouvrir la fenêtre de signature. Vérifiez vos paramètres de popup.'));
        return;
      }

      // Vérifier périodiquement le statut de la signature
      const checkSignatureStatus = async () => {
        try {
          // Vérifier si la fenêtre a été fermée
          if (signatureWindow.closed) {

            // Vérifier le statut final
            const finalStatus = await this.checkFinalSignatureStatus(signatureRequestId, signerId);

            if (finalStatus) {
              // Signature réussie
              this.onSignatureCompleted();
              resolve();
            } else {
              // Signature échouée ou annulée
              reject(new Error('Signature annulée ou échouée'));
            }
            return;
          }

          // Vérifier le statut via API
          const status = await firstValueFrom(
            this.yousignService.getSigner(signatureRequestId, signerId)
          );

          if (status.status === 'signed') {
            signatureWindow.close();
            this.onSignatureCompleted();
            resolve();
          }

        } catch (error) {
          console.error('Erreur lors de la vérification du statut:', error);
        }
      };

      // Vérifier toutes les 2 secondes
      const statusInterval = setInterval(checkSignatureStatus, 2000);

      // Nettoyer l'interval après un timeout
      setTimeout(() => {
        clearInterval(statusInterval);
        if (!signatureWindow.closed) {
          signatureWindow.close();
        }
        reject(new Error('Timeout de signature atteint'));
      }, 300000); // 5 minutes timeout
    });
  }

  // NOUVELLE MÉTHODE : Vérifier le statut final de la signature
  private async checkFinalSignatureStatus(signatureRequestId: string, signerId: string): Promise<boolean> {
    try {
      const status = await firstValueFrom(
        this.yousignService.getSigner(signatureRequestId, signerId)
      );

      return status.status === 'signed';
    } catch (error) {
      console.error('Erreur lors de la vérification du statut final:', error);
      return false;
    }
  }

  // NOUVELLE MÉTHODE : Actions à effectuer quand la signature est complétée
  private onSignatureCompleted(): void {
    // Marquer comme signé
    this.signedDocuments.add(this.currentDocument);
    this.isChecked = false;

    // Vérifier si tous les documents sont signés
    if (this.signedDocuments.size === this.documents.length) {
      this.allDocumentsSigned = true;
      setTimeout(() => this.submitSinistre(), 2000);
    } else {
      // Passer au document suivant
      this.currentDocument++;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  // Ajoutez à vos propriétés
  isAssuranceDropdownOpen = false;

  // Ajoutez ces nouvelles méthodes
  toggleAssuranceDropdown(): void {
    this.isAssuranceDropdownOpen = !this.isAssuranceDropdownOpen;
  }
  private hasRequiredPhotos(): boolean {
    // Vérifier qu'au moins une photo est présente dans chaque étape requise
    return this.photoSteps[1].length > 0 && // Au moins une photo avant
      this.photoSteps[2].length > 0 && // Au moins une photo immatriculation
      this.photoSteps[3].length > 0 && // Au moins une photo côté
      this.photoSteps[4].length > 0;   // Au moins une photo dégâts
  }

  selectAssurance(assurance: any): void {
    this.selectedAssurance = assurance;
    this.isAssuranceDropdownOpen = false;
  }
  // Autres méthodes utilitaires
  canProceed(): boolean {
    switch (this.currentStep) {
      case 1:
        return !!this.selectedVehicle && !!this.vehicleStatus;
      /*case 2:
        return !!this.vehicleStatus;*/
      case 2:
        return !!this.selectedTypeAssurance && !!this.lieuSinistre &&
          (!!this.incidentDescription || !!this.constatFile) && this.hasRequiredPhotos();
      /* case 4:
         return !!this.constatFile;*/
      case 3:
        return this.hasAcceptedGarageWarning &&
          this.nomAssure !== '' &&
          this.adresseAssure !== '' &&
          this.telephoneAssure !== '' &&
          this.prenomAssure !== '';
      default:
        return false;
    }
  }

  selectVehicle(vehicle: string): void {
    this.selectedVehicle = vehicle;
    this.isDropdownOpen = false;
    this.loadAssurances();

    // Check if vehicle is non-rolling and show assurance step
    if (this.vehicleStatus === 'not-rolling') {
      this.showAssuranceStep = true;
      this.loadAssurances();
    } else {
      this.showAssuranceStep = false;
    }
    /*
    if (this.userData) {
      this.prepareDocumentTemplates();
    }*/
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
      //this.nextStep(); // Passer à l'étape suivante du formulaire
      this.resetDeclarationMethod();

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
    const isSigned = this.signedDocuments.has(this.currentDocument);
    return isSigned;
  }

  getSigningProgress(): number {
    return (this.signedDocuments.size / this.documents.length) * 100;
  }
  // Soumission du sinistre
  async submitSinistre(): Promise<void> {
    try {
      // Créer toutes les promesses de vérification en parallèle
      const verificationPromises = Array.from(this.signedDocuments).map(async (docId) => {
        const signatureRequestId = this.documentSignatureRequests.get(docId);
        if (signatureRequestId) {
          const isCompleted = await this.waitForSignatureCompletion(signatureRequestId);
          return { docId, isCompleted, signatureRequestId };
        }
        return { docId, isCompleted: false, signatureRequestId: null };
      });

      // Attendre toutes les vérifications en parallèle avec un timeout global
      const verificationResults = await Promise.allSettled(
        verificationPromises.map(promise =>
          Promise.race([
            promise,
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error('Timeout individuel')), 30000)
            )
          ])
        )
      );

      // Traiter les résultats
      const completedSignatures = verificationResults
        .filter(result => result.status === 'fulfilled')
        .map(result => (result as any).value)
        .filter(result => result.isCompleted);

      console.log(`${completedSignatures.length}/${this.signedDocuments.size} signatures vérifiées`);

      // Continuer même si toutes ne sont pas vérifiées (mais logger l'info)
      if (completedSignatures.length < this.signedDocuments.size) {
        console.warn('Certaines signatures n\'ont pas pu être vérifiées dans les délais');
      }

      // Sauvegarder les fichiers en parallèle avec la création du sinistre
      const [savedFiles, _] = await Promise.all([
        this.saveFilesToAssets(),
        new Promise(resolve => setTimeout(resolve, 0)) // Placeholder pour d'autres opérations async
      ]);

      const imageAvant = savedFiles.photosUrls[0] || null;
      const imageArriere = savedFiles.photosUrls[1] || null;
      const imageDroite = savedFiles.photosUrls.slice(2);
      const sinistrePayload = {
        type: this.selectedTypeAssurance,
        contactAssistance: this.email,
        lienConstat: savedFiles.constatUrl || '',
        conditionsAcceptees: true,
        documents: [],
        lieu: this.lieuSinistre,
        idVehicule: parseInt(this.vehiclesAll.find(v => v.marque + '(' + v.immatriculation + ')' === this.selectedVehicle)?.id || 0),
        statut: 'EN_ATTENTE_TRAITEMENT',
        assurence: this.vehiclesAll.find(v => v.marque + '(' + v.immatriculation + ')' === this.selectedVehicle)?.nomAssurence || '',
        input: this.incidentDescription || '',
        etatvehicule: this.vehicleStatus === 'rolling' ? 'ROULANT' : 'NON_ROULANT',
        imgUrl: savedFiles.photosUrls,

      };
      console.log('🚀 Soumission du sinistre avec payload réadapté:', sinistrePayload);


      this.sinistreService.addSinistrePost(sinistrePayload).subscribe({
        next: (sinistreResponse: any) => {
          console.log("✅ Sinistre créé :", sinistreResponse);

          const sinistreId = sinistreResponse.id;
          this.sendSignedDocumentsAsync(sinistreId);
          this.currentStep = 4;
        },
        error: (error) => {
          console.error("❌ Erreur création sinistre:", error);

          let msg: string;

          if (typeof error.error === 'string') {
            // Ici c'est du texte brut venant du serveur
            msg = error.error;
          } else if (error.error?.message) {
            // Cas où le backend renvoie du JSON
            msg = error.error.message;
          } else {
            msg = "Erreur lors de la création du sinistre.";
          }

          console.warn("ℹ️ Message utilisateur :", msg);
          alert(msg);
        }
      });

    } catch (error) {
      console.error('❌ Erreur générale:', error);
    }
  }
  // 5. Version asynchrone non-bloquante pour l'envoi des documents
  private async sendSignedDocumentsAsync(sinistreId: number): Promise<void> {
    // Traiter les documents en parallèle avec un maximum de 3 simultanés
    const documentPromises = Array.from(this.signedDocuments).map(docId =>
      this.processSignedDocument(docId, sinistreId)
    );

    // Traiter par batches de 3
    for (let i = 0; i < documentPromises.length; i += 3) {
      const batch = documentPromises.slice(i, i + 3);
      await Promise.allSettled(batch);
    }
  }
  private async processSignedDocument(docId: number, sinistreId: number): Promise<void> {
    const doc = this.documents.find(d => d.id === docId);
    if (!doc) return;

    const signatureRequestId = this.documentSignatureRequests.get(docId);
    if (!signatureRequestId) {
      console.error(`Aucune signature request trouvée pour ${doc.nom}`);
      return;
    }

    try {
      // Récupération des infos en parallèle
      const [statusResponse, documentsResponse] = await Promise.all([
        firstValueFrom(this.yousignService.getSignatureRequestStatus(signatureRequestId)),
        firstValueFrom(this.yousignService.getSignatureRequest(signatureRequestId))
      ]);

      const documentId = (documentsResponse as any).documents?.[0]?.id;
      if (!documentId) {
        throw new Error(`Aucun document ID trouvé pour ${doc.nom}`);
      }

      // Téléchargement et upload en parallèle
      const signedDocumentBlob = await firstValueFrom(
        this.yousignService.downloadSignedDocument(signatureRequestId, documentId)
      );

      const downloadURL = await this.firebaseStorageService.uploadPdfFile(
        signedDocumentBlob,
        sinistreId
      ).toPromise();

      const documentPayload = {
        type: this.getDocumentType(doc.nom),
        fichier: downloadURL,
        signatureElectronique: [],
        idsinistre: sinistreId
      };

      await this.documentService.addDocumentPost(documentPayload).toPromise();
      console.log(`✅ Document ${doc.nom} traité avec succès`);

    } catch (error) {
      console.error(`❌ Erreur pour ${doc.nom}:`, error);

      // Fallback rapide
      if (doc.fileBlob) {
        try {
          const fallbackURL = await this.firebaseStorageService.uploadPdfFile(
            doc.fileBlob,
            sinistreId
          ).toPromise();

          await this.documentService.addDocumentPost({
            type: this.getDocumentType(doc.nom),
            fichier: fallbackURL,
            signatureElectronique: [],
            idsinistre: sinistreId
          }).toPromise();

          console.log(`✅ Fallback réussi pour ${doc.nom}`);
        } catch (fallbackError) {
          console.error(`❌ Fallback échoué pour ${doc.nom}:`, fallbackError);
        }
      }
    }
  }
  private async sendSignedDocuments(sinistreId: number): Promise<void> {
    for (const docId of this.signedDocuments) {
      const doc = this.documents.find(d => d.id === docId);
      if (!doc) continue;

      // Récupérer les IDs stockés
      const signatureRequestId = this.documentSignatureRequests.get(docId);
      if (!signatureRequestId) {
        console.error(`Aucune signature request trouvée pour le document ${doc.nom}`);
        continue;
      }

      try {
        // 1. Vérifier d'abord le statut de la signature (optionnel)
        const statusResponse = await firstValueFrom(
          this.yousignService.getSignatureRequestStatus(signatureRequestId)
        );


        // 2. Récupérer la liste des documents de cette signature request
        const documentsResponse = await firstValueFrom(
          this.yousignService.getSignatureRequest(signatureRequestId)
        );

        // Trouver le document ID (normalement il n'y en a qu'un par request)
        const documentId = (documentsResponse as any).documents?.[0]?.id;

        if (!documentId) {
          console.error(`Aucun document ID trouvé pour ${doc.nom}`);
          continue;
        }

        // 3. Télécharger le document SIGNÉ
        const signedDocumentBlob = await firstValueFrom(
          this.yousignService.downloadSignedDocument(signatureRequestId, documentId)
        );

        // 4. Upload du document SIGNÉ vers Firebase
        const downloadURL = await this.firebaseStorageService.uploadPdfFile(
          signedDocumentBlob, // Utiliser le document signé au lieu de doc.fileBlob
          sinistreId
        ).toPromise();


        // 5. Enregistrer en base
        const documentPayload = {
          type: this.getDocumentType(doc.nom),
          fichier: downloadURL,
          signatureElectronique: [], // Vous pouvez ajouter des métadonnées de signature ici
          idsinistre: sinistreId
        };

        await this.documentService.addDocumentPost(documentPayload).toPromise();

      } catch (error) {
        console.error(` Erreur lors du traitement du document signé ${doc.nom}:`, error);

        // Fallback : utiliser le document personnalisé si le téléchargement échoue
        if (doc.fileBlob) {
          console.log(`Utilisation du document personnalisé comme fallback pour ${doc.nom}`);
          try {
            const fallbackURL = await this.firebaseStorageService.uploadPdfFile(
              doc.fileBlob,
              sinistreId
            ).toPromise();

            const fallbackPayload = {
              type: this.getDocumentType(doc.nom),
              fichier: fallbackURL,
              signatureElectronique: [],
              idsinistre: sinistreId
            };

            await this.documentService.addDocumentPost(fallbackPayload).toPromise();
          } catch (fallbackError) {
            console.error(` Échec du fallback pour ${doc.nom}:`, fallbackError);
          }
        }
      }
    }
  }
  private async waitForSignatureCompletion(signatureRequestId: string, maxWaitTime = 60000): Promise<boolean> {
    const startTime = Date.now();
    let attempts = 0;
    const maxAttempts = 20; // Maximum 20 tentatives

    while (Date.now() - startTime < maxWaitTime && attempts < maxAttempts) {
      try {
        attempts++;
        const status = await firstValueFrom(
          this.yousignService.getSignatureRequestStatus(signatureRequestId)
        );

        const signatureStatus = (status as any).status;
        console.log(`Tentative ${attempts}: Statut ${signatureStatus}`);

        if (signatureStatus === 'done') {
          return true;
        } else if (signatureStatus === 'canceled' || signatureStatus === 'expired') {
          return false;
        }

        // Délai progressif : commence à 1s, augmente graduellement
        const delay = Math.min(1000 + (attempts * 500), 5000);
        await new Promise(resolve => setTimeout(resolve, delay));
      } catch (error) {
        console.error(`Erreur tentative ${attempts}:`, error);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    return false; // Timeout ou max tentatives atteint
  }

  private getDocumentType(nomDocument: string): string {
    return nomDocument.includes('Mandat') ? 'mandat' :
      nomDocument.includes('Ordre') ? 'ordre' :
        nomDocument.includes('Cession') ? 'cession' : 'autre';
  }
  private async saveFilesToAssets(): Promise<{ photosUrls: string[], constatUrl: string | null }> {
    const storage = getStorage();
    const photosUrls: string[] = [];
    let constatUrl: string | null = null;

    const baseDir = 'declaration/photos';

    const photoStepDirs: { [key: number]: string } = {
      1: 'avant',
      2: 'plaque',
      3: 'cote',
      4: 'degats'
    };

    for (const step in this.photoSteps) {
      const photos = this.photoSteps[step];
      const dirName = photoStepDirs[+step];

      for (const photo of photos) {
        const file = photo.file;
        const firebasePath = `${baseDir}/${dirName}/${file.name}`;
        const fileRef = ref(storage, firebasePath);

        // Upload du fichier
        await uploadBytes(fileRef, file);

        // Obtenir l'URL publique
        const downloadURL = await getDownloadURL(fileRef);
        photosUrls.push(downloadURL);
      }
    }

    // Upload du constat s’il existe (avec URL, si tu veux aussi l’utiliser)
    if (this.constatFile) {
      const constatPath = `${baseDir}/constats/${this.constatFile.name}`;
      const constatRef = ref(storage, constatPath);
      await uploadBytes(constatRef, this.constatFile);
      const downloadURL = await getDownloadURL(constatRef);
      constatUrl = downloadURL;
    }

    return { photosUrls, constatUrl };
  }

}








