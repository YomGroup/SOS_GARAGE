import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type MissionGroup = 'nouvelles' | 'enCours' | 'terminees' | 'toutes';

@Injectable({ providedIn: 'root' })
export class MissionFilterService {

  private filtreSubject = new BehaviorSubject<MissionGroup>('toutes');
  filtre$ = this.filtreSubject.asObservable();

  setFiltre(filtre: MissionGroup) {
    this.filtreSubject.next(filtre);
  }

  /** Normalise un statut backend */
  private normalize(statut?: string): string {
    return (statut ?? '')
      .toUpperCase()
      .trim()
      .replace(/\s+/g, '_');
  }

  /** ⭐ MÉTHODE MANQUANTE — CLÉ DE TOUT LE SYSTÈME */
  getGroupFromStatus(statut?: string): MissionGroup {
    const s = this.normalize(statut);

    // 🟠 NOUVELLES / NON TRAITÉES
    if (
      s === 'NON_TRAITE' ||
      s === 'NON_TRAITEE' ||
      s === 'EN_ATTENTE' ||
      s === 'EN_ATTENTE_TRAITEMENT' ||
      s === 'EN_ATTENTE_EXPERTISE' ||
      s === 'EN_ATTENTE_RDV' ||
      s === 'EN_ATTENTE_REPARATION'
    ) {
      return 'nouvelles';
    }

    // 🟢 TERMINÉES
    if (
      s === 'TERMINEE' ||
      s === 'REPARATION_TERMINEE'
    ) {
      return 'terminees';
    }

    // 🔵 EN COURS (par défaut)
    return 'enCours';
  }
}
