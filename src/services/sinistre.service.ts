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

    private async loadToken(): Promise<void> {
        if (!this.token) {
            this.token = await this.authService.getKeycloakInstance();
        }
    }

    /**
     * ✅ Upload des photos - CORRIGÉ : Utilise 'files' comme le mobile !
     */
    async uploadImages(sinistreId: string, files: File[]): Promise<any> {
        const formData = new FormData();
        
        // ✅ 'files' au lieu de 'images' pour matcher le backend et le mobile !
        files.forEach((file) => {
            formData.append('files', file, file.name);
        });

        await this.loadToken();

        const headers = new HttpHeaders({
            'Authorization': `Bearer ${this.token}`
        });

        const url = `${environment.apiUrlLocale}/sinistre/${sinistreId}/photos`;
        console.log('📤 Upload photos - URL:', url);
        console.log('📁 Nombre de fichiers:', files.length);

        try {
            const result = await lastValueFrom(
                this.http.put<any>(url, formData, { headers })
            );
            console.log('✅ Photos uploadées:', result);
            return result;
        } catch (error: any) {
            console.error('❌ Erreur HTTP:', error);
            
            // ✅ Si la réponse n'est pas du JSON, on la log
            if (error.error && typeof error.error === 'string') {
                console.error('❌ Réponse texte (pas JSON):', error.error);
            }
            
            throw error;
        }
    }

    /**
     * ✅ Upload du constat
     */
    async uploadConstat(sinistreId: string, file: File): Promise<any> {

      
        const formData = new FormData();
        formData.append('file', file, file.name);

        await this.loadToken();

        const headers = new HttpHeaders({
            'Authorization': `Bearer ${this.token}`
        });


        
        const url = `${environment.apiUrlLocale}/sinistre/${sinistreId}/constat`;
        console.log('📤 Upload constat - URL:', url);
        console.log('📄 Fichier:', file.name);

        try {
            const result = await lastValueFrom(
                this.http.put<any>(url, formData, { headers })
            );
            console.log('✅ Constat uploadé:', result);
            return result;
        } catch (error: any) {
            console.error('❌ Erreur upload constat:', error);
            
            if (error.error && typeof error.error === 'string') {
                console.error('❌ Réponse texte (pas JSON):', error.error);
            }
            
            throw error;
        }
    }

    async updateSinistreStatus(sinistreId: number, newStatus: string): Promise<Observable<any>> {
        await this.loadToken();

        const headers = new HttpHeaders({
            'Authorization': `Bearer ${this.token}`,
            'Content-Type': 'application/json'
        });

        const body = { statut: newStatus };

        return this.http.patch(`${this.apiUrl2}/${sinistreId}`, body, { headers });
    }

    async getSinistreById(sinistreId: number): Promise<Observable<any>> {
        await this.loadToken();

        const headers = new HttpHeaders({
            'Authorization': `Bearer ${this.token}`
        });

        return this.http.get(`${this.apiUrl2}/find_by/${sinistreId}`, { headers });
    }

    async updateSinistre(sinistreId: number, sinistreData: any): Promise<Observable<any>> {
        await this.loadToken();

        const headers = new HttpHeaders({
            'Authorization': `Bearer ${this.token}`,
            'Content-Type': 'application/json'
        });

        return this.http.put(`${this.apiUrl2}/${sinistreId}`, sinistreData, { headers });
    }

    async addSinistrePost(body: any): Promise<any> {
    await this.loadToken();
    const headers = new HttpHeaders({
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json'
    });
    
    try {
        const result = await lastValueFrom(
            this.http.post(this.apiUrl, body, { headers })
        );
        console.log('✅ Sinistre créé:', result);
        return result;
    } catch (error: any) {
        console.error('❌ Erreur création sinistre:', error);
        throw error;
    }
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