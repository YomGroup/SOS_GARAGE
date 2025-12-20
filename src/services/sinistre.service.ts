import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../environments/environment';
import { from, lastValueFrom, Observable, switchMap } from 'rxjs';
import { AuthService } from './auth.service'; // ✅ à adapter selon ton projet

@Injectable({
    providedIn: 'root'
})
export class SinistreService {
    private apiUrl = `${environment.apiUrlLocale}/sinistre/create`;
    private apiUrl2 = `${environment.apiUrlLocale}/sinistre`;
    private http = inject(HttpClient);
    private authService = inject(AuthService); // injection du service Keycloak
    private token: string | null = null;

    // 🔐 Charge le token si nécessaire
    private async loadToken(): Promise<void> {
        if (!this.token) {
            this.token = await this.authService.getKeycloakInstance();
        }
    }

    async uploadImages(id: string, files: File[]): Promise<any> {
       const formData = new FormData();
       files.forEach(file => formData.append('images', file));

       await this.loadToken();

       const headers = new HttpHeaders({
           'Authorization': `Bearer ${this.token}`
       });

       return lastValueFrom(
           this.http.post(`${environment.apiUrlLocale}/image/upload/${id}`, formData, { headers })
       );
    }

    /**
     * Upload du constat (PDF ou image) via MinIO
     */
    async uploadConstat(sinistreId: string, file: File): Promise<string> {
        const formData = new FormData();
        formData.append('images', file);

        await this.loadToken();

        const headers = new HttpHeaders({
            'Authorization': `Bearer ${this.token}`
        });

        const result = await lastValueFrom(
            this.http.post<string[]>(`${environment.apiUrlLocale}/image/upload/constat_${sinistreId}`, formData, { headers })
        );
        
        // Retourne la première URL (le constat)
        return result && result.length > 0 ? result[0] : '';
    }

/**
 * Mettre à jour le statut d'un sinistre
 */
async updateSinistreStatus(sinistreId: number, newStatus: string): Promise<Observable<any>> {
  await this.loadToken();

  const headers = new HttpHeaders({
    'Authorization': `Bearer ${this.token}`,
    'Content-Type': 'application/json'
  });

  const body = { statut: newStatus };

  return this.http.patch(`${this.apiUrl2}/${sinistreId}`, body, { headers });
}

/**
 * Récupérer un sinistre par ID
 */
async getSinistreById(sinistreId: number): Promise<Observable<any>> {
  await this.loadToken();

  const headers = new HttpHeaders({
    'Authorization': `Bearer ${this.token}`
  });

  return this.http.get(`${this.apiUrl2}/find_by/${sinistreId}`, { headers });
}

/**
 * Mettre à jour un sinistre complet
 */
async updateSinistre(sinistreId: number, sinistreData: any): Promise<Observable<any>> {
  await this.loadToken();

  const headers = new HttpHeaders({
    'Authorization': `Bearer ${this.token}`,
    'Content-Type': 'application/json'
  });

  return this.http.put(`${this.apiUrl2}/${sinistreId}`, sinistreData, { headers });
}

    // ✅ Ajoute un sinistre avec notification Formspree
    async addSinistrePost(body: any): Promise<Observable<any>> {
        await this.loadToken();

        /*
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
        */

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

    getDashboard(assureId: number) {
  return from(this.loadToken()).pipe(
    switchMap(() => {
      const headers = new HttpHeaders({
        'Authorization': `Bearer ${this.token}`
      });

      return this.http.get<any>(`${this.apiUrl2}/getDashboard/${assureId}`, { headers });
    })
  );
}

    getAllSinistre(assureId:number){

        return from(this.loadToken()).pipe(
    switchMap(() => {
      const headers = new HttpHeaders({
        'Authorization': `Bearer ${this.token}`
      });

      return this.http.get<any>(`${this.apiUrl2}/getAllByassureId/${assureId}`, { headers });
    })
  );


    }


}
