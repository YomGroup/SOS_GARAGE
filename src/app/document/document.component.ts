import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { AssureService } from '../../services/assure.service';
import { FormsModule } from '@angular/forms';

interface Document {
  id: number;
  type: string;
  fichier: string;
  signatureElectronique: string;
  createdAt: string | null;
}

interface Sinistre {
  id: number;
  documents: Document[];
  [key: string]: any;
}

interface Vehicle {
  id: number;
  marque: string;
  modele: string;
  immatriculation: string;
  sinistres: Sinistre[];
  [key: string]: any;
}

interface DocumentItem {
  doc: Document;
  vehicle: Vehicle;
  sinistre: Sinistre;
}

@Component({
  selector: 'app-document',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './document.component.html',
  styleUrls: ['./document.component.css']
})
export class DocumentComponent implements OnInit {
  documents: DocumentItem[] = [];
  vehicles: Vehicle[] = [];
  filteredDocuments: DocumentItem[] = [];
  userid: string | null = null;
  assureId: number = 0;

  // Filtres
  typeFilter: string = '';
  vehicleFilter: string = '';
  searchText: string = '';

  private authService = inject(AuthService);
  private assureService = inject(AssureService);

  ngOnInit() {
    this.userid = this.authService.getToken()?.['sub'] ?? null;
    if (this.userid) {
      this.assureService.getAssurerID(this.userid).subscribe({
        next: (data: any) => {
          this.assureId = data.id;
          this.loadDocuments();
        },
        error: (err) => {
          console.error('Erreur lors de la récupération de l\'assure ID :', err);
        }
      });
    }
  }

  loadDocuments(): void {
    this.assureService.addAssurerGet(this.assureId).subscribe({
      next: (data: any) => {
        this.vehicles = data.vehicules || [];
        this.extractDocuments();
        this.applyFilters();
      },
      error: (err) => {
        console.error('Erreur lors du chargement des documents:', err);
      }
    });
  }

  extractDocuments(): void {
    this.documents = [];
    this.vehicles.forEach((vehicle) => {
      (vehicle.sinistres || []).forEach((sinistre: Sinistre) => {
        (sinistre.documents || []).forEach((doc: Document) => {
          this.documents.push({
            doc,
            vehicle,
            sinistre
          });
        });
      });
    });
  }

  applyFilters(): void {
    this.filteredDocuments = this.documents.filter(item => {
      const matchesType = !this.typeFilter || item.doc.type.toLowerCase() === this.typeFilter.toLowerCase();
      const matchesVehicle = !this.vehicleFilter || item.vehicle.id.toString() === this.vehicleFilter;
      const matchesSearch = !this.searchText ||
        item.doc.fichier.toLowerCase().includes(this.searchText.toLowerCase()) ||
        item.doc.type.toLowerCase().includes(this.searchText.toLowerCase()) ||
        item.vehicle.marque.toLowerCase().includes(this.searchText.toLowerCase()) ||
        item.vehicle.modele.toLowerCase().includes(this.searchText.toLowerCase());

      return matchesType && matchesVehicle && matchesSearch;
    });
  }

  onDownload(doc: Document): void {
    // Implémentation basique - à adapter selon votre système de fichiers
    const link = document.createElement('a');
    link.href = doc.fichier;
    link.download = doc.fichier.split('/').pop() || 'document';
    link.click();
  }

  onView(doc: Document): void {
    window.open(doc.fichier, '_blank');
  }

  onDelete(doc: Document): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce document ?')) {
      // Implémenter la logique de suppression ici
      console.log('Document à supprimer:', doc);
      alert('Fonctionnalité de suppression à implémenter');
    }
  }

  getDocumentIconClass(type: string): string {
    switch (type.toLowerCase()) {
      case 'constat': return 'fas fa-file-contract';
      case 'mandat': return 'fas fa-file-signature';
      case 'cession': return 'fas fa-handshake';
      default: return 'fas fa-file';
    }
  }

  getDocumentDate(createdAt: string | null): string {
    if (!createdAt) return 'Date inconnue';
    const date = new Date(createdAt);
    return date.toLocaleDateString('fr-FR');
  }

  getDocumentTitle(type: string): string {
    switch (type.toLowerCase()) {
      case 'constat': return "Constat amiable";
      case 'mandat': return "Mandat de gestion";
      case 'cession': return "Cession de créance";
      default: return "Document";
    }
  }

  resetFilters(): void {
    this.typeFilter = '';
    this.vehicleFilter = '';
    this.searchText = '';
    this.applyFilters();
  }
}