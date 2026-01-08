-- ============================================================================
-- CONFIGURAR STORAGE PÚBLICO PARA IMAGENS DE EQUIPAMENTOS
-- ============================================================================

-- 1. Tornar o bucket 'equipamentos' público
UPDATE storage.buckets
SET public = true
WHERE id = 'equipamentos';

-- 2. Verificar se o bucket está público
SELECT id, name, public
FROM storage.buckets
WHERE id = 'equipamentos';

-- 3. Criar política de leitura pública para todos (se não existir)
DO $$
BEGIN
  -- Remove política antiga se existir
  DROP POLICY IF EXISTS "Public read access" ON storage.objects;

  -- Cria nova política de leitura pública
  CREATE POLICY "Public read access"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'equipamentos');

  RAISE NOTICE 'Política de leitura pública criada com sucesso';
EXCEPTION
  WHEN others THEN
    RAISE NOTICE 'Erro ao criar política: %', SQLERRM;
END $$;

-- 4. Verificar políticas ativas
SELECT policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'storage' AND tablename = 'objects';
