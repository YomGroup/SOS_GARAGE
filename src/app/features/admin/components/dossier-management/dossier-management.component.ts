import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

interface Dossier {
  id: number;
  numero: string;
  type: 'ASSURANCE' | 'REPARATION';
  statut: 'EN_COURS' | 'VALIDÉ' | 'REJETÉ';
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
    MatButtonModule
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
    // TODO: Charger les dossiers depuis le backend
    this.loadDossiers();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  loadDossiers(): void {
    // Données de test
    const dossiers: Dossier[] = [
      {
        id: 1,
        numero: 'DOS-2024-001',
        type: 'ASSURANCE',
        statut: 'EN_COURS',
        dateCreation: new Date(),
        documents: {
          contratAssurance: true,
          carteGrise: true,
          facture: false
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

  validerDossier(dossier: Dossier): void {
    // TODO: Implémenter la validation du dossier
    console.log('Validation du dossier:', dossier);
  }

  rejeterDossier(dossier: Dossier): void {
    // TODO: Implémenter le rejet du dossier
    console.log('Rejet du dossier:', dossier);
  }
} 