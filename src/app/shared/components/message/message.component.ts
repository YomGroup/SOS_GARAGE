import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { MessageService } from '../../../../services/messagerie.service';
import { AuthService } from '../../../../services/auth.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { Message } from '../../models/Message.model';
import { ReparateurService } from '../../../../services/reparateur.service';
import { Reparateur } from '../../../../services/models-api.interface';
import { ActivatedRoute } from '@angular/router';
import { NgZone } from '@angular/core';

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
  selectedUser?: Reparateur;

  private messagesSub!: Subscription;
  private currentUserSub!: Subscription;
  conversationUsers: Reparateur[] = [];

  constructor(
    private messageService: MessageService,
    private authService: AuthService,
    private cdRef: ChangeDetectorRef,
    private reparateurService: ReparateurService,
    private route: ActivatedRoute,
    private ngZone: NgZone
  ) { }

  async loadConversationUsers(): Promise<void> {
    try {
      const userIds = await this.messageService.getConversationUsers(this.senderId);

      if (this.isAssure) {
        // Si c'est un assuré, on récupère les infos des garagistes
        const requests = userIds.map(id =>
          this.reparateurService.getReparateurByKeycloakId(id).toPromise().catch(() => undefined)
        );

        const reparateurs = await Promise.all(requests);
        this.conversationUsers = reparateurs.filter((r): r is Reparateur => !!r);
        console.log('Garagistes trouvés:', this.conversationUsers);
      } else {
        // Sinon, on affiche simplement les IDs dans la liste
        this.conversationUsers = userIds.map(id => ({
          id: 0,
          name: 'Utilisateur',
          prenom: id.slice(0, 6) + '...',
          useridKeycloak: id,
          email: '',
          telephone: '',
          adresse: '',
          codePostal: '',
          ville: '',
          commission: 0,
          siret: '',
          nomDuGarage: '',
          servicePropose: [],
          missions: [],
          anneeExperience: 0,
          nombreVehiculeReparee: 0,
          nombreEmployes: 0,
          logo: '',
          imagesReparations: []
        }));
      }

      this.cdRef.detectChanges();
    } catch (error) {
      console.error('Erreur lors du chargement des utilisateurs de conversation:', error);
    }
  }

  async ngOnInit(): Promise<void> {
    await this.initializeUserData();

    // Charger les utilisateurs de conversation
    await this.loadConversationUsers();

    // Écouter les paramètres de route
    this.route.queryParams.subscribe(params => {
      const targetId = params['receiverId'];
      if (targetId) {
        this.selectUser(targetId);
      }
    });
  }

  selectUser(userId: string): void {
    console.log('Sélection de l\'utilisateur:', userId);
    this.receiverId = userId;
    this.selectedUser = this.conversationUsers.find(u => u.useridKeycloak === userId);

    // Arrêter l'ancienne souscription si elle existe
    if (this.messagesSub) {
      this.messagesSub.unsubscribe();
    }

    // Démarrer l'écoute des messages
    this.setupMessageListener();
  }

  private async initializeUserData(): Promise<void> {
    const token = this.authService.getToken();
    if (!token) return;

    this.senderId = this.authService.getKeycloakId() ?? '';
    this.isAssure = this.authService.getRoles().includes('ROLE_ASSURE');

    console.log('Utilisateur initialisé:', { senderId: this.senderId, isAssure: this.isAssure });
  }

  private setupMessageListener(): void {
    // Vérifier que nous avons bien un senderId et receiverId
    if (!this.senderId || !this.receiverId) {
      console.warn('SenderId ou ReceiverId manquant:', { senderId: this.senderId, receiverId: this.receiverId });
      return;
    }

    console.log('Configuration de l\'écoute des messages entre:', this.senderId, 'et', this.receiverId);

    this.messagesSub = this.messageService
      .listenToMessages(this.senderId, this.receiverId)
      .subscribe({
        next: (messages) => {
          console.log('Messages reçus:', messages.length);
          this.ngZone.run(() => {
            this.messages = messages;
            this.cdRef.detectChanges();
            this.scrollToBottom();
          });
        },
        error: (err) => {
          console.error('Erreur lors de la réception des messages:', err);
        }
      });
  }

  async sendMessage(): Promise<void> {
    if (this.newMessage.trim() && this.receiverId) {
      try {
        console.log('Envoi du message:', {
          from: this.senderId,
          to: this.receiverId,
          message: this.newMessage.trim()
        });

        await this.messageService.sendMessage(
          this.senderId,
          this.receiverId,
          this.newMessage.trim()
        );

        this.newMessage = '';
        console.log('Message envoyé avec succès');
      } catch (err) {
        console.error('Erreur lors de l\'envoi du message:', err);
      }
    } else {
      console.warn('Message vide ou pas de destinataire sélectionné');
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