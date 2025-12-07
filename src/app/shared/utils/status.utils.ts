/**
 * Utilitaires pour la gestion des statuts
 * Centralise la logique de mapping des statuts pour éviter la duplication
 */

export type DisplayStatus = 'Non traité' | 'En cours' | 'Terminé';
export type StatusColor = 'success' | 'warning' | 'secondary' | 'danger' | 'info';

/**
 * Normalise un statut backend vers une des 3 catégories d'affichage
 * À utiliser uniquement en fallback si le backend ne fournit pas statusDisplay
 */
export function normalizeStatus(statut: string | null | undefined): DisplayStatus {
  if (!statut) {
    return 'Non traité';
  }

  const s = statut.toUpperCase().replace(/ /g, '_').replace(/-/g, '_');

  // Catégorie TERMINÉ
  if (s.includes('TERMINE') || 
      s.includes('TERMINEE') ||
      s === 'REPARATION_TERMINEE' ||
      s === 'COMPLETED' ||
      s === 'CLOTURE' ||
      s === 'CLOTUREE' ||
      s === 'FACTURE' ||
      s === 'PAYE' ||
      s === 'PAYEE') {
    return 'Terminé';
  }

  // Catégorie EN COURS
  if (s.includes('EN_COURS') ||
      s === 'IN_PROGRESS' ||
      s === 'ASSIGNED' ||
      s.includes('ASSIGNE') ||
      s === 'EN_ATTENTE_EXPERTISE' ||
      s === 'EN_ATTENTE_REPARATION' ||
      s === 'EN_COURS_REPARATION' ||
      s === 'EN_COURS_EXPERTISE' ||
      s === 'EXPERTISE_EN_COURS' ||
      s === 'REPARATION_EN_COURS' ||
      s === 'TRAITEMENT' ||
      s === 'ACTIVE' ||
      s === 'PROCESSING') {
    return 'En cours';
  }

  // Catégorie NON TRAITÉ (par défaut)
  return 'Non traité';
}

/**
 * Retourne la couleur Bootstrap correspondant au statut
 */
export function getStatusColor(statusDisplay: string | null | undefined): StatusColor {
  if (!statusDisplay) return 'secondary';
  
  switch (statusDisplay) {
    case 'Terminé':
      return 'success';
    case 'En cours':
      return 'warning';
    case 'Non traité':
      return 'secondary';
    default:
      return 'secondary';
  }
}

/**
 * Retourne la classe CSS pour le badge de statut
 */
export function getStatusBadgeClass(statusDisplay: string | null | undefined): string {
  const color = getStatusColor(statusDisplay);
  return `badge bg-${color}`;
}

/**
 * Retourne l'icône correspondant au statut
 */
export function getStatusIcon(statusDisplay: string | null | undefined): string {
  switch (statusDisplay) {
    case 'Terminé':
      return 'check_circle';
    case 'En cours':
      return 'hourglass_empty';
    case 'Non traité':
      return 'schedule';
    default:
      return 'help';
  }
}

/**
 * Obtient le statut d'affichage depuis un objet (mission, sinistre, etc.)
 * Utilise statusDisplay du backend si disponible, sinon fait le mapping
 */
export function getDisplayStatus(item: any): DisplayStatus {
  // Préférer statusDisplay du backend s'il existe
  if (item?.statusDisplay) {
    return item.statusDisplay as DisplayStatus;
  }
  
  // Fallback: normaliser le statut brut
  return normalizeStatus(item?.statut || item?.status);
}

/**
 * Obtient la couleur depuis un objet (mission, sinistre, etc.)
 * Utilise statusColor du backend si disponible
 */
export function getDisplayStatusColor(item: any): StatusColor {
  // Préférer statusColor du backend s'il existe
  if (item?.statusColor) {
    return item.statusColor as StatusColor;
  }
  
  // Fallback: calculer la couleur
  return getStatusColor(getDisplayStatus(item));
}



