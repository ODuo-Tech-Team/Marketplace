-- Ver o último equipamento cadastrado e sua foto
SELECT
  id,
  nome,
  fotos,
  created_at
FROM equipamentos
ORDER BY created_at DESC
LIMIT 1;

-- Ver metadados do arquivo no Storage
SELECT
  name,
  metadata,
  created_at
FROM storage.objects
WHERE bucket_id = 'equipamentos'
ORDER BY created_at DESC
LIMIT 3;
