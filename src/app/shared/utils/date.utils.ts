/**
 * Utilitaires pour la gestion des dates
 * Centralise la logique de formatage des dates pour éviter la duplication
 */

/**
 * Parse une date du backend qui peut être dans différents formats:
 * - String ISO 8601 (ex: "2025-12-01T10:23:20")
 * - Array Java LocalDateTime (ex: [2025, 12, 1, 10, 23, 20])
 * - Objet avec year, month, day
 * - Date JavaScript
 */
export function parseBackendDate(date: any): Date | null {
  if (!date) return null;

  // Si c'est déjà une Date
  if (date instanceof Date) {
    return isNaN(date.getTime()) ? null : date;
  }

  // Si c'est un tableau (format LocalDateTime Java: [year, month, day, hour, minute, second, nano])
  if (Array.isArray(date)) {
    const [year, month, day, hour = 0, minute = 0, second = 0] = date;
    return new Date(year, month - 1, day, hour, minute, second);
  }

  // Si c'est une string
  if (typeof date === 'string') {
    // Essayer de parser directement (ISO 8601)
    const parsed = new Date(date);
    if (!isNaN(parsed.getTime())) {
      return parsed;
    }

    // Si la string ressemble à "2025,12,1,10,23,20,23561000"
    if (date.includes(',')) {
      const parts = date.split(',').map(Number);
      const [year, month, day, hour = 0, minute = 0, second = 0] = parts;
      return new Date(year, month - 1, day, hour, minute, second);
    }
  }

  // Si c'est un objet avec year, month, day (LocalDate Java)
  if (typeof date === 'object' && date.year && date.month && date.day) {
    return new Date(date.year, date.month - 1, date.day);
  }

  // Si c'est un timestamp number
  if (typeof date === 'number') {
    return new Date(date);
  }

  return null;
}

/**
 * Formate une date en format français court (dd/MM/yyyy)
 */
export function formatDateFr(date: any): string {
  const parsed = parseBackendDate(date);
  if (!parsed) return 'N/A';
  
  return parsed.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

/**
 * Formate une date en format français avec heure (dd/MM/yyyy à HH:mm)
 */
export function formatDateTimeFr(date: any): string {
  const parsed = parseBackendDate(date);
  if (!parsed) return 'N/A';
  
  const dateStr = parsed.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
  
  const timeStr = parsed.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit'
  });
  
  return `${dateStr} à ${timeStr}`;
}

/**
 * Formate une date en format relatif (il y a X minutes, hier, etc.)
 */
export function formatRelativeTime(date: any): string {
  const parsed = parseBackendDate(date);
  if (!parsed) return 'N/A';
  
  const now = new Date();
  const diffMs = now.getTime() - parsed.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffSecs < 60) {
    return 'À l\'instant';
  } else if (diffMins < 60) {
    return `Il y a ${diffMins} min`;
  } else if (diffHours < 24) {
    return `Il y a ${diffHours}h`;
  } else if (diffDays === 1) {
    return 'Hier';
  } else if (diffDays < 7) {
    return `Il y a ${diffDays} jours`;
  } else {
    return formatDateFr(parsed);
  }
}

/**
 * Formate une date pour l'affichage dans une liste (format court ou relatif selon l'ancienneté)
 */
export function formatListDate(date: any): string {
  const parsed = parseBackendDate(date);
  if (!parsed) return 'N/A';
  
  const now = new Date();
  const diffMs = now.getTime() - parsed.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  // Si moins de 7 jours, afficher en relatif
  if (diffDays < 7) {
    return formatRelativeTime(date);
  }
  
  // Sinon, afficher la date courte
  return formatDateFr(date);
}

/**
 * Obtient la date formatée depuis un objet
 * Utilise dateCreationFormatted du backend si disponible
 */
export function getFormattedDate(item: any, dateField: string = 'dateCreation'): string {
  // Préférer la date pré-formatée du backend
  const formattedField = `${dateField}Formatted`;
  if (item?.[formattedField]) {
    return item[formattedField];
  }
  
  // Fallback: formater localement
  return formatDateFr(item?.[dateField]);
}

/**
 * Obtient la date-heure formatée depuis un objet
 */
export function getFormattedDateTime(item: any, dateField: string = 'dateCreation'): string {
  // Préférer la date pré-formatée du backend
  const formattedField = `${dateField}Formatted`;
  if (item?.[formattedField]) {
    return item[formattedField];
  }
  
  // Fallback: formater localement
  return formatDateTimeFr(item?.[dateField]);
}



