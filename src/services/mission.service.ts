import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, forkJoin } from 'rxjs';
import { switchMap, map, catchError } from 'rxjs/operators';
import { Mission, Assure, Vehicule , Sinistre, Reparateur, DocumentsSinistre, Notification, Avantage, Reparation, Message} from './models-api.interface';




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

  // Nouvelle méthode pour récupérer l'assuré par l'ID du sinistre
  getAssureBySinistreId(sinistreId: number): Observable<Assure> {
    return this.http.get<Assure>(`${this.apiUrl}/assure/assure/${sinistreId}`);
  }

  // Méthode pour récupérer le nom de l'assureur à partir d'une mission (version optimisée)
  getAssureurNameFromMission(mission: Mission): Observable<string> {
    if (!mission.sinistre || mission.sinistre.id == null) {
      return of('Nom de l\'assureur non disponible');
    }

    return this.getAssureBySinistreId(mission.sinistre.id).pipe(
      map(assure => `${assure.name} ${assure.prenom}`),
      catchError(() => of('Nom de l\'assureur non disponible'))
    );
  }

  // Méthode pour créer une nouvelle mission
  createMission(mission: Omit<Mission, 'id' | 'createdAt' | 'updatedAt'>): Observable<Mission> {
    return this.http.post<Mission>(`${this.apiUrl}/missions`, mission);
  }

  updateMission(id: number, mission: Partial<Mission>) {
    return this.http.put<Mission>(`${this.apiUrl}/missions/${id}`, mission);
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
} 