import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { map, switchMap, shareReplay } from 'rxjs/operators';
import { Vehicule, Assure, Expert } from './models-api.interface';
import { environment } from '../environments/environment';

export interface Dossier {
  id: number;
  createdAt: string;
  type: string;
  contactAssistance: string;
  lienConstat: string;
  conditionsAcceptees: boolean;
  documents: any[];
  notifications: any[];
  vehicule: any;
  statut?: string;
  nomDuGarage?: string;
  ville?: string;
  servicePropose?: string[];
  imgUrl?: string[];
  isvalid: boolean;
  dateCreation: Date;
  assurance: "AXA";
  dateSinistre: Date;
  lieu: string;
  contact: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  expert?: Expert;
  input?: string;
}

export interface PaginatedResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  empty: boolean;
}


@Injectable({
  providedIn: 'root'
})
export class DossiersService {
  private apiUrl = `${environment.apiUrl}/sinistre`;
  private allVehicules$: Observable<Vehicule[]>;
  private refreshVehicules$ = new BehaviorSubject<void>(undefined);

  constructor(private http: HttpClient) {
    console.log('voici le chargement de donnee dddddddddddddddd');
    this.allVehicules$ = this.refreshVehicules$.pipe(
      // The backend may return either an array or a paginated response { content: Vehicule[] }
      switchMap(() => this.http.get<any>(`${environment.apiUrl}/vehicule/all`).pipe(
        map((res: any) => Array.isArray(res) ? res as Vehicule[] : (res?.content || []) as Vehicule[])
      )),
      shareReplay(1)
    );

    console.log('test',this.allVehicules$);
  }

  public refreshVehiculesCache(): void {
    this.refreshVehicules$.next(undefined);
  }

  // Méthode avec pagination
  getDossiers(page: number = 0, size: number = 10): Observable<PaginatedResponse<Dossier>> {
    return this.http.get<PaginatedResponse<Dossier>>(`${this.apiUrl}/find_by_page?page=${page}&size=${size}`);
  }

  // Méthode sans pagination (pour compatibilité)
  getDossiersSimple(): Observable<Dossier[]> {
    return this.http.get<Dossier[]>(this.apiUrl);
  }

  getSinistreById(id: number): Observable<Dossier> {
    return this.http.get<Dossier>(`${this.apiUrl}/${id}`);
  }

  getVehiculeFromSinistreId(sinistreId: number): Observable<Vehicule | null> {
    return this.allVehicules$.pipe(
      map(vehicules => {
        const vehicule = vehicules.find(v => 
          v.sinistres && v.sinistres.some(s => s.id === sinistreId)
        );
        return vehicule || null;
      })
    );
  }

  getAssureFromSinistreId(sinistreId: number): Observable<Assure> {
    return this.http.get<Assure>(`${environment.apiUrl}/assure/assure/${sinistreId}`);
  }

  updateStatutSinistre(id: number, statut: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${id}`, { statut });
  }

  updateDossier(id: number, data: any): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${id}`, data);
  }

  getVehiculeBySinistreId(sinistreId: number): Observable<Vehicule> {
    // The backend does not expose a `/sinistre/{id}/vehicule` route. Use cached lookup instead.
    return this.getVehiculeFromSinistreId(sinistreId) as unknown as Observable<Vehicule>;
  }

  getVehiculeById(vehiculeId: number): Observable<Vehicule> {
    // Vehicle endpoint is under `/vehicules/{id}` at the API root
    return this.http.get<Vehicule>(`${environment.apiUrl}/vehicule/${vehiculeId}`);
  }

  // Supprimer un dossier 
  deleteDossier(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
} 