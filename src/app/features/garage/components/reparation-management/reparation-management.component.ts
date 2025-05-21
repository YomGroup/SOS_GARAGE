import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-reparation-management',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="bg-white rounded-lg shadow-lg p-6">
      <h2 class="text-2xl font-bold mb-6">Gestion des Réparations</h2>

      <!-- Ordre de réparation -->
      <div class="mb-8">
        <h3 class="text-lg font-semibold mb-4">Ordre de réparation</h3>
        <div class="flex space-x-4">
          <button class="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
            Préparer l'ordre
          </button>
          <button class="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700">
            Envoyer l'ordre
          </button>
        </div>
      </div>

      <!-- Véhicule de remplacement -->
      <div class="mb-8">
        <h3 class="text-lg font-semibold mb-4">Véhicule de remplacement</h3>
        <div class="flex space-x-4">
          <button class="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
            Organiser le prêt
          </button>
          <button class="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700">
            Voir les disponibilités
          </button>
        </div>
      </div>

      <!-- Devis et facture -->
      <div class="mb-8">
        <h3 class="text-lg font-semibold mb-4">Devis et facture</h3>
        <form [formGroup]="invoiceForm" (ngSubmit)="onSubmitInvoice()" class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700">Montant du devis</label>
              <input type="number" formControlName="quoteAmount" 
                     class="mt-1 block w-full rounded-md border-gray-300 shadow-sm">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">Montant de la facture</label>
              <input type="number" formControlName="invoiceAmount" 
                     class="mt-1 block w-full rounded-md border-gray-300 shadow-sm">
            </div>
          </div>
          <div class="flex space-x-4">
            <button type="submit" class="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
              Envoyer le devis
            </button>
            <button type="button" (click)="onSubmitInvoice()" 
                    class="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700">
              Envoyer la facture
            </button>
          </div>
        </form>
      </div>

      <!-- Statut de la réparation -->
      <div class="mb-8">
        <h3 class="text-lg font-semibold mb-4">Statut de la réparation</h3>
        <div class="flex space-x-4">
          <select class="rounded-md border-gray-300 shadow-sm">
            <option value="en_cours">En cours</option>
            <option value="terminee">Terminée</option>
            <option value="en_attente">En attente de pièces</option>
            <option value="epave">Déclarer en épave</option>
          </select>
          <button class="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
            Mettre à jour
          </button>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class ReparationManagementComponent implements OnInit {
  invoiceForm: FormGroup;

  constructor(private fb: FormBuilder) {
    this.invoiceForm = this.fb.group({
      quoteAmount: [null, [Validators.required, Validators.min(0)]],
      invoiceAmount: [null, [Validators.required, Validators.min(0)]]
    });
  }

  ngOnInit(): void {}

  onSubmitInvoice(): void {
    if (this.invoiceForm.valid) {
      console.log('Formulaire soumis:', this.invoiceForm.value);
      // TODO: Implémenter la logique de soumission
    }
  }
} 