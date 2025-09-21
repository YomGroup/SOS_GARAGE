# Déploiement Netlify - SOS Garage

## Configuration

Ce projet est configuré pour fonctionner correctement sur Netlify avec le routage Angular.

### Fichiers de configuration

1. **`public/_redirects`** : Redirige toutes les routes vers `index.html` pour permettre le routage Angular côté client
2. **`netlify.toml`** : Configuration explicite de Netlify avec les paramètres de build et redirections

### Structure des fichiers

```
public/
├── _redirects          # Configuration des redirections Netlify
├── favicon.ico         # Icône du site
└── 1.png              # Images statiques

netlify.toml           # Configuration Netlify
```

## Déploiement

### Méthode 1 : Déploiement automatique via Git

1. Connectez votre dépôt Git à Netlify
2. Netlify détectera automatiquement la configuration
3. Les déploiements se feront automatiquement à chaque push

### Méthode 2 : Déploiement manuel

1. Build de l'application :
   ```bash
   npm run build:prod
   ```

2. Le dossier `dist/sos-garage/browser` contient les fichiers à déployer

### Configuration Netlify

- **Build command** : `npm run build:prod`
- **Publish directory** : `dist/sos-garage/browser`
- **Node version** : 18

## Résolution des problèmes

### Erreur 404 sur les routes

Si vous obtenez des erreurs 404 sur les routes Angular (comme `/login`, `/admin`, etc.), vérifiez que :

1. Le fichier `public/_redirects` existe et contient :
   ```
   /*    /index.html   200
   ```

2. Le fichier `netlify.toml` est présent à la racine du projet

3. Les fichiers sont bien inclus dans le build (vérifié dans `angular.json`)

### Redéploiement

Après modification des fichiers de configuration :

1. Commitez et poussez les changements
2. Netlify redéploiera automatiquement
3. Ou déclenchez un nouveau déploiement depuis le dashboard Netlify

## Routes de l'application

- `/` → Page d'accueil (redirige vers `/client`)
- `/client` → Interface client publique
- `/login` → Page de connexion
- `/register` → Page d'inscription
- `/admin/*` → Interface administrateur (protégée)
- `/garage/*` → Interface garagiste (protégée)
- `/clientDashboard/*` → Interface client connecté (protégée) 