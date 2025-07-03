import { Component, OnInit } from '@angular/core';
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
  imports: [CommonModule, FormsModule, MissionViewComponent]
})
export class GarageFinanceComponent implements OnInit {
  missions: Mission[] = [];
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

  showMissionView = false;
  selectedMission: Mission | null = null;

  constructor(
    private missionService: MissionService,
    private authService: AuthService
  ) {}

  async ngOnInit(): Promise<void> {
    await this.loadFinancialData();
  }

  async loadFinancialData(): Promise<void> {
    this.isLoading = true;
    this.error = null;
    try {
      const allMissions = await firstValueFrom(this.missionService.getAllMissions());
      // Filtrer les missions du garage connecté
      const keycloakId = this.authService.getKeycloakId();
      this.missions = allMissions.filter(m => m.reparateur && m.reparateur.useridKeycloak === keycloakId);
      this.calculateKPIs();
      this.isLoading = false;
    } catch (err) {
      this.error = 'Erreur lors du chargement des données financières';
      this.isLoading = false;
    }
  }

  getCommission(mission: Mission): number {
    const taux = mission.reparateur?.commission || 0;
    return (mission.factureFinale || 0) * (taux / 100);
  }

  private calculateKPIs(): void {
    this.totalDevis = this.missions.reduce((sum, m) => sum + (m.devis || 0), 0);
    this.totalFactures = this.missions.reduce((sum, m) => sum + (m.factureFinale || 0), 0);
    this.totalCommissions = this.missions.reduce((sum, m) => sum + this.getCommission(m), 0);
    this.netBalance = this.totalFactures - this.totalCommissions;
  }

  get filteredMissions(): Mission[] {
    let filtered = this.missions.filter(m =>
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

  get paginatedMissions(): Mission[] {
    const start = (this.page - 1) * this.pageSize;
    return this.filteredMissions.slice(start, start + this.pageSize);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredMissions.length / this.pageSize) || 1;
  }

  openMissionView(missionId: number): void {
    const mission = this.missions.find(m => m.id === missionId);
    if (mission) {
      this.selectedMission = mission;
      this.showMissionView = true;
    }
  }

  closeMissionView(): void {
    this.showMissionView = false;
    this.selectedMission = null;
  }

  refreshData(): void {
    this.loadFinancialData();
  }

  formatCurrency(value: number): string {
    return value.toFixed(2).replace('.', ',') + ' €';
  }
} 