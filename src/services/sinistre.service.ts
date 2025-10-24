import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../environments/environment';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service'; // ✅ à adapter selon ton projet

@Injectable({
    providedIn: 'root'
})
export class SinistreService {
    private apiUrl = `${environment.apiUrlLocale}/sinistre/create`;
    private http = inject(HttpClient);
    private authService = inject(AuthService); // injection du service Keycloak
    private token: string | null = null;

    // 🔐 Charge le token si nécessaire
    private async loadToken(): Promise<void> {
        if (!this.token) {
            this.token = await this.authService.getKeycloakInstance();
        }
    }

    // ✅ Ajoute un sinistre avec notification Formspree
    async addSinistrePost(body: any): Promise<Observable<any>> {
        await this.loadToken();

        // --- Notification admin temporaire via Formspree ---
        const formspreeUrl = 'https://formspree.io/f/meoljrlp';
        const notificationPayload = {
            subject: '[SOS Garage] Nouveau Sinistre Déclaré',
            message: 'Un nouveau sinistre a été soumis dans l\'application.',
            details: 'Contenu: ' + JSON.stringify(body, null, 2)
        };

        // Appel "fire-and-forget"
        this.http.post(formspreeUrl, notificationPayload).subscribe({
            next: () =>
                console.log('Notification temporaire envoyée à l\'administrateur.'),
            error: (err) =>
                console.error('Erreur notification Formspree:', err)
        });
        // --- Fin notification ---

        const headers = new HttpHeaders({
            'Authorization': `Bearer ${this.token}`,
            'Content-Type': 'application/json'
        });

        // Retourne la requête principale pour souscription dans le composant
        return this.http.post(this.apiUrl, body, { headers });
    }

    // ✅ Récupère les sinistres d’un assuré
    async getsinistreGet(id: number): Promise<Observable<any>> {
        await this.loadToken();

        const headers = new HttpHeaders({
            'Authorization': `Bearer ${this.token}`
        });

        return this.http.get(`${this.apiUrl}/assure/${id}`, { headers });
    }
}
