import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AccessManagementService, Invitation, UserAccess } from '../../../../../services/access-management.service';

@Component({
  selector: 'app-access-management',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './access-management.component.html',
  styleUrls: ['./access-management.component.css']
})
export class AccessManagementComponent implements OnInit {
  invitation: Partial<Invitation> = {};
  invitations: Invitation[] = [];
  utilisateurs: UserAccess[] = [];
  isLoading = false;
  errorMessage = '';
  successMessage = '';

  // Formulaire d'invitation
  invitationForm: FormGroup;

  constructor(
    private accessManagementService: AccessManagementService,
    private fb: FormBuilder
  ) {
    this.invitationForm = this.fb.group({
      nom: ['', Validators.required],
      prenom: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      role: ['', Validators.required],
      telephone: [''],
      adresse: ['']
    });
  }

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.isLoading = true;
    this.errorMessage = '';
    
    // Charger les utilisateurs existants
    this.accessManagementService.getUsersAccess().subscribe({
      next: (users) => {
        console.log('Utilisateurs chargés:', users);
        this.utilisateurs = users.map(user => ({
          id: user.id,
          nom: user.nom,
          prenom: user.prenom,
          email: user.email,
          role: user.role,
          derniereConnexion: new Date().toLocaleString(), // Simulé pour l'instant
          actif: user.actif || true,
          telephone: user.telephone || '',
          adresse: user.adresse || '',
          reset: false
        }));
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des utilisateurs:', error);
        this.errorMessage = 'Erreur lors du chargement des utilisateurs';
        this.isLoading = false;
      }
    });
  }

  envoyerInvitation(): void {
    if (this.invitationForm.valid) {
      const formValue = this.invitationForm.value;
      
      console.log('Envoi invitation:', formValue);
      
      this.accessManagementService.envoyerInvitation(formValue).subscribe({
        next: (response) => {
          console.log('Invitation envoyée avec succès:', response);
          this.successMessage = 'Utilisateur créé avec succès ! Un mot de passe temporaire a été généré.';
          
          // Ajouter à la liste des invitations
          this.invitations.unshift({
            nom: formValue.nom,
            prenom: formValue.prenom,
            email: formValue.email,
            role: formValue.role,
            statut: 'En attente',
            date: new Date().toISOString().slice(0, 10),
            telephone: formValue.telephone,
            adresse: formValue.adresse
          });
          
          // Recharger les utilisateurs
          this.loadUsers();
          
          // Réinitialiser le formulaire
          this.invitationForm.reset();
          this.invitationForm.patchValue({
            role: 'Assuré' // Valeur par défaut
          });
          
          // Masquer le message de succès après 3 secondes
          setTimeout(() => {
            this.successMessage = '';
          }, 3000);
        },
        error: (error) => {
          console.error('Erreur lors de l\'envoi de l\'invitation:', error);
          this.errorMessage = `Erreur lors de la création: ${error.message}`;
          
          // Masquer le message d'erreur après 5 secondes
          setTimeout(() => {
            this.errorMessage = '';
          }, 5000);
        }
      });
    } else {
      this.errorMessage = 'Veuillez remplir tous les champs obligatoires';
      setTimeout(() => {
        this.errorMessage = '';
      }, 3000);
    }
  }

  resetPassword(user: UserAccess): void {
    const nouveauPassword = this.generatePassword();
    
    console.log('Réinitialisation mot de passe pour:', user.email);
    
    this.accessManagementService.resetPassword(user.email, nouveauPassword, user.role).subscribe({
      next: (response) => {
        console.log('Mot de passe réinitialisé:', response);
        user.reset = true;
        
        // Afficher le nouveau mot de passe (en production, il faudrait l'envoyer par email)
        alert(`Nouveau mot de passe pour ${user.email}: ${nouveauPassword}`);
        
        setTimeout(() => {
          user.reset = false;
        }, 2000);
      },
      error: (error) => {
        console.error('Erreur lors de la réinitialisation:', error);
        alert('Erreur lors de la réinitialisation du mot de passe');
      }
    });
  }

  toggleUserStatus(user: UserAccess): void {
    if (user.actif) {
      this.accessManagementService.desactiverUtilisateur(user.id, user.role).subscribe({
        next: (response) => {
          console.log('Utilisateur désactivé:', response);
          user.actif = false;
        },
        error: (error) => {
          console.error('Erreur lors de la désactivation:', error);
          alert('Erreur lors de la désactivation');
        }
      });
    } else {
      this.accessManagementService.activerUtilisateur(user.id, user.role).subscribe({
        next: (response) => {
          console.log('Utilisateur activé:', response);
          user.actif = true;
        },
        error: (error) => {
          console.error('Erreur lors de l\'activation:', error);
          alert('Erreur lors de l\'activation');
        }
      });
    }
  }

  private generatePassword(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let password = '';
    for (let i = 0; i < 8; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }
} 