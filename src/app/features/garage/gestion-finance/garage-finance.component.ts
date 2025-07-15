import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MissionService } from '../../../../services/mission.service';
import { Mission } from '../../../../services/models-api.interface';
import { AuthService } from '../../../../services/auth.service';
import { MissionViewComponent } from '../components/reparation-management/mission-view.component';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-garage-finance',
  templateUrl: './garage-finance.component.html',
  styleUrls: ['./garage-finance.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule, MissionViewComponent],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GarageFinanceComponent implements OnInit {
  // Variables d'état
  private _missions: Mission[] = [];
  isLoading = true;
  error: string | null = null;
  totalDevis = 0;
  totalFactures = 0;
  totalCommissions = 0;
  netBalance = 0;

  // Pagination
  page = 1;
  pageSize = 10;

  // Filtres
  filterStatut: string = '';
  filterNom: string = '';
  filterDevisMin: number|null = null;
  filterDevisMax: number|null = null;
  filterFactureMin: number|null = null;
  filterFactureMax: number|null = null;

  // Modal
  showMissionView = false;
  selectedMission: Mission | null = null;

  // Cache pour optimiser les performances
  private _filteredMissionsCache: { key: string, value: Mission[] } | null = null;
  private _paginatedMissionsCache: Mission[] | null = null;

  constructor(
    private missionService: MissionService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  async ngOnInit(): Promise<void> {
    await this.loadFinancialData();
  }

  async loadFinancialData(): Promise<void> {
    this.isLoading = true;
    this.error = null;
    this.cdr.detectChanges();
    
    try {
      const allMissions = await firstValueFrom(this.missionService.getAllMissions());
      const keycloakId = this.authService.getKeycloakId();
      this._missions = allMissions.filter(m => 
        m.reparateur && m.reparateur.useridKeycloak === keycloakId
      );
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

  getCommission(mission: Mission): number {
    const taux = mission.reparateur?.commission || 0;
    return (mission.factureFinale || 0) * (taux / 100);
  }

  private calculateKPIs(): void {
    this.totalDevis = this._missions.reduce((sum, m) => sum + (m.devis || 0), 0);
    this.totalFactures = this._missions.reduce((sum, m) => sum + (m.factureFinale || 0), 0);
    this.totalCommissions = this._missions.reduce((sum, m) => sum + this.getCommission(m), 0);
    this.netBalance = this.totalFactures - this.totalCommissions;
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

  private _calculateFilteredMissions(): Mission[] {
    let filtered = this._missions.filter(m =>
      (!this.filterStatut || (m.commissionStatut && m.commissionStatut.toLowerCase().includes(this.filterStatut.toLowerCase()))) &&
      (!this.filterNom || (m.assureName && m.assureName.toLowerCase().includes(this.filterNom.toLowerCase())))
    );
    
    if (this.filterDevisMin !== null) {
      filtered = filtered.filter(m => (m.devis || 0) >= this.filterDevisMin!);
    }
    if (this.filterDevisMax !== null) {
      filtered = filtered.filter(m => (m.devis || 0) <= this.filterDevisMax!);
    }
    if (this.filterFactureMin !== null) {
      filtered = filtered.filter(m => (m.factureFinale || 0) >= this.filterFactureMin!);
    }
    if (this.filterFactureMax !== null) {
      filtered = filtered.filter(m => (m.factureFinale || 0) <= this.filterFactureMax!);
    }
    
    // Reset page si le filtre change et la page courante n'est plus valide
    if ((this.page - 1) * this.pageSize >= filtered.length) {
      this.page = 1;
    }
    
    return filtered;
  }

  private _getFiltersCacheKey(): string {
    return `${this.filterStatut}-${this.filterNom}-${this.filterDevisMin}-${this.filterDevisMax}-${this.filterFactureMin}-${this.filterFactureMax}`;
  }

  private _clearCache(): void {
    this._filteredMissionsCache = null;
    this._paginatedMissionsCache = null;
  }

  openMissionView(missionId: number): void {
    const mission = this._missions.find(m => m.id === missionId);
    if (mission) {
      this.selectedMission = mission;
      this.showMissionView = true;
      this.cdr.detectChanges();
    }
  }

  closeMissionView(): void {
    this.showMissionView = false;
    this.selectedMission = null;
    this.cdr.detectChanges();
  }

  refreshData(): void {
    this.loadFinancialData();
  }

  resetFilters(): void {
    this.filterStatut = '';
    this.filterNom = '';
    this.filterDevisMin = null;
    this.filterDevisMax = null;
    this.filterFactureMin = null;
    this.filterFactureMax = null;
    this.page = 1;
    this._clearCache();
    this.cdr.detectChanges();
  }

  shouldShowPage(pageNumber: number): boolean {
    const totalPages = this.totalPages;
    if (totalPages <= 7) return true;
    
    if (pageNumber === 1 || pageNumber === totalPages) return true;
    
    const currentPage = this.page;
    if (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1) return true;
    
    return false;
  }

  formatCurrency(value: number): string {
    return value.toFixed(2).replace('.', ',') + ' €';
  }
} 