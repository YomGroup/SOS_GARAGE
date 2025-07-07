import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MissionService } from '../../../../../services/mission.service';
import { Mission, MissionUpdate } from '../../../../../services/models-api.interface';
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

  constructor(
    private missionService: MissionService, 
    private cdr: ChangeDetectorRef,
    private firebaseService: FirebaseStorageService
  ) {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes['edition'] && this.edition && this.mission) {
      this.lancerEdition();
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