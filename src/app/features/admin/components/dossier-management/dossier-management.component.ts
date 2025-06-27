// dossier-management.component.ts
import { Component, OnInit, ViewChild, AfterViewInit, ViewContainerRef, ComponentRef } from '@angular/core';
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
import { DossierDetailsDialogComponent } from  './dialogs/dossier-details-dialog.component';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { DossierEditComponent } from './dossier-edit/dossier-edit.component';

interface Dossier {
  id: number;
  numero: string;
  type: 'CONTRAT' | 'FACTURE' | 'DEVIS';
  statut: 'EN_COURS' | 'VALIDÉ' | 'REJETÉ' | 'EN_ATTENTE';
  dateCreation: Date;
  documents: {
    contratAssurance: boolean;
    carteGrise: boolean;
    facture: boolean;
  };
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
    DossierEditComponent,
    RouterModule,
    DossierDetailsDialogComponent
  ]
})
export class DossierManagementComponent implements OnInit, AfterViewInit {
  displayedColumns: string[] = ['numero', 'type', 'statut', 'dateCreation', 'documents', 'actions'];
  dataSource: MatTableDataSource<Dossier>;
  isCardView: boolean = true;
  private dialogComponentRef?: ComponentRef<DossierDetailsDialogComponent>;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild('dialogContainer', { read: ViewContainerRef }) dialogContainer!: ViewContainerRef;

  constructor(
    private dossiersService: DossiersService, 
    private dialog: MatDialog, 
    private router: Router, 
    private route: ActivatedRoute,
    private viewContainerRef: ViewContainerRef
  ) {
    this.dataSource = new MatTableDataSource();
  }

  ngOnInit(): void {
    this.dossiersService.getDossiers().subscribe(apiDossiers => {
      this.dataSource.data = apiDossiers.map(d => ({
        id: d.id,
        numero: d.id.toString(),
        type: (d.type === 'CONTRAT' || d.type === 'FACTURE' || d.type === 'DEVIS') ? d.type : 'CONTRAT',
        statut: d.conditionsAcceptees ? 'VALIDÉ' : 'EN_ATTENTE',
        dateCreation: new Date(), // à adapter si l'API fournit la date
        documents: {
          contratAssurance: d.documents?.length > 0, // exemple, à adapter
          carteGrise: false, // à adapter
          facture: false // à adapter
        }
      }));
    });
    this.initializeViewToggle();
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
   this.dialog.open(DossierDetailsDialogComponent, {
    data: dossier,
    width: '90vw',
    maxWidth: '1200px',
    autoFocus: false,
    panelClass: 'custom-dialog-panel'
   });
   this.router.navigate(['/admin/dossiers/details', dossier.id]);
  }

  formatDate(date: Date): string {
    return date.toLocaleDateString('fr-FR');
  }

  editDossier(dossier: Dossier): void {
    this.router.navigate(['/admin/dossiers/edit', dossier.id]);
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

  private initializeViewToggle(): void {
    const cardViewBtn = document.getElementById('cardView');
    const tableViewBtn = document.getElementById('tableView');
    const cardViewContainer = document.getElementById('cardViewContainer');
    const tableViewContainer = document.getElementById('tableViewContainer');

    if (cardViewBtn && tableViewBtn && cardViewContainer && tableViewContainer) {
      cardViewBtn.addEventListener('click', () => {
        this.isCardView = true;
        cardViewBtn.classList.add('active');
        tableViewBtn.classList.remove('active');
        cardViewContainer.style.display = 'flex';
        tableViewContainer.style.display = 'none';
      });

      tableViewBtn.addEventListener('click', () => {
        this.isCardView = false;
        tableViewBtn.classList.add('active');
        cardViewBtn.classList.remove('active');
        tableViewContainer.style.display = 'block';
        cardViewContainer.style.display = 'none';
      });
    }
  }
}