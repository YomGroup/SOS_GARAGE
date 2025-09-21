// yousign.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

interface CreateSignatureRequestResponse {
    id: string;
    status: string;
}

interface DocumentResponse {
    id: string;
    name: string;
}

interface SignerResponse {
    id: string;
    info: {
        first_name: string;
        last_name: string;
        email: string;
    };
}

interface GetSignerResponse {
    id: string;
    signature_link?: string;
    embedded_url?: string;
    status?: 'ready' | 'pending' | 'signed' | 'canceled' | 'failed'; // Ajouter le statut
}

@Injectable({ providedIn: 'root' })
export class YousignService {
    private baseUrl = 'https://api-sandbox.yousign.app/v3';
    private apiKey = 'VT9MwZ6wT6xaBaIstT9ZxWz8Amk8eznI';

    private get headers() {
        return new HttpHeaders({
            'Authorization': `Bearer ${this.apiKey}`,
        });
    }

    constructor(private http: HttpClient) { }

    createSignatureRequest(name: string, options?: {
        deliveryMode?: 'email' | 'none',
        timezone?: string
    }) {
        const body = {
            name,
            delivery_mode: options?.deliveryMode ?? 'none',
            timezone: options?.timezone ?? 'Europe/Paris'
        };
        return this.http.post<CreateSignatureRequestResponse>(
            `${this.baseUrl}/signature_requests`,
            body,
            { headers: this.headers }
        );
    }


    uploadDocument(signatureRequestId: string, file: Blob, filename: string) {
        const form = new FormData();
        form.append('file', file, filename);
        form.append('nature', 'signable_document');
        form.append('name', filename);

        // Pour FormData, ne pas spécifier Content-Type
        const formHeaders = new HttpHeaders({
            'Authorization': `Bearer ${this.apiKey}`
        });

        return this.http.post<DocumentResponse>(
            `${this.baseUrl}/signature_requests/${signatureRequestId}/documents`,
            form,
            { headers: formHeaders }
        );
    }

    // Signature corrigée pour correspondre à l'utilisation
    addSignerWithField(
        signatureRequestId: string,
        signerInfo: {
            firstName: string;
            lastName: string;
            email: string;
            phone_number?: string;
            locale?: string;
        },
        fieldInfo: {
            documentId: string;
            page: number;
            x: number;
            y: number;
        },
        options?: {
            authMode?: 'email' | 'sms' | 'none';
            redirectSuccessUrl?: string;
            redirectErrorUrl?: string;
        }
    ) {
        // Validation des données d'entrée
        if (!signerInfo.firstName?.trim() || !signerInfo.lastName?.trim() || !signerInfo.email?.trim()) {
            throw new Error('Prénom, nom et email sont requis');
        }

        if (!fieldInfo.documentId) {
            throw new Error('Document ID est requis');
        }

        // Validation de l'email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(signerInfo.email)) {
            throw new Error('Format d\'email invalide');
        }

        // Payload selon l'exemple fourni
        const body = {
            info: {
                first_name: signerInfo.firstName.trim(),
                last_name: signerInfo.lastName.trim(),
                email: signerInfo.email.trim(),
                ...(signerInfo.phone_number ? { phone_number: signerInfo.phone_number } : {}),
                ...(signerInfo.locale ? { locale: signerInfo.locale } : {})
            },
            signature_level: 'electronic_signature',
            signature_authentication_mode: this.getAuthMode(options?.authMode),

            /*  // Structure redirect_urls (optionnel)
              ...(options?.redirectSuccessUrl || options?.redirectErrorUrl ? {
                  redirect_urls: {
                      ...(options.redirectSuccessUrl ? { success: options.redirectSuccessUrl } : {}),
                      ...(options.redirectErrorUrl ? { error: options.redirectErrorUrl } : {})
                  }
              } : {}),*/

            // Structure fields
            fields: [
                {
                    document_id: fieldInfo.documentId,
                    type: 'signature',
                    page: fieldInfo.page,
                    x: fieldInfo.x,
                    y: fieldInfo.y
                }
            ]
        };

        console.log('Payload signer:', JSON.stringify(body, null, 2));

        return this.http.post<SignerResponse>(
            `${this.baseUrl}/signature_requests/${signatureRequestId}/signers`,
            body,
            { headers: this.headers }
        );
    }

    private getAuthMode(authMode?: 'email' | 'sms' | 'none'): string {
        switch (authMode) {
            case 'sms': return 'otp_sms';
            case 'email': return 'otp_email';
            case 'none':
            default: return 'no_otp';  // Changé pour correspondre à l'exemple
        }
    }

    activateSignatureRequest(signatureRequestId: string) {
        return this.http.post(
            `${this.baseUrl}/signature_requests/${signatureRequestId}/activate`,
            {},
            { headers: this.headers }
        );
    }

    getSigner(signatureRequestId: string, signerId: string) {
        return this.http.get<GetSignerResponse>(
            `${this.baseUrl}/signature_requests/${signatureRequestId}/signers/${signerId}`,
            { headers: this.headers }
        );
    }

    // Méthode utilitaire pour déboguer
    getSignatureRequest(signatureRequestId: string) {
        return this.http.get(
            `${this.baseUrl}/signature_requests/${signatureRequestId}`,
            { headers: this.headers }
        );
    }

    downloadSignedDocument(signatureRequestId: string, documentId: string) {
        return this.http.get(
            `${this.baseUrl}/signature_requests/${signatureRequestId}/documents/${documentId}/download`,
            {
                headers: this.headers,
                responseType: 'blob' // Important : récupérer en tant que Blob
            }
        );
    }


    // Optionnel : méthode pour vérifier le statut de la signature
    getSignatureRequestStatus(signatureRequestId: string) {
        return this.http.get(
            `${this.baseUrl}/signature_requests/${signatureRequestId}`,
            { headers: this.headers }
        );
    }
}