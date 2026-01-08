-- Adicionar campos de solicitação na tabela chats
-- Cole no Supabase SQL Editor

-- 1. Adicionar colunas para dados da solicitação
ALTER TABLE chats
ADD COLUMN IF NOT EXISTS quantidade_dias INTEGER,
ADD COLUMN IF NOT EXISTS endereco_entrega_logradouro TEXT,
ADD COLUMN IF NOT EXISTS endereco_entrega_cep TEXT,
ADD COLUMN IF NOT EXISTS endereco_entrega_cidade TEXT,
ADD COLUMN IF NOT EXISTS endereco_entrega_uf TEXT;

-- 2. Adicionar colunas na tabela propostas para valor e frete
ALTER TABLE propostas
ADD COLUMN IF NOT EXISTS valor_diaria DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS quantidade_dias INTEGER,
ADD COLUMN IF NOT EXISTS valor_frete DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS valor_total DECIMAL(10,2);

-- 3. Ver estrutura atualizada
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'chats'
ORDER BY ordinal_position;

SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'propostas'
ORDER BY ordinal_position;
