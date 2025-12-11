import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, Subject } from 'rxjs';
import { AuthService } from './auth.service';
import { WebSocketService, WebSocketMessage } from './websocket.service';

// ✅ URL de production Railway
const BASE_URL = 'https://prolific-quietude-production.up.railway.app/V1/api';

export interface ChatMessage {
  id?: number;
  content: string;
  senderId: number;
  receiverId: number;
  chatId: number;
  type: string;
  state?: string;
  status?: string;
  createdAt?: string;
  timestamp?: string;
}

export interface EnhancedChat {
  id: number;
  senderId: number;
  receiverId: number;
  name: string;
  lastMessage: string | null;
  lastMessageTime: string | null;
  lastMessageType: string | null;
  unreadCount: number;
  isRecipientOnline: boolean;
}

export interface ChatUser {
  id: number;
  name: string;
  prenom?: string;
  email?: string;
  isOnline?: boolean;
  unreadCount?: number;
  lastMessage?: string;
  lastMessageTime?: string;
}

@Injectable({
  providedIn: 'root'
})
export class BackendMessagingService {
  public connectionStatus$ = new BehaviorSubject<boolean>(false);
  public newMessage$ = new Subject<ChatMessage>();

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private webSocketService: WebSocketService
  ) {
    this.webSocketService.connectionStatus$.subscribe(status => {
      this.connectionStatus$.next(status);
    });

    this.webSocketService.newMessage$.subscribe((wsMessage: WebSocketMessage) => {
      const message: ChatMessage = {
        id: wsMessage.id,
        content: wsMessage.content,
        senderId: wsMessage.senderId,
        receiverId: wsMessage.receiverId,
        chatId: wsMessage.chatId,
        type: wsMessage.messageType,
        status: wsMessage.status,
        createdAt: wsMessage.timestamp,
        timestamp: wsMessage.timestamp,
      };
      this.newMessage$.next(message);
    });
  }

  /**
   * Obtenir le token string
   */
  private getTokenString(): string {
    const token = this.authService.getToken();
    
    if (typeof token === 'string') {
      return token;
    }
    
    if (token && typeof token === 'object') {
      return (token as any).token || (token as any).access_token || '';
    }
    
    return '';
  }

  /**
   * Obtenir les headers
   */
  private getHeaders(): HttpHeaders {
    const token = this.getTokenString();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  /**
   * Connexion WebSocket
   */
  async connect(userId: number): Promise<void> {
    const token = this.getTokenString();
    await this.webSocketService.connect(userId, token);
    this.webSocketService.sendUserOnline(userId);
  }

  /**
   * Déconnexion
   */
  disconnect(): void {
    this.webSocketService.disconnect();
  }

  /**
   * ✅ Obtenir les chats améliorés (correspond au Swagger)
   */
  getEnhancedChats(userId: number): Observable<EnhancedChat[]> {
    const url = `${BASE_URL}/api/v2/chat/user/${userId}/enhanced`;
    console.log('📡 Calling:', url);
    return this.http.get<EnhancedChat[]>(url, { headers: this.getHeaders() });
  }

  /**
   * ✅ Obtenir les messages d'un chat (correspond au Swagger)
   */
  getChatMessages(chatId: number): Observable<ChatMessage[]> {
    const url = `${BASE_URL}/api/messages/chat/${chatId}`;
    console.log('📡 Calling:', url);
    return this.http.get<ChatMessage[]>(url, { headers: this.getHeaders() });
  }

  /**
   * ✅ Vérifier si deux utilisateurs peuvent chatter (correspond au Swagger)
   */
  getOrCreateChat(user1Id: number, user2Id: number): Observable<{ canChat: boolean; chatId: number | null }> {
    const url = `${BASE_URL}/api/v2/chat/can-chat`;
    console.log('📡 Calling:', url);
    return this.http.get<{ canChat: boolean; chatId: number | null }>(
      url,
      {
        params: { user1Id: user1Id.toString(), user2Id: user2Id.toString() },
        headers: this.getHeaders()
      }
    );
  }

  /**
   * ✅ Créer un nouveau chat
   */
  createChat(senderId: number, receiverId: number): Observable<number> {
    const url = `${BASE_URL}/api/chat`;
    console.log('📡 Calling:', url);
    return this.http.post<number>(
      url,
      null,
      {
        params: { 'sender-id': senderId.toString(), 'receiver-id': receiverId.toString() },
        headers: this.getHeaders()
      }
    );
  }

  /**
   * ✅ Marquer les messages comme lus
   */
  markMessagesAsRead(chatId: number, userId: number): Observable<void> {
    const url = `${BASE_URL}/api/messages/chat/${chatId}/mark-read/${userId}`;
    console.log('📡 Calling:', url);
    return this.http.patch<void>(url, {}, { headers: this.getHeaders() });
  }

  /**
   * Envoyer un message via WebSocket
   */
  sendMessage(message: {
    content: string;
    senderId: number;
    receiverId: number;
    chatId: number;
    type: string;
  }): boolean {
    return this.webSocketService.sendMessage(message);
  }

  /**
   * Envoyer un indicateur de frappe
   */
  sendTypingIndicator(
    senderId: number,
    receiverId: number,
    chatId: number,
    isTyping: boolean
  ): boolean {
    return this.webSocketService.sendTypingIndicator(senderId, receiverId, chatId, isTyping);
  }

  /**
   * Envoyer un accusé de lecture
   */
  sendReadReceipt(chatId: number, readerId: number, senderId: number): boolean {
    return this.webSocketService.sendReadReceipt(chatId, readerId, senderId);
  }

  /**
   * ✅ Obtenir le compteur de messages non lus total
   */
  getTotalUnreadCount(userId: number): Observable<number> {
    const url = `${BASE_URL}/api/messages/unread-count/${userId}`;
    console.log('📡 Calling:', url);
    return this.http.get<number>(url, { headers: this.getHeaders() });
  }

  /**
   * ✅ Obtenir les détails d'un chat
   */
  getChatDetails(chatId: number, userId: number): Observable<any> {
    const url = `${BASE_URL}/api/v2/chat/${chatId}/details`;
    console.log('📡 Calling:', url);
    return this.http.get<any>(
      url,
      {
        params: { userId: userId.toString() },
        headers: this.getHeaders()
      }
    );
  }

  /**
   * ✅ Obtenir le compteur de messages non lus par chat
   */
  getUnreadCountByChat(userId: number): Observable<number> {
    const url = `${BASE_URL}/api/v2/chat/user/${userId}/unread-total`;
    console.log('📡 Calling:', url);
    return this.http.get<number>(url, { headers: this.getHeaders() });
  }
}