-- =====================================================
-- Adicionar coluna status_entrega na tabela propostas
-- Execute este SQL no Supabase SQL Editor
-- =====================================================

-- 1. Adiciona a coluna status_entrega se não existir
ALTER TABLE propostas
ADD COLUMN IF NOT EXISTS status_entrega TEXT;

-- 2. Atualiza propostas antigas que já foram entregues (equipamento com status OCUPADO)
-- Isso corrige dados históricos
UPDATE propostas p
SET status_entrega = 'ENTREGUE'
FROM equipamentos e
WHERE p.equipamento_id = e.id
  AND p.status = 'aceita'
  AND e.status = 'OCUPADO'
  AND (p.status_entrega IS NULL OR p.status_entrega = '');

-- 3. Verificar resultado
SELECT
  p.id,
  p.status,
  p.status_entrega,
  e.nome as equipamento,
  e.status as status_equipamento
FROM propostas p
LEFT JOIN equipamentos e ON e.id = p.equipamento_id
WHERE p.status = 'aceita'
ORDER BY p.created_at DESC
LIMIT 20;
