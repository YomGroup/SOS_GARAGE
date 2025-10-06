# Guide de débogage - Problème d'affichage des données véhicules

## Problème identifié

Les informations des véhicules (marque, modèle, etc.) s'affichent maintenant comme "Non spécifié" alors qu'elles s'affichaient correctement avant les modifications de pagination.

## Modifications apportées pour le débogage

### 1. Pagination temporairement désactivée
```typescript
useServerPagination = false; // Temporairement désactivé pour debug
```

### 2. Logs de débogage ajoutés
- Dans `processDataResponse()` : Log des données reçues de l'API
- Dans `getVehiculeInfo()` : Log des informations véhicules pour chaque dossier

## Étapes de débogage

### Étape 1 : Vérifier les logs de la console
1. Ouvrir l'application dans le navigateur
2. Aller dans la section de gestion des dossiers
3. Ouvrir la console développeur (F12)
4. Observer les logs suivants :
   - "Dossiers reçus de l'API:"
   - "Premier dossier:"
   - "Véhicule du premier dossier:"
   - "getVehiculeInfo appelé pour dossier:"
   - "Pas de véhicule pour le dossier:"

### Étape 2 : Analyser la structure des données

#### Si les logs montrent que `dossier.vehicule` est `null` ou `undefined` :
- Le problème vient de l'API qui ne retourne pas les données véhicules
- Solution : Vérifier l'endpoint API ou utiliser l'ancienne méthode

#### Si les logs montrent que `dossier.vehicule` contient des données :
- Le problème vient du traitement des données dans le composant
- Vérifier la structure exacte des données véhicules

### Étape 3 : Comparer avec l'ancien comportement

#### Avant la pagination :
```typescript
// L'ancien code chargeait tous les dossiers avec leurs véhicules
this.dossiersService.getDossiers().subscribe({
  next: (dossiers) => {
    // Les dossiers contenaient déjà les informations véhicules
  }
});
```

#### Avec la pagination :
```typescript
// Le nouveau code charge les dossiers paginés
this.dossiersService.getDossiers(page, size).subscribe({
  next: (response) => {
    // response.content contient les dossiers
    // Mais peut-être sans les informations véhicules
  }
});
```

## Solutions possibles

### Solution 1 : L'API ne retourne pas les véhicules dans la pagination

Si l'API `/sinistre/find_by_page` ne retourne pas les données véhicules :

```typescript
// Option A : Utiliser l'ancienne méthode pour les dossiers
this.dossiersService.getDossiersSimple().subscribe({
  next: (dossiers) => {
    // Tous les dossiers avec leurs véhicules
  }
});

// Option B : Modifier l'API pour inclure les véhicules dans la pagination
// (nécessite une modification côté serveur)
```

### Solution 2 : Les données véhicules sont dans un format différent

Si l'API retourne les véhicules mais dans un format différent :

```typescript
// Adapter le traitement des données
const dossiersAvecVehicules = apiDossiers.map(d => ({
  ...d,
  vehicule: d.vehicule || d.vehicle || d.vehiculeInfo || {},
  // Autres propriétés...
}));
```

### Solution 3 : Chargement asynchrone des véhicules

Si les véhicules doivent être chargés séparément :

```typescript
// Garder la logique existante de chargement asynchrone
dossiersAvecVehicules.forEach(dossier => {
  if (dossier.id && (!dossier.vehicule || !dossier.vehicule.marque)) {
    this.vehiculesEnChargement.add(dossier.id);
    this.dossiersService.getVehiculeFromSinistreId(dossier.id).subscribe({
      next: (vehicule) => {
        if (vehicule) {
          dossier.vehicule = vehicule;
        }
        this.vehiculesEnChargement.delete(dossier.id);
        this.cdr.detectChanges();
      }
    });
  }
});
```

## Test de la solution

### Après avoir identifié et appliqué une solution :

1. **Réactiver la pagination** :
   ```typescript
   useServerPagination = true; // Réactiver après correction
   ```

2. **Supprimer les logs de débogage** :
   - Retirer les `console.log()` ajoutés
   - Nettoyer le code

3. **Tester le fonctionnement** :
   - Vérifier que les marques et modèles s'affichent correctement
   - Tester la pagination
   - Tester les filtres
   - Vérifier les performances

## Points de vérification

- [ ] Les logs de la console montrent les bonnes données
- [ ] Les informations véhicules s'affichent correctement
- [ ] La pagination fonctionne
- [ ] Les filtres fonctionnent
- [ ] Les performances sont acceptables
- [ ] Aucune erreur dans la console

## Prochaines étapes

1. **Immédiat** : Tester avec `useServerPagination = false` pour confirmer que le problème vient de la pagination
2. **Court terme** : Analyser les logs pour identifier la cause exacte
3. **Moyen terme** : Implémenter la solution appropriée
4. **Long terme** : Optimiser les performances avec la pagination côté serveur



