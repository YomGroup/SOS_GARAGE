import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule, DatePipe } from '@angular/common';

interface Message {
  id: number;
  content: string;
  timestamp: Date;
  isFromGarage: boolean;
}

@Component({
  selector: 'app-communication',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DatePipe],
  template: `
    <div class="bg-white rounded-lg shadow-lg p-6">
      <h2 class="text-2xl font-bold mb-6">Communication avec l'Assuré</h2>

      <!-- Zone de messages -->
      <div class="mb-6 h-96 overflow-y-auto border rounded-lg p-4 bg-gray-50">
        <div *ngFor="let message of messages" 
             [ngClass]="{'flex justify-end': message.isFromGarage}">
          <div [ngClass]="{
            'max-w-[70%] p-3 rounded-lg mb-4': true,
            'bg-blue-100': !message.isFromGarage,
            'bg-green-100': message.isFromGarage
          }">
            <p class="text-sm">{{ message.content }}</p>
            <span class="text-xs text-gray-500">
              {{ message.timestamp | date:'short' }}
            </span>
          </div>
        </div>
      </div>

      <!-- Formulaire d'envoi de message -->
      <form [formGroup]="messageForm" (ngSubmit)="onSendMessage()" class="space-y-4">
        <div class="flex space-x-4">
          <input type="text" 
                 formControlName="message" 
                 placeholder="Écrivez votre message..."
                 class="flex-1 rounded-md border-gray-300 shadow-sm">
          <button type="submit" 
                  [disabled]="!messageForm.valid"
                  class="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400">
            Envoyer
          </button>
        </div>
      </form>

      <!-- Notifications -->
      <div class="mt-6">
        <h3 class="text-lg font-semibold mb-4">Notifications</h3>
        <div class="space-y-2">
          <div class="flex items-center space-x-2">
            <input type="checkbox" id="notifyStatus" class="rounded text-blue-600">
            <label for="notifyStatus">Notifications de changement de statut</label>
          </div>
          <div class="flex items-center space-x-2">
            <input type="checkbox" id="notifyQuote" class="rounded text-blue-600">
            <label for="notifyQuote">Notifications de devis</label>
          </div>
          <div class="flex items-center space-x-2">
            <input type="checkbox" id="notifyInvoice" class="rounded text-blue-600">
            <label for="notifyInvoice">Notifications de facture</label>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class CommunicationComponent implements OnInit {
  messageForm: FormGroup;
  messages: Message[] = [
    {
      id: 1,
      content: 'Bonjour, nous avons bien reçu votre véhicule.',
      timestamp: new Date(),
      isFromGarage: true
    },
    {
      id: 2,
      content: 'Merci, quand pensez-vous terminer la réparation ?',
      timestamp: new Date(),
      isFromGarage: false
    }
  ];

  constructor(private fb: FormBuilder) {
    this.messageForm = this.fb.group({
      message: ['', Validators.required]
    });
  }

  ngOnInit(): void {}

  onSendMessage(): void {
    if (this.messageForm.valid) {
      const newMessage: Message = {
        id: this.messages.length + 1,
        content: this.messageForm.get('message')?.value,
        timestamp: new Date(),
        isFromGarage: true
      };
      this.messages.push(newMessage);
      this.messageForm.reset();
    }
  }
} 