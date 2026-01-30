// dossier-management.component.ts
import { Component, OnInit, AfterViewInit, OnChanges, SimpleChanges, Input, ViewChild, ViewContainerRef, OnDestroy, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
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
import { DossiersService, Dossier, PaginatedResponse } from '../../../../../services/dossiers.service';
import { DossierEnrichedService, DossierEnriched, MissionInfo  } from '../../../../../services/dossier-enriched.service'; // ⬅️ AJOUT
import { MatDialog } from '@angular/material/dialog';
import { Router, RouterModule, ActivatedRoute, NavigationEnd } from '@angular/router';
import { from, of, forkJoin, Subject } from 'rxjs';
import { filter, debounceTime, switchMap, map, catchError, takeUntil, tap } from 'rxjs/operators';
import { DossierViewComponent } from './dossier-view.component';
import { MissionService } from '../../../../../services/mission.service';
import { MessageService } from '../../../../../services/messagerie.service';
import { AuthService } from '../../../../../services/auth.service';
import { DossierFilterService } from './dossier-filter.service';
import { Vehicule, Reparateur, Mission } from '../../../../../services/models-api.interface';
import { 
  getDisplayStatus, 
  getDisplayStatusColor, 
  DisplayStatus 
} from '../../../../shared/utils/status.utils';
import { 
  formatDateFr, 
  formatDateTimeFr, 
  parseBackendDate 
} from '../../../../shared/utils/date.utils';


// Étend l'interface Dossier pour l'affichage local
export interface DossierAffichage extends Dossier {
  numero: string;
  dateCreation: Date;
  mission?: MissionInfo | null;
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
export class DossierManagementComponent implements OnInit, AfterViewInit, OnChanges, OnDestroy {
  private destroy$ = new Subject<void>();
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
  sinistreDissier:Dossier[]=[];
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

  // Dossiers nouveaux/non traités : utilise statusDisplay du backend
  get dossiersNouveaux() {
    return this.dataSource.data.filter(dossier => {
      const d = dossier as any;
      // Utiliser statusDisplay du backend (plus fiable)
      if (d.statusDisplay !== undefined) {
        return d.statusDisplay === 'Non traité';
      }
      // Fallback: sans mission OU avec mission non commencée
      return !d.hasMission || (d.hasMission && !d.enCours && !d.termine);
    });
  }

  // Dossiers en cours : utilise statusDisplay du backend
  get dossiersEnCours() {
    return this.dataSource.data.filter(dossier => {
      const d = dossier as any;
      // Utiliser statusDisplay du backend
      if (d.statusDisplay !== undefined) {
        return d.statusDisplay === 'En cours';
      }
      // Fallback
      return d.enCours === true;
    });
  }

  // Dossiers terminés : utilise statusDisplay du backend
  get dossiersTermines() {
    return this.dataSource.data.filter(dossier => {
      const d = dossier as any;
      // Utiliser statusDisplay du backend
      if (d.statusDisplay !== undefined) {
        return d.statusDisplay === 'Terminé';
      }
      // Fallback
      return d.termine === true;
    });
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
    private dossierEnrichedService: DossierEnrichedService, // ⬅️ AJOUT
    private missionService: MissionService,
    private dialog: MatDialog,
    private router: Router,
    private route: ActivatedRoute,
    private viewContainerRef: ViewContainerRef,
    private cdr: ChangeDetectorRef,
    private auth: AuthService,
    private messageService: MessageService,
    private dossierFilterService: DossierFilterService
  ) {
    this.dataSource = new MatTableDataSource();
  }

  ngOnInit(): void {
    this.setupMobileDetection();
    this.loadData(this.pageIndex, this.pageSize);
    this.detecterFiltreActuel();
    this.setupNavigationListener();
    this.setupFilterListener();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupMobileDetection(): void {
    this.isMobile = window.innerWidth <= 768;
    window.addEventListener('resize', () => {
      this.isMobile = window.innerWidth <= 768;
    });
  }

  private setupNavigationListener(): void {
    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        debounceTime(150),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.loadData();
        this.detecterFiltreActuel();
        this.pageIndex = 0;
        this.onToolbarFiltersChanged();
      });
  }

  private setupFilterListener(): void {
    this.dossierFilterService.filtre$
      .pipe(takeUntil(this.destroy$))
      .subscribe(filtre => {
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

  // ============================================
  // ⬇️⬇️⬇️ MÉTHODE MODIFIÉE ⬇️⬇️⬇️
  // ============================================
  private loadData(page: number = 0, size: number = 10): void {
    this.isLoadingDossiers = true;
    this.cdr.detectChanges();

    // ⬇️ APPEL AU SERVICE ENRICHI
    this.dossierEnrichedService.getDossiersEnriched(page, size).subscribe({
      next: (response) => {
        console.log('✅ Données enrichies reçues:', response);
        console.log(`📊 Total: ${response.totalElements}, Affichés: ${response.content.length}`);
        console.log('📸 Premier dossier avec photos:', response.content[0]?.imgUrl);
        
        // Charger les missions pour compatibilité avec les getters existants
        this.missionService.getAllMissions().subscribe({
          next: (missions) => {
            this.missions = missions;
            
            // ⬇️ CONVERTIR DossierEnriched en DossierAffichage (garde TOUTES les infos)
            const dossiersArray: DossierAffichage[] = response.content.map((d: DossierEnriched) => ({
              // IDs et numéros
              id: d.id,
              numero: d.numero,
              
              // Dates
              dateCreation: d.dateCreation ? new Date(d.dateCreation) : new Date(),
              createdAt: d.dateCreation,
              dateSinistre: d.dateCreation ? new Date(d.dateCreation) : new Date(),
              
              // Statuts
              type: d.type,
              statut: d.statut,
              statusDisplay: d.statusDisplay, // ⬅️ IMPORTANT pour les getters
              
              // ⬇️ VÉHICULE (déjà enrichi avec marque, modèle, année, immatriculation)
              vehicule: d.vehicule ? {
                id: d.vehicule.id,
                marque: d.vehicule.marque,
                modele: d.vehicule.modele,
                immatriculation: d.vehicule.immatriculation,
                annee: d.vehicule.annee,
                dateMiseEnCirculation: d.vehicule.dateCreationFormatted,
                nomAssurence: d.vehicule.nomAssurance,
                typeAssurence: d.vehicule.typeAssurance
              } : {},
              
              // Assurance
              assurance: d.vehicule?.nomAssurance || 'Non spécifiée',
              
              // ⬇️ ASSURÉ (nom, prénom, email, téléphone)
              nom: d.assure?.nom || '',
              prenom: d.assure?.prenom || '',
              email: d.assure?.email || '',
              telephone: d.assure?.telephone || '',
              
              // ⬇️ PHOTOS ET DOCUMENTS (CORRECTION POUR GERER TOUS LES CAS)
              imgUrl: Array.isArray(d.imgUrl) ? d.imgUrl : (d.imgUrl ? [d.imgUrl] : []),
              
              // ⬇️ FLAGS DU BACKEND (pour les getters)
              hasMission: d.hasMission,
              enCours: d.enCours,
              termine: d.termine,
              
              // Contact et localisation
              contactAssistance: d.contactAssistance || '',
              contact: d.contactAssistance || '',
              lieu: d.lieu || '',
              description: d.description || '',
              
              // Constat
              lienConstat: d.lienConstat || '',
              conditionsAcceptees: d.conditionsAcceptees || false,
              
              // Autres propriétés requises par l'interface
              documents: [],
              notifications: [],
              isvalid: true
            } as any));

            console.log('📦 Dossiers transformés:', dossiersArray.length);
            console.log('📸 Photos du premier dossier:', dossiersArray[0]?.imgUrl);
            console.log('🎯 Flags des dossiers:', dossiersArray.map(d => ({
              id: d.id,
              hasMission: (d as any).hasMission,
              enCours: (d as any).enCours,
              termine: (d as any).termine,
              photos: d.imgUrl?.length || 0
            })));
            
            // ⬇️ METTRE À JOUR LES DONNÉES
            this.dataSource.data = dossiersArray;
            this.sinistreDissier = dossiersArray as Dossier[];
            
            // ⬇️ STATISTIQUES DU BACKEND (déjà calculées correctement)
            this.totalDossiers = response.stats.totalDossiers;
            this.nbDossiersNonTraites = response.stats.dossiersNonTraites;
            this.nbDossiersEnCours = response.stats.dossiersEnCours;
            this.dossiersTraites = response.stats.dossiersTermines;
            this.dossiersCommissionPayee = response.stats.dossiersCommissionPayee;
            this.pageSize = response.size;

            console.log('📊 Statistiques:', {
              total: this.totalDossiers,
              nonTraites: this.nbDossiersNonTraites,
              enCours: this.nbDossiersEnCours,
              traites: this.dossiersTraites
            });

            // Configurer le filtre (garde la logique existante)
            this.dataSource.filterPredicate = (data: DossierAffichage, filter: string) => {
              const f = JSON.parse(filter || '{}');
              const matchesRecherche = this.matchesRecherche(data, f.q || '');
              const matchesStatut = this.matchesStatutAffichage(data, f.statut || '');
              const matchesClient = this.matchesClient(data, f.client || '');
              const inFiltreActuel = this.isInFiltreActuel(data);
              return matchesRecherche && matchesStatut && matchesClient && inFiltreActuel;
            };

            // ⬇️ PLUS BESOIN de loadVehiculesForDossiers - tout est déjà là !
            
            this.isLoadingDossiers = false;
            this.cdr.detectChanges();
          },
          error: (err) => {
            console.error('❌ Erreur chargement missions:', err);
            this.isLoadingDossiers = false;
            this.cdr.detectChanges();
          }
        });
      },
      error: (err) => {
        console.error('❌ Erreur chargement dossiers enrichis:', err);
        this.isLoadingDossiers = false;
        this.cdr.detectChanges();
      }
    });
  }
  // ============================================
  // ⬆️⬆️⬆️ FIN MÉTHODE MODIFIÉE ⬆️⬆️⬆️
  // ============================================

  private loadVehiculesForDossiers(dossiers: DossierAffichage[]): void {
    // ⬇️ PLUS BESOIN - garde pour compatibilité mais ne fait rien
    console.log('Véhicules déjà chargés via le service enrichi');
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
    if (statut === 'en_attente' || statut === 'non_traite') return s === 'non traité';
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

  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadData(this.pageIndex, this.pageSize);
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

  /**
   * Formate une date en format français
   * Utilise l'utilitaire centralisé qui gère tous les formats de date du backend
   */
  formatDate(date: any): string {
    return formatDateFr(date) || 'Date non disponible';
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

      // 3) S'assurer qu'on a bien les IDs Keycloak (assuré & garage)
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
        console.log(`Assuré ID: ${assureId}, Garage ID: ${garageId}`);
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

        const me = this.auth.getKeycloakId();
        const other = me === assureId ? garageId : assureId;

        if (other) {
          this.router.navigate(['/messagerie'], { queryParams: { receiverId: other } });
        }
      },
      error: (err) => {
        console.error('Erreur lors de l\'attribution au sinistre:', err);
      }
    });
  }


  dossierAConfirmerPourSuppression: DossierAffichage | null = null;

  supprimerDossier(dossier: any): void {
    this.dossierAConfirmerPourSuppression = dossier;
    this.cdr.detectChanges();
  }

  annulerSuppression(): void {
    this.dossierAConfirmerPourSuppression = null;
    this.cdr.detectChanges();
  }

  confirmerSuppression(dossier: any): void {
    if (this.suppressionEnCours || !dossier) return;

    this.suppressionEnCours = true;
    
    // ⬇️ Utilise le service enrichi pour la suppression
    this.dossierEnrichedService.deleteDossier(dossier.id).subscribe({
      next: () => {
        this.handleSuccessfulDeletion(dossier.id);
      },
      error: (error: any) => {
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

    this.dossiersService.getVehiculeByIdSinistre(sinistreId).subscribe({
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

  ouvrirDossierView(dossier: any, edition: boolean = false) {
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
    this.loadData(this.pageIndex, this.pageSize);
  }

  onMissionUpdated(updated: Mission) {
    // Met à jour la mission dans la liste locale si besoin
    const idx = this.missions.findIndex(m => m.id === updated.id);
    if (idx !== -1) {
      this.missions[idx] = updated;
    }
    this.dossierSelectionne = updated;
  }

  getVehiculeInfo(dossier: any): any {
    if (!dossier?.vehicule) {
      return {
        marque: 'Marque non spécifiée',
        modele: 'Modèle non spécifié',
        annee: 'Année non spécifiée',
        immatriculation: 'Immatriculation non spécifiée',
        assurance: 'Assurance non spécifiée'
      };
    }

    const vehicule = dossier.vehicule;

    // Utilise directement ta méthode formatDateVehicule
    let annee = 'Année non spécifiée';

    if (vehicule.dateMiseEnCirculation) {
      const formattedDate = this.formatDateVehicule(vehicule.dateMiseEnCirculation);

      // Si la date est valide, extraire l'année
      if (formattedDate !== 'N/A') {
        annee = formattedDate.substring(0, 4);
      }
    }

    // ⬇️ Si le véhicule vient du service enrichi, il a déjà l'année
    if (vehicule.annee) {
      annee = vehicule.annee;
    }

    return {
      marque: vehicule.marque || 'Marque non spécifiée',
      modele: vehicule.modele || 'Modèle non spécifié',
      annee: annee,
      immatriculation: vehicule.immatriculation || 'Immatriculation non spécifiée',
      assurance: vehicule.nomAssurence || vehicule.nomAssurance || 'Assurance non spécifiée'
    };
  }

  /**
   * Formate une date de véhicule
   * Utilise l'utilitaire centralisé qui gère tous les formats de date
   */
  formatDateVehicule(date: any): string {
    const formatted = formatDateFr(date);
    return formatted === 'N/A' ? '—' : formatted;
  }

  // Méthode pour vérifier si un véhicule a des informations complètes
  hasVehiculeInfo(dossier: DossierAffichage): boolean {
    return !!(dossier.vehicule &&
      dossier.vehicule.marque &&
      dossier.vehicule.modele &&
      dossier.vehicule.dateMiseEnCirculation);
  }

  // ============================================
  // ⬇️⬇️⬇️ MÉTHODE MODIFIÉE ⬇️⬇️⬇️
  // ============================================
  isVehiculeLoading(dossierId: any): boolean {
    return false; // ⬅️ Toujours false car tout est déjà chargé !
  }
  // ============================================
  // ⬆️⬆️⬆️ FIN MÉTHODE MODIFIÉE ⬆️⬆️⬆️
  // ============================================

  /**
   * Retourne le statut d'affichage simplifié (3 catégories: Non traité, En cours, Terminé)
   * Utilise le statusDisplay du backend si disponible, sinon fait le mapping localement
   */
  // ✅ REMPLACE CES MÉTHODES dans dossier-management.component.ts

/**
 * Retourne le statut d'affichage (MISSION prioritaire sur SINISTRE)
 */
getStatutAffichage(dossier: any): string {
  // ⬇️⬇️⬇️ PRIORITÉ 1 : Statut de la mission si elle existe ⬇️⬇️⬇️
  if (dossier.mission && dossier.mission.statusDisplay) {
    return dossier.mission.statusDisplay; // "Non traité", "En cours", "Terminé"
  }
  
  // ⬇️⬇️⬇️ PRIORITÉ 2 : Statut du sinistre ⬇️⬇️⬇️
  if (dossier.statusDisplay) {
    return dossier.statusDisplay;
  }
  
  // ⬇️⬇️⬇️ FALLBACK : Non traité ⬇️⬇️⬇️
  return 'Non traité';
}

/**
 * Retourne le libellé détaillé du statut d'avancement
 */
getStatutAvancementLabel(statut: string | undefined): string {
  // ⬇️⬇️⬇️ IMPORTANT : Utiliser le statusDisplay de la mission si disponible ⬇️⬇️⬇️
  // Cette méthode est appelée avec dossier.mission?.statut ou dossier.statut
  
  if (!statut) return 'Non traité';
  
  const normalized = statut.toUpperCase().replace(/ /g, '_');
  
  switch (normalized) {
    case 'EN_ATTENTE_TRAITEMENT':
    case 'EN_ATTENTE_DE_TRAITEMENT':
    case 'PENDING':
    case 'DRAFT':
    case 'NON_TRAITEE':
      return 'Non traité';
    
    case 'EN_ATTENTE_EXPERTISE':
      return 'En attente d\'expertise';
    
    case 'EN_ATTENTE_REPARATION':
      return 'En attente de réparation';
    
    case 'EN_COURS_REPARATION':
    case 'EN_COURS_DE_REPARATION':
    case 'IN_PROGRESS':
    case 'EN_COUR':
    case 'ASSIGNED':
      return 'En cours';
    
    case 'REPARATION_TERMINEE':
    case 'TERMINEE':
    case 'TERMINE':
    case 'COMPLETED':
      return 'Terminé';
    
    case 'VALIDÉ':
    case 'VALIDE':
      return 'Validé';
    
    case 'EN_ATTENTE':
      return 'En attente';
    
    case 'REJETÉ':
    case 'REJETE':
    case 'CANCELLED':
      return 'Rejeté';
    
    default:
      // Retourner le mapping simplifié pour les statuts inconnus
      const lower = statut.toLowerCase();
      if (lower.includes('terminé') || lower.includes('terminee')) return 'Terminé';
      if (lower.includes('en cours') || lower.includes('en_cours')) return 'En cours';
      return 'Non traité';
  }
}

/**
 * Retourne la classe CSS du statut d'avancement
 */
getStatutAvancementClass(statut: string | undefined): string {
  const label = this.getStatutAvancementLabel(statut);
  
  switch (label) {
    case 'Terminé':
    case 'Validé':
      return 'statut-terminee';
    
    case 'En cours':
    case 'En cours de réparation':
    case 'En attente d\'expertise':
    case 'En attente de réparation':
      return 'statut-encours';
    
    case 'Non traité':
    case 'En attente':
    case 'En attente de traitement':
      return 'statut-attente';
    
    case 'Rejeté':
      return 'statut-rejete';
    
    default:
      return 'statut-default';
  }
}

/**
 * ⬇️⬇️⬇️ NOUVELLE MÉTHODE : Récupère le statut à afficher (mission ou sinistre) ⬇️⬇️⬇️
 */
getStatutToDisplay(dossier: any): string {
  // Si le dossier a une mission, utiliser son statut
  if (dossier.mission && dossier.mission.statut) {
    return dossier.mission.statut;
  }
  
  // Sinon, utiliser le statut du sinistre
  return dossier.statut || '';
}

  // Méthode publique pour changer le filtre depuis l'extérieur (sidebar ou parent)
  setFiltre(filtre: 'nouveaux' | 'nonTraites' | 'termines' | 'tous') {
    this.filtreActuel = filtre;
  }

  // ============================================
  // ⬇️⬇️⬇️ MÉTHODES AJOUTÉES POUR LES PHOTOS ⬇️⬇️⬇️
  // ============================================
  getPhotos(dossier: DossierAffichage): string[] {
    return dossier.imgUrl || [];
  }

  hasPhotos(dossier: DossierAffichage): boolean {
    return !!(dossier.imgUrl && dossier.imgUrl.length > 0);
  }
  // ============================================
  // ⬆️⬆️⬆️ FIN MÉTHODES AJOUTÉES ⬆️⬆️⬆️
  // ============================================
}