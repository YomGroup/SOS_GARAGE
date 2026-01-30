import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MissionService } from '../../../../../services/mission.service';
import { Mission, MissionUpdate, Assure, Vehicule, StatutAvancementSinistre, Expert, Expertise } from '../../../../../services/models-api.interface';
import { MinioStorageService } from '../../../../../services/minio-storage.service';
import { DossiersService } from '../../../../../services/dossiers.service';
import { ExpertService } from '../../../../../services/expert.service';
import { ExpertiseService } from '../../../../../services/expertise.service';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../../environments/environment';

function getAssuranceContactsFromStorage(): Record<string, { telephone: string, email: string, adresse: string }> {
  return JSON.parse(localStorage.getItem('assuranceContacts') || '{}');
}

@Component({
  selector: 'app-mission-view',
  templateUrl: './mission-view.component.html',
  styleUrls: ['./mission-view.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class MissionViewComponent implements OnChanges {
  // Permet de filtrer les documents de type 'devis' dans le template
  isDevisDocument(doc: any): boolean {
    return doc && typeof doc === 'object' && doc.type === 'devis';
  }

  // Permet de filtrer les documents de type 'facture' dans le template
  isFactureDocument(doc: any): boolean {
    return doc && typeof doc === 'object' && doc.type === 'facture';
  }
  @Input() mission: Mission | null = null;
  @Input() dossier: any = null; // Ajout pour les dossiers non-traités
  @Input() loading: boolean = false;
  @Input() edition: boolean = false;
  @Output() closed = new EventEmitter<void>();
  @Output() missionUpdated = new EventEmitter<Mission>();

  editionEnCours: boolean = false;
  missionEdit: any = { documentsAssurance: [] };
  expertEdit: any = {};
  expertiseEdit: any = {};
  uploadingFiles: boolean = false;
  assureInfo: Assure | null = null;
  vehiculeInfo: Vehicule | null = null;
  showExpertInfo: boolean = false;
  showExpertiseInfo: boolean = false;
  showClientInfo: boolean = false;
  showVehicleInfo: boolean = false;
  showSinistreInfo: boolean = false;
  showAdditionalInfo: boolean = false;
  showPhotosInfo: boolean = false;
  showDocumentsInfo: boolean = false;
  showAssuranceInfo: boolean = false;
  showMissionDetails: boolean = false;
  showStatutAvancement: boolean = false;
  showVehiclePhotos: boolean = false;
  vehiculesMap: Map<number, Vehicule> = new Map();
  statutAvancementEdit: string | null = null;
  rapportsGarage: string[] = [];
  uploadErrorMessage: string = '';
  
  lienExpertise:string='';
  lienFacture:string='';
  // Exposer l'enum pour le template
  StatutAvancementSinistre = StatutAvancementSinistre;

  // Variables d'état pour la saisie du délai
  saisieDelaiTravaux: boolean = false;
  delaiEstimeInput: number = 1;

  // --- AJOUT : Liste simulée d'assurances ---
  assurances = [
    {
      id: 1,
      nom: 'AXA',
      telephone: '01 23 45 67 89',
      email: 'contact@axa.fr',
      adresse: '10 rue de Paris, 75000 Paris'
    },
    {
      id: 2,
      nom: 'MAIF',
      telephone: '01 98 76 54 32',
      email: 'service@maif.fr',
      adresse: '20 avenue de Lyon, 69000 Lyon'
    },
    {
      id: 3,
      nom: 'Allianz',
      telephone: '01 11 22 33 44',
      email: 'info@allianz.fr',
      adresse: '5 boulevard de Nice, 06000 Nice'
    }
  ];
  assuranceSelectionnee: any = null;

  // --- Infos d'assurance récupérées via l'API (comme côté admin) ---
  assuranceContactInfo: { nom?: string, telephone: string, email: string, adresse: string } = { nom: '', telephone: '', email: '', adresse: '' };
  isAssuranceExistante: boolean = false;

  currentImages: string[] = [];
  currentImageIndex: number = 0;
  currentImageUrl: string = '';
  showImageModal: boolean = false;
  // Date de fin des travaux (local si le backend ne la renvoie pas)
  dateFinTravauxLocal: string | null = null;

  constructor(
    private missionService: MissionService, 
    private cdr: ChangeDetectorRef,
    private minioService: MinioStorageService,
    private dossiersService: DossiersService,
    private expertService: ExpertService,
    private expertiseService: ExpertiseService
  ) {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes['edition'] && this.edition && this.mission) {
      this.lancerEdition();
    }
    // Charger infos client/véhicule si mission ou dossier change
    if (changes['mission'] || changes['dossier']) {
      this.chargerInformationsAssureEtVehicule();
      this.chargerVehiculeParMission();
    }
  }

  ngOnInit(): void {
    console.log('Mission côté garage :', this.mission);
    console.log('Expertises côté garage :', this.mission?.expertises);
    this.chargerInformationsAssureEtVehicule();
    this.chargerVehiculeParMission();
  }

  // Nouvelle méthode : charge les infos d'assurance depuis l'API par nom
  loadAssuranceContactInfo() {
    const nomAssur = this.getVehiculeForMission(this.mission!)?.nomAssurence || '';
    if (!nomAssur) {
      this.assuranceContactInfo = { nom: '', telephone: '', email: '', adresse: '' };
      this.isAssuranceExistante = false;
      return;
    }
    // Appel API pour récupérer l'assurance par nom
    fetch(`${environment.apiUrl}/assurances/${encodeURIComponent(nomAssur)}`)
      .then(r => r.ok ? r.json() : null)
      .then(assurance => {
        console.log('Données assurance récupérées :', assurance);
        if (assurance && assurance.nomAssurence) {
          this.assuranceContactInfo = {
            nom: assurance.nomAssurence,
            telephone: assurance.telephone || '',
            email: assurance.email || '',
            adresse: assurance.adresse || ''
          };
          this.isAssuranceExistante = true;
        } else {
          this.assuranceContactInfo = { nom: nomAssur, telephone: '', email: '', adresse: '' };
          this.isAssuranceExistante = false;
        }
      })
      .catch(() => {
        this.assuranceContactInfo = { nom: nomAssur, telephone: '', email: '', adresse: '' };
        this.isAssuranceExistante = false;
      });
  }

  // Ajout : méthode pour charger infos client et véhicule
  chargerInformationsAssureEtVehicule() {
    // Récupérer l'ID du sinistre depuis la mission ou le dossier
    const sinistreId = this.mission?.sinistre?.id || this.dossier?.id;
    
    if (!sinistreId) {
      console.log('Aucun ID de sinistre disponible pour récupérer les informations');
      this.assureInfo = null;
      this.vehiculeInfo = null;
      return;
    }
    
    // Récupérer l'assuré
    this.missionService.getAssureBySinistreId(sinistreId).subscribe({
      next: (assure) => {
        this.assureInfo = assure;
        this.cdr.detectChanges();
      },
      error: () => {
        this.assureInfo = null;
      }
    });
    
    // Récupérer le véhicule
    this.missionService.getVehiculeBySinistreId(sinistreId).subscribe({
      next: (vehicule) => {
        this.vehiculeInfo = vehicule;
        this.cdr.detectChanges();
      },
      error: () => {
        this.vehiculeInfo = null;
      }
    });
  }

  // Méthode pour charger le véhicule par ID de mission
  chargerVehiculeParMission() {
    if (this.mission?.id) {
      this.missionService.getVehiculeByMissionId(this.mission.id).subscribe({
        next: (vehicule) => {
          this.vehiculesMap.set(this.mission!.id!, vehicule);
          this.cdr.detectChanges();
          // Charger les infos d'assurance après avoir le véhicule
          this.loadAssuranceContactInfo();
        },
        error: () => {
          this.vehiculesMap.set(this.mission!.id!, null as any);
          this.cdr.detectChanges();
          // Même en cas d'erreur, tenter de charger (affichera vide)
          this.loadAssuranceContactInfo();
        }
      });
    } else {
      // Si pas d'ID mission, reset infos d'assurance
      this.assuranceContactInfo = { nom: '', telephone: '', email: '', adresse: '' };
      this.isAssuranceExistante = false;
    }
  }

  close() {
  this.editionEnCours = false;
  this.missionEdit = {};
  this.edition = false;
  
  // Émettre un événement avec la mission mise à jour avant de fermer
  if (this.mission) {
    this.missionUpdated.emit(this.mission);
  }
  
  this.closed.emit();
}

  lancerEdition() {
    // Empêcher l'édition si la mission est terminée
    if (this.mission && (this.mission.statut === 'terminée' || this.mission.statut === 'TERMINEE')) {
      alert('Impossible de modifier une mission terminée.');
      return;
    }
    
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

  // Calcul de la commission basé sur factureFinale
  calculerCommission(factureFinale: number, franchiseApplicable: number, commissionPourcentage: number): number {
    if (
      factureFinale != null &&
      franchiseApplicable != null &&
      commissionPourcentage != null &&
      !isNaN(factureFinale) &&
      !isNaN(franchiseApplicable) &&
      !isNaN(commissionPourcentage)
    ) {
      return (factureFinale - franchiseApplicable) * (commissionPourcentage / 100);
    }
    return 0;
  }

  enregistrerModification() {
  if (!this.mission) return;
  
  // Activer l'état de chargement
  this.uploadingFiles = true;
  this.uploadErrorMessage = '';
  
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

  // Inclure les documents d'assurance (convertir en URLs si objets)
  if (this.missionEdit.documentsAssurance) {
    missionUpdate.documentsAssurance = this.missionEdit.documentsAssurance.map((doc: any) =>
      (doc && typeof doc === 'object' && doc.url) ? doc.url : doc
    );
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

  missionUpdate.lienExpertise = this.lienExpertise;
  missionUpdate.lienFacture = this.lienFacture;

  // Calcul et sauvegarde du montant de la commission
  missionUpdate.commissionMontant = this.calculerCommission(
    this.missionEdit.factureFinale,
    this.missionEdit.franchiseApplicable,
    this.missionEdit.commissionPourcentage
  );

  console.log('Données à envoyer:', missionUpdate);

  this.missionService.updateMission(this.mission.id ?? 0, missionUpdate).subscribe({
    next: (updatedMission) => {
      console.log('Mission mise à jour avec succès:', updatedMission);
      
      // Désactiver le chargement
      this.uploadingFiles = false;
      this.editionEnCours = false;
      this.missionEdit = { documentsAssurance: [] };
      
      // Émettre la mission mise à jour
      this.missionUpdated.emit(updatedMission);
      
      // Forcer la détection de changements
      this.cdr.detectChanges();
      
      // Message de succès optionnel
      alert('Données financières mises à jour avec succès !');
    },
    error: (error) => {
      console.error('Erreur lors de la modification:', error);
      
      // Désactiver le chargement
      this.uploadingFiles = false;
      
      // Afficher l'erreur
      this.uploadErrorMessage = `Erreur: ${error.message}`;
      
      // Forcer la détection de changements
      this.cdr.detectChanges();
      
      alert(`Erreur: ${error.message}`);
    }
  });
}

  // Nouvelles méthodes pour les uploads spécifiques
  uploadDevis() {
    if (!this.missionEdit.devis || isNaN(Number(this.missionEdit.devis)) || Number(this.missionEdit.devis) <= 0) {
      this.uploadErrorMessage = 'Veuillez saisir le montant du devis avant de téléverser le document.';
      setTimeout(() => { this.uploadErrorMessage = ''; }, 4000);
      return;
    }
    this.uploadErrorMessage = '';
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/pdf,image/*';
    input.multiple = false;
    input.onchange = (event: any) => {
      const files = event.target.files;
      if (files && files.length > 0) {
        this.uploaderDocumentsFirebase(Array.from(files), 'devis');
      }
    };
    input.click();
  }

  uploadFacture() {
    if (!this.missionEdit.factureFinale || isNaN(Number(this.missionEdit.factureFinale)) || Number(this.missionEdit.factureFinale) <= 0) {
      this.uploadErrorMessage = 'Veuillez saisir le montant de la facture avant de téléverser le document.';
      setTimeout(() => { this.uploadErrorMessage = ''; }, 4000);
      return;
    }
    this.uploadErrorMessage = '';
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/pdf,image/*';
    input.multiple = false;
    input.onchange = (event: any) => {
      const files = event.target.files;
      if (files && files.length > 0) {
        this.uploaderDocumentsFirebase(Array.from(files), 'facture');
      }
    };
    input.click();
  }

  uploadImages() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = true;
    input.onchange = (event: any) => {
      const files = event.target.files;
      if (files && files.length > 0) {
        this.uploaderImagesFirebase(Array.from(files));
      }
    };
    input.click();
  }

  // Méthode pour upload direct (utilisée dans la section Documents)
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

  // Méthode pour uploader des documents vers MinIO (backend)
  uploaderDocuments(files: File[], type?: string) {
    if (!this.mission || !this.mission.id) {
      alert('Mission non trouvée');
      return;
    }

    this.uploadingFiles = true;
    this.uploadErrorMessage = '';

    // Upload tous les fichiers en une fois via MinIO backend
    this.minioService.uploadMissionDocuments(this.mission.id, files).subscribe({
      next: (downloadURLs: string[]) => {
        console.log('Documents uploadés via MinIO:', downloadURLs);
        if (!this.missionEdit.documentsAssurance) {
          this.missionEdit.documentsAssurance = [];
        }
        // Ajout du type pour chaque document
        const docsWithType = downloadURLs.map(url => ({ url, type: type || 'autre' }));
        this.missionEdit.documentsAssurance = [
          ...this.missionEdit.documentsAssurance,
          ...docsWithType
        ];
        this.uploadingFiles = false;
        this.cdr.detectChanges();
        console.log('Upload terminé. Type:', type);
      },
      error: (error) => {
        console.error('Erreur lors de l\'upload:', error);
        this.uploadingFiles = false;
        this.uploadErrorMessage = error.message || 'Erreur lors de l\'upload';
        this.cdr.detectChanges();
        alert(`Erreur lors de l'upload: ${error.message || 'Erreur serveur'}`);
      }
    });
  }

  // Alias pour compatibilité avec l'ancien code
  uploaderDocumentsFirebase(files: File[], type?: string) {
    this.uploaderDocuments(files, type);
  }

  // Méthode pour uploader des images vers MinIO (backend)
  uploaderImages(files: File[]) {
    if (!this.mission || !this.mission.id) {
      alert('Mission non trouvée');
      return;
    }

    this.uploadingFiles = true;
    this.uploadErrorMessage = '';

    // Upload tous les fichiers en une fois via MinIO backend
    this.minioService.uploadMissionPhotos(this.mission.id, files).subscribe({
      next: (downloadURLs: string[]) => {
        console.log('Images uploadées via MinIO:', downloadURLs);
        
        // Ajouter les URLs aux photos existantes
        if (!this.missionEdit.photosVehicule) {
          this.missionEdit.photosVehicule = [];
        }
        
        this.missionEdit.photosVehicule = [
          ...this.missionEdit.photosVehicule,
          ...downloadURLs
        ];

        this.uploadingFiles = false;
        this.cdr.detectChanges();
        
        alert(`Images uploadées avec succès !`);
      },
      error: (error) => {
        console.error('Erreur lors de l\'upload des images:', error);
        this.uploadingFiles = false;
        this.uploadErrorMessage = error.message || 'Erreur lors de l\'upload';
        this.cdr.detectChanges();
        alert(`Erreur lors de l'upload des images: ${error.message || 'Erreur serveur'}`);
      }
    });
  }

  // Alias pour compatibilité avec l'ancien code
  uploaderImagesFirebase(files: File[]) {
    this.uploaderImages(files);
  }

  supprimerDocument(index: number) {
    if (!this.missionEdit.documentsAssurance) return;
    // Pour MinIO, la suppression côté serveur se fait lors de la sauvegarde
    // On supprime juste localement pour l'instant
    this.supprimerDocumentLocal(index);
  }

  private supprimerDocumentLocal(index: number) {
    if (!this.missionEdit.documentsAssurance) return;
    this.missionEdit.documentsAssurance = this.missionEdit.documentsAssurance.filter((_: any, i: number) => i !== index);
    this.cdr.detectChanges();
  }

  telechargerDocument(doc: any) {
    // Accepte soit un objet {url, ...}, soit une string
    const url = (doc && typeof doc === 'object' && doc.url) ? doc.url : doc;
    if (!url || typeof url !== 'string') {
      alert('URL de document invalide');
      return;
    }
    // Téléchargement direct via ancre; si CORS empêche le fetch, on laisse le navigateur gérer
    const a = document.createElement('a');
    a.href = url;
    a.download = this.getFileNameFromUrl(url);
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  public isImageOrPdf(url: string): boolean {
    return /\.(pdf|jpg|jpeg|png)$/i.test(url);
  }

  public getFileNameFromUrl(docOrUrl: any): string {
    try {
      const url = (docOrUrl && typeof docOrUrl === 'object' && docOrUrl.url) ? docOrUrl.url : docOrUrl;
      if (typeof url !== 'string') return '';
      let fileName = url.split('/').pop() || '';
      fileName = fileName.split('?')[0];
      return decodeURIComponent(fileName);
    } catch {
      return typeof docOrUrl === 'string' ? docOrUrl : '';
    }
  }

  getVehiculeForMission(mission: Mission): Vehicule | null {
    return this.vehiculesMap.get(mission.id!) || null;
  }

  getMissionDate(mission: Mission | null): string {
    if (!mission) return '';
    return new Date(mission.dateCreation).toLocaleDateString('fr-FR');
  }

  isPhotosArrayNonEmpty(mission: Mission | null): boolean {
    if (!mission) return false;
    return Array.isArray(mission.photosVehicule) && mission.photosVehicule.length > 0;
  }

  getGarageStatutLabel(statut: string | undefined): string {
    if (!statut) return '';
    switch (statut.toLowerCase()) {
      case 'assignée':
      case 'en attente':
        return 'En attente';
      case 'en cours':
        return 'En cours';
      case 'terminée':
        return 'Terminée';
      case 'épave':
        return 'Épave';
      default:
        return statut;
    }
  }

  getStatutAvancementLabel(statut: string | undefined): string {
    if (!statut) return 'Non défini';
    switch (statut) {
      case 'EN_ATTENTE_TRAITEMENT':
        return 'En attente de traitement';
      case 'EN_ATTENTE_EXPERTISE':
        return 'En attente d\'expertise';
      case 'EN_ATTENTE_REPARATION':
        return 'En attente de réparation';
      case 'EN_COURS_REPARATION':
        return 'En cours de réparation';
      case 'REPARATION_TERMINEE':
        return 'Réparation terminée';
      default:
        return statut;
    }
  }

  getStatutAvancementClass(statut: string | undefined): string {
    if (!statut) return 'statut-default';
    switch (statut) {
      case 'EN_ATTENTE_TRAITEMENT':
      case 'EN_ATTENTE_EXPERTISE':
      case 'EN_ATTENTE_REPARATION':
        return 'statut-attente';
      case 'EN_COURS_REPARATION':
        return 'statut-encours';
      case 'REPARATION_TERMINEE':
        return 'statut-terminee';
      default:
        return 'statut-default';
    }
  }

  // Méthode pour vérifier si la mission peut être modifiée
  canEditMission(): boolean {
    return this.mission ? 
      (this.mission.statut !== 'terminée' && this.mission.statut !== 'TERMINEE') : 
      false;
  }

  // Méthodes pour l'édition du statut d'avancement
  lancerEditionStatutAvancement() {
    if (!this.canEditMission()) {
      alert('Impossible de modifier une mission terminée.');
      return;
    }
    this.statutAvancementEdit = this.mission?.sinistre?.statut || null;
    this.editionEnCours = true;
  }

  annulerStatutAvancement() {
    this.statutAvancementEdit = null;
    this.editionEnCours = false;
  }

  enregistrerStatutAvancement() {
  if (!this.mission?.sinistre?.id) return;
  
  // Activer l'état de chargement
  this.uploadingFiles = true;
  this.uploadErrorMessage = '';
  
  // Envoyer seulement la valeur du statut, pas un objet
  const statutValue = this.statutAvancementEdit || '';

  // Utiliser le service dossiers pour mettre à jour le sinistre
  this.dossiersService.updateStatutSinistre(this.mission.sinistre.id, statutValue).subscribe({
    next: (updatedSinistre) => {
      console.log('Statut mis à jour avec succès:', updatedSinistre);
      
      // Désactiver le chargement
      this.uploadingFiles = false;
      this.statutAvancementEdit = null;
      this.editionEnCours = false;
      
      // Mettre à jour le statut dans la mission ET dans le sinistre
      if (this.mission) {
        // Mettre à jour le sinistre
        this.mission.sinistre = { 
          ...this.mission.sinistre, 
          statut: statutValue 
        };
        
        // Mettre à jour aussi le statut de la mission pour synchronisation
        this.mission.statut = statutValue;
        
        // Émettre la mission mise à jour
        this.missionUpdated.emit(this.mission);
      }
      
      // Forcer PLUSIEURS détections de changements pour être sûr
      this.cdr.markForCheck();
      this.cdr.detectChanges();
      
      // Forcer un second cycle de détection après un court délai
      setTimeout(() => {
        this.cdr.detectChanges();
      }, 0);
      
      // Message de succès
      alert('Statut d\'avancement mis à jour avec succès !');
    },
    error: (error) => {
      console.error('Erreur lors de la modification du statut:', error);
      
      // Désactiver le chargement
      this.uploadingFiles = false;
      
      // Afficher l'erreur
      this.uploadErrorMessage = `Erreur: ${error.message}`;
      
      // Forcer la détection de changements
      this.cdr.detectChanges();
      
      alert(`Erreur: ${error.message}`);
    }
  });
}

  // Méthodes pour l'édition de l'expert
  lancerEditionExpert() {
    if (!this.canEditMission()) {
      alert('Impossible de modifier une mission terminée.');
      return;
    }
    this.expertEdit = { ...this.mission?.expert };
    this.editionEnCours = true;
  }

  annulerExpert() {
    this.expertEdit = {};
    this.editionEnCours = false;
  }

  // Méthode pour enregistrer l'expert via le service dédié
  enregistrerExpert() {
    if (!this.expertEdit) return;
    const expert: Expert = { ...this.expertEdit };
    if (expert.id) {
      this.expertService.updateExpert(expert).subscribe({
        next: (updatedExpert) => {
          this.mission!.expert = updatedExpert;
          this.expertEdit = {};
          this.editionEnCours = false;
          this.missionUpdated.emit(this.mission!);
        },
        error: (error) => {
          alert('Erreur lors de la mise à jour de l\'expert : ' + error.message);
        }
      });
    } else {
      this.expertService.createExpert(expert).subscribe({
        next: (createdExpert) => {
          this.mission!.expert = createdExpert;
          this.expertEdit = {};
          this.editionEnCours = false;
          this.missionUpdated.emit(this.mission!);
        },
        error: (error) => {
          alert('Erreur lors de la création de l\'expert : ' + error.message);
        }
      });
    }
  }

  get expertiseCourante(): any {
    return this.mission?.expertises && this.mission.expertises.length > 0 ? this.mission.expertises[0] : null;
  }

  lancerEditionExpertise() {
    const exp = this.expertiseCourante;
    this.expertiseEdit = exp ? {
      id: exp.id,
      nomExpert: exp.nomExpert,
      prenomExpert: exp.prenomExpert,
      institutionExpert: exp.institutionExpert,
      dateExpertisePrevue: exp.dateExpertisePrevue,
      dateExpertiseEffective: exp.dateExpertiseEffective,
      montantChiffrageHT: exp.montantChiffrageHT,
      montantChiffrageTTC: exp.montantChiffrageTTC,
      franchiseApplicable: exp.franchiseApplicable,
      rapportExpertise: exp.rapportExpertise,
      observationsExpert: exp.observationsExpert,
      expertiseEffectuee: exp.expertiseEffectuee,
      rapportTelecharge: exp.rapportTelecharge
    } : {};
    this.editionEnCours = true;
  }

  annulerExpertise() {
    this.expertiseEdit = {};
    this.editionEnCours = false;
  }

  // Méthode pour enregistrer l'expertise via le service dédié
  enregistrerExpertise() {
    if (!this.expertiseEdit) return;
    const patch = {
      id: this.expertiseEdit.id,
      nomExpert: this.expertiseEdit.nomExpert ?? '',
      prenomExpert: this.expertiseEdit.prenomExpert ?? '',
      institutionExpert: this.expertiseEdit.institutionExpert ?? '',
      dateExpertisePrevue: this.expertiseEdit.dateExpertisePrevue ?? '',
      dateExpertiseEffective: this.expertiseEdit.dateExpertiseEffective ?? '',
      montantChiffrageHT: this.expertiseEdit.montantChiffrageHT ?? 0,
      montantChiffrageTTC: this.expertiseEdit.montantChiffrageTTC ?? 0,
      franchiseApplicable: this.expertiseEdit.franchiseApplicable ?? 0,
      rapportExpertise: this.expertiseEdit.rapportExpertise ?? '',
      observationsExpert: this.expertiseEdit.observationsExpert ?? '',
      expertiseEffectuee: this.expertiseEdit.expertiseEffectuee ?? false,
      rapportTelecharge: this.expertiseEdit.rapportTelecharge ?? false,
      missionId: this.mission?.id // Ajouté pour correspondre à l'interface
    };
    this.expertiseService.updateExpertise(patch).subscribe({
      next: (updatedExpertise) => {
        if (this.mission && this.mission.expertises && this.mission.expertises.length > 0) {
          this.mission!.expertises[0] = updatedExpertise;
        }
        // Après enregistrement, si expertiseEffectuee est true, passer le sinistre en EN_ATTENTE_REPARATION
        if (updatedExpertise?.expertiseEffectuee && this.mission?.sinistre?.id) {
          const sinistreId = this.mission.sinistre.id;
          this.dossiersService.updateStatutSinistre(sinistreId, 'EN_ATTENTE_REPARATION').subscribe({
            next: () => {
              this.mission!.sinistre.statut = 'EN_ATTENTE_REPARATION';
              this.cdr.detectChanges();
            },
            error: (err) => {
              console.error('Erreur mise à jour statut après expertise:', err);
            }
          });
        }
        this.editionEnCours = false;
      },
      error: (err) => {
        alert('Erreur lors de la mise à jour des détails de l\'expertise : ' + err.message);
      }
    });
  }

  /// lien lienFacture
  uploadRapportFacture(){
    
  }

  /// lien lienExpertise

  uploadRapportExepertise2(){

  }

  uploadDocument(type: 'EXPERTISE' | 'FACTURE'): void {
  if (!this.mission?.id) {
    alert('Mission non trouvée');
    return;
  }

  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'application/pdf';
  input.multiple = false;

  input.onchange = (event: any) => {
    const file: File = event.target.files?.[0];
    if (!file) {
      return;
    }

    this.uploadingFiles = true;

    const missionId = this.mission?.id;
    if (!missionId) {
      alert('Mission non trouvée');
      this.uploadingFiles = false;
      return;
    }

    this.minioService.uploadPdfFile(file, missionId).subscribe({
      next: (downloadURLs: string[]) => {

        const downloadURL = downloadURLs[0];
        console.log(downloadURLs);
        if (type === 'EXPERTISE') {
          this.lienExpertise = downloadURL;
          if (!this.expertiseEdit) this.expertiseEdit = {};
          this.expertiseEdit.rapportExpertise = downloadURL;
          console.log('URL du rapport d\'expertise:', downloadURL);
        }

        if (type === 'FACTURE') {
          this.lienFacture = downloadURL;
          if (!this.expertiseEdit) this.expertiseEdit = {};
          this.expertiseEdit.facture = downloadURL;
          console.log('URL de la facture:', downloadURL);
        }

        this.uploadingFiles = false;
        this.cdr.detectChanges();

        alert(`Document ${type.toLowerCase()} uploadé avec succès`);
      },
      error: (err) => {
        this.uploadingFiles = false;
        this.cdr.detectChanges();
        console.error(err);
        alert('Erreur lors de l’upload');
      }
    });
  };

  input.click();
}


  // Méthode pour uploader le rapport d'expertise
  uploadRapportExpertise() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/pdf';
    input.multiple = false;
    input.onchange = (event: any) => {
      const files = event.target.files;
      if (files && files.length > 0) {
        this.uploaderRapportExpertiseFirebase(Array.from(files));
      }
    };
    input.click();
  }

  uploaderRapportExpertiseFirebase(files: File[]) {
    if (!this.mission || !this.mission.id) {
      alert('Mission non trouvée');
      return;
    }

    this.uploadingFiles = true;

    // Upload via MinIO backend - prendre le premier fichier pour le rapport d'expertise
    const file = files[0];
    if (!file) {
      this.uploadingFiles = false;
      return;
    }

    this.minioService.uploadPdfFile(file, this.mission.id).subscribe({
      next: (downloadURL: any) => {
        console.log('Rapport d\'expertise uploadé:', downloadURL);
        
        // Mettre à jour l'URL du rapport dans l'expertise
        if (!this.expertiseEdit) {
          this.expertiseEdit = {};
        }
        this.expertiseEdit.rapportExpertise = downloadURL;

        this.uploadingFiles = true;
        this.cdr.detectChanges();
        
        alert('Rapport d\'expertise uploadé avec succès !');
      },
      error: (error: any) => {
        console.error('Erreur lors de l\'upload du rapport:', error);
        this.uploadingFiles = false;
        this.cdr.detectChanges();
        alert(`Erreur lors de l'upload: ${error.message || 'Erreur serveur'}`);
      }
    });
  }

  telechargerRapportExpertise() {
    if (!this.mission?.expertise?.rapportExpertise) {
      alert('Aucun rapport d\'expertise disponible');
      return;
    }

    const rapportUrl = this.mission.expertise.rapportExpertise;
    
    // Télécharger via MinIO service ou direct
    this.minioService.downloadFile(rapportUrl).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'rapport_expertise.pdf';
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
        }, 0);
      },
      error: (error: any) => {
        // Fallback: téléchargement direct
        console.warn('Téléchargement via service échoué, tentative directe:', error);
        const a = document.createElement('a');
        a.href = rapportUrl;
        a.download = 'rapport_expertise.pdf';
        a.target = '_blank';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    });
  }

  public confirmerPassageExpert() {
    if (!this.expertiseCourante || !this.mission) return;

    // 1. Mettre à jour l'expertise (expertiseEffectuee = true)
    const expertiseMaj = { ...this.expertiseCourante, expertiseEffectuee: true };
    this.expertiseService.updateExpertise(expertiseMaj).subscribe({
      next: (updatedExpertise) => {
        if (this.mission && this.mission.expertises && this.mission.expertises.length > 0) {
          this.mission.expertises[0] = updatedExpertise;
        }
        // 2. Mettre à jour le statut d'avancement du sinistre (restreint aux 4 statuts)
        const sinistreId = this.mission!.sinistre?.id;
        if (sinistreId) {
          this.dossiersService.updateStatutSinistre(sinistreId, 'EN_ATTENTE_REPARATION').subscribe({
            next: () => {
              this.mission!.sinistre.statut = 'EN_ATTENTE_REPARATION';
              this.cdr.detectChanges();
            },
            error: (err) => {
              alert('Erreur lors de la mise à jour du statut du sinistre : ' + err.message);
            }
          });
        }
      },
      error: (err) => {
        alert('Erreur lors de la confirmation du passage de l\'expert : ' + err.message);
      }
    });
  }

  debutTravauxPossible(): boolean {
    if (!this.mission) return false;
    const statutMission = this.mission.statut;
    const statutSinistre = this.mission.sinistre?.statut;
    const isTerminee = statutMission === 'REPARATION_TERMINEE' || statutMission === 'terminée' || statutMission === 'TERMINEE' || statutSinistre === 'REPARATION_TERMINEE';
    const enCours = statutMission === 'EN_COURS_REPARATION' || statutSinistre === 'EN_COURS_REPARATION';
    if (isTerminee) return false;
    if (enCours) return false;
    return !this.mission.dateDebutTravaux;
  }

  lancerDebutTravaux() {
    if (!this.mission) return;
    this.saisieDelaiTravaux = true;
    this.delaiEstimeInput = this.mission.delaiEstime || 1;
  }

  annulerDebutTravaux() {
    this.saisieDelaiTravaux = false;
    this.delaiEstimeInput = 1;
  }

  validerDebutTravaux() {
    if (!this.mission) return;
    const missionUpdate: MissionUpdate = {
      statut: 'EN_COURS_REPARATION',
      dateDebutTravaux: new Date().toISOString(),
      delaiEstime: this.delaiEstimeInput
    };
    this.missionService.updateMission(this.mission.id ?? 0, missionUpdate).subscribe({
      next: (updatedMission) => {
        this.saisieDelaiTravaux = false;
        this.delaiEstimeInput = 1;
        this.missionUpdated.emit(updatedMission);
      },
      error: (error) => {
        alert('Erreur lors du démarrage des travaux : ' + error.message);
      }
    });
  }

  terminerReparation() {
    if (!this.mission) return;
    this.dateFinTravauxLocal = new Date().toISOString();
    const missionUpdate: MissionUpdate = {
      statut: 'REPARATION_TERMINEE'
    };
    this.missionService.updateMission(this.mission.id ?? 0, missionUpdate).subscribe({
      next: (updatedMission) => {
        this.mission = updatedMission;
        // Mettre aussi à jour le statut du sinistre pour l'affichage unifié
        const sinistreId = this.mission?.sinistre?.id;
        if (sinistreId) {
          this.dossiersService.updateStatutSinistre(sinistreId, 'REPARATION_TERMINEE').subscribe({
            next: () => {
              if (this.mission) {
                this.mission.sinistre = { ...this.mission.sinistre, statut: 'REPARATION_TERMINEE' } as any;
              }
              this.cdr.detectChanges();
              this.missionUpdated.emit(this.mission!);
            },
            error: () => {
              // Même si la mise à jour du sinistre échoue, on émet la mission mise à jour
              this.missionUpdated.emit(this.mission!);
            }
          });
        } else {
          this.missionUpdated.emit(this.mission);
        }
      },
      error: (error) => {
        alert('Erreur lors de la clôture des travaux : ' + error.message);
      }
    });
  }

  envoyerFactureParMail(docUrl: string) {
    // TODO: remplacer par un appel API réel
    alert('La facture a été envoyée par mail avec succès ! (simulation)');
  }

  uploadRapportsGarage() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/pdf,image/*';
    input.multiple = true;
    input.onchange = (event: any) => {
      const files = event.target.files;
      if (files && files.length > 0) {
        this.uploaderRapportsGarageFirebase(Array.from(files));
      }
    };
    input.click();
  }

  uploaderRapportsGarageFirebase(files: File[]) {
    if (!this.mission || !this.mission.id) {
      alert('Mission non trouvée');
      return;
    }
    this.uploadingFiles = true;
    
    // Upload via MinIO backend
    this.minioService.uploadMissionDocuments(this.mission.id, files).subscribe({
      next: (downloadURLs: string[]) => {
        this.rapportsGarage = [
          ...this.rapportsGarage,
          ...downloadURLs
        ];
        this.uploadingFiles = false;
        this.cdr.detectChanges();
        alert('Rapport(s) uploadé(s) avec succès !');
      },
      error: (error) => {
        this.uploadingFiles = false;
        this.cdr.detectChanges();
        alert(`Erreur lors de l'upload des rapports: ${error.message || 'Erreur serveur'}`);
      }
    });
  }

  supprimerRapportGarage(index: number) {
    // Pour MinIO, la suppression côté serveur se fait lors de la sauvegarde
    // On supprime juste localement pour l'instant
    this.rapportsGarage = this.rapportsGarage.filter((_, i) => i !== index);
    this.cdr.detectChanges();
  }

  // --- Méthode pour sélectionner une assurance ---
  selectAssurance(event: Event) {
    const value = (event.target as HTMLSelectElement).value;
    this.assuranceSelectionnee = this.assurances.find(a => a.nom === value) || null;
  }

  // --- Méthodes pour contacter assurance/expert ---
  contacterAssuranceParMail() {
    if (this.assuranceSelectionnee) {
      window.open(`mailto:${this.assuranceSelectionnee.email}`);
    } else {
      alert('Veuillez sélectionner une assurance.');
    }
  }
  contacterAssuranceParTel() {
    if (this.assuranceSelectionnee) {
      window.open(`tel:${this.assuranceSelectionnee.telephone}`);
    } else {
      alert('Veuillez sélectionner une assurance.');
    }
  }
  contacterExpertParMail() {
    if (this.expertiseCourante?.mailExpert) {
      window.open(`mailto:${this.expertiseCourante.mailExpert}`);
    } else {
      alert('Aucun email expert disponible.');
    }
  }
  contacterExpertParTel() {
    if (this.expertiseCourante?.contactExpert) {
      window.open(`tel:${this.expertiseCourante.contactExpert}`);
    } else {
      alert('Aucun téléphone expert disponible.');
    }
  }

  // --- Méthode générique pour envoyer un document par mail ---
  envoyerDocumentParMail(docUrl: string, destinataire: 'assurance' | 'expert') {
    let email = '';
    if (destinataire === 'assurance' && this.assuranceSelectionnee) {
      email = this.assuranceSelectionnee.email;
    } else if (destinataire === 'expert' && this.expertiseCourante?.mailExpert) {
      email = this.expertiseCourante.mailExpert;
    }
    if (email) {
      // Simule l'envoi d'un mail avec le document en pièce jointe (en vrai, il faut un backend)
      alert(`Le document a été envoyé par mail à ${email} (simulation)`);
    } else {
      alert('Aucun email disponible pour le destinataire sélectionné.');
    }
  }

  // ...ancienne version supprimée, la version API reste en place plus haut...

  // --- Méthodes pour ouvrir mailto: ou tel: depuis le template ---
  openMail(email: string) {
    window.open('mailto:' + email);
  }
  openTel(tel: string) {
    window.open('tel:' + tel);
  }


  
  openImageModal(index: number): void {
    // Normalise les images du sinistre (supporte images[].objectStorageUrl et imgUrl[])
    const images = this.getSinistreImageUrls();
    // si pas d'images sur le sinistre, fallback sur photosVehicule si disponible
    if ((!images || images.length === 0) && Array.isArray(this.mission?.photosVehicule) && this.mission!.photosVehicule!.length > 0) {
      this.currentImages = this.mission!.photosVehicule!;
    } else {
      this.currentImages = images;
    }
    this.currentImageIndex = Math.max(0, Math.min(index, this.currentImages.length - 1));
    this.currentImageUrl = this.currentImages[this.currentImageIndex] || '';
    this.showImageModal = true;
  }
  
  closeImageModal(): void {
    this.showImageModal = false;
    this.currentImages = [];
    this.currentImageIndex = 0;
    this.currentImageUrl = '';
  }
  
  prevImage(): void {
    if (this.currentImageIndex > 0) {
      this.currentImageIndex--;
    }
  }
  
  nextImage(): void {
    if (this.currentImageIndex < this.currentImages.length - 1) {
      this.currentImageIndex++;
    }
  }

  // Retourne toujours un tableau d'URLs string pour le sinistre
  getSinistreImageUrls(): string[] {
    const collected: string[] = [];

    const extractFrom = (s: any) => {
      if (!s) return;
      // nouveau format images: [{ objectStorageUrl, ... }]
      if (Array.isArray(s.images) && s.images.length > 0) {
        s.images.forEach((it: any) => {
          const url = it?.objectStorageUrl || it?.url || null;
          if (typeof url === 'string' && url.length > 0) collected.push(url);
        });
      }
      // ancien format imgUrl: string[]
      if (Array.isArray(s.imgUrl) && s.imgUrl.length > 0) {
        s.imgUrl.forEach((u: any) => {
          if (typeof u === 'string' && u.length > 0) collected.push(u);
        });
      }
    };

    // Prendre d'abord les images liées au dossier (comme dans dossier-view),
    // puis fusionner avec celles éventuellement présentes dans mission.sinistre.
    console.log("extraire les image ------------------------");
    //console.log(this.dossier);
    console.log(this.mission?.sinistre);
   // extractFrom(this.dossier);
    console.log("fin extraire les image ------------------------")
    extractFrom(this.mission?.sinistre);

    // Dédupliquer et retourner
    return Array.from(new Set(collected));
  }
} 