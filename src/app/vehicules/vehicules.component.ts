import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { VehicleService, Vehicle } from '../../services/vehicle.service';
import { inject } from '@angular/core';

@Component({
  selector: 'app-vehicules',
  imports: [FormsModule, CommonModule],
  templateUrl: './vehicules.component.html',
  styleUrl: './vehicules.component.css'
})
export class VehiculesComponent {
  private vehiculeService = inject(VehicleService);
  vehicles: Vehicle[] = [];
  showAddForm = false;
  newVehicle: Partial<Vehicle> = {};

  constructor() {
    this.vehiculeService.getAllVehiculesPost().subscribe({
      next: (data: any) => {
        this.vehicles = data;

        console.log('Données reçues :', data);
      },
      error: (err) => {
        console.error('Erreur lors de l’appel API :', err);
      }
    });
  }
  /*
    ngOnInit() {
      this.vehicleService.vehicles$.subscribe(vehicles => {
        this.vehicles = vehicles;
      });
    }*/

  addVehicle() {
    if (this.newVehicle.name && this.newVehicle.modele && this.newVehicle.year && this.newVehicle.plateNumber) {
      // In a real app, you would call the service to add the vehicle
      console.log('Adding vehicle:', this.newVehicle);
      this.cancelAdd();
    }
  }

  cancelAdd() {
    this.showAddForm = false;
    this.newVehicle = {};
  }

  deleteVehicle(id: string) {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce véhicule ?')) {
      console.log('Deleting vehicle:', id);
    }
  }
}
