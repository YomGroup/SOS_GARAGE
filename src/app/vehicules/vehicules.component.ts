import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router'; // ✅ Ajouter ActivatedRoute
import { VehicleService, Vehicle } from '../../services/vehicle.service';
import { inject } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { AssureService } from '../../services/assure.service';
import { getDownloadURL, getStorage, ref, uploadBytes } from 'firebase/storage';
import { RouterLink } from '@angular/router';
import { parseBackendDate } from '../shared/utils/date.utils';

@Component({
  selector: 'app-vehicules',
  imports: [FormsModule, CommonModule, RouterLink],
  templateUrl: './vehicules.component.html',
  styleUrl: './vehicules.component.css'
})

export class VehiculesComponent implements OnInit {
  private vehiculeService = inject(VehicleService);
  private authService = inject(AuthService);
  private assureService = inject(AssureService);
  private route = inject(ActivatedRoute); // ✅ AJOUTER
  private router = inject(Router); // ✅ AJOUTER
  
  vehicles: Vehicle[] = [];
  vehiclesAll: Vehicle[] = []; // ✅ AJOUTER pour stocker tous les véhicules
  showAddForm = false;
  errorMessage = '';
  showErrorToast = false;
  showSuccessToast = false;

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
    imgUrl: '',
    assure: null,
    nomAssurence: '',
    typeAssurence: []
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
    { id: 2, name: 'Tous_risque', selected: false },
    { id: 3, name: 'Bris_de_glace', selected: false },
    { id: 4, name: 'vol', selected: false }
  ];
  isAssuranceDropdownOpen = false;
  assurances: any[] = [];
  selectedAssurance: any = null;
  currentStep: number = 1;
  hasAssurance: boolean = false;
  contratFile: File | null = null;
  loadingSubmit: boolean = false;
  nomAssurenceisempty: boolean = true;
  successMessage: string = '';
  lientAssurance: string = '';

  ngOnInit(): void {
    this.userid = this.authService.getToken()?.['sub'] ?? null;
    console.log('🚀 Initialisation du composant véhicules');
    
    if (this.userid) {
      this.assureService.getAssurerID(this.userid).subscribe({
        next: (data: any) => {
          this.assureId = data.id;
          console.log('✅ Assure ID récupéré:', this.assureId);
          
          // Charger les véhicules et les assurances
          this.loadVehicles(this.assureId);
          this.loadAssurances();

          // ✅ NOUVEAU : Gérer la redirection depuis sinistres
          this.route.queryParams.subscribe(params => {
            const editVehicleId = params['editVehicleId'];
            
            if (editVehicleId) {
              console.log('🔄 Redirection depuis sinistres pour éditer le véhicule:', editVehicleId);
              
              // Attendre que les véhicules soient chargés
              setTimeout(() => {
                const vehicleToEdit = this.vehiclesAll.find(v => v.id === editVehicleId.toString());
                
                if (vehicleToEdit) {
                  console.log('✅ Véhicule trouvé, ouverture du formulaire d\'édition');
                  this.updateVehicle(vehicleToEdit);
                  
                  // Scroller vers le haut
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                  
                  // ✅ Afficher un message d'information
                  this.successMessage = '⚠️ Veuillez ajouter le contrat d\'assurance pour ce véhicule';
                  this.showSuccessToast = true;
                  setTimeout(() => this.showSuccessToast = false, 7000);
                  
                  // ✅ Nettoyer le query param pour éviter de réouvrir au refresh
                  this.router.navigate([], {
                    relativeTo: this.route,
                    queryParams: {},
                    replaceUrl: true
                  });
                } else {
                  console.error('❌ Véhicule non trouvé avec ID:', editVehicleId);
                }
              }, 500); // Délai pour laisser le temps aux véhicules de se charger
            }
          });
        },
        error: (err) => {
          console.error('❌ Erreur lors de la récupération de l\'assure ID:', err);
        }
      });
    }
  }

  validateImmatriculation(immat: string): boolean {
    if (!immat) return false;
    
    // Supprime les espaces
    const cleaned = immat.trim().replace(/\s+/g, '');
    
    // Format moderne : AB-123-CD (2 lettres, 3 chiffres, 2 lettres)
    const modernFormat = /^[A-Z]{2}-\d{3}-[A-Z]{2}$/i;
    
    // Ancien format : 1234AB12 ou 1234 AB 12
    const oldFormat = /^\d{1,4}[A-Z]{2,3}\d{2}$/i;
    
    return modernFormat.test(cleaned) || oldFormat.test(cleaned);
  }
  
  onContratAssuranceSelected(event: any) {
    const file: File = event.target.files[0];

    if (file) {
      this.contratFile = file;

      this.vehiculeService.uploaddocument(this.assureId, file)
        .subscribe({
          next: (res) => {
            console.log("✅ Upload contrat réussi:", res);
            this.lientAssurance = res[0];
          },
          error: (err) => {
            console.error("❌ Erreur upload contrat:", err);
          }
        });
    }
  }

  async loadVehicles(assureId: number): Promise<void> {
    console.log('📋 Chargement des véhicules pour l\'assure ID:', assureId);
    
    (await this.vehiculeService.getVehiculesDataById(assureId)).subscribe({
      next: (data: any) => {
        this.vehicles = data.content;
        this.vehiclesAll = data.content; // ✅ AJOUTER pour la recherche
        console.log('✅ Véhicules chargés:', this.vehicles.length);
      },
      error: (err) => {
        console.error('❌ Erreur lors du chargement des véhicules:', err);
      }
    });
  }

  private loadAssurances(): void {
    this.vehiculeService.listAssuranceVehicules().subscribe({
      next: (data: any) => {
        this.assurances = data;
        console.log('✅ Assurances chargées:', this.assurances.length);
      },
      error: (err) => {
        console.error('❌ Erreur lors du chargement des assurances:', err);
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
    this.newVehicle.nomAssurence = assurance;
    this.isAssuranceDropdownOpen = false;
  }

  onToggleAssurance(id: number, event: Event) {
    const isChecked = (event.target as HTMLInputElement).checked;

    if (!Array.isArray(this.newVehicle.typeAssurence)) {
      this.newVehicle.typeAssurence = [];
    }
    
    if (isChecked) {
      if (!this.newVehicle.typeAssurence.includes(id)) {
        this.newVehicle.typeAssurence.push(id);
      }
    } else {
      this.newVehicle.typeAssurence = this.newVehicle.typeAssurence.filter((x: number) => x !== id);
    }
  }

  shouldDisplay(id: number): boolean {
    const selected = this.newVehicle.typeAssurence;

    const hasTiers = selected.includes(1);
    const hasTousRisques = selected.includes(2);
    const hasBrisDeGlace = selected.includes(3);
    const hasVol = selected.includes(4);

    // Si Tous risques est sélectionné → on affiche **seulement** Tous risques
    if (hasTousRisques) {
      return id === 2;
    }

    // Si Tiers est sélectionné → on affiche Tiers, Bris de glace, Vol (mais Bris de glace et Vol sont exclusifs)
    if (hasTiers) {
      if (hasBrisDeGlace && id === 4) return false;
      if (hasVol && id === 3) return false;
      return id === 1 || id === 3 || id === 4;
    }

    // Si rien n'est sélectionné → on affiche Tiers et Tous risques seulement
    return id === 1 || id === 2;
  }

  async scrapperVehicules() {
    const immat = this.newVehicle.immatriculation?.trim();
    if (!immat) return;

    // ✅ Validation avant l'appel API
    if (!this.validateImmatriculation(immat)) {
      this.scrapErrorMessage = 'Format d\'immatriculation invalide. Ex: AB-123-CD';
      return;
    }

    this.loadingScrap = true;
    this.scrapErrorMessage = '';
    this.scrappingReussi = false;

    const timeout = setTimeout(() => {
      if (this.loadingScrap) {
        this.loadingScrap = false;
        this.scrapErrorMessage = 'Les données sont introuvables.';
      }
    }, 5000);

    (await this.vehiculeService.getVehiculesData(immat)).subscribe({
      next: (data: any) => {
        this.newVehicle.modele = data.AWN_modele || '';
        this.newVehicle.marque = data.AWN_marque || '';
        this.newVehicle.cylindree = data.AWN_nbr_cylindre_energie || '';
        this.newVehicle.carteGrise = data.AWN_date_cg || '';
        this.newVehicle.contratAssurance = '';
        this.newVehicle.dateMiseEnCirculation = data.AWN_date_mise_en_circulation_us || '';
        this.newVehicle.imgUrl = data.AWN_model_image || '';
        this.newVehicle.dateDerniereCg = data.AWN_date_derniere_cg || '';
        this.newVehicle.energie = data.AWN_energie || '';
        this.newVehicle.nomCommerciale = data.AWN_nom_commercial || '';
        this.newVehicle.puissanceChevaux = data.AWN_puissance_chevaux || '';
        this.newVehicle.puissanceFiscale = data.AWN_puissance_fiscale || '';
        this.newVehicle.boiteVitesse = data.AWN_type_boite_vites || '';
        this.newVehicle.typeMine = data.AWN_type_mine || '';
        this.newVehicle.version = data.AWN_version || '';
        
        clearTimeout(timeout);
        this.loadingScrap = false;
        this.scrappingReussi = true;
      },
      error: (err) => {
        console.error('❌ Erreur lors du scrapping:', err);
        clearTimeout(timeout);
        this.loadingScrap = false;
        this.scrapErrorMessage = 'Les données sont introuvables.';
      }
    });
  }

  async submitVehicle() {
    this.loadingSubmit = true;
    
    if (this.contratFile) {
      this.newVehicle.contratAssurance = this.lientAssurance;
    }

    const payload = {
      immatriculation: this.newVehicle.immatriculation,
      marque: this.newVehicle.marque,
      modele: this.newVehicle.modele,
      cylindree: this.newVehicle.cylindree,
      dateMiseEnCirculation: new Date(this.newVehicle.dateMiseEnCirculation).toISOString(),
      nomAssurence: this.newVehicle.nomAssurence,
      carteGrise: this.newVehicle.carteGrise,
      contratAssurance: this.newVehicle.contratAssurance,
      assure: this.assureId,
      dateDerniereCg: this.newVehicle.dateDerniereCg,
      energie: this.newVehicle.energie,
      nomCommerciale: this.newVehicle.nomCommerciale,
      puissanceChevaux: this.newVehicle.puissanceChevaux,
      puissanceFiscale: this.newVehicle.puissanceFiscale,
      boiteVitesse: this.newVehicle.boiteVitesse,
      typeMine: this.newVehicle.typeMine,
      version: this.newVehicle.version,
      imgUrl: Array.isArray(this.newVehicle.imgUrl) && this.newVehicle.imgUrl.length > 0
        ? this.newVehicle.imgUrl
        : (this.newVehicle.imgUrl && this.newVehicle.imgUrl.trim() ? [this.newVehicle.imgUrl] : [])
    };

    const finalCallback = () => {
      this.loadingSubmit = false;
    };

    const showError = (rawError: any) => {
      let userMessage = 'Une erreur s\'est produite. Veuillez réessayer.';

      if (rawError?.error) {
        const errText = rawError.error;

        if (typeof errText === 'string' && errText.includes('duplicate key value') && errText.includes('(immatriculation)')) {
          userMessage = "Ce véhicule avec cette immatriculation existe déjà.";
        } else if (typeof errText === 'object' && errText.message) {
          userMessage = errText.message;
        } else if (typeof errText === 'string') {
          userMessage = errText.split('\n')[0];
        }
      }

      this.errorMessage = userMessage;
      this.showErrorToast = true;
      setTimeout(() => this.showErrorToast = false, 5000);
    };

    const showSuccess = (message: string) => {
      this.successMessage = message;
      this.showSuccessToast = true;
      setTimeout(() => this.showSuccessToast = false, 5000);
    };

    if (this.isEditMode && this.newVehicle.id) {
      (await this.vehiculeService.updateVehiculesPost(parseInt(this.newVehicle.id), payload)).subscribe({
        next: (data) => {
          showSuccess('✅ Véhicule mis à jour avec succès !');
          this.loadVehicles(this.assureId);
          this.vehiculeService.refreshVehicules(this.assureId);
          this.cancelAdd();
          finalCallback();
        },
        error: (err) => {
          console.error('❌ Erreur lors de la mise à jour du véhicule:', err);
          showError(err);
          finalCallback();
        }
      });
    } else {
      (await this.vehiculeService.addVehiculesPost(payload)).subscribe({
        next: (data) => {
          showSuccess('✅ Véhicule ajouté avec succès !');
          this.vehicles = [...this.vehicles, data as Vehicle];
          this.vehiclesAll = [...this.vehiclesAll, data as Vehicle]; // ✅ AJOUTER
          this.cancelAdd();
          finalCallback();
        },
        error: (err) => {
          console.error('❌ Erreur lors de l\'ajout du véhicule:', err);
          showError(err);
          finalCallback();
        }
      });
    }
  }

  updateVehicle(vehicle: Vehicle) {
    this.isEditMode = true;
    this.showAddForm = true;
    this.selectedAssurance = vehicle.nomAssurence;

    this.newVehicle = {
      ...vehicle,
      typeAssurence: this.extractTypeAssurenceIds(vehicle.typeAssurence || ''),
      dateMiseEnCirculation: this.safeDate(vehicle.dateMiseEnCirculation),
    };

    console.log('📝 Mode édition activé pour le véhicule:', vehicle.id);
  }

  private safeDate(value: any): string {
    if (!value) return '';
    const d = new Date(value);
    return isNaN(d.getTime()) ? '' : d.toISOString().split('T')[0];
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
      assure: null,
      typeAssurence: [],
      nomAssurence: '',
      dateDerniereCg: '',
      energie: '',
      nomCommerciale: '',
      puissanceChevaux: '',
      puissanceFiscale: '',
      boiteVitesse: '',
      typeMine: '',
      version: '',
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
      this.showAssuranceSelection = false;
    }
  }

  private extractTypeAssurenceIds(typeStr: string): number[] {
    if (!typeStr) return [];

    const result: number[] = [];

    if (typeStr.startsWith("Tiers")) {
      result.push(
        ...this.assuranceOptions
          .filter(opt => opt.name === "Tiers")
          .map(opt => opt.id)
      );

      const rest = typeStr.replace("Tiers_", "");

      this.assuranceOptions.forEach(opt => {
        if (opt.name !== "Tiers" && rest.includes(opt.name)) {
          result.push(opt.id);
        }
      });
    } else {
      const match = this.assuranceOptions.find(opt => opt.name === typeStr);
      if (match) result.push(match.id);
    }

    return result;
  }

  openAssuranceSelection(vehicle: Vehicle): void {
    this.selectedVehicle = vehicle;
    this.showAssuranceSelection = true;
  }

  formatYear(date: any): string {
    const parsed = parseBackendDate(date);
    if (!parsed) return 'N/A';
    return parsed.getFullYear().toString();
  }

  async deleteVehicle(id: string) {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce véhicule ?')) {
      const index = this.vehicles.findIndex(v => v.id === id);
      if (index !== -1) {
        this.vehicles.splice(index, 1);
        this.vehiclesAll = this.vehiclesAll.filter(v => v.id !== id); // ✅ AJOUTER
      }
      
      (await this.vehiculeService.deleteVehiculesPost(parseInt(id))).subscribe({
        next: (data) => {
          console.log('✅ Véhicule supprimé avec succès');
          this.loadVehicles(this.assureId);
          this.cancelAdd();
        },
        error: (err) => {
          console.error('❌ Erreur lors de la suppression du véhicule:', err);
        }
      });
    }
  }
}