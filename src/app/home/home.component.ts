import { Component } from '@angular/core';
import { inject } from '@angular/core';
import { VehicleService } from '../../services/vehicle.service';

@Component({
  selector: 'app-home',
  imports: [],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent {
  private vehiculeService = inject(VehicleService);
  vehiclesCount: number = 0;
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
  }
}
