import { Component, inject } from '@angular/core';
import { AssureService } from '../../services/assure.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent {
  private assureService = inject(AssureService);
  userData: any = {
    name: '',
    prenom: '',
    email: '',
    telephone: '',
    adressePostale: '',
    numeroPermis: '',
    adresse: '',
    dateNaissance: '',
    dateObtentionPermis: '',
    typePermis: '',
    typeGarantie: ''
  };
  // Définissez les types de permis disponibles
  permisTypes = [
    { value: 'a', label: 'Permis A (Moto)' },
    { value: 'b', label: 'Permis B (Voiture)' },
    { value: 'c', label: 'Permis C (Poids lourd)' },
    { value: 'd', label: 'Permis D (Bus)' }
  ];
  isEditing = false;
  originalData: any = {};
  userid: string | null = null;
  assureId: number = 0;
  private authService = inject(AuthService);


  ngOnInit(): void {
    this.userid = this.authService.getToken()?.['sub'] ?? null;

    if (this.userid) {
      this.assureService.getAssurerID(this.userid).subscribe({
        next: (data: any) => {
          this.assureId = data.id; // adapte selon ta réponse
          this.loadUserData();

        },
        error: (err) => {
          console.error('Erreur lors de la récupération de l’assure  ID :', err);
        }
      });
    }
  }

  private loadUserData(): void {

    this.assureService.addAssurerGet(this.assureId).subscribe({
      next: (data: any) => {
        console.log('Données utilisateur récupéréeskdnjn:', data);
        this.userData = {
          ...this.userData,
          ...data,
          // Formatage des données si nécessaire
          telephone: this.formatPhoneNumber(data.telephone),
          //dateObtentionPermis: this.formatDate(data.dateObtentionPermis)
        };
        this.originalData = { ...this.userData };
      },
      error: (err) => {
        console.error('Erreur lors du chargement des données utilisateur', err);
      }
    });

  }

  private formatPhoneNumber(phone: string): string {
    // Formatage du numéro de téléphone
    return phone.replace(/(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4 $5');
  }

  private formatDate(dateString: string): string {
    // Formatage de la date pour l'input date
    return dateString ? new Date(dateString).toISOString().split('T')[0] : '';
  }

  editProfile(): void {
    this.isEditing = true;
  }

  saveProfile(): void {
    // Ici, ajouter la logique pour sauvegarder les modifications
    this.isEditing = false;
    this.originalData = { ...this.userData };
    console.log("user", this.originalData);
    this.assureService.updateAssurer(this.userData).subscribe({
      next: (data) => {
        console.log('Profil mis à jour avec succès:', data);
      },
      error: (err) => {
        console.error('Erreur lors de la mise à jour du profil:', err);
      }
    });
  }

  cancelEdit(): void {
    this.userData = { ...this.originalData };
    this.isEditing = false;
  }
}