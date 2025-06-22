import { Injectable, forwardRef, Inject } from '@angular/core';
import { Observable, forkJoin, map, catchError, of } from 'rxjs';
import { MissionService } from './mission.service';
import { ReparationService } from './reparation.service';
import { MissionDTO, ReparationDTO } from './interfaces';

export interface MissionStats {
  total: number;
  completed: number;
  inProgress: number;
  pending: number;
}

export interface FinancialStats {
  totalInvoices: number;
  totalCommissions: number;
  netBalance: number;
}

export interface RecentMission {
  id: string;
  date: Date;
  status: 'completed' | 'in_progress' | 'pending';
  amount: number;
  title?: string;
  description?: string;
}

export interface DashboardData {
  missionStats: MissionStats;
  financialStats: FinancialStats;
  recentMissions: RecentMission[];
}

export interface PeriodStats {
  current: number;
  previous: number;
  percentageChange: number;
}

export interface DetailedMissionStats {
  total: PeriodStats;
  completed: PeriodStats;
  inProgress: PeriodStats;
  pending: PeriodStats;
}

export enum DashboardMissionStatus {
  COMPLETED = 'completed',
  IN_PROGRESS = 'in_progress',
  PENDING = 'pending'
}

export const MISSION_STATUS_MAPPING: Record<string, DashboardMissionStatus> = {
  'TERMINEE': DashboardMissionStatus.COMPLETED,
  'EN_COURS': DashboardMissionStatus.IN_PROGRESS,
  'ASSIGNEE': DashboardMissionStatus.PENDING,
  'ANNULEE': DashboardMissionStatus.PENDING
};

export interface PeriodFilter {
  startDate: Date;
  endDate: Date;
  type: 'day' | 'week' | 'month' | 'year';
}

@Injectable({
  providedIn: 'root'
})
export class DashboardGaragisteService {
  constructor(
    @Inject(forwardRef(() => MissionService)) private missionService: MissionService,
    @Inject(forwardRef(() => ReparationService)) private reparationService: ReparationService
  ) {}

  // Toutes les méthodes du service restent inchangées
  getDashboardData(): Observable<DashboardData> {
    return forkJoin({
      missions: this.missionService.getAllMissions(),
      reparations: this.reparationService.getAllReparations()
    }).pipe(
      map(({ missions, reparations }) => {
        console.log('Données reçues de l\'API:', { missions, reparations });

        if (missions.length === 0 && reparations.length === 0) {
          console.warn('L\'API a retourné des listes vides. Le tableau de bord affichera des zéros, ce qui est normal si la base de données est vide.');
        }

        return {
          missionStats: this.calculateMissionStats(missions),
          financialStats: this.calculateFinancialStats(reparations),
          recentMissions: this.getRecentMissions(missions, 10)
        };
      }),
      catchError(error => {
        console.error('Erreur détaillée lors du chargement des données du dashboard:', error);
        return of(this.getDefaultDashboardData());
      })
    );
  }

  /**
   * Calcule les statistiques des missions
   */
  private calculateMissionStats(missions: MissionDTO[]): MissionStats {
    const total = missions.length;
    const completed = missions.filter(m => this.mapMissionStatus(m.statut) === DashboardMissionStatus.COMPLETED).length;
    const inProgress = missions.filter(m => this.mapMissionStatus(m.statut) === DashboardMissionStatus.IN_PROGRESS).length;
    const pending = missions.filter(m => this.mapMissionStatus(m.statut) === DashboardMissionStatus.PENDING).length;

    return {
      total,
      completed,
      inProgress,
      pending
    };
  }

  /**
   * Calcule les statistiques financières basées sur les réparations
   */
  private calculateFinancialStats(reparations: ReparationDTO[]): FinancialStats {
    const totalInvoices = reparations.reduce((sum, rep) => sum + (rep.cout || 0), 0);
    const commissionRate = 0.1; // 10% de commission par défaut
    const totalCommissions = totalInvoices * commissionRate;
    const netBalance = totalInvoices - totalCommissions;

    return {
      totalInvoices,
      totalCommissions,
      netBalance
    };
  }

