import { inject, Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { HttpClient } from '@angular/common/http';

export interface Vehicle {
    id: string;
    name: string;
    modele: string;
    year: number;
    plateNumber: string;
    status: 'active' | 'inactive';
    immatriculation?: string;
    dateMiseEnCirculation?: string;
    marque?: string;
    cylindree?: string;
    carteGrise?: string;
    contratAssurance?: string;
    assure?: number;
    imageUrl?: string;
}

export interface Claim {
    id: string;
    vehicleId: string;
    vehicleName: string;
    date: string;
    status: 'pending' | 'in-progress' | 'closed';
    description: string;
    timeline: TimelineEvent[];
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
    private vehiclesSubject = new BehaviorSubject<Vehicle[]>([
        {
            id: '1',
            name: 'Mercedes AMG',
            modele: 'AMG GT',
            year: 2020,
            plateNumber: 'ABC-123',
            status: 'active'
        }
    ]);

    private claimsSubject = new BehaviorSubject<Claim[]>([
        {
            id: 'SIN-001',
            vehicleId: '1',
            vehicleName: 'Mercedes AMG - 15 Mai 2020',
            date: '15 Mai 2020',
            status: 'closed',
            description: 'Accident de circulation',
            timeline: [
                { time: 'Il y\'a 30 mn', message: 'Le sinistre-001 à été traité avec succès' },
                { time: 'Il y\'a 39 mn', message: 'Documents a signé pour le sinistre-001' }
            ]
        }
    ]);

    vehicles$ = this.vehiclesSubject.asObservable();
    claims$ = this.claimsSubject.asObservable();

    getVehicles() {
        return this.vehiclesSubject.value;
    }

    getClaims() {
        return this.claimsSubject.value;
    }

    addClaim(claim: Omit<Claim, 'id'>) {
        const claims = this.claimsSubject.value;
        const newClaim: Claim = {
            ...claim,
            id: `SIN-${String(claims.length + 1).padStart(3, '0')}`
        };
        this.claimsSubject.next([...claims, newClaim]);
    }
    getAllVehiculesPost(body: any = {}) {
        return this.http.get(this.apiUrl, body);
    }
    getVehiculesData(immatriculation: string) {
        const url = `${this.apiUrlData}/scraper/${encodeURIComponent(immatriculation)}`;
        return this.http.get(url);
    }


    addVehiculesPost(body: any = {}) {
        return this.http.post(this.apiUrlAdd, body);
    }
    updateVehiculesPost(id: number, body: any) {
        return this.http.put(`${this.apiUrlAdd}/${id}`, body);
    }

    deleteVehiculesPost(id: number) {
        return this.http.delete(`${this.apiUrlAdd}/${id}`);
    }

}
