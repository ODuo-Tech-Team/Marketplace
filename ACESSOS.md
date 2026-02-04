# Credenciais de Acesso - LP MarketPlace

## Administradores

Acesso via: `/adm/login`

| Email | Senha |
|-------|-------|
| `mauricio.reis@oduo.com.br` | *(definida no Supabase)* |
| `maumaureis0404@gmail.com` | *(definida no Supabase)* |

---

## Locadores (Teste)

Acesso via: `/auth`

**Senha padrão:** `teste123`

| Email | Nome | Empresa | Vertical |
|-------|------|---------|----------|
| `locador1@gmail.com` | Carlos Silva | Silva Locações | Construção |
| `locador2@gmail.com` | Ana Rodrigues | TechRent Brasil | Tech |
| `locador3@gmail.com` | Roberto Mendes | MedEquip Locações | Médico |
| `locador4@gmail.com` | Fernanda Costa | EventosPro | Eventos |

> **Nota:** Esses usuários são criados via seed SQL (`sql/seed_locadores.sql`).
> Execute no Supabase SQL Editor se não existirem.

---

## Locatários (Teste)

Acesso via: `/auth`

**Senha padrão:** `teste123`

| Email | Nome |
|-------|------|
| `cliente1@gmail.com` | João Cliente |
| `cliente2@gmail.com` | Maria Locatária |

> **Nota:** Esses usuários são criados via seed SQL (`sql/seed_locatarios.sql`).
> Execute no Supabase SQL Editor se não existirem.

---

## Como Criar Novos Usuários

### Via Interface
1. Acesse `/auth`
2. Clique em "Criar conta"
3. Preencha os dados (será criado como `locatario` por padrão)

### Via Painel Admin
1. Acesse `/adm/login` com credenciais de admin
2. Na aba "Usuários", crie novos usuários

### Via SQL (Supabase)
Execute os scripts em `sql/seed_*.sql` no SQL Editor do Supabase.

---

## Arquivos de Seed

| Arquivo | Descrição |
|---------|-----------|
| `sql/seed_locadores.sql` | 4 locadores + 8 equipamentos |
| `sql/seed_locatarios.sql` | 2 locatários para testes |

---

**IMPORTANTE:** Este arquivo contém credenciais sensíveis. Não commitar em repositórios públicos.
