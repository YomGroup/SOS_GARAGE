import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../../../services/auth.service';
import { ReparateurService } from '../../../../../services/reparateur.service';
import { firstValueFrom } from 'rxjs';
import { Reparateur } from '../../../../../services/models-api.interface';

@Component({
  selector: 'app-garage-profile',
  templateUrl: './garage-profile.component.html',
  styleUrls: ['./garage-profile.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class GarageProfileComponent implements OnInit {
  loading: boolean = true;
  error: string | null = null;
  reparateur: any = null;
  isEditing: boolean = false;
  originalReparateur: any = null;
  serviceProposeString: string = '';

  stats = {
    vehiculesRepares: 0,
    employes: 0,
    anneesActivite: 0
  };

  constructor(
    private authService: AuthService,
    private reparateurService: ReparateurService
  ) {}

  async ngOnInit() {
    await this.loadGarageProfile();
  }

  async loadGarageProfile() {
    this.loading = true;
    this.error = null;
    
    try {
      // Attendre que l'authentification soit initialisée
      await this.waitForAuth();

      // Récupérer l'ID Keycloak (UUID) du réparateur connecté
      const keycloakId = this.authService.getKeycloakId();
      console.log('KeycloakId récupéré:', keycloakId);
      
      if (!keycloakId) {
        throw new Error('Identifiant Keycloak non trouvé');
      }

      console.log('Recherche du réparateur pour keycloakId:', keycloakId);
      const reparateurId = await this.getReparateurIdByKeycloakId(keycloakId);
      console.log('ID du réparateur trouvé:', reparateurId);
      
      if (reparateurId) {
        // Récupérer le réparateur complet depuis la liste
        const allReparateurs = await firstValueFrom(this.reparateurService.getAllReparateurs());
        const reparateur = allReparateurs.find(r => r.id === reparateurId);
        
        if (reparateur) {
          this.reparateur = reparateur;
          this.originalReparateur = { ...reparateur };
          // Synchroniser le textarea avec le tableau servicePropose
          this.reparateur.serviceProposeString = (reparateur.servicePropose || []).join(', ');
          
          // Calculer les statistiques
          this.loadStats();
        } else {
          throw new Error('Aucun réparateur trouvé pour cet utilisateur');
        }
      } else {
        throw new Error('Aucun réparateur trouvé pour cet utilisateur');
      }
    } catch (err) {
      console.error('Erreur lors du chargement du profil:', err);
      this.error = err instanceof Error ? err.message : 'Une erreur est survenue';
    } finally {
      this.loading = false;
    }
  }

  private async waitForAuth(): Promise<void> {
    // Attendre que l'authentification soit initialisée
    let attempts = 0;
    const maxAttempts = 10;
    
    while (attempts < maxAttempts) {
      const token = this.authService.getToken();
      if (token) {
        console.log('Authentification initialisée après', attempts + 1, 'tentatives');
        return;
      }
      
      console.log('Attente de l\'initialisation de l\'authentification...', attempts + 1);
      await new Promise(resolve => setTimeout(resolve, 500));
      attempts++;
    }
    
    throw new Error('Timeout: Authentification non initialisée');
  }

  private async getReparateurIdByKeycloakId(keycloakId: string): Promise<number | null> {
    try {
      console.log('Recherche du réparateur par Keycloak ID:', keycloakId);
      const reparateur = await firstValueFrom(
        this.reparateurService.getReparateurByKeycloakId(keycloakId)
      );
      console.log('Réparateur trouvé:', reparateur);
      return reparateur ? reparateur.id ?? 0 : null;
    } catch (error: any) {
      console.error('Erreur lors de la récupération du réparateur:', error);
      // Fallback: essayer avec tous les réparateurs si l'endpoint spécifique échoue
      if (error.status === 404) {
        console.log('Endpoint réparateur par Keycloak ID non trouvé, tentative avec tous les réparateurs...');
        try {
          const allReparateurs = await firstValueFrom(
            this.reparateurService.getAllReparateurs()
          );
          const reparateur = allReparateurs.find(r => r.useridKeycloak === keycloakId);
          console.log('Réparateur trouvé dans la liste complète:', reparateur);
          return reparateur ? reparateur.id ?? 0 : null;
        } catch (fallbackError) {
          console.error('Erreur lors de la récupération de tous les réparateurs:', fallbackError);
          return null;
        }
      }
      return null;
    }
  }

  loadStats() {
    // Ici vous pouvez ajouter la logique pour récupérer les vraies statistiques
    // Pour l'exemple, on utilise des valeurs par défaut
    this.stats = {
      vehiculesRepares: this.reparateur.missions?.length || 0,
      employes: this.reparateur.nombreEmployes || 1,
      anneesActivite: this.calculateYearsActivity()
    };
  }

  calculateYearsActivity(): number {
    if (!this.reparateur.dateCreation) return 1;
    
    const creationDate = new Date(this.reparateur.dateCreation);
    const currentDate = new Date();
    return currentDate.getFullYear() - creationDate.getFullYear() || 1;
  }

  getFullName(): string {
    return `${this.reparateur?.prenom || ''} ${this.reparateur?.name || ''}`.trim();
  }

  startEditing() {
    this.isEditing = true;
    this.originalReparateur = {...this.reparateur};
    // Synchroniser le textarea avec le tableau servicePropose
    this.reparateur.serviceProposeString = (this.reparateur.servicePropose || []).join(', ');
  }

  cancelEditing() {
    this.isEditing = false;
    this.reparateur = {...this.originalReparateur};
    // Synchroniser le textarea avec le tableau servicePropose
    this.reparateur.serviceProposeString = (this.reparateur.servicePropose || []).join(', ');
  }

  async saveProfile() {
    try {
      this.loading = true;
      // Synchroniser le tableau servicePropose avec le textarea avant sauvegarde
      this.reparateur.servicePropose = (this.reparateur.serviceProposeString || '').split(',').map((s: string) => s.trim()).filter((s: string) => s);
      // Mettre à jour le réparateur via l'API
      const updatedReparateur = await firstValueFrom(
        this.reparateurService.updateReparateur(
          this.reparateur.id, 
          this.reparateur
        )
      );
      this.reparateur = updatedReparateur;
      this.isEditing = false;
      // Synchroniser le textarea avec le tableau servicePropose après sauvegarde
      this.reparateur.serviceProposeString = (this.reparateur.servicePropose || []).join(', ');
    } catch (err) {
      console.error('Erreur lors de la mise à jour:', err);
      this.error = err instanceof Error ? err.message : 'Erreur lors de la mise à jour';
    } finally {
      this.loading = false;
    }
  }

  changeLogo() {
    console.log('Changement de logo');
    // Implémentation à compléter
  }

  changePassword() {
    console.log('Changement de mot de passe');
    // Implémentation à compléter
  }
}