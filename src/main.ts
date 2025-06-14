import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { importProvidersFrom } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { KeycloakAngularModule, KeycloakService } from 'keycloak-angular';
import { RouterModule } from '@angular/router';
import { routes } from './app/app.routes'; 

(async () => {
  const keycloakService = new KeycloakService();

  await keycloakService.init({
    config: {
      url: 'http://localhost:8080',
      realm: 'sos-garage',                      
      clientId: 'sosmongarage',
    },
    initOptions: {
      onLoad: 'login-required',
      checkLoginIframe: false,
      pkceMethod: 'S256',
      redirectUri: 'http://localhost:4200/admin/dashboard',
    },
    enableBearerInterceptor: true,
  });
  

  await bootstrapApplication(AppComponent, {
    providers: [
      provideHttpClient(),
      importProvidersFrom(
        KeycloakAngularModule,
        RouterModule.forRoot(routes)  // <-- Ici, on ajoute RouterModule
      ),
      { provide: KeycloakService, useValue: keycloakService },
    ],
  });
})();
