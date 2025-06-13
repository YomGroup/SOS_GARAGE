import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';

interface Vehicle {
  id: number;
  brand: string;
  model: string;
  licensePlate: string;
  displayName: string;
}

interface DeclarationData {
  accidentDate: string;
  accidentLocation: string;
  circumstances: string;
  hasInjuries: boolean;
  policeIntervention: boolean;
  selectedVehicle: Vehicle | null;
  damageDescription: string;
  damageEstimation: string;
  photos: File[];
  constatFile: File | null;
  isConfirmed: boolean;
}

@Component({
  selector: 'app-declarationroulant',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './declarationroulant.component.html',
  styleUrls: ['./declarationroulant.component.css']
})
export class DeclarationroulantComponent implements OnInit {
  currentStep: number = 1;
  maxSteps: number = 4;

  // Données du formulaire
  declarationData: DeclarationData = {
    accidentDate: '',
    accidentLocation: '',
    circumstances: '',
    hasInjuries: false,
    policeIntervention: false,
    selectedVehicle: null,
    damageDescription: '',
    damageEstimation: '',
    photos: [],
    constatFile: null,
    isConfirmed: false
  };

  // Liste des véhicules
  vehicles: Vehicle[] = [
    {
      id: 1,
      brand: 'Peugeot',
      model: '308',
      licensePlate: 'AB-123-CD',
      displayName: 'Peugeot 308 - AB-123-CD'
    },
    {
      id: 2,
      brand: 'Renault',
      model: 'Clio',
      licensePlate: 'EF-456-GH',
      displayName: 'Renault Clio - EF-456-GH'
    }
  ];

  // Formulaires pour chaque étape
  step1Form: FormGroup;
  step2Form: FormGroup;
  step3Form: FormGroup;
  step4Form: FormGroup;

  // Variables pour l'affichage
  photoCount: number = 0;
  isSubmitting: boolean = false;
  submissionSuccess: boolean = false;

  constructor(private formBuilder: FormBuilder) {
    // Initialisation des formulaires dans le constructeur
    this.step1Form = this.formBuilder.group({
      accidentDate: ['', Validators.required],
      accidentLocation: ['', Validators.required],
      circumstances: ['', Validators.required],
      hasInjuries: [false],
      policeIntervention: [false]
    });

    this.step2Form = this.formBuilder.group({
      selectedVehicleId: ['', Validators.required],
      damageDescription: [''],
      damageEstimation: ['']
    });

    this.step3Form = this.formBuilder.group({
      photos: [''],
      constatFile: ['']
    });

    this.step4Form = this.formBuilder.group({
      isConfirmed: [false, Validators.requiredTrue]
    });
  }

  ngOnInit(): void {
    this.loadUserVehicles();
  }

  // Navigation entre les étapes
  nextStep(): void {
    if (this.validateCurrentStep()) {
      this.saveCurrentStepData();
      if (this.currentStep < this.maxSteps) {
        this.currentStep++;
      }
    }
  }

  previousStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  // Validation des étapes
  private validateCurrentStep(): boolean {
    switch (this.currentStep) {
      case 1: return this.step1Form.valid;
      case 2: return this.step2Form.valid;
      case 3: return true; // Photos optionnelles pour véhicule roulant
      case 4: return this.step4Form.valid;
      default: return false;
    }
  }

  private saveCurrentStepData(): void {
    switch (this.currentStep) {
      case 1:
        this.declarationData = {
          ...this.declarationData,
          accidentDate: this.step1Form.get('accidentDate')?.value,
          accidentLocation: this.step1Form.get('accidentLocation')?.value,
          circumstances: this.step1Form.get('circumstances')?.value,
          hasInjuries: this.step1Form.get('hasInjuries')?.value,
          policeIntervention: this.step1Form.get('policeIntervention')?.value
        };
        break;

      case 2:
        const selectedVehicleId = this.step2Form.get('selectedVehicleId')?.value;
        this.declarationData = {
          ...this.declarationData,
          selectedVehicle: this.vehicles.find(v => v.id == selectedVehicleId) || null,
          damageDescription: this.step2Form.get('damageDescription')?.value,
          damageEstimation: this.step2Form.get('damageEstimation')?.value
        };
        break;

      case 3:
        // Les fichiers sont gérés séparément
        break;

      case 4:
        this.declarationData = {
          ...this.declarationData,
          isConfirmed: this.step4Form.get('isConfirmed')?.value
        };
        break;
    }
  }

