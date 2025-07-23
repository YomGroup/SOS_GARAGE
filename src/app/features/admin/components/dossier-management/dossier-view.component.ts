import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, ChangeDetectorRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MissionService } from '../../../../../services/mission.service';
import { Dossier, DossiersService } from '../../../../../services/dossiers.service';
import { ReparateurService } from '../../../../../services/reparateur.service';
import { Mission, Reparateur, Assure, MissionUpdate, Expertise } from '../../../../../services/models-api.interface';
import { DocumentCreationModalComponent } from './document-creation-modal.component';
import { AssureService } from '../../../../../services/assure.service';
import { FirebaseStorageService } from '../../../../../services/firebase-storage.service';
import { firstValueFrom } from 'rxjs';
import { ExpertiseService } from '../../../../../services/expertise.service';

// --- Service local pour gérer les infos d'assurance dans le localStorage ---
function getAssuranceContactsFromStorage(): Record<string, { telephone: string, email: string, adresse: string }> {
  return JSON.parse(localStorage.getItem('assuranceContacts') || '{}');
}
function saveAssuranceContactsToStorage(data: Record<string, { telephone: string, email: string, adresse: string }>) {
  localStorage.setItem('assuranceContacts', JSON.stringify(data));
}

@Component({
  selector: 'app-dossier-view',
  templateUrl: './dossier-view.component.html',
  styleUrls: ['./dossier-view.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule, DocumentCreationModalComponent]
})
export class DossierViewComponent implements OnChanges, OnInit {
  @Input() dossier: Dossier | null = null;
  @Input() mission: Mission | null = null;
  @Input() loading: boolean = false;
  @Input() edition: boolean = false;
  @Input() sinistre: any = null;
  @Input() sinistres: any[] = [];
  @Output() closed = new EventEmitter<void>();
  @Output() missionUpdated = new EventEmitter<Mission>();
  @Output() commissionStatusUpdated = new EventEmitter<Mission>();

  editionEnCours: boolean = false;
  missionEdit: any = { documentsAssurance: [] };

  reparateursValides: any[] = [];
  selectedReparateurId: number | null = null;
  attributionEnCours: boolean = false;
  attributionSuccess: boolean = false;
  attributionError: boolean = false;
  attributionMessage: string = '';

  showDocumentModal = false;

  changerReparateurEnCours: boolean = false;

  commissionStatutEdit: string = '';
  savingCommission = false;
  commissionSuccess = false;
  commissionError = false;
  commissionStatutOriginal: string = ''; // Pour suivre la valeur originale

  // Propriétés pour les informations de l'assuré
  assureInfo: Assure | null = null;
  loadingAssure = false;

  // Propriété pour le véhicule du sinistre
  vehiculeSinistre: any = null;
  loadingVehicule = false;

  // Propriétés pour le modal d'images
  showImageModal = false;
  currentImageUrl = '';
  currentImages: string[] = [];
  currentImageIndex = 0;

  uploadingFiles: boolean = false;

  // Propriétés pour l'affichage des sections déroulantes
  showClientInfo: boolean = false;
  showSinistreInfo: boolean = false;
  showVehiculeSinistreInfo: boolean = false;
  showFinancesInfo: boolean = false;
  showDossierDetails: boolean = false;
  showAdditionalInfo: boolean = false;
  showVehiclePhotos: boolean = false;
  showDocuments: boolean = false;
  showGarageDetails: boolean = false;
  showExpertInfo: boolean = false;
  showAttributionSection: boolean = false;
  showChangeReparateurSection: boolean = false;
  showExpertDetails: boolean = false;
  showAssuranceInfo: boolean = false;
  // Ajoute d'autres propriétés similaires pour les autres sections si besoin

  // --- Pour édition des infos d'assurance ---
  assuranceContactEdit: { telephone: string, email: string, adresse: string } = { telephone: '', email: '', adresse: '' };
  assuranceContactOriginal: { telephone: string, email: string, adresse: string } = { telephone: '', email: '', adresse: '' };

  editionExpertEnCours: boolean = false;
  expertiseEdit: Partial<Expertise> = {};

  constructor(
    private missionService: MissionService, 
    private reparateurService: ReparateurService, 
    private assureService: AssureService,
    private dossiersService: DossiersService,
    private firebaseService: FirebaseStorageService,
    private cdr: ChangeDetectorRef,
    private expertiseService: ExpertiseService
  ) {}

  ngOnChanges(changes: SimpleChanges) {
    console.log('ngOnChanges triggered with changes:', changes);
    console.log('Current dossier:', this.dossier);
    console.log('Current mission:', this.mission);
    
    if (changes['edition'] && this.edition && this.mission) {
      this.lancerEdition();
    }
    if (!this.mission && this.sinistre) {
      this.chargerReparateursValides();
    }
    
    // Charger automatiquement les informations de l'assuré si la mission ou le dossier change
    if (changes['mission'] || changes['dossier']) {
      console.log('Mission or dossier changed, loading data...');
      this.chargerInformationsAssure();
      this.chargerVehiculeSinistre();
    }
    
    // Si on a un dossier mais pas de mission, forcer le chargement des données
    if (this.dossier && !this.mission) {
      console.log('Dossier without mission detected, loading data...');
      this.chargerInformationsAssure();
      this.chargerVehiculeSinistre();
    }
  }

  ngOnInit(): void {
    console.log('ngOnInit - Initializing component');
    this.chargerReparateursValides();
    this.commissionStatutEdit = this.mission?.commissionStatut || '';
    this.commissionStatutOriginal = this.mission?.commissionStatut || '';
    this.chargerInformationsAssure();
    this.chargerVehiculeSinistre(); // Ajouter l'appel ici aussi
    // Charger les infos d'assurance si nom dispo
    const nomAssurance = this.getVehiculeInfo(this.dossier).assurance;
    if (nomAssurance && nomAssurance !== 'Assurance non spécifiée') {
      const allContacts = getAssuranceContactsFromStorage();
      if (allContacts[nomAssurance]) {
        this.assuranceContactEdit = { ...allContacts[nomAssurance] };
        this.assuranceContactOriginal = { ...allContacts[nomAssurance] };
      } else {
        this.assuranceContactEdit = { telephone: '', email: '', adresse: '' };
        this.assuranceContactOriginal = { telephone: '', email: '', adresse: '' };
      }
    }
  }

  close() {
    this.editionEnCours = false;
    this.missionEdit = {};
    this.edition = false;
    this.closed.emit();
  }

  lancerEdition() {
    if (this.mission) {
      this.editionEnCours = true;
      this.missionEdit = { ...this.mission };
      if (!this.missionEdit.documentsAssurance) {
        this.missionEdit.documentsAssurance = [];
      }
    } else {
      this.missionEdit = { documentsAssurance: [] };
    }
  }

  annulerEdition() {
    this.editionEnCours = false;
    this.missionEdit = { documentsAssurance: [] };
  }

  enregistrerModification() {
    if (!this.mission) return;
    
    const missionUpdate: MissionUpdate = {};
    
    // Validation et conversion des données
    if (this.missionEdit.devis !== undefined && this.missionEdit.devis !== null) {
      const devis = Number(this.missionEdit.devis);
      if (!isNaN(devis) && devis >= 0) {
        missionUpdate.devis = devis;
      }
    }
    
    if (this.missionEdit.factureFinale !== undefined && this.missionEdit.factureFinale !== null) {
      const facture = Number(this.missionEdit.factureFinale);
      if (!isNaN(facture) && facture >= 0) {
        missionUpdate.factureFinale = facture;
      }
    }
    
    if (this.missionEdit.pretVehicule !== undefined) {
      missionUpdate.pretVehicule = Boolean(this.missionEdit.pretVehicule);
    }
    
    if (this.missionEdit.statut && ['en attente', 'en cours', 'terminée'].includes(this.missionEdit.statut)) {
      missionUpdate.statut = this.missionEdit.statut;
    }

    // Inclure les documents d'assurance (URLs Firebase)
    if (this.missionEdit.documentsAssurance) {
      missionUpdate.documentsAssurance = this.missionEdit.documentsAssurance;
    }

    // Champs financiers ajoutés
    if (this.missionEdit.montantStatue !== undefined && this.missionEdit.montantStatue !== null) {
      const montantStatue = Number(this.missionEdit.montantStatue);
      if (!isNaN(montantStatue) && montantStatue >= 0) {
        missionUpdate.montantStatue = montantStatue;
      }
    }
    if (this.missionEdit.franchiseApplicable !== undefined && this.missionEdit.franchiseApplicable !== null) {
      const franchiseApplicable = Number(this.missionEdit.franchiseApplicable);
      if (!isNaN(franchiseApplicable) && franchiseApplicable >= 0) {
        missionUpdate.franchiseApplicable = franchiseApplicable;
      }
    }
    if (this.missionEdit.commissionPourcentage !== undefined && this.missionEdit.commissionPourcentage !== null) {
      const commissionPourcentage = Number(this.missionEdit.commissionPourcentage);
      if (!isNaN(commissionPourcentage) && commissionPourcentage >= 0) {
        missionUpdate.commissionPourcentage = commissionPourcentage;
      }
    }
    // Calcul et sauvegarde du montant de la commission
    missionUpdate.commissionMontant = this.calculerCommission(
      this.missionEdit.montantStatue,
      this.missionEdit.franchiseApplicable,
      this.missionEdit.commissionPourcentage
    );

    console.log('Données à envoyer:', missionUpdate);

    this.missionService.updateMission(this.mission.id ?? 0, missionUpdate).subscribe({
      next: (updatedMission) => {
        console.log('Mission mise à jour avec succès:', updatedMission);
        this.editionEnCours = false;
        this.missionEdit = { documentsAssurance: [] };
        this.missionUpdated.emit(updatedMission);
      },
      error: (error) => {
        console.error('Erreur lors de la modification:', error);
        alert(`Erreur: ${error.message}`);
      }
    });
  }

  getMissionDate(mission: Mission | null): string {
    if (!mission) return '';
    return new Date(mission.dateCreation).toLocaleDateString('fr-FR');
  }

  isPhotosArrayNonEmpty(mission: Mission | null): boolean {
    if (!mission) return false;
    return Array.isArray(mission.photosVehicule) && mission.photosVehicule.length > 0;
  }
  
  getDossier(dossier: Dossier): Dossier {
    return dossier;
  }
  
  chargerReparateursValides() {
    this.reparateurService.getAllReparateurs().subscribe({
      next: (reps) => {
        console.log('Réparateurs reçus:', reps); // 👈 Inspecte ici
  
        this.reparateursValides = reps.filter(r => {
          console.log('Champ isvalids:', r.isvalids); // 👈 Que contient ce champ ?
          return r.isvalids?.toLowerCase() === 'valide';
        });
      },
      error: (err) => {
        console.error('Erreur API réparateurs:', err);
      }
    });
  }

  ouvrirAttributionMission() {
    this.attributionEnCours = true;
    this.chargerReparateursValides();
  }

  creerMissionPourDossier() {
    if (!this.selectedReparateurId || !this.dossier) return;
    const nouvelleMission = {
      idSinistre: this.dossier.id,
      idReparateur: this.selectedReparateurId,
      statut: 'en cours',
      dateCreation: new Date().toISOString(),
      photosVehicule: [],
      constatAccident: '',
      documentsAssurance: [],
      cessionCreance: '',
      ordreReparation: '',
      devis: 0,
      factureFinale: 0,
      pretVehicule: false,
      avantages: [],
      messages: [],
      reparation: null,
      declareCommeEpave: false,
      epaveValideeParAdmin: false,
      dateDeclarationEpave: ''
    };
    this.missionService.createMission(nouvelleMission as unknown as Mission).subscribe({
      next: (mission) => {
        this.attributionEnCours = false;
        this.selectedReparateurId = null;
        alert('Mission créée avec succès !');
        this.missionUpdated.emit(mission); // Ajout : notifie le parent pour recharger
      },
      error: () => alert('Erreur lors de la création de la mission')
    });
  }

  // Nouvelles méthodes pour la gestion des documents Firebase
  ouvrirUploadDirect() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/pdf';
    input.multiple = true;
    input.onchange = (event: any) => {
      const files = event.target.files;
      if (files && files.length > 0) {
        this.uploaderDocumentsFirebase(Array.from(files));
      }
    };
    input.click();
  }

  uploaderDocumentsFirebase(files: File[]) {
    if (!this.mission || !this.mission.id) {
      alert('Mission non trouvée');
      return;
    }

    this.uploadingFiles = true;
    const uploadPromises: Promise<string>[] = [];

    files.forEach(file => {
      const uploadPromise = firstValueFrom(this.firebaseService.uploadPdfFile(file, this.mission!.id!));
      uploadPromises.push(uploadPromise);
    });

    // Vérifier qu'il y a des promesses à traiter
    if (uploadPromises.length === 0) {
      this.uploadingFiles = false;
      return;
    }

    Promise.all(uploadPromises)
      .then((downloadURLs: string[]) => {
        console.log('Documents uploadés:', downloadURLs);
        
        // Ajouter les URLs aux documents existants
        if (!this.missionEdit.documentsAssurance) {
          this.missionEdit.documentsAssurance = [];
        }
        
        this.missionEdit.documentsAssurance = [
          ...this.missionEdit.documentsAssurance,
          ...downloadURLs
        ];
        
        this.uploadingFiles = false;
        this.cdr.detectChanges();
        console.log('Documents ajoutés avec succès');
      })
      .catch(error => {
        console.error('Erreur lors de l\'upload:', error);
        this.uploadingFiles = false;
        alert(`Erreur lors de l'upload: ${error.message}`);
      });
  }

  supprimerDocument(index: number) {
    if (!this.missionEdit.documentsAssurance) return;
    
    const documentUrl = this.missionEdit.documentsAssurance[index];
    
    // Supprimer de Firebase si c'est une URL Firebase
    if (documentUrl && documentUrl.includes('firebasestorage.googleapis.com')) {
      this.firebaseService.deletePdfFile(documentUrl).subscribe({
        next: () => {
          console.log('Document supprimé de Firebase');
          this.supprimerDocumentLocal(index);
        },
        error: (error) => {
          console.error('Erreur lors de la suppression de Firebase:', error);
          // Supprimer localement même si Firebase échoue
          this.supprimerDocumentLocal(index);
        }
      });
    } else {
      // Supprimer directement si ce n'est pas une URL Firebase
      this.supprimerDocumentLocal(index);
    }
  }

  private supprimerDocumentLocal(index: number) {
    if (!this.missionEdit.documentsAssurance) return;
    this.missionEdit.documentsAssurance = this.missionEdit.documentsAssurance.filter((_: any, i: number) => i !== index);
    this.cdr.detectChanges();
  }

  telechargerDocument(docUrl: string) {
    // Si c'est une URL Firebase, télécharger via le service
    if (docUrl.includes('firebasestorage.googleapis.com')) {
      this.firebaseService.downloadPdfFile(docUrl).subscribe({
        next: (blob: Blob) => {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = this.getFileNameFromUrl(docUrl);
          document.body.appendChild(a);
          a.click();
          setTimeout(() => {
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
          }, 0);
        },
        error: (error) => {
          console.error('Erreur lors du téléchargement:', error);
          alert(`Erreur lors du téléchargement: ${error.message}`);
        }
      });
    } else {
      // Téléchargement direct si ce n'est pas Firebase
      const a = document.createElement('a');
      a.href = docUrl;
      a.download = this.getFileNameFromUrl(docUrl);
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  }

  public getFileNameFromUrl(url: string): string {
    try {
      // Si c'est une URL Firebase, extraire le nom du fichier du chemin
      if (url.includes('firebasestorage.googleapis.com')) {
        // Décoder l'URL et extraire le nom du fichier
        const decodedUrl = decodeURIComponent(url);
        const fileNameMatch = decodedUrl.match(/mission_\d+_\d+_(.+\.pdf)/);
        if (fileNameMatch) {
          return fileNameMatch[1];
        }
      }
      
      // Fallback pour les autres URLs
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      const fileName = pathname.split('/').pop() || 'document.pdf';
      return fileName;
    } catch {
      return 'document.pdf';
    }
  }

  ouvrirModalCreationDocument() {
    this.showDocumentModal = true;
  }

  fermerModalCreationDocument() {
    this.showDocumentModal = false;
  }

  onDocumentCreated(file: File) {
    // Upload the created document to Firebase
    this.uploaderDocumentsFirebase([file]);
  }

  changerReparateur() {
    // 1. Vérifications initiales + conversion explicite en number
    if (!this.mission || this.selectedReparateurId === null) return;
    const selectedId = +this.selectedReparateurId; // Conversion en number
  
    // 2. Trouve le réparateur (avec vérification de type)
    const nouveauReparateur = this.reparateursValides.find(r => r.id === selectedId);
    
    if (!nouveauReparateur) {
      this.attributionError = true;
      this.attributionMessage = 'Réparateur introuvable.';
      return;
    }
    
    // 3. Appel API
    this.missionService.updateMissionReparateur(this.mission.id!, nouveauReparateur).subscribe({
      next: (missionMaj) => {
        this.attributionSuccess = true;
        this.missionUpdated.emit(missionMaj);
        this.mission = missionMaj;
      },
      error: (err) => {
        console.error('Erreur:', err);
        this.attributionError = true;
        this.attributionMessage = 'Échec du changement';
      }
    });
  }

  saveCommissionStatut() {
    // Vérifie qu'on a une mission et que le statut a changé
    if (!this.mission || this.commissionStatutEdit === this.mission.commissionStatut) {
      return;
    }
  
    this.savingCommission = true;
  
    // Appel API simple avec les données minimales
    this.missionService.updateMissionPartial(this.mission.id!, {
      commissionStatut: this.commissionStatutEdit
    }).subscribe({
      next: (missionMaj) => {
        console.log('Avant mise à jour - commissionStatutEdit:', this.commissionStatutEdit);
        console.log('Avant mise à jour - mission.commissionStatut:', this.mission?.commissionStatut);
        
        this.mission = missionMaj;
        // Mettre à jour commissionStatutEdit pour refléter la nouvelle valeur
        this.commissionStatutEdit = missionMaj.commissionStatut || '';
        this.commissionStatutOriginal = missionMaj.commissionStatut || '';
        
        console.log('Après mise à jour - commissionStatutEdit:', this.commissionStatutEdit);
        console.log('Après mise à jour - mission.commissionStatut:', this.mission?.commissionStatut);
        console.log('Après mise à jour - commissionStatutOriginal:', this.commissionStatutOriginal);
        
        this.commissionStatusUpdated.emit(missionMaj);
        this.savingCommission = false;
        
        // Forcer la détection de changements avec un délai
        setTimeout(() => {
          this.cdr.detectChanges();
        }, 0);
      },
      error: (err) => {
        console.error('Erreur:', err);
        this.savingCommission = false;
      }
    });
  }

  // Méthode pour vérifier si le statut de commission a changé
  isCommissionStatutUnchanged(): boolean {
    const currentValue = this.commissionStatutEdit;
    const originalValue = this.commissionStatutOriginal;
    console.log('Vérification statut - current:', currentValue, 'original:', originalValue);
    const isUnchanged = currentValue === originalValue;
    console.log('Bouton désactivé:', isUnchanged);
    return isUnchanged;
  }

  // Méthode pour charger les informations de l'assuré
  chargerInformationsAssure() {
    // Récupérer l'ID du sinistre depuis la mission ou le dossier
    const sinistreId = this.mission?.sinistre?.id || this.dossier?.id;
    
    if (!sinistreId) {
      console.log('Aucun ID de sinistre disponible pour récupérer les informations de l\'assuré');
      return;
    }

    // Utiliser le service dossiers pour récupérer l'assuré par ID de sinistre
    this.dossiersService.getAssureFromSinistreId(sinistreId).subscribe({
      next: (assure) => {
        console.log('Informations de l\'assuré récupérées:', assure);
        this.assureInfo = assure;
        this.cdr.detectChanges(); // Forcer la détection de changements
      },
      error: (error) => {
        console.error('Erreur lors de la récupération des informations de l\'assuré:', error);
        this.assureInfo = null;
      }
    });
  }

  // Méthode pour charger le véhicule du sinistre
  chargerVehiculeSinistre() {
    console.log('chargerVehiculeSinistre called. Current dossier:', this.dossier);
    
    // Utiliser directement les données du véhicule depuis dossier.vehicule
    if (this.dossier?.vehicule) {
      console.log('Utilisation des données du véhicule depuis dossier.vehicule:', this.dossier.vehicule);
      this.vehiculeSinistre = this.dossier.vehicule;
      this.loadingVehicule = false;
      this.cdr.detectChanges();
      return;
    }

    // Si pas de véhicule dans dossier, essayer de le récupérer via l'assuré
    if (this.assureInfo?.vehicules && this.assureInfo.vehicules.length > 0) {
      const vehiculeAssure = this.getVehiculeAssure();
      if (vehiculeAssure) {
        console.log('Utilisation des données du véhicule depuis assureInfo:', vehiculeAssure);
        this.vehiculeSinistre = vehiculeAssure;
        this.loadingVehicule = false;
        this.cdr.detectChanges();
        return;
      }
    }

    // Si on n'a pas de mission, essayer de récupérer le véhicule directement par l'ID du dossier
    if (!this.mission && this.dossier?.id) {
      this.loadingVehicule = true;
      console.log('Appel API pour récupérer le véhicule pour dossierId:', this.dossier.id);
      
      this.dossiersService.getVehiculeBySinistreId(this.dossier.id).subscribe({
        next: (vehicule) => {
          console.log('Véhicule du dossier récupéré via API:', vehicule);
          this.vehiculeSinistre = vehicule;
          this.loadingVehicule = false;
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Erreur lors de la récupération du véhicule du dossier:', error);
          this.vehiculeSinistre = null;
          this.loadingVehicule = false;
        }
      });
      return;
    }

    // En dernier recours, faire un appel API avec l'ID du sinistre de la mission
    const sinistreId = this.mission?.sinistre?.id;
    if (!sinistreId) {
      console.log('Aucun ID de sinistre disponible pour récupérer le véhicule');
      this.loadingVehicule = false;
      return;
    }

    this.loadingVehicule = true;
    console.log('Appel API pour récupérer le véhicule pour sinistreId:', sinistreId);
    
    this.dossiersService.getVehiculeBySinistreId(sinistreId).subscribe({
      next: (vehicule) => {
        console.log('Véhicule du sinistre récupéré via API:', vehicule);
        this.vehiculeSinistre = vehicule;
        this.loadingVehicule = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Erreur lors de la récupération du véhicule du sinistre:', error);
        this.vehiculeSinistre = null;
        this.loadingVehicule = false;
      }
    });
  }

  // Méthode pour obtenir le véhicule lié au sinistre
  getVehiculeAssure(): any {
    if (!this.assureInfo || !this.mission?.sinistre?.id) {
      return null;
    }
    // Utiliser directement les véhicules de l'assuré depuis l'interface Assure
    if (this.assureInfo.vehicules && this.assureInfo.vehicules.length > 0) {
      return this.assureInfo.vehicules.find(vehicule => 
        vehicule.sinistres && vehicule.sinistres.some(s => s.id === this.mission?.sinistre?.id)
      );
    }
    return null;
  }

  // Ajout du getter pour le template
  public get sinistreDuDossier() {
    return this.dossier?.id || this.mission?.sinistre?.id || null;
  }

  // Méthodes pour le modal d'images
  openImageModal(imageUrl: string, allImages: string[], startIndex: number) {
    this.currentImages = allImages;
    this.currentImageIndex = startIndex;
    this.currentImageUrl = imageUrl;
    this.showImageModal = true;
  }

  closeImageModal() {
    this.showImageModal = false;
    this.currentImages = [];
    this.currentImageIndex = 0;
    this.currentImageUrl = '';
  }

  nextImage() {
    if (this.currentImageIndex < this.currentImages.length - 1) {
      this.currentImageIndex++;
      this.currentImageUrl = this.currentImages[this.currentImageIndex];
    }
  }

  previousImage() {
    if (this.currentImageIndex > 0) {
      this.currentImageIndex--;
      this.currentImageUrl = this.currentImages[this.currentImageIndex];
    }
  }

  selectImage(index: number) {
    this.currentImageIndex = index;
    this.currentImageUrl = this.currentImages[index];
  }

  // Méthode pour obtenir les informations de véhicule formatées (copiée du composant parent)
  getVehiculeInfo(dossier: any): any {
    console.log('getVehiculeInfo called with dossier:', dossier);
    console.log('vehiculeSinistre:', this.vehiculeSinistre);
    
    // Si on a un véhicule dans le dossier, l'utiliser en priorité
    if (dossier?.vehicule) {
      console.log('Using dossier.vehicule:', dossier.vehicule);
      return {
        marque: dossier.vehicule.marque || 'Marque non spécifiée',
        modele: dossier.vehicule.modele || 'Modèle non spécifié',
        annee: dossier.vehicule.dateMiseEnCirculation ? 
          dossier.vehicule.dateMiseEnCirculation.substring(0, 4) : 'Année non spécifiée',
        immatriculation: dossier.vehicule.immatriculation || 'Immatriculation non spécifiée',
        assurance: dossier.vehicule.nomAssurence || 'Assurance non spécifiée'
      };
    }
    
    // Si pas de véhicule dans le dossier mais qu'on a un véhiculeSinistre chargé
    if (this.vehiculeSinistre) {
      console.log('Using vehiculeSinistre:', this.vehiculeSinistre);
      return {
        marque: this.vehiculeSinistre.marque || 'Marque non spécifiée',
        modele: this.vehiculeSinistre.modele || 'Modèle non spécifié',
        annee: this.vehiculeSinistre.dateMiseEnCirculation ? 
          this.vehiculeSinistre.dateMiseEnCirculation.substring(0, 4) : 'Année non spécifiée',
        immatriculation: this.vehiculeSinistre.immatriculation || 'Immatriculation non spécifiée',
        assurance: this.vehiculeSinistre.nomAssurence || 'Assurance non spécifiée'
      };
    }
    
    // Si on a un véhicule via l'assuré (quand il y a une mission)
    const vehiculeAssure = this.getVehiculeAssure();
    if (vehiculeAssure) {
      console.log('Using vehiculeAssure:', vehiculeAssure);
      return {
        marque: vehiculeAssure.marque || 'Marque non spécifiée',
        modele: vehiculeAssure.modele || 'Modèle non spécifié',
        annee: vehiculeAssure.dateMiseEnCirculation ? 
          vehiculeAssure.dateMiseEnCirculation.substring(0, 4) : 'Année non spécifiée',
        immatriculation: vehiculeAssure.immatriculation || 'Immatriculation non spécifiée',
        assurance: vehiculeAssure.nomAssurence || 'Assurance non spécifiée'
      };
    }
    
    console.log('Using default values');
    // Valeurs par défaut si aucune source n'est disponible
    return {
      marque: 'Marque non spécifiée',
      modele: 'Modèle non spécifié',
      annee: 'Année non spécifiée',
      immatriculation: 'Immatriculation non spécifiée',
      assurance: 'Assurance non spécifiée'
    };
  }

  public getStatutAvancementLabel(statut: string | undefined): string {
    if (!statut) return 'Non défini';
    switch (statut) {
      case 'EN_ATTENTE_TRAITEMENT':
        return 'En attente de traitement';
      case 'EN_ATTENTE_EXPERTISE':
        return 'En attente d\'expertise';
      case 'EN_ATTENTE_VALIDATION_ASSURANCE':
        return 'En attente validation assurance';
      case 'VEHICULE_EPAVE':
        return 'Véhicule épave';
      case 'EN_COURS_REPARATION':
        return 'En cours de réparation';
      case 'REPARATION_TERMINEE':
        return 'Réparation terminée';
      case 'FACTURE':
        return 'Facturé';
      default:
        return statut;
    }
  }

  public getStatutAvancementClass(statut: string | undefined): string {
    if (!statut) return 'statut-default';
    switch (statut) {
      case 'EN_ATTENTE_TRAITEMENT':
      case 'EN_ATTENTE_EXPERTISE':
      case 'EN_ATTENTE_VALIDATION_ASSURANCE':
        return 'statut-attente';
      case 'VEHICULE_EPAVE':
        return 'statut-epave';
      case 'EN_COURS_REPARATION':
        return 'statut-encours';
      case 'REPARATION_TERMINEE':
        return 'statut-terminee';
      case 'FACTURE':
        return 'statut-default';
      default:
        return 'statut-default';
    }
  }

  get dossierCourant() {
    return this.dossier ?? this.mission;
  }

  get expertiseCourante(): any {
    // On prend la première expertise du tableau si elle existe
    return this.mission?.expertises && this.mission.expertises.length > 0 ? this.mission.expertises[0] : null;
  }

  lancerEditionExpert() {
    // On ne permet d'éditer que la nomination
    const exp = this.expertiseCourante;
    this.expertiseEdit = exp ? {
      id: exp.id,
      nomExpert: exp.nomExpert,
      prenomExpert: exp.prenomExpert,
      institutionExpert: exp.institutionExpert,
      contactExpert: exp.contactExpert, // Ajouté
      mailExpert: exp.mailExpert,       // Ajouté
      dateExpertisePrevue: exp.dateExpertisePrevue
    } : {};
    this.editionExpertEnCours = true;
  }
  annulerExpert() {
    this.editionExpertEnCours = false;
  }
  enregistrerExpert() {
    // PATCH tous les champs nomination + garder les autres valeurs
    if (!this.expertiseEdit) return;
    const exp = this.expertiseCourante;
    const patch = {
      ...exp, // on part de l'existant
      ...this.expertiseEdit // on écrase avec les modifs du formulaire
    };
    if (this.expertiseEdit.id) {
      this.expertiseService.updateExpertise(patch as any).subscribe({
        next: (updatedExpertise) => {
          // Met à jour la mission localement
          if (this.mission && this.mission.expertises && this.mission.expertises.length > 0) {
            this.mission.expertises[0] = updatedExpertise;
          }
          this.editionExpertEnCours = false;
        },
        error: (err) => {
          alert('Erreur lors de la mise à jour de la nomination de l\'expert : ' + err.message);
        }
      });
    } else {
      // Création d'une nouvelle expertise (nomination) - version simplifiée comme avant
      const patch = {
        nomExpert: this.expertiseEdit.nomExpert ?? '',
        prenomExpert: this.expertiseEdit.prenomExpert ?? '',
        institutionExpert: this.expertiseEdit.institutionExpert ?? '',
        contactExpert: this.expertiseEdit.contactExpert ?? '',
        mailExpert: this.expertiseEdit.mailExpert ?? '',
        dateExpertisePrevue: this.expertiseEdit.dateExpertisePrevue ?? '',
        missionId: this.mission?.id // à adapter si le nom diffère
      };
      this.expertiseService.createExpertise(patch as any).subscribe({
        next: (createdExpertise) => {
          if (this.mission) {
            if (!this.mission.expertises) this.mission.expertises = [];
            this.mission.expertises.unshift(createdExpertise);
          }
          this.editionExpertEnCours = false;
        },
        error: (err) => {
          alert('Erreur lors de la création de la nomination de l\'expert : ' + err.message);
        }
      });
    }
  }

  isImageOrPdf(url: string): boolean {
    return /\.(pdf|jpg|jpeg|png)$/i.test(url);
  }

  // Méthode pour sauvegarder les infos d'assurance
  saveAssuranceContact() {
    const nomAssurance = this.getVehiculeInfo(this.dossier).assurance;
    if (!nomAssurance || nomAssurance === 'Assurance non spécifiée') return;
    const allContacts = getAssuranceContactsFromStorage();
    allContacts[nomAssurance] = { ...this.assuranceContactEdit };
    saveAssuranceContactsToStorage(allContacts);
    this.assuranceContactOriginal = { ...this.assuranceContactEdit };
    alert('Informations de contact de l\'assurance enregistrées !');
  }

  // Calcul de la commission
  calculerCommission(montantStatue: number, franchiseApplicable: number, commissionPourcentage: number): number {
    if (
      montantStatue != null &&
      franchiseApplicable != null &&
      commissionPourcentage != null &&
      !isNaN(montantStatue) &&
      !isNaN(franchiseApplicable) &&
      !isNaN(commissionPourcentage)
    ) {
      return (montantStatue - franchiseApplicable) * (commissionPourcentage / 100);
    }
    return 0;
  }
} 