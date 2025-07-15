import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-security-management',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './security-management.component.html',
  styleUrls: ['./security-management.component.css']
})
export class SecurityManagementComponent {
  // Mot de passe
  currentPassword = '';
  newPassword = '';
  confirmPassword = '';
  showCurrentPassword = false;
  showNewPassword = false;
  showConfirmPassword = false;

  // Authentification à deux facteurs
  twoFactorEnabled = false;

  // Sessions actives
  activeSessions = [
    {
      id: 1,
      device: 'Chrome sur Windows',
      location: 'Paris, France',
      lastActivity: 'Il y a 2 minutes',
      type: 'desktop',
      current: true
    },
    {
      id: 2,
      device: 'Safari sur iPhone',
      location: 'Lyon, France',
      lastActivity: 'Il y a 1 heure',
      type: 'mobile',
      current: false
    },
    {
      id: 3,
      device: 'Firefox sur MacBook',
      location: 'Marseille, France',
      lastActivity: 'Il y a 3 heures',
      type: 'desktop',
      current: false
    }
  ];

  // Historique de connexion
  loginHistory = [
    {
      success: true,
      date: 'Aujourd\'hui, 14:30',
      ip: '192.168.1.100',
      location: 'Paris, France'
    },
    {
      success: false,
      date: 'Aujourd\'hui, 14:25',
      ip: '192.168.1.101',
      location: 'Paris, France'
    },
    {
      success: true,
      date: 'Hier, 09:15',
      ip: '192.168.1.100',
      location: 'Paris, France'
    }
  ];

  get passwordStrengthClass(): string {
    if (!this.newPassword) return '';
    if (this.newPassword.length < 6) return 'weak';
    if (this.newPassword.length < 8) return 'fair';
    if (this.newPassword.length < 10) return 'good';
    return 'strong';
  }

  get passwordStrengthText(): string {
    switch (this.passwordStrengthClass) {
      case 'weak': return 'Faible';
      case 'fair': return 'Moyen';
      case 'good': return 'Bon';
      case 'strong': return 'Fort';
      default: return '';
    }
  }

  get passwordsMatch(): boolean {
    return this.newPassword === this.confirmPassword && this.newPassword.length > 0;
  }

  togglePasswordVisibility(field: string) {
    switch (field) {
      case 'currentPassword':
        this.showCurrentPassword = !this.showCurrentPassword;
        break;
      case 'newPassword':
        this.showNewPassword = !this.showNewPassword;
        break;
      case 'confirmPassword':
        this.showConfirmPassword = !this.showConfirmPassword;
        break;
    }
  }

  canChangePassword(): boolean {
    return this.currentPassword.length > 0 && 
           this.newPassword.length >= 6 && 
           this.passwordsMatch;
  }

  changePassword() {
    if (this.canChangePassword()) {
      console.log('Changement de mot de passe:', {
        currentPassword: this.currentPassword,
        newPassword: this.newPassword
      });
      // Logique de changement de mot de passe
    }
  }

  toggleTwoFactor() {
    this.twoFactorEnabled = !this.twoFactorEnabled;
    console.log('2FA ' + (this.twoFactorEnabled ? 'activé' : 'désactivé'));
  }

  terminateSession(sessionId: number) {
    this.activeSessions = this.activeSessions.filter(s => s.id !== sessionId);
    console.log('Session terminée:', sessionId);
  }
} 