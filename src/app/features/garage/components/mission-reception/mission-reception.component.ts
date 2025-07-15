import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import { MissionService } from '../../../../../services/mission.service';
import { Mission } from '../../../../../services/models-api.interface';
import { AuthService } from '../../../../../services/auth.service';
import { ReparateurService } from '../../../../../services/reparateur.service';

@Component({
  selector: 'app-mission-reception',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './mission-reception.component.html',
  styleUrls: ['./mission-reception.component.css']
})
export class MissionReceptionComponent implements OnInit {
  missions: Mission[] = [];
  filteredMissions: Mission[] = [];
  filtreStatut: string = '';
  searchText: string = '';
  isCardView: boolean = true;
  panelOuvert: boolean = false;
  missionSelectionnee: Mission | null = null;
  loading: boolean = true;
  error: string | null = null;
  processingAction: boolean = false;

  constructor(
    private missionService: MissionService,
    private authService: AuthService,
    private reparateurService: ReparateurService
  ) {}

  async ngOnInit() {
    await this.loadMissions();
  }

  async loadMissions(): Promise<void> {
    try {
      this.loading = true;
      this.error = null;

      // Récupérer l'UUID Keycloak du réparateur connecté
      const keycloakId = this.authService.getKeycloakId();
      if (!keycloakId) {
        throw new Error('Utilisateur non connecté');
      }

      // Charger toutes les missions puis filtrer côté front (en attendant un endpoint dédié)
      this.missionService.getAllMissions().subscribe({
        next: (missions) => {
          // Filtrer les missions attribuées à l'utilisateur connecté
          this.missions = missions.filter(m => m.reparateur && m.reparateur.useridKeycloak === keycloakId && m.statut === 'en attente');
          this.filteredMissions = this.missions;
          this.loading = false;
          console.log('Missions filtrées pour le réparateur connecté:', this.missions);
        },
        error: (err) => {
          console.error('Erreur lors du chargement des missions:', err);
          this.error = 'Erreur lors du chargement des missions';
          this.loading = false;
        }
      });
    } catch (error) {
      console.error('Erreur lors de l\'initialisation:', error);
      this.error = 'Erreur lors de l\'initialisation';
      this.loading = false;
    }
  }

  onStatutChange() {
    this.applyFilter();
  }

  onSearchChange(event: any) {
    this.searchText = event.target.value.toLowerCase();
    this.applyFilter();
  }

  applyFilter() {
    this.filteredMissions = this.missions.filter(m => {
      const matchStatut = this.filtreStatut ? m.statut === this.filtreStatut : true;
      return matchStatut;
    });
  }

  ouvrirDetails(mission: Mission) {
    this.missionSelectionnee = mission;
    this.panelOuvert = true;
    // Empêcher le scroll du body quand le panneau est ouvert
    document.body.style.overflow = 'hidden';
  }

  fermerPanel() {
    this.panelOuvert = false;
    this.missionSelectionnee = null;
    // Restaurer le scroll du body
    document.body.style.overflow = '';
  }

  async accepterMission(mission: Mission) {
    if (this.processingAction) return;
    
    this.processingAction = true;
    
    try {
      const updatedMission = await firstValueFrom(
        this.missionService.updateMission(mission.id ?? 0, { statut: 'assigné' })
      );
      
      // Mettre à jour les deux tableaux
      this.missions = this.missions.filter(m => m.id !== mission.id);
      this.filteredMissions = this.filteredMissions.filter(m => m.id !== mission.id);
      
      this.showSuccessMessage(`Mission #${mission.id} acceptée avec succès`);
      this.fermerPanel();
    } catch (error: any) {
      this.showErrorMessage(`Échec de l'acceptation: ${error.message || 'Erreur inconnue'}`);
    } finally {
      this.processingAction = false;
    }
  }

  async refuserMission(mission: Mission) {
    if (this.processingAction) return;
    
    this.processingAction = true;
    console.log('Début du refus de la mission:', mission.id);
    
    this.missionService.updateMission(mission.id ?? 0, { 
      statut: 'en attente'
    }).subscribe({
      next: (updatedMission) => {
        console.log('Mission refusée avec succès:', updatedMission);
        
        // Mettre à jour la liste locale
        this.missions = this.missions.filter(m => m.id !== mission.id);
        this.applyFilter();
        
        // Fermer le panneau et réinitialiser
        this.fermerPanel();
        this.processingAction = false;
        
        // Afficher le message de succès
        this.showSuccessMessage(`Mission #${mission.id} refusée.`);
      },
      error: (error) => {
        console.error('Erreur lors du refus:', error);
        
        // Réinitialiser l'état
        this.processingAction = false;
        
        // Afficher l'erreur
        this.showErrorMessage(`Erreur lors du refus: ${error.message || 'Erreur réseau'}`);
      }
    });
  }

  getMissionTitle(mission: Mission): string {
    return `Mission ${mission.id}`;
  }

  getMissionDate(mission: Mission): string {
    return new Date(mission.dateCreation).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  missionEstVisible(mission: Mission): boolean {
    return this.missions.some(m => m.id === mission.id);
  }

  isPhotosArrayNonEmpty(mission: Mission): boolean {
    return Array.isArray(mission.photosVehicule) && mission.photosVehicule.length > 0;
  }

  // Méthode pour le trackBy pour optimiser les performances
  trackByMissionId(index: number, mission: Mission): number {
    return mission.id ?? index;
  }

  // Méthode pour ouvrir le visualiseur de photos (à implémenter selon vos besoins)
  openPhotoViewer(photo: string, index: number): void {
    // Ici vous pouvez implémenter un modal ou une lightbox pour afficher les photos
    console.log('Ouvrir photo:', photo, 'index:', index);
    // Exemple: this.photoViewerService.open(missionSelectionnee.photosVehicule, index);
  }

  // Méthodes pour afficher les messages de succès/erreur
  private showSuccessMessage(message: string): void {
    // Vous pouvez utiliser un service de notification ou des toasts
    console.log('✅ Succès:', message);
    // Exemple: this.notificationService.showSuccess(message);
  }

  private showErrorMessage(message: string): void {
    // Vous pouvez utiliser un service de notification ou des toasts
    console.error('❌ Erreur:', message);
    // Exemple: this.notificationService.showError(message);
  }

  // Méthode pour gérer les clics sur l'overlay
  onOverlayClick(event: Event): void {
    if (event.target === event.currentTarget) {
      this.fermerPanel();
    }
  }

  // Méthode pour gérer les touches clavier
  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Escape' && this.panelOuvert) {
      this.fermerPanel();
    }
  }
} 