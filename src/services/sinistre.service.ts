import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../environments/environment';
import { Observable } from 'rxjs';


@Injectable({
    providedIn: 'root'
})
export class SinistreService {
    private apiUrl = `${environment.apiUrl}/sinistre`;
    private http = inject(HttpClient);

    addSinistrePost(body: any): Observable<any> {
        // --- Notification admin temporaire via Formspree ---
        const formspreeUrl = 'https://formspree.io/f/meoljrlp';
        const notificationPayload = {
            subject: '[SOS Garage] Nouveau Sinistre Déclaré',
            message: 'Un nouveau sinistre a été soumis dans l\'application.',
            details: 'Contenu: ' + JSON.stringify(body, null, 2)
        };

        // Appel "fire-and-forget" (on ne retourne pas l’Observable ici)
        this.http.post(formspreeUrl, notificationPayload).subscribe({
            next: () =>
                console.log('Notification temporaire envoyée à l\'administrateur.'),
            error: (err) =>
                console.error('Erreur notification Formspree:', err)
        });
        // --- Fin notification ---

        // Retourner l’appel principal pour que le composant puisse souscrire
        return this.http.post(this.apiUrl, body);
    }


    getsinistreGet(id: number) {
        return this.http.get(`${this.apiUrl}/assure/${id}`);
    }

}
