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
  lieuSinistre: string = '';
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
    // Nouveau : Clear les Maps
    this.documentSignatureRequests.clear();
    this.documentSignerIds.clear();
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
        doc.fileBlob = modifiedBlob;  // <-- stocker le Blob modifié ici
      } catch (error) {
        console.error(`Erreur lors de la modification du document ${doc.nom}`, error);
        doc.modifiedBlobUrl = this.getPdfPath(doc.fichier);
        doc.fileBlob = undefined;  // pas modifié donc pas de blob
      }
    }
  }
  private async generatePersonalizedDocument(docId: number): Promise<Blob> {
    const docMeta = this.documents.find(d => d.id === docId);
    if (!docMeta) throw new Error(`Document ${docId} introuvable`);

    // D'abord charger le PDF
    const response = await fetch(docMeta.fichier);
    const pdfBytes = await response.arrayBuffer();
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const pages = pdfDoc.getPages();
    const firstPage = pages[0];
    const lastPage = pages[pages.length - 1];

    // Récupérer les dimensions de la page
    const pageWidth = firstPage.getWidth();
    const pageHeight = firstPage.getHeight();


    // Options de texte
    const textOptions = { size: 10, color: rgb(0, 0, 0) };
    const smallTextOptions = { size: 9, color: rgb(0, 0, 0) };

    const { nom, prenom, adressePostale, telephone, email } = this.userData;
    const vehicule = this.vehiclesAll.find(v => v.marque + '(' + v.immatriculation + ')' === this.selectedVehicle);

    // Remplir selon le type de document - utiliser docMeta.nom ou docMeta.fichier
    if (docMeta.nom?.includes('Cession_Creance') || docMeta.fichier?.includes('Cession_Creance')) {
      this.fillCessionCreanceForm(firstPage, pageWidth, pageHeight, textOptions, smallTextOptions);
    }
    else if (docMeta.nom?.includes('Mandat_Gestion') || docMeta.fichier?.includes('Mandat_Gestion')) {
      this.fillMandatGestionForm(firstPage, pageWidth, pageHeight, textOptions, smallTextOptions);
    }
    else if (docMeta.nom?.includes('Ordre_Reparation') || docMeta.fichier?.includes('Ordre_Reparation')) {
      this.fillOrdreReparationForm(firstPage, pageWidth, pageHeight, textOptions, smallTextOptions);
    }
    else {
      // Fallback : remplissage générique avec les coordonnées fixes que vous aviez
      firstPage.drawText(`${prenom ?? ''}`, { x: 200, y: 680, ...textOptions });
      firstPage.drawText(telephone ?? '', { x: 200, y: 640, ...textOptions });
      firstPage.drawText(email ?? '', { x: 200, y: 620, ...textOptions });

      if (vehicule) {
        firstPage.drawText(vehicule.immatriculation ?? '', { x: 200, y: 600, ...textOptions });
        firstPage.drawText(`${vehicule.marque ?? ''} ${vehicule.modele ?? ''}`, { x: 200, y: 580, ...textOptions });
      }
    }

    // Date/heure unique pour éviter les conflits (seulement si pas déjà ajouté dans les fonctions spécialisées)
    const now = new Date();
    const dateStr = now.toLocaleDateString('fr-FR');
    const timeStr = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

    // Ajouter la signature en bas seulement si c'est un document générique
    if (!docMeta.nom?.includes('Cession_Creance') &&
      !docMeta.nom?.includes('Mandat_Gestion') &&
      !docMeta.nom?.includes('Ordre_Reparation') &&
      !docMeta.fichier?.includes('Cession_Creance') &&
      !docMeta.fichier?.includes('Mandat_Gestion') &&
      !docMeta.fichier?.includes('Ordre_Reparation')) {

      lastPage.drawText(`Fait à Casablanca, le ${dateStr} à ${timeStr}`, {
        x: 150,
        y: 100,
        ...textOptions
      });
    }

    // ID unique invisible (toujours ajouter)
    lastPage.drawText(`ID: ${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, {
      x: 400,
      y: 20,
      size: 6,
      color: rgb(0.8, 0.8, 0.8)
    });

    const modifiedPdfBytes = await pdfDoc.save();
    return new Blob([modifiedPdfBytes], { type: 'application/pdf' });
  }
  private async modifyPdfWithUserData(pdfPath: string, documentName?: string): Promise<Blob> {
    const response = await fetch(pdfPath);
    const pdfBytes = await response.arrayBuffer();
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const pages = pdfDoc.getPages();
    const firstPage = pages[0];

    // Récupérer les dimensions de la page
    const pageWidth = firstPage.getWidth();
    const pageHeight = firstPage.getHeight();


    const { nom, prenom, adressePostale, telephone, email } = this.userData;
    const vehicule = this.vehiclesAll.find(v => v.marque + '(' + v.immatriculation + ')' === this.selectedVehicle);

    // Options de texte standard
    const textOptions = { size: 10, color: rgb(0, 0, 0) };
    const smallTextOptions = { size: 9, color: rgb(0, 0, 0) };

    // Remplir selon le type de document
    if (documentName?.includes('Cession_Creance') || pdfPath.includes('Cession_Creance')) {
      this.fillCessionCreanceForm(firstPage, pageWidth, pageHeight, textOptions, smallTextOptions);
    }
    else if (documentName?.includes('Mandat_Gestion') || pdfPath.includes('Mandat_Gestion')) {
      this.fillMandatGestionForm(firstPage, pageWidth, pageHeight, textOptions, smallTextOptions);
    }
    else if (documentName?.includes('Ordre_Reparation') || pdfPath.includes('Ordre_Reparation')) {
      this.fillOrdreReparationForm(firstPage, pageWidth, pageHeight, textOptions, smallTextOptions);
    }
    else {
      // Remplissage générique si le type n'est pas reconnu
      this.fillGenericForm(firstPage, pageWidth, pageHeight, textOptions);
    }

    const modifiedPdfBytes = await pdfDoc.save();
    return new Blob([modifiedPdfBytes], { type: 'application/pdf' });
  }
  private fillCessionCreanceForm(page: any, pageWidth: number, pageHeight: number, textOptions: any, smallTextOptions: any): void {
    const { nom, prenom, adressePostale, telephone, email } = this.userData;
    const vehicule = this.vehiclesAll.find(v => v.marque + '(' + v.immatriculation + ')' === this.selectedVehicle);

    // Nom & Prénom (ligne 3 environ)
    page.drawText(`${nom ?? ''} ${prenom ?? ''}`, {
      x: pageWidth * 0.28, // Après "Nom & Prénom : "
      y: pageHeight - (pageHeight * 0.12),
      ...textOptions
    });

    // Adresse (ligne 4)
    if (adressePostale) {
      page.drawText(adressePostale, {
        x: pageWidth * 0.18, // Après "Adresse : "
        y: pageHeight - (pageHeight * 0.15),
        ...textOptions
      });
    }

    // Téléphone (ligne 5)
    if (telephone) {
      page.drawText(telephone, {
        x: pageWidth * 0.22, // Après "Téléphone : "
        y: pageHeight - (pageHeight * 0.18),
        ...textOptions
      });
    }

    // E-mail (ligne 6)
    if (email) {
      page.drawText(email, {
        x: pageWidth * 0.18, // Après "E-mail : "
        y: pageHeight - (pageHeight * 0.21),
        ...textOptions
      });
    }

    // Immatriculation du véhicule (ligne 7)

    page.drawText(vehicule?.immatriculation, {
      x: pageWidth * 0.33,

      y: pageHeight - (pageHeight * 0.26),
      ...textOptions
    });


    // Marque / Modèle (ligne 8)
    if (vehicule) {
      page.drawText(vehicule?.marque, {
        x: pageWidth * 0.33,
        y: pageHeight - (pageHeight * 0.29),
        ...textOptions
      });
    }

    // Date et lieu en bas du document
    const city = 'Casablanca';
    const now = new Date();
    const dateStr = now.toLocaleDateString('fr-FR');

    // "Fait à" (avant-dernière ligne)
    /*
    page.drawText(city, {
      x: pageWidth * 0.22, // Après "Fait à : "
      y: pageHeight - (pageHeight * 0.85),
      ...textOptions
    });
      */
    // Date (avant-dernière ligne)
    page.drawText(dateStr.replace(/\//g, ' / '), {
      x: pageWidth * 0.55, // Après "le"
      y: pageHeight - (pageHeight * 0.85),
      ...textOptions
    });
  }

  private fillMandatGestionForm(page: any, pageWidth: number, pageHeight: number, textOptions: any, smallTextOptions: any): void {
    const { nom, prenom, adressePostale, telephone, email } = this.userData;
    const vehicule = this.vehiclesAll.find(v => v.marque + '(' + v.immatriculation + ')' === this.selectedVehicle);

    // Section "Le Mandant"
    page.drawText(`${nom ?? ''} ${prenom ?? ''}`, {
      x: pageWidth * 0.28,
      y: pageHeight - (pageHeight * 0.18),
      ...textOptions
    });

    // Adresse
    if (adressePostale) {
      page.drawText(adressePostale, {
        x: pageWidth * 0.18,
        y: pageHeight - (pageHeight * 0.18),
        ...textOptions
      });
    }

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

    // Immatriculation
    if (vehicule?.immatriculation) {
      page.drawText(vehicule.immatriculation, {
        x: pageWidth * 0.35,
        y: pageHeight - (pageHeight * 0.29),
        ...textOptions
      });
    }

    // Marque/Modèle
    if (vehicule) {
      page.drawText(`${vehicule.marque ?? ''} ${vehicule.modele ?? ''}`, {
        x: pageWidth * 0.22,
        y: pageHeight - (pageHeight * 0.32),
        ...textOptions
      });
    }

    // Date et lieu en bas
    const city = 'Casablanca';
    const now = new Date();
    const dateStr = now.toLocaleDateString('fr-FR');
    /*
        page.drawText(city, {
          x: pageWidth * 0.22,
          y: pageHeight - (pageHeight * 0.99),
          ...textOptions
        });
          */
    page.drawText(dateStr.replace(/\//g, ' / '), {
      x: pageWidth * 0.55,
      y: pageHeight - (pageHeight * 0.99),
      ...textOptions
    });
  }

  private fillOrdreReparationForm(page: any, pageWidth: number, pageHeight: number, textOptions: any, smallTextOptions: any): void {
    const { nom, prenom, adressePostale, telephone, email } = this.userData;
    const vehicule = this.vehiclesAll.find(v => v.marque + '(' + v.immatriculation + ')' === this.selectedVehicle);

    // Section "Client (Donneur d'ordre)"
    // Nom & Prénom
    page.drawText(`${nom ?? ''} ${prenom ?? ''}`, {
      x: pageWidth * 0.28,
      y: pageHeight - (pageHeight * 0.18),
      ...textOptions
    });

    // Adresse
    if (adressePostale) {
      page.drawText(adressePostale, {
        x: pageWidth * 0.18,
        y: pageHeight - (pageHeight * 0.18),
        ...textOptions
      });
    }

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

    // Immatriculation
    if (vehicule?.immatriculation) {
      page.drawText(vehicule.immatriculation, {
        x: pageWidth * 0.35,
        y: pageHeight - (pageHeight * 0.29),
        ...textOptions
      });
    }

    // Marque / Modèle
    if (vehicule) {
      page.drawText(`${vehicule.marque ?? ''} ${vehicule.modele ?? ''}`, {
        x: pageWidth * 0.22,
        y: pageHeight - (pageHeight * 0.32),
        ...textOptions
      });
    }

    // Nom du client dans la section autorisation
    page.drawText(`${prenom ?? ''} ${nom ?? ''}`, {
      x: pageWidth * 0.30, // Après "Je soussigné(e),"
      y: pageHeight - (pageHeight * 0.77),
      ...textOptions
    });

    // Date et lieu en bas
    const city = 'Casablanca';
    const now = new Date();
    const dateStr = now.toLocaleDateString('fr-FR');
    /*
    page.drawText(city, {
      x: pageWidth * 0.22,
      y: pageHeight - (pageHeight * 0.99),
      ...textOptions
    });
    */
    page.drawText(dateStr.replace(/\//g, ' / '), {
      x: pageWidth * 0.55,
      y: pageHeight - (pageHeight * 0.99),
      ...textOptions
    });
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
  private startSignatureProcess(signingUrl: string, signatureRequestId: string, signerId: string): void {
    // Ouvrir la fenêtre
    const signatureWindow = window.open(signingUrl, '_blank', 'width=900,height=700');

    if (!signatureWindow) {
      alert('Impossible d\'ouvrir la fenêtre de signature. Veuillez réessayer.');
      this.isSigning = false;
      return;
    }

    // Variables pour éviter les boucles infinies
    let isProcessComplete = false;
    let checkCount = 0;
    const maxChecks = 150;

    // Fonction de vérification
    const checkStatus = async () => {
      if (isProcessComplete) return;

      checkCount++;

      try {
        // 1. Vérifier si la fenêtre est fermée
        if (signatureWindow.closed) {
          await this.handleWindowClosed(signatureRequestId, signerId);
          return;
        }

        // 2. Vérifier le statut via API (moins fréquent pour éviter le spam)
        if (checkCount % 5 === 0) {
          const status = await firstValueFrom(
            this.yousignService.getSigner(signatureRequestId, signerId)
          );

          if (status.status === 'signed') {
            isProcessComplete = true;
            signatureWindow.close();
            this.handleSignatureSuccess();
            return;
          }
        }

        // 3. Continuer la surveillance si pas encore fini
        if (checkCount < maxChecks && !isProcessComplete) {
          setTimeout(checkStatus, 2000);
        } else if (checkCount >= maxChecks) {
          isProcessComplete = true;
          signatureWindow.close();
          this.handleSignatureTimeout();
        }

      } catch (error) {
        console.error('Erreur lors de la vérification:', error);
        if (checkCount < maxChecks && !isProcessComplete) {
          setTimeout(checkStatus, 3000);
        }
      }
    };

    // Démarrer la surveillance
    setTimeout(checkStatus, 3000);
  }
  private async handleWindowClosed(signatureRequestId: string, signerId: string): Promise<void> {
    try {

      // Attendre un peu avant de vérifier (délai pour la synchronisation)
      await new Promise(resolve => setTimeout(resolve, 2000));

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
    const isSigned = this.signedDocuments.has(this.currentDocument);
    return isSigned;
  }

  getSigningProgress(): number {
    return (this.signedDocuments.size / this.documents.length) * 100;
  }
  // Soumission du sinistre
  async submitSinistre(): Promise<void> {
    try {
      // Vérifier que toutes les signatures sont complétées

      for (const docId of this.signedDocuments) {
        const signatureRequestId = this.documentSignatureRequests.get(docId);
        if (signatureRequestId) {
          const isCompleted = await this.waitForSignatureCompletion(signatureRequestId);
          if (!isCompleted) {
            console.warn(`⚠️ Signature non complétée pour le document ${docId}`);
            // Vous pouvez décider de continuer ou d'arrêter ici
          }
        }
      }

      const savedFiles = await this.saveFilesToAssets();

      const sinistrePayload = {
        type: this.selectedTypeAssurance,
        contactAssistance: this.email,
        lienConstat: this.constatFile ? this.constatFile.name : '',
        conditionsAcceptees: true,
        documents: [],
        lieu: this.lieuSinistre,
        imgUrl: savedFiles.photosUrls,
        idVehicule: this.vehiclesAll.find(v => v.marque + '(' + v.immatriculation + ')' === this.selectedVehicle)?.id || 0,
        statut: 'EN_ATTENTE_EXPERTISE',
        assurence: this.vehiclesAll.find(v => v.marque + '(' + v.immatriculation + ')' === this.selectedVehicle)?.nomAssurence || '',
        input: this.incidentDescription || '',
        etatvehicule: this.vehicleStatus === 'rolling' ? 'ROULANT' : 'NON_ROULANT'
      };

      this.sinistreService.addSinistrePost(sinistrePayload).subscribe({
        next: async (sinistreResponse: any) => {
          const sinistreId = sinistreResponse.id;

          // Envoyer les documents signés
          await this.sendSignedDocuments(sinistreId);

          this.currentStep = 5;
        },
        error: (error) => {
          console.error('❌ Erreur création sinistre:', error);
        }
      });
    } catch (error) {
      console.error('❌ Erreur générale:', error);
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
  private async waitForSignatureCompletion(signatureRequestId: string, maxWaitTime = 300000): Promise<boolean> {
    const startTime = Date.now();

    while (Date.now() - startTime < maxWaitTime) {
      try {
        const status = await firstValueFrom(
          this.yousignService.getSignatureRequestStatus(signatureRequestId)
        );

        const signatureStatus = (status as any).status;
        console.log(`Statut actuel: ${signatureStatus}`);

        if (signatureStatus === 'done') {
          return true;
        } else if (signatureStatus === 'canceled' || signatureStatus === 'expired') {
          return false;
        }

        // Attendre 2 secondes avant de vérifier à nouveau
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        console.error('Erreur lors de la vérification du statut:', error);
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }

    return false; // Timeout
  }

  private getDocumentType(nomDocument: string): string {
    return nomDocument.includes('Mandat') ? 'mandat' :
      nomDocument.includes('Ordre') ? 'ordre' :
        nomDocument.includes('Cession') ? 'cession' : 'autre';
  }
  private async saveFilesToAssets(): Promise<{ photosUrls: string[] }> {
    const storage = getStorage();
    const photosUrls: string[] = [];

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
      const constatURL = await getDownloadURL(constatRef);
      // Tu peux aussi ajouter `constatURL` à un autre tableau si nécessaire
    }

    return { photosUrls };
  }

}








