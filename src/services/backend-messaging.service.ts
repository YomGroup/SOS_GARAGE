import { Injectable, inject, NgZone } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, from, switchMap, map, firstValueFrom } from 'rxjs';
import { environment } from '../environments/environment';
import { AuthService } from './auth.service';
import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

export interface ChatUser {
  id: number;
  name: string;
  prenom: string;
  email?: string;
  useridKeycloak?: string;
  isOnline?: boolean;
  unreadCount?: number;
  lastMessage?: string;
  lastMessageTime?: string;
}

export interface EnhancedChat {
  id: number;
  name: string;
  unreadCount: number;
  lastMessage: string | null;
  lastMessageTime: string | null;
  lastMessageType: string | null;
  isRecipientOnline: boolean;
  senderId: number;
  receiverId: number;
  canChat: boolean;
}

export interface ChatMessage {
  id?: number;
  content: string;
  senderId: number;
  receiverId: number;
  chatId: number;
  type?: string;
  state?: string;
  createdAt?: string;
  timestamp?: string;
  status?: string;
}

export interface MessageRequest {
  content: string;
  senderId: number;
  receiverId: number;
  chatId: number;
  type?: string;
}

@Injectable({
  providedIn: 'root'
})
export class BackendMessagingService {
  private apiUrl = environment.apiUrlLocale;
  private wsUrl = environment.apiUrlLocale.replace('/V1/api', ''); // http://localhost:8083
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private ngZone = inject(NgZone);
  
  private token: string | null = null;
  private stompClient: Client | null = null;
  private messageSubscription: StompSubscription | null = null;
  
  private messagesSubject = new BehaviorSubject<ChatMessage[]>([]);
  public messages$ = this.messagesSubject.asObservable();
  
  private newMessageSubject = new BehaviorSubject<ChatMessage | null>(null);
  public newMessage$ = this.newMessageSubject.asObservable();
  
  private connectionStatusSubject = new BehaviorSubject<boolean>(false);
  public connectionStatus$ = this.connectionStatusSubject.asObservable();

  private currentUserId: number | null = null;

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

  // ==================== WebSocket Connection ====================

  async connect(userId: number): Promise<void> {
    this.currentUserId = userId;
    await this.loadToken();

    return new Promise((resolve, reject) => {
      this.stompClient = new Client({
        webSocketFactory: () => new SockJS(`${this.wsUrl}/ws`),
        connectHeaders: {
          Authorization: `Bearer ${this.token}`
        },
        debug: (str) => {
          console.log('STOMP Debug:', str);
        },
        reconnectDelay: 5000,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,
      });

      this.stompClient.onConnect = (frame) => {
        console.log('✅ WebSocket Connected:', frame);
        this.connectionStatusSubject.next(true);
        
        // Subscribe to user's message queue
        this.subscribeToMessages(userId);
        
        // Notify server user is online
        this.sendUserOnline(userId);
        
        resolve();
      };

      this.stompClient.onStompError = (frame) => {
        console.error('❌ STOMP Error:', frame);
        this.connectionStatusSubject.next(false);
        reject(new Error(frame.body));
      };

      this.stompClient.onDisconnect = () => {
        console.log('WebSocket Disconnected');
        this.connectionStatusSubject.next(false);
      };

      this.stompClient.activate();
    });
  }

  private subscribeToMessages(userId: number): void {
    if (!this.stompClient?.connected) return;

    // Subscribe to personal message queue
    this.messageSubscription = this.stompClient.subscribe(
      `/user/${userId}/queue/messages`,
      (message: IMessage) => {
        this.ngZone.run(() => {
          const chatMessage: ChatMessage = JSON.parse(message.body);
          console.log('📩 Message reçu:', chatMessage);
          this.newMessageSubject.next(chatMessage);
          
          // Add to messages list
          const currentMessages = this.messagesSubject.value;
          this.messagesSubject.next([...currentMessages, chatMessage]);
        });
      }
    );
  }

  private sendUserOnline(userId: number): void {
    if (!this.stompClient?.connected) return;
    
    this.stompClient.publish({
      destination: '/app/chat.userOnline',
      body: JSON.stringify({ userId, sessionId: 'web-' + Date.now() })
    });
  }

