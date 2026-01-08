-- Script para debugar propostas
-- Cole este script no Supabase SQL Editor

-- 1. Ver todos os chats
SELECT
  id as chat_id,
  equipamento_id,
  locador_id,
  locatario_id,
  created_at
FROM chats
ORDER BY created_at DESC
LIMIT 5;

-- 2. Ver todas as propostas
SELECT
  id as proposta_id,
  equipamento_id,
  usuario_id,
  status,
  endereco_logradouro,
  endereco_cep,
  created_at
FROM propostas
ORDER BY created_at DESC
LIMIT 5;

-- 3. Ver chats SEM proposta
SELECT
  c.id as chat_id,
  c.equipamento_id,
  c.locatario_id,
  e.nome as equipamento_nome
FROM chats c
LEFT JOIN propostas p ON (p.equipamento_id = c.equipamento_id AND p.usuario_id = c.locatario_id)
LEFT JOIN equipamentos e ON e.id = c.equipamento_id
WHERE p.id IS NULL;

-- 4. CRIAR PROPOSTA DE TESTE (SE NECESSÁRIO)
-- Descomente e ajuste os IDs abaixo:

/*
INSERT INTO propostas (equipamento_id, usuario_id, status)
VALUES (
  'SEU_EQUIPAMENTO_ID_AQUI',  -- Pegar do resultado da query 1
  'SEU_LOCATARIO_ID_AQUI',    -- Pegar do resultado da query 1
  'pendente'
);
*/
