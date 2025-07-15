import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService, Assure } from '../../services/auth.service';
import { inject } from '@angular/core';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent {
  private authService = inject(AuthService);
  assure: Assure[] = [];
  registerForm!: FormGroup;
  userType: 'assure' | 'garagiste' | null = null;

  constructor(private fb: FormBuilder) { }

  selectUserType(type: 'assure' | 'garagiste') {
    this.userType = type;
    this.initForm();
  }

  initForm() {
    if (this.userType === 'assure') {
      this.registerForm = this.fb.group({
        nom: [''],
        prenom: [''],
        email: [''],
        telephone: [''],
        adresse: [''],
        adressePostale: [''],
        numeroPermis: [''],
        typePermis: [''],
        datePermis: [''],
        dateObtentionPermis: [''],
        typeGarantie: [''],
        password: [''],
        // ... autres champs véhicule
      });
    } else if (this.userType === 'garagiste') {
      this.registerForm = this.fb.group({
        prenom: ['', Validators.required],
        email: ['', [Validators.required, Validators.email]],
        telephone: ['', Validators.required],
        adresse: ['', Validators.required],
        password: ['', [Validators.required, Validators.minLength(8)]],
        // Les champs suivants ne sont pas dans le formulaire, mais ajoutés à la soumission
        isvalids: [false],
        missions: [[]],
      });
    }
  }
  onSubmit() {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    const formData = this.registerForm.value;

    if (this.userType === 'assure') {
      this.authService.registerAssure(formData).subscribe({
        next: () => {
          Swal.fire({
            icon: 'success',
            title: 'Succès !',
            text: 'Compte assuré créé avec succès.',
            confirmButtonColor: '#3085d6',
          })
          this.registerForm.reset();
          this.userType = null;
        },
        error: (error) => {
          console.error(error);
          Swal.fire({
            icon: 'error',
            title: 'Erreur',
            text: 'Une erreur est survenue. Veuillez réessayer.',
          });
        }
      });
    } else if (this.userType === 'garagiste') {
      const formData = {
        ...this.registerForm.value,
        name: this.registerForm.value.prenom, // ou un champ 'nom' à ajouter
        isvalids: false,
        missions: []
      };

      this.authService.registerGaragistre(formData).subscribe({
        next: () => {
          Swal.fire({
            icon: 'success',
            title: 'Succès !',
            text: 'Compte garagiste créé avec succès.',
            confirmButtonColor: '#3085d6',
            confirmButtonText: 'OK'
          });
          this.registerForm.reset();
          this.userType = null;
        },
        error: (error) => {
          console.error('Erreur API :', error.error);
          Swal.fire({
            icon: 'error',
            title: 'Erreur serveur',
            text: error.error?.message || 'Une erreur est survenue. Veuillez réessayer.',
            confirmButtonColor: '#d33'
          });
        }
      });
    }
  }


  goBack() {
    this.userType = null;
    this.registerForm.reset();
  }

}
