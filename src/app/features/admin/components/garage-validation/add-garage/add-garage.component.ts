import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-add-garage',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './add-garage.component.html',
  styleUrls: ['./add-garage.component.css']
})
export class AddGarageComponent {
  garageForm: FormGroup;

  constructor(private fb: FormBuilder) {
    this.garageForm = this.fb.group({
      name: ['', Validators.required],
      prenom: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      telephone: ['', Validators.required],
      adresse: ['', Validators.required],
      password: ['', Validators.required],
      isvalids: [true],
      missions: this.fb.array([])
    });
  }

  get missions(): FormArray {
    return this.garageForm.get('missions') as FormArray;
  }

  addMission() {
    this.missions.push(this.fb.group({
      id: [0],
      createdAt: [''],
      updatedAt: [''],
      statut: [''],
      dateCreation: [''],
      photosVehicule: this.fb.array([]),
      constatAccident: [''],
      documentsAssurance: this.fb.array([]),
      cessionCreance: [''],
      ordreReparation: [''],
      devis: [0],
      factureFinale: [0],
      pretVehicule: [false],
      avantages: this.fb.array([]),
      sinistre: this.fb.group({}),
      reparateur: this.fb.group({}),
      messages: this.fb.array([]),
      reparation: this.fb.group({}),
      declareCommeEpave: [false],
      epaveValideeParAdmin: [false],
      dateDeclarationEpave: ['']
    }));
  }

  onSubmit() {
    if (this.garageForm.valid) {
      // TODO: Envoyer les données au backend
      console.log('Garage à ajouter:', this.garageForm.value);
    }
  }
} 