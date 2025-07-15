import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { AssureService } from '../../services/assure.service';
import { RouterLink } from '@angular/router';

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
}

@Component({
  selector: 'app-sinistre',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './sinistre.component.html',
  styleUrls: ['./sinistre.component.css']
})
export class SinistreComponent implements OnInit {
  selectedSinistre: Sinistre | null = null;
  sinistres: Sinistre[] = [];
  userid: string | null = null;
  assureId: number = 0;

  private authService = inject(AuthService);
  private assureService = inject(AssureService);

  ngOnInit(): void {
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
    this.assureService.addAssurerGet(this.assureId).subscribe({
      next: (data: any) => {
        this.sinistres = this.transformApiDataToSinistres(data);
      },
      error: (err) => {
        console.error('Erreur lors du chargement des sinistres:', err);
      }
    });
  }

  private transformApiDataToSinistres(apiData: any): Sinistre[] {
    const sinistres: Sinistre[] = [];

    apiData.vehicules?.forEach((vehicule: any) => {
      vehicule.sinistres?.forEach((sinistreApi: any) => {
        const sinistre: Sinistre = {
          id: sinistreApi.id.toString(),
          vehicule: `${vehicule.marque} ${vehicule.modele} (${vehicule.immatriculation})`,
          date: this.formatDate(sinistreApi.createdAt),
          statut: sinistreApi.isvalid ? 'Clôturé' : 'En cours',
          typeVehicule: sinistreApi.type === 'ROULANT' ? 'roulant' : 'non roulant',
          notifications: this.generateNotifications(sinistreApi),
          documents: sinistreApi.documents?.map((doc: any) => doc.fichier) || [],
          photos: sinistreApi.imgUrl || [],
          constat: sinistreApi.lienConstat || 'Aucun constat',
          type: sinistreApi.type || 'aucun'
        };
        sinistres.push(sinistre);
      });
    });

    return sinistres.sort((a, b) =>
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }

  private generateNotifications(sinistreApi: any): Notification[] {
    // Exemple de notifications générées automatiquement
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
    // Implémentez la logique d'affichage du document
  }

  viewPhoto(photo: string): void {
    console.log('Viewing photo:', photo);
    // Implémentez la logique d'affichage de la photo
  }

  contactAssistance(): void {
    console.log('Contacting assistance...');
    // Implémentez la logique de contact
  }

  // Statistiques
  getSinistresEnCours(): number {
    return this.sinistres.filter(s => s.statut === 'En cours').length;
  }

  getSinistresClotures(): number {
    return this.sinistres.filter(s => s.statut === 'Clôturé').length;
  }

  getTotalVehicules(): number {
    return new Set(this.sinistres.map(s => s.vehicule)).size;
  }
}