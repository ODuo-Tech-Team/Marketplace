-- ============================================================================
-- VERIFICAÇÃO FINAL: Garante que todos os campos têm defaults corretos
-- ============================================================================

-- 1. Garantir que 'status' em propostas tenha default
ALTER TABLE propostas 
ALTER COLUMN status SET DEFAULT 'pendente';

-- 2. Garantir que 'lida' em mensagens tenha default
ALTER TABLE mensagens 
ALTER COLUMN lida SET DEFAULT false;

-- 3. Garantir que 'solicitou_reset' em profiles tenha default
ALTER TABLE profiles 
ALTER COLUMN solicitou_reset SET DEFAULT false;

-- 4. Garantir que 'status' em equipamentos tenha default
ALTER TABLE equipamentos 
ALTER COLUMN status SET DEFAULT 'DISPONIVEL';

-- ============================================================================
-- CONSTRAINTS: Validações de dados
-- ============================================================================

-- Validar valores de status em propostas
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'propostas_status_check'
  ) THEN
    ALTER TABLE propostas 
    ADD CONSTRAINT propostas_status_check 
    CHECK (status IN ('pendente', 'aceita', 'recusada'));
  END IF;
END $$;

-- Validar valores de status em equipamentos
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'equipamentos_status_check'
  ) THEN
    ALTER TABLE equipamentos 
    ADD CONSTRAINT equipamentos_status_check 
    CHECK (status IN ('DISPONIVEL', 'OCUPADO', 'MANUTENCAO', 'disponivel', 'ocupado', 'manutencao'));
  END IF;
END $$;

-- Validar valores de tipo_usuario em profiles
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'profiles_tipo_usuario_check'
  ) THEN
    ALTER TABLE profiles 
    ADD CONSTRAINT profiles_tipo_usuario_check 
    CHECK (tipo_usuario IN ('locador', 'locatario'));
  END IF;
END $$;

-- ============================================================================
-- RESUMO FINAL: O que temos agora
-- ============================================================================
SELECT 
  '✅ TABELA: ' || table_name || ' | TOTAL COLUNAS: ' || COUNT(*) as resumo
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('profiles', 'equipamentos', 'propostas', 'chats', 'mensagens')
GROUP BY table_name
ORDER BY table_name;

