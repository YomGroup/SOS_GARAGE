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
import { FirebaseStorageService } from '../../services/firebase-storage.service';
import { getDownloadURL, getStorage, ref, uploadBytes } from 'firebase/storage';

import { Router } from '@angular/router'
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

  photoSteps: { [step: number]: { url: string; file: File }[] } = {
  1: [],
  2: [],
  3: [],
  4: []
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
  private firebaseStorageService = inject(FirebaseStorageService);
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
            console.log('Données du véhicule récupérées :', vehicle?.nomAssurence);
            assurance = vehicle?.nomAssurence || '';
            return this.vehiculeService.listAssuranceVehiculesNumero(this.token);
          })
        ).subscribe({
          next: (data: any) => {
            this.assurances = data;
            this.numeroAssurance = this.assurances.find(a => {
              const nom = a.split('-')[0].trim().toUpperCase();
              return nom === assurance.trim().toUpperCase();
            });
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
    return this.photoSteps[1].length > 0 &&
      this.photoSteps[2].length > 0 &&
      this.photoSteps[3].length > 0 &&
      this.photoSteps[4].length > 0;
  }

  toggleAssuranceDropdown(): void {
    this.isAssuranceDropdownOpen = !this.isAssuranceDropdownOpen;
  }

  selectAssurance(assurance: any): void {
    this.selectedAssurance = assurance;
    this.isAssuranceDropdownOpen = false;
  }

  canProceed(): boolean {
    switch (this.currentStep) {
      case 1:
        return !!this.selectedVehicle && !!this.vehicleStatus;
      case 2:
        return !!this.selectedTypeAssurance && !!this.lieuSinistre &&
          (!!this.incidentDescription || !!this.constatFile) && this.hasRequiredPhotos();
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

  onPhotoSelect(event: Event, step: number): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      const files = Array.from(input.files);

      files.forEach(file => {
        if (!file.type.match('image.*')) {
          alert('Seules les images sont acceptées');
          return;
        }

        const reader = new FileReader();
        reader.onload = (e: any) => {
          this.photoSteps[step].push({
            url: e.target.result,
            file: file
          });
        };
        reader.readAsDataURL(file);
      });

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

  removePhoto(index: number, step: number): void {
    URL.revokeObjectURL(this.photoSteps[step][index].url);
    this.photoSteps[step].splice(index, 1);
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

  // Soumission du sinistre (simplifiée, sans signature)
  async submitSinistre(): Promise<void> {
    this.isSubmitting = true;

    try {
      //const savedFiles = await this.saveFilesToAssets();

      const vehiculeid=parseInt(this.vehiclesAll.find(v => v.marque + '(' + v.immatriculation + ')' === this.selectedVehicle)?.id || 0);

      const allFiles: File[] = Object.values(this.photoSteps).flat().map(item => item.file);

      var images2;

      try {
       const images = await this.sinistreService.uploadImages(vehiculeid + '', allFiles);
       console.log('Upload réussi', images);
       images2 = images;
      } catch (err) {
       console.error('Erreur upload images', err);
      }

const imageObjects = (images2 || []).map((url: string, index: number) => ({
  imageName: url.split('/').pop() || `image_${index}.jpg`, // extrait le nom du fichier
  imageType: 'AVANT', // tu peux définir une méthode utilitaire pour le type
  objectStorageUrl: url, // l'URL réelle
}));




      console.log({images2});


  const sinistrePayload = {
  type: this.selectedTypeAssurance,
  contactAssistance: this.email,
  lienConstat: this.constatFile ? this.constatFile.name : '',
  conditionsAcceptees: true,
  lieu: this.lieuSinistre,
  vehiculeId: vehiculeid,
  assuranceName: this.vehiclesAll.find(v => v.marque + '(' + v.immatriculation + ')' === this.selectedVehicle)?.nomAssurence || '', // String
  description: this.incidentDescription || '',
  etatVehicule: this.vehicleStatus === 'rolling' ? 'ROULANT' : 'NON_ROULANT',
  images: imageObjects,
};


      console.log('🚀 Soumission du sinistre:', sinistrePayload);

      (await this.sinistreService.addSinistrePost(sinistrePayload)).subscribe({
        next: (sinistreResponse: any) => {
          console.log("✅ Sinistre créé :", sinistreResponse);
          this.isSubmitting = false;
          this.currentStep = 4; // Étape de confirmation
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

  private async saveFilesToAssets(): Promise<
    { imageName: string; imageType: string; objectStorageUrl: string; }[]
  > {
    const storage = getStorage();
    const uploadedImages: {
      imageName: string;
      imageType: string;
      objectStorageUrl: string;
    }[] = [];

    const baseDir = 'declaration/photos';
    const photoStepDirs: { [key: number]: string } = {
      1: 'AVANT',
      2: 'PLAQUE',
      3: 'COTE',
      4: 'DEGATS'
    };

    // 🔄 Upload de chaque photo dans Firebase
    for (const step in this.photoSteps) {
      const photos = this.photoSteps[step];
      const imageType = photoStepDirs[+step];

      for (const photo of photos) {
        const file = photo.file;
        const firebasePath = `${baseDir}/${imageType}/${file.name}`;
        const fileRef = ref(storage, firebasePath);

        await uploadBytes(fileRef, file);
        const downloadURL = await getDownloadURL(fileRef);

        uploadedImages.push({
          imageName: file.name,
          imageType,
          objectStorageUrl: downloadURL
        });
      }
    }

    // 🔄 Upload du constat s’il existe
    if (this.constatFile) {
      const constatPath = `${baseDir}/constats/${this.constatFile.name}`;
      const constatRef = ref(storage, constatPath);

      await uploadBytes(constatRef, this.constatFile);
      const constatUrl = await getDownloadURL(constatRef);

      uploadedImages.push({
        imageName: this.constatFile.name,
        imageType: 'CONSTAT',
        objectStorageUrl: constatUrl
      });
    }

    return uploadedImages;
  }

}