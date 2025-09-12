import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { NgIf } from '@angular/common';
import { PdfViewerModule } from 'ng2-pdf-viewer';
import { FormsModule } from '@angular/forms';
import { environment } from '../../environments/environment';
import { KeycloakService } from 'keycloak-angular';
import JSZip from 'jszip';
import { ActivatedRoute } from '@angular/router';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-document-signing',
  imports: [
    NgIf,
    PdfViewerModule,
    FormsModule
  ],
  templateUrl: './document-signing.component.html',
  styleUrl: './document-signing.component.css'
})
export class DocumentSigningComponent implements OnInit {

  currentStep = 5;
  allDocumentsSigned = false;

  currentPdf: any = null;
  currentPdfError = false;

  isChecked = false;
  isSigning = false;
  isCurrentDocumentSigned = false;
  currentDocument = 'Contrat.pdf';

  // IDs pour la signature
  signatureRequestId!: string;
  documentId!: string;

  sinistreId!: string;

  apiUrl = environment.apiUrlLocale;

  constructor(private http: HttpClient,private keycloakService:KeycloakService,private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.sinistreId = this.route.snapshot.paramMap.get('id')!;
    console.log('ID du sinistre reçu :', this.sinistreId);
    this.generateDocument();
  }

 async generateDocument() {
  const isLoggedIn = await this.keycloakService.isLoggedIn();
  if (!isLoggedIn) {
    console.warn('Utilisateur non connecté');
    return;
  }

  const token = await this.keycloakService.getToken();
  //console.log('Token Keycloak:', token);

  const tokenParsed = this.keycloakService.getKeycloakInstance().tokenParsed;
  //console.log('Token Parsed:', tokenParsed);

  const request = {
    documentType: "ordre_reparation",
    values: {
      nomAssure: "Paul Bernard",
      adresseAssure: "12 rue Victor Hugo, Marseille",
      marqueVehicule: "Peugeot",
      modeleVehicule: "208",
      immatriculation: "CC-789-DD",
      kilometrage: "45000",
      dateDebutReparation: "2025-09-05",
      dateFinReparation: "2025-09-10",
      lieuSignature: "Marseille",
      dateSignature: "2025-09-04",
      nomGaragiste: "Joan"
    }
  };

  const headers = { Authorization: `Bearer ${token}` };

  this.http.post(`${this.apiUrl}documents/generate/${this.sinistreId}`,{}, {
    headers,
    responseType: 'arraybuffer'
  })
  .subscribe({
    next: (pdfData) => {
      if (!pdfData || pdfData.byteLength === 0) {
      this.currentPdfError = true;
      console.error('PDF vide');
      return;
    }
    console.log('PDF généré avec succès');
    // Créer un Blob
    const blob = new Blob([pdfData], { type: 'application/pdf' });
    this.currentPdf = URL.createObjectURL(blob);
    this.currentPdfError = false;
    },
    error: (err) => {
      console.error(err);
      this.currentPdfError = true;
    }
  });


}


async signDocument() {
  if (!this.isChecked) return;

  this.isSigning = true;
  try {
    const token = await this.keycloakService.getToken();
    const headers = { Authorization: `Bearer ${token}` };

    // 1️⃣ Créer une demande de signature
    const createResponse: any = await firstValueFrom(
      this.http.post(`${this.apiUrl}signature/create`, {
        name: "Contrat Mohamed",
        deliveryMode: "email",  // tu peux garder email pour recevoir la notif
        timezone: "Europe/Paris"
      }, { headers })
    );
    this.signatureRequestId = createResponse.id;

    // 2️⃣ Upload du PDF
    const pdfResponse = await firstValueFrom(
      this.http.get(this.currentPdf, { responseType: "arraybuffer" })
    );
    const formData = new FormData();
    formData.append("file", new Blob([pdfResponse], { type: "application/pdf" }), this.currentDocument);

    const uploadResponse: any = await firstValueFrom(
      this.http.post(`${this.apiUrl}signature/${this.signatureRequestId}/document`, formData, { headers })
    );
    this.documentId = uploadResponse.id;

    // 3️⃣ Ajouter un signataire et récupérer le lien
    const signerResponse: any = await firstValueFrom(
      this.http.post(`${this.apiUrl}signature/${this.signatureRequestId}/signer/url`, {
        email: "elouafimed2@gmail.com",
        firstName: "Mohamed",
        lastName: "Elouafi",
        documentId: this.documentId,
        x: 100,
        y: 600,
        page: 1,
        idsinistre:this.sinistreId
      }, { headers })
    );

    const signingUrl = signerResponse.url;  // <-- c'est ici le lien

    // 4️⃣ Activer la demande
    /*
    await firstValueFrom(
      this.http.post(`${this.apiUrl}signature/${this.signatureRequestId}/activate`, {}, { headers })
    );
    */

    this.isCurrentDocumentSigned = true;
    console.log("le lient est le suivant :"+signingUrl);
    alert("Le document a été envoyé pour signature ✅");

    // 5️⃣ Ouvrir le widget YouSign dans un nouvel onglet
    window.open(signingUrl, '_blank');

  } catch (err) {
    console.error(err);
    alert("Une erreur est survenue lors du processus de signature ❌");
  } finally {
    this.isSigning = false;
  }
}


}

