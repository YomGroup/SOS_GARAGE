import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ReparationDTO } from './interfaces';

@Injectable({
  providedIn: 'root'
})
export class ReparationService {
  private apiUrl = 'https://sosmongarage-production.up.railway.app/V1/reparations';

  constructor(private http: HttpClient) { }

  getAllReparations(): Observable<ReparationDTO[]> {
    return this.http.get<ReparationDTO[]>(this.apiUrl);
  }
} 