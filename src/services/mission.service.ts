import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, of, forkJoin, throwError } from 'rxjs';
import { switchMap, map, catchError, tap, shareReplay } from 'rxjs/operators';
import { Mission, Assure, Vehicule , Sinistre, Reparateur, DocumentsSinistre, Notification, Avantage, Reparation, Message, MissionUpdate} from './models-api.interface';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class MissionService {
  private apiUrl = environment.apiUrl;
  // Simple in-memory caches with TTL
  private missionsCache?: { data: Mission[]; addedAt: number; ttl: number };
  private vehiculeByMissionCache = new Map<number, { data: Vehicule; addedAt: number; ttl: number }>();
  private vehiculeBySinistreCache = new Map<number, { data: Vehicule; addedAt: number; ttl: number }>();
  private assureBySinistreCache = new Map<number, { data: Assure; addedAt: number; ttl: number }>();
  private readonly ttlMissionsMs = 60_000; // 1 min
  private readonly ttlVehiculeMs = 180_000; // 3 min
  private readonly ttlAssureMs = 180_000; // 3 min

  constructor(private http: HttpClient) { }

  getAllMissions(): Observable<Mission[]> {
    const now = Date.now();
    if (this.missionsCache && now - this.missionsCache.addedAt < this.missionsCache.ttl) {
      return of(this.missionsCache.data);
    }
    return this.http.get<Mission[]>(`${this.apiUrl}/missions`).pipe(
      tap(data => (this.missionsCache = { data, addedAt: Date.now(), ttl: this.ttlMissionsMs })),
      shareReplay({ bufferSize: 1, refCount: true })
    );
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
    const cached = this.assureBySinistreCache.get(sinistreId);
    const now = Date.now();
    if (cached && now - cached.addedAt < this.ttlAssureMs) {
      return of(cached.data);
    }
    return this.http.get<Assure>(`${this.apiUrl}/assure/assure/${sinistreId}`).pipe(
      tap(data => this.assureBySinistreCache.set(sinistreId, { data, addedAt: Date.now(), ttl: this.ttlAssureMs })),
      shareReplay({ bufferSize: 1, refCount: true })
    );
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
    const cached = this.vehiculeByMissionCache.get(missionId);
    const now = Date.now();
    if (cached && now - cached.addedAt < this.ttlVehiculeMs) {
      return of(cached.data);
    }
    return this.http.get<Vehicule>(`${this.apiUrl}/missions/${missionId}/vehicule`).pipe(
      tap(data => this.vehiculeByMissionCache.set(missionId, { data, addedAt: Date.now(), ttl: this.ttlVehiculeMs })),
      shareReplay({ bufferSize: 1, refCount: true })
    );
  }

  getVehiculeBySinistreId(sinistreId: number): Observable<Vehicule> {
    const cached = this.vehiculeBySinistreCache.get(sinistreId);
    const now = Date.now();
    if (cached && now - cached.addedAt < this.ttlVehiculeMs) {
      return of(cached.data);
    }
    return this.http.get<Vehicule>(`${this.apiUrl}/sinistre/${sinistreId}/vehicule`).pipe(
      tap(data => this.vehiculeBySinistreCache.set(sinistreId, { data, addedAt: Date.now(), ttl: this.ttlVehiculeMs })),
      shareReplay({ bufferSize: 1, refCount: true })
    );
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