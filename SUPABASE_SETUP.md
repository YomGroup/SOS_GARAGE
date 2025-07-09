# Configuration Supabase pour SOS Garage

## Création des Buckets

Pour que l'application fonctionne correctement avec Supabase Storage, vous devez créer les buckets suivants dans votre projet Supabase :

### 1. Accéder au Dashboard Supabase

1. Connectez-vous à votre compte Supabase
2. Sélectionnez votre projet
3. Allez dans la section "Storage" dans le menu de gauche

### 2. Créer les Buckets

#### Bucket "documents"
- **Nom** : `documents`
- **Description** : Stockage des documents (devis, factures, PDF)
- **Public** : ✅ Oui (pour permettre l'accès aux documents)
- **File size limit** : 50 MB
- **Allowed MIME types** : `application/pdf`, `image/*`

#### Bucket "images"
- **Nom** : `images`
- **Description** : Stockage des images du véhicule
- **Public** : ✅ Oui (pour permettre l'affichage des images)
- **File size limit** : 10 MB
- **Allowed MIME types** : `image/*`

## ⚠️ IMPORTANT : Configuration des Politiques RLS

**Cette étape est CRUCIALE pour résoudre l'erreur "row-level security policy"**

### 3.1. Désactiver temporairement RLS (Solution rapide)

1. Allez dans **Storage** → **Policies**
2. Pour chaque bucket (`documents` et `images`), cliquez sur **"Enable RLS"** pour le désactiver
3. Confirmez la désactivation

### 3.2. Configurer les politiques RLS (Solution recommandée)

Si vous voulez garder RLS activé, créez ces politiques dans l'éditeur SQL de Supabase :

#### Politique pour l'upload (INSERT)
```sql
-- Politique pour permettre l'upload dans le bucket documents
CREATE POLICY "Allow authenticated uploads to documents" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'documents');

-- Politique pour permettre l'upload dans le bucket images
CREATE POLICY "Allow authenticated uploads to images" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'images');
```

#### Politique pour la lecture (SELECT)
```sql
-- Politique pour permettre la lecture publique des documents
CREATE POLICY "Allow public read access to documents" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'documents');

-- Politique pour permettre la lecture publique des images
CREATE POLICY "Allow public read access to images" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'images');
```

#### Politique pour la suppression (DELETE)
```sql
-- Politique pour permettre la suppression par les utilisateurs authentifiés
CREATE POLICY "Allow authenticated deletes from documents" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'documents');

CREATE POLICY "Allow authenticated deletes from images" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'images');
```

#### Politique pour la mise à jour (UPDATE)
```sql
-- Politique pour permettre la mise à jour par les utilisateurs authentifiés
CREATE POLICY "Allow authenticated updates to documents" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'documents');

CREATE POLICY "Allow authenticated updates to images" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'images');
```

### 3.3. Vérifier les politiques existantes

1. Allez dans **Storage** → **Policies**
2. Vérifiez que les politiques sont bien créées pour chaque bucket
3. Assurez-vous que RLS est activé mais avec les bonnes politiques

## 4. Test de la configuration

Après avoir configuré les politiques, testez :

1. **Upload d'un fichier** depuis l'application
2. **Vérification dans le dashboard** Supabase Storage
3. **Téléchargement** du fichier pour confirmer l'accès

## 5. Dépannage

### Erreur "row-level security policy"
- ✅ Vérifiez que les politiques RLS sont créées
- ✅ Ou désactivez temporairement RLS
- ✅ Vérifiez que l'utilisateur est authentifié

### Erreur "bucket not found"
- ✅ Créez les buckets manquants
- ✅ Vérifiez les noms exacts des buckets

### Erreur "permission denied"
- ✅ Vérifiez les politiques RLS
- ✅ Assurez-vous que l'utilisateur a les bonnes permissions

## Variables d'environnement

Assurez-vous que vos fichiers d'environnement contiennent les bonnes variables Supabase :

```typescript
// environment.ts
export const environment = {
  production: false,
  supabase: {
    url: 'VOTRE_URL_SUPABASE',
    key: 'VOTRE_CLE_ANON_SUPABASE'
  }
};
```

## Test de connexion

L'application inclut une méthode de test de connexion qui vérifie automatiquement la connectivité à Supabase au démarrage.

## 🔧 Solution rapide pour tester

Si vous voulez tester rapidement sans configurer RLS :

1. Allez dans **Storage** → **Policies**
2. Désactivez RLS pour les buckets `documents` et `images`
3. Testez l'upload depuis l'application
4. Réactivez RLS plus tard avec les bonnes politiques 