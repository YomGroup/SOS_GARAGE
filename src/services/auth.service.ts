import { Injectable } from '@angular/core';
import { KeycloakService } from 'keycloak-angular';
import { jwtDecode } from 'jwt-decode';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject } from '@angular/core';
import { environment } from '../environments/environment';

export interface DecodedToken {
    preferred_username: string;
    email: string;
    name: string;
    given_name: string;
    family_name: string;
    realm_access?: {
        roles: string[];
    };
    [key: string]: any;
}
export interface Assure {
    nom: string;
    prenom: string;
    email: string;
    adressePostale: string;
    numeroPermis: string;
    adresse: string;
    password: string;

}
@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private decodedToken: DecodedToken | null = null;
    private apiUrl = `${environment.apiUrl}/assure/create`;

    private apiUrlgarage = `${environment.apiUrl}/reparateurs/create`;
    private http = inject(HttpClient);
    token = '';

    constructor(private keycloakService: KeycloakService) { }

    async init(): Promise<void> {
        this.token = await this.keycloakService.getToken();
        this.decodedToken = jwtDecode<DecodedToken>(this.token);
        console.log('Decoded Token:', this.decodedToken);
    }
    async getKeycloakInstance(): Promise<any> {
        return this.token;
    }
    getToken(): DecodedToken | null {
        return this.decodedToken;
    }

    getUsername(): string | null {
        return this.decodedToken?.preferred_username ?? null;
    }

    getRoles(): string[] {
        return this.decodedToken?.realm_access?.roles ?? [];
    }

    hasRole(role: string): boolean {
        return this.getRoles().includes(role);
    }

    getKeycloakId(): string | null {
        return this.decodedToken ? this.decodedToken['sub'] ?? null : null;
    }

    registerAssure(payload: any) {
        /*
        const headers = new HttpHeaders({
            'Authorization': `Bearer ${this.token}`,
            'Content-Type': 'application/json'
        });
        */
        return this.http.post(this.apiUrl, payload);

    }
    registerGaragistre(payload: any) {
        const headers = new HttpHeaders({
            'Authorization': `Bearer ${this.token}`,
            'Content-Type': 'application/json'
        });

        return this.http.post(this.apiUrlgarage, payload);

    }
}
