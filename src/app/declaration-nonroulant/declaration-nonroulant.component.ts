import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';

interface Vehicle {
  id: number;
  brand: string;
  model: string;
  licensePlate: string;
  displayName: string;
}

interface UrgentDeclarationData {
  isSafe: boolean;
  injuryLevel: 'none' | 'light' | 'serious';
  accidentDate: string;
  currentLocation: string;
  selectedVehicle: Vehicle | null;
  nonRollingReasons: string[];
  accidentDescription: string;
  policePresence: string;
  otherVehiclesInvolved: string;
  needsTowing: boolean;
  towingDestination: string;
  destinationAddress: string;
  urgentPhotos: File[];
  documents: File[];
  isUrgentConfirmed: boolean;
}

@Component({
  selector: 'app-declaration-nonroulant',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './declaration-nonroulant.component.html',
  styleUrls: ['./declaration-nonroulant.component.css']
})
export class DeclarationNonroulantComponent implements OnInit, OnDestroy {
  currentStep = 1;
  maxSteps = 4;

  isUrgentSituation = true;
  declarationSubmitted = false;
  emergencyContactTime = 5; // minutes
  countdownTimer: any;
  autoSaveInterval: any;

  declarationData: UrgentDeclarationData = {
    isSafe: false,
    injuryLevel: 'none',
    accidentDate: '',
    currentLocation: '',
    selectedVehicle: null,
    nonRollingReasons: [],
    accidentDescription: '',
    policePresence: '',
    otherVehiclesInvolved: '',
    needsTowing: false,
    towingDestination: '',
    destinationAddress: '',
    urgentPhotos: [],
    documents: [],
    isUrgentConfirmed: false
  };
  isStepValid(step: number): boolean {
    switch (step) {
      case 1: return this.step1Form.valid;
      case 2: return this.step2Form.valid;
      case 3: return this.step3Form.valid;
      case 4: return this.step4Form.valid;
      default: return false;
    }
  }
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

  step1Form: FormGroup;
  step2Form: FormGroup;
  step3Form: FormGroup;
  step4Form: FormGroup;

  isSubmitting = false;
  emergencyResponse: any = null;
  geolocationEnabled = false;

  constructor(private formBuilder: FormBuilder) {
    this.step1Form = this.formBuilder.group({
      isSafe: [false, Validators.required],
      injuryLevel: ['none', Validators.required],
      accidentDate: ['', Validators.required],
      currentLocation: ['', Validators.required]
    });

    this.step2Form = this.formBuilder.group({
      selectedVehicleId: ['', Validators.required],
      nonRollingReasons: [[]],
      accidentDescription: ['', Validators.required],
      policePresence: [''],
      otherVehiclesInvolved: ['']
    });

    this.step3Form = this.formBuilder.group({
      needsTowing: [false, Validators.required],
      towingDestination: [''],
      destinationAddress: ['']
    });

    this.step4Form = this.formBuilder.group({
      isUrgentConfirmed: [false, Validators.requiredTrue]
    });
  }

  ngOnInit(): void {
    this.loadUserVehicles();
    this.initializeGeolocation();
    this.startUrgencyProtocol();
  }

  ngOnDestroy(): void {
    this.clearTimers();
  }

