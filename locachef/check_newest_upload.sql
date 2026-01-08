-- Ver os 3 arquivos mais recentes no Storage com metadados completos
SELECT
  name,
  metadata->>'contentType' as content_type,
  metadata->>'size' as size_bytes,
  (metadata->>'size')::bigint / 1024 as size_kb,
  created_at
FROM storage.objects
WHERE bucket_id = 'equipamentos'
ORDER BY created_at DESC
LIMIT 3;
