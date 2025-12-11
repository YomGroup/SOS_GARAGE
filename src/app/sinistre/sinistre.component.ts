import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { AssureService } from '../../services/assure.service';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { SinistreService } from '../../services/sinistre.service';

interface Notification {
  message: string;
  temps: string;
}

interface Sinistre {
  id: string;
  vehicule: string;
  date: string;
  statut: string;
  typeVehicule: string;
  notifications: Notification[];
  documents: string[];
  photos: string[];
  constat: string;
  type: string;
  etat?: string;
  raison?: string;
  lieu?: string;
  iSsigned?: boolean;
  isgarageaffected?: boolean;
}


@Component({
  selector: 'app-sinistre',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './sinistre.component.html',
  styleUrls: ['./sinistre.component.css']
})
export class SinistreComponent implements OnInit {

  formatEtat(etat?: string): string {
  if (!etat) {
    return 'Inconnu';
  }

  const mapping: { [key: string]: string } = {
    'ROULANT': 'Roulant',
    'NON_ROULANT': 'Non roulant'
  };

  return mapping[etat] ?? etat.replace(/_/g, ' ').toLowerCase();
}

  
  formatStatut(statut: string): string {
    const mapping: { [key: string]: string } = {
      'EN_ATTENTE_TRAITEMENT': "En attente de traitement",
      'EN_ATTENTE_EXPERTISE': "En attente d'expertise",
      'EN_COURS_REPARATION': "En cours de réparation",
      'EN_ATTENTE_RDV': "En attente de rendez-vous",
      'EN_ATTENTE_VALIDATION_ASSURANCE': "En attente de validation assurance",
      'REPARATION_TERMINEE': "Réparation terminée",
      'DEFAULT': statut.replace(/_/g, ' ').toLowerCase()
    };

    return mapping[statut] ?? mapping['DEFAULT'];
  }
  // Catégorie principale pour le design (couleur du badge)
getMainStatus(statut: string): 'nonTraite' | 'enCours' | 'termine' {
  // Non traités
  if (statut === 'EN_ATTENTE_TRAITEMENT' || statut === 'NON_TRAITEE') {
    return 'nonTraite';
  }

  // Terminés
  if (statut === 'REPARATION_TERMINEE') {
    return 'termine';
  }

  // Tout le reste = en cours (en attente expertise, réparation, RDV, etc.)
  return 'enCours';
}



  selectedSinistre: Sinistre | null = null;
  sinistres: Sinistre[] = [];
  userid: string | null = null;
  assureId: number = 0;
  private token: string | null = null;

  private authService = inject(AuthService);
  private assureService = inject(AssureService);
  private sinistreService = inject(SinistreService);
  private route = inject(ActivatedRoute);

  /** on garde l’id reçu via l’URL */
  private sinistreIdFromUrl: string | null = null;

  ngOnInit(): void {
    console.log('Component initialized', this.sinistres);

    // 1. Récupérer l’ID dans l’URL au chargement
    this.sinistreIdFromUrl = this.route.snapshot.queryParamMap.get('sinistreId');

    // 2. Écouter les changements de query params (si tu reviens ici avec un autre id)
    this.route.queryParamMap.subscribe(params => {
      const id = params.get('sinistreId');
      if (id && this.sinistres.length) {
        this.preselectSinistre(id);
      }
    });

    this.userid = this.authService.getToken()?.['sub'] ?? null;
    if (this.userid) {
      this.assureService.getAssurerID(this.userid).subscribe({
        next: (data: any) => {
          this.assureId = data.id;
          this.loadSinistres();
        },
        error: (err) => {
          console.error('Erreur lors de la récupération de l\'assure ID :', err);
        }
      });
    }
  }

  loadSinistres(): void {
    this.sinistreService.getAllSinistre(this.assureId).subscribe({
      next: (data: any) => {
        // Mapping backend → front
        this.sinistres = data.content.map((s: any) => this.mapBackendSinistreToFront(s));
        console.log('Sinistres transformés:', this.sinistres);

        // Si l’URL contenait un sinistreId, on pré-sélectionne
        if (this.sinistreIdFromUrl) {
          this.preselectSinistre(this.sinistreIdFromUrl);
        }
      },
      error: (err) => {
        console.error('Erreur lors du chargement des sinistres:', err);
      }
    });
  }

