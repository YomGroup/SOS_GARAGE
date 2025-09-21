import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-preferences-management',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './preferences-management.component.html',
  styleUrls: ['./preferences-management.component.css']
})
export class PreferencesManagementComponent {
  selectedLanguage = 'fr';
  selectedTheme = 'light';
  selectedTimezone = 'Europe/Paris';
  selectedDateFormat = 'DD/MM/YYYY';
  emailNotifications = true;
  pushNotifications = true;
  smsNotifications = false;

  savePreferences() {
    // Logique pour sauvegarder les préférences
    console.log('Préférences sauvegardées:', {
      language: this.selectedLanguage,
      theme: this.selectedTheme,
      timezone: this.selectedTimezone,
      dateFormat: this.selectedDateFormat,
      emailNotifications: this.emailNotifications,
      pushNotifications: this.pushNotifications,
      smsNotifications: this.smsNotifications
    });
  }

  resetPreferences() {
    // Réinitialiser aux valeurs par défaut
    this.selectedLanguage = 'fr';
    this.selectedTheme = 'light';
    this.selectedTimezone = 'Europe/Paris';
    this.selectedDateFormat = 'DD/MM/YYYY';
    this.emailNotifications = true;
    this.pushNotifications = true;
    this.smsNotifications = false;
  }
} 