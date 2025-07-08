import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../../../services/auth.service';
import { ReparateurService } from '../../../../../services/reparateur.service';
import { Reparateur } from '../../../../../services/models-api.interface';
import { Router, NavigationEnd } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';

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
    private cdr: ChangeDetectorRef
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
    const updatedReparateur = {
      ...this.reparateur,
      servicePropose: this.serviceProposeString.split(',').map(s => s.trim()).filter(s => s),
      isValids: this.reparateur.isvalids
    };

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
    console.log('Changement de logo');
    // Implémentation à compléter
  }

  changePassword(): void {
    console.log('Changement de mot de passe');
    // Implémentation à compléter
  }
}