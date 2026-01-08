-- ============================================================================
-- VERIFICAR E CORRIGIR POLÍTICAS DE STORAGE
-- ============================================================================

-- 1. Ver todas as políticas do storage.objects
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE schemaname = 'storage' AND tablename = 'objects';

-- 2. Remover TODAS as políticas antigas
DROP POLICY IF EXISTS "Public read access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload to their own folder" ON storage.objects;
DROP POLICY IF EXISTS "Give users access to own folder" ON storage.objects;

-- 3. Criar políticas corretas para o bucket equipamentos

-- 3.1 Leitura pública (todos podem ver imagens)
CREATE POLICY "Public read equipamentos"
ON storage.objects FOR SELECT
USING (bucket_id = 'equipamentos');

-- 3.2 Upload para usuários autenticados
CREATE POLICY "Authenticated upload equipamentos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'equipamentos'
  AND auth.role() = 'authenticated'
);

-- 3.3 Update para usuários autenticados (sobrescrever suas próprias imagens)
CREATE POLICY "Authenticated update equipamentos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'equipamentos'
  AND auth.role() = 'authenticated'
);

-- 3.4 Delete para usuários autenticados
CREATE POLICY "Authenticated delete equipamentos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'equipamentos'
  AND auth.role() = 'authenticated'
);

-- 4. Verificar resultado final
SELECT
  policyname,
  permissive,
  roles,
  cmd as operacao
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND policyname LIKE '%equipamentos%';
