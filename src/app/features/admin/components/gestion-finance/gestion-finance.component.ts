import { Component, OnInit } from '@angular/core';
import { MissionService } from '../../../../../../src/services/mission.service';
import { Mission } from '../../../../../../src/services/models-api.interface';
import { CommonModule } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import { AssureService } from '../../../../../../src/services/assure.service';
import { ReparateurService } from '../../../../../../src/services/reparateur.service';
import { Reparateur } from '../../../../../../src/services/models-api.interface';
import { FormsModule } from '@angular/forms';
import { DossierViewComponent } from '../dossier-management/dossier-view.component';

@Component({
  selector: 'app-gestion-finance',
  templateUrl: './gestion-finance.component.html',
  styleUrls: ['./gestion-finance.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule, DossierViewComponent]
})
export class GestionFinanceComponent implements OnInit {
  // Icônes remplacées par du texte ou classes CSS
  iconCoins = '💰';
  iconInvoice = '🧾';
  iconMoney = '💵';
  iconPercent = '📊';
  iconWallet = '💳';
  iconEye = '👁️';
  iconInbox = '📥';

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
  filterReparateur: string = '';

  showDossierView = false;
  selectedMission: Mission | null = null;

  constructor(
    private missionService: MissionService,
    private assureService: AssureService,
    private reparateurService: ReparateurService
  ) {}

  async ngOnInit(): Promise<void> {
    await this.loadFinancialData();
  }

  async loadFinancialData(): Promise<void> {
    this.isLoading = true;
    this.error = null;
    
    try {
      const missions = await firstValueFrom(this.missionService.getAllMissions());
      this.missions = await this.enrichMissionsData(missions);
      this.calculateKPIs();
      this.isLoading = false;
    } catch (err) {
      console.error('Erreur lors du chargement des données financières', err);
      this.error = 'Erreur lors du chargement des données financières';
      this.isLoading = false;
    }
  }

  private async enrichMissionsData(missions: Mission[]): Promise<Mission[]> {
    const enrichedMissions = await Promise.all(
      missions.map(async (mission) => {
        if (mission.sinistre?.id) {
          try {
            const assure = await firstValueFrom(this.assureService.getAssureBySinistreId(mission.sinistre.id));
            mission.assureName = `${assure.name} ${assure.prenom}`;
          } catch (err) {
            console.error(`Erreur lors de la récupération de l'assuré pour la mission ${mission.id}`, err);
            mission.assureName = 'N/A';
          }
        } else {
          mission.assureName = 'N/A';
        }

        if (mission.reparateur?.id && !mission.reparateur.commission) {
          try {
            const reparateur = await firstValueFrom(this.reparateurService.getReparateur(mission.reparateur.id)) as Reparateur;
            mission.reparateur = reparateur;
          } catch (err) {
            console.error(`Erreur lors de la récupération du réparateur pour la mission ${mission.id}`, err);
          }
        }

        return mission;
      })
    );

    return enrichedMissions;
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
    if (this.filterReparateur) {
      filtered = filtered.filter(m => m.reparateur && m.reparateur.name && m.reparateur.name.toLowerCase().includes(this.filterReparateur.toLowerCase()));
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
    // Met à jour la mission dans la liste et recalcule les KPI
    const idx = this.missions.findIndex(m => m.id === updatedMission.id);
    if (idx !== -1) {
      this.missions[idx] = updatedMission;
      this.calculateKPIs();
    }
    this.closeDossierView();
  }

  refreshData(): void {
    this.loadFinancialData();
  }

  formatCurrency(value: number): string {
    return value.toFixed(2).replace('.', ',') + ' €';
  }

  get totalPages(): number {
    return Math.ceil(this.filteredMissions.length / this.pageSize) || 1;
  }
}