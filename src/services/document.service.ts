import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../environments/environment';


@Injectable({
    providedIn: 'root'
})
export class DocumentService {
    private apiUrl = `${environment.apiUrl}/documentsSinistre`;
    private http = inject(HttpClient);


    addDocumentPost(body: any) {
        return this.http.post(this.apiUrl, body);
    }

    getsinistreGet(id: number) {
        return this.http.get(`${this.apiUrl}/assure/${id}`);
    }

}
