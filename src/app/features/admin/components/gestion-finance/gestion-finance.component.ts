import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { MissionService } from '../../../../../../src/services/mission.service';
import { Mission } from '../../../../../../src/services/models-api.interface';
import { CommonModule } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import { AssureService } from '../../../../../../src/services/assure.service';
import { ReparateurService } from '../../../../../../src/services/reparateur.service';
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
  // Tous les éléments visuels inchangés
  iconCoins = '💰';
  iconInvoice = '🧾';
  iconMoney = '💵';
  iconPercent = '📊';
  iconWallet = '💳';
  iconEye = '👁️';
  iconInbox = '📥';

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

  constructor(
    private missionService: MissionService,
    private assureService: AssureService,
    private reparateurService: ReparateurService,
    private cdr: ChangeDetectorRef
  ) {}

  async ngOnInit(): Promise<void> {
    await this.loadFinancialData();
  }

  // Méthode loadFinancialData inchangée mais optimisée en interne
  async loadFinancialData(): Promise<void> {
    this.isLoading = true;
    this.error = null;
    this.cdr.detectChanges();
    
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
    } finally {
      this.isLoading = false;
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

      return missionCopy;
    });
  }

  // Charger tous les assurés en une seule fois
  private async loadAssuresMap(sinistreIds: number[]): Promise<Map<number, any>> {
    if (sinistreIds.length === 0) return new Map();

    const assuresObservables = sinistreIds.map(id => 
      this.assureService.getAssureBySinistreId(id).pipe(
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
    const taux = mission.reparateur?.commission || 0;
    return (mission.factureFinale || 0) * (taux / 100);
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
    this.closeDossierView();
  }

  refreshData(): void {
    this._clearCache();
    this.loadFinancialData();
  }

  formatCurrency(value: number): string {
    return value.toFixed(2).replace('.', ',') + ' €';
  }

  // Méthodes privées d'optimisation
  private _calculateFilteredMissions(): Mission[] {
    return this._missions.filter(m =>
      (!this.filterStatut || (m.commissionStatut?.toLowerCase().includes(this.filterStatut.toLowerCase()))) &&
      (!this.filterNom || (m.assureName?.toLowerCase().includes(this.filterNom.toLowerCase()))) &&
      (this.filterDevisMin === null || (m.devis || 0) >= this.filterDevisMin) &&
      (this.filterDevisMax === null || (m.devis || 0) <= this.filterDevisMax) &&
      (this.filterFactureMin === null || (m.factureFinale || 0) >= this.filterFactureMin) &&
      (this.filterFactureMax === null || (m.factureFinale || 0) <= this.filterFactureMax) &&
      (!this.filterReparateur || (m.reparateur?.name?.toLowerCase().includes(this.filterReparateur.toLowerCase())))
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
    this.netBalance = this.totalFactures - this.totalCommissions;
  }
}