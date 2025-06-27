import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

export interface DocumentApi {
  type: string;
  fichier: string;
  signatureElectronique: string[];
}

export interface DossierApi {
  id?: number;
  type: string;
  contactAssistance: string;
  lienConstat: string;
  conditionsAcceptees: boolean;
  documents: DocumentApi[];
  idVehicule: number;
}

@Component({
  selector: 'app-custom-dossier-dialog',
  templateUrl: './dossier-details-dialog.component.html',
  styleUrls: ['./dossier-details-dialog.component.css']
})
export class DossierDetailsDialogComponent {
  
  constructor(
    public dialogRef: MatDialogRef<DossierDetailsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DossierApi
  ) {
    if (!Array.isArray(this.data.documents)) {
      this.data.documents = [];
    }
  }

  close(): void {
    this.dialogRef.close();
  }

  editDossier(): void {
    this.dialogRef.close({
      action: 'edit',
      dossier: this.data
    });
  }

  attribuerSinistre(): void {
    this.dialogRef.close({
      action: 'attribuerSinistre',
      dossier: this.data
    });
  }

  supprimerDossier(): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce dossier ?')) {
      this.dialogRef.close({
        action: 'supprimer',
        dossier: this.data
      });
    }
  }
}