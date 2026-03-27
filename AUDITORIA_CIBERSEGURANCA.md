# RELATÓRIO DE AUDITORIA DE CIBERSEGURANÇA - MARKETPLACE

**Data:** 2026-03-15
**Escopo:** Código-fonte completo (frontend, backend, infraestrutura)
**Stack:** React + TypeScript + Supabase + Vercel

---

## Resumo Executivo

Auditoria completa realizada em 3 frentes paralelas: **Autenticação/Controle de Acesso**, **Injeção/Vulnerabilidades Client-Side**, e **Configuração/Infraestrutura**.

| Severidade | Quantidade |
|------------|-----------|
| **CRÍTICA** | 7 |
| **ALTA** | 6 |
| **MÉDIA** | 7 |
| **BAIXA** | 3 |
| **Total** | 23 |

---

## VULNERABILIDADES CRÍTICAS (Ação Imediata)

### 1. RLS (Row Level Security) Ausente no Supabase

- **Impacto:** Qualquer usuário autenticado pode ler/modificar dados de QUALQUER outro usuário
- **Arquivos afetados:** Todas as tabelas (`profiles`, `equipamentos`, `propostas`, `chats`, `mensagens`)
- **Detalhe:** As verificações de autorização são feitas apenas no client-side (JavaScript), que pode ser facilmente burlado via DevTools, curl ou Postman
- **Referência:** `src/contexts/AppContext.tsx` — verificações como `locador_id !== locadorId` são "security theater" sem RLS
- **Correção:** Criar políticas RLS para cada tabela:

```sql
-- Exemplo para profiles
CREATE POLICY "Users can view public profiles"
ON profiles FOR SELECT USING (true);

CREATE POLICY "Users can only update their own profile"
ON profiles FOR UPDATE USING (auth.uid() = id);

-- Exemplo para equipamentos
CREATE POLICY "Users can only update their own equipment"
ON equipamentos FOR UPDATE USING (auth.uid() = locador_id);

CREATE POLICY "Users can only delete their own equipment"
ON equipamentos FOR DELETE USING (auth.uid() = locador_id);
```

### 2. Edge Functions Sem Verificação de Autorização

- **Arquivo:** `supabase/functions/admin-delete-user/index.ts`
- **Detalhe:** A função usa `SUPABASE_SERVICE_ROLE_KEY` (acesso total) mas **não verifica se o chamador é admin**. Qualquer usuário autenticado que conheça o nome da função pode deletar outros usuários
- **CORS:** `Access-Control-Allow-Origin: '*'` — permite chamadas de qualquer site
- **Correção:**

```typescript
// Adicionar verificação de admin
const authHeader = req.headers.get('authorization')
const { data: { user }, error: authError } = await supabaseUser.auth.getUser(authHeader)

if (!user) {
  return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
}

const { data: profile } = await supabaseAdmin
  .from('profiles')
  .select('role')
  .eq('id', user.id)
  .single()

if (profile?.role !== 'admin') {
  return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 })
}
```

### 3. Upload de Arquivos Sem Validação Server-Side

- **Arquivo:** `src/contexts/AppContext.tsx:1947-1965` e `:2179-2232`
- **Detalhe:** Validação de tipo MIME é feita apenas no client-side. `uploadImagens()` não tem NENHUMA validação de tipo. Um atacante pode fazer upload de executáveis, scripts maliciosos ou qualquer arquivo
- **Risco:** Distribuição de malware, XSS via SVG/HTML, exaustão de storage
- **Correção:** Implementar validação server-side via magic bytes, não MIME type. Configurar políticas de storage no Supabase para restringir tipos permitidos

### 4. Função `toggleDestaque` Sem Autorização

- **Arquivo:** `src/contexts/AppContext.tsx:2420-2439`
- **Detalhe:** Qualquer usuário logado pode promover/despromover equipamentos (funcionalidade admin) de qualquer locador
- **Correção:** Adicionar verificação de role admin antes de executar a operação

### 5. Credenciais de Teste no Repositório Git

- **Arquivo:** `ACESSOS.md` (commitado no git)
- **Detalhe:** Emails de admin, contas de teste com senha `teste123` expostos no versionamento
- **Correção:** Remover do repositório com `git rm --cached ACESSOS.md`, adicionar ao `.gitignore`

### 6. Escalação de Privilégios

- **Arquivo:** `src/App.tsx:58-84`, `src/contexts/AuthContext.tsx`
- **Detalhe:** O campo `role` está na tabela `profiles`. Sem RLS, um usuário pode alterar seu próprio role para `admin` diretamente no banco
- **Correção:** RLS policy que impede alteração do campo `role` por usuários comuns

### 7. Operações DELETE Sem Verificação de Propriedade

- **Arquivo:** `src/contexts/AppContext.tsx:2162-2163, :2372`
- **Detalhe:** Consumíveis de propostas podem ser deletados por qualquer usuário sem verificar se é o dono
- **Correção:** Adicionar verificação de ownership + RLS policies na tabela `proposta_consumiveis`

---

## VULNERABILIDADES ALTAS

### 8. Vite `allowedHosts: true`

- **Arquivo:** `vite.config.ts:8`
- **Risco:** Host header injection, DNS rebinding
- **Correção:** `allowedHosts: ['localhost', 'seudominio.com']`

### 9. Headers de Segurança Ausentes

