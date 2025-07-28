import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Expertise } from './models-api.interface';
import { map } from 'rxjs/operators';
import { environment } from '../environments/environment';

@Injectable({ providedIn: 'root' })
export class ExpertiseService {
  private apiUrl = `${environment.apiUrl}/expertises`;

  constructor(private http: HttpClient) {}

  getExpertises(): Observable<Expertise[]> {
    return this.http.get<Expertise[]>(this.apiUrl);
  }

  getExpertiseById(id: number): Observable<Expertise> {
    return this.http.get<Expertise>(`${this.apiUrl}/${id}`);
  }

  createExpertise(expertise: Expertise): Observable<Expertise> {
    return this.http.post<Expertise>(this.apiUrl, expertise);
  }

  updateExpertise(expertise: Expertise): Observable<Expertise> {
    return this.http.put<Expertise>(`${this.apiUrl}/${expertise.id}`, expertise);
  }

  getExpertsFromExpertises(): Observable<any[]> {
    return this.getExpertises().pipe(
      // On transforme la liste d'expertises en liste d'experts uniques
      map((expertises: Expertise[]) => {
        const expertsMap = new Map<string, any>();
        expertises.forEach(exp => {
          // Utilise un identifiant unique (nom + prénom + institution par exemple)
          const key = `${exp.nomExpert}|${exp.prenomExpert}|${exp.institutionExpert}`;
          if (exp.nomExpert && !expertsMap.has(key)) {
            expertsMap.set(key, {
              nom: exp.nomExpert,
              prenom: exp.prenomExpert,
              institution: exp.institutionExpert,
              telephone: exp.contactExpert,
              email: exp.mailExpert
            });
          }
        });
        return Array.from(expertsMap.values());
      })
    );
  }
}