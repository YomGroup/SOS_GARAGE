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
        // --- Notification admin temporaire via Formspree ---
        const formspreeUrl = 'https://formspree.io/f/meoljrlp';
        const notificationPayload = {
            subject: '[SOS Garage] Nouveau Sinistre Déclaré',
            message: 'Un nouveau sinistre a été soumis dans l\'application.',
            details: 'Contenu: ' + JSON.stringify(body, null, 2)
        };

        // Appel "Fire-and-forget" à Formspree.
        this.http.post(formspreeUrl, notificationPayload).subscribe({
            next: () => console.log('Notification temporaire de sinistre envoyée à l\'administrateur.'),
            error: (err) => console.error('Erreur lors de l\'envoi de la notification temporaire:', err)
        });
        // --- Fin de la notification temporaire ---

        // L\'appel original à l\'API principale reste inchangé.
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
