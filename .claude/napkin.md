# Trakto Rent - Napkin (Runbook Vivo)

> Ultima atualizacao: 2026-03-27 | Proxima acao: 2026-03-30 (segunda)

---

## Estado Atual

**Branch ativa**: `feature/Atualizações` (tudo consolidado, NAO commitado)
**Base**: main (0978338) + merge de 5 branches de trabalho

### O que esta pronto pra commit (segunda dia 30)

Todas as mudancas estao unstaged/staged na branch `feature/Atualizações`.
Nenhum commit foi feito. Build e type check passam.

**35 arquivos modificados + 9 arquivos novos:**

#### Seguranca (Fase 0)
- [x] Edge Function admin-delete-user: JWT auth + role admin + CORS restrito + audit log + abort se profile falhar
- [x] vercel.json: HSTS, X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy
- [x] vite.config.ts: allowedHosts restrito a localhost/127.0.0.1
- [x] AuthPage.tsx: senha minimo 8 chars + 1 maiuscula + 1 numero + indicador visual de forca
- [x] ACESSOS.md: removido do git + adicionado ao .gitignore
- [x] package.json: pacote suspeito 'claude' removido

#### RLS Supabase (Fase 0)
- [x] supabase/migrations/001_enable_rls.sql - RLS em 9 tabelas (profiles, equipamentos, chats, mensagens, propostas, reviews, consumiveis, proposta_consumiveis, partner_verticals)
- [x] supabase/migrations/002_storage_policies.sql - Storage policies para buckets equipamentos e profile_pictures
- [x] supabase/migrations/003_chat_archive.sql - Campo archived em chats (soft-delete)
- [x] supabase/migrations/README.md - Documentacao das policies

**IMPORTANTE**: SQL precisa ser executado no Supabase Dashboard ANTES de testar a app. Ordem: 003 primeiro (campo archived), depois 001, depois 002.

#### Backend Fixes (Fase 1) - 12 bugs corrigidos
- [x] AppContext.tsx: coluna .eq('disponivel', true) → .in('status', [...]) (EquipamentoContext.tsx linha 82)
- [x] AppContext.tsx: soft-delete chat (archive em vez de DELETE mensagens+chat) — 2 pontos
- [x] StoreSettings.tsx: upload nova imagem ANTES de deletar antiga (previne perda)
- [x] StoreSettings.tsx: campos cor_marca e loja_slug incluidos no updateData
- [x] AuthPage.tsx: password reset real via supabase.auth.resetPasswordForEmail()
- [x] PropostaModal.tsx + SolicitarModal.tsx: calculo de dias +1 (aluguel inclusivo)
- [x] FileAttachment.tsx: revokeObjectURL com setTimeout(1000)
- [x] contractDataMapper.ts: truthy check !== null/undefined/'' (specs com valor 0)
- [x] gerarContrato.ts: formatDate com try-catch + isNaN check
- [x] gerarContrato.ts: null check em dados.equipamento.nome
- [x] FinancialWallet.tsx: timezone normalization (verifica .includes('T'))
- [x] ReviewCard.tsx: mountedRef + cleanup pra evitar race condition

#### Split AppContext (Fase 1)
- [x] AppContext.tsx: 2700 → 753 linhas (orquestrador leve)
- [x] EquipamentoContext.tsx: 727 linhas (CRUD equipamentos, filtros, uploads)
- [x] NotificacaoContext.tsx: 126 linhas (contadores, realtime)
- [x] appConstants.ts: 76 linhas (status strings, config)
- [x] appHelpers.ts: 28 linhas (helpers compartilhados, usa getStorageUrl)
- [x] types/index.ts: 250 linhas (interfaces tipadas: Equipamento, Proposta, etc)

#### Frontend Polish (Fase 2)
- [x] App.tsx: React.lazy em 13 pages + Suspense com SplashScreen fallback
- [x] storage.ts: getStorageUrl() centralizado (substituido em 13+ locais)
- [x] useFavorites.ts: hook consolidado (substituido em ProductCard + PremiumProductCard)
- [x] date.ts: formatDate() com try-catch + toDateOnly()
- [x] ~60 console.log/error wrapeados em import.meta.env.DEV
- [x] Imagens com loading="lazy" + width/height (FotosCarrossel)
- [x] a11y: aria-labels em favorito, carrossel, rating stars, aria-modal nos modais
- [x] Codigo morto removido (locadorId em ChatMessages, menu items Perfil)
- [x] hooks/index.ts: useVertical + useFavorites exportados
- [x] package.json: nome trocado de 'locachef' para 'trakto-rent'
- [x] PremiumProductCard: auth check no favorito (igual ao ProductCard)
- [x] jsPDF em chunk separado via dynamic import (gerarContrato isolado no build)

---

## Checklist pra Segunda (30/03)

### Antes de commitar
1. [ ] `git status` - confirmar que tudo esta na branch feature/Atualizações
2. [ ] `npx tsc --noEmit` - type check
3. [ ] `npm run build` - build de producao
4. [ ] Revisar o diff final: `git diff --stat`

