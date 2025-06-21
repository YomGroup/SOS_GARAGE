import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { KeycloakService } from 'keycloak-angular';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  private keycloakService = inject(KeycloakService);
  private router = inject(Router);

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
    
    return true;
  }
}