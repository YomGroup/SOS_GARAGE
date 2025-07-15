import { APP_INITIALIZER, ApplicationConfig, isDevMode } from '@angular/core';
import { Router, provideRouter } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideClientHydration } from '@angular/platform-browser';
import { provideStore } from '@ngrx/store';
import { HTTP_INTERCEPTORS, provideHttpClient, withFetch, withInterceptorsFromDi } from '@angular/common/http';

import { routes } from './app.routes';
import { KeycloakBearerInterceptor, KeycloakService } from 'keycloak-angular';
import { environment, firebaseConfig } from '../environnement';
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideFirestore, getFirestore } from '@angular/fire/firestore';
import { ApiInterceptor } from './services/api-interceptor.service';
import { getStorage } from 'firebase/storage';
import { provideStorage } from '@angular/fire/storage';
function initializeKeycloak(keycloak: KeycloakService) {
  return () =>
    keycloak.init({
      config: {
        url: 'https://keyckoak-prod-production.up.railway.app',
        realm: 'sos-garage',
        clientId: 'sosmongaragefront'
      },
      initOptions: {
        checkLoginIframe: false
      }
    });
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideAnimations(),
    provideClientHydration(),
    provideStore(),
    provideFirebaseApp(() => initializeApp(firebaseConfig)),
    provideFirestore(() => getFirestore()),
    provideHttpClient(withInterceptorsFromDi()),
    provideHttpClient(),
    provideStorage(() => getStorage()),
    KeycloakService,
    {
      provide: APP_INITIALIZER,
      useFactory: initializeKeycloak,
      multi: true,
      deps: [KeycloakService]
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: ApiInterceptor,
      multi: true
    }
    // Temporairement désactivé pour tester
    // {
    //   provide: HTTP_INTERCEPTORS,
    //   useClass: KeycloakBearerInterceptor,
    //   multi: true
    // }
  ]
};