  disconnect(): void {
    if (this.currentUserId) {
      this.sendUserOffline(this.currentUserId);
    }
    
    if (this.messageSubscription) {
      this.messageSubscription.unsubscribe();
      this.messageSubscription = null;
    }
    
    if (this.stompClient) {
      this.stompClient.deactivate();
      this.stompClient = null;
    }
    
    this.connectionStatusSubject.next(false);
  }

  private sendUserOffline(userId: number): void {
    if (!this.stompClient?.connected) return;
    
    this.stompClient.publish({
      destination: '/app/chat.userOffline',
      body: JSON.stringify({ userId })
    });
  }

  // ==================== Send Message via WebSocket ====================

  sendMessage(message: MessageRequest): void {
    if (!this.stompClient?.connected) {
      console.error('WebSocket not connected');
      return;
    }

    const chatMessage: ChatMessage = {
      content: message.content,
      senderId: message.senderId,
      receiverId: message.receiverId,
      chatId: message.chatId,
      type: message.type || 'TEXT',
      timestamp: new Date().toISOString()
    };

    this.stompClient.publish({
      destination: '/app/chat.send',
      body: JSON.stringify(chatMessage)
    });

    console.log('📤 Message envoyé:', chatMessage);
  }

  // ==================== REST API Methods ====================

  /**
   * Get all chats for a user with enhanced info
   */
  getEnhancedChats(userId: number): Observable<EnhancedChat[]> {
    return from(this.loadToken()).pipe(
      switchMap(() => 
        this.http.get<EnhancedChat[]>(`${this.apiUrl}/v2/chat/user/${userId}/enhanced`, {
          headers: this.getHeaders()
        })
      )
    );
  }

  /**
   * Get messages for a specific chat
   */
  getChatMessages(chatId: number): Observable<ChatMessage[]> {
    return from(this.loadToken()).pipe(
      switchMap(() => 
        this.http.get<ChatMessage[]>(`${this.apiUrl}/messages/chat/${chatId}`, {
          headers: this.getHeaders()
        })
      )
    );
  }

  /**
   * Create a chat between two users
   */
  createChat(senderId: number, receiverId: number): Observable<number> {
    return from(this.loadToken()).pipe(
      switchMap(() => {
        const params = new HttpParams()
          .set('sender-id', senderId.toString())
          .set('receiver-id', receiverId.toString());
        
        return this.http.post<number>(`${this.apiUrl}/chat`, null, {
          headers: this.getHeaders(),
          params
        });
      })
    );
  }

  /**
   * Get or create chat between users
   */
  getOrCreateChat(user1Id: number, user2Id: number): Observable<{ canChat: boolean; chatId: number | null }> {
    return from(this.loadToken()).pipe(
      switchMap(() => {
        const params = new HttpParams()
          .set('user1Id', user1Id.toString())
          .set('user2Id', user2Id.toString());
        
        return this.http.get<{ canChat: boolean; chatId: number | null }>(
          `${this.apiUrl}/v2/chat/can-chat`,
          { headers: this.getHeaders(), params }
        );
      })
    );
  }

  /**
   * Mark messages as read in a chat
   */
  markMessagesAsRead(chatId: number): Observable<void> {
    return from(this.loadToken()).pipe(
      switchMap(() => {
        const params = new HttpParams().set('chat-id', chatId.toString());
        return this.http.patch<void>(`${this.apiUrl}/messages`, null, {
          headers: this.getHeaders(),
          params
        });
      })
    );
  }

  /**
   * Get total unread count for user
   */
  getTotalUnreadCount(userId: number): Observable<{ userId: number; totalUnreadCount: number }> {
    return from(this.loadToken()).pipe(
      switchMap(() => 
        this.http.get<{ userId: number; totalUnreadCount: number }>(
          `${this.apiUrl}/v2/chat/user/${userId}/unread-total`,
          { headers: this.getHeaders() }
        )
      )
    );
  }

  /**
   * Get chat details with messages
   */
  getChatDetails(chatId: number, userId: number): Observable<any> {
    return from(this.loadToken()).pipe(
      switchMap(() => {
        const params = new HttpParams().set('userId', userId.toString());
        return this.http.get<any>(`${this.apiUrl}/v2/chat/${chatId}/details`, {
          headers: this.getHeaders(),
          params
        });
      })
    );
  }

  // ==================== Helper Methods ====================

  async createChatForMission(assureId: number, reparateurId: number): Promise<number> {
    return firstValueFrom(this.createChat(reparateurId, assureId));
  }
}

