import { inject, Injectable, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, map, Observable, tap } from 'rxjs';
import { environment } from '../environments/environment';
import { AuthService } from './auth.service';

export interface Vehicle {
    id: string;
    name?: string;
    modele?: string;
    year?: number;
    plateNumber?: string;
    immatriculation?: string;
    dateMiseEnCirculation?: string;
    marque?: string;
    cylindree?: string;
    carteGrise?: string;
    contratAssurance?: string;
    assure?: number;
    imgUrl?: string;
    nomAssurence?: string;
    typeAssurence?: string;
    etatvehicule?: string; // ou false par défaut si tu préfères
    dateDerniereCg?: string;
    energie?: string;
    nomCommerciale?: string;
    puissanceChevaux?: string;
    puissanceFiscale?: string;
    boiteVitesse?: string;
    typeMine?: string;
    version?: string;
}


export interface TimelineEvent {
    time: string;
    message: string;
}

@Injectable({
    providedIn: 'root'
})
export class VehicleService implements OnInit {
    private apiUrl = `${environment.apiUrlLocale}/vehicule/all`;
    private api = `${environment.apiUrlLocale}/vehicule`;

    token = '';
    private apiUrlAdd = `${environment.apiUrlLocale}/vehicule`;
    private apiUrlData = `${environment.apiUrlLocale}/vehicule`;
    private http = inject(HttpClient);
    private vehiculesSubject = new BehaviorSubject<any[]>([]);
    vehicules$ = this.vehiculesSubject.asObservable();
    private authService = inject(AuthService);


    ngOnInit(): void {
        this.authService.getKeycloakInstance().then(token => {
            this.token = token;
            console.log('Token set in VehicleService:', this.token);
        });
    }
    async loadToken(): Promise<void> {
        if (!this.token) {
            this.token = await this.authService.getKeycloakInstance();
        }
    }

    getAllVehiculesPost(body: any = {}): Observable<any> {
        const headers = new HttpHeaders({
            'Authorization': `Bearer ${this.token}`,
            'Content-Type': 'application/json'
        });

        return this.http.get<any>(this.apiUrl, { headers, params: body }).pipe(
            map(response => response.content) // récupère uniquement la liste des véhicules
        );
    }
    async getVehiculesData(immatriculation: string) {
        await this.loadToken(); // garantit que le token est chargé avant l’appel

        const url = `${this.apiUrlData}/scraper/${encodeURIComponent(immatriculation)}`;
        const headers = new HttpHeaders({
            'Authorization': `Bearer ${this.token}`
        });

        return this.http.get(url, { headers });
    }


    async getVehiculesMatricule(immatriculation: string) {
        await this.loadToken();

        const url = `${this.apiUrlData}/matricule/${encodeURIComponent(immatriculation)}`;
        const headers = new HttpHeaders({
            'Authorization': `Bearer ${this.token}`
        });

        return this.http.get(url, { headers });
    }

    async getVehiculesDataById(id: number) {
        await this.loadToken();

        const headers = new HttpHeaders({
            'Authorization': `Bearer ${this.token}`
        });

        return this.http.get<Vehicle[]>(`${this.apiUrlAdd}/assure/${id}`, { headers }).pipe(
            tap(data => this.vehiculesSubject.next(data))
        );
    }

    async refreshVehicules(id: number) {
        (await this.getVehiculesDataById(id)).subscribe((vehicles) => {
            this.vehiculesSubject.next(vehicles);
        });
    }

    async addVehiculesPost(body: any = {}) {
        await this.loadToken();

        const headers = new HttpHeaders({
            'Authorization': `Bearer ${this.token}`,
            'Content-Type': 'application/json'
        });

        return this.http.post(this.apiUrlAdd, body, { headers });
    }

    async updateVehiculesPost(id: number, body: any) {
        await this.loadToken();

        const headers = new HttpHeaders({
            'Authorization': `Bearer ${this.token}`,
            'Content-Type': 'application/json'
        });

        return this.http.put(`${this.apiUrlAdd}/${id}`, body, { headers });
    }

    listAssuranceVehicules(body: any = {}) {
        return this.http.get(`${this.api}/listeAssurance`, {
            headers: {
                Authorization: `Bearer ${this.token}`
            }
        });
        //return this.http.get(`${this.api}/listeAssurance`);
    }
    listAssuranceVehiculesNumero(token: any) {
        return this.http.get(`${this.api}/listeAssurance`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
    }
    async deleteVehiculesPost(id: number) {
        await this.loadToken();

        const headers = new HttpHeaders({
            'Authorization': `Bearer ${this.token}`
        });

        return this.http.delete(`${this.apiUrlAdd}?id=${id}`, { headers });
    }


    getVehiculesPage(page: number, limit: number) {
        return this.http.get(`${this.apiUrl}?page=${page}&limit=${limit}`);
    }

}
