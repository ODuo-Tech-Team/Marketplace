-- =====================================================
-- Adicionar coluna senha_temporaria na tabela profiles
-- Execute este SQL no Supabase SQL Editor
-- =====================================================

-- PASSO 1: Adicionar coluna senha_temporaria (boolean, default false)
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS senha_temporaria BOOLEAN DEFAULT false;

-- PASSO 2: Garantir que todos os perfis existentes tenham false
UPDATE profiles
SET senha_temporaria = false
WHERE senha_temporaria IS NULL;

-- PASSO 3: Verificar se a coluna foi criada
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'profiles' AND column_name = 'senha_temporaria';

-- =====================================================
-- COMO FUNCIONA:
-- 1. Admin reseta a senha do cliente no painel admin
-- 2. A função no admin define senha_temporaria = true
-- 3. Cliente loga com a senha padrão (123456)
-- 4. Modal aparece forçando troca de senha
-- 5. Após trocar, senha_temporaria volta para false
-- =====================================================

SELECT '✅ Coluna senha_temporaria criada com sucesso!' as resultado;
