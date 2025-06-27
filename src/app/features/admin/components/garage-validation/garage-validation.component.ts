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
import { MatDialog } from '@angular/material/dialog';
import { AdminService } from '../../../../../services/admin.service';
import { HttpClientModule } from '@angular/common/http';
import { ReparateurDetailsDialogComponent } from './dialogs/reparateur-details-dialog.component';
import { Router } from '@angular/router';

interface Reparateur {
  id: number;
  name: string;
  prenom: string;
  adresse: string;
  telephone: string;
  email: string;
  isvalids: boolean;
  documents?: {
    siret: boolean;
    assurance: boolean;
    certification: boolean;
  };
  commission?: number;
}

@Component({
  selector: 'app-garage-validation',
  templateUrl: './garage-validation.component.html',
  styleUrl: './garage-validation.component.css',
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
    HttpClientModule
  ],
  providers: [AdminService]
})
export class GarageValidationComponent implements OnInit, AfterViewInit {
  displayedColumns: string[] = ['nom', 'adresse', 'telephone', 'email', 'statut', 'commission', 'actions'];
  dataSource: MatTableDataSource<Reparateur>;

  stats = {
    enAttente: 0,
    actifs: 0,
    rejetes: 0,
    total: 0
  };

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private adminService: AdminService,
    private dialog: MatDialog,
    private router: Router
  ) {
    this.dataSource = new MatTableDataSource();
  }

  ngOnInit(): void {
    this.loadReparateurs();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  loadReparateurs(): void {
    this.adminService.getAllReparateurs().subscribe({
      next: (reparateurs) => {
        this.dataSource.data = reparateurs.map(r => ({
          ...r,
          documents: {
            siret: true, // À adapter selon vos données réelles
            assurance: true,
            certification: false
          },
          commission: 15 // Valeur par défaut
        }));

        this.calculateStats(reparateurs);
      },
      error: (error) => {
        console.error('Erreur lors du chargement des réparateurs:', error);
      }
    });
  }

  calculateStats(reparateurs: Reparateur[]): void {
    this.stats = {
      enAttente: reparateurs.filter(r => !r.isvalids).length,
      actifs: reparateurs.filter(r => r.isvalids).length,
      rejetes: 0, // À adapter si vous avez un champ pour les rejetés
      total: reparateurs.length
    };
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  validerReparateur(reparateur: Reparateur): void {
    this.adminService.validateReparateur(reparateur.id).subscribe({
      next: () => {
        reparateur.isvalids = true;
        this.calculateStats(this.dataSource.data);
      },
      error: (error) => {
        console.error('Erreur lors de la validation:', error);
      }
    });
  }

  rejeterReparateur(reparateur: Reparateur): void {
    this.adminService.rejectReparateur(reparateur.id).subscribe({
      next: () => {
        // Mettre à jour le statut localement
        // (vous pourriez aussi recharger les données)
        this.calculateStats(this.dataSource.data);
      },
      error: (error) => {
        console.error('Erreur lors du rejet:', error);
      }
    });
  }

  modifierCommission(reparateur: Reparateur, nouvelleCommission: number): void {
    this.adminService.updateCommission(reparateur.id, nouvelleCommission).subscribe({
      next: () => {
        reparateur.commission = nouvelleCommission;
      },
      error: (error) => {
        console.error('Erreur lors de la modification de la commission:', error);
      }
    });
  }

  viewDetails(reparateur: Reparateur): void {
    const dialogRef = this.dialog.open(ReparateurDetailsDialogComponent, {
      width: '800px',
      data: { reparateur }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        switch (result.action) {
          case 'validate':
            // Le réparateur a été validé, recharger les données
            this.loadReparateurs();
            break;
          case 'reject':
            // Le réparateur a été rejeté, recharger les données
            this.loadReparateurs();
            break;
          case 'modifyCommission':
            // La commission a été modifiée, recharger les données
            this.loadReparateurs();
            break;
          case 'sendMessage':
            // Message envoyé (à implémenter selon vos besoins)
            console.log('Message envoyé à:', result.reparateur.name);
            break;
          case 'suspend':
            // Compte suspendu (à implémenter selon vos besoins)
            console.log('Compte suspendu:', result.reparateur.name);
            break;
        }
      }
    });
  }

  getStatusClass(isValid: boolean): string {
    return isValid ? 'status-active' : 'status-pending';
  }

  getStatusText(isValid: boolean): string {
    return isValid ? 'Validé' : 'En attente';
  }

  get reparateursEnAttente(): Reparateur[] {
    return this.dataSource.data.filter(r => !r.isvalids);
  }

  get reparateursActifs(): Reparateur[] {
    return this.dataSource.data.filter(r => r.isvalids);
  }

  ajouterGarage(): void {
    this.router.navigate(['/admin/garages/nouveau']);
  }
}