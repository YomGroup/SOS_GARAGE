export interface MissionDTO {
  id: string;
  statut: 'TERMINEE' | 'EN_COURS' | 'ASSIGNEE' | 'ANNULEE';
  dateDebut: string;
  priorite: 'URGENTE' | 'HAUTE' | 'NORMALE' | 'BASSE';
  titre?: string;
  description?: string;
}

export interface ReparationDTO {
  id: string;
  cout?: number;
  description?: string;
  // Ajoutez d'autres champs si nécessaire
} 