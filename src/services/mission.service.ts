import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, of, forkJoin, throwError } from 'rxjs';
import { switchMap, map, catchError } from 'rxjs/operators';
import { Mission, Assure, Vehicule , Sinistre, Reparateur, DocumentsSinistre, Notification, Avantage, Reparation, Message, MissionUpdate} from './models-api.interface';

@Injectable({
  providedIn: 'root'
})
export class MissionService {
  private apiUrl = 'https://sosmongarage-production.up.railway.app/V1/api';

  constructor(private http: HttpClient) { }

  getAllMissions(): Observable<Mission[]> {
    return this.http.get<Mission[]>(`${this.apiUrl}/missions`);
  }

  getAllMissionsByReparateur(reparateurId: number): Observable<Mission[]> {
    return this.http.get<Mission[]>(`${this.apiUrl}/reparateurs/${reparateurId}`);
  }

  getMissionsByReparateur(reparateurId: number): Observable<Mission[]> {
    return this.http.get<Mission[]>(`${this.apiUrl}/reparateurs/${reparateurId}`);
  }

  getMissionById(id: number): Observable<Mission> {
    return this.http.get<Mission>(`${this.apiUrl}/${id}`);
  }

  updateMissionStatus(id: number, statut: string): Observable<Mission> {
    return this.http.patch<Mission>(`${this.apiUrl}/${id}/statut`, { statut });
  }

  getAssureBySinistreId(sinistreId: number): Observable<Assure> {
    return this.http.get<Assure>(`${this.apiUrl}/assure/assure/${sinistreId}`);
  }

  getAssureurNameFromMission(mission: Mission): Observable<string> {
    if (!mission.sinistre || mission.sinistre.id == null) {
      return of('Nom de l\'assureur non disponible');
    }

    return this.getAssureBySinistreId(mission.sinistre.id).pipe(
      map(assure => `${assure.name} ${assure.prenom}`),
      catchError(() => of('Nom de l\'assureur non disponible'))
    );
  }

  createMission(mission: Omit<Mission, 'id' | 'createdAt' | 'updatedAt'>): Observable<Mission> {
    return this.http.post<Mission>(`${this.apiUrl}/missions`, mission);
  }

  updateMission(id: number, mission: MissionUpdate): Observable<Mission> {
    return this.http.patch<Mission>(`${this.apiUrl}/missions/${id}`, mission).pipe(
      catchError(this.handleError)
    );
  }

  getVehiculeByMissionId(missionId: number): Observable<Vehicule> {
    return this.http.get<Vehicule>(`${this.apiUrl}/missions/${missionId}/vehicule`);
  }

  updateMissionReparateur(id: number, reparateur: Reparateur) {
    return this.http.patch<Mission>(`${this.apiUrl}/missions/${id}`, { reparateur: reparateur.id });
  }

  updateMissionPartial(id: number, data: Partial<Mission>) {
    return this.http.patch<Mission>(`${this.apiUrl}/missions/${id}`, data);
  }

  private handleError(error: HttpErrorResponse) {
    console.error('Erreur API:', error);
    
    let errorMessage = 'Une erreur est survenue';
    
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Erreur: ${error.error.message}`;
    } else {
      switch (error.status) {
        case 400:
          errorMessage = 'Données invalides';
          break;
        case 401:
          errorMessage = 'Non autorisé';
          break;
        case 403:
          errorMessage = 'Accès interdit';
          break;
        case 404:
          errorMessage = 'Mission non trouvée';
          break;
        case 500:
          errorMessage = 'Erreur serveur';
          break;
        default:
          errorMessage = `Erreur ${error.status}: ${error.message}`;
      }
    }
    
    return throwError(() => new Error(errorMessage));
  }
} 