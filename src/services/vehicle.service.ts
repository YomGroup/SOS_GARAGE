import { inject, Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { HttpClient } from '@angular/common/http';

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

    getAllVehiculesPost(body: any = {}) {
        return this.http.get(this.apiUrl, body);
    }
    getVehiculesData(immatriculation: string) {
        const url = `${this.apiUrlData}/scraper/${encodeURIComponent(immatriculation)}`;
        return this.http.get(url);
    }
    getVehiculesDataById(id: number) {
        return this.http.get(`${this.apiUrlAdd}/assure/${id}`);
    }

    addVehiculesPost(body: any = {}) {
        return this.http.post(this.apiUrlAdd, body);
    }
    updateVehiculesPost(id: number, body: any) {
        return this.http.put(`${this.apiUrlAdd}/${id}`, body);
    }

    deleteVehiculesPost(id: number) {
        return this.http.delete(`${this.apiUrlAdd}?id=${id}`);
    }


}
