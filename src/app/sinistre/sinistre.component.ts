import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { AssureService } from '../../services/assure.service';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { SinistreService } from '../../services/sinistre.service';
import { VehicleService } from '../../services/vehicle.service'; // ✅ Ajouter si nécessaire

interface Notification {
  message: string;
  temps: string;
}

interface Sinistre {
  id: string;
  vehicule: string;
  vehiculeId?: number; // ✅ AJOUTER pour la redirection
  date: string;
  statut: string;
  typeVehicule: string;
  notifications: Notification[];
  documents: string[];
  photos: string[];
  constat: string;
  contratAssurance?: string; // ✅ AJOUTER
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
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './sinistre.component.html',
  styleUrls: ['./sinistre.component.css']
})
export class SinistreComponent implements OnInit {

  // ===== PROPRIÉTÉS EXISTANTES =====
  selectedSinistre: Sinistre | null = null;
  sinistres: Sinistre[] = [];
  userid: string | null = null;
  assureId: number = 0;
  private token: string | null = null;

  private authService = inject(AuthService);
  private assureService = inject(AssureService);
  private sinistreService = inject(SinistreService);
  private route = inject(ActivatedRoute);
  private router = inject(Router); // ✅ AJOUTER

  private sinistreIdFromUrl: string | null = null;

  // ===== NOUVELLES PROPRIÉTÉS POUR ÉDITION =====
  isEditingStatus: boolean = false;
  isEditingDetails: boolean = false;
  
  editForm = {
    statut: '',
    type: '',
    lieu: '',
    description: '',
    contactAssistance: '',
    etatVehicule: ''
  };

  // Liste des statuts disponibles
  availableStatuts = [
    { value: 'EN_ATTENTE', label: 'En attente' },
    { value: 'EN_COURS', label: 'En cours' },
    { value: 'TERMINE', label: 'Terminé' },
    { value: 'ANNULE', label: 'Annulé' }
  ];

  // Liste des types de sinistre
  availableTypes = [
    { value: 'COLLISION', label: 'Collision' },
    { value: 'VOL', label: 'Vol' },
    { value: 'VANDALISME', label: 'Vandalisme' },
    { value: 'INCENDIE', label: 'Incendie' },
    { value: 'BRIS_DE_GLACE', label: 'Bris de glace' },
    { value: 'CATASTROPHE_NATURELLE', label: 'Catastrophe naturelle' },
    { value: 'AUTRE', label: 'Autre' }
  ];

  // États du véhicule
  availableEtats = [
    { value: 'ROULANT', label: 'Roulant' },
    { value: 'NON_ROULANT', label: 'Non roulant' }
  ];

  // Upload de fichiers
  selectedConstat: File | null = null;
  selectedPhotos: File[] = [];
  uploadingConstat: boolean = false;
  uploadingPhotos: boolean = false;

  // ✅ NOUVELLES PROPRIÉTÉS pour les messages
  successMessage: string | null = null;
  errorMessage: string | null = null;

