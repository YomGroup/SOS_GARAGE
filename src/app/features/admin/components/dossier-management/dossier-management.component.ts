// dossier-management.component.ts
import { Component, OnInit, AfterViewInit, OnChanges, SimpleChanges, Input, ViewChild, ViewContainerRef, ComponentRef, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule } from '@angular/forms';
import { DossiersService, Dossier as APIDossier } from '../../../../../services/dossiers.service';
import { MatDialog } from '@angular/material/dialog';
import { Router, RouterModule, ActivatedRoute, NavigationEnd } from '@angular/router';
import { filter, debounceTime } from 'rxjs/operators';
import { forkJoin } from 'rxjs';
import { DossierViewComponent } from './dossier-view.component';
import { MissionService } from '../../../../../services/mission.service';
import { Vehicule } from '../../../../../services/models-api.interface';
import { Dossier } from '../../../../../services/dossiers.service';
import { DossierFilterService } from './dossier-filter.service';
// RxJS
import { from, of } from 'rxjs';
import { switchMap, map, catchError } from 'rxjs/operators';

// Services
import { MessageService } from '../../../../../services/messagerie.service';
import { AuthService } from '../../../../../services/auth.service';

// Modèles
import { Reparateur, Mission } from '../../../../../services/models-api.interface';


// Étend l'interface Dossier pour l'affichage local
export interface DossierAffichage extends Dossier {
  numero: string;
  dateCreation: Date;
}

