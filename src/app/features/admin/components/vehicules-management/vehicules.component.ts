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
  get filteredVehicles(): Vehicle[] {
    const term = this.searchTerm.trim().toLowerCase();
    if (!term) {
      return this.vehicles;
    }
    return this.vehicles.filter(vehicle =>
      (vehicle.immatriculation?.toLowerCase().includes(term) ||
       vehicle.marque?.toLowerCase().includes(term) ||
       vehicle.modele?.toLowerCase().includes(term))
    );
  }

  get paginatedVehicles(): Vehicle[] {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    return this.filteredVehicles.slice(start, end);
  }
  private initialized = false;
  private routerSub: Subscription | undefined;
  isLoadingVehicules: boolean = false;

  // Pagination
  currentPage = 1;
  pageSize = 12;
  get totalVehicles(): number {
    return this.filteredVehicles.length;
  }
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
    this.vehiculeService.getVehiculesPage(1, 9999).subscribe({ // Fetch all vehicles
      next: (res: any) => {
        this.vehicles = Array.isArray(res) ? res : (res.data || []);
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erreur lors de la récupération des véhicules :', err);
        this.isLoadingVehicules = false;
        this.cdr.detectChanges();
      },
      complete: () => {
        this.isLoadingVehicules = false;
        this.cdr.detectChanges();
      }
    });
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
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }

  prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  onPageSizeChange(newSize: number | string): void {
    const parsed = typeof newSize === 'string' ? parseInt(newSize, 10) : newSize;
    if (!Number.isFinite(parsed) || parsed <= 0) return;
    this.pageSize = parsed as number;
    this.currentPage = 1;
  }

  trackByVehicleId(index: number, vehicle: Vehicle): string | number {
    return vehicle.id || index;
  }
}