  private clearTimers(): void {
    if (this.countdownTimer) {
      clearInterval(this.countdownTimer);
    }
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
    }
  }

  nextStep(): void {
    if (this.validateCurrentStep()) {
      this.saveCurrentStepData();

      if (this.currentStep === 1 && !this.declarationData.isSafe) {
        this.triggerEmergencyProtocol();
      }

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

  private validateCurrentStep(): boolean {
    switch (this.currentStep) {
      case 1: return this.step1Form.valid;
      case 2: return this.step2Form.valid;
      case 3: return this.step3Form.valid;
      case 4: return this.step4Form.valid;
      default: return false;
    }
  }

  private saveCurrentStepData(): void {
    switch (this.currentStep) {
      case 1:
        this.declarationData = {
          ...this.declarationData,
          isSafe: this.step1Form.get('isSafe')?.value,
          injuryLevel: this.step1Form.get('injuryLevel')?.value,
          accidentDate: this.step1Form.get('accidentDate')?.value,
          currentLocation: this.step1Form.get('currentLocation')?.value
        };
        break;

      case 2:
        const selectedVehicleId = this.step2Form.get('selectedVehicleId')?.value;
        this.declarationData = {
          ...this.declarationData,
          selectedVehicle: this.vehicles.find(v => v.id == selectedVehicleId) || null,
          accidentDescription: this.step2Form.get('accidentDescription')?.value,
          policePresence: this.step2Form.get('policePresence')?.value,
          otherVehiclesInvolved: this.step2Form.get('otherVehiclesInvolved')?.value
        };
        break;

      case 3:
        this.declarationData = {
          ...this.declarationData,
          needsTowing: this.step3Form.get('needsTowing')?.value,
          towingDestination: this.step3Form.get('towingDestination')?.value,
          destinationAddress: this.step3Form.get('destinationAddress')?.value
        };
        break;

      case 4:
        this.declarationData = {
          ...this.declarationData,
          isUrgentConfirmed: this.step4Form.get('isUrgentConfirmed')?.value
        };
        break;
    }
  }

  onNonRollingReasonChange(reason: string, event: Event): void {
    const isChecked = (event.target as HTMLInputElement).checked;
    this.declarationData.nonRollingReasons = isChecked
      ? [...this.declarationData.nonRollingReasons, reason]
      : this.declarationData.nonRollingReasons.filter(r => r !== reason);
  }

  onUrgentPhotosSelected(event: Event): void {
    const files = (event.target as HTMLInputElement).files;
    if (files) {
      this.declarationData.urgentPhotos = Array.from(files);
    }
  }

  onDocumentsSelected(event: Event): void {
    const files = (event.target as HTMLInputElement).files;
    if (files) {
      this.declarationData.documents = Array.from(files);
    }
  }

  async submitUrgentDeclaration(): Promise<void> {
    if (!this.validateAllSteps()) {
      this.showError('Veuillez vérifier tous les champs obligatoires');
      return;
    }

    this.isSubmitting = true;
    this.declarationSubmitted = true;

    try {
      const formData = this.prepareUrgentFormData();
      const response = await this.sendUrgentDeclaration(formData);

      if (response.success) {
        this.emergencyResponse = response;
        this.startEmergencyCountdown();
        this.showSuccess('Déclaration d\'urgence envoyée ! Contact imminent.');
        this.notifyEmergencyServices(response.emergencyId);
      } else {
        this.showError('Erreur critique. Veuillez appeler directement le 0800 123 456');
      }
    } catch (error) {
      console.error('Erreur soumission urgente:', error);
      this.showError('Erreur technique critique. Contactez immédiatement le support !');
      this.triggerManualEmergencyContact();
    } finally {
      this.isSubmitting = false;
    }
  }

  private validateAllSteps(): boolean {
    return this.step1Form.valid && this.step2Form.valid &&
      this.step3Form.valid && this.step4Form.valid;
  }

  private prepareUrgentFormData(): FormData {
    const formData = new FormData();

    formData.append('type', 'vehicule_non_roulant_urgent');
    formData.append('priority', 'CRITICAL');
    formData.append('timestamp', new Date().toISOString());

    // Ajoutez toutes les données au FormData
    Object.entries(this.declarationData).forEach(([key, value]) => {
      if (value instanceof File) {
        formData.append(key, value);
      } else if (Array.isArray(value) && value[0] instanceof File) {
        value.forEach((file, index) => formData.append(`${key}[${index}]`, file));
      } else if (typeof value === 'object' && value !== null) {
        formData.append(key, JSON.stringify(value));
      } else {
        formData.append(key, String(value));
      }
    });

    return formData;
  }

  private async sendUrgentDeclaration(formData: FormData): Promise<any> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          emergencyId: 'URGENT_' + Date.now(),
          estimatedContactTime: 5,
          emergencyTeamAssigned: true,
          towingDispatched: this.declarationData.needsTowing,
          message: 'Déclaration d\'urgence traitée - Contact imminent'
        });
      }, 1000);
    });
  }

  private startUrgencyProtocol(): void {
    console.log('Protocole d\'urgence activé');
    if (typeof window !== 'undefined') {
      this.autoSaveInterval = setInterval(() => this.autoSaveProgress(), 30000);
    }
  }

  private autoSaveProgress(): void {
    try {
      if (typeof localStorage !== 'undefined') {
        const progress = {
          step: this.currentStep,
          data: this.declarationData,
          timestamp: new Date().toISOString()
        };
        localStorage.setItem('urgentDeclarationProgress', JSON.stringify(progress));
      }
    } catch (error) {
      console.error('Erreur sauvegarde automatique:', error);
    }
  }

  private triggerEmergencyProtocol(): void {
    if (!this.declarationData.isSafe) {
      this.showCriticalAlert('Situation dangereuse détectée - Support contacté automatiquement');
      this.autoContactEmergency();
    }
  }

  private startEmergencyCountdown(): void {
    let timeLeft = this.emergencyContactTime * 60;
    this.countdownTimer = setInterval(() => {
      timeLeft--;
      if (timeLeft <= 0) {
        clearInterval(this.countdownTimer);
        this.onEmergencyContactTime();
      }
    }, 1000);
  }

  private onEmergencyContactTime(): void {
    this.showInfo('Délai dépassé - Escalade automatique vers supervision');
  }

  private initializeGeolocation(): void {
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.geolocationEnabled = true;
          const coords = `${position.coords.latitude}, ${position.coords.longitude}`;
          this.step1Form.patchValue({ currentLocation: coords });
        },
        (error) => {
          console.log('Géolocalisation non disponible:', error);
          this.showError('Impossible d\'accéder à votre position. Veuillez entrer manuellement votre localisation.');
        }
      );
    }
  }

  private loadUserVehicles(): void {
    // Implémentez la logique de chargement des véhicules
  }

  private notifyEmergencyServices(emergencyId: string): void {
    console.log('Services d\'urgence notifiés:', emergencyId);
  }

  private autoContactEmergency(): void {
    console.log('Contact automatique des services d\'urgence');
  }

  private triggerManualEmergencyContact(): void {
    if (confirm('Erreur technique critique. Voulez-vous appeler directement le support ?')) {
      this.callEmergencySupport();
    }
  }

  callEmergencySupport(): void {
    if (typeof window !== 'undefined') {
      window.open('tel:0800123456');
    }
  }

  useGeolocation(): void {
    this.initializeGeolocation();
  }

  // Getters
  get isSafe(): boolean { return this.declarationData.isSafe; }

  get injuryLevel(): string {
    const levels = {
      'none': 'Aucun blessé',
      'light': 'Blessures légères',
      'serious': 'Blessures graves'
    };
    return levels[this.declarationData.injuryLevel] || 'Non renseigné';
  }

  get needsTowing(): boolean { return this.declarationData.needsTowing; }
  get currentLocation(): string { return this.declarationData.currentLocation || 'Non renseigné'; }
  get policePresence(): string { return this.declarationData.policePresence || 'Non renseigné'; }

  private showSuccess(message: string): void {
    alert('✅ SUCCÈS: ' + message);
  }

  private showError(message: string): void {
    alert('🚨 ERREUR CRITIQUE: ' + message);
  }

  private showCriticalAlert(message: string): void {
    alert('⚠️ ALERTE SÉCURITÉ: ' + message);
  }

  private showInfo(message: string): void {
    alert('ℹ️ INFO: ' + message);
  }
}