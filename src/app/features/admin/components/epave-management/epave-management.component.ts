import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

interface Epave {
  id: number;
  marque: string;
  modele: string;
  annee: number;
  immatriculation: string;
  proprietaire: string;
  statut: 'EN_ATTENTE' | 'VALIDÉ' | 'REJETÉ';
  documents: {
    certificatDestruction: boolean;
    certificatNonGage: boolean;
    certificatNonVol: boolean;
  };
  dateAnnonce: Date;
}

@Component({
  selector: 'app-epave-management',
  templateUrl: './epave-management.component.html',
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
export class EpaveManagementComponent implements OnInit, AfterViewInit {
  displayedColumns: string[] = ['marque', 'modele', 'annee', 'immatriculation', 'proprietaire', 'documents', 'dateAnnonce', 'actions'];
  dataSource: MatTableDataSource<Epave>;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor() {
    this.dataSource = new MatTableDataSource();
  }

  ngOnInit(): void {
    this.loadEpaves();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  loadEpaves(): void {
    // Données de test
    const epaves: Epave[] = [
      {
        id: 1,
        marque: 'Renault',
        modele: 'Clio',
        annee: 2010,
        immatriculation: 'AB-123-CD',
        proprietaire: 'Jean Dupont',
        statut: 'EN_ATTENTE',
        documents: {
          certificatDestruction: true,
          certificatNonGage: true,
          certificatNonVol: false
        },
        dateAnnonce: new Date()
      }
    ];
    this.dataSource.data = epaves;
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  validerEpave(epave: Epave): void {
    // TODO: Implémenter la validation de l'épave
    console.log('Validation de l\'épave:', epave);
  }

  rejeterEpave(epave: Epave): void {
    // TODO: Implémenter le rejet de l'épave
    console.log('Rejet de l\'épave:', epave);
  }
} 