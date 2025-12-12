import { Component, OnInit, OnDestroy, AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { filter, takeUntil, distinctUntilChanged, debounceTime } from 'rxjs/operators';
import { Subject, combineLatest, firstValueFrom } from 'rxjs';
import { MissionService } from '../../../../../services/mission.service';
import { Mission, Reparateur } from '../../../../../services/models-api.interface';
import { AuthService } from '../../../../../services/auth.service';
import { ReparateurService } from '../../../../../services/reparateur.service';
import { AssureService } from '../../../../../services/assure.service';
import {
  StatisticsService,
  MissionStatsDTO,
  FinancialStatsDTO,
  RecentMissionDTO
} from '../../../../../services/statistics.service';
import { MissionViewComponent } from '../reparation-management/mission-view.component';
import { getStatutCategorie } from '../../../.././shared/utils/statut-mapper';
import { MissionFilterService } from '../reparation-management/mission-filter.service';



// Utilisation des interfaces du StatisticsService backend
interface RecentMissionDisplay extends RecentMissionDTO {
  typeSinistre?: string;
  assureName?: string;
  vehiculeInfo?: string;
  assureInfo?: any;
  vehicule?: any;
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
  // Statistiques provenant du backend (puis recalculées côté front)
  missionStats: MissionStatsDTO = {
    total: 0,
    completed: 0,
    inProgress: 0,
    pending: 0,
    assigned: 0,
    refused: 0,
    epave: 0
  };

  financialStats: FinancialStatsDTO = {
    totalDevis: 0,
    totalFactures: 0,
    totalCommissions: 0,
    netBalance: 0,
    averageDevis: 0,
    averageFacture: 0,
    averageCommission: 0
  };

  recentMissions: RecentMissionDisplay[] = [];
  loading = true;
  error: string | null = null;
  reparateurMissions: Mission[] = [];
  currentReparateur: Reparateur | null = null;

  // Propriétés pour la modale mission-view
  showMissionView = false;
  selectedMission: Mission | null = null;
  missionViewEdition = false;

  private destroy$ = new Subject<void>();
  private isInitialized = false;
  private hasLoadedData = false;
  private lastLoadedAt = 0;
  private cdr: ChangeDetectorRef;
  private checkDataIntervalId: any = null;

  constructor(
    private missionService: MissionService,
    private missionFilterService: MissionFilterService,
    private authService: AuthService,
    private reparateurService: ReparateurService,
    private assureService: AssureService,
    private statisticsService: StatisticsService,
    private router: Router,
    private route: ActivatedRoute,
    cdr: ChangeDetectorRef
  ) {
    this.cdr = cdr;
  }

  goToMissions(filtre: 'nouvelles' | 'enCours' | 'terminees') {
  this.missionFilterService.setFiltre(filtre);
  this.router.navigate(['/garage/reparations']);
}

  ngOnInit(): void {
    // Charger les données immédiatement
    this.loadStatistics();
    this.isInitialized = true;

    // Écouter les changements de route
    combineLatest([
      this.router.events.pipe(
        filter(event => event instanceof NavigationEnd),
        debounceTime(150),
        distinctUntilChanged()
      ),
      this.route.url
    ])
      .pipe(takeUntil(this.destroy$))
      .subscribe(([event, urlSegments]) => {
        const currentUrl = this.router.url;
        console.log('Navigation détectée:', currentUrl);

        if (currentUrl.includes('/garage/statistiques') || currentUrl.includes('/garage/statistics')) {
          console.log('Page statistiques détectée, vérification des données...');
          const now = Date.now();
          if (!this.hasLoadedData || this.reparateurMissions.length === 0 || (now - this.lastLoadedAt) > 60_000) {
            console.log('Rechargement des données...');
            this.loadStatistics();
          }
        }
      });

  // Écouter les changements de paramètres de route
    this.route.params
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        console.log('Paramètres de route changés:', params);
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
    setTimeout(() => {
      if (this.isInitialized && this.reparateurMissions.length === 0 && !this.loading) {
        console.log('Aucune donnée trouvée après initialisation, rechargement...');
        this.loadStatistics();
      }
    }, 200);

    if (this.checkDataIntervalId) {
      clearInterval(this.checkDataIntervalId);
      this.checkDataIntervalId = null;
    }
  }

  ngOnDestroy(): void {
    if (this.checkDataIntervalId) {
      clearInterval(this.checkDataIntervalId);
      this.checkDataIntervalId = null;
    }
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Rafraîchissement manuel
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

      console.log('Début du chargement des statistiques via API backend...');

      // 1️⃣ Récupérer l'UUID Keycloak du réparateur connecté
      const keycloakId = this.authService.getKeycloakId();
      console.log('Keycloak ID récupéré:', keycloakId);

      if (!keycloakId) {
        throw new Error('Utilisateur non connecté');
      }

      // 2️⃣ Récupérer le réparateur par son ID Keycloak
      const reparateur = await firstValueFrom(
        this.reparateurService.getReparateurByKeycloakId(keycloakId)
      );
      if (!reparateur || !reparateur.id) {
        throw new Error('Réparateur non trouvé');
      }
      this.currentReparateur = reparateur;
      console.log('Réparateur trouvé:', reparateur.id, reparateur.name);

      // 3️⃣ Charger les statistiques depuis le backend
      const stats = await firstValueFrom(
        this.statisticsService.getStatisticsByReparateurId(reparateur.id)
      );
      console.log('Statistiques reçues du backend:', stats);

      // On enregistre quand même celles du back (utile pour assigned / refused / epave)
      this.missionStats = stats.missionStats;
      this.financialStats = stats.financialStats;

      // 4️⃣ Transformer les missions récentes pour l'affichage
      this.recentMissions = stats.recentMissions.map(m => ({
        ...m,
        typeSinistre: m.client || 'N/A',
        assureName: 'N/A',
        vehiculeInfo: m.vehicle || 'N/A'
      }));

      // 5️⃣ Charger aussi les missions pour ce réparateur
      const allMissions = await firstValueFrom(this.missionService.getAllMissions());
      this.reparateurMissions = allMissions.filter(
        m => m.reparateur && m.reparateur.useridKeycloak === keycloakId
      );

      console.log('Missions du réparateur pour les stats:', this.reparateurMissions.length);

      // 6️⃣ Recalcul propre des statistiques côté front avec le mapper
      this.missionStats = {
        total: this.reparateurMissions.length,
        completed: this.reparateurMissions.filter(
          m => getStatutCategorie(m.statut) === 'TERMINEE'
        ).length,
        inProgress: this.reparateurMissions.filter(
          m => getStatutCategorie(m.statut) === 'EN_COURS'
        ).length,
        pending: this.reparateurMissions.filter(
          m => getStatutCategorie(m.statut) === 'NON_TRAITEE'
        ).length,
        // Ces trois champs restent basés sur ce que te renvoie le back (si tu veux)
        assigned: stats.missionStats.assigned,
        refused: stats.missionStats.refused,
        epave: stats.missionStats.epave
      };

      console.log('=== STATISTIQUES APRÈS RECALCUL FRONT ===');
      console.log('Total:', this.missionStats.total);
      console.log('Terminées:', this.missionStats.completed);
      console.log('En cours:', this.missionStats.inProgress);
      console.log('En attente:', this.missionStats.pending);
      console.log('Assignées:', this.missionStats.assigned);
      console.log('Refusées:', this.missionStats.refused);
      console.log('Épaves:', this.missionStats.epave);
      console.log('=========================================');

      this.hasLoadedData = true;
      this.lastLoadedAt = Date.now();
      this.cdr.detectChanges();
      console.log('Statistiques chargées avec succès depuis le backend');

    } catch (error: any) {
      console.error('Erreur lors du chargement des statistiques:', error);
      await this.loadStatisticsFallback();
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
    }
  }

  // Fallback si l'API backend échoue
  private async loadStatisticsFallback(): Promise<void> {
    try {
      console.log('Utilisation du fallback pour calculer les statistiques localement...');

      const keycloakId = this.authService.getKeycloakId();
      if (!keycloakId) {
        this.error = 'Utilisateur non connecté';
        return;
      }

      const allMissions = await firstValueFrom(this.missionService.getAllMissions());
      this.reparateurMissions = allMissions.filter(
        m => m.reparateur && m.reparateur.useridKeycloak === keycloakId
      );

      await this.calculateStatisticsLocally();
      this.hasLoadedData = true;
      this.lastLoadedAt = Date.now();

    } catch (fallbackError: any) {
      console.error('Erreur lors du fallback:', fallbackError);
      this.error = 'Erreur lors du chargement des statistiques. Veuillez réessayer.';
    }
  }

  // Calcul local complet (utilise aussi le mapper)
  private async calculateStatisticsLocally(): Promise<void> {
    const missions = this.reparateurMissions;

    console.log('=== DEBUG STATISTIQUES (fallback) ===');
    console.log('Nombre total de missions:', missions.length);
    missions.forEach((mission, index) => {
      console.log(`Mission ${index + 1} (ID: ${mission.id}): statut = "${mission.statut}"`);
    });
    console.log('=====================================');

    this.missionStats = {
      total: missions.length,
      completed: missions.filter(
        m => getStatutCategorie(m.statut) === 'TERMINEE'
      ).length,
      inProgress: missions.filter(
        m => getStatutCategorie(m.statut) === 'EN_COURS'
      ).length,
      pending: missions.filter(
        m => getStatutCategorie(m.statut) === 'NON_TRAITEE'
      ).length,
      assigned: missions.filter(m => {
        const s = (m.statut || '').toLowerCase();
        return s === 'assignée' || s === 'assignee';
      }).length,
      refused: missions.filter(m => {
        const s = (m.statut || '').toLowerCase();
        return ['non assignée', 'non assignee', 'refusée', 'refusee', 'rejetée', 'rejetee'].includes(s);
      }).length,
      epave: missions.filter(m => {
        const s = (m.statut || '').toLowerCase();
        return ['épave', 'epave', 'déclarée épave', 'declaree epave'].includes(s);
      }).length
    };

    console.log('=== STATISTIQUES CALCULÉES (fallback) ===');
    console.log('Total:', this.missionStats.total);
    console.log('Terminées:', this.missionStats.completed);
    console.log('En cours:', this.missionStats.inProgress);
    console.log('En attente:', this.missionStats.pending);
    console.log('Assignées:', this.missionStats.assigned);
    console.log('Refusées:', this.missionStats.refused);
    console.log('Épaves:', this.missionStats.epave);
    console.log('========================================');

    // (le reste de calculateStatisticsLocally pour les stats financières et recentMissions)
    // ... tu peux garder tout ton bloc existant ici, il n'a pas d'impact sur les compteurs
  }

 private normalizeMissionStatus(statut?: string | null): string {
  return (statut ?? '')
    .toUpperCase()
    .trim()
    .replace(/\s+/g, '_');
}

formatMissionStatut(statut?: string | null): string {
  const s = this.normalizeMissionStatus(statut);

  const mapping: Record<string, string> = {
    'NON_TRAITE': 'Non traitée',
    'NON_TRAITEE': 'Non traitée',
    'EN_ATTENTE': 'En attente',
    'EN_ATTENTE_TRAITEMENT': 'En attente de traitement',
    'EN_ATTENTE_EXPERTISE': "En attente d’expertise",
    'EN_ATTENTE_RDV': 'En attente de rendez-vous',
    'EN_ATTENTE_REPARATION': 'En attente de réparation',

    'EN_COURS': 'En cours',
    'EN_COURS_REPARATION': 'En cours de réparation',
    'EN_COURS_DE_REPARATION': 'En cours de réparation',

    'TERMINEE': 'Terminée',
    'REPARATION_TERMINEE': 'Réparation terminée',
  };

  return mapping[s] ?? (s ? s.replace(/_/g, ' ').toLowerCase() : 'Non traitée');
}

/**
 * Retourne le suffixe de classe utilisé dans ton HTML:
 * status-success | status-warning | status-info
 */
getStatusBadgeClass(statut?: string | null): string {
  const group = this.missionFilterService.getGroupFromStatus(statut ?? '');

  if (group === 'terminees') return 'success';
  if (group === 'enCours') return 'warning';
  // nouvelles + défaut => info
  return 'info';
}


  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
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

  openMissionView(missionId: number): void {
    const mission = this.reparateurMissions.find(m => m.id === missionId);
    if (mission) {
      this.selectedMission = mission;
      this.missionViewEdition = false;
      this.showMissionView = true;
    }
  }

  closeMissionView(): void {
    this.showMissionView = false;
    this.selectedMission = null;
  }

  openMissionViewEdit(missionId: number): void {
    const mission = this.reparateurMissions.find(m => m.id === missionId);
    if (mission) {
      this.selectedMission = mission;
      this.missionViewEdition = true;
      this.showMissionView = true;
    }
  }

  onMissionUpdated(updatedMission: Mission): void {
    const index = this.reparateurMissions.findIndex(m => m.id === updatedMission.id);
    if (index !== -1) {
      this.reparateurMissions[index] = updatedMission;
      this.calculateStatisticsLocally();
    }
    this.cdr.detectChanges();
  }
}