  /** Sélection du sinistre depuis l’URL + scroll vers lui */
  private preselectSinistre(id: string): void {
    const found = this.sinistres.find(s => s.id === id);
    if (found) {
      this.selectedSinistre = found;

      // on laisse Angular finir le DOM avant de scroller
      setTimeout(() => {
        const el = document.getElementById('sinistre-' + id);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 0);
    }
  }

  isEnCours(statut: string): boolean {
    return [
      'EN_ATTENTE_TRAITEMENT',
      'EN_ATTENTE_EXPERTISE',
      'EN_COURS_REPARATION'
    ].includes(statut);
  }

  isCloture(statut: string): boolean {
    return ['REPARATION_TERMINEE'].includes(statut);
  }

  isEnAttente(statut: string): boolean {
    return statut === 'EN_ATTENTE_TRAITEMENT';
  }

  private transformApiDataToSinistres(apiData: any): Sinistre[] {
    const sinistres: Sinistre[] = [];

    apiData.vehicules?.forEach((vehicule: any) => {
      vehicule.sinistres?.forEach((sinistreApi: any) => {
        console.log('Processing sinistre:', sinistreApi);
        const sinistre: Sinistre = {
          id: sinistreApi.id.toString(),
          vehicule: `${vehicule.marque} ${vehicule.modele} (${vehicule.immatriculation})`,
          date: this.formatDate(sinistreApi.createdAt),
          statut: sinistreApi.statut || 'EN_ATTENTE_TRAITEMENT',
          typeVehicule: sinistreApi.type === 'ROULANT' ? 'roulant' : 'non roulant',
          notifications: this.generateNotifications(sinistreApi),
          documents: sinistreApi.documents?.map((doc: any) => doc.fichier) || [],
          photos: sinistreApi.imgUrl || [],
          constat: sinistreApi.lienConstat || 'Aucun constat',
          type: sinistreApi.type || 'aucun',
          etat: sinistreApi.etatvehicule || 'Inconnu',
          raison: sinistreApi.input || 'Aucune raison spécifiée',
          lieu: sinistreApi.lieu || 'Lieu inconnu',
          iSsigned: sinistreApi.issigned,
          isgarageaffected: sinistreApi.isgarageaffected,
        };
        sinistres.push(sinistre);
      });
    });

    return sinistres.sort((a, b) =>
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }

  private generateNotifications(sinistreApi: any): Notification[] {
    return [
      {
        message: `Sinistre ${sinistreApi.isvalid ? 'clôturé' : 'en cours de traitement'}`,
        temps: this.formatTimeAgo(sinistreApi.updatedAt || sinistreApi.createdAt)
      },
      {
        message: 'Dossier transmis à l\'expert',
        temps: this.formatTimeAgo(sinistreApi.createdAt)
      }
    ];
  }

  private formatDate(dateString: string | null): string {
    if (!dateString) return 'Date inconnue';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR');
  }

  private formatTimeAgo(dateString: string | null): string {
    if (!dateString) return 'Récemment';
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return "Aujourd'hui";
    if (days === 1) return "Hier";
    if (days < 7) return `Il y a ${days} jours`;
    if (days < 30) return `Il y a ${Math.floor(days / 7)} semaines`;
    return `Il y a ${Math.floor(days / 30)} mois`;
  }

  // Méthodes d'affichage
  getStatutClass(statut: string): string {
    return statut === 'Clôturé' ? 'badge-success' :
      statut === 'En cours' ? 'badge-warning' : 'badge-secondary';
  }

  getStatutIcon(statut: string): string {
    return statut === 'Clôturé' ? 'fas fa-check-circle' :
      statut === 'En cours' ? 'fas fa-clock' : 'fas fa-exclamation-circle';
  }

  selectSinistre(sinistre: Sinistre): void {
    this.selectedSinistre = this.selectedSinistre?.id === sinistre.id ? null : sinistre;
  }

  viewDocument(document: string): void {
    console.log('Viewing document:', document);
  }

  viewPhoto(photo: string): void {
    console.log('Viewing photo:', photo);
  }

  contactAssistance(): void {
    console.log('Contacting assistance...');
  }

  // Statistiques
getSinistresEnCours(): number {
  return this.sinistres.filter(s => this.getMainStatus(s.statut) === 'enCours').length;
}

getSinistresClotures(): number {
  return this.sinistres.filter(s => this.getMainStatus(s.statut) === 'termine').length;
}

  getTotalVehicules(): number {
    return new Set(this.sinistres.map(s => s.vehicule)).size;
  }

  private mapBackendSinistreToFront(backend: any): Sinistre {
    return {
      id: backend.id.toString(),
      vehicule: backend.vehiculeImmatriculation ?? `Véhicule #${backend.vehiculeId}`,
      date: backend.createdAt ? new Date(backend.createdAt).toLocaleDateString('fr-FR') : 'Date inconnue',
      statut: backend.statut,
      typeVehicule: backend.type ? backend.type.toString() : 'Inconnu',
      notifications: [
        {
          message: backend.isValid ? 'Sinistre clôturé' : 'Sinistre en cours de traitement',
          temps: this.formatTimeAgo(backend.updatedAt ?? backend.createdAt)
        }
      ],
      documents: backend.documents?.map((doc: any) => doc.url) || [],
      photos: backend.images?.map((img: any) => img.url) || [],
      constat: backend.lienConstat || 'Aucun constat',
      type: backend.type ? backend.type.toString() : 'Inconnu',
      etat: backend.etatVehicule ? backend.etatVehicule.toString().toUpperCase() : 'INCONNU',
      raison: backend.description || 'Aucune raison spécifiée',
      lieu: backend.lieu || 'Lieu inconnu',
      iSsigned: backend.isSigned,
      isgarageaffected: backend.isGarageAffected
    };
  }
}
 