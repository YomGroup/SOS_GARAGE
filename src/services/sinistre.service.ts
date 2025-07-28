import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../environments/environment';


@Injectable({
    providedIn: 'root'
})
export class SinistreService {
    private apiUrl = `${environment.apiUrl}/sinistre`;
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
