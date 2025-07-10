import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, ChangeDetectorRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MissionService } from '../../../../../services/mission.service';
import { Dossier, DossiersService } from '../../../../../services/dossiers.service';
import { ReparateurService } from '../../../../../services/reparateur.service';
import { Mission, Reparateur, Assure, MissionUpdate } from '../../../../../services/models-api.interface';
import { DocumentCreationModalComponent } from './document-creation-modal.component';
import { AssureService } from '../../../../../services/assure.service';
import { FirebaseStorageService } from '../../../../../services/firebase-storage.service';
import { firstValueFrom } from 'rxjs';

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

  constructor(
    private missionService: MissionService, 
    private reparateurService: ReparateurService, 
    private assureService: AssureService,
    private dossiersService: DossiersService,
    private firebaseService: FirebaseStorageService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes['edition'] && this.edition && this.mission) {
      this.lancerEdition();
    }
    if (!this.mission && this.sinistre) {
      this.chargerReparateursValides();
    }
    
    // Charger automatiquement les informations de l'assuré si la mission ou le dossier change
    if (changes['mission'] || changes['dossier']) {
      this.chargerInformationsAssure();
      this.chargerVehiculeSinistre();
    }
  }

  ngOnInit(): void {
    this.chargerReparateursValides();
    this.commissionStatutEdit = this.mission?.commissionStatut || '';
    this.commissionStatutOriginal = this.mission?.commissionStatut || '';
    this.chargerInformationsAssure();
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
      statut: 'assigné',
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
        // Tu peux rafraîchir la vue ou émettre un event pour recharger les missions
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
    // Récupérer l'ID du sinistre depuis la mission ou le dossier
    const sinistreId = this.mission?.sinistre?.id || this.dossier?.id;
    
    if (!sinistreId) {
      console.log('Aucun ID de sinistre disponible pour récupérer le véhicule');
      return;
    }

    this.loadingVehicule = true;
    
    // Utiliser le service dossiers pour récupérer le véhicule par ID de sinistre
    this.dossiersService.getVehiculeBySinistreId(sinistreId).subscribe({
      next: (vehicule) => {
        console.log('Véhicule du sinistre récupéré:', vehicule);
        this.vehiculeSinistre = vehicule;
        this.loadingVehicule = false;
        this.cdr.detectChanges(); // Forcer la détection de changements
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
} 