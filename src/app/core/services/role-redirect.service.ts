import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { KeycloakService } from 'keycloak-angular';

@Injectable({
  providedIn: 'root'
})
export class RoleRedirectService {
  private keycloakService = inject(KeycloakService);
  private router = inject(Router);
  private hasRedirected = false;

  async handleLoginRedirect(): Promise<void> {
    if (this.hasRedirected) {
      return;
    }

    const authenticated = await this.keycloakService.isLoggedIn();
    if (authenticated) {
      this.hasRedirected = true; // Empêche les redirections multiples
      const roles = this.keycloakService.getUserRoles();
      if (roles.includes('ROLE_ADMIN')) {
        this.router.navigate(['/admin']);
      } else if (roles.includes('ROLE_GARAGISTE')) {
        this.router.navigate(['/garage']);
      } else if (roles.includes('ROLE_ASSURE')) {
        this.router.navigate(['/clientDashboard']);
      } else {
        // Optionnel : si l'utilisateur n'a aucun des rôles attendus
        this.router.navigate(['/client']);
      }
    }
  }
} 