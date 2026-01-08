-- RPC aceitar_proposta_v2 - Versão simplificada
-- Permite aceitar/recusar proposta e atualizar equipamento em uma única transação
-- Usa SECURITY DEFINER para bypassar RLS

CREATE OR REPLACE FUNCTION aceitar_proposta_v2(
  p_proposta_id UUID,
  p_chat_id UUID,
  p_equipamento_id UUID,
  p_aceitar BOOLEAN
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER -- Executa com permissões do owner da função
SET search_path = public
AS $$
DECLARE
  v_novo_status TEXT;
  v_chat_status TEXT;
BEGIN
  -- Define os status baseado na ação
  IF p_aceitar THEN
    v_novo_status := 'aceita';
    v_chat_status := 'proposta_aceita';
  ELSE
    v_novo_status := 'recusada';
    v_chat_status := 'proposta_recusada';
  END IF;

  -- 1. Atualiza a proposta
  UPDATE propostas
  SET status = v_novo_status
  WHERE id = p_proposta_id;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Proposta não encontrada');
  END IF;

  -- 2. Atualiza o status do chat
  UPDATE chats
  SET status = v_chat_status
  WHERE id = p_chat_id;

  -- 3. Se aceitou, marca o equipamento como indisponível (LOCADO)
  IF p_aceitar THEN
    UPDATE equipamentos
    SET disponivel = false
    WHERE id = p_equipamento_id;

    IF NOT FOUND THEN
      -- Rollback manual se equipamento não foi encontrado
      UPDATE propostas SET status = 'pendente' WHERE id = p_proposta_id;
      UPDATE chats SET status = 'proposta_enviada' WHERE id = p_chat_id;
      RETURN json_build_object('success', false, 'error', 'Equipamento não encontrado');
    END IF;
  END IF;

  -- Retorna sucesso
  RETURN json_build_object(
    'success', true,
    'message', CASE WHEN p_aceitar THEN 'Proposta aceita com sucesso' ELSE 'Proposta recusada' END
  );

EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- Concede permissão para usuários autenticados
GRANT EXECUTE ON FUNCTION aceitar_proposta_v2(UUID, UUID, UUID, BOOLEAN) TO authenticated;

-- Comentário explicativo
COMMENT ON FUNCTION aceitar_proposta_v2 IS 'Aceita ou recusa uma proposta, atualizando proposta, chat e equipamento em uma única transação. Usa SECURITY DEFINER para bypassar RLS.';
