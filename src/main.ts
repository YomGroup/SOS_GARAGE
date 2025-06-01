import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { importProvidersFrom } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { KeycloakAngularModule, KeycloakService } from 'keycloak-angular';

(async () => {
  const keycloakService = new KeycloakService();

  await keycloakService.init({
    config: {
      url: 'http://localhost:8080/auth',
      realm: 'sos-garage',                      
      clientId: 'sosmongarage', 
    },
    initOptions: {
      onLoad: 'login-required',
      checkLoginIframe: false,
      pkceMethod: 'S256',
    },
    enableBearerInterceptor: true,
  });

  await bootstrapApplication(AppComponent, {
    providers: [
      provideHttpClient(),
      importProvidersFrom(KeycloakAngularModule),
      { provide: KeycloakService, useValue: keycloakService },
    ],
  });
})();
