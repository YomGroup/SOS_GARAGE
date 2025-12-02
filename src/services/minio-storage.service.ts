import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, from, of } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class MinioStorageService {
  private apiUrl = `${environment.apiUrl}/image`;

  constructor(private http: HttpClient) {}

  /**
   * Upload multiple images/files to MinIO via backend API
   * @param id - Identifier (missionId, garageId, etc.)
   * @param files - Array of files to upload
   * @returns Observable<string[]> - Array of download URLs
   */
  uploadImages(id: string | number, files: File[]): Observable<string[]> {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('images', file, file.name);
    });

    return this.http.post<string[]>(`${this.apiUrl}/uploads/${id}`, formData);
  }

  /**
   * Upload a single image/file to MinIO via backend API
   * @param id - Identifier (missionId, garageId, etc.)
   * @param file - File to upload
   * @returns Observable<string> - Download URL
   */
  uploadImage(id: string | number, file: File): Observable<string> {
    const formData = new FormData();
    formData.append('image', file, file.name);

    return this.http.post<string>(`${this.apiUrl}/add/${id}`, formData, {
      responseType: 'text' as 'json'
    });
  }

  /**
   * Upload a PDF document for a mission
   */
  uploadPdfFile(file: File, missionId: number): Observable<string> {
    return this.uploadImage(`mission_${missionId}_pdf`, file);
  }

  /**
   * Upload a devis document for a mission
   */
  uploadDevisFile(file: File, missionId: number): Observable<string> {
    return this.uploadImage(`mission_${missionId}_devis`, file);
  }

  /**
   * Upload a facture document for a mission
   */
  uploadFactureFile(file: File, missionId: number): Observable<string> {
    return this.uploadImage(`mission_${missionId}_facture`, file);
  }

  /**
   * Upload an image for a mission
   */
  uploadImageFile(file: File, missionId: number): Observable<string> {
    return this.uploadImage(`mission_${missionId}_image`, file);
  }

  /**
   * Upload garage logo
   */
  uploadGarageLogo(file: File, garageId: number): Observable<string> {
    return this.uploadImage(`garage_${garageId}_logo`, file);
  }

  /**
   * Upload garage image (reparation or gallery)
   */
  uploadGarageImage(file: File, garageId: number): Observable<string> {
    return this.uploadImage(`garage_${garageId}_gallery`, file);
  }

  /**
   * Upload vehicule pret image
   */
  uploadVehiculePretImage(file: File, garageId: number): Observable<string> {
    return this.uploadImage(`garage_${garageId}_vehicule_pret`, file);
  }

  /**
   * Upload multiple documents for a mission
   */
  uploadMissionDocuments(missionId: number, files: File[]): Observable<string[]> {
    return this.uploadImages(`mission_${missionId}`, files);
  }

  /**
   * Upload multiple photos for a mission (reparation photos)
   */
  uploadMissionPhotos(missionId: number, files: File[]): Observable<string[]> {
    return this.uploadImages(`mission_${missionId}_photos`, files);
  }

  /**
   * Download a file (returns blob)
   */
  downloadFile(url: string): Observable<Blob> {
    return this.http.get(url, { responseType: 'blob' });
  }
}

