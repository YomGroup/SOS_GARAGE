import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface UserDTO {
  id: string;
  username: string;
  email: string;
  // Ajoutez d'autres champs selon votre API
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = 'https://sosmongarage-production.up.railway.app/V1/users';

  constructor(private http: HttpClient) { }

  getAllUsers(): Observable<UserDTO[]> {
    return this.http.get<UserDTO[]>(this.apiUrl);
  }
} 