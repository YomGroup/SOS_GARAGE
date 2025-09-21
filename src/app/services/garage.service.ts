import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface GarageDTO {
  id: string;
  name: string;
  address: string;
  // Ajoutez d'autres champs selon votre API
}

@Injectable({
  providedIn: 'root'
})
export class GarageService {
  private apiUrl = 'https://sosmongarage-production.up.railway.app/V1/garages';

  constructor(private http: HttpClient) { }

  getAllGarages(): Observable<GarageDTO[]> {
    return this.http.get<GarageDTO[]>(this.apiUrl);
  }
} 