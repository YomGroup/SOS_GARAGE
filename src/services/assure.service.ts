import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, from, switchMap } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../environments/environment';
import { get } from 'http';
import { AuthService } from './auth.service';

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
    dateObtentionPermis:Date;
}

@Injectable({
    providedIn: 'root'
})
export class AssureService {
    private apiUrl = `${environment.apiUrl}/assure`;
    private apiUrlAdd = `${environment.apiUrl}/assure`;

    private http = inject(HttpClient);
    private authService = inject(AuthService); 

    private token: string | null = null;


    private async loadToken(): Promise<void> {
        if (!this.token) {
            this.token = await this.authService.getKeycloakInstance();
        }
    }


    addAssurerGet(id: number) {
        return from(this.loadToken()).pipe(
            switchMap(()=>{
            const headers = new HttpHeaders({
               'Authorization': `Bearer ${this.token}`
            });

            return this.http.get<ASSURE>(`${this.apiUrl}/${id}`,{headers});
            })
        )
    }

    // Récupérer l'assuré par l'ID du sinistre
    getAssureBySinistreId(sinistreId: number) {

        return from(this.loadToken())

        return this.http.get<ASSURE>(`${this.apiUrl}/assure/${sinistreId}`);
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
        return this.http.get(`${environment.apiUrl}/assure/keycloak/${id}`);
    }
    getAssurer(id: string) {
        return this.http.get(`${environment.apiUrl}/assure/${id}`);
    }
    getAllAssures() {
        return this.http.get<ASSURE[]>(`${this.apiUrl}`);
    }
    updateAssurer(assure: ASSURE) {
         const { id,password, ...assureSansId } = assure;
         console.log({assure});
         return this.http.put<ASSURE>(`${this.apiUrl}/${assure.id}`, assureSansId);
    }
}
