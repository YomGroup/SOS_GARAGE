import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../environments/environment';
import { from, Observable, switchMap } from 'rxjs';
import { AuthService } from './auth.service';

export type DocumentType = 'ordre_reparation' | 'cession1' | 'cession2';

export interface DocumentRequest {
    documentType: DocumentType;
    values: Record<string, any>;
}

export interface SinistreForDocument {
    id: number;
    assureEmail: string;
    assureName: string;
    vehiculeImmatriculation: string;
    type: string;
    statut: string;
    createdAt: any;
}

@Injectable({
    providedIn: 'root'
})
export class DocumentService {
    private apiUrl = `${environment.apiUrlLocale}/documents`;
    private sinistreApiUrl = `${environment.apiUrlLocale}/sinistre`;
    private http = inject(HttpClient);
    private authService = inject(AuthService);
    private token: string | null = null;

    private async loadToken(): Promise<void> {
        if (!this.token) {
            this.token = await this.authService.getKeycloakInstance();
        }
    }

    /**
     * Génère un document PDF pour un sinistre donné
     * @param sinistreId L'ID du sinistre
     * @param documentType Le type de document à générer
     * @returns Observable<Blob> Le fichier PDF généré
     */
    generateDocumentBySinistre(sinistreId: number, documentType: DocumentType): Observable<Blob> {
        return from(this.loadToken()).pipe(
            switchMap(() => {
                const headers = new HttpHeaders({
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                });

                return this.http.post(
                    `${this.apiUrl}/generate/${sinistreId}`,
                    JSON.stringify(documentType),
                    { 
                        headers, 
                        responseType: 'blob' 
                    }
                );
            })
        );
    }

    /**
     * Génère un document PDF avec des valeurs personnalisées
     * @param request La requête contenant le type et les valeurs
     * @returns Observable<Blob> Le fichier PDF généré
     */
    generateDocument(request: DocumentRequest): Observable<Blob> {
        return from(this.loadToken()).pipe(
            switchMap(() => {
                const headers = new HttpHeaders({
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                });

                return this.http.post(
                    `${this.apiUrl}/generate`,
                    request,
                    { 
                        headers, 
                        responseType: 'blob' 
                    }
                );
            })
        );
    }

    /**
     * Récupère tous les sinistres avec pagination pour la sélection
     */
    getAllSinistres(page: number = 0, size: number = 100): Observable<any> {
        return from(this.loadToken()).pipe(
            switchMap(() => {
                const headers = new HttpHeaders({
                    'Authorization': `Bearer ${this.token}`
                });

                return this.http.get(`${this.sinistreApiUrl}/find_by_page?page=${page}&size=${size}`, { headers });
            })
        );
    }

    /**
     * Télécharge le fichier blob généré
     */
    downloadPdf(blob: Blob, filename: string): void {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
        window.URL.revokeObjectURL(url);
    }
}
