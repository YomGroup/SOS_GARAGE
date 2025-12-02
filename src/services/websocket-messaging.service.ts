import { Injectable, NgZone } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject, BehaviorSubject, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { environment } from '../environments/environment';
import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

// DTOs correspondant au backend
export interface ChatMessageDto {
  id?: number;
  senderId: number;
  receiverId: number;
  content: string;
  timestamp?: string;
  status?: string; // SENT, DELIVERED, READ, FAILED
  type?: string; // MESSAGE, STATUS_UPDATE, READ_RECEIPT, TYPING, ERROR
  messageType?: string; // TEXT, IMAGE, etc.
  chatId: number;
}

export interface MessageResponse {
  id: number;
  content: string;
  senderId: number;
  receiverId: number;
  type: string;
  state: string;
  createdAt: string;
  chatId: number;
}

export interface ChatResponse {
  id: number;
  name: string;
  senderId: number;
  receiverId: number;
  unreadCount?: number;
  lastMessage?: string;
  lastMessageTime?: string;
}

export interface EnhancedChatResponse {
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

export interface ChatDetailsResponse {
  chat: ChatResponse;
  messages: MessageResponse[];
  unreadCount: number;
  lastMessage: MessageResponse | null;
  otherUserOnline: boolean;
  canChat: boolean;
}

export interface UnreadCountResponse {
  userId: number;
  totalUnreadCount: number;
}

@Injectable({
  providedIn: 'root'
})
export class WebSocketMessagingService {
  private stompClient: Client | null = null;
  private connected$ = new BehaviorSubject<boolean>(false);
  private messageSubject = new Subject<ChatMessageDto>();
  private typingSubject = new Subject<{ senderId: number; isTyping: boolean }>();
  private readReceiptSubject = new Subject<{ chatId: number; readerId: number }>();
  private onlineStatusSubject = new Subject<{ userId: number; isOnline: boolean }>();
  
  private subscriptions: Map<string, StompSubscription> = new Map();
  private currentUserId: number | null = null;

  private apiUrl = environment.apiUrl;
  private wsUrl = environment.apiUrl.replace('/api', '').replace('/V1', '/V1') + '/ws';

  constructor(
    private http: HttpClient,
    private ngZone: NgZone
  ) {
    console.log('WebSocket URL:', this.wsUrl);
  }

  // ============ WebSocket Connection ============

