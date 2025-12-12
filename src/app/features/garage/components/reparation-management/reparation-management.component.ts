import {
  Component,
  OnInit,
  ViewChild,
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule } from '@angular/forms';

import { MissionService } from '../../../../../services/mission.service';
import { Mission, Reparation, Vehicule } from '../../../../../services/models-api.interface';
import { DossiersService, Dossier } from '../../../../../services/dossiers.service';
import { KeycloakService } from 'keycloak-angular';
import { MissionViewComponent } from './mission-view.component';
import { MissionFilterService } from './mission-filter.service';

type MainMissionStatus = 'nonTraite' | 'enCours' | 'termine';

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
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ReparationManagementComponent implements OnInit, AfterViewInit {
  displayedColumns: string[] = ['vehicule', 'statut', 'dateReception', 'montantDevis', 'montantFacture', 'actions'];
  dataSource: MatTableDataSource<Mission>;

  isCardView: boolean = true;

  filtreStatut: string = '';
  rechercheTexte: string = '';
  clientFiltre: string = '';

  missions: Mission[] = [];
  dossiersNonTraites: Dossier[] = [];

  missionSelectionnee: Mission | null = null;
  dossierSelectionne: Dossier | null = null;

  missionEnEdition: boolean = false;
  loading: boolean = false;
  error: string | null = null;

  vehicule: Vehicule | null = null;

  private keycloakService = inject(KeycloakService);
  private missionService = inject(MissionService);
  private dossiersService = inject(DossiersService);
  private cdr = inject(ChangeDetectorRef);
  private missionFilterService = inject(MissionFilterService);

  vehiculesMap: Map<number, Vehicule> = new Map();
  filtreActuel: 'nouvelles' | 'enCours' | 'terminees' | 'toutes' = 'toutes';

  // Pagination unifiée (cartes et tableau)
  pageIndex: number = 0;
  pageSize: number = 10;
  pageSizeOptions: number[] = [5, 10, 20, 50];

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor() {
    this.dataSource = new MatTableDataSource();

    // Custom filter predicate for search + statut
    this.dataSource.filterPredicate = (data: Mission, filter: string) => {
      const search = (filter || '').toLowerCase();

      const matchStatut = this.filtreStatut ? (data.statut === this.filtreStatut) : true;

      const matchText =
        (data.sinistre?.vehicule?.immatriculation || '').toLowerCase().includes(search) ||
        (data.statut || '').toLowerCase().includes(search) ||
        (data.devis ?? '').toString().includes(search) ||
        (data.factureFinale ?? '').toString().includes(search);

      return matchStatut && matchText;
    };
  }

  // =====================================================
  // ✅ STATUTS (SOURCE UNIQUE)
  // =====================================================

  private normalizeMissionStatus(statut?: string | null): string {
    return (statut ?? '')
      .toString()
      .toUpperCase()
      .trim()
      .replace(/\s+/g, '_');
  }

  /** Groupe principal : Non traité / En cours / Terminé */
  getMainMissionStatus(statut?: string | null): MainMissionStatus {
    const s = this.normalizeMissionStatus(statut);

    // ✅ NON TRAITÉ / NOUVELLES
    if (
      s === 'NON_TRAITE' ||
      s === 'NON_TRAITEE' ||
      s === 'EN_ATTENTE' ||
      s === 'EN_ATTENTE_TRAITEMENT' ||
      s === 'EN_ATTENTE_EXPERTISE' ||
      s === 'EN_ATTENTE_RDV' ||
      s === 'EN_ATTENTE_REPARATION' ||
      s === 'EN_ATTENTE_VALIDATION_ASSURANCE'
    ) return 'nonTraite';

    // ✅ TERMINÉ
    if (
      s === 'TERMINEE' ||
      s === 'REPARATION_TERMINEE'
    ) return 'termine';

    // ✅ EN COURS (par défaut)
    return 'enCours';
  }

  /** Texte lisible : affiche UNIQUEMENT le sous-statut */
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
      'EN_ATTENTE_VALIDATION_ASSURANCE': 'En attente de validation assurance',

      'EN_COURS': 'En cours',
      'EN_COURS_REPARATION': 'En cours de réparation',
      'EN_COURS_DE_REPARATION': 'En cours de réparation',

      'TERMINEE': 'Réparation terminée',
      'REPARATION_TERMINEE': 'Réparation terminée',
    };

    return mapping[s] ?? (s ? s.replace(/_/g, ' ').toLowerCase() : 'Non traitée');
  }

  /** Classe CSS basée sur le groupe principal */
  getStatutClass(statut?: string | null): string {
    const main = this.getMainMissionStatus(statut);

    switch (main) {
      case 'nonTraite':
        return 'statut-attente'; // orange/attente
      case 'enCours':
        return 'statut-cours';   // bleu
      case 'termine':
        return 'statut-valide';  // vert
    }
  }

  /** Label affiché dans l’UI (uniquement lisible) */
  getGarageStatutLabel(statut?: string | null): string {
    return this.formatMissionStatut(statut);
  }

  // =====================================================
  // ✅ FILTRE MENU (SIDEBAR)
  // =====================================================

  get missionsFiltres(): Mission[] {
    if (this.filtreActuel === 'toutes') return this.missions;

    return this.missions.filter(m => {
      const main = this.getMainMissionStatus(m.statut);

      if (this.filtreActuel === 'nouvelles') return main === 'nonTraite';
      if (this.filtreActuel === 'enCours') return main === 'enCours';
      if (this.filtreActuel === 'terminees') return main === 'termine';

      return true;
    });
  }

  setFiltreMission(filtre: 'nouvelles' | 'enCours' | 'terminees' | 'toutes') {
    this.filtreActuel = filtre;
    this.dataSource.data = this.missionsFiltres;
    this.cdr.detectChanges();
  }

  // =====================================================
  // INIT / DATA
  // =====================================================

  async ngOnInit(): Promise<void> {
    await this.refreshData();

    this.missionFilterService.filtre$.subscribe(filtre => {
      console.log('Changement de filtre détecté:', filtre);

      this.filtreActuel = filtre;
      this.dataSource.data = this.missionsFiltres;
      this.pageIndex = 0;

      this.cdr.detectChanges();
    });
  }

  async refreshData(): Promise<void> {
    this.loading = true;
    this.error = null;
    this.cdr.detectChanges();

    try {
      const isLoggedIn = await this.keycloakService.isLoggedIn();

      if (!isLoggedIn) {
        this.error = 'Utilisateur non connecté';
        this.loading = false;
        this.cdr.detectChanges();
        return;
      }

      const token = await this.keycloakService.getToken();
      const payload: any = JSON.parse(atob(token.split('.')[1]));
      const keycloakId = payload.sub;

      this.missionService.getAllMissions().subscribe({
        next: (missions: Mission[]) => {
          this.missions = missions.filter((m: Mission) =>
            m.reparateur &&
            typeof m.reparateur.useridKeycloak === 'string' &&
            m.reparateur.useridKeycloak === keycloakId
          );

          this.dataSource.data = this.missionsFiltres;

          // Charger les véhicules pour chaque mission
          this.missions.forEach(mission => {
            this.missionService.getVehiculeByMissionId(mission.id!).subscribe({
              next: (vehicule) => {
                this.vehiculesMap.set(mission.id!, vehicule);
                this.cdr.detectChanges();
              },
              error: () => {
                this.vehiculesMap.set(mission.id!, null as any);
                this.cdr.detectChanges();
              }
            });
          });

          // Dossiers non-traités
          this.dossiersService.getDossiersSimple().subscribe({
            next: (dossiers: Dossier[]) => {
              this.dossiersNonTraites = dossiers.filter(dossier =>
                !this.missions.some(mission => mission.sinistre?.id === dossier.id)
              );
              this.cdr.detectChanges();
            },
            error: (err) => {
              console.error('Erreur dossiers non-traités:', err);
            }
          });

          this.loading = false;
          this.cdr.detectChanges();
        },
        error: () => {
          this.error = 'Erreur lors du chargement des missions';
          this.loading = false;
          this.cdr.detectChanges();
        }
      });

    } catch (err: any) {
      this.error = 'Erreur lors du chargement des missions';
      this.loading = false;
      this.cdr.detectChanges();
    }
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  onToolbarFiltersChanged(): void {
    this.pageIndex = 0;
    this.cdr.detectChanges();
  }

  onPageChange(event: PageEvent) {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.cdr.detectChanges();
  }

  // =====================================================
  // ACTIONS
  // =====================================================

  changerStatut(reparation: Reparation, nouveauStatut: string): void {
    const mission = this.missions.find(m => m.id === reparation.id);
    if (!mission) return;

    this.missionService.updateMission(mission.id ?? 0, { statut: nouveauStatut }).subscribe({
      next: () => {
        mission.statut = nouveauStatut as any;
        this.dataSource._updateChangeSubscription();
        this.cdr.detectChanges();
      },
      error: () => {
        this.error = 'Erreur lors de la mise à jour du statut';
        this.cdr.detectChanges();
      }
    });
  }

  validerFacture(reparation: Reparation): void {
    const mission = this.missions.find(m => m.id === reparation.id);
    if (!mission) return;

    this.missionService.updateMission(mission.id ?? 0, {
      factureFinale: mission.devis,
      statut: 'terminée'
    }).subscribe({
      next: () => {
        mission.factureFinale = mission.devis;
        mission.statut = 'TERMINEE';
        this.dataSource._updateChangeSubscription();
        this.cdr.detectChanges();
      },
      error: () => {
        this.error = 'Erreur lors de la validation de la facture';
        this.cdr.detectChanges();
      }
    });
  }

  declarerEpave(reparation: Reparation): void {
    const mission = this.missions.find(m => m.id === reparation.id);
    if (!mission) return;

    this.missionService.updateMission(mission.id ?? 0, {
      declareCommeEpave: true,
      statut: 'épave'
    }).subscribe({
      next: () => {
        mission.statut = 'EPAVE';
        this.dataSource._updateChangeSubscription();
        this.cdr.detectChanges();
      },
      error: () => {
        this.error = "Erreur lors de la déclaration d'épave";
        this.cdr.detectChanges();
      }
    });
  }

  formatDate(date: string | Date | undefined | null): string {
    if (!date) return 'Non renseigné';
    const d = new Date(date);
    if (isNaN(d.getTime())) return 'Non renseigné';
    return d.toLocaleDateString('fr-FR');
  }

  isPhotosArrayNonEmpty(mission: Mission): boolean {
    return Array.isArray(mission.photosVehicule) && mission.photosVehicule.length > 0;
  }

  ouvrirMissionView(reparation: Reparation, edition: boolean = false): void {
    this.missionSelectionnee = reparation as any;
    this.missionEnEdition = edition;
    this.cdr.detectChanges();
  }

  ouvrirDossierView(dossier: Dossier, edition: boolean = false): void {
    this.dossierSelectionne = dossier;
    this.missionEnEdition = edition;
    this.cdr.detectChanges();
  }

  fermerMissionView(): void {
    this.missionSelectionnee = null;
    this.dossierSelectionne = null;
    this.missionEnEdition = false;
    this.cdr.detectChanges();
  }

  onMissionUpdated(updatedMission: Mission): void {
    const idx = this.missions.findIndex(m => m.id === updatedMission.id);
    if (idx !== -1) this.missions[idx] = updatedMission;

    this.missionSelectionnee = updatedMission;
    this.dataSource._updateChangeSubscription();
    this.cdr.detectChanges();
  }

  modifierMission(_: Reparation): void {
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

  getVehiculeForMission(mission: Mission): Vehicule | null {
    return this.vehiculesMap.get(mission.id!) || null;
  }

  // Données dérivées pour filtres dropdown (clients)
get clientsDisponibles(): string[] {
  const noms = new Set<string>();
  this.missions.forEach(m => {
    const assure = (m.assureName || '').toString().trim();
    if (assure) noms.add(assure);
  });
  return Array.from(noms);
}


  // =====================================================
  // FILTRES AVANCÉS
  // =====================================================

  private normalizeString(value: string): string {
    return (value || '')
      .toString()
      .toLowerCase()
      .normalize('NFD')
      .replace(/\p{Diacritic}+/gu, '')
      .replace(/[_-]+/g, ' ')
      .trim();
  }

  private matchSearch(m: Mission, query: string): boolean {
    if (!query) return true;
    const q = this.normalizeString(query);

    const veh = this.getVehiculeForMission(m) || (m.sinistre?.vehicule as any) || {};
    const immat = this.normalizeString(veh.immatriculation || m.sinistre?.vehicule?.immatriculation || '');
    const marque = this.normalizeString(veh.marque || '');
    const modele = this.normalizeString(veh.modele || '');
    const assure = this.normalizeString(m.assureName || '');
    const statut = this.normalizeString(m.statut || '');
    const devis = this.normalizeString((m.devis ?? '').toString());
    const facture = this.normalizeString((m.factureFinale ?? '').toString());

    return (
      immat.includes(q) ||
      marque.includes(q) ||
      modele.includes(q) ||
      assure.includes(q) ||
      statut.includes(q) ||
      devis.includes(q) ||
      facture.includes(q)
    );
  }

private matchStatut(m: Mission, filtre: string): boolean {
  if (!filtre) return true;

  const f = (filtre || '').toUpperCase().trim();

  // Filtre "UI" => groupe principal
  const map: Record<string, MainMissionStatus> = {
    'EN_ATTENTE': 'nonTraite',
    'EN_COURS': 'enCours',
    'TERMINEE': 'termine',
  };

  if (map[f]) {
    return this.getMainMissionStatus(m.statut) === map[f];
  }

  // Si un jour tu mets des statuts exacts dans le select, ça marche aussi
  return this.normalizeMissionStatus(m.statut) === this.normalizeMissionStatus(filtre);
}


  private matchClient(m: Mission, client: string): boolean {
    if (!client) return true;
    return (m.assureName || '') === client;
  }

  missionsFiltresFiltrageAvance(): Mission[] {
    return this.missionsFiltres.filter(m =>
      this.matchStatut(m, this.filtreStatut) &&
      this.matchClient(m, this.clientFiltre) &&
      this.matchSearch(m, this.rechercheTexte)
    );
  }

  get missionsFiltresPagine(): Mission[] {
    const all = this.missionsFiltresFiltrageAvance();
    const start = this.pageIndex * this.pageSize;
    return all.slice(start, start + this.pageSize);
  }
}
