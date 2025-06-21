import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
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

interface Reparation {
  id: number;
  vehicule: string;
  statut: 'EN_COURS' | 'TERMINEE' | 'EN_ATTENTE' | 'EPAVE';
  dateReception: Date;
  montantDevis: number;
  montantFacture: number;
}

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
    MatSelectModule
  ]
})
export class ReparationManagementComponent implements OnInit, AfterViewInit {
  displayedColumns: string[] = ['vehicule', 'statut', 'dateReception', 'montantDevis', 'montantFacture', 'actions'];
  dataSource: MatTableDataSource<Reparation>;
  isCardView: boolean = true;
  filtreStatut: string = '';

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor() {
    this.dataSource = new MatTableDataSource();
    // Custom filter predicate for search + statut
    this.dataSource.filterPredicate = (data: Reparation, filter: string) => {
      const search = filter.toLowerCase();
      const matchStatut = this.filtreStatut ? data.statut === this.filtreStatut : true;
      const matchText =
        data.vehicule.toLowerCase().includes(search) ||
        data.statut.toLowerCase().includes(search) ||
        data.montantDevis.toString().includes(search) ||
        data.montantFacture.toString().includes(search);
      return matchStatut && matchText;
    };
  }

  ngOnInit(): void {
    this.loadReparations();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  loadReparations(): void {
    const reparations: Reparation[] = [
      {
        id: 1,
        vehicule: 'Peugeot 208',
        statut: 'EN_COURS',
        dateReception: new Date('2024-06-01'),
        montantDevis: 1200,
        montantFacture: 0
      },
      {
        id: 2,
        vehicule: 'Renault Clio',
        statut: 'EN_ATTENTE',
        dateReception: new Date('2024-05-28'),
        montantDevis: 800,
        montantFacture: 0
      },
      {
        id: 3,
        vehicule: 'Citroën C3',
        statut: 'TERMINEE',
        dateReception: new Date('2024-05-20'),
        montantDevis: 950,
        montantFacture: 950
      }
    ];
    this.dataSource.data = reparations;
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
    reparation.statut = nouveauStatut as any;
    this.dataSource._updateChangeSubscription();
  }

  validerFacture(reparation: Reparation): void {
    reparation.montantFacture = reparation.montantDevis;
    reparation.statut = 'TERMINEE';
    this.dataSource._updateChangeSubscription();
  }

  declarerEpave(reparation: Reparation): void {
    reparation.statut = 'EPAVE';
    this.dataSource._updateChangeSubscription();
  }

  formatDate(date: Date): string {
    return date.toLocaleDateString('fr-FR');
  }
} 