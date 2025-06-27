import { Component } from '@angular/core';
import { inject } from '@angular/core';
import { VehicleService } from '../../services/vehicle.service';
import { RouterLink } from '@angular/router';
import { SinistreService } from '../../services/sinistre.service';

@Component({
  selector: 'app-home',
  imports: [RouterLink],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent {
  private vehiculeService = inject(VehicleService);
  private sinistreService = inject(SinistreService);

  vehiclesCount: number = 0;
  sinistreData: any;
  sinistreCount: number = 0;
  constructor() {
    this.vehiculeService.getAllVehiculesPost().subscribe({
      next: (data: any) => {
        //this.vehicules = data.count;
        this.vehiclesCount = data.length;
        console.log('Données reçues :', data);
      },
      error: (err) => {
        console.error('Erreur lors de l’appel API :', err);
      }
    });
    this.loadSinistre();
  }

  private loadSinistre(): void {
    const userId = 11; // Remplacer par this.authService.getToken()?.id
    if (userId) {
      this.sinistreService.getsinistreGet(userId).subscribe({
        next: (data: any) => {
          if (Array.isArray(data)) {
            this.sinistreData = data;
            this.sinistreCount = data.length;
          } else if (data) {
            this.sinistreData = [data];
            this.sinistreCount = 1;
          } else {
            this.sinistreData = [];
            this.sinistreCount = 0;
          }
        },
        error: (err) => {
          console.error('Erreur lors du chargement des données utilisateur', err);
        }
      });

    }
  }

}
