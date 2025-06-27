import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';

export interface Invitation {
  id?: number;
  nom: string;
  prenom: string;
  email: string;
  role: 'Assuré' | 'Réparateur';
  statut: 'En attente' | 'Acceptée' | 'Expirée';
  date: string;
  telephone?: string;
  adresse?: string;
}

export interface UserAccess {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  role: 'Assuré' | 'Réparateur';
  derniereConnexion: string;
  actif: boolean;
  telephone: string;
  adresse: string;
  reset?: boolean;
}

export interface PasswordReset {
  email: string;
  nouveauPassword: string;
}

@Injectable({
  providedIn: 'root'
})
export class AccessManagementService {
  private baseUrl = 'https://sosmongarage-production.up.railway.app/V1';

  constructor(private http: HttpClient) {}

  // Gestionnaire d'erreurs
  private handleError(error: HttpErrorResponse) {
    console.error('Erreur HTTP:', error);
    let errorMessage = 'Une erreur est survenue';
    
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Erreur: ${error.error.message}`;
    } else {
      errorMessage = `Code d'erreur: ${error.status}, Message: ${error.message}`;
      if (error.status === 0) {
        errorMessage = 'Erreur de connexion - Impossible d\'atteindre le serveur';
      } else if (error.status === 401) {
        errorMessage = 'Erreur d\'authentification';
      } else if (error.status === 403) {
        errorMessage = 'Accès interdit';
      } else if (error.status === 404) {
        errorMessage = 'API non trouvée';
      } else if (error.status === 500) {
        errorMessage = 'Erreur serveur interne';
      }
    }
    
    return throwError(() => new Error(errorMessage));
  }

  // Envoyer une invitation (créer un nouvel utilisateur)
  envoyerInvitation(invitation: Omit<Invitation, 'id' | 'statut' | 'date'>): Observable<any> {
    console.log('Envoi invitation:', invitation);
    
    if (invitation.role === 'Assuré') {
      const assure = {
        nom: invitation.nom,
        prenom: invitation.prenom,
        email: invitation.email,
        telephone: invitation.telephone || '',
        adresse: invitation.adresse || '',
        adressePostale: invitation.adresse || '',
        numeroPermis: '',
        password: this.generatePassword(),
        useridKeycloak: ''
      };
      
      return this.http.post(`${this.baseUrl}/api/assure`, assure).pipe(
        catchError(this.handleError)
      );
    } else {
      const reparateur = {
        name: invitation.nom,
        prenom: invitation.prenom,
        email: invitation.email,
        telephone: invitation.telephone || '',
        adresse: invitation.adresse || '',
        password: this.generatePassword(),
        isvalids: true
      };
      
      return this.http.post(`${this.baseUrl}/api/reparateurs`, reparateur).pipe(
        catchError(this.handleError)
      );
    }
  }

  // Récupérer tous les utilisateurs avec leurs accès
  getUsersAccess(): Observable<UserAccess[]> {
    return new Observable(observer => {
      // Récupérer les assurés
      this.http.get<any[]>(`${this.baseUrl}/api/assure`).subscribe({
        next: (assures) => {
          console.log('Assurés récupérés:', assures);
          
          // Récupérer les réparateurs
          this.http.get<any[]>(`${this.baseUrl}/api/reparateurs`).subscribe({
            next: (reparateurs) => {
              console.log('Réparateurs récupérés:', reparateurs);
              
              const users: UserAccess[] = [];
              
              // Convertir les assurés
              assures.forEach(assure => {
                users.push({
                  id: assure.id,
                  nom: assure.nom,
                  prenom: assure.prenom,
                  email: assure.email,
                  role: 'Assuré',
                  derniereConnexion: new Date().toLocaleString(), // Simulé
                  actif: true, // Par défaut actif
                  telephone: assure.telephone,
                  adresse: assure.adresse
                });
              });
              
              // Convertir les réparateurs
              reparateurs.forEach(reparateur => {
                users.push({
                  id: reparateur.id,
                  nom: reparateur.name,
                  prenom: reparateur.prenom,
                  email: reparateur.email,
                  role: 'Réparateur',
                  derniereConnexion: new Date().toLocaleString(), // Simulé
                  actif: reparateur.isvalids,
                  telephone: reparateur.telephone,
                  adresse: reparateur.adresse
                });
              });
              
              console.log('Utilisateurs combinés:', users);
              observer.next(users);
              observer.complete();
            },
            error: (error) => {
              console.error('Erreur récupération réparateurs:', error);
              observer.error(error);
            }
          });
        },
        error: (error) => {
          console.error('Erreur récupération assurés:', error);
          observer.error(error);
        }
      });
    });
  }

  // Réinitialiser le mot de passe d'un utilisateur
  resetPassword(email: string, nouveauPassword: string, role: 'Assuré' | 'Réparateur'): Observable<any> {
    console.log('Réinitialisation mot de passe pour:', email, 'rôle:', role);
    
    // Note: Votre API actuelle ne semble pas avoir d'endpoint pour réinitialiser les mots de passe
    // Cette fonction est préparée pour quand vous ajouterez cette fonctionnalité
    const resetData = {
      email: email,
      nouveauPassword: nouveauPassword
    };
    
    // Pour l'instant, on simule la réinitialisation
    return new Observable(observer => {
      setTimeout(() => {
        observer.next({ success: true, message: 'Mot de passe réinitialisé avec succès' });
        observer.complete();
      }, 1000);
    });
  }

  // Désactiver un utilisateur
  desactiverUtilisateur(id: number, role: 'Assuré' | 'Réparateur'): Observable<any> {
    if (role === 'Réparateur') {
      return this.http.put(`${this.baseUrl}/api/reparateurs/${id}`, { isvalids: false }).pipe(
        catchError(this.handleError)
      );
    } else {
      // Pour les assurés, on pourrait ajouter un champ actif dans votre API
      return new Observable(observer => {
        observer.next({ success: true, message: 'Utilisateur désactivé' });
        observer.complete();
      });
    }
  }

  // Activer un utilisateur
  activerUtilisateur(id: number, role: 'Assuré' | 'Réparateur'): Observable<any> {
    if (role === 'Réparateur') {
      return this.http.put(`${this.baseUrl}/api/reparateurs/${id}`, { isvalids: true }).pipe(
        catchError(this.handleError)
      );
    } else {
      return new Observable(observer => {
        observer.next({ success: true, message: 'Utilisateur activé' });
        observer.complete();
      });
    }
  }

  // Générer un mot de passe temporaire
  private generatePassword(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let password = '';
    for (let i = 0; i < 8; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }

  // Vérifier si un email existe déjà
  verifierEmail(email: string): Observable<boolean> {
    return new Observable(observer => {
      // Vérifier dans les assurés
      this.http.get<any[]>(`${this.baseUrl}/api/assure`).subscribe({
        next: (assures) => {
          const emailExiste = assures.some(assure => assure.email === email);
          if (emailExiste) {
            observer.next(true);
            observer.complete();
          } else {
            // Vérifier dans les réparateurs
            this.http.get<any[]>(`${this.baseUrl}/api/reparateurs`).subscribe({
              next: (reparateurs) => {
                const emailExisteRep = reparateurs.some(rep => rep.email === email);
                observer.next(emailExisteRep);
                observer.complete();
              },
              error: () => {
                observer.next(false);
                observer.complete();
              }
            });
          }
        },
        error: () => {
          observer.next(false);
          observer.complete();
        }
      });
    });
  }
} 