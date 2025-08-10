import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { KeycloakService } from 'keycloak-angular';
import { ReparateurService } from '../../../services/reparateur.service';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class RoleRedirectService {
  private keycloakService = inject(KeycloakService);
  private router = inject(Router);
  private reparateurService = inject(ReparateurService);
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
        try {
          const token = await this.keycloakService.getToken();
          const decoded: any = JSON.parse(atob(token.split('.')[1] || ''));
          const keycloakId: string | undefined = decoded?.sub;
          if (keycloakId) {
            const reparateur = await firstValueFrom(this.reparateurService.getReparateurByKeycloakId(keycloakId));
            const rawStatus = (reparateur?.isvalids ?? reparateur?.isValids ?? '').toString().toLowerCase();
            const isValid = rawStatus === 'valide' || rawStatus === 'true';
            if (!isValid) {
              await this.keycloakService.logout(window.location.origin + '/garage-pending');
              return;
            }
          }
        } catch (e) {
          // Si on ne peut pas vérifier, rester prudent et ne pas envoyer vers /garage
          console.error('Impossible de vérifier le statut garage pendant la redirection:', e);
          await this.keycloakService.logout(window.location.origin + '/garage-pending');
          return;
        }
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