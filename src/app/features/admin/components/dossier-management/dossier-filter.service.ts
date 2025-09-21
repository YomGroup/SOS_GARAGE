import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class DossierFilterService {
  private filtreSubject = new BehaviorSubject<'nouveaux' | 'nonTraites' | 'termines' | 'tous'>('tous');
  filtre$ = this.filtreSubject.asObservable();

  setFiltre(filtre: 'nouveaux' | 'nonTraites' | 'termines' | 'tous') {
    this.filtreSubject.next(filtre);
  }
} 