### Commit
5. [ ] Commitar em blocos logicos ou um commit unico (decidir com Mauri)
6. [ ] Sugestao de commits separados:
   - `fix: security hardening (edge function auth, headers, password validation)`
   - `feat: add RLS policies for all Supabase tables`
   - `fix: correct 12 backend bugs (column query, chat archive, upload order, etc)`
   - `refactor: split AppContext into focused contexts`
   - `perf: code splitting, lazy loading, utility extraction, a11y`

### Testar no Supabase
7. [ ] Executar 003_chat_archive.sql no Supabase SQL Editor
8. [ ] Executar 001_enable_rls.sql no Supabase SQL Editor
9. [ ] Executar 002_storage_policies.sql no Supabase SQL Editor
10. [ ] Testar login/cadastro (senha forte funciona?)
11. [ ] Testar vitrine (equipamentos carregam com RLS?)
12. [ ] Testar chat (enviar mensagem, proposta)
13. [ ] Testar favoritos (toggle funciona? auth check no premium?)
14. [ ] Testar dashboard locador (CRUD equipamentos)
15. [ ] Testar admin (deletar usuario funciona com auth?)
16. [ ] Testar devolucao (chat arquivado em vez de deletado?)

### Apos testar
17. [ ] Push para origin
18. [ ] PR para main (ou merge direto se testes OK)
19. [ ] Verificar deploy no Vercel
20. [ ] Configurar env var ALLOWED_ORIGIN no Supabase (dominio real da app)

---

## Pipeline Protection (NAO mexer sem ler docs)

| Arquivo | Motivo |
|---------|--------|
| src/contexts/AuthContext.tsx | Auth flow principal, PROTEGIDO |
| supabase/migrations/*.sql | Ja revisado, NAO alterar sem re-review |
| supabase/functions/admin-delete-user/index.ts | Tem auth agora, NAO remover verificacoes |

---

## Architecture Decisions

| Decisao | Motivo | Data |
|---------|--------|------|
| Soft-delete chat (archived) em vez de hard delete | Preservar evidencias contratuais | 2026-03-27 |
| getStorageUrl() centralizado em lib/storage.ts | Estava duplicado em 13 locais | 2026-03-27 |
| AppContext dividido em 3 contexts + helpers | 2700 linhas causava re-renders massivos | 2026-03-27 |
| is_admin() como funcao SECURITY DEFINER no Postgres | Reutilizavel em todas as policies RLS | 2026-03-27 |
| Senha 8 chars + maiuscula + numero (nao 12) | Balanco entre seguranca e UX de marketplace | 2026-03-27 |
| CORS por env var ALLOWED_ORIGIN (nao hardcoded) | Funciona em staging e producao | 2026-03-27 |

---

## Worktrees (limpar depois do merge)

Existem worktrees em:
- `C:\Users\mauri\Desktop\Projetos_Oduo\Marketplace-rls` → feature/rls-policies
- `C:\Users\mauri\Desktop\Projetos_Oduo\Marketplace-split` → feature/split-appcontext
- `C:\Users\mauri\Desktop\Projetos_Oduo\Marketplace-fixes` → feature/backend-fixes

**Limpar apos merge**: `git worktree remove Marketplace-rls` etc.

Stashes restantes:
- stash@{0}: frontend-polish-wip (pode dropar apos commit)
- stash@{1}: WIP on security-phase0 (pode dropar apos commit)

---

## Backlog (proximas fases)

### Fase 3 - LGPD + OWASP restante (prioridade alta)
- [ ] Politica de Privacidade (pagina + rota /privacidade)
- [ ] Termos de Uso (pagina + rota /termos)
- [ ] Consentimento no cadastro (checkbox + timestamp aceite_termos_em)
- [ ] Export de dados do usuario (Edge Function)
- [ ] Delete de dados LGPD (anonimizacao + soft-delete)
- [ ] DOMPurify no chat (sanitizar mensagens)
- [ ] Rate limiting (login, cadastro, uploads)
- [ ] Audit logging (tabela + triggers)

### Fase 4 - Testes + CI
- [ ] Setup Vitest + React Testing Library
- [ ] Testes de utils (date, chat, contractDataMapper)
- [ ] Testes de hooks (useFavorites)
- [ ] Testes de contexts (AuthContext)
- [ ] GitHub Actions CI (lint + type-check + test + build)

### Fase 5 - Features Unicornio
- [ ] PWA + Push Notifications (Service Worker)
- [ ] Gateway de pagamento (Stripe Connect ou Mercado Pago)
- [ ] Busca por geolocalizacao (Mapbox/Google Maps)
- [ ] Analytics avancado para locadores
- [ ] i18n (react-intl)

---

## Gotchas de Infra

| Gotcha | Do Instead |
|--------|------------|
| CORS na Edge Function era `*` | Agora usa env var ALLOWED_ORIGIN. Configurar no Supabase Dashboard. |
| RLS nao existia em nenhuma tabela | Agora existe. Testar TUDO apos aplicar migrations. RPCs com SECURITY DEFINER continuam funcionando. |
| Campo `archived` em chats e NOVO | Rodar 003_chat_archive.sql ANTES das outras migrations. |
| jsPDF no bundle principal (350KB) | Agora em chunk separado via dynamic import. |
| 60+ console.log vazavam em prod | Wrapeados em import.meta.env.DEV. Restantes sao em AppContext (protegido). |
