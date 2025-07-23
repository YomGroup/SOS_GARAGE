import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { MessageService } from '../../services/messagerie.service';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { Message } from '../shared/models/Message.model';
import { ReparateurService } from '../../services/reparateur.service';
import { Reparateur } from '../../services/models-api.interface';

interface ReparateurLight {
  id: number;
  name: string;
  prenom: string;
  useridKeycloak: string;
}

@Component({
  selector: 'app-message',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './message.component.html',
  styleUrls: ['./message.component.css'],
})
export class MessageComponent implements OnInit, OnDestroy {
  messages: Message[] = [];
  newMessage = '';
  senderId: string = '';
  receiverId: string = '';
  isAssure: boolean = false;

  private messagesSub!: Subscription;
  private currentUserSub!: Subscription;
  conversationUsers: Reparateur[] = [];

  constructor(
    private messageService: MessageService,
    private authService: AuthService,
    private cdRef: ChangeDetectorRef,
    private reparateurService: ReparateurService
  ) { }
  loadConversationUsers(): void {
    this.messageService.getConversationUsers(this.senderId).then(userIds => {
      const requests = userIds.map(id =>
        this.reparateurService.getReparateurByKeycloakId(id).toPromise().catch(() => undefined)
      );

      Promise.all(requests)
        .then(reparateurs => {
          this.conversationUsers = reparateurs.filter((r): r is Reparateur => !!r);
          console.log(this.conversationUsers);
        })
        .catch(err => {
          console.error('Erreur récupération des garagistes :', err);
        });
    });
  }


  ngOnInit(): void {
    this.initializeUserData();
    this.setupMessageListener();

    if (this.isAssure) {
      this.loadConversationUsers();
    }
  }
  selectUser(userId: string): void {
    this.receiverId = userId;
    if (this.messagesSub) this.messagesSub.unsubscribe();
    this.setupMessageListener();
  }


  private initializeUserData(): void {
    const token = this.authService.getToken();
    if (!token) return;

    this.senderId = this.authService.getKeycloakId() ?? '';
    this.isAssure = this.authService.getRoles().includes('ROLE_ASSURE');
    this.receiverId = this.isAssure
      ? 'ff70d32c-6d5b-4ff7-a0ee-80ef63354ede' // ID garagiste
      : 'd85fd9c7-ba62-4aa7-bc67-0768a9f86b77'; // ID assuré
  }

  private setupMessageListener(): void {
    this.messagesSub = this.messageService
      .listenToMessages(this.senderId, this.receiverId)
      .subscribe({
        next: (messages) => {
          this.messages = messages;
          this.cdRef.detectChanges(); // Force la détection des changements
          this.scrollToBottom();
        },
        error: (err) => console.error('Error receiving messages:', err)
      });
  }

  sendMessage(): void {
    if (this.newMessage.trim()) {
      this.messageService.sendMessage(
        this.senderId,
        this.receiverId,
        this.newMessage.trim()
      ).then(() => {
        this.newMessage = '';
      }).catch(err => {
        console.error('Error sending message:', err);
      });
    }
  }

  private scrollToBottom(): void {
    setTimeout(() => {
      const chatContainer = document.querySelector('.chat-messages');
      if (chatContainer) {
        chatContainer.scrollTop = chatContainer.scrollHeight;
      }
    }, 100);
  }

  ngOnDestroy(): void {
    if (this.messagesSub) {
      this.messagesSub.unsubscribe();
    }
    if (this.currentUserSub) {
      this.currentUserSub.unsubscribe();
    }
  }
}