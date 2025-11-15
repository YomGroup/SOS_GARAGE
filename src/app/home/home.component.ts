import { Component, OnInit } from '@angular/core';
import { inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

import { VehicleService } from '../../services/vehicle.service';
import { SinistreService } from '../../services/sinistre.service';
import { AuthService } from '../../services/auth.service';
import { AssureService } from '../../services/assure.service';

@Component({
  selector: 'app-home',
  imports: [RouterLink, CommonModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit {

  private sinistreService = inject(SinistreService);
  private authService = inject(AuthService);
  private assureService = inject(AssureService);

  userid: string | null = null;
  assureId: number = 0;

  // Champs venant du backend
  vehiclesCount: number = 0;
  sinistreCount: number = 0;
  sinistreEnCoursCount: number = 0;

  latestVehiclesWithClaims: any[] = [];
  recentVehicles: any[] = [];
  recentSinistres: any[] = [];

  // ❗ Champs nécessaires pour ton HTML
  vehicules: any[] = [];                // Pour *ngFor des véhicules
  vehiculesDataLimited: any[] = [];     // Pour *ngFor limité à 3 ou 5
  sinistreOpenStates: { [id: number]: boolean } = {}; // Toggle sinistres

  ngOnInit(): void {
    this.userid = this.authService.getToken()?.['sub'] ?? null;

    if (this.userid) {
      this.assureService.getAssurerID(this.userid).subscribe({
        next: (data: any) => {
          this.assureId = data.id;
          this.loadDashboard();
        },
        error: err => console.error('Erreur assure ID', err)
      });
    }
  }

  loadDashboard() {
    this.sinistreService.getDashboard(this.assureId).subscribe({
      next: (data) => {

        this.vehiclesCount = data.vehiclesCount;
        this.sinistreCount = data.sinistreCount;
        this.sinistreEnCoursCount = data.sinistreEnCoursCount;

        this.latestVehiclesWithClaims = data.latestVehiclesWithClaims ?? [];
        this.recentVehicles = data.recentVehicles ?? [];
        this.recentSinistres = data.recentSinistres ?? [];

        this.vehicules = data.recentVehicles ?? [];
        this.vehiculesDataLimited = (data.latestVehiclesWithClaims ?? []).slice(0, 5);
      },
      error: (err) => console.error('Erreur dashboard', err)
    });
  }

  // Pour ouvrir / fermer une liste de sinistres
  toggleSinistreList(vehicleId: number) {
    this.sinistreOpenStates[vehicleId] = !this.sinistreOpenStates[vehicleId];
  }

  // Formattage du temps
  getTimeSince(dateArr: number[]): string {
    const date = new Date(
      dateArr[0], dateArr[1] - 1, dateArr[2],
      dateArr[3], dateArr[4], dateArr[5]
    );

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffHrs = Math.floor(diffMin / 60);

    if (diffMin < 1) return 'À l’instant';
    if (diffMin < 60) return `Il y a ${diffMin} min`;
    if (diffHrs < 24) return `Il y a ${diffHrs} h`;

    return date.toLocaleDateString();
  }
}
