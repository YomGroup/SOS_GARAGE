import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpContext } from '@angular/common/http';
import { Observable, catchError, throwError, forkJoin, map } from 'rxjs';
import { environment } from '../../environments/environment';
import { CACHE_TTL } from '../core/interceptors/cache.interceptor';

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
  private baseUrl = environment.apiUrl;

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
        name: invitation.nom,
        prenom: invitation.prenom,
        email: invitation.email,
        telephone: invitation.telephone || '',
        adresse: invitation.adresse || '',
        adressePostale: invitation.adresse || '',
        numeroPermis: '',
        password: this.generatePassword(),
        useridKeycloak: ''
      };
      
      return this.http.post(`${this.baseUrl}/assure`, assure).pipe(
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
      
      return this.http.post(`${this.baseUrl}/reparateurs`, reparateur).pipe(
        catchError(this.handleError)
      );
    }
  }

  // Récupérer tous les utilisateurs avec leurs accès
  getUsersAccess(): Observable<UserAccess[]> {
    const ctx = new HttpContext().set(CACHE_TTL, 30_000);
    const assures$ = this.http.get<any[]>(`${this.baseUrl}/assure`, { context: ctx });
    const reparateurs$ = this.http.get<any[]>(`${this.baseUrl}/reparateurs`, { context: ctx });

    return forkJoin({ assures: assures$, reparateurs: reparateurs$ }).pipe(
      map(({ assures, reparateurs }: any) => {
        const users: UserAccess[] = [];

        if (Array.isArray(assures)) {
          for (const assure of assures) {
            users.push({
              id: assure.id,
              nom: assure.name,
              prenom: assure.prenom,
              email: assure.email,
              role: 'Assuré',
              derniereConnexion: assure.lastLoginAt ? new Date(assure.lastLoginAt).toLocaleString() : new Date().toLocaleString(),
              actif: true,
              telephone: assure.telephone,
              adresse: assure.adresse
            });
          }
        }

        // reparateurs may be an array or a paginated response
        const reparateursList: any[] = Array.isArray(reparateurs) ? reparateurs : (reparateurs?.content || []);
        for (const reparateur of reparateursList) {
          const rawValid = reparateur.isvalids ?? reparateur.isValids ?? reparateur.isValide ?? reparateur.isValid ?? reparateur.isvalid;
          let actif = false;
          if (typeof rawValid === 'boolean') actif = rawValid;
          else if (rawValid !== undefined && rawValid !== null) {
            const s = ('' + rawValid).toLowerCase();
            actif = s === 'true' || s === 'valide' || s.includes('valide');
          }

          users.push({
            id: reparateur.id,
            nom: reparateur.name,
            prenom: reparateur.prenom,
            email: reparateur.email,
            role: 'Réparateur',
            derniereConnexion: reparateur.lastLoginAt ? new Date(reparateur.lastLoginAt).toLocaleString() : new Date().toLocaleString(),
            actif: actif,
            telephone: reparateur.telephone,
            adresse: reparateur.adresse
          });
        }

        return users;
      }),
      catchError(this.handleError)
    );
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
      return this.http.put(`${this.baseUrl}/reparateurs/${id}`, { isvalids: false }).pipe(
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
      return this.http.put(`${this.baseUrl}/reparateurs/${id}`, { isvalids: true }).pipe(
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
      this.http.get<any[]>(`${this.baseUrl}/assure`).subscribe({
        next: (assures) => {
          const emailExiste = assures.some(assure => assure.email === email);
          if (emailExiste) {
            observer.next(true);
            observer.complete();
          } else {
            // Vérifier dans les réparateurs
            this.http.get<any[]>(`${this.baseUrl}/reparateurs`).subscribe({
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