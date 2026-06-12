# Migrations - Row Level Security (RLS)

## Visao geral

Estas migracoes habilitam RLS em todas as tabelas do Trakto Rent Marketplace, protegendo dados contra acesso nao autorizado via API do Supabase.

**Antes destas migracoes**: qualquer usuario autenticado podia ler/modificar dados de qualquer outro usuario direto via API.

**Depois**: cada operacao e validada contra policies que garantem que o usuario so acessa o que lhe pertence.

---

## 001_enable_rls.sql

### Funcao auxiliar

| Funcao | Descricao |
|--------|-----------|
| `is_admin()` | Retorna `true` se o usuario logado tem `role = 'admin'` na tabela profiles. Usa SECURITY DEFINER para evitar recursao com RLS. |

### Tabela: profiles

| Operacao | Quem pode | Racional |
|----------|-----------|----------|
| SELECT | Todos | Vitrine publica: nomes de locadores, avatares, ratings aparecem no marketplace |
| INSERT | Proprio usuario (`auth.uid() = id`) | Perfil criado no signup |
| UPDATE | Proprio usuario OU admin | Usuario edita seus dados. Admin altera verificado, destacado, tem_loja |
| DELETE | Ninguem (via client) | Exclusao somente via Edge Function `admin-delete-user` com service_role |

**Protecao de role**: A policy de UPDATE impede que um usuario altere seu proprio `role`. Somente admins podem modificar esse campo. Isso previne auto-elevacao de privilegios.

### Tabela: equipamentos

| Operacao | Quem pode | Racional |
|----------|-----------|----------|
| SELECT | Todos | Vitrine publica do marketplace |
| INSERT | Locador (`auth.uid() = locador_id`) | Locador cadastra seus equipamentos |
| UPDATE | Locador dono OU admin | Locador edita os seus. Admin altera destaque/selo |
| DELETE | Locador dono | Locador remove os seus |

### Tabela: chats

| Operacao | Quem pode | Racional |
|----------|-----------|----------|
| SELECT | Participantes (locador_id ou locatario_id) | Conversas sao privadas entre as partes |
| INSERT | Locatario (`auth.uid() = locatario_id`) | Locatario inicia o chat ao solicitar equipamento |
| UPDATE | Participantes | Vincular proposta, arquivar chat |
| DELETE | Ninguem (via client) | Somente via service_role/RPC |

### Tabela: mensagens

| Operacao | Quem pode | Racional |
|----------|-----------|----------|
| SELECT | Participantes do chat pai | Mensagens sao privadas entre as partes do chat |
| INSERT | Participantes do chat pai | Qualquer participante envia mensagem. SYSTEM_SENDER_ID permitido para mensagens automaticas |
| UPDATE | Participantes do chat pai | Marcar mensagens como lidas |
| DELETE | Ninguem (via client) | Somente via service_role |

### Tabela: propostas

| Operacao | Quem pode | Racional |
|----------|-----------|----------|
| SELECT | Locatario (usuario_id) OU locador do equipamento OU admin | Ambas as partes veem a proposta |
| INSERT | Locador do equipamento | Locador envia proposta para o locatario |
| UPDATE | Locatario OU locador OU admin | Locatario aceita/recusa. Locador edita valores, registra inspection |
| DELETE | Locatario OU locador | Cancelamento de proposta pendente |

### Tabela: reviews

| Operacao | Quem pode | Racional |
|----------|-----------|----------|
| SELECT | Todos | Reputacao publica, transparencia |
| INSERT | Reviewer (`auth.uid() = reviewer_id`) | Quem participou da locacao avalia |
| UPDATE | Ninguem | Avaliacoes sao imutaveis |
| DELETE | Ninguem | Avaliacoes sao imutaveis |

### Tabela: consumiveis

| Operacao | Quem pode | Racional |
|----------|-----------|----------|
| SELECT | Todos | Parte da vitrine do equipamento |
| INSERT | Dono do equipamento | Locador adiciona consumiveis ao equipamento |
| UPDATE | Dono do equipamento | Soft-delete (ativo=false) |
| DELETE | Ninguem | Usa soft-delete |

### Tabela: proposta_consumiveis

| Operacao | Quem pode | Racional |
|----------|-----------|----------|
| SELECT | Partes envolvidas na proposta | Segue visibilidade da proposta pai |
| INSERT | Locador do equipamento | Adicionados junto com a proposta |
| DELETE | Locador do equipamento | Cleanup antes de re-inserir |

### Tabela: partner_verticals

| Operacao | Quem pode | Racional |
|----------|-----------|----------|
| SELECT | Todos | Dados de referencia |
| INSERT | Proprio usuario (`auth.uid() = user_id`) | Onboarding de parceiro |

### Views de analytics

`analytics_ranking_clientes`, `analytics_inventario_quente`, `analytics_receita_mensal`, `dashboard_adm`

Se forem **views**: herdam RLS das tabelas base automaticamente.
Se forem **tabelas materializadas**: RLS habilitado com acesso somente admin.

---

## 002_storage_policies.sql

### Bucket: equipamentos

| Operacao | Quem pode | Racional |
|----------|-----------|----------|
| SELECT | Todos | Fotos de equipamentos sao publicas (marketplace) |
| INSERT | Usuario autenticado no proprio diretorio | Path deve comecar com `{user_id}/` ou `chat-files/{chat_id}/{user_id}/` |
| UPDATE | Usuario autenticado nos proprios arquivos | Mesma regra de path |
| DELETE | Usuario autenticado nos proprios arquivos | Mesma regra de path |

**Paths suportados**:
- `{locador_id}/{timestamp}.ext` - fotos de equipamento
- `{locador_id}/inspection/{proposta_id}/{position}.ext` - fotos de vistoria
- `chat-files/{chat_id}/{sender_id}/{timestamp}.ext` - arquivos de chat

### Bucket: profile_pictures

| Operacao | Quem pode | Racional |
|----------|-----------|----------|
| SELECT | Todos | Avatares e banners sao publicos |
| INSERT | Usuario autenticado no proprio diretorio | Path deve comecar com `{user_id}/` |
| UPDATE | Usuario autenticado nos proprios arquivos | Mesma regra |
| DELETE | Usuario autenticado nos proprios arquivos | Mesma regra |

---

## Notas sobre RPCs

As funcoes RPC com `SECURITY DEFINER` (como `executar_aceite_proposta`, `confirmar_retorno`, `marcar_como_entregue`, `submeter_avaliacao`) executam com privilegios do owner da funcao, bypassando RLS. Isso e intencional para operacoes que envolvem multiplas tabelas em transacao.

## Notas sobre service_role

As Edge Functions (`admin-delete-user`, `admin-reset-password`) usam `SUPABASE_SERVICE_ROLE_KEY`, que bypassa RLS. Isso e correto para operacoes administrativas.

## Como aplicar

```bash
# Via Supabase CLI
supabase db push

# Ou manualmente no SQL Editor do Supabase Dashboard
# Cole o conteudo de cada arquivo na ordem:
# 1. 001_enable_rls.sql
# 2. 002_storage_policies.sql
```

## Como testar

1. Fazer login como usuario normal
2. Tentar acessar dados de outro usuario via API REST do Supabase
3. Verificar que retorna vazio ou erro 403
4. Testar operacoes CRUD normais continuam funcionando
5. Verificar que admin ainda consegue gerenciar usuarios/equipamentos
