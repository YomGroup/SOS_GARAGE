import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../../../../../../services/auth.service';
import { MessageService } from '../../../../../../../services/messagerie.service';

@Component({
  selector: 'app-send-message-dialog',
  templateUrl: './send-message-dialog.component.html',
  styleUrls: ['./send-message-dialog.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    FormsModule,
    MatButtonModule,
    MatSnackBarModule
  ]
})
export class SendMessageDialogComponent {
  messageContent: string = '';

  constructor(
    public dialogRef: MatDialogRef<SendMessageDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { receiverId: string, receiverName: string },
    @Inject(AuthService) private authService: AuthService,
    @Inject(MessageService) private messageService: MessageService,
    private snackBar: MatSnackBar
  ) { }

  onNoClick(): void {
    this.dialogRef.close();
  }

  sendMessage(): void {
    const senderId = this.authService.getKeycloakId();
    if (!senderId) {
      this.snackBar.open('Erreur: Impossible de récupérer votre identifiant.', 'Fermer', { duration: 3000 });
      return;
    }
    this.messageService.sendMessage(senderId, this.data.receiverId, this.messageContent)
      .then(() => {
        this.snackBar.open('Message envoyé avec succès!', 'Fermer', { duration: 3000 });
        this.dialogRef.close(true);
      })
      .catch((err: any) => {
        this.snackBar.open('Erreur lors de l\'envoi du message.', 'Fermer', { duration: 3000 });
        console.error(err);
      });
  }
}
