import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, tap, switchMap } from 'rxjs/operators';
import { Vehicule, Assure, Expert } from './models-api.interface';

export interface Dossier {
  id: number;
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
  imgUrl: string[];
  isvalid: boolean;
  dateCreation: Date;
  assurance: "AXA";
  dateSinistre: Date;
  lieuSinistre: string;
  contact: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  expert?: Expert;
}


@Injectable({
  providedIn: 'root'
})
export class DossiersService {
  private apiUrl = 'https://sosmongarage-production.up.railway.app/V1/api/sinistre';

  constructor(private http: HttpClient) {}

  getDossiers(): Observable<Dossier[]> {
    return this.http.get<Dossier[]>(this.apiUrl);
  }

  getSinistreById(id: number): Observable<Dossier> {
    return this.http.get<Dossier>(`${this.apiUrl}/${id}`);
  }

  getVehiculeFromSinistreId(sinistreId: number): Observable<Vehicule | null> {
    return this.getSinistreById(sinistreId).pipe(
      switchMap(sinistre => {
        return this.http.get<Vehicule[]>(`${this.apiUrl.replace('/sinistre', '/vehicule/all')}`).pipe(
          map(vehicules => {
            const vehicule = vehicules.find(v => 
              v.sinistres && v.sinistres.some(s => s.id === sinistreId)
            );
            return vehicule || null;
          })
        );
      })
    );
  }

  getAssureFromSinistreId(sinistreId: number): Observable<Assure> {
    return this.http.get<Assure>(`https://sosmongarage-production.up.railway.app/V1/api/assure/assure/${sinistreId}`);
  }

  updateStatutSinistre(id: number, statut: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${id}`, { statut });
  }

  updateDossier(id: number, data: any): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${id}`, data);
  }

  getVehiculeBySinistreId(sinistreId: number): Observable<Vehicule> {
    return this.http.get<Vehicule>(`${this.apiUrl}/${sinistreId}/vehicule`);
  }

  getVehiculeById(vehiculeId: number): Observable<Vehicule> {
    return this.http.get<Vehicule>(`${this.apiUrl}/vehicules/${vehiculeId}`);
  }

  // Supprimer un dossier 
  deleteDossier(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
} 