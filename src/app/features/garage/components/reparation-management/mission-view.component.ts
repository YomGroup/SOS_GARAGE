import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MissionService } from '../../../../../services/mission.service';
import { Mission, MissionUpdate, Assure, Vehicule, StatutAvancementSinistre, Expert, Expertise } from '../../../../../services/models-api.interface';
import { FirebaseStorageService } from '../../../../../services/firebase-storage.service';
import { DossiersService } from '../../../../../services/dossiers.service';
import { ExpertService } from '../../../../../services/expert.service';
import { ExpertiseService } from '../../../../../services/expertise.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-mission-view',
  templateUrl: './mission-view.component.html',
  styleUrls: ['./mission-view.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class MissionViewComponent implements OnChanges {
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
  vehiculesMap: Map<number, Vehicule> = new Map();
  statutAvancementEdit: string | null = null;

  // Exposer l'enum pour le template
  StatutAvancementSinistre = StatutAvancementSinistre;

  constructor(
    private missionService: MissionService, 
    private cdr: ChangeDetectorRef,
    private firebaseService: FirebaseStorageService,
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
        },
        error: () => {
          this.vehiculesMap.set(this.mission!.id!, null as any);
          this.cdr.detectChanges();
        }
      });
    }
  }

  close() {
    this.editionEnCours = false;
    this.missionEdit = {};
    this.edition = false;
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

  // Nouvelles méthodes pour les uploads spécifiques
  uploadDevis() {
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

  // Méthode modifiée pour supporter les types de documents
  uploaderDocumentsFirebase(files: File[], type?: string) {
    if (!this.mission || !this.mission.id) {
      alert('Mission non trouvée');
      return;
    }

    this.uploadingFiles = true;
    const uploadPromises: Promise<string>[] = [];

    files.forEach(file => {
      let uploadPromise: Promise<string>;
      
      // Utiliser le bon service selon le type
      if (type === 'devis') {
        uploadPromise = firstValueFrom(this.firebaseService.uploadDevisFile(file, this.mission!.id!));
      } else if (type === 'facture') {
        uploadPromise = firstValueFrom(this.firebaseService.uploadFactureFile(file, this.mission!.id!));
      } else {
        uploadPromise = firstValueFrom(this.firebaseService.uploadPdfFile(file, this.mission!.id!));
      }
      
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
        
        // Afficher un message de succès
        const typeLabel = type ? ` (${type})` : '';
        alert(`Document${typeLabel} uploadé avec succès !`);
      })
      .catch((error) => {
        console.error('Erreur lors de l\'upload:', error);
        this.uploadingFiles = false;
        this.cdr.detectChanges();
        alert(`Erreur lors de l'upload: ${error.message}`);
      });
  }

  // Nouvelle méthode pour uploader des images
  uploaderImagesFirebase(files: File[]) {
    if (!this.mission || !this.mission.id) {
      alert('Mission non trouvée');
      return;
    }

    this.uploadingFiles = true;
    const uploadPromises: Promise<string>[] = [];

    files.forEach(file => {
      const uploadPromise = firstValueFrom(this.firebaseService.uploadImageFile(file, this.mission!.id!));
      uploadPromises.push(uploadPromise);
    });

    if (uploadPromises.length === 0) {
      this.uploadingFiles = false;
      return;
    }

    Promise.all(uploadPromises)
      .then((downloadURLs: string[]) => {
        console.log('Images uploadées:', downloadURLs);
        
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
      })
      .catch((error) => {
        console.error('Erreur lors de l\'upload des images:', error);
        this.uploadingFiles = false;
        this.cdr.detectChanges();
        alert(`Erreur lors de l'upload des images: ${error.message}`);
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

  public isImageOrPdf(url: string): boolean {
    return /\.(pdf|jpg|jpeg|png)$/i.test(url);
  }

  public getFileNameFromUrl(url: string): string {
    try {
      return decodeURIComponent(url.split('/').pop() || '');
    } catch {
      return url;
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
      case 'EN_ATTENTE_VALIDATION_ASSURANCE':
        return 'En attente de validation assurance';
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

  getStatutAvancementClass(statut: string | undefined): string {
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
        return 'statut-facture';
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
    
    // Envoyer seulement la valeur du statut, pas un objet
    const statutValue = this.statutAvancementEdit || '';

    // Utiliser le service dossiers pour mettre à jour le sinistre
    this.dossiersService.updateStatutSinistre(this.mission.sinistre.id, statutValue).subscribe({
      next: (updatedSinistre) => {
        console.log('Statut mis à jour avec succès:', updatedSinistre);
        this.statutAvancementEdit = null;
        this.editionEnCours = false;
        // Mettre à jour la mission avec les nouvelles données
        if (this.mission) {
          this.mission.sinistre = { ...this.mission.sinistre, statut: statutValue };
          this.missionUpdated.emit(this.mission);
        }
      },
      error: (error) => {
        console.error('Erreur lors de la modification du statut:', error);
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
      
    };
    this.expertiseService.updateExpertise(patch).subscribe({
        next: (updatedExpertise) => {
        if (this.mission && this.mission.expertises && this.mission.expertises.length > 0) {
          this.mission!.expertises[0] = updatedExpertise;
        }
          this.editionEnCours = false;
        },
      error: (err) => {
        alert('Erreur lors de la mise à jour des détails de l\'expertise : ' + err.message);
        }
      });
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
    const uploadPromises: Promise<string>[] = [];

    files.forEach(file => {
      // Utiliser la méthode uploadPdfFile existante
      const uploadPromise = firstValueFrom(this.firebaseService.uploadPdfFile(file, this.mission!.id!));
      uploadPromises.push(uploadPromise);
    });

    if (uploadPromises.length === 0) {
      this.uploadingFiles = false;
      return;
    }

    Promise.all(uploadPromises)
      .then((downloadURLs: string[]) => {
        console.log('Rapport d\'expertise uploadé:', downloadURLs[0]);
        
        // Mettre à jour l'URL du rapport dans l'expertise
        if (!this.expertiseEdit) {
          this.expertiseEdit = {};
        }
        this.expertiseEdit.rapportExpertise = downloadURLs[0];

        this.uploadingFiles = false;
        this.cdr.detectChanges();
        
        alert('Rapport d\'expertise uploadé avec succès !');
      })
      .catch((error) => {
        console.error('Erreur lors de l\'upload du rapport:', error);
        this.uploadingFiles = false;
        this.cdr.detectChanges();
        alert(`Erreur lors de l'upload: ${error.message}`);
      });
  }

  telechargerRapportExpertise() {
    if (!this.mission?.expertise?.rapportExpertise) {
      alert('Aucun rapport d\'expertise disponible');
      return;
    }

    // Si c'est une URL Firebase, télécharger via le service
    if (this.mission.expertise.rapportExpertise.includes('firebasestorage.googleapis.com')) {
      this.firebaseService.downloadPdfFile(this.mission.expertise.rapportExpertise).subscribe({
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
        error: (error) => {
          console.error('Erreur lors du téléchargement du rapport:', error);
          alert(`Erreur lors du téléchargement: ${error.message}`);
        }
      });
    } else {
      // Téléchargement direct si ce n'est pas Firebase
      const a = document.createElement('a');
      a.href = this.mission.expertise.rapportExpertise;
      a.download = 'rapport_expertise.pdf';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
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
        // 2. Mettre à jour le statut d'avancement du sinistre
        const sinistreId = this.mission!.sinistre?.id;
        if (sinistreId) {
          this.dossiersService.updateStatutSinistre(sinistreId, 'EN_ATTENTE_VALIDATION_ASSURANCE').subscribe({
            next: () => {
              this.mission!.sinistre.statut = 'EN_ATTENTE_VALIDATION_ASSURANCE';
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
} 