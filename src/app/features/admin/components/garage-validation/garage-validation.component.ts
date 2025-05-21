import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

interface Garage {
  id: number;
  nom: string;
  adresse: string;
  telephone: string;
  email: string;
  statut: 'EN_ATTENTE' | 'VALIDÉ' | 'REJETÉ';
  documents: {
    siret: boolean;
    assurance: boolean;
    certification: boolean;
  };
  commission: number;
}

@Component({
  selector: 'app-garage-validation',
  templateUrl: './garage-validation.component.html',
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
export class GarageValidationComponent implements OnInit, AfterViewInit {
  displayedColumns: string[] = ['nom', 'adresse', 'telephone', 'email', 'documents', 'commission', 'actions'];
  dataSource: MatTableDataSource<Garage>;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor() {
    this.dataSource = new MatTableDataSource();
  }

  ngOnInit(): void {
    this.loadGarages();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  loadGarages(): void {
    // Données de test
    const garages: Garage[] = [
      {
        id: 1,
        nom: 'Garage Auto Plus',
        adresse: '123 rue de la République, Paris',
        telephone: '01 23 45 67 89',
        email: 'contact@garageautoplus.fr',
        statut: 'EN_ATTENTE',
        documents: {
          siret: true,
          assurance: true,
          certification: false
        },
        commission: 15
      }
    ];
    this.dataSource.data = garages;
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  validerGarage(garage: Garage): void {
    // TODO: Implémenter la validation du garage
    console.log('Validation du garage:', garage);
  }

  rejeterGarage(garage: Garage): void {
    // TODO: Implémenter le rejet du garage
    console.log('Rejet du garage:', garage);
  }

  modifierCommission(garage: Garage, nouvelleCommission: number): void {
    // TODO: Implémenter la modification de la commission
    console.log('Modification de la commission:', garage, nouvelleCommission);
  }
} 