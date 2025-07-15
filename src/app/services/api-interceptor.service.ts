import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable()
export class ApiInterceptor implements HttpInterceptor {
  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Si l'URL contient notre API externe, on supprime les headers d'authentification
    if (request.url.includes('sosmongarage-production.up.railway.app')) {
      console.log('API externe détectée, suppression des headers d\'authentification');
      
      // Créer une nouvelle requête sans les headers d'authentification
      const cleanRequest = request.clone({
        setHeaders: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      return next.handle(cleanRequest);
    }
    
    // Pour les autres requêtes, on laisse passer
    return next.handle(request);
  }
} 