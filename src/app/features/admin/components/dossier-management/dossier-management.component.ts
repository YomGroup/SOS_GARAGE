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
import { Mission } from '../../../../../services/models-api.interface';
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

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild('dialogContainer', { read: ViewContainerRef }) dialogContainer!: ViewContainerRef;

  // Statistiques dossiers
  totalDossiers = 0;
  dossiersNonTraites = 0;
  dossiersTraites = 0;
  dossiersCommissionPayee = 0;

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
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.loadData();
      }
    });
  }

  private loadData() {
    this.dossiersService.getDossiers().subscribe(apiDossiers => {
      this.dataSource.data = apiDossiers.map(d => ({
        ...d,
        numero: d.id.toString(),
        dateCreation: (d as any).dateCreation ? new Date((d as any).dateCreation) : new Date(),
        statut: d.statut ?? (d.conditionsAcceptees ? 'VALIDÉ' : 'EN_ATTENTE'),
      }));
      this.totalDossiers = apiDossiers.length;
      // Dossiers non traités : pas de mission associée
      this.dossiersNonTraites = apiDossiers.filter(dossier => !this.missions.some(m => m.sinistre && m.sinistre.id === dossier.id)).length;
      // Dossiers traités : au moins une mission associée
      this.dossiersTraites = apiDossiers.filter(dossier => this.missions.some(m => m.sinistre && m.sinistre.id === dossier.id)).length;
      // Dossiers commission payée : à adapter selon la logique métier (exemple : statut = 'COMMISSION_PAYEE')
      this.dossiersCommissionPayee = apiDossiers.filter(dossier => dossier.statut && dossier.statut.toLowerCase().includes('commission')).length;
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

  formatDate(date: Date): string {
    return date.toLocaleDateString('fr-FR');
  }
  

  attribuerSinistre(dossier: Dossier): void {
    console.log('Attribution du dossier à un sinistre:', dossier);
    // TODO: Implémenter l'attribution à un sinistre
  }

  supprimerDossier(dossier: Dossier): void {
    console.log('Suppression du dossier:', dossier);
    // TODO: Implémenter la suppression du dossier
    this.dataSource.data = this.dataSource.data.filter(d => d.id !== dossier.id);
    this.dataSource._updateChangeSubscription();
  }

  setCardView(isCard: boolean) {
    this.isCardView = isCard;
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
}