import { Component, OnInit, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, NavigationEnd } from '@angular/router';
import { Subscription } from 'rxjs';
import { VehicleService, Vehicle } from '../../../../../services/vehicle.service';

@Component({
  selector: 'app-vehicules',
  templateUrl: './vehicules.component.html',
  styleUrl: './vehicules.component.css',
  standalone: true,
  imports: [CommonModule, FormsModule],
})
export class VehiculesComponent implements OnInit, OnDestroy {
  vehicles: Vehicle[] = [];
  searchTerm: string = '';
  private initialized = false;
  private routerSub: Subscription | undefined;

  // Pagination
  currentPage = 1;
  pageSize = 12;
  totalVehicles = 0;

  constructor(
    private vehiculeService: VehicleService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadVehiclesPage();
    this.initialized = true;
    this.routerSub = this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd && this.initialized) {
        this.loadVehiclesPage();
        this.cdr.detectChanges();
      }
    });
  }

  ngOnDestroy(): void {
    if (this.routerSub) {
      this.routerSub.unsubscribe();
    }
  }

  loadVehiclesPage(): void {
    this.vehiculeService.getVehiculesPage(this.currentPage, this.pageSize).subscribe({
      next: (res: any) => {
        // On suppose que l'API retourne { data: Vehicle[], total: number }
        if (Array.isArray(res)) {
          this.vehicles = res;
          this.totalVehicles = res.length;
        } else {
          this.vehicles = res.data || [];
          this.totalVehicles = res.total || this.vehicles.length;
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erreur lors de la récupération des véhicules :', err);
      }
    });
  }

  get filteredVehicles(): Vehicle[] {
    const term = this.searchTerm.trim().toLowerCase();
    if (!term) return this.vehicles;
    return this.vehicles.filter(vehicle =>
      (vehicle.immatriculation?.toLowerCase().includes(term) ||
       vehicle.marque?.toLowerCase().includes(term) ||
       vehicle.modele?.toLowerCase().includes(term))
    );
  }

  get totalPages(): number {
    return Math.ceil(this.totalVehicles / this.pageSize);
  }

  goToPage(page: number) {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.loadVehiclesPage();
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.loadVehiclesPage();
    }
  }

  prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadVehiclesPage();
    }
  }
}
