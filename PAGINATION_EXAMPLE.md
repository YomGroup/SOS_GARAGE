# Guide d'utilisation de la pagination

## Vue d'ensemble

La pagination a été implémentée côté API et les services Angular ont été mis à jour pour supporter cette nouvelle fonctionnalité. Voici comment utiliser la pagination dans vos composants.

## Structure de la réponse API

L'API retourne maintenant une réponse paginée avec la structure suivante :

```json
{
  "content": [
    // ... éléments de la page courante
  ],
  "page": 0,
  "size": 10,
  "totalElements": 2,
  "totalPages": 1,
  "empty": false
}
```

## Services mis à jour

### AdminService

```typescript
// Méthode avec pagination
getAllVehicules(page: number = 0, size: number = 10): Observable<PaginatedResponse<Vehicule>>

// Méthode sans pagination (pour compatibilité)
getAllVehiculesSimple(): Observable<Vehicule[]>

// Méthode avec pagination
getSinistre(page: number = 0, size: number = 10): Observable<PaginatedResponse<Sinistre>>

// Méthode sans pagination (pour compatibilité)
getSinistreSimple(): Observable<Sinistre[]>
```

### VehicleService

```typescript
// Méthode mise à jour avec paramètres cohérents
getVehiculesPage(page: number = 0, size: number = 10)
```

## Exemples d'utilisation

### 1. Utilisation basique avec pagination

```typescript
export class MonComposant implements OnInit {
  vehicules: Vehicule[] = [];
  currentPage = 0;
  pageSize = 10;
  totalElements = 0;
  totalPages = 0;

  constructor(private adminService: AdminService) {}

  ngOnInit() {
    this.loadVehicules();
  }

  loadVehicules() {
    this.adminService.getAllVehicules(this.currentPage, this.pageSize).subscribe({
      next: (response) => {
        this.vehicules = response.content;
        this.totalElements = response.totalElements;
        this.totalPages = response.totalPages;
      },
      error: (error) => {
        console.error('Erreur lors du chargement:', error);
      }
    });
  }

  onPageChange(page: number) {
    this.currentPage = page;
    this.loadVehicules();
  }

  onPageSizeChange(size: number) {
    this.pageSize = size;
    this.currentPage = 0; // Retour à la première page
    this.loadVehicules();
  }
}
```

### 2. Utilisation pour les statistiques (récupérer tous les éléments)

```typescript
export class DashboardComponent implements OnInit {
  stats = {
    totalVehicules: 0,
    totalSinistres: 0
  };

  constructor(private adminService: AdminService) {}

  ngOnInit() {
    this.loadStats();
  }

  loadStats() {
    // Utiliser une grande taille de page pour récupérer tous les éléments
    this.adminService.getAllVehicules(0, 1000).subscribe({
      next: (response) => {
        this.stats.totalVehicules = response.totalElements;
      }
    });

    this.adminService.getSinistre(0, 1000).subscribe({
      next: (response) => {
        this.stats.totalSinistres = response.totalElements;
      }
    });
  }
}
```

### 3. Interface utilisateur avec pagination

```html
<!-- Template HTML -->
<div class="vehicles-container">
  <div class="vehicles-list">
    <div *ngFor="let vehicle of vehicules" class="vehicle-card">
      <!-- Contenu du véhicule -->
    </div>
  </div>

  <!-- Contrôles de pagination -->
  <div class="pagination-controls">
    <button 
      (click)="onPageChange(currentPage - 1)" 
      [disabled]="currentPage === 0">
      Précédent
    </button>
    
    <span>
      Page {{ currentPage + 1 }} sur {{ totalPages }}
      ({{ totalElements }} éléments au total)
    </span>
    
    <button 
      (click)="onPageChange(currentPage + 1)" 
      [disabled]="currentPage >= totalPages - 1">
      Suivant
    </button>
  </div>

  <!-- Sélecteur de taille de page -->
  <select (change)="onPageSizeChange($event.target.value)">
    <option value="10">10 par page</option>
    <option value="25">25 par page</option>
    <option value="50">50 par page</option>
  </select>
</div>
```

## Migration des composants existants

### Avant (sans pagination)

```typescript
this.adminService.getAllVehicules().subscribe({
  next: (vehicules) => {
    this.vehicules = vehicules;
    this.totalCount = vehicules.length;
  }
});
```

### Après (avec pagination)

```typescript
this.adminService.getAllVehicules(this.currentPage, this.pageSize).subscribe({
  next: (response) => {
    this.vehicules = response.content;
    this.totalCount = response.totalElements;
    this.totalPages = response.totalPages;
  }
});
```

## Bonnes pratiques

1. **Pour les tableaux/listes** : Utilisez la pagination côté serveur avec des tailles de page raisonnables (10, 25, 50)

2. **Pour les statistiques** : Utilisez une grande taille de page (1000) pour récupérer tous les éléments

3. **Gestion des erreurs** : Toujours inclure la gestion d'erreur dans vos appels

4. **Loading states** : Affichez des indicateurs de chargement pendant les requêtes

5. **URL parameters** : Considérez l'ajout de la pagination dans l'URL pour permettre le partage de liens

## Paramètres par défaut

- **page** : 0 (première page)
- **size** : 10 (10 éléments par page)

## Compatibilité

Les méthodes "Simple" (sans pagination) sont conservées pour assurer la compatibilité avec le code existant. Il est recommandé de migrer progressivement vers les nouvelles méthodes avec pagination.



