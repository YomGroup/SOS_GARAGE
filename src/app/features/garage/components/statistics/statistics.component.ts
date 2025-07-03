import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MissionService } from '../../../../../services/mission.service';
import { Mission } from '../../../../../services/models-api.interface';
import { AuthService } from '../../../../../services/auth.service';
import { ReparateurService } from '../../../../../services/reparateur.service';
import { AssureService, ASSURE, Vehicule } from '../../../../../services/assure.service';
import { firstValueFrom, forkJoin } from 'rxjs';
import { MissionViewComponent } from '../reparation-management/mission-view.component';

interface MissionStats {
  total: number;
  completed: number;
  inProgress: number;
  pending: number;
  assigned: number;
  refused: number;
  epave: number;
}

interface FinancialStats {
  totalDevis: number;
  totalFactures: number;
  totalCommissions: number;
  netBalance: number;
  averageDevis: number;
  averageFacture: number;
}

interface RecentMission {
  id: number;
  title: string;
  status: string;
  date: string;
  vehicle: string;
  client: string;
  devis: number;
  facture: number;
  typeSinistre: string;
  assureName: string;
  vehiculeInfo: string;
}

@Component({
  selector: 'app-statistics',
  standalone: true,
  imports: [
    CommonModule,
    MissionViewComponent
  ],
  templateUrl: './statistics.component.html',
  styleUrls: ['./statistics.component.css']
})
export class StatisticsComponent implements OnInit {
  missionStats: MissionStats = {
    total: 0,
    completed: 0,
    inProgress: 0,
    pending: 0,
    assigned: 0,
    refused: 0,
    epave: 0
  };

  financialStats: FinancialStats = {
    totalDevis: 0,
    totalFactures: 0,
    totalCommissions: 0,
    netBalance: 0,
    averageDevis: 0,
    averageFacture: 0
  };

  recentMissions: RecentMission[] = [];
  loading: boolean = true;
  error: string | null = null;
  reparateurMissions: Mission[] = [];
  
  // Propriétés pour la modale mission-view
  showMissionView: boolean = false;
  selectedMission: Mission | null = null;
  missionViewEdition: boolean = false;

  constructor(
    private missionService: MissionService,
    private authService: AuthService,
    private reparateurService: ReparateurService,
    private assureService: AssureService
  ) {}

  ngOnInit(): void {
    this.loadStatistics();
  }

  // Méthode publique pour rafraîchir les statistiques
  refreshStatistics(): void {
    this.loadStatistics();
  }

  private async loadStatistics(): Promise<void> {
    try {
      this.loading = true;
      this.error = null;

      console.log('Début du chargement des statistiques...');

      // Récupérer l'UUID Keycloak du réparateur connecté
      const keycloakId = this.authService.getKeycloakId();
      console.log('Keycloak ID récupéré:', keycloakId);
      
      if (!keycloakId) {
        throw new Error('Utilisateur non connecté');
      }

      // Charger toutes les missions puis filtrer côté front
      const allMissions = await firstValueFrom(this.missionService.getAllMissions());
      console.log('Toutes les missions récupérées:', allMissions.length);
      
      // Filtrer les missions du réparateur connecté
      this.reparateurMissions = allMissions.filter(m => 
        m.reparateur && m.reparateur.useridKeycloak === keycloakId
      );
      console.log('Missions du réparateur connecté:', this.reparateurMissions.length);
      
      // Calculer les statistiques
      this.calculateStatistics();
      
    } catch (error: any) {
      console.error('Erreur lors du chargement des statistiques:', error);
      
      if (error.message) {
        this.error = `Erreur: ${error.message}`;
      } else {
        this.error = 'Erreur lors du chargement des statistiques. Veuillez réessayer.';
      }
    } finally {
      this.loading = false;
    }
  }

