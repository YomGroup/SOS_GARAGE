import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { MissionService } from '../../../../../../src/services/mission.service';
import { Mission } from '../../../../../../src/services/models-api.interface';
import { CommonModule } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import { DossiersService } from '../../../../../../src/services/dossiers.service';
import { ReparateurService } from '../../../../../../src/services/reparateur.service';
import { StatisticsService, AdminFinancialStatsDTO, MissionFinancialDTO } from '../../../../../../src/services/statistics.service';
import { Reparateur } from '../../../../../../src/services/models-api.interface';
import { FormsModule } from '@angular/forms';
import { DossierViewComponent } from '../dossier-management/dossier-view.component';
import { catchError, forkJoin, of } from 'rxjs';

@Component({
  selector: 'app-gestion-finance',
  templateUrl: './gestion-finance.component.html',
  styleUrls: ['./gestion-finance.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule, DossierViewComponent],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GestionFinanceComponent implements OnInit {


  // Variables d'état originales
  private _missions: Mission[] = [];
  isLoading = true;
  error: string | null = null;
  totalDevis = 0;
  totalFactures = 0;
  totalCommissions = 0;
  netBalance = 0;
  page = 1;
  pageSize = 10;
  filterStatut: string = '';
  filterNom: string = '';
  filterDevisMin: number|null = null;
  filterDevisMax: number|null = null;
  filterFactureMin: number|null = null;
  filterFactureMax: number|null = null;
  filterReparateur: string = '';
  showDossierView = false;
  selectedMission: Mission | null = null;

  // Cache interne
  private _filteredMissionsCache: { 
    key: string, 
    value: Mission[] 
  } | null = null;
  private _paginatedMissionsCache: Mission[] | null = null;

  // Données provenant du backend
  adminStats: AdminFinancialStatsDTO | null = null;
  
  constructor(
    private missionService: MissionService,
    private reparateurService: ReparateurService,
    private statisticsService: StatisticsService,
    private cdr: ChangeDetectorRef,
    private dossiersService: DossiersService
  ) {}

  async ngOnInit(): Promise<void> {
    await this.loadFinancialData();
  }

  onFilterChange(): void {
    this.page = 1;
    this._clearCache();
    this.cdr.detectChanges();
  }

  setPage(page: number): void {
    if (page < 1 || page > this.totalPages) {
      return;
    }
    this.page = page;
    this._paginatedMissionsCache = null;
    this.cdr.detectChanges();
  }

  // Méthode loadFinancialData utilisant l'API backend
  async loadFinancialData(): Promise<void> {
    this.isLoading = true;
    this.error = null;
    this.cdr.detectChanges();
    
    try {
      // Essayer d'abord avec l'API backend optimisée
      const stats = await firstValueFrom(this.statisticsService.getAdminFinancialStats());
      this.adminStats = stats;
      
      // Mettre à jour les KPIs depuis le backend
      this.totalDevis = stats.totalDevis;
      this.totalFactures = stats.totalFactures;
      this.totalCommissions = stats.totalCommissions;
      this.netBalance = stats.netBalance;
      
      console.log('Statistiques financières reçues du backend:', stats);
      // Convertir les missions du backend en format attendu
      this._missions = stats.missions.map(m => this.convertMissionFinancialToMission(m));
      
      this._clearCache();
      this.cdr.detectChanges();
      console.log('Données financières chargées depuis le backend');
      console.log('Missions chargées:', this._missions);
      
    } catch (err) {
      console.warn('API admin/financial non disponible, fallback vers méthode classique', err);
      // Fallback: charger les données de manière classique
      await this.loadFinancialDataFallback();
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  // Convertir MissionFinancialDTO en Mission (pour compatibilité avec le reste du code)
  private convertMissionFinancialToMission(m: MissionFinancialDTO): Mission {
    return {
      id: m.id,
      statut: m.statut,
      commissionStatut: m.commissionStatut,
      devis: m.devis,
      factureFinale: m.factureFinale,
      commissionPourcentage: m.commissionPourcentage,
      commissionMontant: m.commissionMontant,
      dateCreation: m.dateCreation,
      assureName: m.assureNom && m.assurePrenom ? `${m.assureNom} ${m.assurePrenom}` : 'N/A',
      reparateur: m.reparateurId ? {
        id: m.reparateurId,
        name: m.reparateurNom,
        prenom: m.reparateurPrenom,
        commission: m.reparateurCommission
      } : null,
      sinistre: m.sinistreId ? {
        id: m.sinistreId,
        type: m.typeSinistre
      } : null
    } as any;
  }

  // Fallback si l'API backend n'est pas disponible
  async loadFinancialDataFallback(): Promise<void> {
    try {
      const missions = await firstValueFrom(this.missionService.getAllMissions());
      this._missions = await this.enrichMissionsData(missions);
      this.calculateKPIs();
      this._clearCache();
      this.cdr.detectChanges();
    } catch (err) {
      console.error('Erreur lors du chargement des données financières', err);
      this.error = 'Erreur lors du chargement des données financières';
      this.cdr.detectChanges();
    }
  }

  // enrichMissionsData optimisé pour les performances
  private async enrichMissionsData(missions: Mission[]): Promise<Mission[]> {
    // Collecter tous les IDs uniques pour éviter les appels redondants
    const sinistreIds = [...new Set(missions
      .filter(m => m.sinistre?.id)
      .map(m => m.sinistre!.id!)
      .filter(id => id !== undefined))];
    
    const reparateurIds = [...new Set(missions
      .filter(m => m.reparateur?.id && !m.reparateur.commission)
      .map(m => m.reparateur!.id!)
      .filter(id => id !== undefined))];

    // Faire les appels API en parallèle
    const [assuresMap, reparateursMap] = await Promise.all([
      this.loadAssuresMap(sinistreIds),
      this.loadReparateursMap(reparateurIds)
    ]);

    // Enrichir les missions avec les données en cache
    return missions.map(mission => {
      const missionCopy = { ...mission };
      
      // Ajouter le nom de l'assuré
      if (missionCopy.sinistre?.id && assuresMap.has(missionCopy.sinistre.id)) {
        const assure = assuresMap.get(missionCopy.sinistre.id)!;
        missionCopy.assureName = `${assure.name} ${assure.prenom}`;
      } else {
        missionCopy.assureName = 'N/A';
      }

      // Enrichir les données du réparateur si nécessaire
      if (missionCopy.reparateur?.id && !missionCopy.reparateur.commission && reparateursMap.has(missionCopy.reparateur.id)) {
        missionCopy.reparateur = reparateursMap.get(missionCopy.reparateur.id)!;
      }
      console.log('Mission enrichie:', missionCopy);

      return missionCopy;
    });
  }

  // Charger tous les assurés en une seule fois
  private async loadAssuresMap(sinistreIds: number[]): Promise<Map<number, any>> {
    if (sinistreIds.length === 0) return new Map();

    const assuresObservables = sinistreIds.map(id => 
      this.dossiersService.getAssureFromSinistreId(id).pipe(
        catchError(err => {
          console.error(`Erreur assuré sinistre ${id}`, err);
          return of(null);
        })
      )
    );

    const assures = await firstValueFrom(forkJoin(assuresObservables));
    
    const assuresMap = new Map();
    sinistreIds.forEach((id, index) => {
      if (assures[index]) {
        assuresMap.set(id, assures[index]);
      }
    });

    return assuresMap;
  }

  // Charger tous les réparateurs en une seule fois
  private async loadReparateursMap(reparateurIds: number[]): Promise<Map<number, Reparateur>> {
    if (reparateurIds.length === 0) return new Map();

    const reparateursObservables = reparateurIds.map(id => 
      this.reparateurService.getReparateur(id).pipe(
        catchError(err => {
          console.error(`Erreur réparateur ${id}`, err);
          return of(null);
        })
      )
    );

    const reparateurs = await firstValueFrom(forkJoin(reparateursObservables));
    
    const reparateursMap = new Map();
    reparateurIds.forEach((id, index) => {
      if (reparateurs[index]) {
        reparateursMap.set(id, reparateurs[index]);
      }
    });

    return reparateursMap;
  }

  // Getters optimisés avec cache
  get missions(): Mission[] {
    return this._missions;
  }

  get filteredMissions(): Mission[] {
    const cacheKey = this._getFiltersCacheKey();
    
    if (!this._filteredMissionsCache || this._filteredMissionsCache.key !== cacheKey) {
      this._filteredMissionsCache = {
        key: cacheKey,
        value: this._calculateFilteredMissions()
      };
    }
    
    return this._filteredMissionsCache.value;
  }

  get paginatedMissions(): Mission[] {
    if (!this._paginatedMissionsCache) {
      const start = (this.page - 1) * this.pageSize;
      this._paginatedMissionsCache = this.filteredMissions.slice(start, start + this.pageSize);
    }
    return this._paginatedMissionsCache;
  }

  get totalPages(): number {
    return Math.ceil(this.filteredMissions.length / this.pageSize) || 1;
  }

  // Méthodes existantes inchangées
  getCommission(mission: Mission): number {
    //const taux = mission.reparateur?.commission || 0;
    //return (mission.factureFinale || 0) * (taux / 100);
    console.log('Calcul de la commission pour la mission', mission.id, 'Montant de la commission:', mission.commissionMontant);
    return mission.commissionMontant || 0;
  }

  openMissionDetail(missionId: number): void {
    const mission = this.missions.find(m => m.id === missionId);
    if (mission) {
      this.selectedMission = mission;
      this.showDossierView = true;
    }
  }

  closeDossierView(): void {
    this.showDossierView = false;
    this.selectedMission = null;
  }

  onCommissionStatusUpdated(updatedMission: Mission): void {
    const idx = this._missions.findIndex(m => m.id === updatedMission.id);
    if (idx !== -1) {
      this._missions[idx] = updatedMission;
      this.calculateKPIs();
      this._clearCache();
      this.cdr.detectChanges();
    }
    // Suppression de la fermeture automatique du détail
  }

  refreshData(): void {
    this._clearCache();
    this.loadFinancialData();
  }

  resetFilters(): void {
    this.filterStatut = '';
    this.filterNom = '';
    this.filterDevisMin = null;
    this.filterDevisMax = null;
    this.filterFactureMin = null;
    this.filterFactureMax = null;
    this.filterReparateur = '';
    this.page = 1;
    this._clearCache();
    this.cdr.detectChanges();
  }

  shouldShowPage(pageNumber: number): boolean {
    const totalPages = this.totalPages;
    const currentPage = this.page;
    
    // Toujours afficher la première et dernière page
    if (pageNumber === 1 || pageNumber === totalPages) {
      return true;
    }
    
    // Afficher les pages autour de la page courante (±2)
    return pageNumber >= currentPage - 2 && pageNumber <= currentPage + 2;
  }

  formatCurrency(value: number): string {
    return value.toFixed(2).replace('.', ',') + ' €';
  }

  markCommissionAsPaid(mission: Mission): void {
    if (!mission.id) return;
    this.isLoading = true;
    this.missionService.updateMissionPartial(mission.id, { commissionStatut: 'payée' })
      .subscribe({
        next: (updatedMission) => {
          this.onCommissionStatusUpdated({ ...mission, commissionStatut: 'payée' });
          this.isLoading = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.isLoading = false;
          this.error = 'Erreur lors de la mise à jour du statut de commission';
          this.cdr.detectChanges();
        }
      });
  }

  markCommissionAsUnpaid(mission: Mission): void {
    if (!mission.id) return;
    this.isLoading = true;
    this.missionService.updateMissionPartial(mission.id, { commissionStatut: 'non payée' })
      .subscribe({
        next: (updatedMission) => {
          this.onCommissionStatusUpdated({ ...mission, commissionStatut: 'non payée' });
          this.isLoading = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.isLoading = false;
          this.error = 'Erreur lors de la mise à jour du statut de commission';
          this.cdr.detectChanges();
        }
      });
  }

  // Méthodes privées d'optimisation
  private _calculateFilteredMissions(): Mission[] {
    return this._missions.filter(m =>
      (!this.filterStatut || (m.commissionStatut?.toLowerCase() === this.filterStatut.toLowerCase())) &&
      (!this.filterNom || (m.assureName?.toLowerCase().includes(this.filterNom.toLowerCase()))) &&
      (this.filterDevisMin === null || (m.devis || 0) >= this.filterDevisMin) &&
      (this.filterDevisMax === null || (m.devis || 0) <= this.filterDevisMax) &&
      (this.filterFactureMin === null || (m.factureFinale || 0) >= this.filterFactureMin) &&
      (this.filterFactureMax === null || (m.factureFinale || 0) <= this.filterFactureMax) &&
      (!this.filterReparateur || (
        (m.reparateur?.name?.toLowerCase().includes(this.filterReparateur.toLowerCase())) ||
        (m.reparateur?.prenom?.toLowerCase().includes(this.filterReparateur.toLowerCase()))
      ))
    );
  }

  private _getFiltersCacheKey(): string {
    return `${this.filterStatut}|${this.filterNom}|${this.filterDevisMin}|${this.filterDevisMax}|${this.filterFactureMin}|${this.filterFactureMax}|${this.filterReparateur}`;
  }

  private _clearCache(): void {
    this._filteredMissionsCache = null;
    this._paginatedMissionsCache = null;
  }

  private calculateKPIs(): void {
    this.totalDevis = this._missions.reduce((sum, m) => sum + (m.devis || 0), 0);
    this.totalFactures = this._missions.reduce((sum, m) => sum + (m.factureFinale || 0), 0);
    this.totalCommissions = this._missions.reduce((sum, m) => sum + this.getCommission(m), 0);
    this.netBalance = this._missions.filter(m => m.commissionStatut === 'payée').reduce((sum, m) => sum + this.getCommission(m), 0);
  }
}