import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { DossiersService } from '../../../../../../services/dossiers.service';

@Component({
  selector: 'app-dossier-edit',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './dossier-edit.component.html',
  styleUrls: ['./dossier-edit.component.css']
})
export class DossierEditComponent implements OnInit {
  dossierForm: FormGroup;
  // Simuler des sinistres pour l'attribution
  sinistres = [
    { id: 1, nom: 'Sinistre 1' },
    { id: 2, nom: 'Sinistre 2' },
    { id: 3, nom: 'Sinistre 3' }
  ];

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private dossiersService: DossiersService,
    private router: Router
  ) {
    this.dossierForm = this.fb.group({
      type: ['', Validators.required],
      contactAssistance: [''],
      conditionsAcceptees: [false],
      idVehicule: [''],
      sinistre: ['']
    });
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.dossiersService.getDossiers().subscribe(dossiers => {
        const dossier = dossiers.find(d => d.id === +id);
        if (dossier) {
          this.dossierForm.patchValue({
            type: dossier.type,
            contactAssistance: dossier.contactAssistance,
            conditionsAcceptees: dossier.conditionsAcceptees,
            idVehicule: dossier.vehicule?.id || '',
            // sinistre: ... (à compléter si tu as l'info)
          });
        }
      });
    }
  }

  onSubmit(): void {
    if (this.dossierForm.valid) {
      // Traiter la modification du dossier
      console.log('Dossier modifié :', this.dossierForm.value);
    }
  }

  attribuerMission(): void {
    // Logique d'attribution à un sinistre/mission
    const sinistre = this.dossierForm.value.sinistre;
    console.log('Dossier attribué au sinistre :', sinistre);
  }

  close(): void {
    this.router.navigate(['/admin/dossiers']);
  }
} 