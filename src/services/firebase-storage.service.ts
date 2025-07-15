import { Injectable } from '@angular/core';
import { Observable, from } from 'rxjs';
import { storage } from '../main';
import { ref, uploadBytes, getDownloadURL, deleteObject, uploadBytesResumable } from "firebase/storage";
import { last, switchMap } from 'rxjs/operators'; // <-- Import RxJS operators
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
}




