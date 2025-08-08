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
  selectedVehicle: Vehicle | null = null;
  vehicles: Vehicle[] = [];
  searchTerm: string = '';
  private initialized = false;
  private routerSub: Subscription | undefined;
  isLoadingVehicules: boolean = false;

  // Pagination
  currentPage = 1;
  pageSize = 12;
  totalVehicles = 0;
  pageSizes: number[] = [6, 12, 24, 48];

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
    this.isLoadingVehicules = true;
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
      },
      complete: () => {
        this.isLoadingVehicules = false;
        this.cdr.detectChanges();
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

  get pages(): number[] {
    const count = this.totalPages;
    return Array.from({ length: count }, (_, i) => i + 1);
  }

  get pageRangeStart(): number {
    if (this.totalVehicles === 0) return 0;
    return (this.currentPage - 1) * this.pageSize + 1;
    }

  get pageRangeEnd(): number {
    const end = this.currentPage * this.pageSize;
    return end > this.totalVehicles ? this.totalVehicles : end;
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

  onPageSizeChange(newSize: number | string): void {
    const parsed = typeof newSize === 'string' ? parseInt(newSize, 10) : newSize;
    if (!Number.isFinite(parsed) || parsed <= 0) return;
    this.pageSize = parsed as number;
    this.currentPage = 1;
    this.loadVehiclesPage();
  }

  trackByVehicleId(index: number, vehicle: Vehicle): string | number {
    return vehicle.id || index;
  }
}
