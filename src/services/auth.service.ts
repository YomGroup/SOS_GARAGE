import { Injectable } from '@angular/core';
import { KeycloakService } from 'keycloak-angular';
import { jwtDecode } from 'jwt-decode';

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

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private decodedToken: DecodedToken | null = null;

    constructor(private keycloakService: KeycloakService) { }

    async init(): Promise<void> {
        const token = await this.keycloakService.getToken();
        this.decodedToken = jwtDecode<DecodedToken>(token);
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
}
