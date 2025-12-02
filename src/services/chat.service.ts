import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, from, switchMap } from 'rxjs';
import { environment } from '../environments/environment';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private apiUrl = `${environment.apiUrlLocale}/chat`;
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private token: string | null = null;

  private async loadToken(): Promise<void> {
    if (!this.token) {
      this.token = await this.authService.getKeycloakInstance();
    }
  }

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Authorization': `Bearer ${this.token}`,
      'Content-Type': 'application/json'
    });
  }

  /**
   * Créer un chat entre deux utilisateurs
   * @param senderId ID numérique de l'expéditeur (ID base de données)
   * @param receiverId ID numérique du destinataire (ID base de données)
   * @returns Observable<number> - L'ID du chat créé
   */
  createChat(senderId: number, receiverId: number): Observable<number> {
    return from(this.loadToken()).pipe(
      switchMap(() => {
        const params = new HttpParams()
          .set('sender-id', senderId.toString())
          .set('receiver-id', receiverId.toString());
        
        return this.http.post<number>(this.apiUrl, null, {
          headers: this.getHeaders(),
          params
        });
      })
    );
  }

  /**
   * Récupérer les chats d'un utilisateur
   * @param senderId ID numérique de l'utilisateur
   */
  getChatsBySender(senderId: number): Observable<any[]> {
    return from(this.loadToken()).pipe(
      switchMap(() => {
        const params = new HttpParams().set('senderId', senderId.toString());
        return this.http.get<any[]>(this.apiUrl, {
          headers: this.getHeaders(),
          params
        });
      })
    );
  }

  /**
   * Créer un chat lors de l'affectation d'une mission
   * Cette méthode crée automatiquement une conversation entre l'assuré et le garagiste
   */
  async createChatForMission(assureId: number, reparateurId: number): Promise<number> {
    await this.loadToken();
    
    const params = new HttpParams()
      .set('sender-id', reparateurId.toString())
      .set('receiver-id', assureId.toString());
    
    return this.http.post<number>(this.apiUrl, null, {
      headers: this.getHeaders(),
      params
    }).toPromise() as Promise<number>;
  }
}

