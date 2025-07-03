import { inject, Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { HttpClient } from '@angular/common/http';

export interface Vehicule {
  id: number;
  immatriculation: string;
  marque: string;
  modele: string;
  cylindree: string;
  dateMiseEnCirculation: string;
  carteGrise: string;
  contratAssurance: string;
  imgUrl: string[];
  sinistres: any[];
}

export interface ASSURE {
  id: number;
  createdAt: string | null;
  updatedAt: string | null;
  name: string;
  prenom: string;
  email: string;
  telephone: string;
  adresse: string;
  password: string;
  useridKeycloak: string;
  numeroPermis: string;
  vehicules: Vehicule[];
  messages: any[];
}

@Injectable({
    providedIn: 'root'
})
export class AssureService {
    private apiUrl = 'https://sosmongarage-production.up.railway.app/V1/api/assure/assure';

    private http = inject(HttpClient);

    addAssurerGet(id: number) {
        return this.http.get<ASSURE>(`${this.apiUrl}/${id}`);
    }

    // Récupérer l'assuré par l'ID du sinistre
    getAssureBySinistreId(sinistreId: number) {
        return this.http.get<ASSURE>(`${this.apiUrl}/${sinistreId}`);
    }

    // Récupérer le véhicule correspondant à un sinistre
    getVehiculeBySinistreId(assure: ASSURE, sinistreId: number): Vehicule | null {
        if (!assure.vehicules) return null;
        
        for (const vehicule of assure.vehicules) {
            if (vehicule.sinistres && vehicule.sinistres.some(s => s.id === sinistreId)) {
                return vehicule;
            }
        }
        return null;
    }
}