  // Gestion des fichiers
  onPhotosSelected(event: Event): void {
    const files = (event.target as HTMLInputElement).files;
    if (files) {
      this.declarationData.photos = Array.from(files);
      this.photoCount = files.length;
    }
  }

  onConstatSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      this.declarationData.constatFile = file;
    }
  }

  // Soumission de la déclaration
  async submitDeclaration(): Promise<void> {
    if (!this.validateAllSteps()) {
      this.showError('Veuillez vérifier tous les champs obligatoires');
      return;
    }

    this.isSubmitting = true;

    try {
      const formData = this.prepareFormData();
      const response = await this.sendDeclaration(formData);

      if (response.success) {
        this.submissionSuccess = true;
        this.showSuccess('Déclaration envoyée avec succès !');
        setTimeout(() => {
          this.onDeclarationSuccess(response.declarationId);
        }, 2000);
      } else {
        this.showError('Erreur lors de l\'envoi de la déclaration');
      }
    } catch (error) {
      console.error('Erreur soumission:', error);
      this.showError('Erreur technique. Veuillez réessayer.');
    } finally {
      this.isSubmitting = false;
    }
  }

  private validateAllSteps(): boolean {
    return this.step1Form.valid &&
      this.step2Form.valid &&
      this.step4Form.valid;
  }

  private prepareFormData(): FormData {
    const formData = new FormData();
    formData.append('type', 'vehicule_roulant');
    formData.append('accidentDate', this.declarationData.accidentDate);
    formData.append('accidentLocation', this.declarationData.accidentLocation);
    formData.append('circumstances', this.declarationData.circumstances);
    formData.append('hasInjuries', String(this.declarationData.hasInjuries));
    formData.append('policeIntervention', String(this.declarationData.policeIntervention));

    if (this.declarationData.selectedVehicle) {
      formData.append('vehicleId', String(this.declarationData.selectedVehicle.id));
    }
    formData.append('damageDescription', this.declarationData.damageDescription);
    formData.append('damageEstimation', this.declarationData.damageEstimation);

    this.declarationData.photos.forEach((photo, index) => {
      formData.append(`photos[${index}]`, photo);
    });

    if (this.declarationData.constatFile) {
      formData.append('constat', this.declarationData.constatFile);
    }

    return formData;
  }

  private async sendDeclaration(formData: FormData): Promise<any> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          declarationId: 'DECL_' + Date.now(),
          message: 'Déclaration reçue avec succès'
        });
      }, 2000);
    });
  }

  private onDeclarationSuccess(declarationId: string): void {
    console.log('Déclaration créée:', declarationId);
  }

  private loadUserVehicles(): void {
    // Implémentez la logique de chargement des véhicules
  }

  // Getters pour le template
  get accidentDate(): string {
    if (!this.declarationData.accidentDate) return '';
    return new Date(this.declarationData.accidentDate).toLocaleDateString('fr-FR');
  }

  get selectedVehicle(): string {
    return this.declarationData.selectedVehicle?.displayName || 'Non sélectionné';
  }

  get accidentLocation(): string {
    return this.declarationData.accidentLocation || 'Non renseigné';
  }

  get hasInjuries(): boolean {
    return this.declarationData.hasInjuries;
  }

  get policeIntervention(): boolean {
    return this.declarationData.policeIntervention;
  }

  // Méthodes utilitaires
  private showSuccess(message: string): void {
    alert(message);
  }

  private showError(message: string): void {
    alert(message);
  }

  callSupport(): void {
    window.open('tel:0800123456');
  }

  openChat(): void {
    console.log('Ouverture du chat de support');
  }

  isStepValid(step: number): boolean {
    switch (step) {
      case 1: return this.step1Form.valid;
      case 2: return this.step2Form.valid;
      case 3: return true;
      case 4: return this.step4Form.valid;
      default: return false;
    }
  }

  isStepCompleted(step: number): boolean {
    return step < this.currentStep;
  }

  resetForm(): void {
    this.currentStep = 1;
    this.declarationData = {
      accidentDate: '',
      accidentLocation: '',
      circumstances: '',
      hasInjuries: false,
      policeIntervention: false,
      selectedVehicle: null,
      damageDescription: '',
      damageEstimation: '',
      photos: [],
      constatFile: null,
      isConfirmed: false
    };
    this.step1Form.reset();
    this.step2Form.reset();
    this.step3Form.reset();
    this.step4Form.reset();
    this.photoCount = 0;
    this.submissionSuccess = false;
  }
}