import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, ChangeDetectorRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MissionService } from '../../../../../services/mission.service';
import { Dossier, DossiersService } from '../../../../../services/dossiers.service';
import { ReparateurService } from '../../../../../services/reparateur.service';
import { Mission, Reparateur, Assure } from '../../../../../services/models-api.interface';
import { DocumentCreationModalComponent } from './document-creation-modal.component';
import { AssureService } from '../../../../../services/assure.service';

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

  // Propriétés pour le modal d'images
  showImageModal = false;
  currentImageUrl = '';
  currentImages: string[] = [];
  currentImageIndex = 0;

  constructor(
    private missionService: MissionService, 
    private reparateurService: ReparateurService, 
    private assureService: AssureService,
    private dossiersService: DossiersService,
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
    this.missionEdit = {};
  }

  enregistrerModification() {
    if (!this.mission) return;
    this.missionService.updateMission(this.mission.id ?? 0, this.missionEdit).subscribe({
      next: (updatedMission) => {
        this.editionEnCours = false;
        this.missionEdit = {};
        this.missionUpdated.emit(updatedMission);
      },
      error: () => alert('Erreur lors de la modification du dossier')
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



  ouvrirUploadDirect() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/pdf';
    input.onchange = (event: any) => {
      const file = event.target.files[0];
      if (file) {
        this.ajouterDocumentLocal(file);
      }
    };
    input.click();
  }

  ajouterDocumentLocal(file: File) {
    if (!this.missionEdit.documentsAssurance) {
      this.missionEdit.documentsAssurance = [];
    }
    this.missionEdit.documentsAssurance = [
      ...this.missionEdit.documentsAssurance,
      file
    ];
    this.cdr.detectChanges();
  }

  supprimerDocument(index: number) {
    if (!this.missionEdit.documentsAssurance) return;
    this.missionEdit.documentsAssurance = this.missionEdit.documentsAssurance.filter((_: any, i: number) => i !== index);
    this.cdr.detectChanges();
  }

  ouvrirModalCreationDocument() {
    this.showDocumentModal = true;
  }

  fermerModalCreationDocument() {
    this.showDocumentModal = false;
  }

  onDocumentCreated(file: File) {
    this.ajouterDocumentLocal(file);
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

  telechargerDocument(doc: File) {
    const url = window.URL.createObjectURL(doc);
    const a = document.createElement('a');
    a.href = url;
    a.download = doc.name || 'document.pdf';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    }, 0);
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