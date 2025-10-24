import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
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
export class GarageValidationComponent implements OnInit {
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

  editedCommissionId: number | null = null;
  editedCommissionValue: number | null = null;

  // Pagination properties (server-side)
  currentPage: number = 0; // zero-based for API
  itemsPerPage: number = 6;
  totalPages: number = 0;
  totalItems: number = 0;
  paginatedGarages: Reparateur[] = [];

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

  loadData(page: number = 0): void {
    // Map local filter values to API filter params if your backend supports them
    const filters: any = {};
    if (this.selectedStatus) filters.status = this.selectedStatus;
    if (this.selectedVille) filters.ville = this.selectedVille;
    if (this.searchNom) filters.q = this.searchNom;

    this.reparateurService.getReparateursPage(page, this.itemsPerPage, filters).subscribe({
      next: (resp: any) => {
        const content = resp?.content || [];
        this.paginatedGarages = content;
        this.dataSource.data = content;
        this.currentPage = resp?.number ?? page;
        this.totalItems = resp?.totalElements ?? (content.length);
        this.totalPages = resp?.totalPages ?? Math.ceil(this.totalItems / this.itemsPerPage);

        // villes and stats should be derived from full dataset; if API doesn't provide it, derive from current page
        this.villesDisponibles = Array.from(new Set(content.map((r: any) => r.ville).filter(Boolean)));
        this.calculateStats(content);
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Erreur lors du chargement des réparateurs (page):', error);
      }
    });
  }

  // Server-driven pagination controls
  goToPage(pageOneBased: number): void {
    const pageZeroBased = Math.max(0, pageOneBased - 1);
    if (pageZeroBased < 0 || (this.totalPages && pageZeroBased >= this.totalPages)) return;
    // Request the page from API
    this.loadData(pageZeroBased);
  }

  nextPage(): void {
    this.loadData(this.currentPage + 1);
  }

  previousPage(): void {
    this.loadData(Math.max(0, this.currentPage - 1));
  }

  getPages(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  calculateStats(reparateurs: Reparateur[]): void {
    // Utiliser la normalisation de statut pour couvrir les variantes du backend
    let enAttente = 0, valides = 0, rejetes = 0;
    reparateurs.forEach(r => {
      const s = this.getReparateurStatus(r);
      if (s === 'en attente') enAttente++;
      else if (s === 'valide') valides++;
      else if (s === 'rejeté' || s === 'rejetée' || s === 'rejetes' || s === 'rejet') rejetes++;
    });
    this.stats = { enAttente, valides, rejetes, total: reparateurs.length };
  }

  // Normalise le statut d'un réparateur en une des valeurs: 'en attente' | 'valide' | 'rejeté' | string
  getReparateurStatus(r: Reparateur): string {
    if (!r) return 'en attente';
    const raw = (r as any).isValids ?? (r as any).isvalids ?? (r as any).isValide ?? (r as any).isValid ?? (r as any).isvalid;
    if (raw === undefined || raw === null) return 'en attente';
    if (typeof raw === 'boolean') return raw ? 'valide' : 'rejeté';
    const s = String(raw).toLowerCase().trim();
    // Mapping commun
    if (s === 'true' || s.includes('valide') || s.includes('active') || s.includes('valid')) return 'valide';
    if (s.includes('attente') || s.includes('pending')) return 'en attente';
    if (s.includes('rej') || s.includes('reject') || s.includes('false')) return 'rejeté';
    // Retourner la string normalisée si non reconnue
    return s;
  }

  validerReparateur(reparateur: Reparateur): void {
    const updated = { "isValids": "valide" };
    this.reparateurService.updateReparateurPatch(reparateur.id ?? 0, updated).subscribe({
      next: () => this.loadData(),
      error: (error) => console.error('Erreur lors de la validation:', error)
    });
  }

  rejeterReparateur(reparateur: Reparateur): void {
    const updated = { "isValids": "rejetée" };
    this.reparateurService.updateReparateurPatch(reparateur.id ?? 0, updated).subscribe({
      next: () => this.loadData(),
      error: (error) => console.error('Erreur lors du rejet:', error)
    });
  }

  modifierCommission(reparateur: Reparateur, nouvelleCommission: number): void {
    const updated = { "commission": nouvelleCommission, "isValids": "valide" };
    this.reparateurService.updateReparateurPatchText(reparateur.id ?? 0, updated).subscribe({
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
        this.loadData();
      }
    });
  }

  ajouterGarage(): void {
    this.router.navigate(['/admin/garages/nouveau']);
  }

  openCommissionPrompt(reparateur: Reparateur): void {
    const input = prompt('Nouvelle commission (%)', reparateur.commission?.toString() ?? '0');
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
    const updatedReparateur = { "commission": this.editedCommissionValue, "isValids": "valide" };
    this.reparateurService.updateReparateurPatchText(reparateur.id ?? 0, updatedReparateur).subscribe({
      next: () => {
        this.snackBar.open('Commission modifiée avec succès.', 'Fermer', { duration: 3000 });
        this.loadData();
        this.cancelEditCommission();
      },
      error: (error) => {
        this.snackBar.open('Erreur lors de la modification de la commission.', 'Fermer', { duration: 3000 });
        console.error('Erreur lors de la modification de la commission:', error);
      }
    });
  }

  suspendreReparateur(reparateur: Reparateur): void {
    const updated = { "isValids": "rejetée" };
    this.reparateurService.updateReparateurPatchText(reparateur.id ?? 0, updated).subscribe({
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
    return this.paginatedGarages;
  }
}