  // ===== LIFECYCLE =====
  ngOnInit(): void {
    console.log('Component initialized', this.sinistres);

    this.sinistreIdFromUrl = this.route.snapshot.queryParamMap.get('sinistreId');

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
        this.sinistres = data.content.map((s: any) => this.mapBackendSinistreToFront(s));
        console.log('Sinistres transformés:', this.sinistres);

        if (this.sinistreIdFromUrl) {
          this.preselectSinistre(this.sinistreIdFromUrl);
        }
      },
      error: (err) => {
        console.error('Erreur lors du chargement des sinistres:', err);
      }
    });
  }

  private preselectSinistre(id: string): void {
    const found = this.sinistres.find(s => s.id === id);
    if (found) {
      this.selectedSinistre = found;

      setTimeout(() => {
        const el = document.getElementById('sinistre-' + id);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 0);
    }
  }

  // ===== MESSAGES =====
  showSuccess(message: string): void {
    this.successMessage = message;
    this.errorMessage = null;
    setTimeout(() => {
      this.successMessage = null;
    }, 5000);
  }

  showError(message: string): void {
    this.errorMessage = message;
    this.successMessage = null;
    setTimeout(() => {
      this.errorMessage = null;
    }, 5000);
  }

  closeMessage(): void {
    this.successMessage = null;
    this.errorMessage = null;
  }

  // ===== VÉRIFICATIONS =====
 // ===== VÉRIFICATIONS =====
hasConstat(sinistre: Sinistre): boolean {
  return !!(sinistre.constat && sinistre.constat !== 'Aucun constat' && sinistre.constat.trim() !== '');
}

hasContratAssurance(sinistre: Sinistre): boolean {
  return !!(sinistre.contratAssurance && sinistre.contratAssurance.trim() !== '');
}
  redirectToVehiculeEdit(sinistre: Sinistre): void {
  if (sinistre.vehiculeId) {
    // Naviguer vers la page véhicules avec le mode édition
    this.router.navigate(['/clientDashboard/vehicules'], {
      queryParams: { editVehicleId: sinistre.vehiculeId }
    });
  } else {
    this.showError('Impossible de rediriger vers le véhicule');
  }
}

  // ===== FORMATTERS =====
  formatEtat(etat?: string): string {
    if (!etat) return 'Inconnu';

    const mapping: { [key: string]: string } = {
      'ROULANT': 'Roulant',
      'NON_ROULANT': 'Non roulant'
    };

    return mapping[etat] ?? etat.replace(/_/g, ' ').toLowerCase();
  }

  formatStatut(statut: string): string {
    const mapping: { [key: string]: string } = {
      'EN_ATTENTE': 'En attente',
      'EN_COURS': 'En cours',
      'TERMINE': 'Terminé',
      'ANNULE': 'Annulé',
      'EN_ATTENTE_TRAITEMENT': "En attente de traitement",
      'EN_ATTENTE_EXPERTISE': "En attente d'expertise",
      'EN_COURS_REPARATION': "En cours de réparation",
      'EN_ATTENTE_RDV': "En attente de rendez-vous",
      'EN_ATTENTE_VALIDATION_ASSURANCE': "En attente de validation assurance",
      'REPARATION_TERMINEE': "Réparation terminée",
      'NON_TRAITEE': "Non traité"
    };

    return mapping[statut] ?? statut.replace(/_/g, ' ');
  }

  getMainStatus(statut: string): 'nonTraite' | 'enCours' | 'termine' {
    if (statut === 'EN_ATTENTE' || statut === 'EN_ATTENTE_TRAITEMENT' || statut === 'NON_TRAITEE') {
      return 'nonTraite';
    }

    if (statut === 'TERMINE' || statut === 'REPARATION_TERMINEE') {
      return 'termine';
    }

    return 'enCours';
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

  // ===== ÉDITION - INITIALISATION =====
  initEditForm(sinistre: Sinistre): void {
    this.editForm = {
      statut: sinistre.statut,
      type: sinistre.type,
      lieu: sinistre.lieu || '',
      description: sinistre.raison || '',
      contactAssistance: '',
      etatVehicule: sinistre.etat || 'INCONNU'
    };
  }

  // ===== GESTION DU STATUT =====
  startEditingStatus(sinistre: Sinistre): void {
    this.selectedSinistre = sinistre;
    this.initEditForm(sinistre);
    this.isEditingStatus = true;
  }

  cancelEditingStatus(): void {
    this.isEditingStatus = false;
  }

  async saveStatus(): Promise<void> {
    if (!this.selectedSinistre) return;

    try {
      const observable = await this.sinistreService.updateSinistreStatus(
        Number(this.selectedSinistre.id),
        this.editForm.statut
      );

      observable.subscribe({
        next: (response) => {
          this.selectedSinistre!.statut = this.editForm.statut;
          this.isEditingStatus = false;
          this.showSuccess('✅ Statut mis à jour avec succès');
        },
        error: (err) => {
          console.error('Erreur mise à jour statut:', err);
          this.showError('❌ Erreur lors de la mise à jour du statut');
        }
      });
    } catch (err) {
      console.error('Erreur:', err);
      this.showError('❌ Erreur lors de la mise à jour');
    }
  }

  // ===== GESTION DES DÉTAILS =====
  startEditingDetails(sinistre: Sinistre): void {
    this.selectedSinistre = sinistre;
    this.initEditForm(sinistre);
    this.isEditingDetails = true;
  }

  cancelEditingDetails(): void {
    this.isEditingDetails = false;
  }

  async saveDetails(): Promise<void> {
    if (!this.selectedSinistre) return;

    try {
      const updatedData = {
        id: this.selectedSinistre.id,
        type: this.editForm.type,
        lieu: this.editForm.lieu,
        description: this.editForm.description,
        etatVehicule: this.editForm.etatVehicule
      };

      const observable = await this.sinistreService.updateSinistre(
        Number(this.selectedSinistre.id),
        updatedData
      );

      observable.subscribe({
        next: (response) => {
          Object.assign(this.selectedSinistre!, {
            type: this.editForm.type,
            lieu: this.editForm.lieu,
            raison: this.editForm.description,
            etat: this.editForm.etatVehicule
          });
          this.isEditingDetails = false;
          this.showSuccess('✅ Détails mis à jour avec succès');
        },
        error: (err) => {
          console.error('Erreur mise à jour détails:', err);
          this.showError('❌ Erreur lors de la mise à jour des détails');
        }
      });
    } catch (err) {
      console.error('Erreur:', err);
      this.showError('❌ Erreur lors de la mise à jour');
    }
  }

  // ===== UPLOAD CONSTAT =====
  onConstatFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedConstat = input.files[0];
    }
  }

  async uploadConstat(event?: Event): Promise<void> {
    // ✅ Empêcher la fermeture du modal
    if (event) {
      event.stopPropagation();
    }

    if (!this.selectedConstat || !this.selectedSinistre) {
      this.showError('⚠️ Veuillez sélectionner un fichier');
      return;
    }

    try {
      this.uploadingConstat = true;
      
      const constatUrl = await this.sinistreService.uploadConstat(
        this.selectedSinistre.id,
        this.selectedConstat
      );

      this.selectedSinistre.constat = constatUrl;
      this.selectedConstat = null;
      this.uploadingConstat = false;
      this.showSuccess('✅ Constat téléversé avec succès');
      
      // Réinitialiser l'input file
      const fileInput = document.getElementById('constatFileInput') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      
    } catch (err) {
      console.error('Erreur upload constat:', err);
      this.uploadingConstat = false;
      this.showError('❌ Erreur lors du téléversement du constat');
    }
  }

  // ===== UPLOAD PHOTOS =====
  onPhotosFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedPhotos = Array.from(input.files);
    }
  }

  async uploadPhotos(event?: Event): Promise<void> {
    // ✅ Empêcher la fermeture du modal
    if (event) {
      event.stopPropagation();
    }

    if (this.selectedPhotos.length === 0 || !this.selectedSinistre) {
      this.showError('⚠️ Veuillez sélectionner au moins une photo');
      return;
    }

    try {
      this.uploadingPhotos = true;

      const photoUrls = await this.sinistreService.uploadImages(
        this.selectedSinistre.id,
        this.selectedPhotos
      );

      this.selectedSinistre.photos.push(...photoUrls);
      const count = photoUrls.length;
      this.selectedPhotos = [];
      this.uploadingPhotos = false;
      this.showSuccess(`✅ ${count} photo(s) téléversée(s) avec succès`);
      
      // Réinitialiser l'input file
      const fileInput = document.getElementById('photosFileInput') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      
    } catch (err) {
      console.error('Erreur upload photos:', err);
      this.uploadingPhotos = false;
      this.showError('❌ Erreur lors du téléversement des photos');
    }
  }

  // ===== UTILITAIRES =====
  selectSinistre(sinistre: Sinistre): void {
    this.selectedSinistre = this.selectedSinistre?.id === sinistre.id ? null : sinistre;
  }

  viewDocument(url: string): void {
    window.open(url, '_blank');
  }

  viewPhoto(photo: string): void {
    window.open(photo, '_blank');
  }

  contactAssistance(): void {
    console.log('Contacting assistance...');
  }

  // ===== STATISTIQUES =====
  getSinistresEnCours(): number {
    return this.sinistres.filter(s => this.getMainStatus(s.statut) === 'enCours').length;
  }

  getSinistresClotures(): number {
    return this.sinistres.filter(s => this.getMainStatus(s.statut) === 'termine').length;
  }

  getTotalVehicules(): number {
    return new Set(this.sinistres.map(s => s.vehicule)).size;
  }

  // ===== MAPPING BACKEND =====
  private mapBackendSinistreToFront(backend: any): Sinistre {
  return {
    id: backend.id.toString(),
    vehiculeId: backend.vehiculeId || backend.vehicule?.id, // ✅ Essayer les deux
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
    documents: backend.documents?.map((doc: any) => doc.objectStorageUrl) || [],
    photos: backend.images?.map((img: any) => img.objectStorageUrl) || [],
    constat: backend.lienConstat || '',
    contratAssurance: backend.vehicule?.contratAssurance || backend.contratAssurance || '', // ✅ Essayer les deux
    type: backend.type ? backend.type.toString() : 'Inconnu',
    etat: backend.etatVehicule ? backend.etatVehicule.toString().toUpperCase() : 'INCONNU',
    raison: backend.description || 'Aucune raison spécifiée',
    lieu: backend.lieu || 'Lieu inconnu',
    iSsigned: backend.isSigned,
    isgarageaffected: backend.isGarageAffected
  };
}

  // ===== MÉTHODES LEGACY (à garder pour compatibilité) =====
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

  getStatutClass(statut: string): string {
    return statut === 'Clôturé' ? 'badge-success' :
      statut === 'En cours' ? 'badge-warning' : 'badge-secondary';
  }

  getStatutIcon(statut: string): string {
    return statut === 'Clôturé' ? 'fas fa-check-circle' :
      statut === 'En cours' ? 'fas fa-clock' : 'fas fa-exclamation-circle';
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
}