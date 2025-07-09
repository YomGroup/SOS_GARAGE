import { Injectable } from '@angular/core';
import { Observable, from } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class FirebaseStorageService {
  
  // Configuration Firebase (à adapter selon votre projet)
  private firebaseConfig = {
    // Vos clés Firebase ici
  };

  constructor() {
    // Initialiser Firebase si pas déjà fait
    // this.initializeFirebase();
  }

  // Uploader un fichier PDF vers Firebase Storage
  uploadPdfFile(file: File, missionId: number): Observable<string> {
    return from(this.uploadToFirebase(file, missionId, 'document'));
  }

  // Uploader une image vers Firebase Storage
  uploadImageFile(file: File, missionId: number): Observable<string> {
    return from(this.uploadToFirebase(file, missionId, 'image'));
  }

  // Uploader un devis vers Firebase Storage
  uploadDevisFile(file: File, missionId: number): Observable<string> {
    return from(this.uploadToFirebase(file, missionId, 'devis'));
  }

  // Uploader une facture vers Firebase Storage
  uploadFactureFile(file: File, missionId: number): Observable<string> {
    return from(this.uploadToFirebase(file, missionId, 'facture'));
  }

  // Méthode privée pour upload vers Firebase
  private async uploadToFirebase(file: File, missionId: number, type: string = 'document'): Promise<string> {
    try {
      // Générer le nom de fichier selon le type
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
      
      // Ici vous utiliseriez Firebase Storage
      // const storageRef = firebase.storage().ref();
      // const fileRef = storageRef.child(filePath);
      // const snapshot = await fileRef.put(file);
      // const downloadURL = await snapshot.ref.getDownloadURL();
      
      // Pour l'instant, on simule l'URL de téléchargement
      const downloadURL = `https://firebasestorage.googleapis.com/v0/b/your-project/o/${encodeURIComponent(filePath)}?alt=media`;
      
      console.log('Fichier uploadé avec succès:', downloadURL);
      return downloadURL;
    } catch (error) {
      console.error('Erreur lors de l\'upload:', error);
      throw new Error('Erreur lors de l\'upload du fichier');
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

  // Supprimer un fichier de Firebase Storage
  deletePdfFile(downloadURL: string): Observable<void> {
    return from(this.deleteFromFirebase(downloadURL));
  }

  // Méthode privée pour suppression depuis Firebase
  private async deleteFromFirebase(downloadURL: string): Promise<void> {
    try {
      // Ici vous utiliseriez Firebase Storage pour supprimer
      // const storageRef = firebase.storage().refFromURL(downloadURL);
      // await storageRef.delete();
      
      console.log('Fichier supprimé avec succès');
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      throw new Error('Erreur lors de la suppression du fichier');
    }
  }
}