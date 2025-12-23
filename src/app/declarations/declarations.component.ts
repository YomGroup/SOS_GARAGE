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
  currentPhotoStep: number = 1;
  lieuSinistre: string = '';
  nomAssure: string = '';
  adresseAssure: string = '';
  telephoneAssure: string = '';
  prenomAssure: string = '';
  token = '';
  numeroAssurance = '';

  photoSteps: { [key: string]: { url: string; file: File }[] } = {
    plaque: [],
    degats: [],
    avant: [],
    cote: []
  };

  showConstatSection = false;
  showOptionalPhotos = false;

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

    console.log('-------------------------------------');

    console.log(this.nomAssure,this.adresseAssure,this.telephoneAssure,this.prenomAssure);

    console.log('-------------------------------------');
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
    this.previewPhotos.forEach(photo => {
      URL.revokeObjectURL(photo.url);
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
        console.log('Données utilisateur chargées :', this.userData);
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
    console.log('test api vehicule kkkkkkkkkkkkk');
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
            console.log('Données du véhicule récupérées :', vehicle);
            assurance = vehicle?.nomAssurence || '';
            // Récupérer le numéro d'assistance directement depuis le véhicule
            this.numeroAssurance = vehicle?.telephoneAssistance || '';
            console.log('Numéro d\'assurance récupéré:', this.numeroAssurance);
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
    // Soumettre directement le sinistre
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

  private hasRequiredPhotos(): boolean {
    return this.photoSteps['plaque'].length > 0 && 
           this.photoSteps['degats'].length > 0;
  }

  toggleAssuranceDropdown(): void {
    this.isAssuranceDropdownOpen = !this.isAssuranceDropdownOpen;
  }

  selectAssurance(assurance: any): void {
    this.selectedAssurance = assurance;
    this.isAssuranceDropdownOpen = false;
  }



  selectVehicle(vehicle: string): void {
    this.selectedVehicle = vehicle;
    this.isDropdownOpen = false;

    if (this.vehicleStatus === 'not-rolling') {
      this.showAssuranceStep = true;
      console.log('Véhicule sélectionné :', this.selectedVehicle);
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

  onPhotoSelect(event: Event, photoType: string): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      const file = input.files[0];

      if (!file.type.match('image.*')) {
        alert('Seules les images sont acceptées');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e: any) => {
        // Remplacer l'ancienne photo s'il y en a une
        if (this.photoSteps[photoType].length > 0) {
          URL.revokeObjectURL(this.photoSteps[photoType][0].url);
          this.photoSteps[photoType] = [];
        }

        this.photoSteps[photoType].push({
          url: e.target.result,
          file: file
        });
      };
      reader.readAsDataURL(file);

      input.value = '';
    }
  }

  getCurrentStepPhotos() {
    return this.photoSteps[this.currentPhotoStep];
  }

  setPhotoStep(step: number): void {
    if (this.currentPhotoStep !== step) {
      this.currentPhotoStep = step;
    }
  }

  nextPhotoStep(): void {
    if (this.currentPhotoStep < 4) {
      this.currentPhotoStep++;
    } else {
      // Marquer que les photos sont complètes et afficher un toast
      this.photosCompleted = true;
      // Auto-cacher le toast après 3 secondes
      setTimeout(() => {
        this.photosCompleted = false;
      }, 3000);
    }
  }

  prevPhotoStep(): void {
    if (this.currentPhotoStep > 1) {
      this.currentPhotoStep--;
    }
  }

  canProceedPhotoStep(): boolean {
    return this.photoSteps[this.currentPhotoStep].length > 0;
  }

  removePhoto(photoType: string): void {
    if (this.photoSteps[photoType].length > 0) {
      URL.revokeObjectURL(this.photoSteps[photoType][0].url);
      this.photoSteps[photoType] = [];
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

  scrollToConstat(): void {
    // Scroll vers la section constat
    setTimeout(() => {
      const constatSection = document.querySelector('.upload-section');
      if (constatSection) {
        constatSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  }

  /**
   * Récupère le nom de l'assurance du véhicule sélectionné
   */
  getSelectedVehicleAssurance(): string {
    if (this.selectedAssurance) {
      return this.selectedAssurance;
    }
    const vehicule = this.vehiclesAll.find(v => v.marque + '(' + v.immatriculation + ')' === this.selectedVehicle);
    return vehicule?.nomAssurence || 'Non spécifiée';
  }

  // Soumission du sinistre (simplifiée, sans signature)
  async submitSinistre(): Promise<void> {
    this.isSubmitting = true;

    try {
      // 1. Trouver le véhicule sélectionné
      const selectedVehiculeData = this.vehiclesAll.find(
        v => v.marque + '(' + v.immatriculation + ')' === this.selectedVehicle
      );

      if (!selectedVehiculeData) {
        throw new Error('Véhicule non trouvé');
      }

      const vehiculeid = parseInt(selectedVehiculeData.id);

      // 2. Vérifier les photos obligatoires
      if (!this.hasRequiredPhotos()) {
        alert('⚠️ Veuillez ajouter au moins les 2 photos obligatoires (plaque d\'immatriculation et dégâts)');
        this.isSubmitting = false;
        return;
      }

      // 3. Préparer les données du sinistre (SANS constat et SANS photos)
      const sinistrePayload = {
        type: this.selectedTypeAssurance,
        contactAssistance: this.email,
        
        conditionsAcceptees: true,
        lieu: this.lieuSinistre,
        vehiculeId: vehiculeid,
        assuranceName: selectedVehiculeData.nomAssurence || '',
        description: this.incidentDescription || '',
        etatVehicule: this.vehicleStatus === 'rolling' ? 'ROULANT' : 'NON_ROULANT',
        images: [] 
      };

      console.log('🚀 Création du sinistre:', sinistrePayload);

      // 4. Créer le sinistre
      const sinistreResponse: any = await this.sinistreService.addSinistrePost(sinistrePayload);
      
      console.log('✅ Sinistre créé:', sinistreResponse);

      const sinistreId = sinistreResponse.id;

      if (!sinistreId) {
        throw new Error('ID du sinistre non trouvé dans la réponse');
      }

      // 5. Upload du constat vers le SINISTRE (si présent)
      if (this.constatFile) {
        try {
          console.log('📄 Upload du constat vers sinistre', sinistreId);
          await this.sinistreService.uploadConstat(sinistreId.toString(), this.constatFile);
          console.log('✅ Constat uploadé avec succès');
        } catch (err) {
          console.error('⚠️ Erreur upload constat (on continue):', err);
        }
      }

      // 6. Collecter toutes les photos (obligatoires + optionnelles)
      const allFiles: File[] = [];
      
      // Photos obligatoires
      if (this.photoSteps['plaque'][0]) allFiles.push(this.photoSteps['plaque'][0].file);
      if (this.photoSteps['degats'][0]) allFiles.push(this.photoSteps['degats'][0].file);
      
      // Photos optionnelles
      if (this.photoSteps['avant'][0]) allFiles.push(this.photoSteps['avant'][0].file);
      if (this.photoSteps['cote'][0]) allFiles.push(this.photoSteps['cote'][0].file);

      // 7. Upload des photos vers le SINISTRE
      if (allFiles.length > 0) {
        try {
          console.log(`📸 Upload de ${allFiles.length} photo(s) vers sinistre ${sinistreId}...`);
          
          await this.sinistreService.uploadImages(sinistreId.toString(), allFiles);
          
          console.log('✅ Photos uploadées avec succès vers le sinistre');
        } catch (err) {
          console.error('⚠️ Erreur upload photos:', err);
          alert('⚠️ Le sinistre a été créé mais certaines photos n\'ont pas pu être ajoutées. Vous pouvez les ajouter depuis la liste des sinistres.');
        }
      }

      // 8. Succès !
      this.isSubmitting = false;
      this.currentStep = 4; // Étape de confirmation
      alert('✅ Sinistre déclaré avec succès !');

    } catch (error: any) {
      console.error('❌ Erreur lors de la déclaration:', error);
      this.isSubmitting = false;
      
      let errorMessage = 'Une erreur est survenue lors de la déclaration du sinistre.';
      
      if (error?.error?.message) {
        errorMessage = error.error.message;
      } else if (error?.message) {
        errorMessage = error.message;
      } else if (typeof error?.error === 'string') {
        errorMessage = error.error;
      }
      
      alert('❌ ' + errorMessage);
    }
  }

  // ✅ MODIFIER canProceed() :
  canProceed(): boolean {
    switch (this.currentStep) {
      case 1:
        return !!this.selectedVehicle && !!this.vehicleStatus;
      case 2:
        return !!this.selectedTypeAssurance && 
               !!this.lieuSinistre &&
               !!this.incidentDescription &&
               this.hasRequiredPhotos();
      case 3:
        return true;
      default:
        return false;
    }
  }
}