import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class MissionFilterService {
  private filtreSubject = new BehaviorSubject<'nouvelles' | 'enCours' | 'terminees' | 'toutes'>('toutes');
  filtre$ = this.filtreSubject.asObservable();

  setFiltre(filtre: 'nouvelles' | 'enCours' | 'terminees' | 'toutes') {
    this.filtreSubject.next(filtre);
  }
} 