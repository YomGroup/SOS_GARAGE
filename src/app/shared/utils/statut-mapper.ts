/**
 * Utilitaire pour harmoniser les statuts backend vers 3 catégories frontend
 * 
 * Les 3 catégories principales :
 * - NON_TRAITEE : Dossiers/missions en attente de traitement
 * - EN_COURS : Dossiers/missions en cours de traitement
 * - TERMINEE : Dossiers/missions terminés
 */

export type StatutCategorie = 'NON_TRAITEE' | 'EN_COURS' | 'TERMINEE';

// Mapping des statuts backend vers les catégories frontend
const STATUTS_NON_TRAITES = [
  'EN_ATTENTE_TRAITEMENT',
  'EN_ATTENTE_DE_TRAITEMENT',
  'EN_ATTENTE_EXPERTISE',
  'EN_ATTENTE_REPARATION',
  'EN_ATTENTE_VALIDATION_ASSURANCE',
  'EN ATTENTE TRAITEMENT',
  'EN ATTENTE',
  'PENDING',
  'DRAFT',
  'NON_TRAITEE',
  'non traité',
  'non traitée',
  'en attente'
];

const STATUTS_EN_COURS = [
  'EN_COURS_REPARATION',
  'EN_COURS_DE_REPARATION',
  'EN_COURS',
  'EN_COUR',
  'IN_PROGRESS',
  'ASSIGNED',
  'ASSIGNÉE',
  'ASSIGNEE',
  'en cours',
  'en cours de réparation',
  'assignée'
];

const STATUTS_TERMINES = [
  'REPARATION_TERMINEE',
  'TERMINEE',
  'TERMINÉ',
  'TERMINÉE',
  'COMPLETED',
  'FACTURE',
  'VEHICULE_EPAVE',
  'CANCELLED',
  'terminé',
  'terminée',
  'terminee'
];

/**
 * Normalise un statut en le mettant en minuscules et en supprimant les espaces
 */
function normalizeStatut(statut: string | undefined | null): string {
  if (!statut) return '';
  return statut.toLowerCase().trim().replace(/[_-]/g, ' ').replace(/\s+/g, ' ');
}

/**
 * Retourne la catégorie d'un statut
 */
export function getStatutCategorie(statut: string | undefined | null): StatutCategorie {
  if (!statut) return 'NON_TRAITEE';
  
  const normalizedStatut = normalizeStatut(statut);
  const originalStatut = statut.toUpperCase().trim();
  
  // Vérifier dans les statuts terminés
  if (STATUTS_TERMINES.some(s => 
    normalizeStatut(s) === normalizedStatut || s === originalStatut
  )) {
    return 'TERMINEE';
  }
  
  // Vérifier dans les statuts en cours
  if (STATUTS_EN_COURS.some(s => 
    normalizeStatut(s) === normalizedStatut || s === originalStatut
  )) {
    return 'EN_COURS';
  }
  
  // Par défaut, non traité
  return 'NON_TRAITEE';
}

/**
 * Retourne le label à afficher pour un statut
 */
export function getStatutLabel(statut: string | undefined | null): string {
  const categorie = getStatutCategorie(statut);
  switch (categorie) {
    case 'TERMINEE':
      return 'Terminé';
    case 'EN_COURS':
      return 'En cours';
    case 'NON_TRAITEE':
    default:
      return 'Non traité';
  }
}

/**
 * Retourne la classe CSS pour un statut
 */
export function getStatutClass(statut: string | undefined | null): string {
  const categorie = getStatutCategorie(statut);
  switch (categorie) {
    case 'TERMINEE':
      return 'statut-termine';
    case 'EN_COURS':
      return 'statut-en-cours';
    case 'NON_TRAITEE':
    default:
      return 'statut-non-traite';
  }
}

/**
 * Retourne la couleur pour un statut (pour les badges Bootstrap, etc.)
 */
export function getStatutColor(statut: string | undefined | null): string {
  const categorie = getStatutCategorie(statut);
  switch (categorie) {
    case 'TERMINEE':
      return 'success';
    case 'EN_COURS':
      return 'warning';
    case 'NON_TRAITEE':
    default:
      return 'secondary';
  }
}

/**
 * Retourne l'icône pour un statut
 */
export function getStatutIcon(statut: string | undefined | null): string {
  const categorie = getStatutCategorie(statut);
  switch (categorie) {
    case 'TERMINEE':
      return 'fa-check-circle';
    case 'EN_COURS':
      return 'fa-spinner';
    case 'NON_TRAITEE':
    default:
      return 'fa-clock';
  }
}

/**
 * Vérifie si un statut appartient à une catégorie
 */
export function isStatutInCategorie(statut: string | undefined | null, categorie: StatutCategorie): boolean {
  return getStatutCategorie(statut) === categorie;
}

/**
 * Filtre une liste d'éléments par catégorie de statut
 */
export function filterByStatutCategorie<T>(
  items: T[], 
  getStatut: (item: T) => string | undefined | null,
  categorie: StatutCategorie
): T[] {
  return items.filter(item => getStatutCategorie(getStatut(item)) === categorie);
}

