# Relatório de Inovação - TRAKTO RENT Marketplace

**Data:** 2026-03-15
**Agente:** Inovador
**Projeto:** TRAKTO RENT (Marketplace de locação universal)

---

## Visão Geral

Marketplace de locação universal (equipamentos pesados, tech, saúde, eventos etc.)
**Stack:** React 19 + TypeScript 5.9 + Vite 7 + Supabase + Tailwind CSS 4
**Estrutura:** 68 arquivos fonte, 14 páginas, 30+ componentes, 4 contexts, 3 hooks customizados
**Deploy:** Vercel (SPA)

---

## 1. PROBLEMAS CRITICOS

### 1.1 AppContext monolítico (~2700 linhas)
- **Arquivo:** `src/contexts/AppContext.tsx`
- Concentra 60+ funções e 15+ estados em um único provider
- Qualquer mudança de estado causa re-render em TODOS os consumidores
- **Solução:** Dividir em contexts focados:
  - `EquipamentoContext` — CRUD de equipamentos, busca, filtros
  - `ChatContext` — mensagens, real-time, leitura
  - `PropostaContext` — propostas, status, negociação
  - `NotificationsContext` — contadores de não-lidos, alertas

### 1.2 Erros silenciosos
- `src/components/ProductCard.tsx:28` — `catch { /* ignore */ }`
- `src/components/ProductCard.tsx:50` — mesmo padrão
- `src/contexts/ThemeContext.tsx:20,40` — erros engolidos
- `src/pages/AuthPage.tsx:226` — falha ao salvar nichos só no console
- **Solução:** Substituir catches vazios por toast de erro via Sonner (já instalado)

### 1.3 Console.log/error em produção (60+ ocorrências)
- `src/pages/Adm.tsx` — 34 console.error
- `src/contexts/AppContext.tsx` — 7 console.error
- `src/pages/ChatSplitPage.tsx:984` — console.log de debug
- **Solução:** Instalar Sentry ou LogRocket, substituir todos os console.* por logger estruturado

---

## 2. PERFORMANCE

| Problema | Arquivo(s) | Solução |
|----------|-----------|---------|
| Imagens sem lazy loading | `FotosCarrossel.tsx:72,80`, `FileAttachment.tsx:90` | Adicionar `loading="lazy"` e `srcSet` responsivo |
| Filtros repetidos sem memoização | `Storefront.tsx` (3x `.filter()` idênticos) | Usar `useMemo` para filtros derivados |
| Mensagens do chat sem `React.memo` | `ChatSplitPage.tsx` | Memoizar itens da lista de mensagens |
| `Adm.tsx` monolítico (~106KB) | `src/pages/Adm.tsx` | Extrair sub-componentes por tab |
| Sem code splitting | `App.tsx` importa tudo eagerly | `React.lazy()` + `Suspense` por rota |
| Sem cache de API | Todo o app | Considerar React Query/TanStack Query |
| jsPDF carregado eagerly | Bundle principal | Dynamic import para geração de contrato |

---

## 3. TIPAGEM TYPESCRIPT (15+ usos de `any`)

| Arquivo | Linha(s) | Contexto |
|---------|----------|----------|
| `AppContext.tsx` | 1118, 1358, 2074, 2405 | Objetos de inserção sem tipo |
| `AppContext.tsx` | 358 | `categoria as any` |
| `Adm.tsx` | 634, 704, 779-780, 785-786, 2103-2104 | Mapeamento e sort com `any` |
| `ContractGeneratorModal.tsx` | 8 | `initialData?: any` |
| `DynamicSpecFields.tsx` | 22 | `value: any` no handler |
| `Storefront.tsx` | 158, 685 | Array mapping e theme como `any` |
| `MeusEquipamentos.tsx` | 68, 82, 548-549 | State e type casting |
| `gerarContrato.ts` | 250, 489 | `(doc as any).internal.pages` |

**Solução:** Criar interfaces tipadas em `src/types/index.ts`:
- `Equipamento`, `Proposta`, `Chat`, `Mensagem`, `Profile`
- Wrappers tipados para jsPDF

---