  /**
   * Connecte au serveur WebSocket
   */
  connect(userId: number): void {
    if (this.stompClient?.active) {
      console.log('WebSocket already connected');
      return;
    }

    this.currentUserId = userId;
    
    this.stompClient = new Client({
      webSocketFactory: () => new SockJS(this.wsUrl),
      debug: (str) => {
        console.log('STOMP:', str);
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    this.stompClient.onConnect = (frame) => {
      console.log('WebSocket connected:', frame);
      this.ngZone.run(() => {
        this.connected$.next(true);
      });
      
      // S'abonner aux messages de l'utilisateur
      this.subscribeToUserQueue(userId);
      
      // Notifier que l'utilisateur est en ligne
      this.sendUserOnline(userId);
    };

    this.stompClient.onDisconnect = () => {
      console.log('WebSocket disconnected');
      this.ngZone.run(() => {
        this.connected$.next(false);
      });
    };

    this.stompClient.onStompError = (frame) => {
      console.error('STOMP error:', frame);
    };

    this.stompClient.activate();
  }

  /**
   * Déconnecte du serveur WebSocket
   */
  disconnect(): void {
    if (this.currentUserId) {
      this.sendUserOffline(this.currentUserId);
    }
    
    this.subscriptions.forEach((sub) => sub.unsubscribe());
    this.subscriptions.clear();
    
    if (this.stompClient?.active) {
      this.stompClient.deactivate();
    }
    
    this.connected$.next(false);
    this.currentUserId = null;
  }

  /**
   * S'abonne à la queue de messages de l'utilisateur
   */
  private subscribeToUserQueue(userId: number): void {
    if (!this.stompClient?.active) return;

    // Messages entrants
    const messageSub = this.stompClient.subscribe(
      `/user/${userId}/queue/messages`,
      (message: IMessage) => {
        const chatMessage: ChatMessageDto = JSON.parse(message.body);
        this.ngZone.run(() => {
          this.messageSubject.next(chatMessage);
        });
      }
    );
    this.subscriptions.set(`messages-${userId}`, messageSub);

    // Indicateur de frappe
    const typingSub = this.stompClient.subscribe(
      `/user/${userId}/queue/typing`,
      (message: IMessage) => {
        const typingData = JSON.parse(message.body);
        this.ngZone.run(() => {
          this.typingSubject.next(typingData);
        });
      }
    );
    this.subscriptions.set(`typing-${userId}`, typingSub);

    // Erreurs
    const errorSub = this.stompClient.subscribe(
      `/user/${userId}/queue/errors`,
      (message: IMessage) => {
        console.error('WebSocket error:', JSON.parse(message.body));
      }
    );
    this.subscriptions.set(`errors-${userId}`, errorSub);
  }

  /**
   * S'abonne aux lectures de messages d'un chat
   */
  subscribeToChatReadReceipts(chatId: number): void {
    if (!this.stompClient?.active) return;

    const key = `read-${chatId}`;
    if (this.subscriptions.has(key)) return;

    const sub = this.stompClient.subscribe(
      `/topic/chat/${chatId}/read`,
      (message: IMessage) => {
        const readData = JSON.parse(message.body);
        this.ngZone.run(() => {
          this.readReceiptSubject.next(readData);
        });
      }
    );
    this.subscriptions.set(key, sub);
  }

  // ============ WebSocket Messages ============

  /**
   * Envoie un message via WebSocket
   */
  sendMessage(message: ChatMessageDto): void {
    if (!this.stompClient?.active) {
      console.error('WebSocket not connected');
      return;
    }

    this.stompClient.publish({
      destination: '/app/chat.send',
      body: JSON.stringify({
        ...message,
        timestamp: new Date().toISOString(),
        status: 'SENT',
        type: 'MESSAGE',
        messageType: message.messageType || 'TEXT'
      })
    });
  }

  /**
   * Envoie un indicateur de frappe
   */
  sendTyping(senderId: number, receiverId: number, isTyping: boolean): void {
    if (!this.stompClient?.active) return;

    this.stompClient.publish({
      destination: '/app/chat.typing',
      body: JSON.stringify({ senderId, receiverId, isTyping })
    });
  }

  /**
   * Envoie un accusé de lecture
   */
  sendReadReceipt(chatId: number, readerId: number): void {
    if (!this.stompClient?.active) return;

    this.stompClient.publish({
      destination: '/app/chat.read',
      body: JSON.stringify({ chatId, readerId })
    });
  }

  /**
   * Notifie que l'utilisateur est en ligne
   */
  private sendUserOnline(userId: number): void {
    if (!this.stompClient?.active) return;

    this.stompClient.publish({
      destination: '/app/chat.userOnline',
      body: JSON.stringify({ userId, sessionId: Date.now().toString() })
    });
  }

  /**
   * Notifie que l'utilisateur est hors ligne
   */
  private sendUserOffline(userId: number): void {
    if (!this.stompClient?.active) return;

    this.stompClient.publish({
      destination: '/app/chat.userOffline',
      body: JSON.stringify({ userId })
    });
  }

  // ============ Observables ============

  /**
   * Observable des messages entrants
   */
  get messages$(): Observable<ChatMessageDto> {
    return this.messageSubject.asObservable();
  }

  /**
   * Observable de l'état de connexion
   */
  get isConnected$(): Observable<boolean> {
    return this.connected$.asObservable();
  }

  /**
   * Observable des indicateurs de frappe
   */
  get typing$(): Observable<{ senderId: number; isTyping: boolean }> {
    return this.typingSubject.asObservable();
  }

  /**
   * Observable des accusés de lecture
   */
  get readReceipts$(): Observable<{ chatId: number; readerId: number }> {
    return this.readReceiptSubject.asObservable();
  }

  // ============ REST API ============

  /**
   * Récupère les chats enrichis d'un utilisateur
   */
  getEnhancedChats(userId: number): Observable<EnhancedChatResponse[]> {
    return this.http.get<EnhancedChatResponse[]>(
      `${this.apiUrl}/v2/chat/user/${userId}/enhanced`
    ).pipe(
      catchError(err => {
        console.error('Error fetching enhanced chats:', err);
        return of([]);
      })
    );
  }

  /**
   * Récupère les détails d'un chat
   */
  getChatDetails(chatId: number, userId: number): Observable<ChatDetailsResponse | null> {
    return this.http.get<ChatDetailsResponse>(
      `${this.apiUrl}/v2/chat/${chatId}/details?userId=${userId}`
    ).pipe(
      catchError(err => {
        console.error('Error fetching chat details:', err);
        return of(null);
      })
    );
  }

  /**
   * Vérifie si deux utilisateurs peuvent discuter et crée/récupère le chat
   */
  canUsersChat(user1Id: number, user2Id: number): Observable<{ canChat: boolean; chatId: number | null }> {
    return this.http.get<{ canChat: boolean; chatId: number | null }>(
      `${this.apiUrl}/v2/chat/can-chat?user1Id=${user1Id}&user2Id=${user2Id}`
    ).pipe(
      catchError(err => {
        console.error('Error checking can chat:', err);
        return of({ canChat: false, chatId: null });
      })
    );
  }

  /**
   * Récupère le total des messages non lus
   */
  getTotalUnreadCount(userId: number): Observable<number> {
    return this.http.get<UnreadCountResponse>(
      `${this.apiUrl}/v2/chat/user/${userId}/unread-total`
    ).pipe(
      map(res => res.totalUnreadCount),
      catchError(err => {
        console.error('Error fetching unread count:', err);
        return of(0);
      })
    );
  }

  /**
   * Récupère les messages d'un chat
   */
  getChatMessages(chatId: number): Observable<MessageResponse[]> {
    return this.http.get<MessageResponse[]>(
      `${this.apiUrl}/messages/chat/${chatId}`
    ).pipe(
      catchError(err => {
        console.error('Error fetching chat messages:', err);
        return of([]);
      })
    );
  }

  /**
   * Marque les messages comme lus via API REST
   */
  markMessagesAsRead(chatId: number): Observable<void> {
    return this.http.patch<void>(
      `${this.apiUrl}/messages?chat-id=${chatId}`,
      {}
    ).pipe(
      catchError(err => {
        console.error('Error marking messages as read:', err);
        return of(undefined);
      })
    );
  }

  /**
   * Envoie un message via API REST (fallback si WebSocket non disponible)
   */
  sendMessageRest(message: {
    content: string;
    senderId: number;
    receiverId: number;
    chatId: number;
    type?: string;
  }): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/messages`, {
      ...message,
      type: message.type || 'TEXT'
    }).pipe(
      catchError(err => {
        console.error('Error sending message via REST:', err);
        throw err;
      })
    );
  }
}

