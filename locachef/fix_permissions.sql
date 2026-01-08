-- ============================================================================
-- FIX: Permissões RLS e Coluna Faltante
-- ============================================================================

-- 1. Adicionar coluna razao_social (opcional) em profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS razao_social text;

-- 2. DESABILITAR RLS temporariamente OU configurar políticas corretas
-- Opção A: Desabilitar RLS (mais simples para desenvolvimento)
ALTER TABLE equipamentos DISABLE ROW LEVEL SECURITY;
ALTER TABLE propostas DISABLE ROW LEVEL SECURITY;
ALTER TABLE chats DISABLE ROW LEVEL SECURITY;
ALTER TABLE mensagens DISABLE ROW LEVEL SECURITY;

-- 3. OU Opção B: Configurar políticas RLS corretas (recomendado para produção)
-- Se preferir manter RLS ativo, comente as linhas acima e descomente abaixo:

/*
-- Habilitar RLS
ALTER TABLE equipamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE propostas ENABLE ROW LEVEL SECURITY;
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE mensagens ENABLE ROW LEVEL SECURITY;

-- Políticas para EQUIPAMENTOS
DROP POLICY IF EXISTS "Qualquer um pode ver equipamentos" ON equipamentos;
CREATE POLICY "Qualquer um pode ver equipamentos"
ON equipamentos FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Locadores podem inserir equipamentos" ON equipamentos;
CREATE POLICY "Locadores podem inserir equipamentos"
ON equipamentos FOR INSERT
WITH CHECK (auth.uid() = locador_id);

DROP POLICY IF EXISTS "Locadores podem atualizar seus equipamentos" ON equipamentos;
CREATE POLICY "Locadores podem atualizar seus equipamentos"
ON equipamentos FOR UPDATE
USING (auth.uid() = locador_id);

DROP POLICY IF EXISTS "Locadores podem deletar seus equipamentos" ON equipamentos;
CREATE POLICY "Locadores podem deletar seus equipamentos"
ON equipamentos FOR DELETE
USING (auth.uid() = locador_id);

-- Políticas para PROPOSTAS
DROP POLICY IF EXISTS "Usuarios podem ver suas propostas" ON propostas;
CREATE POLICY "Usuarios podem ver suas propostas"
ON propostas FOR SELECT
USING (
  auth.uid() = usuario_id OR
  auth.uid() IN (
    SELECT locador_id FROM equipamentos WHERE id = propostas.equipamento_id
  )
);

DROP POLICY IF EXISTS "Locatarios podem criar propostas" ON propostas;
CREATE POLICY "Locatarios podem criar propostas"
ON propostas FOR INSERT
WITH CHECK (auth.uid() = usuario_id);

DROP POLICY IF EXISTS "Usuarios podem atualizar propostas" ON propostas;
CREATE POLICY "Usuarios podem atualizar propostas"
ON propostas FOR UPDATE
USING (
  auth.uid() = usuario_id OR
  auth.uid() IN (
    SELECT locador_id FROM equipamentos WHERE id = propostas.equipamento_id
  )
);

-- Políticas para CHATS
DROP POLICY IF EXISTS "Usuarios podem ver seus chats" ON chats;
CREATE POLICY "Usuarios podem ver seus chats"
ON chats FOR SELECT
USING (auth.uid() = locador_id OR auth.uid() = locatario_id);

DROP POLICY IF EXISTS "Usuarios podem criar chats" ON chats;
CREATE POLICY "Usuarios podem criar chats"
ON chats FOR INSERT
WITH CHECK (auth.uid() = locador_id OR auth.uid() = locatario_id);

DROP POLICY IF EXISTS "Usuarios podem atualizar seus chats" ON chats;
CREATE POLICY "Usuarios podem atualizar seus chats"
ON chats FOR UPDATE
USING (auth.uid() = locador_id OR auth.uid() = locatario_id);

-- Políticas para MENSAGENS
DROP POLICY IF EXISTS "Usuarios podem ver mensagens dos seus chats" ON mensagens;
CREATE POLICY "Usuarios podem ver mensagens dos seus chats"
ON mensagens FOR SELECT
USING (
  auth.uid() IN (
    SELECT locador_id FROM chats WHERE id = mensagens.chat_id
    UNION
    SELECT locatario_id FROM chats WHERE id = mensagens.chat_id
  )
);

DROP POLICY IF EXISTS "Usuarios podem enviar mensagens" ON mensagens;
CREATE POLICY "Usuarios podem enviar mensagens"
ON mensagens FOR INSERT
WITH CHECK (
  auth.uid() = sender_id AND
  auth.uid() IN (
    SELECT locador_id FROM chats WHERE id = mensagens.chat_id
    UNION
    SELECT locatario_id FROM chats WHERE id = mensagens.chat_id
  )
);

DROP POLICY IF EXISTS "Usuarios podem atualizar suas mensagens" ON mensagens;
CREATE POLICY "Usuarios podem atualizar suas mensagens"
ON mensagens FOR UPDATE
USING (
  auth.uid() IN (
    SELECT locador_id FROM chats WHERE id = mensagens.chat_id
    UNION
    SELECT locatario_id FROM chats WHERE id = mensagens.chat_id
  )
);
*/

-- 4. Verificar configuração RLS
SELECT
  schemaname,
  tablename,
  CASE
    WHEN rowsecurity THEN '🔒 RLS ATIVO'
    ELSE '🔓 RLS DESABILITADO'
  END as status_rls
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('equipamentos', 'propostas', 'chats', 'mensagens', 'profiles')
ORDER BY tablename;
