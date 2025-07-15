import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-rls-error',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="rls-error-container" *ngIf="error">
      <div class="alert alert-danger">
        <div class="error-header">
          <i class="fas fa-shield-alt me-2"></i>
          <strong>Erreur de sécurité Supabase</strong>
        </div>
        
        <div class="error-message mt-2">
          <p>{{ error.message || 'Erreur lors de l\'upload vers Supabase' }}</p>
          <p *ngIf="error.details" class="text-muted small">{{ error.details }}</p>
        </div>
        
        <div class="solutions mt-3" *ngIf="error.solutions">
          <h6><i class="fas fa-lightbulb me-2"></i>Solutions :</h6>
          <ol class="solutions-list">
            <li *ngFor="let solution of error.solutions">{{ solution }}</li>
          </ol>
        </div>
        
        <div class="actions mt-3">
          <button class="btn btn-outline-primary btn-sm me-2" (click)="openSetupGuide()">
            <i class="fas fa-book me-1"></i>Guide de configuration
          </button>
          <button class="btn btn-outline-secondary btn-sm" (click)="copySqlScript()">
            <i class="fas fa-copy me-1"></i>Copier le script SQL
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .rls-error-container {
      margin: 15px 0;
    }
    
    .error-header {
      display: flex;
      align-items: center;
      font-size: 1.1rem;
    }
    
    .error-message {
      border-left: 3px solid #dc3545;
      padding-left: 15px;
      margin-left: 5px;
    }
    
    .solutions-list {
      margin: 10px 0;
      padding-left: 20px;
    }
    
    .solutions-list li {
      margin-bottom: 8px;
      line-height: 1.4;
    }
    
    .actions {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
    }
    
    .btn-sm {
      padding: 6px 12px;
      font-size: 0.875rem;
    }
    
    @media (max-width: 768px) {
      .actions {
        flex-direction: column;
      }
    }
  `]
})
export class RlsErrorComponent {
  @Input() error: any;

  openSetupGuide() {
    window.open('SUPABASE_SETUP.md', '_blank');
  }

  copySqlScript() {
    const sqlScript = `-- Script de configuration des politiques RLS
-- Exécutez ce script dans l'éditeur SQL de Supabase

-- Désactiver temporairement RLS (solution rapide)
-- Allez dans Storage → Policies et désactivez RLS pour vos buckets

-- Ou créez les politiques (solution recommandée) :
CREATE POLICY "Allow authenticated uploads to documents" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'documents');

CREATE POLICY "Allow public read access to documents" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'documents');

-- Répétez pour le bucket 'images'
-- Voir le fichier supabase_policies.sql pour le script complet`;

    navigator.clipboard.writeText(sqlScript).then(() => {
      alert('Script SQL copié dans le presse-papiers !');
    }).catch(() => {
      // Fallback pour les navigateurs qui ne supportent pas clipboard
      const textArea = document.createElement('textarea');
      textArea.value = sqlScript;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      alert('Script SQL copié dans le presse-papiers !');
    });
  }
} 