  /**
   * Récupère les missions récentes
   */
  private getRecentMissions(missions: MissionDTO[], limit: number = 10): RecentMission[] {
    return missions
      .sort((a, b) => new Date(b.dateDebut).getTime() - new Date(a.dateDebut).getTime())
      .slice(0, limit)
      .map(mission => ({
        id: mission.id?.toString() || 'N/A',
        date: new Date(mission.dateDebut),
        status: this.mapMissionStatus(mission.statut),
        amount: this.estimateMissionAmount(mission),
        title: mission.titre,
        description: mission.description
      }));
  }

  /**
   * Mappe les statuts de l'API vers les statuts du dashboard
   */
  private mapMissionStatus(apiStatus: string): DashboardMissionStatus {
    return MISSION_STATUS_MAPPING[apiStatus] || DashboardMissionStatus.PENDING;
  }

  /**
   * Estime le montant d'une mission (à adapter selon votre logique métier)
   */
  private estimateMissionAmount(mission: MissionDTO): number {
    // Logique d'estimation basée sur la priorité et le type de mission
    const baseAmount = 500;
    const priorityMultiplier = this.getPriorityMultiplier(mission.priorite);
    return Math.round(baseAmount * priorityMultiplier);
  }

  /**
   * Retourne un multiplicateur basé sur la priorité
   */
  private getPriorityMultiplier(priorite: string): number {
    switch (priorite) {
      case 'URGENTE': return 2.0;
      case 'HAUTE': return 1.5;
      case 'NORMALE': return 1.0;
      case 'BASSE': return 0.8;
      default: return 1.0;
    }
  }

  /**
   * Calcule les statistiques détaillées avec comparaison de période
   */
  getDetailedMissionStats(currentPeriod: PeriodFilter, previousPeriod: PeriodFilter): Observable<DetailedMissionStats> {
    return forkJoin({
      currentMissions: this.getMissionsByPeriod(currentPeriod),
      previousMissions: this.getMissionsByPeriod(previousPeriod)
    }).pipe(
      map(({ currentMissions, previousMissions }) => {
        const currentStats = this.calculateMissionStats(currentMissions);
        const previousStats = this.calculateMissionStats(previousMissions);

        return {
          total: this.calculatePeriodStats(currentStats.total, previousStats.total),
          completed: this.calculatePeriodStats(currentStats.completed, previousStats.completed),
          inProgress: this.calculatePeriodStats(currentStats.inProgress, previousStats.inProgress),
          pending: this.calculatePeriodStats(currentStats.pending, previousStats.pending)
        };
      })
    );
  }

  /**
   * Récupère les missions pour une période donnée
   */
  private getMissionsByPeriod(period: PeriodFilter): Observable<MissionDTO[]> {
    return this.missionService.getAllMissions().pipe(
      map(missions => missions.filter(mission => {
        const missionDate = new Date(mission.dateDebut);
        return missionDate >= period.startDate && missionDate <= period.endDate;
      }))
    );
  }

  /**
   * Calcule les statistiques de période avec pourcentage de changement
   */
  private calculatePeriodStats(current: number, previous: number): PeriodStats {
    const percentageChange = previous === 0 ? 0 : ((current - previous) / previous) * 100;
    return {
      current,
      previous,
      percentageChange: Math.round(percentageChange * 10) / 10 // Arrondi à 1 décimale
    };
  }

  /**
   * Retourne des données par défaut en cas d'erreur
   */
  private getDefaultDashboardData(): DashboardData {
    return {
      missionStats: {
        total: 0,
        completed: 0,
        inProgress: 0,
        pending: 0
      },
      financialStats: {
        totalInvoices: 0,
        totalCommissions: 0,
        netBalance: 0
      },
      recentMissions: []
    };
  }

  /**
   * Rafraîchit les données du dashboard
   */
  refreshDashboard(): Observable<DashboardData> {
    return this.getDashboardData();
  }

  /**
   * Récupère les statistiques pour une période spécifique
   */
  getStatsForPeriod(period: PeriodFilter): Observable<MissionStats> {
    return this.getMissionsByPeriod(period).pipe(
      map(missions => this.calculateMissionStats(missions))
    );
  }
}