@Component({
  selector: 'app-dossier-management',
  templateUrl: './dossier-management.component.html',
  styleUrl: './dossier-management.component.css',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatChipsModule,
    MatTooltipModule,
    MatSelectModule,
    FormsModule,
    DossierViewComponent,
    RouterModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DossierManagementComponent implements OnInit, AfterViewInit, OnChanges {
  displayedColumns: string[] = ['numero', 'type', 'statut', 'dateCreation', 'documents', 'actions'];
  dataSource: MatTableDataSource<DossierAffichage>;
  isCardView: boolean = true;
  dossierSelectionne: Mission | null = null;
  dossierEnEdition: boolean = false;
  missions: Mission[] = [];
  isMobile: boolean = false;
  dossierAffichageSelectionne: DossierAffichage | null = null;
  sinistreSelectionne: any = null;
  sinistreDuDossier: DossierAffichage | null = null;
  vehiculeSelectionne: Vehicule | null = null;

  @Input() filtreSelectionne: 'nouveaux' | 'nonTraites' | 'enCours' | 'termines' | 'tous' = 'tous';

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild('dialogContainer', { read: ViewContainerRef }) dialogContainer!: ViewContainerRef;

  // Statistiques dossiers
  totalDossiers = 0;
  nbDossiersNonTraites = 0;
  dossiersTraites = 0;
  dossiersCommissionPayee = 0;
  nbDossiersEnCours = 0;

  suppressionEnCours: boolean = false;
  vehiculesEnChargement: Set<number> = new Set();
  isLoadingDossiers: boolean = false;

  onglet: 'nouveaux' | 'nonTraites' | 'termines' = 'nouveaux';
  filtreActuel: 'nouveaux' | 'nonTraites' | 'enCours' | 'termines' | 'tous' = 'tous';

  // Filtres Toolbar
  statutFiltre: '' | 'en_cours' | 'termine' | 'en_attente' = '';
  clientFiltre: string = '';
  rechercheTexte: string = '';

  // Pagination (appliquée aux deux vues)
  pageIndex: number = 0;
  pageSize: number = 10;
  pageSizeOptions: number[] = [5, 10, 20, 50];

  // Dossiers nouveaux : ceux qui n'ont pas encore de mission
  get dossiersNouveaux() {
    return this.dataSource.data.filter(dossier =>
      !this.missions.some(m => m.sinistre && m.sinistre.id === dossier.id)
    );
  }

  // Dossiers en cours : au moins une mission, aucune mission terminée (peu importe la casse ou le genre)
  get dossiersEnCours() {
    return this.dataSource.data.filter(dossier => {
      const missionsAssociees = this.missions.filter(m => m.sinistre && m.sinistre.id === dossier.id);
      return (
        missionsAssociees.length > 0 &&
        !missionsAssociees.some(m =>
          m.statut && ['terminé', 'terminée'].includes(m.statut.toLowerCase())
        )
      );
    });
  }

  // Dossiers terminés : au moins une mission avec statut terminé (peu importe la casse ou le genre)
  get dossiersTermines() {
    return this.dataSource.data.filter(dossier =>
      this.missions.some(m =>
        m.sinistre && m.sinistre.id === dossier.id &&
        m.statut && ['terminé', 'terminée'].includes(m.statut.toLowerCase())
      )
    );
  }

  get dossiersFiltres() {
    switch (this.filtreActuel) {
      case 'nouveaux':
        return this.dossiersNouveaux;
      case 'nonTraites': // on va remplacer par dossiersEnCours dans le reste du code
      case 'enCours':
        return this.dossiersEnCours;
      case 'termines':
        return this.dossiersTermines;
      default:
        return this.dataSource.data;
    }
  }

  constructor(
    private dossiersService: DossiersService, 
    private missionService: MissionService,
    private dialog: MatDialog, 
    private router: Router, 
    private route: ActivatedRoute,
    private viewContainerRef: ViewContainerRef,
    private cdr: ChangeDetectorRef,
    private auth: AuthService,               // ⬅️ AJOUT
  private messageService: MessageService, // ⬅️ AJOUT
    private dossierFilterService: DossierFilterService
  ) {
    this.dataSource = new MatTableDataSource();
  }

  ngOnInit(): void {
    this.isMobile = window.innerWidth <= 768;
    window.addEventListener('resize', () => {
      this.isMobile = window.innerWidth <= 768;
    });
    this.loadData();
    this.detecterFiltreActuel();
    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        debounceTime(150)
      )
      .subscribe(() => {
        this.loadData();
        this.detecterFiltreActuel();
        this.pageIndex = 0;
        this.onToolbarFiltersChanged();
      });
    this.dossierFilterService.filtre$.subscribe(filtre => {
      this.filtreActuel = filtre;
      this.pageIndex = 0;
      this.onToolbarFiltersChanged();
      this.cdr.detectChanges();
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['filtreSelectionne'] && changes['filtreSelectionne'].currentValue) {
      this.filtreActuel = changes['filtreSelectionne'].currentValue;
    }
  }

  private detecterFiltreActuel() {
    const url = this.router.url;
    if (url.includes('/nouveaux')) {
      this.filtreActuel = 'nouveaux';
    } else if (url.includes('/non-traites')) {
      this.filtreActuel = 'nonTraites';
    } else if (url.includes('/termines')) {
      this.filtreActuel = 'termines';
    } else {
      this.filtreActuel = 'tous';
    }
  }

  // Données dérivées pour filtres dropdown
  get clientsDisponibles(): string[] {
    const noms = new Set<string>();
    this.dataSource.data.forEach(d => {
      const fullName = `${(d as any).nom ?? ''} ${(d as any).prenom ?? ''}`.trim();
      if (fullName) noms.add(fullName);
    });
    return Array.from(noms);
  }

  getTitreFiltre(): string {
    switch (this.filtreActuel) {
      case 'nouveaux':
        return 'Nouveaux dossiers';
      case 'enCours':
        return 'Dossiers en cours';
      case 'termines':
        return 'Dossiers terminés';
      default:
        return 'Tous les dossiers';
    }
  }

  getDescriptionFiltre(): string {
    switch (this.filtreActuel) {
      case 'nouveaux':
        return 'Dossiers qui n\'ont pas encore de mission';
      case 'enCours':
        return 'Dossiers avec mission(s) en cours (aucune mission terminée)';
      case 'termines':
        return 'Dossiers avec au moins une mission terminée';
      default:
        return 'Tous les dossiers disponibles';
    }
  }

  getMessageAucunDossier(): string {
    switch (this.filtreActuel) {
      case 'nouveaux':
        return 'Aucun nouveau dossier.';
      case 'enCours':
        return 'Aucun dossier en cours.';
      case 'termines':
        return 'Aucun dossier terminé.';
      default:
        return 'Aucun dossier disponible.';
    }
  }

  private loadData() {
    this.isLoadingDossiers = true;
    forkJoin({
      apiDossiers: this.dossiersService.getDossiers(),
      missions: this.missionService.getAllMissions()
    }).subscribe(({ apiDossiers, missions }) => {
      this.missions = missions;
      // Traiter chaque dossier pour récupérer les informations de véhicule
      const dossiersAvecVehicules = apiDossiers.map(d => ({
        ...d,
        numero: d.id?.toString() || 'N/A',
        dateCreation: (d as any).dateCreation ? new Date((d as any).dateCreation) : new Date(),
        statut: d.statut ?? (d.conditionsAcceptees ? 'VALIDÉ' : 'EN_ATTENTE'),
        vehicule: d.vehicule || {},
        type: d.type || 'Non spécifié',
        assurance: d.assurance || 'Non spécifiée'
      }));

      // Initialiser les données avec les informations de véhicule disponibles
      this.dataSource.data = dossiersAvecVehicules;
      this.totalDossiers = apiDossiers.length;
      // Configurer filtre custom pour MatTable (pour la vue tableau et recherche)
      this.dataSource.filterPredicate = (data: DossierAffichage, filter: string) => {
        const f = JSON.parse(filter || '{}');
        const matchesRecherche = this.matchesRecherche(data, f.q || '');
        const matchesStatut = this.matchesStatutAffichage(data, f.statut || '');
        const matchesClient = this.matchesClient(data, f.client || '');
        // Respecter le filtreActuel principal (nouveaux/enCours/termines)
        const inFiltreActuel = this.isInFiltreActuel(data);
        return matchesRecherche && matchesStatut && matchesClient && inFiltreActuel;
      };
      
      // Dossiers non traités : pas de mission associée
      this.nbDossiersNonTraites = apiDossiers.filter(dossier => !this.missions.some(m => m.sinistre && m.sinistre.id === dossier.id)).length;
      
      const dossiersAvecMission = apiDossiers.filter(dossier => this.missions.some(m => m.sinistre && m.sinistre.id === dossier.id));
      
      // Dossiers terminés (traités)
      this.dossiersTraites = dossiersAvecMission.filter(dossier =>
        this.missions.some(m => m.sinistre && m.sinistre.id === dossier.id && m.statut && ['terminé', 'terminée'].includes(m.statut.toLowerCase()))
      ).length;

      // Dossiers en cours
      this.nbDossiersEnCours = dossiersAvecMission.length - this.dossiersTraites;

      // Dossiers commission payée : à adapter selon la logique métier (exemple : statut = 'COMMISSION_PAYEE')
      this.dossiersCommissionPayee = apiDossiers.filter(dossier => dossier.statut && dossier.statut.toLowerCase().includes('commission')).length;
      
      // Récupérer les informations de véhicule pour les dossiers qui n'en ont pas
      dossiersAvecVehicules.forEach(dossier => {
        if (dossier.id && (!dossier.vehicule || !dossier.vehicule.marque)) {
          this.vehiculesEnChargement.add(dossier.id);
          this.dossiersService.getVehiculeFromSinistreId(dossier.id).subscribe({
            next: (vehicule) => {
              if (vehicule) {
                dossier.vehicule = vehicule;
              }
              this.vehiculesEnChargement.delete(dossier.id);
              this.cdr.detectChanges();
            },
            error: (error) => {
              console.error(`Erreur lors du chargement du véhicule pour le dossier ${dossier.id}:`, error);
              this.vehiculesEnChargement.delete(dossier.id);
              this.cdr.detectChanges();
            }
          });
        }
      });
      
      this.isLoadingDossiers = false;
      this.cdr.detectChanges();
    });
  }

  private isInFiltreActuel(dossier: DossierAffichage): boolean {
    switch (this.filtreActuel) {
      case 'nouveaux':
        return this.dossiersNouveaux.includes(dossier);
      case 'nonTraites':
      case 'enCours':
        return this.dossiersEnCours.includes(dossier);
      case 'termines':
        return this.dossiersTermines.includes(dossier);
      default:
        return true;
    }
  }

  private matchesRecherche(dossier: DossierAffichage, query: string): boolean {
    if (!query) return true;
    const q = query.toLowerCase();
    const veh = this.getVehiculeInfo(dossier);
    return (
      (dossier.numero || '').toLowerCase().includes(q) ||
      (dossier.type || '').toLowerCase().includes(q) ||
      (dossier.assurance || '').toLowerCase().includes(q) ||
      (veh.marque || '').toLowerCase().includes(q) ||
      (veh.modele || '').toLowerCase().includes(q) ||
      (veh.immatriculation || '').toLowerCase().includes(q)
    );
  }

  private matchesStatutAffichage(dossier: DossierAffichage, statut: string): boolean {
    if (!statut) return true;
    const s = this.getStatutAffichage(dossier).toLowerCase();
    if (statut === 'en_cours') return s === 'en cours';
    if (statut === 'termine') return s === 'terminé';
    if (statut === 'en_attente') return s === 'non traité';
    return true;
  }

  private matchesClient(dossier: DossierAffichage, client: string): boolean {
    if (!client) return true;
    const fullName = `${(dossier as any).nom ?? ''} ${(dossier as any).prenom ?? ''}`.trim();
    return fullName === client;
  }

  onToolbarFiltersChanged(): void {
    // Appliquer via MatTable filter pour synchroniser vue tableau
    const filterObj = { q: this.rechercheTexte, statut: this.statutFiltre, client: this.clientFiltre };
    this.dataSource.filter = JSON.stringify(filterObj);
    this.pageIndex = 0;
    if (this.paginator) this.paginator.firstPage();
    if (this.dataSource.paginator) this.dataSource.paginator.firstPage();
    // Forcer CD pour vue cartes
    this.cdr.detectChanges();
  }

  onPageChange(event: PageEvent) {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.cdr.detectChanges();
  }

  // Sous-ensemble paginé selon la vue cartes
  get dossiersFiltresPagine(): DossierAffichage[] {
    // Reproduire la même logique de filtre que dataSource.filterPredicate
    const all = this.dossiersFiltresFiltrageAvance();
    const start = this.pageIndex * this.pageSize;
    return all.slice(start, start + this.pageSize);
  }

  dossiersFiltresFiltrageAvance(): DossierAffichage[] {
    const filterObj = { q: this.rechercheTexte, statut: this.statutFiltre, client: this.clientFiltre };
    const q = (d: DossierAffichage) => this.matchesRecherche(d, filterObj.q);
    const s = (d: DossierAffichage) => this.matchesStatutAffichage(d, filterObj.statut);
    const c = (d: DossierAffichage) => this.matchesClient(d, filterObj.client);
    return this.dossiersFiltres.filter(d => q(d) && s(d) && c(d));
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

  getStatutClass(statut: string): string {
    switch (statut) {
      case 'Terminé':
        return 'statut-valide'; // vert
      case 'En cours':
        return 'statut-cours'; // bleu/orange
      case 'Non traité':
        return 'statut-attente'; // gris/jaune
      default:
        return 'statut-defaut';
    }
  }

  getStatutIcon(statut: string): string {
    switch (statut) {
      case 'VALIDÉ':
        return 'check_circle';
      case 'EN_ATTENTE':
        return 'schedule';
      case 'REJETÉ':
        return 'cancel';
      case 'EN_COURS':
        return 'hourglass_empty';
      default:
        return 'help';
    }
  }

  getTypeIcon(type: string): string {
    switch (type) {
      case 'CONTRAT':
        return 'description';
      case 'FACTURE':
        return 'receipt';
      case 'DEVIS':
        return 'request_quote';
      default:
        return 'folder';
    }
  }

  getDocumentIcon(isValid: boolean): string {
    return isValid ? 'check_circle' : 'cancel';
  }

  getDocumentClass(isValid: boolean): string {
    return isValid ? 'document-valide' : 'document-invalide';
  }

  validerDossier(dossier: Dossier): void {
    console.log('Validation du dossier:', dossier);
    // TODO: Implémenter la validation du dossier
    dossier.statut = 'VALIDÉ';
    this.dataSource._updateChangeSubscription();
  }

  rejeterDossier(dossier: Dossier): void {
    console.log('Rejet du dossier:', dossier);
    // TODO: Implémenter le rejet du dossier
    dossier.statut = 'REJETÉ';
    this.dataSource._updateChangeSubscription();
  }

  voirDossier(dossier: Dossier): void {
    this.router.navigate(['/admin/dossiers/view', dossier.id]);
  }

  formatDate(date: Date | undefined | null): string {
    if (!date) {
      return 'Date non disponible';
    }
    return date.toLocaleDateString('fr-FR');
  }
  

attribuerSinistre(dossier: Dossier): void {
  console.log('Attribution du dossier à un sinistre:', dossier);

  // 1) Récupérer missionId, sinistreId et réparateur choisi depuis le dossier
  const missionId: number | undefined =
    (dossier as any)?.mission?.id ?? (dossier as any)?.missionId;

  const sinistreId: number | undefined =
    (dossier as any)?.sinistre?.id ?? (dossier as any)?.sinistreId ?? (dossier as any)?.mission?.sinistre?.id;

  // Réparateur sélectionné (adapte le champ selon ton UI)
  const reparateur: Reparateur | undefined =
    (dossier as any)?.reparateurSelectionne ?? (dossier as any)?.reparateur;

  if (!missionId || !reparateur?.id) {
    console.warn('MissionId ou réparateur manquant pour attribuer le sinistre.');
    return;
  }

  // 2) Appel API : mise à jour du réparateur de la mission
  this.missionService.updateMissionReparateur(missionId, reparateur).pipe(

    // 3) S’assurer qu’on a bien les IDs Keycloak (assuré & garage)
    switchMap((missionMaj: Mission) => {
      // Essai 1 : extraire depuis la réponse du PATCH
      const assureIdFromPatch =
        (missionMaj as any)?.sinistre?.assure?.useridKeycloak ??
        (missionMaj as any)?.assure?.useridKeycloak;

      const garageIdFromPatch =
        (missionMaj as any)?.reparateur?.useridKeycloak ??
        reparateur?.useridKeycloak;

      // Si on a tout, on continue direct
      if (assureIdFromPatch && garageIdFromPatch) {
        return of({ mission: missionMaj, assureId: assureIdFromPatch, garageId: garageIdFromPatch });
      }

      // Sinon, recharger la mission (fallback) pour récupérer les clés
      return this.missionService.getMissionById(missionId).pipe(
        map((m2: Mission) => {
          const assureId =
            (m2 as any)?.sinistre?.assure?.useridKeycloak ??
            (m2 as any)?.assure?.useridKeycloak;

          const garageId =
            (m2 as any)?.reparateur?.useridKeycloak ??
            reparateur?.useridKeycloak;

          return { mission: m2, assureId, garageId };
        })
      );
    }),

    // 4) Créer la conversation si besoin + envoyer le message système
    switchMap(({ mission, assureId, garageId }: { mission: Mission; assureId?: string; garageId?: string; }) => {

      if (!assureId || !garageId) {
        console.warn('Impossible de déterminer assureId/garageId pour ouvrir la messagerie.');
        return of(mission);
      }

      // ensureConversation puis sendSystemMessage
      return from(this.messageService.ensureConversation(assureId, garageId, mission.id, sinistreId)).pipe(
        switchMap(() =>
          from(this.messageService.sendSystemMessage(
            assureId,
            garageId,
            `Discussion ouverte pour le suivi du sinistre ${sinistreId ? `#${sinistreId}` : ''}.`
          ))
        ),
        map(() => mission),
        catchError(err => {
          console.error('Ouverture auto de la conversation: échec non bloquant', err);
          // On ne bloque pas le flux : on renvoie quand même la mission
          return of(mission);
        })
      );
    })

  ).subscribe({
    next: (mission: Mission) => {
      // 5) Ouvrir la messagerie sur le bon interlocuteur
      const assureId =
        (mission as any)?.sinistre?.assure?.useridKeycloak ??
        (mission as any)?.assure?.useridKeycloak;

      const garageId =
        (mission as any)?.reparateur?.useridKeycloak ??
        reparateur?.useridKeycloak;

      const me    = this.auth.getKeycloakId();
      const other = me === assureId ? garageId : assureId;

      if (other) {
        this.router.navigate(['/messagerie'], { queryParams: { receiverId: other } });
      }
    },
    error: (err) => {
      console.error('Erreur lors de l’attribution au sinistre:', err);
    }
  });
}


  dossierAConfirmerPourSuppression: DossierAffichage | null = null;

  supprimerDossier(dossier: DossierAffichage): void {
    this.dossierAConfirmerPourSuppression = dossier;
    this.cdr.detectChanges();
  }

  annulerSuppression(): void {
    this.dossierAConfirmerPourSuppression = null;
    this.cdr.detectChanges();
  }

  confirmerSuppression(dossier: DossierAffichage): void {
    if (this.suppressionEnCours || !dossier) return;

    this.suppressionEnCours = true;
    this.dossiersService.deleteDossier(dossier.id).subscribe({
      next: () => {
        this.handleSuccessfulDeletion(dossier.id);
      },
      error: (error) => {
        if (error && (error.status === 200 || error.status === 204 || error.status === 500)) {
          this.handleSuccessfulDeletion(dossier.id);
        } else {
          console.error('Erreur lors de la suppression du dossier:', error);
          this.suppressionEnCours = false;
          this.dossierAConfirmerPourSuppression = null;
          this.cdr.detectChanges();
        }
      }
    });
  }

  handleSuccessfulDeletion(dossierId: number): void {
    console.log('Dossier supprimé avec succès.');
    
    this.dataSource.data = this.dataSource.data.filter(d => d.id !== dossierId);
    this.totalDossiers--; 

    this.suppressionEnCours = false;
    this.dossierAConfirmerPourSuppression = null;
    
    this.onToolbarFiltersChanged();
    this.cdr.detectChanges();
  }

  setCardView(isCard: boolean) {
    this.isCardView = isCard;
  }

  getVehicule(sinistreId: number): void {
    console.log('Récupération du véhicule pour le sinistre:', sinistreId);
    
    this.dossiersService.getVehiculeFromSinistreId(sinistreId).subscribe({
      next: (vehicule: Vehicule | null) => {
        if (vehicule) {
          this.vehiculeSelectionne = vehicule;
          console.log('Véhicule trouvé:', vehicule);
          console.log('Marque:', vehicule.marque);
          console.log('Modèle:', vehicule.modele);
          console.log('Immatriculation:', vehicule.immatriculation);
        } else {
          console.warn('Aucun véhicule trouvé pour ce sinistre');
          this.vehiculeSelectionne = null;
        }
      },
      error: (error) => {
        console.error('Erreur lors de la récupération du véhicule:', error);
        this.vehiculeSelectionne = null;
      }
    });
  }

  

  ouvrirDossierView(dossier: DossierAffichage, edition: boolean = false) {
    const mission = this.missions.find(m => m.sinistre && m.sinistre.id === dossier.id);
    if (mission) {
      this.dossierSelectionne = mission;
      this.dossierAffichageSelectionne = dossier; // <-- On garde le dossier même si mission existe
      this.dossierEnEdition = edition;
      this.sinistreDuDossier = null;
    } else {
      this.dossierSelectionne = null;
      this.dossierEnEdition = edition;
      this.dossierAffichageSelectionne = dossier;
      this.sinistreDuDossier = dossier;
    }
    this.getVehicule(dossier.id);
  }

  fermerDossierView() {
    this.dossierSelectionne = null;
    this.dossierEnEdition = false;
    this.dossierAffichageSelectionne = null;
  }

  onMissionUpdated(updated: Mission) {
    // Met à jour la mission dans la liste locale si besoin
    const idx = this.missions.findIndex(m => m.id === updated.id);
    if (idx !== -1) {
      this.missions[idx] = updated;
    }
    this.dossierSelectionne = updated;
  }

  // Méthode pour obtenir les informations de véhicule formatées
  getVehiculeInfo(dossier: DossierAffichage): any {
    if (!dossier.vehicule) {
      return {
        marque: 'Marque non spécifiée',
        modele: 'Modèle non spécifié',
        annee: 'Année non spécifiée',
        immatriculation: 'Immatriculation non spécifiée',
        assurance: 'Assurance non spécifiée'
      };
    }

    return {
      marque: dossier.vehicule.marque || 'Marque non spécifiée',
      modele: dossier.vehicule.modele || 'Modèle non spécifié',
      annee: dossier.vehicule.dateMiseEnCirculation ? 
        dossier.vehicule.dateMiseEnCirculation.substring(0, 4) : 'Année non spécifiée',
      immatriculation: dossier.vehicule.immatriculation || 'Immatriculation non spécifiée',
      assurance: dossier.vehicule.nomAssurence || 'Assurance non spécifiée'
    };
  }

  // Méthode pour vérifier si un véhicule a des informations complètes
  hasVehiculeInfo(dossier: DossierAffichage): boolean {
    return !!(dossier.vehicule && 
      dossier.vehicule.marque && 
      dossier.vehicule.modele && 
      dossier.vehicule.dateMiseEnCirculation);
  }

  // Méthode pour vérifier si un véhicule est en cours de chargement
  isVehiculeLoading(dossierId: number): boolean {
    return this.vehiculesEnChargement.has(dossierId);
  }

  /**
   * Retourne le statut d'affichage pour la carte :
   * - 'Non traité' si le dossier est nouveau
   * - 'En cours' si le dossier est en cours
   * - 'Terminé' si le dossier est terminé
   */
  getStatutAffichage(dossier: DossierAffichage): string {
    // Nouveau : aucune mission
    if (!this.missions.some(m => m.sinistre && m.sinistre.id === dossier.id)) {
      return 'Non traité';
    }
    // Terminé : au moins une mission terminée
    if (this.missions.some(m => m.sinistre && m.sinistre.id === dossier.id && m.statut && ['terminé', 'terminée'].includes(m.statut.toLowerCase()))) {
      return 'Terminé';
    }
    // Sinon, en cours
    return 'En cours';
  }

  // Méthode publique pour changer le filtre depuis l'extérieur (sidebar ou parent)
  setFiltre(filtre: 'nouveaux' | 'nonTraites' | 'termines' | 'tous') {
    this.filtreActuel = filtre;
  }
}