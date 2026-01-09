-- =====================================================
-- SCRIPT: Criar função RPC para aceitar/recusar proposta
-- LocaObra - Sistema de Locação de Equipamentos
-- =====================================================

-- Adicionar colunas no equipamentos se não existirem
ALTER TABLE equipamentos ADD COLUMN IF NOT EXISTS locado_para TEXT;
ALTER TABLE equipamentos ADD COLUMN IF NOT EXISTS locado_para_id UUID;

-- Dropar função antiga se existir (para recriar)
DROP FUNCTION IF EXISTS executar_aceite_proposta(UUID, UUID, UUID, UUID, BOOLEAN);

-- Criar função RPC com SECURITY DEFINER para bypassar RLS
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

    -- 2. Envia mensagem do sistema no chat
    INSERT INTO mensagens (chat_id, sender_id, texto, lida)
    VALUES (
        p_chat_id,
        '00000000-0000-0000-0000-000000000000'::UUID, -- ID do sistema
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

-- Conceder permissão para usuários autenticados executarem a função
GRANT EXECUTE ON FUNCTION executar_aceite_proposta(UUID, UUID, UUID, UUID, BOOLEAN) TO authenticated;

-- =====================================================
-- VERIFICAÇÃO: Execute para confirmar que foi criado
-- =====================================================
-- SELECT proname, pronargs FROM pg_proc WHERE proname = 'executar_aceite_proposta';
