import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { KeycloakService } from 'keycloak-angular';
import { ReparateurService } from '../../services/reparateur.service';
import { jwtDecode } from 'jwt-decode';
import { firstValueFrom } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  private keycloakService = inject(KeycloakService);
  private router = inject(Router);
  private reparateurService = inject(ReparateurService);

  async canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Promise<boolean> {
    const isLoggedIn = await this.keycloakService.isLoggedIn();
    if (!isLoggedIn) {
      await this.keycloakService.login({ redirectUri: window.location.origin + state.url });
      return false;
    }

    const requiredRoles = route.data['roles'] as string[];
    if (!requiredRoles || requiredRoles.length === 0) {
      return true; // Si aucun rôle n'est requis, autorise l'accès
    }

    const userRoles = this.keycloakService.getUserRoles();
    const hasRequiredRole = requiredRoles.some(role => userRoles.includes(role));

    if (!hasRequiredRole) {
      // Redirige l'utilisateur s'il n'a pas le bon rôle
      // Vous pouvez rediriger vers une page 'accès refusé' ou la page d'accueil
      this.router.navigate(['/']); 
      return false;
    }

    // Règle supplémentaire: pour les routes garagiste, vérifier le statut du compte
    if (requiredRoles.includes('ROLE_GARAGISTE')) {
      try {
        const token = await this.keycloakService.getToken();
        const decoded: any = jwtDecode(token);
        const keycloakId: string | undefined = decoded?.sub;

        if (keycloakId) {
          const reparateur = await firstValueFrom(this.reparateurService.getReparateurByKeycloakId(keycloakId));
          const rawStatus = (reparateur?.isvalids ?? reparateur?.isValids ?? '').toString().toLowerCase();
          const isValid = rawStatus === 'valide' || rawStatus === 'true';

          if (!isValid) {
            await this.keycloakService.logout(window.location.origin + '/garage-pending');
            return false;
          }
        }
      } catch (error) {
        // En cas d'erreur (ex: non trouvé), par sécurité on bloque l'accès garage
        console.error('Vérification statut garage échouée:', error);
        await this.keycloakService.logout(window.location.origin + '/garage-pending');
        return false;
      }
    }

    return true;
  }
}