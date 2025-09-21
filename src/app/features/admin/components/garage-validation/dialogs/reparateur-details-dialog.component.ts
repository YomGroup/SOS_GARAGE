import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Reparateur } from '../../../../../../services/models-api.interface';
import { FormsModule } from '@angular/forms';
import { ReparateurService } from '../../../../../../services/reparateur.service';
import { SendMessageDialogComponent } from './send-message-dialog/send-message-dialog.component';

@Component({
  selector: 'app-reparateur-details-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule, MatChipsModule, FormsModule],
  templateUrl: './reparateur-details-dialog.component.html',
  styleUrls: ['./reparateur-details-dialog.component.css']
})
export class ReparateurDetailsDialogComponent {
  reparateur: Reparateur;
  loading = false;
  editCommissionMode = false;
  commissionInput: number = 0;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { reparateur: Reparateur },
    private dialogRef: MatDialogRef<ReparateurDetailsDialogComponent>,
    private reparateurService: ReparateurService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {
    this.reparateur = data.reparateur;
    this.commissionInput = this.reparateur.commission ?? 0;
  }

  close(): void {
    this.dialogRef.close();
  }

  validerReparateur(): void {
    this.loading = true;
    const payload = { isValids: 'valide' };
    this.reparateurService.updateReparateurPatch(this.reparateur.id!, payload).subscribe({
      next: (response) => {
        this.reparateur.isValids = 'valide';
        this.loading = false;
        this.snackBar.open('Réparateur validé avec succès !', 'Fermer', {
          duration: 3000,
          panelClass: ['success-snackbar']
        });
        this.dialogRef.close({ action: 'validate', reparateur: this.reparateur });
      },
      error: (error) => {
        this.loading = false;
        this.snackBar.open('Erreur lors de la validation', 'Fermer', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  saveCommission(): void {
    if (isNaN(this.commissionInput) || this.commissionInput < 0 || this.commissionInput > 100) {
      this.snackBar.open('Veuillez entrer une commission valide (0-100%)', 'Fermer', {
        duration: 3000,
        panelClass: ['warning-snackbar']
      });
      return;
    }
    this.loading = true;
    const payload = { commission: this.commissionInput };
    this.reparateurService.updateReparateurPatch(this.reparateur.id!, payload).subscribe({
      next: (response) => {
        this.reparateur.commission = this.commissionInput;
        this.loading = false;
        this.editCommissionMode = false;
        this.snackBar.open('Commission mise à jour avec succès !', 'Fermer', {
          duration: 3000,
          panelClass: ['success-snackbar']
        });
      },
      error: (error) => {
        this.loading = false;
        this.editCommissionMode = false;
        this.snackBar.open('Erreur lors de la modification de la commission', 'Fermer', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  envoyerMessage(): void {
    this.dialog.open(SendMessageDialogComponent, {
      width: '400px',
      data: { 
        receiverId: this.reparateur.useridKeycloak, 
        receiverName: this.reparateur.nomDuGarage 
      }
    });
  }

  envoyerEmail(): void {
    const subject = `Message de la part de SOS Garage`;
    const body = `Bonjour ${this.reparateur.nomDuGarage},\n\n`;
    window.location.href = `mailto:${this.reparateur.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }

  suspendreCompte(): void {
    this.loading = true;
    const payload = { isValids: 'rejetée' };
    this.reparateurService.updateReparateurPatch(this.reparateur.id!, payload).subscribe({
      next: (response) => {
        this.reparateur.isValids = 'rejetée';
        this.loading = false;
        this.snackBar.open('Compte suspendu (rejeté) avec succès !', 'Fermer', {
          duration: 3000,
          panelClass: ['warning-snackbar']
        });
        this.dialogRef.close({ action: 'suspend', reparateur: this.reparateur });
      },
      error: (error) => {
        this.loading = false;
        this.snackBar.open('Erreur lors de la suspension', 'Fermer', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  rejeterReparateur(): void {
    this.loading = true;
    const payload = { isValids: 'rejetée' };
    this.reparateurService.updateReparateurPatch(this.reparateur.id!, payload).subscribe({
      next: (response) => {
        this.reparateur.isValids = 'rejetée';
        this.loading = false;
        this.snackBar.open('Réparateur rejeté avec succès !', 'Fermer', {
          duration: 3000,
          panelClass: ['success-snackbar']
        });
        this.dialogRef.close({ action: 'reject', reparateur: this.reparateur });
      },
      error: (error) => {
        this.loading = false;
        this.snackBar.open('Erreur lors du rejet', 'Fermer', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }
}