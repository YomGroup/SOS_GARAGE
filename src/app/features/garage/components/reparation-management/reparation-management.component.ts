import { Component, OnInit, ViewChild, AfterViewInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule } from '@angular/forms';
import { MissionService } from '../../../../../services/mission.service';
import { Mission, Reparation, Vehicule} from '../../../../../services/models-api.interface';
import { KeycloakService } from 'keycloak-angular';
import { MissionViewComponent } from './mission-view.component';



@Component({
  selector: 'app-reparation-management',
  templateUrl: './reparation-management.component.html',
  styleUrls: ['./reparation-management.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatSelectModule,
    MissionViewComponent
  ]
})
export class ReparationManagementComponent implements OnInit, AfterViewInit {
  displayedColumns: string[] = ['vehicule', 'statut', 'dateReception', 'montantDevis', 'montantFacture', 'actions'];
  dataSource: MatTableDataSource<Mission>;
  isCardView: boolean = true;
  filtreStatut: string = '';
  missions: Mission[] = [];
  missionSelectionnee: Mission | null = null;
  missionEnEdition: boolean = false;
  loading: boolean = false;
  vehicule: Vehicule | null = null;
  private keycloakService = inject(KeycloakService);
  private missionService = inject(MissionService);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor() {
    this.dataSource = new MatTableDataSource();
    // Custom filter predicate for search + statut
    this.dataSource.filterPredicate = (data: Mission, filter: string) => {
      const search = filter.toLowerCase();
      const matchStatut = this.filtreStatut ? data.statut === this.filtreStatut : true;
      const matchText =
        data.sinistre?.vehicule.immatriculation?.includes(search) ||
        data.statut.toLowerCase().includes(search) ||
        data.devis.toString().includes(search) ||
        data.factureFinale.toString().includes(search);
      return matchStatut && matchText;
    };
  }

  async ngOnInit(): Promise<void> {
    const isLoggedIn = await this.keycloakService.isLoggedIn();
    if (isLoggedIn) {
      const token = await this.keycloakService.getToken();
      const payload: any = JSON.parse(atob(token.split('.')[1]));
      const keycloakId = payload.sub;
      this.missionService.getAllMissions().subscribe((missions: Mission[]) => {
        this.missions = missions.filter((m: Mission) => m.reparateur && m.reparateur.useridKeycloak === keycloakId && m.statut === 'assigné');
        // Adapter pour la table
        this.dataSource.data = this.missions;
      });
    }
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  // Appelé lors du changement de statut dans le select
  onStatutChange(): void {
    this.dataSource.filter = '' + Math.random(); // force le refresh du filtre
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  changerStatut(reparation: Reparation, nouveauStatut: string): void {
    const mission = this.missions.find(m => m.id === reparation.id);
    if (mission) {
      this.missionService.updateMission(mission.id ?? 0, { statut: nouveauStatut }).subscribe({
        next: (updatedMission) => {
          mission.statut = nouveauStatut as any;
          this.dataSource._updateChangeSubscription();
        },
        error: () => alert('Erreur lors de la mise à jour du statut')
      });
    }
  }

  validerFacture(reparation: Reparation): void {
    const mission = this.missions.find(m => m.id === reparation.id);
    if (mission) {
      this.missionService.updateMission(mission.id ?? 0, { 
        factureFinale: mission.devis,
        statut: 'terminée'
      }).subscribe({
        next: (updatedMission) => {
          mission.factureFinale = mission.devis;
          mission.statut = 'TERMINEE';
          this.dataSource._updateChangeSubscription();
        },
        error: () => alert('Erreur lors de la validation de la facture')
      });
    }
  }

  declarerEpave(reparation: Reparation): void {
    const mission = this.missions.find(m => m.id === reparation.id);
    if (mission) {
      this.missionService.updateMission(mission.id ?? 0, { 
        declareCommeEpave: true,
        statut: 'épave'
      }).subscribe({
        next: (updatedMission) => {
          mission.statut = 'EPAVE';
          this.dataSource._updateChangeSubscription();
        },
        error: () => alert('Erreur lors de la déclaration d\'épave')
      });
    }
  }

  formatDate(date: string | Date): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('fr-FR');
  }

  isPhotosArrayNonEmpty(mission: Mission): boolean {
    return Array.isArray(mission.photosVehicule) && mission.photosVehicule.length > 0;
  }

  ouvrirMissionView(reparation: Reparation, edition: boolean = false): void {
    const mission = this.missions.find(m => m.id === reparation.id);
    if (mission) {
      this.missionSelectionnee = { ...mission };
      this.missionEnEdition = edition;
    }
  }

  fermerMissionView(): void {
    this.missionSelectionnee = null;
    this.missionEnEdition = false;
  }

  onMissionUpdated(updatedMission: Mission): void {
    const idx = this.missions.findIndex(m => m.id === updatedMission.id);
    if (idx !== -1) {
      this.missions[idx] = updatedMission;
    }
    this.missionSelectionnee = updatedMission;
    this.dataSource._updateChangeSubscription();
  }

  modifierMission(reparation: Reparation): void {
    // Ouvrir un modal ou une page de modification
    alert('Fonctionnalité de modification à implémenter');
  }

  getMissionDate(mission: Mission): string {
    return new Date(mission.dateCreation).toLocaleDateString('fr-FR');
  }

  getVehiculeByMissionId(missionId: number): void {
    this.missionService.getVehiculeByMissionId(missionId).subscribe((vehicule: Vehicule) => {
      this.vehicule = vehicule;
    });
  }

  // Nouvelles méthodes pour le style et la gestion des statuts
  getStatutClass(statut: string): string {
    switch (statut.toLowerCase()) {
      case 'assigné':
      case 'en attente':
        return 'statut-attente';
      case 'en cours':
        return 'statut-cours';
      case 'terminée':
        return 'statut-valide';
      case 'épave':
        return 'statut-rejete';
      default:
        return 'statut-attente';
    }
  }

  getGarageStatutLabel(statut: string | undefined): string {
    if (!statut) return 'En attente';
    switch (statut.toLowerCase()) {
      case 'assignée':
      case 'en attente':
        return 'En attente';
      case 'en cours':
        return 'En cours';
      case 'terminée':
        return 'Terminée';
      case 'épave':
        return 'Épave';
      default:
        return statut;
    }
  }

  // Les méthodes d'édition ont été déplacées dans le composant mission-view
} 