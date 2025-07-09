import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private supabase: SupabaseClient;

  constructor() {
    // Configuration Supabase depuis l'environnement
    const supabaseUrl = environment.supabase.url;
    const supabaseKey = environment.supabase.key;
    
    // Créer le client Supabase
    this.supabase = createClient(supabaseUrl, supabaseKey);
    
    console.log('Service Supabase initialisé');
  }

  /**
   * Récupérer le client Supabase
   */
  getClient(): SupabaseClient {
    return this.supabase;
  }

  /**
   * Tester la connexion à Supabase
   */
  async testConnection(): Promise<boolean> {
    try {
      const { data, error } = await this.supabase.from('test').select('*').limit(1);
      
      if (error) {
        console.error('Erreur de connexion Supabase:', error);
        return false;
      }
      
      console.log('Connexion Supabase réussie');
      return true;
    } catch (error) {
      console.error('Erreur lors du test de connexion:', error);
      return false;
    }
  }

  /**
   * Uploader un fichier vers Supabase Storage
   */
  async uploadFile(
    bucket: string, 
    path: string, 
    file: File
  ): Promise<{ data: any; error: any }> {
    try {
      const { data, error } = await this.supabase.storage
        .from(bucket)
        .upload(path, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Erreur upload Supabase:', error);
        return { data: null, error };
      }

      console.log('Fichier uploadé vers Supabase:', data);
      return { data, error: null };
    } catch (error) {
      console.error('Erreur lors de l\'upload:', error);
      return { data: null, error };
    }
  }

  /**
   * Télécharger un fichier depuis Supabase Storage
   */
  async downloadFile(bucket: string, path: string): Promise<{ data: any; error: any }> {
    try {
      const { data, error } = await this.supabase.storage
        .from(bucket)
        .download(path);

      if (error) {
        console.error('Erreur téléchargement Supabase:', error);
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      console.error('Erreur lors du téléchargement:', error);
      return { data: null, error };
    }
  }

  /**
   * Supprimer un fichier de Supabase Storage
   */
  async deleteFile(bucket: string, path: string): Promise<{ data: any; error: any }> {
    try {
      const { data, error } = await this.supabase.storage
        .from(bucket)
        .remove([path]);

      if (error) {
        console.error('Erreur suppression Supabase:', error);
        return { data: null, error };
      }

      console.log('Fichier supprimé de Supabase:', data);
      return { data, error: null };
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      return { data: null, error };
    }
  }

  /**
   * Obtenir l'URL publique d'un fichier
   */
  getPublicUrl(bucket: string, path: string): string {
    const { data } = this.supabase.storage
      .from(bucket)
      .getPublicUrl(path);
    
    return data.publicUrl;
  }

  /**
   * Lister les fichiers dans un bucket
   */
  async listFiles(bucket: string, path?: string): Promise<{ data: any; error: any }> {
    try {
      const { data, error } = await this.supabase.storage
        .from(bucket)
        .list(path || '');

      if (error) {
        console.error('Erreur liste fichiers Supabase:', error);
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      console.error('Erreur lors de la liste:', error);
      return { data: null, error };
    }
  }
} 