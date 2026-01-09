-- =====================================================
-- SCRIPT V2: Criar função RPC para aceitar/recusar proposta
-- LocaObra - Sistema de Locação de Equipamentos
-- =====================================================

-- 1. Criar usuário do sistema na tabela profiles (necessário para FK)
INSERT INTO profiles (id, email, full_name, role)
VALUES (
    '00000000-0000-0000-0000-000000000000',
    'sistema@locaobra.com',
    'Sistema LocaObra',
    'system'
)
ON CONFLICT (id) DO NOTHING;

-- 2. Adicionar colunas no equipamentos se não existirem
ALTER TABLE equipamentos ADD COLUMN IF NOT EXISTS locado_para TEXT;
ALTER TABLE equipamentos ADD COLUMN IF NOT EXISTS locado_para_id UUID;

-- 3. Dropar função antiga se existir
DROP FUNCTION IF EXISTS executar_aceite_proposta(UUID, UUID, UUID, UUID, BOOLEAN);

-- 4. Criar função RPC com SECURITY DEFINER
CREATE OR REPLACE FUNCTION executar_aceite_proposta(
    p_proposta_id UUID,
    p_equipamento_id UUID,
    p_chat_id UUID,
    p_sender_id UUID,
    p_aceitar BOOLEAN
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_novo_status TEXT;
    v_mensagem_sistema TEXT;
BEGIN
    -- Define o novo status baseado na decisão
    IF p_aceitar THEN
        v_novo_status := 'aceita';
        v_mensagem_sistema := '✅ Proposta aceita! Locação confirmada.';
    ELSE
        v_novo_status := 'recusada';
        v_mensagem_sistema := '❌ Proposta recusada pelo cliente.';
    END IF;

    -- 1. Atualiza o status da proposta
    UPDATE propostas
    SET status = v_novo_status
    WHERE id = p_proposta_id;

    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Proposta não encontrada'
        );
    END IF;

    -- 2. Envia mensagem do sistema no chat (usando o sender_id do usuário que aceitou/recusou)
    INSERT INTO mensagens (chat_id, sender_id, texto, lida)
    VALUES (
        p_chat_id,
        p_sender_id,  -- Usa o ID do usuário que está respondendo
        v_mensagem_sistema,
        false
    );

    -- 3. Retorna sucesso
    RETURN json_build_object(
        'success', true,
        'message', CASE WHEN p_aceitar THEN 'Proposta aceita com sucesso' ELSE 'Proposta recusada' END
    );

EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', SQLERRM
        );
END;
$$;

-- 5. Conceder permissão
GRANT EXECUTE ON FUNCTION executar_aceite_proposta(UUID, UUID, UUID, UUID, BOOLEAN) TO authenticated;

-- =====================================================
-- VERIFICAÇÃO
-- =====================================================
SELECT 'Função criada com sucesso!' as resultado;
