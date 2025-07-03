import { inject, Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { Reparateur } from './models-api.interface';

@Injectable({
    providedIn: 'root'
})
export class ReparateurService {
    private apiUrl = 'https://sosmongarage-production.up.railway.app/V1/api/reparateurs/{id}';

    private http = inject(HttpClient);

    getReparateur(id: number) {
        return this.http.get<Reparateur>(this.apiUrl.replace('{id}', id.toString()));
    }


    getAllReparateurs() {
        return this.http.get<Reparateur[]>('https://sosmongarage-production.up.railway.app/V1/api/reparateurs');
    }

    createReparateur(reparateur: Omit<Reparateur, 'id'>) {
        return this.http.post<Reparateur>('https://sosmongarage-production.up.railway.app/V1/api/reparateurs', reparateur);
    }

    updateReparateur(id: number, reparateur: Partial<Reparateur>) {
        return this.http.put<Reparateur>(this.apiUrl.replace('{id}', id.toString()), reparateur);
    }

    deleteReparateur(id: number) {
        return this.http.delete(this.apiUrl.replace('{id}', id.toString()));
    }

    getReparateurByKeycloakId(useridKeycloak: string) {
        return this.http.get<Reparateur>(`https://sosmongarage-production.up.railway.app/V1/api/reparateurs/keycloak/${useridKeycloak}`);
    }
}
