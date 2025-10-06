// admin.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

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

  interface Vehicule {
    id: number;
    immatriculation: string;
    marque: string;
    modele: string;
    cylindree: string;
    dateMiseEnCirculation: string;
    carteGrise: string;
    contratAssurance: string;
    assure: number;
    imgUrl: string[];
    nomAssurence: string;
    typeAssurence: string;
    dateDerniereCg: string;
    energie: string;
    nomCommerciale: string;
    puissanceChevaux: string;
    puissanceFiscale: string;
    boiteVitesse: string;
    typeMine: string;
    version: string;
  }

  interface PaginatedResponse<T> {
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
export class AdminService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  // Méthode pour récupérer tous les véhicules avec pagination
  getAllVehicules(page: number = 0, size: number = 10): Observable<PaginatedResponse<Vehicule>> {
    return this.http.get<PaginatedResponse<Vehicule>>(`${this.apiUrl}/vehicule/all?page=${page}&size=${size}`);
  }

  // Méthode pour récupérer tous les véhicules sans pagination (pour compatibilité)
  getAllVehiculesSimple(): Observable<Vehicule[]> {
    return this.http.get<Vehicule[]>(`${this.apiUrl}/vehicule/all`);
  }

  // get sinistre avec pagination
  getSinistre(page: number = 0, size: number = 10): Observable<PaginatedResponse<Sinistre>> {
    return this.http.get<PaginatedResponse<Sinistre>>(`${this.apiUrl}/sinistre/find_by_page?page=${page}&size=${size}`);
  }

  // get sinistre sans pagination (pour compatibilité)
  getSinistreSimple(): Observable<Sinistre[]> {
    return this.http.get<Sinistre[]>(`${this.apiUrl}/sinistre/find_by_page`);
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