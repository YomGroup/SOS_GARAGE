import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';

interface ContactInfo {
  icon: string;
  title: string;
  value: string;
  description: string;
}

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './contact.component.html',
  styleUrl: './contact.component.css'
})
export class ContactComponent {
  contactInfo: ContactInfo[] = [
    {
      icon: '📞',
      title: 'Téléphone',
      value: '01 23 45 67 89',
      description: 'Lun - Ven, 9h - 18h'
    },
    {
      icon: '✉️',
      title: 'Email',
      value: 'support@autosinistre.fr',
      description: 'Réponse sous 24h'
    },
    {
      icon: '📍',
      title: 'Adresse',
      value: '123 Avenue des Champs-Élysées',
      description: '75008 Paris'
    },
    {
      icon: '⏰',
      title: 'Urgences',
      value: '0 800 123 456',
      description: '24h/24, 7j/7'
    }
  ];

  isSubmitting = false;
  submitted = false;

  formData = {
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  };

  onSubmit(form: NgForm) {
    if (form.invalid || this.isSubmitting) {
      return;
    }

    this.isSubmitting = true;

    // Simulation d'envoi (comme ton setTimeout en React)
    setTimeout(() => {
      this.isSubmitting = false;
      this.submitted = true;
      this.formData = {
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: ''
      };
      form.resetForm();
    }, 1500);
  }

  resetForm() {
    this.submitted = false;
  }
}
