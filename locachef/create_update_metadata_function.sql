-- ============================================================================
-- CRIAR FUNÇÃO PARA ATUALIZAR METADATA DO STORAGE
-- ============================================================================

CREATE OR REPLACE FUNCTION update_storage_metadata(
  p_bucket_id TEXT,
  p_name TEXT,
  p_content_type TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE storage.objects
  SET metadata = jsonb_set(
    COALESCE(metadata, '{}'::jsonb),
    '{contentType}',
    to_jsonb(p_content_type)
  )
  WHERE bucket_id = p_bucket_id
    AND name = p_name;
END;
$$;

-- Testar a função (opcional)
-- SELECT update_storage_metadata('equipamentos', 'test.png', 'image/png');
