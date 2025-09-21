import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Expert } from './models-api.interface';
import { environment } from '../environments/environment';

@Injectable({ providedIn: 'root' })
export class ExpertService {
  private apiUrl = `${environment.apiUrl}/experts`;

  constructor(private http: HttpClient) {}

  getExperts(): Observable<Expert[]> {
    return this.http.get<Expert[]>(this.apiUrl);
  }

  getExpertById(id: number): Observable<Expert> {
    return this.http.get<Expert>(`${this.apiUrl}/${id}`);
  }

  createExpert(expert: Omit<Expert, 'id'>): Observable<Expert> {
    return this.http.post<Expert>(this.apiUrl, expert);
  }

  updateExpert(expert: Expert): Observable<Expert> {
    return this.http.patch<Expert>(`${this.apiUrl}/${expert.id}`, expert);
  }
} 