import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Expertise } from './models-api.interface';

@Injectable({ providedIn: 'root' })
export class ExpertiseService {
  private apiUrl = 'https://sosmongarage-production.up.railway.app/V1/api/expertises';

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
} 