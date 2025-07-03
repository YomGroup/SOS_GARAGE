// admin.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

interface Reparateur {
    id: number;
    name: string;
    prenom: string;
    email: string;
    telephone: string;
    adresse: string;
    isvalids: boolean;
    missions: any[];
  }

  interface Sinistre {
  id: number;
  createdAt: Date | null;
  updatedAt: Date | null;
  type: string;
  contactAssistance: string;
  lienConstat: string;
  conditionsAcceptees: boolean;
  documents: any[];
  notifications: any[];
  imgUrl: string[];
  isvalid: boolean;
 
  }

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private apiUrl = 'https://sosmongarage-production.up.railway.app/V1/api';

  constructor(private http: HttpClient) { }

  getAllVehicules(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/vehicule/all`);
  }

  // get sinistre
  getSinistre(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/sinistre`);
  }




  // Méthode pour récupérer tous les réparateurs
  getAllReparateurs(): Observable<Reparateur[]> {
    return this.http.get<Reparateur[]>(`${this.apiUrl}/reparateurs`);
  }

  // Méthode pour valider un réparateur
  validateReparateur(id: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/reparateurs/${id}/validate`, {});
  }

  // Méthode pour rejeter un réparateur
  rejectReparateur(id: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/reparateurs/${id}/reject`, {});
  }

  // Méthode pour mettre à jour la commission
  updateCommission(id: number, commission: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/reparateurs/${id}/commission`, { commission });
  }
}