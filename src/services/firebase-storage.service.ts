import { Injectable } from '@angular/core';
import { Observable, from } from 'rxjs';
import { storage } from '../main';
import { ref, uploadBytes, getDownloadURL, deleteObject, uploadBytesResumable } from "firebase/storage";
import { switchMap } from 'rxjs/operators';
@Injectable({
  providedIn: 'root'
})
export class FirebaseStorageService {

  // Uploader un fichier PDF vers Firebase Storage
  uploadPdfFile(fileBlob: Blob, missionId: number): Observable<string> {
    const filePath = `missions/${missionId}/documents/${Date.now()}.pdf`;
    const fileRef = ref(storage, filePath);

    return from(uploadBytes(fileRef, fileBlob)).pipe(
      switchMap(() => getDownloadURL(fileRef))
    );
  }

  uploadImageFile(file: File, missionId: number): Observable<string> {
    return from(this.uploadToFirebase(file, missionId, 'image'));
  }

  uploadDevisFile(file: File, missionId: number): Observable<string> {
    return from(this.uploadToFirebase(file, missionId, 'devis'));
  }

  // === Garage specific uploads ===
  // Upload the garage logo to Firebase Storage and return the public URL
  uploadGarageLogo(file: File, garageId: number): Observable<string> {
    const safeName = encodeURIComponent(file.name);
    const filePath = `garages/${garageId}/logo/${Date.now()}_${safeName}`;
    const fileRef = ref(storage, filePath);
    return from(uploadBytes(fileRef, file)).pipe(switchMap(() => getDownloadURL(fileRef)));
  }

  // Upload a garage image (reparation or gallery) and return the public URL
  uploadGarageImage(file: File, garageId: number): Observable<string> {
    const safeName = encodeURIComponent(file.name);
    const filePath = `garages/${garageId}/images/${Date.now()}_${safeName}`;
    const fileRef = ref(storage, filePath);
    return from(uploadBytes(fileRef, file)).pipe(switchMap(() => getDownloadURL(fileRef)));
  }

  uploadFactureFile(file: File, missionId: number): Observable<string> {
    return from(this.uploadToFirebase(file, missionId, 'facture'));
  }

  private async uploadToFirebase(file: File, missionId: number, type: string): Promise<string> {
    try {
      const originalName = file.name;
      const fileExtension = originalName.split('.').pop() || '';
      const baseName = originalName.replace(`.${fileExtension}`, '');

      let fileName: string;
      switch (type) {
        case 'image':
          fileName = `image${missionId}.${baseName}.${fileExtension}`;
          break;
        case 'devis':
          fileName = `devis${missionId}.${baseName}.${fileExtension}`;
          break;
        case 'facture':
          fileName = `facture${missionId}.${baseName}.${fileExtension}`;
          break;
        default:
          fileName = `mission_${missionId}_${Date.now()}_${originalName}`;
      }

      const filePath = `missions/${missionId}/documents/${fileName}`;
      const fileRef = ref(storage, filePath);
      await uploadBytes(fileRef, file);
      const downloadURL = await getDownloadURL(fileRef);

      console.log('Fichier uploadé avec succès:', downloadURL);
      return downloadURL;
    } catch (error) {
      console.error('Erreur lors de l\'upload:', error);
      throw error;
    }
  }
  // Télécharger un fichier depuis Firebase Storage
  downloadPdfFile(downloadURL: string): Observable<Blob> {
    return from(this.downloadFromFirebase(downloadURL));
  }

  // Méthode privée pour téléchargement depuis Firebase
  private async downloadFromFirebase(downloadURL: string): Promise<Blob> {
    try {
      const response = await fetch(downloadURL);
      if (!response.ok) {
        throw new Error('Erreur lors du téléchargement');
      }
      return await response.blob();
    } catch (error) {
      console.error('Erreur lors du téléchargement:', error);
      throw new Error('Erreur lors du téléchargement du fichier');
    }
  }


  // Pour supprimer, il faut un chemin relatif, pas l'URL complète
  deletePdfFile(filePath: string): Observable<void> {
    return from(this.deleteFromFirebase(filePath));
  }

  // Supprimer un fichier à partir d'une URL de téléchargement Firebase
  deleteFileByUrl(downloadUrl: string): Observable<void> {
    const path = this.extractPathFromDownloadUrl(downloadUrl);
    return from(this.deleteFromFirebase(path));
  }

  private async deleteFromFirebase(filePath: string): Promise<void> {
    try {
      const fileRef = ref(storage, filePath);
      await deleteObject(fileRef);
      console.log('Fichier supprimé avec succès');
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      throw error;
    }
  }

  private extractPathFromDownloadUrl(downloadUrl: string): string {
    // Formats supportés: https URL (firebasestorage), gs://, ou chemin direct
    if (!downloadUrl) return '';
    if (downloadUrl.startsWith('gs://')) {
      // Convert gs://bucket/path -> path
      const withoutScheme = downloadUrl.replace(/^gs:\/\//, '');
      const parts = withoutScheme.split('/');
      parts.shift(); // remove bucket
      return parts.join('/');
    }
    if (downloadUrl.startsWith('http')) {
      const afterO = downloadUrl.split('/o/')[1] || '';
      const beforeQuery = afterO.split('?')[0] || '';
      return decodeURIComponent(beforeQuery);
    }
    return downloadUrl; // assume already a relative path
  }
}




