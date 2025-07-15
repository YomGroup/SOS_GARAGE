import { Component, OnInit } from '@angular/core';
import { MessageService } from '../../services/messagerie.service';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-message',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './message.component.html',
})
export class MessageComponent implements OnInit {
  messages: any[] = [];
  senderId: string = '';
  receiverId: string = '';
  newMessage = '';
  isAssure: boolean = false;

  constructor(
    private msgService: MessageService,
    private authService: AuthService
  ) { }

  async ngOnInit() {
    const token = this.authService.getToken();
    if (!token) return;

    this.senderId = this.authService.getKeycloakId() ?? '';
    const roles = this.authService.getRoles();
    this.isAssure = roles.includes('ROLE_ASSURE');

    // Si l'utilisateur est un assuré, le garagiste est en face
    if (this.isAssure) {
      this.receiverId = 'f00ffc86-ebc3-4746-8319-0832211ca1ff';
    } else {
      // Garagiste simule un sinistré pour le test
      this.receiverId = 'assure-test-id';
    }

    this.msgService.listenToMessages(this.senderId, this.receiverId, (msgs) => {
      this.messages = msgs;
    });
  }

  send() {
    if (this.isAssure && this.messages.length === 0) {
      alert('Vous ne pouvez pas initier une conversation.');
      return;
    }

    if (this.newMessage.trim()) {
      this.msgService.sendMessage(this.senderId, this.receiverId, this.newMessage);
      this.newMessage = '';
    }
  }
}
