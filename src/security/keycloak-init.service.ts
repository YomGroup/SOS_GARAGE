import { Injectable } from '@angular/core';
import { KeycloakService } from 'keycloak-angular';

@Injectable({ providedIn: 'root' })
export class KeycloakInitService {
  constructor(private keycloak: KeycloakService) {}

  init(): Promise<boolean> {
    return this.keycloak.init({
      config: {
        url: 'https://prolific-quietude-production.up.railway.app//auth', // adapte à ton Keycloak
        realm: 'sos-garage',
        clientId: 'sosmongarage', // le nom exact du client
      },
      initOptions: {
        onLoad: 'login-required',
        checkLoginIframe: false,
        pkceMethod: 'S256',
      },
      enableBearerInterceptor: true,
    });
  }
}
