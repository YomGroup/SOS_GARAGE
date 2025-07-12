import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { VehicleService, Vehicle } from '../../services/vehicle.service';
import { inject } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { AssureService } from '../../services/assure.service';

@Component({
  selector: 'app-vehicules',
  imports: [FormsModule, CommonModule],
  templateUrl: './vehicules.component.html',
  styleUrl: './vehicules.component.css'
})
export class VehiculesComponent implements OnInit {
  private vehiculeService = inject(VehicleService);
  private authService = inject(AuthService);
  private assureService = inject(AssureService);
  vehicles: Vehicle[] = [];
  showAddForm = false;
  loadingScrap = false;
  isEditMode = false;
  newVehicle: any = {
    immatriculation: '',
    marque: '',
    modele: '',
    cylindree: '',
    carteGrise: '',
    contratAssurance: '',
    dateMiseEnCirculation: '',
    imgUrl: '', // ou new Date().toISOString()
    assure: null
  };
  cpt: number = 5;
  scrapErrorMessage: string = '';
  userid: string | null = null;
  assureId: number = 0;
  scrappingReussi: boolean = false;
  // Assurance selection
  showAssuranceSelection = false;
  selectedVehicle: Vehicle | null = null;
  assuranceOptions = [
    { id: 1, name: 'Tiers', selected: false },
    { id: 2, name: 'Tous risques', selected: false },
    { id: 3, name: 'Bris de glace', selected: false },
    { id: 4, name: 'Vol', selected: false }
  ];
  isAssuranceDropdownOpen = false;
  assurances: any[] = [];
  selectedAssurance: any = null;
  currentStep: number = 1;
  hasAssurance: boolean = false;

  ngOnInit(): void {
    this.userid = this.authService.getToken()?.['sub'] ?? null;

    if (this.userid) {
      this.assureService.getAssurerID(this.userid).subscribe({
        next: (data: any) => {
          this.assureId = data.id; // adapte selon ta réponse
          this.loadVehicles(this.assureId);
          this.loadAssurances();

        },
        error: (err) => {
          console.error('Erreur lors de la récupération de l’assure  ID :', err);
        }
      });
    }
  }
  // Dans ta classe
  loadVehicles(assureId: number): void {
    this.vehiculeService.getVehiculesDataById(assureId).subscribe({
      next: (data: any) => {
        this.vehicles = data;
        console.log('Véhicules reçus :', this.vehicles);
      },
      error: (err) => {
        console.error('Erreur lors de l’appel API :', err);
      }
    });
  }
  private loadAssurances(): void {
    this.vehiculeService.listAssuranceVehicules().subscribe({
      next: (data: any) => {
        this.assurances = data;
        console.log('Assurances chargées:', this.assurances);
      },
      error: (err) => {
        console.error('Erreur lors du chargement des assurances', err);
      }
    });
  }
  nextStep(): void {
    if (this.currentStep < 2) {
      this.currentStep++;
    }
  }

  prevStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  toggleAssuranceDropdown(): void {
    this.isAssuranceDropdownOpen = !this.isAssuranceDropdownOpen;
  }

  selectAssurance(assurance: any): void {
    this.selectedAssurance = assurance;
    this.isAssuranceDropdownOpen = false;
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

    this.loadingScrap = true;
    this.scrapErrorMessage = '';
    this.scrappingReussi = false;

    // Déclenche le timeout de 5s
    const timeout = setTimeout(() => {
      if (this.loadingScrap) {
        this.loadingScrap = false;
        this.scrapErrorMessage = 'Les données sont introuvables.';
      }
    }, 5000);

    this.vehiculeService.getVehiculesData(immat).subscribe({
      next: (data: any) => {
        console.log('Scrapping terminé avec succès :', data);

        this.newVehicle.modele = data.AWN_modele || '';
        this.newVehicle.marque = data.AWN_marque || '';
        this.newVehicle.cylindree = data.AWN_nbr_cylindre_energie || '';
        this.newVehicle.carteGrise = data.AWN_date_cg || '';
        this.newVehicle.contratAssurance = '';
        this.newVehicle.dateMiseEnCirculation = data.AWN_date_mise_en_circulation_us || '';
        this.newVehicle.imgUrl = data.AWN_model_image || '';
        clearTimeout(timeout); // Annule le timeout si ça répond à temps
        this.loadingScrap = false;
        this.scrappingReussi = true;
      },
      error: (err) => {
        console.error('Erreur lors du scrapping :', err);
        clearTimeout(timeout);
        this.loadingScrap = false;
        this.scrapErrorMessage = 'Les données sont introuvables.';
      }
    });
  }


