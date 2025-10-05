import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService, Assure } from '../../services/auth.service';
import Swal from 'sweetalert2';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent implements OnInit {
  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  assure: Assure[] = [];
  registerForm!: FormGroup;
  userType: 'assure' | 'garagiste' | null = null;
  isForced = false;

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    const forcedType = this.route.snapshot.data?.['forcedUserType'] as ('assure' | 'garagiste' | undefined);
    if (forcedType) {
      this.isForced = true;
      this.userType = forcedType;
      this.initForm();
    }
  }

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
        password: [''],
      });
    } else if (this.userType === 'garagiste') {
      this.registerForm = this.fb.group({
        nomDuGarage: ['', Validators.required],
        email: ['', [Validators.required, Validators.email]],
        telephone: ['', Validators.required],
        adresse: ['', Validators.required],
        password: ['', [Validators.required, Validators.minLength(8)]],
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
    formData.telephone = '+33' + formData.telephone;

    if (this.userType === 'assure') {
      this.authService.registerAssure(formData).subscribe({
        next: () => {
          Swal.fire({
            icon: 'success',
            title: 'Succès !',
            text: 'Compte assuré créé avec succès.',
            confirmButtonColor: '#3085d6',
            }).then(() => {
              this.router.navigate(['/clientDashboard']);
            });
          this.registerForm.reset();
          if (!this.isForced) this.userType = null;
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
      const formValue = this.registerForm.value;
      const reparateurPayload = {
        ...formValue,
        name: formValue.nomDuGarage,
        prenom: formValue.nomDuGarage,
        isValids: 'En attente',
        codePostal: '',
        ville: '',
        commission: 0,
        siret: '',
        servicePropose: [],
        anneeExperience: 0,
        nombreVehiculeReparee: 0,
        nombreEmployes: 0,
        logo: '',
        imagesReparations: [],
      };

      this.authService.registerGaragistre(reparateurPayload).subscribe({
        next: () => {
          Swal.fire({
            icon: 'success',
            title: 'Succès !',
            text: 'Compte garagiste créé avec succès.',
            confirmButtonColor: '#3085d6',
            confirmButtonText: 'OK'
          });
          this.registerForm.reset();
          if (!this.isForced) this.userType = null;
        },
        error: (error) => {
          console.error('Erreur API :', error);
          const errorMessage = error.error?.message || error.message || error.error || error;
          console.error("Message d'erreur brut:", errorMessage);
          Swal.fire({
            icon: 'error',
            title: 'Erreur serveur',
            text: 'Une erreur est survenue. ' + (typeof errorMessage === 'string' ? errorMessage : 'Veuillez réessayer.'),
            confirmButtonColor: '#d33'
          });
        }
      });
    }
  }

  goBack() {
    if (this.isForced) {
      this.router.navigate(['/register']);
      return;
    }
    this.userType = null;
    this.registerForm.reset();
  }
}
