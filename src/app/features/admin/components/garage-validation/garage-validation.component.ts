import { Component, OnInit, ViewChild, AfterViewInit, ChangeDetectorRef } from '@angular/core';
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
import { Router, NavigationEnd } from '@angular/router';
import { ReparateurService } from '../../../../../services/reparateur.service';
import { Reparateur } from '../../../../../services/models-api.interface';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FormsModule } from '@angular/forms';

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
    HttpClientModule,
    FormsModule
  ],
  providers: [AdminService]
})
export class GarageValidationComponent implements OnInit, AfterViewInit {
  displayedColumns: string[] = ['nom', 'adresse', 'telephone', 'email', 'statut', 'commission', 'actions'];
  dataSource: MatTableDataSource<Reparateur>;

  stats = {
    enAttente: 0,
    valides: 0,
    rejetes: 0,
    total: 0
  };

  selectedStatus: string = '';
  selectedVille: string = '';
  searchNom: string = '';
  villesDisponibles: string[] = [];

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  editedCommissionId: number | null = null;
  editedCommissionValue: number | null = null;

  constructor(
    private reparateurService: ReparateurService,
    private dialog: MatDialog,
    private router: Router,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {
    this.dataSource = new MatTableDataSource();
  }

  ngOnInit(): void {
    this.loadData();
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.loadData();
      }
    });
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  loadData(): void {
    this.reparateurService.getAllReparateurs().subscribe({
      next: (reparateurs) => {
        // Récupérer toutes les villes distinctes
        this.villesDisponibles = Array.from(new Set(reparateurs.map(r => r.ville).filter(Boolean)));
        // Appliquer les filtres
        let filtered = reparateurs;
        if (this.selectedStatus) {
          if (this.selectedStatus === 'pending') filtered = filtered.filter(r => r.isvalids === 'en attente');
          else if (this.selectedStatus === 'active') filtered = filtered.filter(r => r.isvalids === 'valide');
          else if (this.selectedStatus === 'rejected') filtered = filtered.filter(r => r.isvalids === 'rejetée');
        }
        if (this.selectedVille) {
          filtered = filtered.filter(r => r.ville === this.selectedVille);
        }
        if (this.searchNom) {
          filtered = filtered.filter(r => (r.nomDuGarage || '').toLowerCase().includes(this.searchNom.toLowerCase()));
        }
        this.dataSource.data = filtered;
        this.calculateStats(reparateurs); // stats sur tous les garages
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Erreur lors du chargement des réparateurs:', error);
      }
    });
  }

  calculateStats(reparateurs: Reparateur[]): void {
    this.stats = {
      enAttente: reparateurs.filter(r => r.isvalids === 'en attente').length,
      valides: reparateurs.filter(r => r.isvalids === 'valide').length,
      rejetes: reparateurs.filter(r => r.isvalids === 'rejetée').length,
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
    const updated = { ...reparateur, isvalids: 'valide', isValids: 'valide' };
    this.reparateurService.updateReparateur(reparateur.id ?? 0, updated).subscribe({
      next: () => {
        this.loadData();
      },
      error: (error) => {
        console.error('Erreur lors de la validation:', error);
      }
    });
  }

  rejeterReparateur(reparateur: Reparateur): void {
    const updated = { ...reparateur, isvalids: 'rejetée', isValids: 'rejetée' };
    this.reparateurService.updateReparateur(reparateur.id ?? 0, updated).subscribe({
      next: () => {
        this.loadData();
      },
      error: (error) => {
        console.error('Erreur lors du rejet:', error);
      }
    });
  }

  modifierCommission(reparateur: Reparateur, nouvelleCommission: number): void {
    const updated = { ...reparateur, commission: nouvelleCommission, isvalids: 'valide', isValids: 'valide' };
    this.reparateurService.updateReparateur(reparateur.id ?? 0, updated).subscribe({
      next: () => {
        this.snackBar.open('Commission modifiée avec succès.', 'Fermer', { duration: 3000 });
        this.loadData();
      },
      error: (error) => {
        this.snackBar.open('Erreur lors de la modification de la commission.', 'Fermer', { duration: 3000 });
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
            this.loadData();
            break;
          case 'reject':
            // Le réparateur a été rejeté, recharger les données
            this.loadData();
            break;
          case 'modifyCommission':
            // La commission a été modifiée, recharger les données
            this.loadData();
            break;
          case 'sendMessage':
            // Message envoyé (à implémenter selon vos besoins)
            console.log('Message envoyé à:', result.reparateur.name);
            break;
          case 'suspend':
            // Compte suspendu, recharger les données
            this.loadData();
            break;
        }
      }
    });
  }

  getStatusClass(isValid: string): string {
    return isValid === 'valide' ? 'status-active' : 'status-pending';
  }

  getStatusText(isValid: string): string {
    return isValid === 'valide' ? 'Validé' : 'En attente';
  }

  get reparateursEnAttente(): Reparateur[] {
    return this.dataSource.data.filter(r => r.isvalids === 'en_attente');
  }

  get reparateursActifs(): Reparateur[] {
    return this.dataSource.data.filter(r => r.isvalids === 'valide');
  }

  ajouterGarage(): void {
    this.router.navigate(['/admin/garages/nouveau']);
  }

  openCommissionPrompt(reparateur: Reparateur): void {
    const input = prompt('Nouvelle commission (%)', reparateur.commission !== null && reparateur.commission !== undefined ? reparateur.commission.toString() : '0');
    if (input !== null) {
      const value = parseFloat(input);
      if (!isNaN(value) && value >= 0 && value <= 100) {
        this.modifierCommission(reparateur, value);
      } else {
        alert('Veuillez entrer une commission valide entre 0 et 100.');
      }
    }
  }

  startEditCommission(reparateur: Reparateur): void {
    this.editedCommissionId = reparateur.id ?? 0;
    this.editedCommissionValue = reparateur.commission ?? 0;
  }

  cancelEditCommission(): void {
    this.editedCommissionId = null;
    this.editedCommissionValue = null;
  }

  saveEditCommission(reparateur: Reparateur): void {
    if (this.editedCommissionValue === null || isNaN(this.editedCommissionValue) || this.editedCommissionValue < 0 || this.editedCommissionValue > 100) {
      this.snackBar.open('Veuillez entrer une commission valide entre 0 et 100.', 'Fermer', { duration: 3000 });
      return;
    }
    const updatedReparateur = { ...reparateur, commission: this.editedCommissionValue, isvalids: 'valide', isValids: 'valide' };
    this.reparateurService.updateReparateur(reparateur.id ?? 0, updatedReparateur).subscribe({
      next: () => {
        this.snackBar.open('Commission modifiée avec succès.', 'Fermer', { duration: 3000 });
        this.loadData();
      },
      error: (error) => {
        this.snackBar.open('Erreur lors de la modification de la commission.', 'Fermer', { duration: 3000 });
        console.error('Erreur lors de la modification de la commission:', error);
      }
    });
    this.editedCommissionId = null;
    this.editedCommissionValue = null;
  }

  suspendreReparateur(reparateur: Reparateur): void {
    const updated = { ...reparateur, isvalids: 'rejetée', isValids: 'rejetée' };
    this.reparateurService.updateReparateur(reparateur.id ?? 0, updated).subscribe({
      next: () => {
        this.snackBar.open('Garage suspendu avec succès.', 'Fermer', { duration: 3000 });
        this.loadData();
      },
      error: (error) => {
        this.snackBar.open('Erreur lors de la suspension.', 'Fermer', { duration: 3000 });
        console.error('Erreur lors de la suspension:', error);
      }
    });
  }

  supprimerReparateur(reparateur: Reparateur): void {
    if (confirm('Voulez-vous vraiment supprimer ce garage ?')) {
      this.reparateurService.deleteReparateur(reparateur.id ?? 0).subscribe({
        next: () => {
          this.snackBar.open('Garage supprimé avec succès.', 'Fermer', { duration: 3000 });
          this.loadData();
        },
        error: (error) => {
          this.snackBar.open('Erreur lors de la suppression.', 'Fermer', { duration: 3000 });
          console.error('Erreur lors de la suppression:', error);
        }
      });
    }
  }

  get tousLesGarages(): Reparateur[] {
    return this.dataSource.data;
  }
}