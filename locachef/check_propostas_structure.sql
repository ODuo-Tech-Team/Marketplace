-- Ver estrutura da tabela propostas
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'propostas'
ORDER BY ordinal_position;
