import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../environments/environment';
import { from, lastValueFrom, Observable, switchMap } from 'rxjs';
import { AuthService } from './auth.service';

@Injectable({
    providedIn: 'root'
})
export class SinistreService {
    private apiUrl = `${environment.apiUrlLocale}/sinistre/create`;
    private apiUrl2 = `${environment.apiUrlLocale}/sinistre`;
    private http = inject(HttpClient);
    private authService = inject(AuthService);
    private token: string | null = null;

    // 🔐 Charge le token si nécessaire
    private async loadToken(): Promise<void> {
        if (!this.token) {
            this.token = await this.authService.getKeycloakInstance();
        }
    }

    /**
     * ✅ CORRIGÉ : Upload des images
     */
    async uploadImages(sinistreId: string, files: File[]): Promise<any> {
  const formData = new FormData();

  // ⚠️ le backend mobile attend "files"
  files.forEach((file) => {
    formData.append('files', file, file.name);
  });

  await this.loadToken();

  const headers = new HttpHeaders({
    Authorization: `Bearer ${this.token}`,
    // ❌ ne pas mettre Content-Type avec FormData
  });

  // ✅ même endpoint que mobile
  return await lastValueFrom(
    this.http.put<any>(
      `${environment.apiUrlLocale}/api/sinistre/${sinistreId}/photos`,
      formData,
      { headers }
    )
  );
}

// ✅ Upload du constat (comme mobile)
async uploadConstat(sinistreId: string, file: File): Promise<any> {
  const formData = new FormData();

  // ⚠️ le backend mobile attend "file"
  formData.append('file', file, file.name);

  await this.loadToken();

  const headers = new HttpHeaders({
    Authorization: `Bearer ${this.token}`,
  });

  // ✅ même endpoint que mobile
  return await lastValueFrom(
    this.http.put<any>(
      `${environment.apiUrlLocale}/api/sinistre/${sinistreId}/constat`,
      formData,
      { headers }
    )
  );
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

    async addSinistrePost(body: any): Promise<Observable<any>> {
        await this.loadToken();

        const headers = new HttpHeaders({
            'Authorization': `Bearer ${this.token}`,
            'Content-Type': 'application/json'
        });

        return this.http.post(this.apiUrl, body, { headers });
    }

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

    getAllSinistre(assureId: number) {
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
