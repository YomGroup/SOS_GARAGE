import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../../../services/auth.service';
import { ReparateurService } from '../../../../../services/reparateur.service';
import { Reparateur } from '../../../../../services/models-api.interface';
import { Router, NavigationEnd } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FirebaseStorageService } from '../../../../../services/firebase-storage.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-garage-profile',
  templateUrl: './garage-profile.component.html',
  styleUrls: ['./garage-profile.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GarageProfileComponent implements OnInit {
  loading: boolean = true;
  error: string | null = null;
  reparateur: Reparateur | null = null;
  isEditing: boolean = false;
  originalReparateur: Reparateur | null = null;
  serviceProposeString: string = '';
  uploadingLogo: boolean = false;
  uploadingImages: boolean = false;
  deletingImageIndex: number | null = null;

  stats = {
    vehiculesRepares: 0,
    employes: 0,
    anneesActivite: 0
  };

  constructor(
    private authService: AuthService,
    private reparateurService: ReparateurService,
    private router: Router,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef,
    private storageService: FirebaseStorageService
  ) {}

  ngOnInit(): void {
    this.loadGarageProfile();
    
    // Recharger les données si la route change
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.loadGarageProfile();
      }
    });
  }

  refreshData(): void {
    this.loadGarageProfile();
  }

  loadGarageProfile(): void {
    this.loading = true;
    this.error = null;
    this.cdr.detectChanges();
    
    const keycloakId = this.authService.getKeycloakId();
    if (!keycloakId) {
      this.error = 'Identifiant Keycloak non trouvé';
      this.loading = false;
      this.cdr.detectChanges();
      return;
    }

    this.reparateurService.getReparateurByKeycloakId(keycloakId).subscribe({
      next: (reparateur) => {
        if (!reparateur) {
          this.error = 'Aucun réparateur trouvé pour cet utilisateur';
          this.loading = false;
          this.cdr.detectChanges();
          return;
        }
        
        this.reparateur = reparateur;
        this.originalReparateur = { ...reparateur };
        this.serviceProposeString = (reparateur.servicePropose || []).join(', ');
        this.loadStats();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        // Fallback si l'endpoint spécifique échoue
        this.loadAllReparateursFallback(keycloakId);
      }
    });
  }

  private loadAllReparateursFallback(keycloakId: string): void {
    this.reparateurService.getAllReparateurs().subscribe({
      next: (reparateurs) => {
        const reparateur = reparateurs.find(r => r.useridKeycloak === keycloakId);
        
        if (!reparateur) {
          this.error = 'Aucun réparateur trouvé pour cet utilisateur';
          this.loading = false;
          this.cdr.detectChanges();
          return;
        }
        
        this.reparateur = reparateur;
        this.originalReparateur = { ...reparateur };
        this.serviceProposeString = (reparateur.servicePropose || []).join(', ');
        this.loadStats();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erreur:', err);
        this.error = err.message;
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  private loadStats(): void {
    if (!this.reparateur) return;
    
    this.stats = {
      vehiculesRepares: this.reparateur.nombreVehiculeReparee || 0,
      employes: this.reparateur.nombreEmployes || 0,
      anneesActivite: this.calculateYearsActivity()
    };
    this.cdr.detectChanges();
  }

  private calculateYearsActivity(): number {
    if (!this.reparateur?.createdAt) return 1;
    
    const creationDate = new Date(this.reparateur.createdAt);
    const currentDate = new Date();
    return currentDate.getFullYear() - creationDate.getFullYear() || 1;
  }

  startEditing(): void {
    this.isEditing = true;
    this.originalReparateur = this.reparateur ? {...this.reparateur} : null;
    this.serviceProposeString = (this.reparateur?.servicePropose || []).join(', ');
    this.cdr.detectChanges();
  }

  cancelEditing(): void {
    this.isEditing = false;
    this.reparateur = this.originalReparateur ? {...this.originalReparateur} : null;
    this.serviceProposeString = (this.reparateur?.servicePropose || []).join(', ');
    this.cdr.detectChanges();
  }

  saveProfile(): void {
    if (!this.reparateur?.id) return;
    
    this.loading = true;
    this.cdr.detectChanges();
    
    // Préparer les données
    const updatedReparateur = this.buildUpdatePayload({
      ...this.reparateur,
      servicePropose: this.serviceProposeString.split(',').map(s => s.trim()).filter(s => s)
    } as Reparateur);

    this.reparateurService.updateReparateur(this.reparateur.id, updatedReparateur).subscribe({
      next: (response) => {
        this.reparateur = response;
        this.isEditing = false;
        this.snackBar.open('Profil mis à jour avec succès', 'Fermer', { duration: 3000 });
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erreur:', err);
        this.error = err.message;
        this.snackBar.open('Erreur lors de la mise à jour du profil', 'Fermer', { duration: 3000 });
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  changeLogo(): void {
    if (!this.reparateur?.id) { return; }
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (event: any) => {
      const file: File | undefined = event.target.files?.[0];
      if (!file) { return; }
      this.uploadingLogo = true; this.cdr.detectChanges();
      try {
        const url = await firstValueFrom(this.storageService.uploadGarageLogo(file, this.reparateur!.id!));
        // Update local state first for instant UI feedback
        this.reparateur!.logo = url;
        // Persist sanitized object to avoid backend 500
        const payload = this.buildUpdatePayload(this.reparateur!);
        // Try PATCH first, then fallback to PUT text
        try {
          await firstValueFrom(this.reparateurService.updateReparateurPatchText(this.reparateur!.id!, payload));
        } catch {
          await firstValueFrom(this.reparateurService.updateReparateurText(this.reparateur!.id!, payload));
        }
        this.snackBar.open('Logo mis à jour', 'Fermer', { duration: 3000 });
      } catch (e: any) {
        console.error(e);
        this.snackBar.open('Erreur lors de l\'upload du logo', 'Fermer', { duration: 3000 });
      } finally {
        this.uploadingLogo = false; this.cdr.detectChanges();
      }
    };
    input.click();
  }

  changePassword(): void {
    console.log('Changement de mot de passe');
    // Implémentation à compléter
  }

  // Upload and append repair images to the gallery and persist to backend
  addRepairImages(): void {
    if (!this.reparateur?.id) { return; }
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = true;
    input.onchange = async (event: any) => {
      const files: File[] = Array.from(event.target.files || []);
      if (!files.length) { return; }
      this.uploadingImages = true; this.cdr.detectChanges();
      try {
        // Upload files concurrently and handle partial failures
        const results = await Promise.allSettled(
          files.map(f => firstValueFrom(this.storageService.uploadGarageImage(f, this.reparateur!.id!)))
        );
        const succeeded = results.filter(r => r.status === 'fulfilled') as PromiseFulfilledResult<string>[];
        const failed = results.filter(r => r.status === 'rejected');
        if (succeeded.length === 0) {
          throw new Error('Aucun fichier n\'a pu être uploadé');
        }
        const urls = succeeded.map(r => r.value);
        const existing = Array.isArray(this.reparateur!.imagesReparations) ? this.reparateur!.imagesReparations : [];
        const updatedImages = [...existing, ...urls];
        this.reparateur!.imagesReparations = updatedImages;
        const payload = this.buildUpdatePayload(this.reparateur!);
        try {
          await firstValueFrom(this.reparateurService.updateReparateurPatchText(this.reparateur!.id!, payload));
        } catch {
          await firstValueFrom(this.reparateurService.updateReparateurText(this.reparateur!.id!, payload));
        }
        const msg = failed.length > 0
          ? `Images ajoutées (${succeeded.length}), ${failed.length} échec(s)`
          : 'Images ajoutées avec succès';
        this.snackBar.open(msg, 'Fermer', { duration: 3500 });
      } catch (e: any) {
        console.error('Upload images error:', e);
        const errMsg = (e && e.message) ? e.message : 'Erreur lors de l\'upload des images';
        this.snackBar.open(errMsg, 'Fermer', { duration: 4000 });
      } finally {
        this.uploadingImages = false; this.cdr.detectChanges();
      }
    };
    input.click();
  }

  async removeRepairImage(index: number): Promise<void> {
    if (!this.reparateur?.id) { return; }
    const images = Array.isArray(this.reparateur.imagesReparations) ? [...this.reparateur.imagesReparations] : [];
    if (index < 0 || index >= images.length) { return; }
    const url = images[index];
    this.deletingImageIndex = index; this.cdr.detectChanges();
    try {
      // Try to delete the file from Firebase if possible
      await firstValueFrom(this.storageService.deleteFileByUrl(url));
    } catch {
      // ignore deletion errors; still remove reference
    }
    try {
      const updated = images.filter((_, i) => i !== index);
      this.reparateur.imagesReparations = updated;
      const payload = this.buildUpdatePayload(this.reparateur);
      try {
        await firstValueFrom(this.reparateurService.updateReparateurPatchText(this.reparateur.id!, payload));
      } catch {
        await firstValueFrom(this.reparateurService.updateReparateurText(this.reparateur.id!, payload));
      }
      this.snackBar.open('Image supprimée', 'Fermer', { duration: 2500 });
    } catch (e: any) {
      this.snackBar.open('Erreur lors de la suppression', 'Fermer', { duration: 3000 });
    } finally {
      this.deletingImageIndex = null; this.cdr.detectChanges();
    }
  }

  private buildUpdatePayload(rep: Reparateur): Partial<Reparateur> {
    // Keep only updatable fields; avoid readonly fields and unknown properties
    return {
      // do NOT send id/createdAt/updatedAt/password/useridKeycloak/missions
      name: rep.name ?? '',
      prenom: rep.prenom ?? '',
      email: rep.email ?? '',
      telephone: rep.telephone ?? '',
      adresse: rep.adresse ?? '',
      statut: rep.statut,
      // Inclure les deux variantes pour compat backend
      isvalids: rep.isvalids ?? rep.isValids ?? 'valide',
      isValids: rep.isvalids ?? rep.isValids ?? 'valide',
      codePostal: rep.codePostal ?? '',
      ville: rep.ville ?? '',
      commission: rep.commission != null ? Number(rep.commission) : 0,
      siret: rep.siret ?? '',
      nomDuGarage: rep.nomDuGarage ?? '',
      servicePropose: Array.isArray(rep.servicePropose) ? rep.servicePropose : [],
      anneeExperience: rep.anneeExperience != null ? Number(rep.anneeExperience) : 0,
      nombreVehiculeReparee: rep.nombreVehiculeReparee != null ? Number(rep.nombreVehiculeReparee) : 0,
      nombreEmployes: rep.nombreEmployes != null ? Number(rep.nombreEmployes) : 0,
      logo: rep.logo ?? '',
      imagesReparations: Array.isArray(rep.imagesReparations) ? rep.imagesReparations : []
    } as Partial<Reparateur>;
  }
}