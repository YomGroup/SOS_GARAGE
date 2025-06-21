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
  newVehicle: any = {
    immatriculation: '',
    marque: '',
    modele: '',
    cylindree: '',
    carteGrise: '',
    contratAssurance: '',
    dateMiseEnCirculation: '', // ou new Date().toISOString()
    assure: null
  };
  cpt: number = 5;

  constructor() {
    this.vehiculeService.getAllVehiculesPost().subscribe({
      next: (data: any) => {
        this.vehicles = data;
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
  scrapperVehicules() {
    const immat = this.newVehicle.immatriculation?.trim();
    if (!immat) return;

    this.vehiculeService.getVehiculesData(immat).subscribe({
      next: (data: any) => {
        console.log('Scrapping terminé avec succès :', data);

        // Remplir les champs du formulaire automatiquement
        this.newVehicle.modele = data.AWN_modele || '';
        this.newVehicle.marque = data.AWN_marque || '';
        this.newVehicle.cylindree = data.AWN_nbr_cylindre_energie || '';
        this.newVehicle.carteGrise = data.AWN_date_cg || '';
        this.newVehicle.contratAssurance = data.AWN_version || '';
      },
      error: (err) => {
        console.error('Erreur lors du scrapping :', err);
      }
    });
  }
  addVehicle() {
    const payload = {
      immatriculation: this.newVehicle.immatriculation,
      marque: this.newVehicle.marque,
      modele: this.newVehicle.modele,
      cylindree: this.newVehicle.cylindree,
      carteGrise: this.newVehicle.carteGrise,
      contratAssurance: this.newVehicle.contratAssurance,
      dateMiseEnCirculation: new Date(this.newVehicle.dateMiseEnCirculation).toISOString(),
      assure: (this.cpt)++,
    };
    console.log('Payload envoyé :', payload); // 👈 pour debug
    this.vehiculeService.addVehiculesPost(payload).subscribe({
      next: (data) => {
        console.log('Véhicule ajouté avec succès :', data);
        this.cancelAdd();
      },
      error: (err) => {
        console.error('Erreur lors de l’ajout du véhicule :', err);
      }
    });
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
