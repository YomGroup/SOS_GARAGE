import { Component, Inject, inject, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { VehicleService } from '../../services/vehicle.service';
import { AuthService } from '../../services/auth.service';
import { PdfViewerModule } from 'ng2-pdf-viewer';
import { RouterModule } from '@angular/router';
import { DOCUMENT } from '@angular/common';
import { AssureService } from '../../services/assure.service';
import { DocumentService } from '../../services/document.service';
import { SinistreService } from '../../services/sinistre.service';
import { PDFDocument, rgb } from 'pdf-lib';
import { firstValueFrom, switchMap } from 'rxjs';
import { Router } from '@angular/router';
import { Vehicule } from '../../services/models-api.interface';

@Component({
  standalone: true,
  selector: 'app-declarations',
  imports: [
    FormsModule,
    CommonModule,
    PdfViewerModule,
    RouterModule
  ],
  templateUrl: './declarations.component.html',
  styleUrls: ['./declarations.component.css']
})
export class DeclarationsComponent implements OnDestroy, OnInit {
  // Variables d'état
  incidentDescription: string = '';
  hasChosenDeclarationMethod: boolean = false;
  declarationMethod: 'describe' | 'upload' | null = null;
  currentStep = 1;
  vehicleStatus = '';
  hasAcceptedGarageWarning: boolean = false;
  showGarageWarningStep: boolean = false;
  photosCompleted: boolean = false;

  selectedVehicle = '';
  isDropdownOpen = false;
  email = '';
  constatFile?: File;
  photosFiles: File[] = [];
  vehicles: string[] = [];
  vehiclesAll: any[] = [];
  userData: any = null;
  previewPhotos: { url: string, file: File }[] = [];
  constatPreviewUrl: string | null = null;
  showPdfViewer = false;
  userid: string | null = null;
  assureId: number = 0;
  assurances: any[] = [];
  selectedAssurance: any = null;
  showAssuranceStep = false;
  lieuSinistre: string = '';
  nomAssure: string = '';
  adresseAssure: string = '';
  telephoneAssure: string = '';
  prenomAssure: string = '';
  token = '';
  numeroAssurance = '';

  // ✅ NOUVEAUX : Gestion des sections optionnelles
  showOptionalPhotos: boolean = false;
  showConstatSection: boolean = false;

  // ✅ MODIFIÉ : Seulement 2 photos obligatoires + 2 optionnelles
  photoSteps: { [key: string]: { url: string; file: File }[] } = {
    plaque: [],      // Obligatoire
    degats: [],      // Obligatoire
    avant: [],       // Optionnel
    cote: []         // Optionnel
  };

  typeassurance: string[] = [
    "STATIONNEMENT_IMPACT",
    "VANDALISME",
    "BRIS_DE_GLACE",
    "INCENDIE",
    "VOL_OU_TENTATIVE",
    "EVENEMENT_CLIMATIQUE",
    "DOMMAGE_INCONNU",
    "COLLISION_VEHICULE"
  ];
  selectedTypeAssurance: string = '';

  // Services
  private vehiculeService = inject(VehicleService);
  private authService = inject(AuthService);
  private assureService = inject(AssureService);
  private sinistreService = inject(SinistreService);
  private documentService = inject(DocumentService);
  showProfileAlert = false;
  showvehicleAlert = false;
  currentCity: string = 'Casablanca';
  isAssuranceDropdownOpen = false;
  isSubmitting: boolean = false;

  constructor(@Inject(DOCUMENT) private document: Document, private router: Router) { }

  ngOnInit(): void {
    this.userid = this.authService.getToken()?.['sub'] ?? null;
    this.authService.getKeycloakInstance().then(token => {
      this.token = token;
    });

    this.getCurrentCity();
    if (this.userid) {
      this.assureService.getAssurerID(this.userid).subscribe({
        next: (data: any) => {
          this.assureId = data.id;
          this.loadVehicles(this.assureId);
          this.loadUserData();
          this.email = this.authService.getToken()?.name || '';
        },
        error: (err) => {
          console.error('Erreur lors de la récupération de l\'assure  ID :', err);
        }
      });
      
      this.checkVehiculeCompleteness();
    }
  }

  checkProfileCompleteness(): boolean {
    const isProfileComplete = this.nomAssure !== '' &&
      this.adresseAssure !== '' &&
      this.telephoneAssure !== '' &&
      this.prenomAssure !== '';

    this.showProfileAlert = !isProfileComplete;
    return isProfileComplete;
  }

  checkVehiculeCompleteness(): boolean {
    if (this.vehiclesAll.length === 0) {
      this.showvehicleAlert = true;
    }
    return this.vehiclesAll.length > 0;
  }

  ngOnDestroy() {
    Object.values(this.photoSteps).forEach(photos => {
      photos.forEach(photo => URL.revokeObjectURL(photo.url));
    });
    if (this.constatPreviewUrl) {
      URL.revokeObjectURL(this.constatPreviewUrl);
    }
  }

  goToProfile() {
    this.router.navigate(['clientDashboard/profiles']);
  }

  goToVehicle() {
    this.router.navigate(['clientDashboard/vehicules']);
  }

  closeAlert() {
    this.showProfileAlert = false;
  }

  closeAlertvehicule() {
    this.showvehicleAlert = false;
  }

  private loadUserData(): void {
    this.assureService.addAssurerGet(this.assureId).subscribe({
      next: (data: any) => {
        this.userData = data;
        this.nomAssure = data.nom || '';
        this.adresseAssure = data.adresse || '';
        this.telephoneAssure = data.telephone || '';
        this.prenomAssure = data.prenom || '';

        this.checkProfileCompleteness();
      },
      error: (err) => {
        console.error('Erreur lors du chargement des données utilisateur', err);
      }
    });
  }

  private getCurrentCity(): void {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const latitude = position.coords.latitude;
          const longitude = position.coords.longitude;
          this.getCityFromCoordinates(latitude, longitude);
        },
        (error) => {
          console.warn('Géolocalisation non disponible:', error);
        },
        { timeout: 10000, enableHighAccuracy: false }
      );
    }
  }

  private async getCityFromCoordinates(latitude: number, longitude: number): Promise<void> {
    try {
      const response = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=fr`
      );
      const data = await response.json();

      if (data.city) {
        this.currentCity = data.city;
      } else if (data.locality) {
        this.currentCity = data.locality;
      }
    } catch (error) {
      console.warn('Erreur lors de la récupération de la ville:', error);
    }
  }

  private async loadVehicles(assureId: number): Promise<void> {
    (await this.vehiculeService.getVehiculesDataById(assureId)).subscribe({
      next: (data: any) => {
        this.vehiclesAll = data.content;
        this.vehicles = data.content.map((vehicule: any) => vehicule.marque + '(' + vehicule.immatriculation + ')');
      },
      error: (err) => {
        console.error('Erreur lors de l\'appel API :', err);
      }
    });
  }

  selectDeclarationMethod(method: 'describe' | 'upload'): void {
    this.declarationMethod = method;
    this.hasChosenDeclarationMethod = true;
  }

  validateDescription(): void {
    if (this.incidentDescription.trim().length > 10) {
      this.nextStep();
    } else {
      alert('Veuillez fournir une description plus détaillée');
    }
  }

  resetDeclarationMethod(): void {
    this.hasChosenDeclarationMethod = false;
    this.declarationMethod = null;
  }

  // Navigation entre étapes
  async nextStep(): Promise<void> {
    let vehiculematricule = '';
    let assurance: any;

    if (this.selectedVehicle) {
      const vehicule = this.vehiclesAll.find(v => v.marque + '(' + v.immatriculation + ')' === this.selectedVehicle);
      vehiculematricule = vehicule ? vehicule.immatriculation : '';
    }

    if (this.canProceed()) {
      this.currentStep++;

      if (this.vehicleStatus === 'not-rolling') {
        this.showAssuranceStep = true;

        (await this.vehiculeService.getVehiculesMatricule(vehiculematricule)).pipe(
          switchMap((vehicle: any) => {
            assurance = vehicle?.nomAssurence || '';
            this.numeroAssurance = vehicle?.telephoneAssistance || '';
            return this.vehiculeService.listAssuranceVehiculesNumero(this.token);
          })
        ).subscribe({
          next: (data: any) => {
            this.assurances = data;
          },
          error: (err) => {
            console.error('Erreur lors du chargement des assurances', err);
          }
        });
      }
    }
  }

  acceptGarageWarning(): void {
    this.hasAcceptedGarageWarning = true;
    this.showGarageWarningStep = false;
    this.submitSinistre();
  }

  declineGarageWarning(): void {
    this.showGarageWarningStep = false;
  }

  previousStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  // ✅ MODIFIÉ : Validation des 2 photos obligatoires uniquement
  private hasRequiredPhotos(): boolean {
    return this.photoSteps['plaque'].length > 0 && this.photoSteps['degats'].length > 0;
  }

  toggleAssuranceDropdown(): void {
    this.isAssuranceDropdownOpen = !this.isAssuranceDropdownOpen;
  }

  selectAssurance(assurance: any): void {
    this.selectedAssurance = assurance;
    this.isAssuranceDropdownOpen = false;
  }

  // ✅ MODIFIÉ : Validation simplifiée (description + 2 photos)
  canProceed(): boolean {
    switch (this.currentStep) {
      case 1:
        return !!this.selectedVehicle && !!this.vehicleStatus;
      case 2:
        return !!this.selectedTypeAssurance && !!this.lieuSinistre &&
          !!this.incidentDescription && this.hasRequiredPhotos();
      case 3:
        return this.hasAcceptedGarageWarning &&
          this.nomAssure !== '' &&
          this.adresseAssure !== '' &&
          this.telephoneAssure !== '' &&
          this.prenomAssure !== '';
      default:
        return false;
    }
  }

  selectVehicle(vehicle: string): void {
    this.selectedVehicle = vehicle;
    this.isDropdownOpen = false;

    if (this.vehicleStatus === 'not-rolling') {
      this.showAssuranceStep = true;
    } else {
      this.showAssuranceStep = false;
    }
    this.nextStep();
  }

  onStatusChange() {
    if (this.canProceed()) {
      this.nextStep();
    }
  }

  toggleDropdown(): void {
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  onFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      this.constatFile = input.files[0];
      this.showPdfViewer = false;

      if (this.constatPreviewUrl) {
        URL.revokeObjectURL(this.constatPreviewUrl);
      }

      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.constatPreviewUrl = e.target.result;
        if (this.constatFile?.type === 'application/pdf') {
          this.showPdfViewer = true;
        }
      };
      reader.readAsDataURL(this.constatFile);
    }
  }

  // ✅ MODIFIÉ : Upload photo pour une catégorie spécifique
  onPhotoSelect(event: Event, category: string): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      const file = input.files[0];

      if (!file.type.match('image.*')) {
        alert('Seules les images sont acceptées');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e: any) => {
        // Limiter à 1 photo par catégorie
        this.photoSteps[category] = [{
          url: e.target.result,
          file: file
        }];
      };
      reader.readAsDataURL(file);

      input.value = '';
    }
  }

  // ✅ NOUVEAU : Supprimer photo d'une catégorie
  removePhoto(category: string): void {
    if (this.photoSteps[category].length > 0) {
      URL.revokeObjectURL(this.photoSteps[category][0].url);
      this.photoSteps[category] = [];
    }
  }

  removeConstat(): void {
    if (this.constatPreviewUrl) {
      URL.revokeObjectURL(this.constatPreviewUrl);
    }
    this.constatPreviewUrl = null;
    this.constatFile = undefined;
    this.showPdfViewer = false;
  }

  getSelectedVehicleAssurance(): string {
    if (this.selectedAssurance) {
      return this.selectedAssurance;
    }
    const vehicule = this.vehiclesAll.find(v => v.marque + '(' + v.immatriculation + ')' === this.selectedVehicle);
    return vehicule?.nomAssurence || 'Non spécifiée';
  }

  // Soumission du sinistre
  async submitSinistre(): Promise<void> {
    this.isSubmitting = true;

    try {
      const vehiculeid = parseInt(this.vehiclesAll.find(v => v.marque + '(' + v.immatriculation + ')' === this.selectedVehicle)?.id || 0);

      // ✅ Upload toutes les photos (obligatoires + optionnelles)
      const allFiles: File[] = Object.values(this.photoSteps).flat().map(item => item.file);
      let images2: string[] = [];

      try {
        const images = await this.sinistreService.uploadImages(vehiculeid + '', allFiles);
        console.log('✅ Upload photos réussi', images);
        images2 = images;
      } catch (err) {
        console.error('❌ Erreur upload images', err);
      }

      // Upload du constat si présent
      let constatUrl = '';
      if (this.constatFile) {
        try {
          constatUrl = await this.sinistreService.uploadConstat(vehiculeid + '', this.constatFile);
          console.log('✅ Upload constat réussi:', constatUrl);
        } catch (err) {
          console.error('❌ Erreur upload constat', err);
        }
      }

      const imageObjects = (images2 || []).map((url: string, index: number) => ({
        imageName: url.split('/').pop() || `image_${index}.jpg`,
        imageType: 'AVANT',
        objectStorageUrl: url,
      }));

      const sinistrePayload = {
        type: this.selectedTypeAssurance,
        contactAssistance: this.email,
        lienConstat: constatUrl || '',
        conditionsAcceptees: true,
        lieu: this.lieuSinistre,
        vehiculeId: vehiculeid,
        assuranceName: this.vehiclesAll.find(v => v.marque + '(' + v.immatriculation + ')' === this.selectedVehicle)?.nomAssurence || '',
        description: this.incidentDescription || '',
        etatVehicule: this.vehicleStatus === 'rolling' ? 'ROULANT' : 'NON_ROULANT',
        images: imageObjects,
      };

      console.log('🚀 Soumission du sinistre:', sinistrePayload);

      (await this.sinistreService.addSinistrePost(sinistrePayload)).subscribe({
        next: (sinistreResponse: any) => {
          console.log("✅ Sinistre créé :", sinistreResponse);
          this.isSubmitting = false;
          this.currentStep = 4;
        },
        error: (error) => {
          console.error("❌ Erreur création sinistre:", error);
          this.isSubmitting = false;
          let msg = error.error?.message || error.error || "Erreur lors de la création du sinistre.";
          alert(msg);
        }
      });

    } catch (error) {
      console.error('❌ Erreur générale:', error);
      this.isSubmitting = false;
      alert('Une erreur est survenue lors de l\'enregistrement des fichiers.');
    }
  }
}