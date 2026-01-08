-- ============================================================================
-- CONFIGURAR CASCADE DELETE PARA EQUIPAMENTOS
-- ============================================================================

-- 1. Ver constraint atual
SELECT
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name,
  rc.delete_rule
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
JOIN information_schema.referential_constraints AS rc
  ON tc.constraint_name = rc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name = 'chats'
  AND kcu.column_name = 'equipamento_id';

-- 2. Remover constraint antiga
ALTER TABLE chats
DROP CONSTRAINT IF EXISTS chats_equipamento_id_fkey;

-- 3. Recriar com CASCADE DELETE
ALTER TABLE chats
ADD CONSTRAINT chats_equipamento_id_fkey
FOREIGN KEY (equipamento_id)
REFERENCES equipamentos(id)
ON DELETE CASCADE;

-- 4. Fazer o mesmo para mensagens -> chats
ALTER TABLE mensagens
DROP CONSTRAINT IF EXISTS mensagens_chat_id_fkey;

ALTER TABLE mensagens
ADD CONSTRAINT mensagens_chat_id_fkey
FOREIGN KEY (chat_id)
REFERENCES chats(id)
ON DELETE CASCADE;

-- 5. Fazer o mesmo para propostas -> chats
ALTER TABLE propostas
DROP CONSTRAINT IF EXISTS propostas_chat_id_fkey;

ALTER TABLE propostas
ADD CONSTRAINT propostas_chat_id_fkey
FOREIGN KEY (chat_id)
REFERENCES chats(id)
ON DELETE CASCADE;

-- 6. Verificar resultado
SELECT
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  rc.delete_rule
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
JOIN information_schema.referential_constraints AS rc
  ON tc.constraint_name = rc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND (
    (tc.table_name = 'chats' AND kcu.column_name = 'equipamento_id')
    OR (tc.table_name = 'mensagens' AND kcu.column_name = 'chat_id')
    OR (tc.table_name = 'propostas' AND kcu.column_name = 'chat_id')
  )
ORDER BY tc.table_name;