## 4. DUPLICACAO DE CODIGO

### 4.1 URL de Storage Supabase (13 locais)
**Padrão repetido:**
```typescript
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
return `${supabaseUrl}/storage/v1/object/public/equipamentos/${path}`
```

**Arquivos afetados:**
- `FotosCarrossel.tsx:49`
- `FileAttachment.tsx:35`
- `OwnerDashboard.tsx:1202, 1924`
- `ChatSplitPage.tsx:25`
- `StoreSettings.tsx:379`
- `MeusEquipamentos.tsx:690`
- `SolicitarModal.tsx:11`
- `MeusPedidos.tsx:700`

**Solução:** Criar `src/lib/storage.ts`:
```typescript
export const getStorageUrl = (path: string): string => {
  const url = import.meta.env.VITE_SUPABASE_URL
  return `${url}/storage/v1/object/public/equipamentos/${path}`
}
```

### 4.2 Lógica de favoritos (5 locais)
- `ProductCard.tsx:26-49`
- `PremiumProductCard.tsx:34-50`
- `ProductDetail.tsx:38-64`
- `MeusPedidos.tsx:129, 725`
- `Favoritos.tsx:17, 27`

**Solução:** Criar hook `src/hooks/useFavorites.ts`

### 4.3 Formatação de data (8+ locais)
Padrão `.split('T')[0]` repetido em:
- `SolicitarModal.tsx:74`
- `OwnerDashboard.tsx:680, 687-688, 696-697`
- `Adm.tsx:814, 821, 827`

**Solução:** Criar `src/utils/date.ts` com `toDateOnly()`

### 4.4 Inicialização de formulários
- `MeusEquipamentos.tsx:75-82`
- `OwnerDashboard.tsx:243-249`
- `ChatSplitPage.tsx:69-79`

**Solução:** Helper `initFormFromEquipamento()`

---

## 5. SEGURANCA

| Issue | Severidade | Detalhe | Solução |
|-------|-----------|---------|---------|
| Upload sem validação client-side | Media | Extensão de arquivo não validada contra MIME type | Validar extensão + MIME |
| Admin login sem rate limiting | Media | `AdminLogin.tsx` | Implementar throttle ou Supabase rate limit |
| Senha mínima 6 chars | Media | `AuthPage.tsx:112` | Aumentar para 12+ com complexidade |
| Base64 silenciosamente descartado | Baixa | `FotosCarrossel.tsx:40-43` | Tratar ou mostrar erro |
| localStorage para favoritos | Baixa | Vulnerável a XSS | Mover para Supabase (persistência + segurança) |
| Verificar RLS no Supabase | Alta | Não auditado | Revisar policies de todas as tabelas |

---

## 6. ACESSIBILIDADE (a11y)

### Presente (bom):
- 159 ocorrências de `role=`, `aria-`, `label`, `htmlFor`
- Imagens com `alt` text no carrossel
- `CalendarioDisponibilidade.tsx` com aria labels
- `PropostaModal.tsx` com aria labels

### Faltando:
- Botão de favorito sem `aria-label` (`ProductCard.tsx:75`)
- Botões do carrossel sem `aria-label` (`FotosCarrossel.tsx:86, 92`)
- Chat input sem `aria-label` explícito
- Modais sem `aria-modal="true"`
- Sem indicadores de foco para navegação por teclado
- Sem skip-to-content links
- Opacidade no texto (`text-white/70`) pode falhar WCAG AA

---

## 7. CHAT - PROBLEMAS REAL-TIME

### 7.1 Race condition na reconexão
- `ChatSplitPage.tsx:1034-1039` — sem debounce na reconexão por visibilidade
- Pode causar subscriptions duplicadas se tab alterna rapidamente

### 7.2 Sem atomicidade
- Mensagem + proposta enviadas como operações separadas
- Pode falhar parcialmente sem rollback

### 7.3 Sem fila offline
- Mensagens perdidas se conexão cair durante envio
- Sem retry automático para mensagens falhadas

### 7.4 Subscriptions sem cleanup visível
- `useChat.ts:102-164` — múltiplas subscriptions sem unsubscribe claro no cleanup

