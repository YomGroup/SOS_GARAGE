import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';




@Injectable({
    providedIn: 'root'
})
export class SinistreService {
    private apiUrl = 'https://sosmongarage-production.up.railway.app/V1/api/sinistre';
    private http = inject(HttpClient);


    addSinistrePost(body: any) {
        return this.http.post(this.apiUrl, body, {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });
    }

    getsinistreGet(id: number) {
        return this.http.get(`${this.apiUrl}/assure/${id}`);
    }

}
