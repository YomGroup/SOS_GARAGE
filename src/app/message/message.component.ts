// message.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Message {
  id: string;
  expediteur: string;
  objet: string;
  contenu: string;
  dateEnvoi: string;
  heureEnvoi: string;
  lu: boolean;
  type: 'recu' | 'envoye' | 'system';
  priorite: 'normale' | 'importante' | 'urgente';
  pieceJointe?: string[];
  sinistresId?: string;
}

interface Conversation {
  id: string;
  participants: string[];
  derniereActivite: string;
  messages: Message[];
  sujet: string;
  statut: 'active' | 'fermee';
}

@Component({
  selector: 'app-message',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './message.component.html',
  styleUrls: ['./message.component.css']
})
export class MessageComponent implements OnInit {
  conversations: Conversation[] = [];
  selectedConversation: Conversation | null = null;
  newMessage: string = '';
  searchTerm: string = '';
  filterType: string = 'tous';
  showNewMessageModal: boolean = false;

  constructor() { }

  ngOnInit(): void {
    this.loadConversations();
  }

  loadConversations(): void {
    // Données de test
    this.conversations = [
      {
        id: 'CONV-001',
        participants: ['Expert Auto', 'Support SosMonGarage'],
        derniereActivite: 'Il y a 15 min',
        sujet: 'Expertise Mercedes AMG - SIN-001',
        statut: 'active',
        messages: [
          {
            id: 'MSG-001',
            expediteur: 'Expert Auto',
            objet: 'Rapport d\'expertise Mercedes AMG',
            contenu: 'Bonjour, l\'expertise de votre véhicule Mercedes AMG est terminée. Les réparations sont estimées à 3 500€. Vous trouverez le rapport détaillé en pièce jointe.',
            dateEnvoi: '10 Janvier 2025',
            heureEnvoi: '14:30',
            lu: false,
            type: 'recu',
            priorite: 'importante',
            pieceJointe: ['rapport_expertise_mercedes.pdf'],
            sinistresId: 'SIN-001'
          },
          {
            id: 'MSG-002',
            expediteur: 'Support SosMonGarage',
            objet: 'Documents à signer',
            contenu: 'Merci de signer les documents suivants pour finaliser votre dossier de sinistre.',
            dateEnvoi: '10 Janvier 2025',
            heureEnvoi: '09:15',
            lu: true,
            type: 'recu',
            priorite: 'normale',
            pieceJointe: ['document_1.pdf', 'document_2.pdf'],
            sinistresId: 'SIN-001'
          }
        ]
      },
      {
        id: 'CONV-002',
        participants: ['Service Client', 'Gestionnaire Sinistre'],
        derniereActivite: 'Il y a 2 heures',
        sujet: 'Question sur l\'indemnisation',
        statut: 'active',
        messages: [
          {
            id: 'MSG-003',
            expediteur: 'Service Client',
            objet: 'Délai d\'indemnisation',
            contenu: 'Bonjour, pouvez-vous me donner une estimation du délai pour recevoir l\'indemnisation de mon sinistre ?',
            dateEnvoi: '10 Janvier 2025',
            heureEnvoi: '12:45',
            lu: true,
            type: 'envoye',
            priorite: 'normale'
          },
          {
            id: 'MSG-004',
            expediteur: 'Gestionnaire Sinistre',
            objet: 'Re: Délai d\'indemnisation',
            contenu: 'Bonjour, votre dossier est en cours de finalisation. L\'indemnisation sera versée sous 5 à 7 jours ouvrés.',
            dateEnvoi: '10 Janvier 2025',
            heureEnvoi: '13:20',
            lu: true,
            type: 'recu',
            priorite: 'normale'
          }
        ]
      },
      {
        id: 'CONV-003',
        participants: ['Système'],
        derniereActivite: 'Il y a 1 jour',
        sujet: 'Notifications système',
        statut: 'active',
        messages: [
          {
            id: 'MSG-005',
            expediteur: 'Système SosMonGarage',
            objet: 'Rappel: Documents en attente',
            contenu: 'Vous avez des documents en attente de signature pour le sinistre SIN-002. Merci de les traiter dans les plus brefs délais.',
            dateEnvoi: '09 Janvier 2025',
            heureEnvoi: '10:00',
            lu: true,
            type: 'system',
            priorite: 'importante',
            sinistresId: 'SIN-002'
          }
        ]
      }
    ];
  }

