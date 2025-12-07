import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DocumentService, DocumentType } from '../../../../../services/document.service';

interface Sinistre {
  id: number;
  assureEmail: string;
  assureName: string;
  vehiculeImmatriculation: string;
  type: string;
  statut: string;
  createdAt: any;
}

@Component({
  selector: 'app-document-generation',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './document-generation.component.html',
  styleUrls: ['./document-generation.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DocumentGenerationComponent implements OnInit {
  
  // Liste des sinistres
  sinistres: Sinistre[] = [];
  filteredSinistres: Sinistre[] = [];
  
  // Filtres
  searchEmail: string = '';
  
  // Sélection
  selectedSinistre: Sinistre | null = null;
  selectedDocumentType: DocumentType = 'ordre_reparation';
  
  // Types de documents disponibles
  documentTypes: { value: DocumentType; label: string; icon: string; description: string }[] = [
    { 
      value: 'ordre_reparation', 
      label: 'Ordre de Réparation', 
      icon: 'fas fa-tools',
      description: 'Document officiel autorisant la réparation du véhicule'
    },
    { 
      value: 'cession1', 
      label: 'Cession Type 1', 
      icon: 'fas fa-file-signature',
      description: 'Formulaire de cession de véhicule - Version 1'
    },
    { 
      value: 'cession2', 
      label: 'Cession Type 2', 
      icon: 'fas fa-file-contract',
      description: 'Formulaire de cession de véhicule - Version 2'
    }
  ];
  
  // États
  isLoading: boolean = false;
  isGenerating: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';

  constructor(
    private documentService: DocumentService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadSinistres();
  }

  loadSinistres(): void {
    this.isLoading = true;
    this.errorMessage = '';
    
    this.documentService.getAllSinistres(0, 1000).subscribe({
      next: (response) => {
        // Handle paginated response
        const data = response.content || response;
        this.sinistres = data.map((s: any) => ({
          id: s.id,
          assureEmail: s.contactAssistance || s.assureEmail || 'Non renseigné',
          assureName: s.assureName || this.extractNameFromEmail(s.contactAssistance),
          vehiculeImmatriculation: s.vehiculeImmatriculation || s.vehicule?.immatriculation || 'Non renseigné',
          type: s.type || 'Sinistre',
          statut: s.statut || 'EN_ATTENTE',
          createdAt: s.createdAt
        }));
        this.filteredSinistres = [...this.sinistres];
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Erreur lors du chargement des sinistres:', err);
        this.errorMessage = 'Erreur lors du chargement des sinistres';
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  extractNameFromEmail(email: string): string {
    if (!email || !email.includes('@')) return 'Inconnu';
    const name = email.split('@')[0];
    return name.charAt(0).toUpperCase() + name.slice(1).replace(/[._]/g, ' ');
  }

  filterSinistres(): void {
    const searchTerm = this.searchEmail.toLowerCase().trim();
    
    if (!searchTerm) {
      this.filteredSinistres = [...this.sinistres];
    } else {
      this.filteredSinistres = this.sinistres.filter(s => 
        s.assureEmail.toLowerCase().includes(searchTerm) ||
        s.assureName.toLowerCase().includes(searchTerm) ||
        s.vehiculeImmatriculation.toLowerCase().includes(searchTerm) ||
        s.id.toString().includes(searchTerm)
      );
    }
    this.cdr.markForCheck();
  }

  selectSinistre(sinistre: Sinistre): void {
    this.selectedSinistre = sinistre;
    this.successMessage = '';
    this.errorMessage = '';
    this.cdr.markForCheck();
  }

  selectDocumentType(type: DocumentType): void {
    this.selectedDocumentType = type;
    this.cdr.markForCheck();
  }

  generateDocument(): void {
    if (!this.selectedSinistre) {
      this.errorMessage = 'Veuillez sélectionner un sinistre';
      this.cdr.markForCheck();
      return;
    }

    this.isGenerating = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.cdr.markForCheck();

    this.documentService.generateDocumentBySinistre(
      this.selectedSinistre.id, 
      this.selectedDocumentType
    ).subscribe({
      next: (blob) => {
        const filename = `${this.selectedDocumentType}_sinistre_${this.selectedSinistre?.id}_${new Date().toISOString().slice(0,10)}.pdf`;
        this.documentService.downloadPdf(blob, filename);
        
        this.successMessage = `Document "${this.getDocumentLabel(this.selectedDocumentType)}" généré avec succès !`;
        this.isGenerating = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Erreur lors de la génération du document:', err);
        this.errorMessage = 'Erreur lors de la génération du document. Vérifiez que le sinistre a une mission associée.';
        this.isGenerating = false;
        this.cdr.markForCheck();
      }
    });
  }

  getDocumentLabel(type: DocumentType): string {
    const doc = this.documentTypes.find(d => d.value === type);
    return doc ? doc.label : type;
  }

  formatDate(dateArray: any): string {
    if (!dateArray) return 'N/A';
    
    try {
      if (Array.isArray(dateArray)) {
        const [year, month, day] = dateArray;
        return new Date(year, month - 1, day).toLocaleDateString('fr-FR');
      }
      return new Date(dateArray).toLocaleDateString('fr-FR');
    } catch {
      return 'N/A';
    }
  }

  getStatusClass(statut: string): string {
    const status = statut?.toUpperCase() || '';
    if (status.includes('ATTENTE') || status.includes('PENDING')) return 'status-pending';
    if (status.includes('COURS') || status.includes('PROGRESS')) return 'status-progress';
    if (status.includes('TERMINE') || status.includes('CLOSED')) return 'status-closed';
    if (status.includes('REJECT') || status.includes('ANNUL')) return 'status-danger';
    return 'status-info';
  }

  clearSelection(): void {
    this.selectedSinistre = null;
    this.successMessage = '';
    this.errorMessage = '';
    this.cdr.markForCheck();
  }
}

