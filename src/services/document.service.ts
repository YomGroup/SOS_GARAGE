import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';




@Injectable({
    providedIn: 'root'
})
export class DocumentService {
    private apiUrl = 'https://sosmongarage-production.up.railway.app/V1/api/documentsSinistre';
    private http = inject(HttpClient);


    addDocumentPost(body: any) {
        return this.http.post(this.apiUrl, body);
    }

    getsinistreGet(id: number) {
        return this.http.get(`${this.apiUrl}/assure/${id}`);
    }

}
