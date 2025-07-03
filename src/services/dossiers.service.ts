import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

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

  updateStatutSinistre(id: number, statut: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, { statut });
  }
} 