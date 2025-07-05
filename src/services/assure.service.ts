import { inject, Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { HttpClient } from '@angular/common/http';

export interface ASSURE {
    "id": 8,
    "nom": "daniel",
    "prenom": "dan",
    "email": "d@gmail.com",
    "telephone": "0761841819",
    "adressePostale": "d",
    "numeroPermis": "dk,",
    "adresse": "d",
}



@Injectable({
    providedIn: 'root'
})
export class AssureService {
    private apiUrl = 'https://sosmongarage-production.up.railway.app/V1/api/assure/{id}';
    private apiUrlAdd = 'https://sosmongarage-production.up.railway.app/V1/api/assure';

    private http = inject(HttpClient);


    addAssurerGet(id: number) {
        return this.http.get(this.apiUrl.replace('{id}', id.toString()));
    }
    getAssurerID(id: string) {
        return this.http.get(`https://sosmongarage-production.up.railway.app/V1/api/assure/keycloak/${id}`);
    }
}
