// dossier-management.component.ts
import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
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
    MatTooltipModule
  ]
})
export class DossierManagementComponent implements OnInit, AfterViewInit {
  displayedColumns: string[] = ['numero', 'type', 'statut', 'dateCreation', 'documents', 'actions'];
  dataSource: MatTableDataSource<Dossier>;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor() {
    this.dataSource = new MatTableDataSource();
  }

  ngOnInit(): void {
    this.loadDossiers();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  loadDossiers(): void {
    const dossiers: Dossier[] = [
      {
        id: 1,
        numero: 'A56',
        type: 'CONTRAT',
        statut: 'VALIDÉ',
        dateCreation: new Date('2025-05-12'),
        documents: {
          contratAssurance: true,
          carteGrise: false,
          facture: true
        }
      },
      {
        id: 2,
        numero: 'B72',
        type: 'FACTURE',
        statut: 'EN_ATTENTE',
        dateCreation: new Date('2025-05-10'),
        documents: {
          contratAssurance: true,
          carteGrise: true,
          facture: false
        }
      },
      {
        id: 3,
        numero: 'C89',
        type: 'DEVIS',
        statut: 'REJETÉ',
        dateCreation: new Date('2025-05-08'),
        documents: {
          contratAssurance: false,
          carteGrise: false,
          facture: true
        }
      },
      {
        id: 4,
        numero: 'D45',
        type: 'CONTRAT',
        statut: 'VALIDÉ',
        dateCreation: new Date('2025-05-05'),
        documents: {
          contratAssurance: true,
          carteGrise: true,
          facture: true
        }
      }
    ];
    this.dataSource.data = dossiers;
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
    console.log('Voir le dossier:', dossier);
    // TODO: Naviguer vers la page de détail du dossier
  }

  formatDate(date: Date): string {
    return date.toLocaleDateString('fr-FR');
  }
}