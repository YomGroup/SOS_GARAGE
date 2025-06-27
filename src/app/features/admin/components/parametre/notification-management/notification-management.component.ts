import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-notification-management',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './notification-management.component.html',
  styleUrls: ['./notification-management.component.css']
})
export class NotificationManagementComponent {
  // Types de notifications Email
  emailNewCase = true;
  emailStatusUpdate = true;
  emailReminder = false;

  // Types de notifications Push
  pushNewCase = true;
  pushStatusUpdate = true;
  pushUrgent = true;

  // Types de notifications SMS
  smsUrgent = true;
  smsSystem = false;

  // Fréquence
  emailFrequency = 'immediate';
  pushFrequency = 'immediate';

  // Heures
  startTime = '08:00';
  endTime = '18:00';
  weekendNotifications = false;

  saveNotifications() {
    console.log('Paramètres de notifications sauvegardés:', {
      email: {
        newCase: this.emailNewCase,
        statusUpdate: this.emailStatusUpdate,
        reminder: this.emailReminder,
        frequency: this.emailFrequency
      },
      push: {
        newCase: this.pushNewCase,
        statusUpdate: this.pushStatusUpdate,
        urgent: this.pushUrgent,
        frequency: this.pushFrequency
      },
      sms: {
        urgent: this.smsUrgent,
        system: this.smsSystem
      },
      time: {
        start: this.startTime,
        end: this.endTime,
        weekend: this.weekendNotifications
      }
    });
  }

  resetNotifications() {
    this.emailNewCase = true;
    this.emailStatusUpdate = true;
    this.emailReminder = false;
    this.pushNewCase = true;
    this.pushStatusUpdate = true;
    this.pushUrgent = true;
    this.smsUrgent = true;
    this.smsSystem = false;
    this.emailFrequency = 'immediate';
    this.pushFrequency = 'immediate';
    this.startTime = '08:00';
    this.endTime = '18:00';
    this.weekendNotifications = false;
  }
} 