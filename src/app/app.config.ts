import { APP_INITIALIZER, ApplicationConfig, isDevMode } from '@angular/core';
import { Router, provideRouter } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideClientHydration } from '@angular/platform-browser';
import { provideStore } from '@ngrx/store';
import { HTTP_INTERCEPTORS, provideHttpClient, withInterceptorsFromDi, withFetch } from '@angular/common/http';

import { routes } from './app.routes';
import { KeycloakBearerInterceptor, KeycloakService } from 'keycloak-angular';
import { environment, firebaseConfig } from '../environnement';
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideFirestore, getFirestore } from '@angular/fire/firestore';
import { ApiInterceptor } from './services/api-interceptor.service';
import { HttpCacheInterceptor } from './core/interceptors/cache.interceptor';
import { getStorage } from 'firebase/storage';
import { provideStorage } from '@angular/fire/storage';
function initializeKeycloak(keycloak: KeycloakService) {
  return () =>
    keycloak.init({
      config: {
        url: 'https://keyckoak-prod-production-551c.up.railway.app/',
        realm: 'sos-mon-garage',
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
    // Ensure a single provideHttpClient with DI interceptors enabled and Fetch API backend
    provideHttpClient(withInterceptorsFromDi(), withFetch()),
    provideStorage(() => getStorage()),
    KeycloakService,
    {
      provide: APP_INITIALIZER,
      useFactory: initializeKeycloak,
      multi: true,
      deps: [KeycloakService]
    },
    // {
    //   provide: HTTP_INTERCEPTORS,
    //   useClass: ApiInterceptor,
    //   multi: true
    // },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: HttpCacheInterceptor,
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