  private async calculateStatistics(): Promise<void> {
    const missions = this.reparateurMissions;
    
    // Calculer les statistiques de mission
    this.missionStats = {
      total: missions.length,
      completed: missions.filter(m => m.statut === 'terminée').length,
      inProgress: missions.filter(m => m.statut === 'en cours').length,
      pending: missions.filter(m => m.statut === 'en attente').length,
      assigned: missions.filter(m => m.statut === 'assignée').length,
      refused: missions.filter(m => m.statut === 'non assignée').length,
      epave: missions.filter(m => m.statut === 'épave').length
    };

    // Calculer les statistiques financières
    const missionsWithDevis = missions.filter(m => m.devis && m.devis > 0);
    const missionsWithFacture = missions.filter(m => m.factureFinale && m.factureFinale > 0);
    
    const totalDevis = missions.reduce((sum, mission) => sum + (mission.devis || 0), 0);
    const totalFactures = missions.reduce((sum, mission) => sum + (mission.factureFinale || 0), 0);
    const commissionRate = 0.15; // 15% de commission
    const totalCommissions = totalFactures * commissionRate;

    this.financialStats = {
      totalDevis: totalDevis,
      totalFactures: totalFactures,
      totalCommissions: totalCommissions,
      netBalance: totalFactures - totalCommissions,
      averageDevis: missionsWithDevis.length > 0 ? totalDevis / missionsWithDevis.length : 0,
      averageFacture: missionsWithFacture.length > 0 ? totalFactures / missionsWithFacture.length : 0
    };

    // Créer la liste des missions récentes avec les informations de l'assuré et du véhicule
    const recentMissions = missions
      .sort((a, b) => new Date(b.dateCreation).getTime() - new Date(a.dateCreation).getTime())
      .slice(0, 10);

    // Récupérer les informations de l'assuré et du véhicule pour chaque mission
    const missionsWithDetails = await Promise.all(
      recentMissions.map(async (mission) => {
        let assureName = 'N/A';
        let vehiculeInfo = 'N/A';

        if (mission.sinistre && mission.sinistre.id) {
          try {
            const assure = await firstValueFrom(this.assureService.getAssureBySinistreId(mission.sinistre.id));
            assureName = `${assure.name} ${assure.prenom}`;
            
            const vehicule = this.assureService.getVehiculeBySinistreId(assure, mission.sinistre.id);
            if (vehicule) {
              vehiculeInfo = `${vehicule.marque} ${vehicule.modele} (${vehicule.immatriculation})`;
            }
          } catch (error) {
            console.error(`Erreur lors de la récupération des détails pour la mission ${mission.id}:`, error);
          }
        }

        return {
          id: mission.id || 0,
          title: `Mission #${mission.id}`,
          status: mission.statut,
          date: new Date(mission.dateCreation).toLocaleDateString('fr-FR'),
          vehicle: mission.sinistre?.type || 'N/A',
          client: mission.sinistre?.contactAssistance || 'N/A',
          devis: mission.devis || 0,
          facture: mission.factureFinale || 0,
          typeSinistre: mission.sinistre?.type || 'N/A',
          assureName: assureName,
          vehiculeInfo: vehiculeInfo
        };
      })
    );

    this.recentMissions = missionsWithDetails;
  }

  getStatusColor(status: string): string {
    switch (status.toLowerCase()) {
      case 'terminée':
        return 'success';
      case 'en cours':
        return 'warning';
      case 'en attente':
        return 'info';
      case 'assignée':
        return 'primary';
      case 'non assignée':
        return 'secondary';
      case 'épave':
        return 'danger';
      default:
        return 'secondary';
    }
  }

  getStatusLabel(status: string): string {
    switch (status.toLowerCase()) {
      case 'terminée':
        return 'Terminée';
      case 'en cours':
        return 'En cours';
      case 'en attente':
        return 'En attente';
      case 'assignée':
        return 'Assignée';
      case 'non assignée':
        return 'Non assignée';
      case 'épave':
        return 'Épave';
      default:
        return status;
    }
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'MAD'
    }).format(amount);
  }

  getPercentage(value: number, total: number): number {
    return total > 0 ? Math.round((value / total) * 100) : 0;
  }

  // Méthode pour ouvrir la modale de visualisation d'une mission
  openMissionView(missionId: number): void {
    const mission = this.reparateurMissions.find(m => m.id === missionId);
    if (mission) {
      this.selectedMission = mission;
      this.missionViewEdition = false; // Mode lecture par défaut
      this.showMissionView = true;
    }
  }

  // Méthode pour fermer la modale
  closeMissionView(): void {
    this.showMissionView = false;
    this.selectedMission = null;
  }

  // Méthode pour ouvrir la modale en mode édition
  openMissionViewEdit(missionId: number): void {
    const mission = this.reparateurMissions.find(m => m.id === missionId);
    if (mission) {
      this.selectedMission = mission;
      this.missionViewEdition = true; // Mode édition
      this.showMissionView = true;
    }
  }

  // Méthode pour gérer la mise à jour d'une mission
  onMissionUpdated(updatedMission: Mission): void {
    // Mettre à jour la mission dans la liste
    const index = this.reparateurMissions.findIndex(m => m.id === updatedMission.id);
    if (index !== -1) {
      this.reparateurMissions[index] = updatedMission;
      // Recalculer les statistiques
      this.calculateStatistics();
    }
  }
} 