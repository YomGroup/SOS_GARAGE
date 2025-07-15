import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import jsPDF from 'jspdf';

@Component({
  selector: 'app-document-creation-modal',
  templateUrl: './document-creation-modal.component.html',
  standalone: true,
  imports: [CommonModule, FormsModule],
})
export class DocumentCreationModalComponent {
  @Output() documentCreated = new EventEmitter<File>();
  @Output() closed = new EventEmitter<void>();

  formData = {
    nom: '',
    prenom: '',
    expertise: '',
    marque: '',
    modele: '',
    immatriculation: '',
    kilometrage: 0,
    dateSinistre: '',
    description: '',
    evaluation: 0,
    conclusion: ''
  };

  generateAndEmitPDF() {
    const doc = new jsPDF();

    let y = 10;

    const addLine = (label: string, value: any) => {
      doc.text(`${label}: ${value ?? 'N/A'}`, 10, y);
      y += 10;
    };

    // Informations Expert
    doc.setFontSize(14);
    doc.text('Informations de l\'expert', 10, y);
    y += 10;
    doc.setFontSize(12);
    addLine('Nom', this.formData.nom);
    addLine('Prénom', this.formData.prenom);
    addLine('Spécialité / Expertise', this.formData.expertise);

    // Informations Véhicule
    doc.setFontSize(14);
    doc.text('Informations du véhicule', 10, y);
    y += 10;
    doc.setFontSize(12);
    addLine('Marque', this.formData.marque);
    addLine('Modèle', this.formData.modele);
    addLine('Immatriculation', this.formData.immatriculation);
    addLine('Kilométrage', this.formData.kilometrage + ' km');

    // Détails du sinistre
    doc.setFontSize(14);
    doc.text('Détails du sinistre', 10, y);
    y += 10;
    doc.setFontSize(12);
    addLine('Date du sinistre', this.formData.dateSinistre);
    doc.text('Description du sinistre:', 10, y);
    y += 10;
    doc.setFontSize(11);
    const splitDesc = doc.splitTextToSize(this.formData.description, 180);
    doc.text(splitDesc, 10, y);
    y += splitDesc.length * 7;

    // Conclusion
    doc.setFontSize(14);
    doc.text('Conclusion de l\'expertise', 10, y);
    y += 10;
    doc.setFontSize(12);
    addLine('Évaluation des dommages (€)', this.formData.evaluation + ' €');
    doc.text('Conclusion:', 10, y);
    y += 10;
    const splitConclusion = doc.splitTextToSize(this.formData.conclusion, 180);
    doc.text(splitConclusion, 10, y);
    y += splitConclusion.length * 7;

    // Création du fichier PDF
    const pdfBlob = doc.output('blob');
    const file = new File([pdfBlob], 'document_expertise.pdf', { type: 'application/pdf' });
    this.documentCreated.emit(file);
  }

  close() {
    this.closed.emit();
  }
}
