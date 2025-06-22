import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { MissionDTO } from './interfaces';

@Injectable({
  providedIn: 'root'
})
export class MissionService {
  private apiUrl = 'https://sosmongarage-production.up.railway.app/V1/missions';

  constructor(private http: HttpClient) { }

  getAllMissions(): Observable<MissionDTO[]> {
    return this.http.get<MissionDTO[]>(this.apiUrl);
  }
} 