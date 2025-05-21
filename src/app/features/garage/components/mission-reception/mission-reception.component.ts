import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-mission-reception',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="bg-white rounded-lg shadow-lg p-6">
      <h2 class="text-2xl font-bold mb-6">Réception de Mission</h2>
      
      <form [formGroup]="missionForm" (ngSubmit)="onSubmit()" class="space-y-6">
        <!-- Photos et Documents -->
        <div class="space-y-4">
          <h3 class="text-lg font-semibold">Documents du véhicule</h3>
          <div class="grid grid-cols-2 gap-4">
            <div class="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
              <input type="file" accept="image/*" (change)="onFileSelected($event, 'vehiclePhotos')" multiple class="hidden" #vehiclePhotos>
              <button type="button" (click)="vehiclePhotos.click()" class="text-blue-600 hover:text-blue-800">
                Photos du véhicule
              </button>
            </div>
            <div class="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
              <input type="file" accept="image/*,.pdf" (change)="onFileSelected($event, 'accidentReport')" class="hidden" #accidentReport>
              <button type="button" (click)="accidentReport.click()" class="text-blue-600 hover:text-blue-800">
                Constat d'accident
              </button>
            </div>
          </div>
        </div>

        <!-- Formulaire de prise en charge -->
        <div class="space-y-4">
          <h3 class="text-lg font-semibold">Formulaire de prise en charge</h3>
          
          <div class="form-group">
            <label class="block text-sm font-medium text-gray-700">Véhicule de secours disponible</label>
            <select formControlName="hasReplacementVehicle" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm">
              <option value="true">Oui</option>
              <option value="false">Non</option>
            </select>
          </div>

          <div class="form-group">
            <label class="block text-sm font-medium text-gray-700">Avantages proposés</label>
            <select formControlName="advantages" multiple class="mt-1 block w-full rounded-md border-gray-300 shadow-sm">
              <option value="pickup">Service de prise en charge</option>
              <option value="delivery">Service de livraison</option>
              <option value="warranty">Garantie étendue</option>
              <option value="discount">Réduction sur les pièces</option>
            </select>
          </div>
        </div>

        <div class="flex justify-end">
          <button type="submit" 
                  [disabled]="!missionForm.valid"
                  class="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400">
            Valider la prise en charge
          </button>
        </div>
      </form>
    </div>
  `,
  styles: []
})
export class MissionReceptionComponent implements OnInit {
  missionForm: FormGroup;

  constructor(private fb: FormBuilder) {
    this.missionForm = this.fb.group({
      hasReplacementVehicle: [false, Validators.required],
      advantages: [[], Validators.required]
    });
  }

  ngOnInit(): void {}

  onFileSelected(event: any, type: string): void {
    const files = event.target.files;
    // TODO: Implémenter la logique de gestion des fichiers
    console.log(`Fichiers sélectionnés pour ${type}:`, files);
  }

  onSubmit(): void {
    if (this.missionForm.valid) {
      console.log('Formulaire soumis:', this.missionForm.value);
      // TODO: Implémenter la logique de soumission
    }
  }
} 