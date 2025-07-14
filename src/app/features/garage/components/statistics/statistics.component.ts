import { Component, OnInit, OnDestroy, AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { filter, takeUntil, distinctUntilChanged } from 'rxjs/operators';
import { Subject, combineLatest } from 'rxjs';
import { MissionService } from '../../../../../services/mission.service';
import { Mission } from '../../../../../services/models-api.interface';
import { AuthService } from '../../../../../services/auth.service';
import { ReparateurService } from '../../../../../services/reparateur.service';
import { AssureService, ASSURE, Vehicule } from '../../../../../services/assure.service';
import { firstValueFrom, forkJoin } from 'rxjs';
import { MissionViewComponent } from '../reparation-management/mission-view.component';
import { Reparateur } from '../../../../../services/models-api.interface';

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
  assureInfo: any;
  vehicule: any;
}

@Component({
  selector: 'app-statistics',
  standalone: true,
  imports: [
    CommonModule,
    MissionViewComponent
  ],
  templateUrl: './statistics.component.html',
  styleUrls: ['./statistics.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StatisticsComponent implements OnInit, OnDestroy, AfterViewInit {
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

  private destroy$ = new Subject<void>();
  private currentRoute: string = '';
  private isInitialized: boolean = false;
  private hasLoadedData: boolean = false;
  private cdr: ChangeDetectorRef;

  constructor(
    private missionService: MissionService,
    private authService: AuthService,
    private reparateurService: ReparateurService,
    private assureService: AssureService,
    private router: Router,
    private route: ActivatedRoute,
    cdr: ChangeDetectorRef
  ) {
    this.cdr = cdr;
  }

  ngOnInit(): void {
    // Charger les données immédiatement
    this.loadStatistics();
    this.isInitialized = true;
    
    // Écouter les changements de route avec une logique améliorée
    combineLatest([
      this.router.events.pipe(
        filter(event => event instanceof NavigationEnd),
        distinctUntilChanged()
      ),
      this.route.url
    ]).pipe(
      takeUntil(this.destroy$)
    ).subscribe(([event, urlSegments]) => {
      const currentUrl = this.router.url;
      console.log('Navigation détectée:', currentUrl);
      
      // Vérifier si on est sur la page statistiques
      if (currentUrl.includes('/garage/statistiques') || currentUrl.includes('/garage/statistics')) {
        console.log('Page statistiques détectée, vérification des données...');
        
        // Si on n'a pas encore chargé de données ou si on revient sur la page
        if (!this.hasLoadedData || this.reparateurMissions.length === 0) {
          console.log('Rechargement des données...');
          this.loadStatistics();
        }
      }
    });

    // Écouter les changements de paramètres de route
    this.route.params.pipe(
      takeUntil(this.destroy$)
    ).subscribe(params => {
      console.log('Paramètres de route changés:', params);
      // Forcer le rechargement si on navigue vers ce composant
      if (this.isInitialized) {
        setTimeout(() => {
          if (this.reparateurMissions.length === 0 && !this.loading) {
            console.log('Rechargement après changement de paramètres...');
            this.loadStatistics();
          }
        }, 100);
      }
    });
  }

  ngAfterViewInit(): void {
    // Vérifier si les données sont chargées après l'initialisation de la vue
    setTimeout(() => {
      if (this.isInitialized && this.reparateurMissions.length === 0 && !this.loading) {
        console.log('Aucune donnée trouvée après initialisation, rechargement...');
        this.loadStatistics();
      }
    }, 200);

    // Vérifier périodiquement si les données sont chargées
    const checkDataInterval = setInterval(() => {
      if (this.isInitialized && this.reparateurMissions.length === 0 && !this.loading) {
        console.log('Vérification périodique: rechargement des données...');
        this.loadStatistics();
      } else if (this.reparateurMissions.length > 0) {
        // Si on a des données, arrêter la vérification
        clearInterval(checkDataInterval);
      }
    }, 1000);

    // Nettoyer l'intervalle quand le composant est détruit
    this.destroy$.subscribe(() => {
      clearInterval(checkDataInterval);
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Méthode publique pour rafraîchir les statistiques
  refreshStatistics(): void {
    console.log('Rafraîchissement manuel des statistiques...');
    this.loadStatistics();
    this.cdr.detectChanges();
  }

  private async loadStatistics(): Promise<void> {
    try {
      this.loading = true;
      this.error = null;
      this.cdr.detectChanges();

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
      await this.calculateStatistics();
      
      this.hasLoadedData = true;
      this.cdr.detectChanges();
      console.log('Statistiques chargées avec succès');
      
    } catch (error: any) {
      console.error('Erreur lors du chargement des statistiques:', error);
      
      if (error.message) {
        this.error = `Erreur: ${error.message}`;
      } else {
        this.error = 'Erreur lors du chargement des statistiques. Veuillez réessayer.';
      }
      this.cdr.detectChanges();
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
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
      assigned: missions.filter(m => m.statut === 'en cours').length,
      refused: missions.filter(m => m.statut === 'non assignée').length,
      epave: missions.filter(m => m.statut === 'épave').length
    };

    // Calculer les statistiques financières
    const missionsWithDevis = missions.filter(m => m.devis && m.devis > 0);
    const missionsWithFacture = missions.filter(m => m.factureFinale && m.factureFinale > 0);
    const totalDevis = missions.reduce((sum, mission) => sum + (mission.devis || 0), 0);
    const totalFactures = missions.reduce((sum, mission) => sum + (mission.factureFinale || 0), 0);
    // Utiliser la commission réelle du réparateur pour chaque mission
    const totalCommissions = missions.reduce((sum, mission) => {
      const taux = mission.reparateur?.commission ?? 0.15; // fallback 15% si non défini
      return sum + ((mission.factureFinale || 0) * (taux / 100));
    }, 0);
    this.financialStats = {
      totalDevis: totalDevis,
      totalFactures: totalFactures,
      totalCommissions: totalCommissions,
      netBalance: totalFactures - totalCommissions,
      averageDevis: missionsWithDevis.length > 0 ? totalDevis / missionsWithDevis.length : 0,
      averageFacture: missionsWithFacture.length > 0 ? totalFactures / missionsWithFacture.length : 0
    };

    // Optimisation : cache local pour éviter les appels multiples pour le même sinistre
    const assureCache = new Map<number, any>();
    const vehiculeCache = new Map<number, any>();

    const recentMissions = missions
      .sort((a, b) => new Date(b.dateCreation).getTime() - new Date(a.dateCreation).getTime())
      .slice(0, 10);

    const missionsWithDetails = await Promise.all(
      recentMissions.map(async (mission) => {
        let assureName = 'N/A';
        let vehiculeInfo = 'N/A';
        let assureObj: any = null;
        let vehiculeObj: any = null;
        if (mission.sinistre && mission.sinistre.id) {
          try {
            // Utiliser le cache local pour l'assuré
            let assure = assureCache.get(mission.sinistre.id);
            if (!assure) {
              assure = await firstValueFrom(this.assureService.getAssureBySinistreId(mission.sinistre.id));
              if (assure) assureCache.set(mission.sinistre.id, assure);
            }
            if (assure) {
              assureObj = assure;
              assureName = (assure.nom && assure.prenom) ? `${assure.nom} ${assure.prenom}` : (assure.name && assure.prenom) ? `${assure.name} ${assure.prenom}` : assure.name || assure.nom || 'N/A';
              // Utiliser le cache local pour le véhicule
              let vehicule = vehiculeCache.get(mission.sinistre.id);
              if (!vehicule) {
                vehicule = this.assureService.getVehiculeBySinistreId(assure, mission.sinistre.id);
                if (vehicule) vehiculeCache.set(mission.sinistre.id, vehicule);
              }
              if (vehicule) {
                vehiculeObj = vehicule;
                vehiculeInfo = `${vehicule.marque} ${vehicule.modele} (${vehicule.immatriculation})`;
              }
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
          vehiculeInfo: vehiculeInfo,
          assureInfo: assureObj,
          vehicule: vehiculeObj
        };
      })
    );
    this.recentMissions = missionsWithDetails;
    this.cdr.detectChanges();
  }

  getStatusColor(status: string): string {
    switch (status.toLowerCase()) {
      case 'terminée':
        return 'success';
      case 'en cours':
        return 'warning';
      case 'en attente':
        return 'info';
      case 'en cours':
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
      case 'en cours':
        return 'En cours';
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

  getCommissionLabel(): string {
    const commissions = this.reparateurMissions
      .map(m => m.reparateur?.commission)
      .filter((c): c is number => c !== undefined && c !== null);
    if (commissions.length === 0) {
      return '15%';
    }
    const unique = Array.from(new Set(commissions));
    if (unique.length === 1) {
      return unique[0] + '%';
    }
    return 'Variable';
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
    this.cdr.detectChanges();
  }
} 