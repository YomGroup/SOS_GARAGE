import { Component, OnInit } from '@angular/core';
import { inject } from '@angular/core';
import { VehicleService } from '../../services/vehicle.service';
import { RouterLink } from '@angular/router';
import { SinistreService } from '../../services/sinistre.service';
import { AuthService } from '../../services/auth.service';
import { AssureService } from '../../services/assure.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-home',
  imports: [RouterLink, CommonModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit {
  private vehiculeService = inject(VehicleService);
  private sinistreService = inject(SinistreService);
  private authService = inject(AuthService);
  private assureService = inject(AssureService);
  userid: string | null = null;
  assureId: number = 0;
  sinistreDataLimited: any = [];
  vehiculesDataLimited: any = [];
  vehicules: any[] = [];
  vehiclesCount: number = 0;
  sinistreData: any;
  sinistreCount: number = 0;
  sinistreOpenStates: { [vehicleId: number]: boolean } = {};
  ngOnInit(): void {
    this.userid = this.authService.getToken()?.['sub'] ?? null;

    if (this.userid) {
      this.assureService.getAssurerID(this.userid).subscribe({
        next: (data: any) => {
          this.assureId = data.id; // adapte selon ta réponse
          this.loadVehicules(this.assureId);
          this.loadSinistre(); // tu peux aussi appeler ici
        },
        error: (err) => {
          console.error('Erreur lors de la récupération de l’assure  ID :', err);
        }
      });
    }
  }

  async loadVehicules(assureId: number): Promise<void> {
    (await this.vehiculeService.getVehiculesDataById(assureId)).subscribe({
      next: (data: any[]) => {
        console.log('Véhicules reçus :', data);

        // 1. Tous les véhicules
        this.vehicules = data;

        // 2. Filtrer ceux qui ont des sinistres
        const vehiculesAvecSinistres = data.filter(v => v.sinistres && v.sinistres.length > 0);

        // 3. Trier les véhicules avec sinistres par date de création descendante
        vehiculesAvecSinistres.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        // 4. Limiter à 3 véhicules avec sinistres
        this.vehiculesDataLimited = vehiculesAvecSinistres.slice(0, 3);

        // 5. Compter tous les véhicules (même ceux sans sinistre)
        this.vehiclesCount = data.length;

        console.log('Véhicules affichés avec sinistre (max 3) :', this.vehiculesDataLimited);
      },
      error: (err: any) => {
        console.error('Erreur lors de l’appel API véhicules :', err);
      }
    });
  }

  toggleSinistreList(vehicleId: number): void {
    this.sinistreOpenStates[vehicleId] = !this.sinistreOpenStates[vehicleId];
  }
  getTimeSince(dateStr: string): string {
    const now = new Date();
    const past = new Date(dateStr);
    const diffMs = now.getTime() - past.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffHrs = Math.floor(diffMin / 60);

    if (diffMin < 1) return 'À l’instant';
    if (diffMin < 60) return `Il y a ${diffMin} min`;
    if (diffHrs < 24) return `Il y a ${diffHrs} h`;
    return past.toLocaleDateString(); // fallback
  }

  private async loadSinistre(): Promise<void> {
    (await this.sinistreService.getsinistreGet(this.assureId)).subscribe({
      next: (data: any) => {
        if (Array.isArray(data)) {
          this.sinistreData = data;
          this.sinistreDataLimited = this.sinistreData.slice(0, 3);
          this.sinistreCount = data.length;
        } else if (data) {
          this.sinistreData = [data];
          this.sinistreDataLimited = this.sinistreData.slice(0, 3);
          this.sinistreCount = 1;
        } else {
          this.sinistreData = [];
          this.sinistreDataLimited = [];
          this.sinistreCount = 0;
        }
      },
      error: (err) => {
        console.error('Erreur lors du chargement des données utilisateur', err);
      }
    });

  }


}
