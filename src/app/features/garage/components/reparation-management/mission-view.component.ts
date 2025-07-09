import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MissionService } from '../../../../../services/mission.service';
import { Mission, MissionUpdate, Assure, Vehicule } from '../../../../../services/models-api.interface';
import { FirebaseStorageService } from '../../../../../services/firebase-storage.service';
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
  @Input() loading: boolean = false;
  @Input() edition: boolean = false;
  @Output() closed = new EventEmitter<void>();
  @Output() missionUpdated = new EventEmitter<Mission>();

  editionEnCours: boolean = false;
  missionEdit: any = { documentsAssurance: [] };
  uploadingFiles: boolean = false;
  assureInfo: Assure | null = null;
  vehiculeInfo: Vehicule | null = null;

  constructor(
    private missionService: MissionService, 
    private cdr: ChangeDetectorRef,
    private firebaseService: FirebaseStorageService
  ) {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes['edition'] && this.edition && this.mission) {
      this.lancerEdition();
    }
    // Ajout : charger infos client/véhicule si mission change
    if (changes['mission'] && this.mission) {
      this.chargerInformationsAssureEtVehicule();
    }
  }

  ngOnInit(): void {
    if (this.mission) {
      this.chargerInformationsAssureEtVehicule();
    }
  }

  // Ajout : méthode pour charger infos client et véhicule
  chargerInformationsAssureEtVehicule() {
    if (!this.mission || !this.mission.sinistre || !this.mission.sinistre.id) {
      this.assureInfo = null;
      this.vehiculeInfo = null;
      return;
    }
    // Récupérer l'assuré
    this.missionService.getAssureBySinistreId(this.mission.sinistre.id).subscribe({
      next: (assure) => {
        this.assureInfo = assure;
        this.cdr.detectChanges();
      },
      error: () => {
        this.assureInfo = null;
      }
    });
    // Récupérer le véhicule
    this.missionService.getVehiculeByMissionId(this.mission.id!).subscribe({
      next: (vehicule) => {
        this.vehiculeInfo = vehicule;
        this.cdr.detectChanges();
      },
      error: () => {
        this.vehiculeInfo = null;
      }
    });
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

  public getFileNameFromUrl(url: string): string {
    try {
      // Si c'est une URL Firebase, extraire le nom du fichier du chemin
      if (url.includes('firebasestorage.googleapis.com')) {
        // Décoder l'URL complète
        const decodedUrl = decodeURIComponent(url);
        
        // Extraire le nom du fichier depuis le chemin
        // Format attendu: missions/3/documents/facture3.bkgr-strategy-mai-2025.pdf
        const pathMatch = decodedUrl.match(/missions\/\d+\/documents\/(.+\.(pdf|png|jpg|jpeg|gif))/);
        if (pathMatch) {
          return pathMatch[1];
        }
        
        // Fallback: chercher le nom après le dernier slash
        const fileNameMatch = decodedUrl.match(/\/([^\/]+\.(pdf|png|jpg|jpeg|gif))(\?|$)/);
        if (fileNameMatch) {
          return fileNameMatch[1];
        }
      }
      
      // Fallback pour les autres URLs
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      const fileName = pathname.split('/').pop() || 'document.pdf';
      return decodeURIComponent(fileName);
    } catch {
      return 'document.pdf';
    }
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
} 