- **Arquivo:** `vercel.json`
- **Ausentes:** CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy
- **Correção:**

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "Strict-Transport-Security", "value": "max-age=31536000; includeSubDomains" },
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
        { "key": "Permissions-Policy", "value": "camera=(), microphone=(), geolocation=()" }
      ]
    }
  ]
}
```

### 10. `localStorage` Sem Tratamento de Erros

- **Arquivos:** `ProductDetail.tsx:38`, `Favoritos.tsx:17`, `ProductCard.tsx:26`, `PremiumProductCard.tsx:34`
- **Detalhe:** `JSON.parse()` sem try-catch — dados corrompidos causam crash da aplicação
- **Correção:** Envolver em try-catch com fallback para valor padrão

### 11. Validação de Senha Fraca

- **Arquivo:** `src/pages/AuthPage.tsx:112-113`
- **Detalhe:** Mínimo de apenas 6 caracteres, sem requisitos de complexidade
- **Correção:** Mínimo 12 caracteres, exigir maiúsculas, números e símbolos

### 12. Sem Rate Limiting na Autenticação

- **Detalhe:** Sem limitação de tentativas de login, sem CAPTCHA, brute force possível
- **Correção:** Implementar rate limiting no Supabase ou via Edge Function

### 13. Proteção XSS Insuficiente em Mensagens de Chat

- **Arquivo:** `src/components/chat/ChatMessages.tsx:58`
- **Detalhe:** Conteúdo de mensagens renderizado sem sanitização adicional
- **Correção:** Usar DOMPurify para sanitizar conteúdo de mensagens antes de renderizar

---

## VULNERABILIDADES MÉDIAS

### 14. CSRF — Sem Tokens Explícitos

- **Escopo:** Aplicação inteira
- **Detalhe:** Sem tokens CSRF para operações state-changing
- **Correção:** Garantir cookies SameSite=Strict no Supabase

### 15. Sem Rate Limiting em Uploads

- **Arquivo:** `src/contexts/AppContext.tsx:1940-2232`
- **Detalhe:** Atacante pode fazer upload em loop exaustindo storage
- **Correção:** Implementar rate limiting client e server-side

### 16. Console Logs em Produção (68 instâncias)

- **Arquivos:** Múltiplos (`ChatSplitPage.tsx`, `Adm.tsx`, `AppContext.tsx`, etc.)
- **Detalhe:** `console.log/error` expõem informações internas no browser
- **Correção:** Remover ou condicionar a `NODE_ENV === 'development'`

### 17. Senha Temporária Sem Expiração

- **Arquivo:** `src/contexts/AuthContext.tsx:25-26`
- **Detalhe:** Flag `senha_temporaria` é boolean sem timestamp de expiração
- **Correção:** Adicionar campo `senha_temporaria_expira_em` com timestamp

### 18. Sem Audit Logging

- **Escopo:** Aplicação inteira
- **Detalhe:** Sem logs de auditoria para operações sensíveis (reset de senha, deleção de usuário, alteração de role, promoção de equipamento)
- **Correção:** Criar tabela `audit_log` e registrar operações críticas

### 19. Mensagens de Erro Expõem Detalhes Internos

- **Arquivos:** `Adm.tsx`, `AuthPage.tsx`
- **Detalhe:** Erros do Supabase são exibidos diretamente ao usuário
- **Correção:** Mapear erros para mensagens genéricas user-friendly

### 20. Pacote `claude@0.1.1` Suspeito

- **Arquivo:** `package.json:14`
- **Detalhe:** Pacote não identificado — possível typosquatting
- **Correção:** Investigar origem no npm, remover se não necessário

---

## VULNERABILIDADES BAIXAS

### 21. Env Variables com Prefixo VITE_ no Frontend

- **Arquivo:** `src/lib/supabase.ts`
- **Detalhe:** Chaves expostas no bundle do browser (design intencional do Supabase, mas deve ser acompanhado de RLS)

### 22. Sem CSP Meta Tag no HTML

- **Arquivo:** `index.html`
- **Correção:** Adicionar `<meta http-equiv="Content-Security-Policy" content="...">`

### 23. `.env.example` com Placeholder Malformado

- **Arquivo:** `.env.example`
- **Detalhe:** Usa `''''` ao invés de um placeholder descritivo

---

## PONTOS POSITIVOS

- React escapa HTML por padrão (sem `dangerouslySetInnerHTML`)
- Sem uso de `eval()`, `document.write()` ou `innerHTML`
- Queries parametrizadas via Supabase (sem SQL injection)
- `.env` removido do git corretamente (commit `513341a`)
- TypeScript com type safety
- Route guards implementados (AdminGuard, LocadorGuard)
- RPC calls com parâmetros nomeados

---

## PLANO DE REMEDIAÇÃO PRIORITÁRIO

### IMEDIATO (24h)

- [ ] Habilitar RLS em TODAS as tabelas do Supabase com políticas adequadas
- [ ] Adicionar verificação de admin nas Edge Functions antes de executar operações
- [ ] Revogar e regenerar chaves Supabase e token Vercel
- [ ] Remover `ACESSOS.md` do repositório
- [ ] Corrigir CORS nas Edge Functions (trocar `*` pelo domínio real)

### CURTO PRAZO (1 semana)

- [ ] Implementar validação server-side de uploads (magic bytes, não MIME)
- [ ] Adicionar headers de segurança no `vercel.json`
- [ ] Fortalecer validação de senha (mínimo 12 chars, complexidade)
- [ ] Corrigir `allowedHosts` no Vite
- [ ] Adicionar try-catch nos `JSON.parse()` de localStorage

### MÉDIO PRAZO (2 semanas)

- [ ] Implementar rate limiting (login e uploads)
- [ ] Adicionar audit logging
- [ ] Remover `console.log` de produção
- [ ] Implementar CSP no `index.html`
- [ ] Investigar pacote `claude@0.1.1` no npm

---

**Postura de segurança atual: RISCO ALTO**

A vulnerabilidade mais crítica é a **ausência de RLS no Supabase** — sem ela, toda a segurança da aplicação depende apenas de código JavaScript no browser, que qualquer atacante pode burlar trivialmente.
