import { Component, NgModule, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-mission-reception',
  templateUrl: './mission-reception.component.html',
  styleUrls: ['./mission-reception.component.css']
})
export class MissionReceptionComponent implements OnInit {
  missionForm: FormGroup;

  constructor(private fb: FormBuilder) {
    this.missionForm = this.fb.group({
      hasReplacementVehicle: [false, Validators.required],
      advantages: [[], Validators.required]
    });
  }
  @NgModule({
    imports : [
      ReactiveFormsModule
    ]
  })

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