import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, switchMap } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../environments/environment';
import { ReparateurService } from './reparateur.service';

// DTOs correspondant au backend
export interface MissionStatsDTO {
  total: number;
  completed: number;
  inProgress: number;
  pending: number;
  assigned: number;
  refused: number;
  epave: number;
}

export interface FinancialStatsDTO {
  totalDevis: number;
  totalFactures: number;
  totalCommissions: number;
  netBalance: number;
  averageDevis: number;
  averageFacture: number;
  averageCommission: number;
}

export interface RecentMissionDTO {
  id: number;
  title: string;
  status: string;
  date: string;
  vehicle: string;
  client: string;
  devis: number;
  facture: number;
  montantCommission: number;
}

export interface StatisticsResponseDTO {
  missionStats: MissionStatsDTO;
  financialStats: FinancialStatsDTO;
  recentMissions: RecentMissionDTO[];
}

@Injectable({
  providedIn: 'root'
})
export class StatisticsService {
  private apiUrl = `${environment.apiUrl}/statistics`;

  constructor(
    private http: HttpClient,
    private reparateurService: ReparateurService
  ) {}

  /**
   * Récupère les statistiques pour un réparateur par son ID
   */
  getStatisticsByReparateurId(reparateurId: number): Observable<StatisticsResponseDTO> {
    return this.http.get<StatisticsResponseDTO>(`${this.apiUrl}/${reparateurId}`);
  }

  /**
   * Récupère les statistiques pour le réparateur connecté (via Keycloak ID)
   */
  getStatisticsByKeycloakId(keycloakId: string): Observable<StatisticsResponseDTO> {
    return this.reparateurService.getReparateurByKeycloakId(keycloakId).pipe(
      switchMap(reparateur => {
        if (reparateur && reparateur.id) {
          return this.getStatisticsByReparateurId(reparateur.id);
        }
        throw new Error('Réparateur non trouvé');
      }),
      catchError(error => {
        console.error('Erreur lors de la récupération des statistiques:', error);
        throw error;
      })
    );
  }

  /**
   * Retourne des statistiques vides (utile en cas d'erreur)
   */
  getEmptyStatistics(): StatisticsResponseDTO {
    return {
      missionStats: {
        total: 0,
        completed: 0,
        inProgress: 0,
        pending: 0,
        assigned: 0,
        refused: 0,
        epave: 0
      },
      financialStats: {
        totalDevis: 0,
        totalFactures: 0,
        totalCommissions: 0,
        netBalance: 0,
        averageDevis: 0,
        averageFacture: 0,
        averageCommission: 0
      },
      recentMissions: []
    };
  }

  /**
   * Récupère les statistiques financières globales pour l'admin
   */
  getAdminFinancialStats(): Observable<AdminFinancialStatsDTO> {
    return this.http.get<AdminFinancialStatsDTO>(`${this.apiUrl}/admin/financial`);
  }
}

// DTO pour les statistiques financières admin
export interface MissionFinancialDTO {
  id: number;
  statut: string;
  commissionStatut: string;
  devis: number;
  factureFinale: number;
  commissionMontant: number;
  commissionPourcentage: number | null;
  dateCreation: string;
  assureNom: string;
  assurePrenom: string;
  assureEmail: string;
  reparateurId: number;
  reparateurNom: string;
  reparateurPrenom: string;
  reparateurCommission: number | null;
  sinistreId: number;
  typeSinistre: string;
}

export interface AdminFinancialStatsDTO {
  totalDevis: number;
  totalFactures: number;
  totalCommissions: number;
  netBalance: number;
  totalMissions: number;
  missionsTerminees: number;
  missionsEnCours: number;
  commissionsPayees: number;
  commissionsNonPayees: number;
  averageDevis: number;
  averageFacture: number;
  averageCommission: number;
  missions: MissionFinancialDTO[];
}

