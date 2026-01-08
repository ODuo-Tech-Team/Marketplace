-- ============================================================================
-- SCRIPT DE CORREÇÃO: Adiciona colunas faltantes no banco LocaObra
-- ============================================================================

-- 1. TABELA equipamentos - Faltam apenas as colunas de perfil do locador
--    O código faz JOINs com profiles para pegar nome_empresa, razao_social, full_name
--    Essas colunas JÁ EXISTEM em profiles, então não precisa adicionar aqui.

-- 2. TABELA chats - Adicionar coluna 'equipamento_id' (usada no código)
--    O código em vários lugares busca chat.equipamento_id
ALTER TABLE chats 
ADD COLUMN IF NOT EXISTS equipamento_id uuid REFERENCES equipamentos(id);

-- Popular equipamento_id baseado na proposta
UPDATE chats 
SET equipamento_id = propostas.equipamento_id
FROM propostas
WHERE chats.proposta_id = propostas.id
AND chats.equipamento_id IS NULL;

-- 3. Index para performance (opcional mas recomendado)
CREATE INDEX IF NOT EXISTS idx_chats_equipamento_id ON chats(equipamento_id);
CREATE INDEX IF NOT EXISTS idx_chats_proposta_id ON chats(proposta_id);
CREATE INDEX IF NOT EXISTS idx_propostas_equipamento_id ON propostas(equipamento_id);
CREATE INDEX IF NOT EXISTS idx_propostas_usuario_id ON propostas(usuario_id);
CREATE INDEX IF NOT EXISTS idx_mensagens_chat_id ON mensagens(chat_id);
CREATE INDEX IF NOT EXISTS idx_mensagens_sender_id ON mensagens(sender_id);
CREATE INDEX IF NOT EXISTS idx_equipamentos_locador_id ON equipamentos(locador_id);

-- ============================================================================
-- CONFIRMAÇÃO: Verificar estrutura final
-- ============================================================================
SELECT 
  'TABELA: ' || table_name || ' | COLUNA: ' || column_name || ' | TIPO: ' || data_type as estrutura_atualizada
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('profiles', 'equipamentos', 'propostas', 'chats', 'mensagens')
ORDER BY table_name, ordinal_position;

-- ============================================================================
-- NOTA: Campos que o código usa mas que vêm de JOINs (não precisa adicionar):
-- ============================================================================
-- - equipamentos.locador_nome_empresa (vem de JOIN com profiles.nome_empresa)
-- - equipamentos.locador_razao_social (vem de JOIN com profiles.razao_social)
-- - equipamentos.locador_full_name (vem de JOIN com profiles.full_name)
-- - chat.equipamento (vem de JOIN com equipamentos)
-- - chat.proposta (vem de JOIN com propostas)

