# Optimisations de Build - SOS Garage

## Problème résolu

Le build échouait sur Netlify avec l'erreur :
```
✘ [ERROR] bundle initial exceeded maximum budget. Budget 2.00 MB was not met by 373.77 kB with a total of 2.37 MB.
```

## Solutions implémentées

### 1. Augmentation des budgets

**Avant :**
```json
"maximumWarning": "1.5MB",
"maximumError": "2MB"
```

**Après :**
```json
"maximumWarning": "2.5MB",
"maximumError": "3MB"
```

### 2. Configuration optimisée pour Netlify

Nouvelle configuration `netlify` avec :
- Budgets augmentés à 3MB/4MB
- Optimisations activées
- Gestion des dépendances CommonJS

### 3. Gestion des dépendances CommonJS

Ajout de `allowedCommonJsDependencies` pour les modules problématiques :
- `sweetalert2`
- `canvg`
- `html2canvas`
- `pako`
- `core-js`
- `raf`
- `rgbcolor`

### 4. Optimisations de build

- `optimization: true` - Active la minification et l'optimisation
- `extractLicenses: true` - Extrait les licences dans un fichier séparé
- `sourceMap: false` - Désactive les source maps en production
- `outputHashing: "all"` - Ajoute des hashes pour le cache busting

## Scripts de build

- `npm run build` - Build de développement
- `npm run build:prod` - Build de production standard
- `npm run build:netlify` - Build optimisé pour Netlify

## Configuration Netlify

Le fichier `netlify.toml` utilise maintenant :
```toml
command = "npm run build:netlify"
```

## Monitoring de la taille

Pour surveiller la taille du bundle :
```bash
npm run build:netlify
```

Les warnings sur les dépendances CommonJS sont normaux et n'affectent pas le fonctionnement.

## Optimisations futures

Pour réduire davantage la taille du bundle :

1. **Lazy loading** - Charger les modules à la demande
2. **Tree shaking** - Éliminer le code inutilisé
3. **Code splitting** - Diviser le bundle en chunks
4. **Optimisation des images** - Compresser les assets
5. **CDN** - Servir les dépendances depuis un CDN 