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
  }

  fermerPanel() {
    this.panelOuvert = false;
    this.missionSelectionnee = null;
  }

  accepterMission(mission: Mission) {
    this.missionService.updateMission(mission.id ?? 0, { statut: 'assignée' }).subscribe({
      next: (updatedMission) => {
        this.missions = this.missions.filter(m => m.id !== mission.id);
        this.applyFilter();
        alert(`Mission #${mission.id} acceptée.`);
        this.fermerPanel();
      },
      error: () => alert('Erreur lors de l\'acceptation de la mission')
    });
  }

  refuserMission(mission: Mission) {
    this.missionService.updateMission(mission.id ?? 0, { statut: 'non assignée', reparateur: undefined }).subscribe({
      next: () => {
        this.missions = this.missions.filter(m => m.id !== mission.id);
        this.applyFilter();
        alert(`Mission #${mission.id} refusée.`);
        this.fermerPanel();
      },
      error: () => alert('Erreur lors du refus de la mission')
    });
  }

  getMissionTitle(mission: Mission): string {
    return `Mission ${mission.id}`;
  }

  getMissionDate(mission: Mission): string {
    return new Date(mission.dateCreation).toLocaleDateString('fr-FR');
  }

  missionEstVisible(mission: Mission): boolean {
    return this.missions.some(m => m.id === mission.id);
  }

  isPhotosArrayNonEmpty(mission: Mission): boolean {
    return Array.isArray(mission.photosVehicule) && mission.photosVehicule.length > 0;
  }
} 