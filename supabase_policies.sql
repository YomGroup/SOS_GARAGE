-- Script de configuration des politiques RLS pour Supabase Storage
-- Exécutez ce script dans l'éditeur SQL de votre dashboard Supabase

-- =====================================================
-- POLITIQUES POUR LE BUCKET "documents"
-- =====================================================

-- Politique pour permettre l'upload de documents
CREATE POLICY "Allow authenticated uploads to documents" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'documents');

-- Politique pour permettre la lecture publique des documents
CREATE POLICY "Allow public read access to documents" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'documents');

-- Politique pour permettre la suppression de documents
CREATE POLICY "Allow authenticated deletes from documents" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'documents');

-- Politique pour permettre la mise à jour de documents
CREATE POLICY "Allow authenticated updates to documents" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'documents');

-- =====================================================
-- POLITIQUES POUR LE BUCKET "images"
-- =====================================================

-- Politique pour permettre l'upload d'images
CREATE POLICY "Allow authenticated uploads to images" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'images');

-- Politique pour permettre la lecture publique des images
CREATE POLICY "Allow public read access to images" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'images');

-- Politique pour permettre la suppression d'images
CREATE POLICY "Allow authenticated deletes from images" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'images');

-- Politique pour permettre la mise à jour d'images
CREATE POLICY "Allow authenticated updates to images" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'images');

-- =====================================================
-- POLITIQUES ALTERNATIVES (si les buckets n'existent pas)
-- =====================================================

-- Politique pour le bucket par défaut (fallback)
CREATE POLICY "Allow authenticated uploads to default" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'default');

CREATE POLICY "Allow public read access to default" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'default');

CREATE POLICY "Allow authenticated deletes from default" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'default');

CREATE POLICY "Allow authenticated updates to default" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'default');

-- =====================================================
-- POLITIQUES GÉNÉRIQUES (pour tous les buckets)
-- =====================================================

-- Politique générique pour l'upload (si vous voulez une approche plus simple)
CREATE POLICY "Allow authenticated uploads to any bucket" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (true);

-- Politique générique pour la lecture
CREATE POLICY "Allow public read access to any bucket" ON storage.objects
FOR SELECT TO public
USING (true);

-- Politique générique pour la suppression
CREATE POLICY "Allow authenticated deletes from any bucket" ON storage.objects
FOR DELETE TO authenticated
USING (true);

-- Politique générique pour la mise à jour
CREATE POLICY "Allow authenticated updates to any bucket" ON storage.objects
FOR UPDATE TO authenticated
USING (true);

-- =====================================================
-- VÉRIFICATION DES POLITIQUES
-- =====================================================

-- Pour vérifier que les politiques sont créées, exécutez :
-- SELECT * FROM storage.policies;

-- Pour supprimer une politique si nécessaire :
-- DROP POLICY "nom_de_la_politique" ON storage.objects; 