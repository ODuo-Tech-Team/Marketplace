-- Limpar todos os arquivos do Storage (cuidado: isso apaga tudo!)
DELETE FROM storage.objects
WHERE bucket_id = 'equipamentos';

-- Verificar se limpou
SELECT COUNT(*) as total_arquivos
FROM storage.objects
WHERE bucket_id = 'equipamentos';
