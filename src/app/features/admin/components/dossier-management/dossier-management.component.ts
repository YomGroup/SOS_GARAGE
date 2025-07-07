// dossier-management.component.ts
import { Component, OnInit, ViewChild, AfterViewInit, ViewContainerRef, ComponentRef, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSelectModule } from '@angular/material/select';
import { DossiersService, Dossier as APIDossier } from '../../../../../services/dossiers.service';
import { MatDialog } from '@angular/material/dialog';
import { Router, RouterModule, ActivatedRoute, NavigationEnd } from '@angular/router';
import { DossierViewComponent } from './dossier-view.component';
import { MissionService } from '../../../../../services/mission.service';
import { Mission, Vehicule } from '../../../../../services/models-api.interface';
import { Dossier } from '../../../../../services/dossiers.service';

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
    DossierViewComponent,
    RouterModule,
  ]
})
export class DossierManagementComponent implements OnInit, AfterViewInit {
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

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild('dialogContainer', { read: ViewContainerRef }) dialogContainer!: ViewContainerRef;

  // Statistiques dossiers
  totalDossiers = 0;
  nbDossiersNonTraites = 0;
  dossiersTraites = 0;
  dossiersCommissionPayee = 0;

  suppressionEnCours: boolean = false;
  vehiculesEnChargement: Set<number> = new Set();

  onglet: 'nouveaux' | 'nonTraites' | 'termines' = 'nouveaux';
  filtreActuel: 'nouveaux' | 'nonTraites' | 'termines' | 'tous' = 'tous';

  get dossiersNouveaux() {
    const today = new Date().toISOString().slice(0, 10);
    return this.dataSource.data.filter(d => {
      const date = (d.dateCreation instanceof Date ? d.dateCreation : new Date(d.dateCreation)).toISOString().slice(0, 10);
      return date === today;
    });
  }

  get dossiersNonTraites() {
    // Dossiers sans mission associée
    return this.dataSource.data.filter(dossier => 
      !this.missions.some(m => m.sinistre && m.sinistre.id === dossier.id)
    );
  }

  get dossiersTermines() {
    // Dossiers avec mission statut "terminé"
    return this.dataSource.data.filter(dossier => {
      const mission = this.missions.find(m => m.sinistre && m.sinistre.id === dossier.id);
      return mission && mission.statut === 'terminé';
    });
  }

  get dossiersFiltres() {
    switch (this.filtreActuel) {
      case 'nouveaux':
        return this.dossiersNouveaux;
      case 'nonTraites':
        return this.dossiersNonTraites;
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
    private cdr: ChangeDetectorRef
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
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.loadData();
        this.detecterFiltreActuel();
      }
    });
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

  getTitreFiltre(): string {
    switch (this.filtreActuel) {
      case 'nouveaux':
        return 'Nouveaux dossiers';
      case 'nonTraites':
        return 'Dossiers non traités';
      case 'termines':
        return 'Dossiers terminés';
      default:
        return 'Tous les dossiers';
    }
  }

  getDescriptionFiltre(): string {
    switch (this.filtreActuel) {
      case 'nouveaux':
        return 'Dossiers créés aujourd\'hui';
      case 'nonTraites':
        return 'Dossiers sans mission associée';
      case 'termines':
        return 'Dossiers avec mission statut "terminé"';
      default:
        return 'Tous les dossiers disponibles';
    }
  }

  getMessageAucunDossier(): string {
    switch (this.filtreActuel) {
      case 'nouveaux':
        return 'Aucun nouveau dossier aujourd\'hui.';
      case 'nonTraites':
        return 'Aucun dossier non traité.';
      case 'termines':
        return 'Aucun dossier terminé.';
      default:
        return 'Aucun dossier disponible.';
    }
  }

  private loadData() {
    this.dossiersService.getDossiers().subscribe(apiDossiers => {
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
      
      // Dossiers non traités : pas de mission associée
      this.nbDossiersNonTraites = apiDossiers.filter(dossier => !this.missions.some(m => m.sinistre && m.sinistre.id === dossier.id)).length;
      // Dossiers traités : au moins une mission associée
      this.dossiersTraites = apiDossiers.filter(dossier => this.missions.some(m => m.sinistre && m.sinistre.id === dossier.id)).length;
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
      
      this.cdr.detectChanges();
    });
    this.missionService.getAllMissions().subscribe(missions => {
      this.missions = missions;
      this.cdr.detectChanges();
    });
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
      case 'VALIDÉ':
        return 'statut-valide';
      case 'EN_ATTENTE':
        return 'statut-attente';
      case 'REJETÉ':
        return 'statut-rejete';
      case 'EN_COURS':
        return 'statut-cours';
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
    // TODO: Implémenter l'attribution à un sinistre
  }

  supprimerDossier(dossier: DossierAffichage): void {
    if (this.suppressionEnCours) return; // Éviter les clics multiples
    
    if (confirm(`Êtes-vous sûr de vouloir supprimer le dossier N°${dossier.numero} ?`)) {
      this.suppressionEnCours = true;
      
      this.dossiersService.deleteDossier(dossier.id).subscribe({
        next: () => {
          console.log('Dossier supprimé avec succès');
          this.dataSource.data = this.dataSource.data.filter(d => d.id !== dossier.id);
          this.dataSource._updateChangeSubscription();
          this.totalDossiers--;
          this.suppressionEnCours = false;
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Erreur lors de la suppression:', error);
          alert('Erreur lors de la suppression du dossier');
          this.suppressionEnCours = false;
        }
      });
    }
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
      this.dossierEnEdition = edition;
      this.dossierAffichageSelectionne = null;
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
}