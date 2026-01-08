-- ============================================================================
-- LIMPAR E RECRIAR POLÍTICAS DE STORAGE
-- ============================================================================

-- 1. Remover TODAS as políticas do storage.objects
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', pol.policyname);
    RAISE NOTICE 'Política removida: %', pol.policyname;
  END LOOP;
END $$;

-- 2. Criar políticas corretas para o bucket equipamentos

-- 2.1 Leitura pública (todos podem ver imagens)
CREATE POLICY "Public read equipamentos"
ON storage.objects FOR SELECT
USING (bucket_id = 'equipamentos');

-- 2.2 Upload para usuários autenticados
CREATE POLICY "Authenticated upload equipamentos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'equipamentos'
  AND auth.role() = 'authenticated'
);

-- 2.3 Update para usuários autenticados
CREATE POLICY "Authenticated update equipamentos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'equipamentos'
  AND auth.role() = 'authenticated'
);

-- 2.4 Delete para usuários autenticados
CREATE POLICY "Authenticated delete equipamentos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'equipamentos'
  AND auth.role() = 'authenticated'
);

-- 3. Verificar resultado final
SELECT
  policyname,
  permissive,
  roles,
  cmd as operacao
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND policyname LIKE '%equipamentos%'
ORDER BY policyname;
