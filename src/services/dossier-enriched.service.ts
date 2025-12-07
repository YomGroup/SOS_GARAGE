import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

/**
 * DTO enrichi pour l'affichage des dossiers
 * Correspond au DossierEnrichedDTO du backend
 */
export interface DossierEnriched {
  // Informations de base
  id: number;
  numero: string;
  type: string;
  statut: string;
  statusDisplay: string; // "Non traité", "En cours", "Terminé"
  statusColor: string;   // "success", "warning", "secondary"
  dateCreation: string;
  dateCreationFormatted: string;
  
  contactAssistance: string;
  lienConstat: string;
  conditionsAcceptees: boolean;
  description: string;
  lieu: string;
  imgUrl: string[];
  
  // Véhicule
  vehicule: VehiculeInfo | null;
  
  // Assuré
  assure: AssureInfo | null;
  
  // Mission
  mission: MissionInfo | null;
  
  // Flags
  hasMission: boolean;
  termine: boolean;
  enCours: boolean;
}

export interface VehiculeInfo {
  id: number;
  immatriculation: string;
  marque: string;
  modele: string;
  annee: string;
  dateCreationFormatted: string;
  nomAssurance: string;
  typeAssurance: string;
}

export interface AssureInfo {
  id: number;
  nom: string;
  prenom: string;
  nomComplet: string;
  email: string;
  telephone: string;
}

export interface MissionInfo {
  id: number;
  statut: string;
  statusDisplay: string;
  statusColor: string;
  devis: number;
  factureFinale: number;
  commissionStatut: string;
  dateCreationFormatted: string;
  reparateurId: number;
  reparateurNom: string;
  reparateurPrenom: string;
}

export interface DossierStats {
  totalDossiers: number;
  dossiersNonTraites: number;
  dossiersEnCours: number;
  dossiersTermines: number;
  dossiersCommissionPayee: number;
  totalDevis: number;
  totalFactures: number;
  totalCommissions: number;
}

export interface DossierPageResponse {
  content: DossierEnriched[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  empty: boolean;
  stats: DossierStats;
}

/**
 * Service pour récupérer les dossiers enrichis
 * Un seul appel API retourne toutes les données nécessaires
 */
@Injectable({
  providedIn: 'root'
})
export class DossierEnrichedService {
  private apiUrl = `${environment.apiUrl}/dossiers`;

  constructor(private http: HttpClient) {}

  /**
   * Récupère les dossiers enrichis avec pagination et statistiques
   */
  getDossiersEnriched(page: number = 0, size: number = 10): Observable<DossierPageResponse> {
    return this.http.get<DossierPageResponse>(`${this.apiUrl}/enriched?page=${page}&size=${size}`);
  }
}



