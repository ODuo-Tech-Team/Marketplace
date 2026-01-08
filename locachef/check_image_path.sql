-- Verificar o path exato da foto salva no banco
SELECT
  id,
  nome,
  fotos,
  fotos[1] as primeira_foto,
  length(fotos[1]) as tamanho_path
FROM equipamentos
WHERE nome = 'betoneira neira'
LIMIT 1;