---

## 8. ZERO TESTES

- Nenhum arquivo `.test.ts`, `.spec.ts`, `.test.tsx`, `.spec.tsx`
- Nenhum framework de teste nas dependências
- **Solução:** Adicionar Vitest + Testing Library
- **Prioridade de testes:**
  1. `AppContext` — funções de CRUD e estado
  2. Fluxo de proposta (enviar, aceitar, recusar)
  3. Geração de contrato PDF
  4. Autenticação e guards de rota
  5. Chat — envio e recebimento de mensagens

---

## 9. INOVACOES DE ALTO IMPACTO

### 9.1 PWA + Notificações Push
- `NotificationListener.tsx` já existe mas depende de tab aberta
- Service Worker + Push API permitiria notificações nativas no celular
- **Impacto:** Engajamento e retenção de usuários

### 9.2 Busca com geolocalização
- Já tem `cidade/uf` nos equipamentos
- Falta busca por proximidade com mapa interativo (Mapbox/Google Maps)
- **Impacto:** UX significativamente melhor para locatários

### 9.3 Sistema de reviews completo
- `ReviewCard.tsx` existe mas é básico
- Adicionar: fotos nas reviews, resposta do locador, filtros por nota
- **Impacto:** Confiança e conversão

### 9.4 Analytics avançado para locadores
- `FinancialWallet.tsx` e `Sparkline.tsx` existem
- Expandir com: taxa de ocupação, conversão de visualizações, ranking de equipamentos, previsão de receita
- **Impacto:** Retenção de locadores

### 9.5 Integração de pagamento
- Não há gateway integrado
- Stripe ou Mercado Pago completaria o fluxo de ponta a ponta
- **Impacto:** Monetização e segurança nas transações

### 9.6 Internacionalização (i18n)
- UI 100% em português hardcoded
- Preparar para i18n com react-intl ou next-intl
- **Impacto:** Expansão para outros mercados

---

## 10. PRIORIZACAO RECOMENDADA

| # | Ação | Esforço | Impacto | Categoria |
|---|------|---------|---------|-----------|
| 1 | Dividir AppContext em 3-4 contexts | Medio | Alto | Performance |
| 2 | Code splitting por rota (React.lazy) | Baixo | Alto | Performance |
| 3 | Lazy loading de imagens | Baixo | Medio | Performance |
| 4 | Corrigir error handling silencioso | Baixo | Medio | Estabilidade |
| 5 | Extrair utilitário getStorageUrl | Baixo | Medio | Manutenção |
| 6 | Criar hook useFavorites | Baixo | Medio | Manutenção |
| 7 | Adicionar Vitest + testes core | Medio | Alto | Qualidade |
| 8 | Tipar `any` com interfaces | Medio | Medio | Qualidade |
| 9 | Instalar Sentry/error tracking | Baixo | Alto | Observabilidade |
| 10 | Remover console.log de produção | Baixo | Baixo | Limpeza |
| 11 | Acessibilidade (aria-labels, foco) | Medio | Medio | Inclusão |
| 12 | PWA + Push notifications | Alto | Alto | Inovação |
| 13 | Gateway de pagamento | Alto | Alto | Monetização |
| 14 | Busca por geolocalização | Alto | Alto | UX |

---

## 11. OBSERVACOES GERAIS

### Pontos fortes do projeto:
- Arquitetura bem organizada (components, contexts, hooks, pages, utils)
- Uso correto de React hooks modernos
- Supabase bem integrado com real-time
- Multi-vertical flexível com JSONB specs
- UI responsiva mobile-first
- Sem vulnerabilidades graves de XSS/SQL injection

### Pontos de atenção:
- Package name ainda é `"locachef"` no `package.json` — deveria ser `"trakto-rent"`
- Sem CI/CD além de deploy Vercel (falta lint/test no pipeline)
- Sem Storybook ou catálogo de componentes
- `OwnerDashboard.tsx` tem 163KB — candidato forte para refatoração

---

*Relatório gerado pelo Agente Inovador como parte do fluxo multi-agentes do projeto TRAKTO RENT.*
