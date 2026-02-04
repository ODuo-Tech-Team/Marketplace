# 🔧 SETUP DO BANCO SUPABASE - TRAKTO RENT

## 📋 RESUMO: O QUE FALTA NO SEU BANCO

Comparando a estrutura atual do banco com o código, encontrei **1 campo faltante**:

### ❌ FALTANDO:
- **`chats.equipamento_id`** - O código busca esse campo em vários lugares

### ✅ JÁ EXISTEM (corretos):
- `profiles`: `id`, `email`, `full_name`, `tipo_usuario`, `nome_empresa`, `solicitou_reset`, `created_at`
- `equipamentos`: `id`, `nome`, `descricao`, `preco_diaria`, `fotos`, `status`, `categoria`, `cidade`, `uf`, `locador_id`, `created_at`
- `propostas`: `id`, `equipamento_id`, `usuario_id`, `status`, `endereco_logradouro`, `endereco_cep`, `endereco_cidade`, `endereco_uf`, `created_at`
- `chats`: `id`, `proposta_id`, `locador_id`, `locatario_id`, `created_at`
- `mensagens`: `id`, `chat_id`, `sender_id`, `texto`, `lida`, `created_at`

---

## 🚀 COMO EXECUTAR NO SUPABASE

### **Passo 1: Adicionar Coluna Faltante**

Acesse o **SQL Editor** do Supabase e execute:

```sql
-- Adiciona equipamento_id na tabela chats
ALTER TABLE chats
ADD COLUMN IF NOT EXISTS equipamento_id uuid REFERENCES equipamentos(id);

-- Popular equipamento_id baseado na proposta (para chats existentes)
UPDATE chats
SET equipamento_id = propostas.equipamento_id
FROM propostas
WHERE chats.proposta_id = propostas.id
AND chats.equipamento_id IS NULL;

-- Index para performance
CREATE INDEX IF NOT EXISTS idx_chats_equipamento_id ON chats(equipamento_id);
```

### **Passo 2: Configurar Defaults e Constraints**

```sql
-- Defaults
ALTER TABLE propostas ALTER COLUMN status SET DEFAULT 'pendente';
ALTER TABLE mensagens ALTER COLUMN lida SET DEFAULT false;
ALTER TABLE profiles ALTER COLUMN solicitou_reset SET DEFAULT false;
ALTER TABLE equipamentos ALTER COLUMN status SET DEFAULT 'DISPONIVEL';

-- Validações (opcional mas recomendado)
ALTER TABLE propostas
ADD CONSTRAINT propostas_status_check
CHECK (status IN ('pendente', 'aceita', 'recusada'));

ALTER TABLE equipamentos
ADD CONSTRAINT equipamentos_status_check
CHECK (status IN ('DISPONIVEL', 'OCUPADO', 'MANUTENCAO', 'disponivel', 'ocupado', 'manutencao'));

ALTER TABLE profiles
ADD CONSTRAINT profiles_tipo_usuario_check
CHECK (tipo_usuario IN ('locador', 'locatario'));
```

### **Passo 3: Adicionar Indexes para Performance**

```sql
CREATE INDEX IF NOT EXISTS idx_chats_proposta_id ON chats(proposta_id);
CREATE INDEX IF NOT EXISTS idx_propostas_equipamento_id ON propostas(equipamento_id);
CREATE INDEX IF NOT EXISTS idx_propostas_usuario_id ON propostas(usuario_id);
CREATE INDEX IF NOT EXISTS idx_mensagens_chat_id ON mensagens(chat_id);
CREATE INDEX IF NOT EXISTS idx_mensagens_sender_id ON mensagens(sender_id);
CREATE INDEX IF NOT EXISTS idx_equipamentos_locador_id ON equipamentos(locador_id);
```

### **Passo 4: Verificar RPCs**

Confirme que existem as funções RPC:

```sql
-- Deve retornar 2 linhas
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN ('marcar_como_entregue', 'confirmar_retorno');
```

Se não existirem, crie-as:

```sql
-- RPC: Marcar como entregue
CREATE OR REPLACE FUNCTION marcar_como_entregue(
  p_equipamento_id uuid,
  p_proposta_id uuid
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Atualiza status do equipamento para OCUPADO
  UPDATE equipamentos
  SET status = 'OCUPADO'
  WHERE id = p_equipamento_id;

  RETURN json_build_object('success', true);
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- RPC: Confirmar retorno
CREATE OR REPLACE FUNCTION confirmar_retorno(
  p_equipamento_id uuid,
  p_proposta_id uuid
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Atualiza status do equipamento para DISPONIVEL
  UPDATE equipamentos
  SET status = 'DISPONIVEL'
  WHERE id = p_equipamento_id;

  RETURN json_build_object('success', true);
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;
```

---

## ✅ VERIFICAÇÃO FINAL

Execute para confirmar que está tudo OK:

```sql
-- Verificar estrutura de todas as tabelas
SELECT
  table_name,
  column_name,
  data_type,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('profiles', 'equipamentos', 'propostas', 'chats', 'mensagens')
ORDER BY table_name, ordinal_position;

-- Verificar funções RPC
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN ('marcar_como_entregue', 'confirmar_retorno');
```

---

## 🎯 DEPOIS DISSO

Após executar esses scripts no Supabase:

1. **Reinicie o servidor de desenvolvimento**:
   ```bash
   npm run dev
   ```

2. **Teste os fluxos principais**:
   - ✅ Cadastro e auto-login
   - ✅ Envio de endereço
   - ✅ Marcar como entregue
   - ✅ Confirmar retorno
   - ✅ Painel admin `/admLoca`

---

## 📝 NOTAS IMPORTANTES

1. **`razao_social` em profiles**: O código busca esse campo mas ele não está na sua estrutura. Se não existir, o sistema vai usar `nome_empresa` ou `full_name` como fallback (já implementado).

2. **Campos que vêm de JOINs**: O código usa campos como `equipamento.locador_nome_empresa`, mas esses vêm de JOIN com a tabela `profiles`, então não precisam existir na tabela `equipamentos`.

3. **Arrays**: O campo `fotos` já é ARRAY, perfeito! O código usa `fotos[0]` corretamente.

---

**🚀 Após executar esses scripts, seu banco estará 100% sincronizado com o código!**
