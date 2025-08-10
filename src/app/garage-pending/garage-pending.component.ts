import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { KeycloakService } from 'keycloak-angular';

@Component({
  selector: 'app-garage-pending',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="container" style="max-width:900px;margin:40px auto;padding:24px;">
      <div class="card shadow-sm" style="border-radius:12px; overflow:hidden;">
        <div class="card-body p-4 p-md-5 text-center">
          <div class="mb-3">
            <i class="bi bi-shield-exclamation" style="font-size:40px;color:#dc3545"></i>
          </div>
          <h2 class="h4 mb-3">Compte garage en cours de validation</h2>
          <p class="text-muted mb-4">
            Votre compte garage n'est pas encore validé par l'administrateur. Vous serez redirigé vers la page de connexion pour vous reconnecter ultérieurement.
          </p>
          <button class="btn btn-primary px-4" (click)="login()">Se connecter</button>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class GaragePendingComponent implements OnInit {
  private keycloakService = inject(KeycloakService);

  ngOnInit(): void {
    // Optionnel: redirection automatique vers la page de connexion après un court délai
    setTimeout(() => {
      this.login();
    }, 1500);
  }

  login(): void {
    this.keycloakService.login();
  }
}


