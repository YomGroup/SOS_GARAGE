import { inject, Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { Reparateur } from './models-api.interface';
import { environment } from '../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class ReparateurService {
    private apiUrl = `${environment.apiUrl}/reparateurs/{id}`;

    private http = inject(HttpClient);

    getReparateur(id: number) {
        return this.http.get<Reparateur>(this.apiUrl.replace('{id}', id.toString()));
    }


    getAllReparateurs() {
        return this.http.get<Reparateur[]>(`${environment.apiUrl}/reparateurs`);
    }

    createReparateur(reparateur: Omit<Reparateur, 'id'>) {
        return this.http.post<Reparateur>(`${environment.apiUrl}/reparateurs`, reparateur);
    }

    updateReparateur(id: number, reparateur: Partial<Reparateur>) {
        return this.http.put<Reparateur>(this.apiUrl.replace('{id}', id.toString()), reparateur);
    }

    deleteReparateur(id: number) {
        return this.http.delete(this.apiUrl.replace('{id}', id.toString()));
    }

    getReparateurByKeycloakId(useridKeycloak: string) {
        return this.http.get<Reparateur>(`${environment.apiUrl}/reparateurs/keycloak/${useridKeycloak}`);
    }
}