  submitVehicle() {
    const payload = {
      immatriculation: this.newVehicle.immatriculation,
      marque: this.newVehicle.marque,
      modele: this.newVehicle.modele,
      cylindree: this.newVehicle.cylindree,
      dateMiseEnCirculation: new Date(this.newVehicle.dateMiseEnCirculation).toISOString(),

      carteGrise: this.newVehicle.carteGrise,
      contratAssurance: this.newVehicle.contratAssurance,
      assure: this.assureId,

      imgUrl: Array.isArray(this.newVehicle.imgUrl) && this.newVehicle.imgUrl.length > 0
        ? this.newVehicle.imgUrl
        : (this.newVehicle.imgUrl && this.newVehicle.imgUrl.trim() ? [this.newVehicle.imgUrl] : [])

    };

    if (this.isEditMode && this.newVehicle.id) {
      console.log(this.newVehicle.imgUrl);      // Mode édition
      this.vehiculeService.updateVehiculesPost(parseInt(this.newVehicle.id), payload).subscribe({
        next: (data) => {
          console.log('Véhicule mis à jour avec succès :', data);
          this.loadVehicles(this.assureId);
          this.cancelAdd();
        },
        error: (err) => {
          console.error('Erreur lors de la mise à jour du véhicule :', err.error.message);
          if (err.error && err.error.message) {
            console.error('Message d\'erreur détaillé :', err.error.message);
          }
          this.scrapErrorMessage = 'Une erreur s\'est produite. Veuillez réessayer.';
        }

      });
    } else {
      // Mode ajout
      this.vehiculeService.addVehiculesPost(payload).subscribe({
        next: (data) => {
          this.loadVehicles(this.assureId);
          this.cancelAdd();
        },
        error: (err) => {
          console.error('Erreur lors de l’ajout du véhicule :', err);
        }
      });
    }
  }

  updateVehicle(vehicle: Vehicle) {
    this.isEditMode = true;
    this.showAddForm = true;

    // Clone l'objet pour ne pas lier directement au tableau principal
    this.newVehicle = {
      ...vehicle,
      dateMiseEnCirculation: vehicle.dateMiseEnCirculation
        ? new Date(vehicle.dateMiseEnCirculation).toISOString().split('T')[0]
        : '',
    };
  }


  cancelAdd() {
    this.currentStep = 1;
    this.showAddForm = false;
    this.scrappingReussi = false;
    this.newVehicle = {
      immatriculation: '',
      marque: '',
      modele: '',
      cylindree: '',
      carteGrise: '',
      contratAssurance: '',
      dateMiseEnCirculation: '',
      imgUrl: '',
      assure: null
    };
    this.isEditMode = false;
    this.scrapErrorMessage = '';
  }
  cancelAssuranceSelection(): void {
    this.showAssuranceSelection = false;
    this.selectedVehicle = null;
    this.resetAssuranceOptions();
  }

  private resetAssuranceOptions(): void {
    this.assuranceOptions.forEach(opt => opt.selected = false);
  }
  validateAssuranceSelection(): void {
    if (this.selectedVehicle) {
      const selectedAssurances = this.assuranceOptions
        .filter(opt => opt.selected)
        .map(opt => opt.name);

      console.log('Assurances sélectionnées:', selectedAssurances);
      // Traitez ici les assurances sélectionnées
      this.showAssuranceSelection = false;
    }
  }
  openAssuranceSelection(vehicle: Vehicle): void {
    this.selectedVehicle = vehicle;
    this.showAssuranceSelection = true;
  }
  deleteVehicle(id: string) {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce véhicule ?')) {
      // Suppression optimiste - on retire immédiatement le véhicule de la liste
      const index = this.vehicles.findIndex(v => v.id === id);
      if (index !== -1) {
        this.vehicles.splice(index, 1);
      } this.vehiculeService.deleteVehiculesPost(parseInt(id)).subscribe({
        next: (data) => {
          console.log('Véhicule supprimé avec succès :', data);
          this.loadVehicles(this.assureId);
          this.cancelAdd();
        },
        error: (err) => {
          console.error('Erreur lors de la suppression du véhicule :', err);
        }
      });
    }
  }
}
