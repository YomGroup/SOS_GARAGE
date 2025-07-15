import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, forkJoin, map, catchError, throwError } from 'rxjs';

export interface Assure {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  adressePostale: string;
  numeroPermis: string;
  adresse: string;
  password: string;
  useridKeycloak: string;
}

export interface Reparateur {
  id: number;
  name: string;
  prenom: string;
  email: string;
  telephone: string;
  adresse: string;
  password: string;
  isvalids: boolean;
  missions?: any;
  useridKeycloak?: string;
}

export interface UserDisplay {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  adresse: string;
  role: 'Assuré' | 'Réparateur';
  actif: boolean;
  numeroPermis?: string;
  adressePostale?: string;
  useridKeycloak?: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserManagementService {
  private baseUrl = 'https://sosmongarage-production.up.railway.app/V1';
  private httpHeaders = new HttpHeaders({
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Access-Control-Allow-Origin': '*'
  });

  constructor(private http: HttpClient) {}

  // Gestionnaire d'erreurs
  private handleError(error: HttpErrorResponse) {
    console.error('Erreur HTTP:', error);
    let errorMessage = 'Une erreur est survenue';
    
    if (error.error instanceof ErrorEvent) {
      // Erreur côté client
      errorMessage = `Erreur: ${error.error.message}`;
    } else {
      // Erreur côté serveur
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

  // Récupérer tous les assurés
  getAssures(): Observable<Assure[]> {
    console.log('Appel API getAssures:', `${this.baseUrl}/api/assure`);
    return this.http.get<Assure[]>(`${this.baseUrl}/api/assure`).pipe(
      catchError(this.handleError)
    );
  }

  // Récupérer tous les réparateurs
  getReparateurs(): Observable<Reparateur[]> {
    console.log('Appel API getReparateurs:', `${this.baseUrl}/api/reparateurs`);
    return this.http.get<Reparateur[]>(`${this.baseUrl}/api/reparateurs`).pipe(
      catchError(this.handleError)
    );
  }

  // Récupérer tous les utilisateurs (assurés + réparateurs)
  getAllUsers(): Observable<UserDisplay[]> {
    console.log('Début getAllUsers');
    return forkJoin({
      assures: this.getAssures(),
      reparateurs: this.getReparateurs()
    }).pipe(
      map(({ assures, reparateurs }) => {
        console.log('Assurés reçus:', assures);
        console.log('Réparateurs reçus:', reparateurs);
        
        const users: UserDisplay[] = [];

        // Convertir les assurés
        if (assures && Array.isArray(assures)) {
          assures.forEach(assure => {
            users.push({
              id: assure.id,
              nom: assure.nom,
              prenom: assure.prenom,
              email: assure.email,
              telephone: assure.telephone,
              adresse: assure.adresse,
              role: 'Assuré',
              actif: true, // Par défaut actif
              numeroPermis: assure.numeroPermis,
              adressePostale: assure.adressePostale,
              useridKeycloak: assure.useridKeycloak
            });
          });
        }

        // Convertir les réparateurs
        if (reparateurs && Array.isArray(reparateurs)) {
          reparateurs.forEach((reparateur) => {
            users.push({
              id: reparateur.id, // Utiliser le vrai ID
              nom: reparateur.name,
              prenom: reparateur.prenom,
              email: reparateur.email,
              telephone: reparateur.telephone,
              adresse: reparateur.adresse,
              role: 'Réparateur',
              actif: reparateur.isvalids
            });
          });
        }

        console.log('Utilisateurs convertis:', users);
        return users;
      }),
      catchError(this.handleError)
    );
  }

  // Créer un nouvel assuré
  createAssure(assure: Omit<Assure, 'id'>): Observable<Assure> {
    return this.http.post<Assure>(`${this.baseUrl}/api/assure`, assure).pipe(
      catchError(this.handleError)
    );
  }

  // Créer un nouveau réparateur
  createReparateur(reparateur: Omit<Reparateur, 'id'>): Observable<Reparateur> {
    return this.http.post<Reparateur>(`${this.baseUrl}/api/reparateurs`, reparateur).pipe(
      catchError(this.handleError)
    );
  }

  // Mettre à jour un assuré
  updateAssure(id: number, assure: Partial<Assure>): Observable<Assure> {
    return this.http.put<Assure>(`${this.baseUrl}/api/assure/${id}`, assure).pipe(
      catchError(this.handleError)
    );
  }

  // Mettre à jour un réparateur
  updateReparateur(id: number, reparateur: Partial<Reparateur>): Observable<Reparateur> {
    return this.http.put<Reparateur>(`${this.baseUrl}/api/reparateurs/${id}`, reparateur).pipe(
      catchError(this.handleError)
    );
  }

  // Supprimer un assuré
  deleteAssure(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/api/assure/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  // Supprimer un réparateur
  deleteReparateur(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/api/reparateurs/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  // Activer/Désactiver un réparateur
  toggleReparateurStatus(id: number, isvalids: boolean): Observable<Reparateur> {
    return this.http.put<Reparateur>(`${this.baseUrl}/api/reparateurs/${id}`, { isvalids }).pipe(
      catchError(this.handleError)
    );
  }
} 