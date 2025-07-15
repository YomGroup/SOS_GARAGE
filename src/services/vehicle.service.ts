import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, tap } from 'rxjs';

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

}


export interface TimelineEvent {
    time: string;
    message: string;
}

@Injectable({
    providedIn: 'root'
})
export class VehicleService {
    private apiUrl = 'https://sosmongarage-production.up.railway.app/V1/api/vehicule/all';

    private apiUrlAdd = 'https://sosmongarage-production.up.railway.app/V1/api/vehicule';
    private apiUrlData = 'https://sosmongarage-production.up.railway.app/V1/api/vehicule';
    private http = inject(HttpClient);
    private vehiculesSubject = new BehaviorSubject<Vehicle[]>([]);
    vehicules$ = this.vehiculesSubject.asObservable();

    getAllVehiculesPost(body: any = {}) {
        return this.http.get(this.apiUrl, body);
    }
    getVehiculesData(immatriculation: string) {
        const url = `${this.apiUrlData}/scraper/${encodeURIComponent(immatriculation)}`;
        return this.http.get(url);
    }
    getVehiculesDataById(id: number) {
        return this.http.get<Vehicle[]>(`${this.apiUrlAdd}/assure/${id}`).pipe(
            tap(data => this.vehiculesSubject.next(data))
        );
    }

    refreshVehicules(id: number) {
        this.getVehiculesDataById(id).subscribe(); // met à jour le BehaviorSubject
    }


    addVehiculesPost(body: any = {}) {
        return this.http.post(this.apiUrlAdd, body);
    }
    updateVehiculesPost(id: number, body: any) {
        return this.http.put(`${this.apiUrlAdd}/${id}`, body);
    }
    listAssuranceVehicules(body: any = {}) {
        return this.http.get(`${this.apiUrlAdd}/listeAssurance`);
    }
    deleteVehiculesPost(id: number) {
        return this.http.delete(`${this.apiUrlAdd}?id=${id}`);
    }

    getVehiculesPage(page: number, limit: number) {
        return this.http.get(`${this.apiUrl}?page=${page}&limit=${limit}`);
    }

}
