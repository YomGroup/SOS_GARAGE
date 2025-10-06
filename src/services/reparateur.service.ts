import { inject, Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { Reparateur } from './models-api.interface';
import { environment } from '../environments/environment';

export interface PaginatedResponse<T> {
    content: T[];
    pageable?: any;
    totalPages?: number;
    totalElements?: number;
    last?: boolean;
    size?: number;
    number?: number;
    sort?: any;
    numberOfElements?: number;
    first?: boolean;
    empty?: boolean;
}

@Injectable({
    providedIn: 'root'
})
export class ReparateurService {
    private apiUrl = `${environment.apiUrl}/reparateurs/{id}`;

    private http = inject(HttpClient);

    getReparateur(id: number) {
        return this.http.get<Reparateur>(this.apiUrl.replace('{id}', id.toString()));
    }


    getAllReparateurs() {
        return this.http.get<any>(`${environment.apiUrl}/reparateurs`).pipe(
            map((res: any) => Array.isArray(res) ? res as Reparateur[] : (res?.content || []) as Reparateur[])
        );
    }

    // Paginated retrieval of reparateurs with optional filters
    getReparateursPage(page: number = 0, size: number = 10, filters: { status?: string; ville?: string; q?: string } = {}) {
        let url = `${environment.apiUrl}/reparateurs?page=${page}&size=${size}`;
        if (filters.status) url += `&status=${encodeURIComponent(filters.status)}`;
        if (filters.ville) url += `&ville=${encodeURIComponent(filters.ville)}`;
        if (filters.q) url += `&q=${encodeURIComponent(filters.q)}`;
        return this.http.get<PaginatedResponse<Reparateur>>(url);
    }

    createReparateur(reparateur: Omit<Reparateur, 'id'>) {
        return this.http.post<Reparateur>(`${environment.apiUrl}/reparateurs`, reparateur);
    }

    updateReparateur(id: number, reparateur: Partial<Reparateur>) {
        return this.http.put<Reparateur>(this.apiUrl.replace('{id}', id.toString()), reparateur);
    }

    // Some endpoints may return an empty body or plain text; use this to avoid JSON parse errors
    updateReparateurText(id: number, reparateur: Partial<Reparateur>) {
        return this.http.put(this.apiUrl.replace('{id}', id.toString()), reparateur, { responseType: 'text' });
    }

    // PATCH variants (some backends expect partial updates via PATCH)
    updateReparateurPatch(id: number, reparateur: Partial<Reparateur>) {
        return this.http.patch<Reparateur>(this.apiUrl.replace('{id}', id.toString()), reparateur);
    }

    updateReparateurPatchText(id: number, reparateur: Partial<Reparateur>) {
        return this.http.patch(this.apiUrl.replace('{id}', id.toString()), reparateur, { responseType: 'text' });
    }

    deleteReparateur(id: number) {
        return this.http.delete(this.apiUrl.replace('{id}', id.toString()));
    }

    getReparateurByKeycloakId(useridKeycloak: string) {
        return this.http.get<Reparateur>(`${environment.apiUrl}/reparateurs/keycloak/${useridKeycloak}`);
    }
}
