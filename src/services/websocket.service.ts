import { Injectable } from '@angular/core';
import { Client, IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { BehaviorSubject, Subject } from 'rxjs';

export interface WebSocketMessage {
  id?: number;
  chatId: number;
  senderId: number;
  receiverId: number;
  content: string;
  messageType: string;
  timestamp: string;
  status: string;
  type: string;
}

export interface TypingIndicator {
  senderId: number;
  receiverId: number;
  chatId: number;
  isTyping: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  private client: Client | null = null;
  private userId: number | null = null;
  
  // Observables
  public connectionStatus$ = new BehaviorSubject<boolean>(false);
  public newMessage$ = new Subject<WebSocketMessage>();
  public typingIndicator$ = new Subject<TypingIndicator>();
  public readReceipt$ = new Subject<any>();
  
  constructor() {}

  /**
   * Connexion au WebSocket
   */
  connect(userId: number, token: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (this.client && this.connectionStatus$.value) {
      console.log('🔌 Already connected to WebSocket');
      resolve();
      return;
    }

    this.userId = userId;

    this.client = new Client({
      webSocketFactory: () => {
        // ✅ CORRECTION : Un seul protocole HTTPS
        return new SockJS('http://localhost:8083/V1/api/ws');
      },
      
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },

      debug: (str) => {
        console.log('🔌 STOMP:', str);
      },

      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,

      onConnect: () => {
        console.log('✅ WebSocket connected for user:', userId);
        this.connectionStatus$.next(true);
        this.subscribe();
        resolve();
      },

      onDisconnect: () => {
        console.log('❌ WebSocket disconnected');
        this.connectionStatus$.next(false);
      },

      onStompError: (frame) => {
        console.error('❌ STOMP error:', frame);
        this.connectionStatus$.next(false);
        reject(new Error('WebSocket connection failed'));
      },
    });

    this.client.activate();
  });
}

  /**
   * S'abonner aux canaux WebSocket
   */
  private subscribe(): void {
    if (!this.client || !this.userId) return;

    // S'abonner aux messages privés
    this.client.subscribe(`/user/queue/messages`, (message: IMessage) => {
      try {
        const data: WebSocketMessage = JSON.parse(message.body);
        console.log('📨 Message received:', data);
        this.newMessage$.next(data);
      } catch (error) {
        console.error('Error parsing message:', error);
      }
    });

    // S'abonner aux indicateurs de frappe
    this.client.subscribe(`/user/queue/typing`, (message: IMessage) => {
      try {
        const data: TypingIndicator = JSON.parse(message.body);
        console.log('⌨️ Typing indicator:', data);
        this.typingIndicator$.next(data);
      } catch (error) {
        console.error('Error parsing typing indicator:', error);
      }
    });

    // S'abonner aux accusés de lecture
    this.client.subscribe(`/user/queue/receipts`, (message: IMessage) => {
      try {
        const data = JSON.parse(message.body);
        console.log('👁️ Read receipt:', data);
        this.readReceipt$.next(data);
      } catch (error) {
        console.error('Error parsing read receipt:', error);
      }
    });

    console.log('✅ Subscribed to WebSocket channels');
  }

  /**
   * Envoyer un message
   */
  sendMessage(message: {
    chatId: number;
    senderId: number;
    receiverId: number;
    content: string;
    messageType?: string;
  }): boolean {
    if (!this.client || !this.connectionStatus$.value) {
      console.error('❌ WebSocket not connected');
      return false;
    }

    try {
      this.client.publish({
        destination: '/app/chat.send',
        body: JSON.stringify({
          chatId: message.chatId,
          senderId: message.senderId,
          receiverId: message.receiverId,
          content: message.content,
          messageType: message.messageType || 'TEXT',
        }),
      });

      console.log('✅ Message sent via WebSocket');
      return true;
    } catch (error) {
      console.error('❌ Error sending message:', error);
      return false;
    }
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
    if (!this.client || !this.connectionStatus$.value) return false;

    try {
      this.client.publish({
        destination: '/app/chat.typing',
        body: JSON.stringify({
          senderId,
          receiverId,
          chatId,
          isTyping,
        }),
      });

      return true;
    } catch (error) {
      console.error('❌ Error sending typing indicator:', error);
      return false;
    }
  }

  /**
   * Marquer les messages comme lus
   */
  sendReadReceipt(chatId: number, readerId: number, senderId: number): boolean {
    if (!this.client || !this.connectionStatus$.value) return false;

    try {
      this.client.publish({
        destination: '/app/chat.read',
        body: JSON.stringify({
          chatId,
          readerId,
          senderId,
        }),
      });

      console.log('✅ Read receipt sent');
      return true;
    } catch (error) {
      console.error('❌ Error sending read receipt:', error);
      return false;
    }
  }

  /**
   * Marquer l'utilisateur en ligne
   */
  sendUserOnline(userId: number): boolean {
    if (!this.client || !this.connectionStatus$.value) return false;

    try {
      this.client.publish({
        destination: '/app/user.online',
        body: JSON.stringify({ userId }),
      });

      return true;
    } catch (error) {
      console.error('❌ Error sending user online:', error);
      return false;
    }
  }

  /**
   * Marquer l'utilisateur hors ligne
   */
  sendUserOffline(userId: number): boolean {
    if (!this.client || !this.connectionStatus$.value) return false;

    try {
      this.client.publish({
        destination: '/app/user.offline',
        body: JSON.stringify({ userId }),
      });

      return true;
    } catch (error) {
      console.error('❌ Error sending user offline:', error);
      return false;
    }
  }

  /**
   * Déconnexion
   */
  disconnect(): void {
    if (this.userId) {
      this.sendUserOffline(this.userId);
    }
    
    if (this.client) {
      this.client.deactivate();
      this.client = null;
    }
    
    this.connectionStatus$.next(false);
    this.userId = null;
  }

  /**
   * Obtenir le statut de connexion
   */
  isConnected(): boolean {
    return this.connectionStatus$.value;
  }
}