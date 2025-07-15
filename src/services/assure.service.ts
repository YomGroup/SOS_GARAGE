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

// Cette interface décrit un assureur avec ses informations de base
// export interface ASSURE {
//     "id": 8, // Identifiant unique de l'assureur
//     "nom": "daniel", // Nom de l'assureur
//     "prenom": "dan", // Prénom de l'assureur
//     "email": "d@gmail.com", // Email de l'assureur
//     "telephone": "0761841819", // Numéro de téléphone de l'assureur
//     "adressePostale": "d", // Adresse postale de l'assureur
//     "numeroPermis": "dk,", // Numéro du permis de conduire de l'assureur
//     "adresse": "d", // Adresse de l'assureur
// }

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
    private apiUrl = 'https://sosmongarage-production.up.railway.app/V1/api/assure';
    private apiUrlAdd = 'https://sosmongarage-production.up.railway.app/V1/api/assure';

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
    getAssurerID(id: string) {
        return this.http.get(`https://sosmongarage-production.up.railway.app/V1/api/assure/keycloak/${id}`);
    }
}