  selectConversation(conversation: Conversation): void {
    this.selectedConversation = conversation;
    // Marquer tous les messages comme lus
    conversation.messages.forEach(msg => {
      if (msg.type === 'recu' || msg.type === 'system') {
        msg.lu = true;
      }
    });
  }

  sendMessage(): void {
    if (this.newMessage.trim() && this.selectedConversation) {
      const newMsg: Message = {
        id: 'MSG-' + Date.now(),
        expediteur: 'Said',
        objet: 'Re: ' + this.selectedConversation.sujet,
        contenu: this.newMessage,
        dateEnvoi: new Date().toLocaleDateString('fr-FR'),
        heureEnvoi: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        lu: true,
        type: 'envoye',
        priorite: 'normale'
      };

      this.selectedConversation.messages.push(newMsg);
      this.selectedConversation.derniereActivite = 'À l\'instant';
      this.newMessage = '';
    }
  }

  getUnreadCount(): number {
    return this.conversations.reduce((total, conv) => {
      return total + conv.messages.filter(msg =>
        (msg.type === 'recu' || msg.type === 'system') && !msg.lu
      ).length;
    }, 0);
  }

  getConversationUnreadCount(conversation: Conversation): number {
    return conversation.messages.filter(msg =>
      (msg.type === 'recu' || msg.type === 'system') && !msg.lu
    ).length;
  }

  getPriorityClass(priorite: string): string {
    switch (priorite) {
      case 'urgente':
        return 'priority-urgent';
      case 'importante':
        return 'priority-important';
      default:
        return 'priority-normal';
    }
  }

  getTypeIcon(type: string): string {
    switch (type) {
      case 'recu':
        return 'fas fa-arrow-down text-success';
      case 'envoye':
        return 'fas fa-arrow-up text-primary';
      case 'system':
        return 'fas fa-cog text-warning';
      default:
        return 'fas fa-envelope';
    }
  }

  downloadAttachment(filename: string): void {
    console.log('Downloading:', filename);
    // Logique de téléchargement
  }

  openNewMessageModal(): void {
    this.showNewMessageModal = true;
  }

  closeNewMessageModal(): void {
    this.showNewMessageModal = false;
  }

  markAllAsRead(): void {
    this.conversations.forEach(conv => {
      conv.messages.forEach(msg => {
        if (msg.type === 'recu' || msg.type === 'system') {
          msg.lu = true;
        }
      });
    });
  }

  deleteConversation(conversation: Conversation): void {
    const index = this.conversations.indexOf(conversation);
    if (index > -1) {
      this.conversations.splice(index, 1);
      if (this.selectedConversation?.id === conversation.id) {
        this.selectedConversation = null;
      }
    }
  }

  getFilteredConversations(): Conversation[] {
    let filtered = this.conversations;

    // Filtre par terme de recherche
    if (this.searchTerm) {
      filtered = filtered.filter(conv =>
        conv.sujet.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        conv.participants.some(p => p.toLowerCase().includes(this.searchTerm.toLowerCase())) ||
        conv.messages.some(msg =>
          msg.contenu.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
          msg.objet.toLowerCase().includes(this.searchTerm.toLowerCase())
        )
      );
    }

    // Filtre par type
    if (this.filterType !== 'tous') {
      filtered = filtered.filter(conv => {
        switch (this.filterType) {
          case 'non-lus':
            return this.getConversationUnreadCount(conv) > 0;
          case 'importants':
            return conv.messages.some(msg => msg.priorite === 'importante' || msg.priorite === 'urgente');
          case 'systeme':
            return conv.messages.some(msg => msg.type === 'system');
          default:
            return true;
        }
      });
    }

    return filtered;
  }

  hasAttachments(conversation: Conversation): boolean {
    return conversation.messages.some(m => m.pieceJointe && m.pieceJointe.length > 0);
  }
}