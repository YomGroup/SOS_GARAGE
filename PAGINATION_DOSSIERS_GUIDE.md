# Guide de pagination pour les Dossiers

## Vue d'ensemble

La pagination a été implémentée pour le service dossiers et les composants de gestion des dossiers. Le système supporte maintenant la pagination côté serveur tout en maintenant la compatibilité avec l'ancienne approche.

## Modifications apportées

### 1. DossiersService

#### Nouvelles méthodes avec pagination :
```typescript
// Méthode avec pagination côté serveur
getDossiers(page: number = 0, size: number = 10): Observable<PaginatedResponse<Dossier>>

// Méthode sans pagination (pour compatibilité)
getDossiersSimple(): Observable<Dossier[]>
```

#### Structure de réponse paginée :
```typescript
interface PaginatedResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  empty: boolean;
}
```

### 2. DossierManagementComponent

#### Nouvelles propriétés :
```typescript
// Pagination côté serveur
totalDossiersFromServer = 0;
totalPagesFromServer = 0;
useServerPagination = true; // Flag pour basculer entre pagination côté serveur et côté client
```

#### Méthodes adaptées :
- `loadData()` : Détecte automatiquement le type de pagination à utiliser
- `loadDataWithPagination()` : Charge les données avec pagination côté serveur
- `loadDataSimple()` : Charge toutes les données (comportement original)
- `processDataResponse()` : Traite les données reçues (factorisation du code)
- `onPageChange()` : Gère les changements de page selon le type de pagination
- `onToolbarFiltersChanged()` : Applique les filtres selon le type de pagination

## Utilisation

### Activation de la pagination côté serveur

Par défaut, la pagination côté serveur est activée (`useServerPagination = true`).

```typescript
export class DossierManagementComponent {
  useServerPagination = true; // Activer la pagination côté serveur
  
  ngOnInit() {
    // Le composant utilisera automatiquement la pagination côté serveur
    this.loadData();
  }
}
```

### Désactivation (retour au comportement original)

Pour revenir au comportement original (pagination côté client) :

```typescript
export class DossierManagementComponent {
  useServerPagination = false; // Désactiver la pagination côté serveur
  
  ngOnInit() {
    // Le composant utilisera la pagination côté client
    this.loadData();
  }
}
```

### Gestion des événements de pagination

```typescript
onPageChange(event: PageEvent) {
  this.pageIndex = event.pageIndex;
  this.pageSize = event.pageSize;
  
  if (this.useServerPagination) {
    // Recharger les données avec la nouvelle page
    this.loadData();
  } else {
    // Pagination côté client (comportement original)
    this.cdr.detectChanges();
  }
}
```

### Gestion des filtres

```typescript
onToolbarFiltersChanged(): void {
  this.pageIndex = 0;
  
  if (this.useServerPagination) {
    // Pour la pagination côté serveur, recharger les données
    this.loadData();
  } else {
    // Appliquer via MatTable filter (pagination côté client)
    const filterObj = { q: this.rechercheTexte, statut: this.statutFiltre, client: this.clientFiltre };
    this.dataSource.filter = JSON.stringify(filterObj);
  }
}
```

## Configuration du template HTML

### Pagination côté serveur

Quand `useServerPagination = true`, le paginator de MatTable est désactivé :

```typescript
ngAfterViewInit() {
  // Ne configurer le paginator de MatTable que si on utilise la pagination côté client
  if (!this.useServerPagination) {
    this.dataSource.paginator = this.paginator;
  }
  this.dataSource.sort = this.sort;
}
```

### Affichage des statistiques

```html
<!-- Le template peut utiliser totalDossiersFromServer pour afficher le total -->
<div class="stats">
  <span>Total dossiers : {{ totalDossiersFromServer }}</span>
  <span>Page {{ pageIndex + 1 }} sur {{ totalPagesFromServer }}</span>
</div>
```

## Avantages de la pagination côté serveur

1. **Performance** : Chargement uniquement des données nécessaires
2. **Scalabilité** : Support de grandes bases de données
3. **Réactivité** : Interface plus rapide avec moins de données à traiter
4. **Compatibilité** : Possibilité de revenir à l'ancien comportement

## Migration

### Pour activer la pagination côté serveur :

1. Assurez-vous que l'API supporte la pagination avec les paramètres `page` et `size`
2. Définissez `useServerPagination = true` dans le composant
3. Testez le fonctionnement avec les filtres et la navigation

### Pour revenir à l'ancien comportement :

1. Définissez `useServerPagination = false` dans le composant
2. Le composant utilisera automatiquement `getDossiersSimple()`

## Points d'attention

1. **Filtres** : Avec la pagination côté serveur, les filtres doivent être appliqués côté serveur
2. **Tri** : Le tri doit également être géré côté serveur
3. **Recherche** : La recherche doit être intégrée dans les paramètres de pagination
4. **Statistiques** : Utiliser `totalDossiersFromServer` au lieu de la longueur du tableau local

## Exemple d'implémentation côté serveur

```typescript
// API endpoint avec pagination et filtres
GET /api/sinistre/find_by_page?page=0&size=10&search=term&status=en_cours&client=nom

// Réponse
{
  "content": [...],
  "page": 0,
  "size": 10,
  "totalElements": 150,
  "totalPages": 15,
  "empty": false
}
```



