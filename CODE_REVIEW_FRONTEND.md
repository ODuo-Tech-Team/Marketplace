# CODE REVIEW - FRONTEND MARKETPLACE

**Data:** 2026-03-15
**Arquivos revisados:** 68 (.tsx, .ts, .css)
**Areas:** Core/Contexts/Hooks, Pages (14), UI Components (22), Chat Components + Utils (18)

---

## CRITICAL (6 issues)

### 1. Password reset falso
- **Arquivo:** `src/pages/AuthPage.tsx` (linhas 313-348)
- **Problema:** Marca `solicitou_reset: true` no DB mas nunca envia email real de reset.
- **Fix:** Usar `supabase.auth.resetPasswordForEmail()`:
```typescript
const { error } = await supabase.auth.resetPasswordForEmail(email, {
  redirectTo: `${window.location.origin}/reset-password`,
})
```

### 2. SQL Injection via RPC
- **Arquivo:** `src/pages/Storefront.tsx` (linhas 91-98)
- **Problema:** `get_locador_by_slug` recebe input do usuario sem sanitizacao client-side.
- **Fix:** Adicionar validacao:
```typescript
const sanitizedSlug = locadorId.toLowerCase().replace(/[^a-z0-9-]/g, '')
const { data } = await supabase.rpc('get_locador_by_slug', { p_slug: sanitizedSlug })
```

### 3. Risco de XSS no chat
- **Arquivo:** `src/components/chat/ChatMessages.tsx` (linha 58)
- **Problema:** `msg.texto` renderizado com `whitespace-pre-wrap`. React escapa JSX por padrao, mas se o backend permitir HTML stored, pode ser explorado.
- **Fix:** Verificar sanitizacao no backend OU usar DOMPurify:
```typescript
import DOMPurify from 'dompurify'
<p className="text-sm whitespace-pre-wrap break-words">
  {DOMPurify.sanitize(msg.texto, { ALLOWED_TAGS: [] })}
</p>
```

### 4. Memory leak no InspectionWizard
- **Arquivo:** `src/components/chat/InspectionWizard.tsx` (linhas 82-86)
- **Problema:** `URL.revokeObjectURL()` chamado em string base64 (de `FileReader.readAsDataURL`), que nao e blob URL. Nao faz nada e gera confusao.
- **Fix:** Remover o `revokeObjectURL` para previews base64:
```typescript
const oldPhoto = prev.get(position)
// base64 data URLs sao garbage collected automaticamente
newMap.set(position, { file, preview })
```

### 5. File upload sem validacao JS
- **Arquivos:** `src/components/chat/HorimetroInput.tsx` (linhas 17-26), `src/components/chat/InspectionWizard.tsx` (linhas 69-95)
- **Problema:** HTML `accept="image/*"` e facilmente bypassado via devtools. Falta validacao JS.
- **Fix:**
```typescript
const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
if (!validTypes.includes(file.type)) {
  alert('Formato invalido. Use JPEG, PNG ou WebP.')
  return
}
const maxSize = 5 * 1024 * 1024
if (file.size > maxSize) {
  alert('Arquivo muito grande. Maximo 5MB.')
  return
}
```

### 6. Race condition no ReviewCard
- **Arquivo:** `src/components/chat/ReviewCard.tsx` (linhas 24-26, 38-54)
- **Problema:** `checkReviewExists` e `submitReview` atualizam state sem check de mounted. Se o usuario navegar antes do async completar, tenta setar state em componente desmontado.
- **Fix:**
```typescript
useEffect(() => {
  let mounted = true
  checkReviewExists(rentalId).then(exists => {
    if (mounted) setAlreadyReviewed(exists)
  })
  return () => { mounted = false }
}, [rentalId, checkReviewExists])
```

---

## HIGH (7 issues)

### 7. useEffect sem cleanup
- **Arquivos:** `src/pages/Home.tsx` (linhas 110-115), `src/pages/Storefront.tsx` (linhas 230-243), `src/pages/ChatsPage.tsx` (linhas 19-28)
- **Problema:** Async calls sem `return cleanup`, causa state updates em componentes desmontados.
- **Fix:**
```typescript
useEffect(() => {
  let mounted = true
  if (user?.id) {
    fetchMensagensNaoLidas(user.id)
    const cleanup = setupMensagensRealtime(user.id)
  }
  return () => {
    mounted = false
    cleanup?.()
  }
}, [user?.id])
```

### 8. Race condition em propostas
- **Arquivos:** `src/pages/ChatPage.tsx` (linhas 145-163), `src/pages/ChatSplitPage.tsx`
- **Problema:** Multiplos state updates async em `handleAceitarProposta` sem sequenciamento correto.
- **Fix:** Adicionar flag `mounted` e sequenciar os updates.

### 9. Catch blocks silenciosos no AppContext
- **Arquivo:** `src/contexts/AppContext.tsx` (linhas 559, 654, 689, 703, 783...)
- **Problema:** `catch { setEquipamentos([]) }` sem log algum. Impossivel debugar em producao.
- **Fix:**
```typescript
} catch (err) {
  if (import.meta.env.DEV) console.error('[AppContext] Erro:', err)
  setEquipamentos([])
}
```

### 10. Erros engolidos no AuthContext
- **Arquivo:** `src/contexts/AuthContext.tsx` (linhas 85-87, 104-106, 130-132)
- **Problema:** `fetchProfile` e `initAuth` silenciam erros completamente.
- **Fix:** Mesmo padrao do item 9.

### 11. Auth check faltando no PremiumProductCard
- **Arquivo:** `src/components/PremiumProductCard.tsx`
- **Problema:** Diferente do `ProductCard`, nao verifica `if (!user)` antes de favoritar.
- **Fix:**
```typescript
const toggleFav = (e: React.MouseEvent) => {
  e.stopPropagation()
  if (!user) {
    openLoginModal('Para favoritar equipamentos, faca login ou crie sua conta')
    return
  }
  // ... resto da logica
}
```

### 12. 60+ console.log/error em producao
- **Arquivos:** Multiplos (AppContext, ChatSplitPage, OwnerDashboard, FileAttachment, Adm, AuthPage, Storefront, FotosCarrossel...)
- **Problema:** 60+ statements que vazam info interna no console do browser.
- **Fix:** Remover todos ou wrappear:
```typescript
if (import.meta.env.DEV) {
  console.error('Erro:', err)
}
```

### 13. isSystemMessage com falsos positivos
- **Arquivo:** `src/utils/chat.ts` (linhas 32-44)
- **Problema:** Checa prefixos emoji (check, X, etc) que usuarios podem digitar normalmente.
- **Fix:** Confiar apenas no `senderId`:
```typescript
export function isSystemMessage(senderId: string, texto: string): boolean {
  return normalizeId(senderId) === normalizeId(SYSTEM_SENDER_ID)
}
```

---

## MEDIUM (14 issues)

### 14. Upload sem cleanup de arquivos parciais
- **Arquivo:** `src/pages/StoreSettings.tsx` (linhas 348-386)
- **Problema:** Se upload falha no meio, arquivo parcial fica no storage sem cleanup.

### 15. Input numerico aceita valores negativos
- **Arquivo:** `src/pages/ChatSplitPage.tsx` (linhas 107-124)
- **Problema:** PropostaModal aceita valores negativos em campos numericos.
- **Fix:** Adicionar `min="0"` e validacao JS.

### 16. useEffect com deps incompletas
- **Arquivo:** `src/pages/MeusEquipamentos.tsx` (linhas 503-555)
- **Problema:** Risco de infinite loop por dependencias faltando.

### 17. setTimeout sem cleanup no Adm
- **Arquivo:** `src/pages/Adm.tsx` (linhas 272, 307, 340, 411, 454, 491, 1061)
- **Problema:** 7+ `setTimeout` sem armazenar IDs para cleanup no unmount.
- **Fix:**
```typescript
const timeoutRefs = useRef<Set<NodeJS.Timeout>>(new Set())
// Ao criar: timeoutRefs.current.add(setTimeout(...))
// No cleanup: timeoutRefs.current.forEach(clearTimeout)
```

### 18. ESLint exhaustive-deps desabilitado
- **Arquivo:** `src/components/OwnerDashboard.tsx` (linha 259)
- **Problema:** `fetchConsumiveis` falta nas deps do useEffect.
- **Fix:** Wrappear em `useCallback` e incluir nas deps.

### 19. Debounce do slug sem cleanup
- **Arquivo:** `src/components/OwnerDashboard.tsx` (linhas 1147, 1182)
- **Problema:** `slugDebounceRef.current = setTimeout(...)` sem cleanup no unmount.

### 20. setTimeout sem tracking no NotificationListener
- **Arquivo:** `src/components/NotificationListener.tsx` (linhas 247, 289, 405)
- **Problema:** Multiplos setTimeout sem tracking de IDs.

### 21. Queries sequenciais sem error states granulares
- **Arquivo:** `src/components/CalendarioDisponibilidade.tsx` (linhas 57-136)
- **Problema:** Se uma query falha, todo o fluxo falha silenciosamente.

### 22. Race condition em download
- **Arquivo:** `src/components/chat/FileAttachment.tsx` (linhas 52-83)
- **Problema:** Clicks rapidos disparam multiplos downloads simultaneos.

### 23. FileReader sem handler onerror
- **Arquivos:** `src/components/chat/HorimetroInput.tsx`, `src/components/chat/InspectionWizard.tsx`
- **Problema:** `FileReader.readAsDataURL()` pode falhar (arquivo corrompido, permissao) mas nao tem `reader.onerror`.
- **Fix:**
```typescript
reader.onerror = () => {
  alert('Erro ao carregar imagem. Tente novamente.')
}
```

### 24. Botoes de rating sem aria-label
- **Arquivo:** `src/components/chat/ReviewCard.tsx` (linhas 103-118)
- **Fix:** `aria-label={`Avaliar com ${star} estrela${star > 1 ? 's' : ''}`}`

### 25. window.confirm/alert ao inves de modais
- **Arquivos:** `src/pages/ChatPage.tsx` (linhas 188, 293), `src/pages/MeusEquipamentos.tsx` (linha 592), `src/pages/Adm.tsx` (linhas 424, 467)
- **Problema:** Dialogs nativos bloqueiam UI e nao seguem o design system.

### 26. Dead code - prop locadorId nao usada
- **Arquivo:** `src/components/chat/ChatMessages.tsx` (linhas 8, 12)
- **Problema:** `locadorId` definida na interface mas nunca usada.
- **Fix:** Remover da interface.

### 27. Type safety - cast para any
- **Arquivo:** `src/utils/gerarContrato.ts` (linhas 250, 489)
- **Problema:** `(doc as any).internal.pages` bypassa TypeScript.
- **Fix:** Criar interface `JsPDFWithPages`.

---

## LOW (6 issues)

### 28. VITE_SUPABASE_URL sem null check
- **Arquivo:** `src/contexts/AppContext.tsx` (linha 110)
- **Problema:** Se env var undefined, gera URL malformada.

### 29. MenuItems com onClick vazio
- **Arquivo:** `src/pages/Perfil.tsx` (linhas 12-17)
- **Problema:** 4 items de menu com `onClick: () => {}` - UI dead.

### 30. Timezone incorreto em datas
- **Arquivo:** `src/components/SolicitarModal.tsx` (linha 74)
- **Problema:** `new Date().toISOString().split('T')[0]` pode dar data errada em timezones negativos.

### 31. alert() nativo
- **Arquivo:** `src/components/FinancialWallet.tsx` (linhas 102-105)
- **Problema:** `alert()` ao inves de toast notification.

### 32. Formatacao de data duplicada
- **Arquivos:** `gerarContrato.ts`, `contractDataMapper.ts`, `PropostaEnviadaCard.tsx`, `PropostaRecebidaCard.tsx`
- **Problema:** Logica de formatacao repetida. Centralizar em `src/utils/formatters.ts`.

### 33. Magic number hardcoded
- **Arquivo:** `src/components/chat/InspectionWizard.tsx` (linha 327)
- **Problema:** `1000` hardcoded sem constante.
- **Fix:** `const MAX_AVARIAS_LENGTH = 1000`

---

## PONTOS POSITIVOS

- Sem `dangerouslySetInnerHTML`, `eval()` ou `innerHTML`
- Sem credenciais hardcoded no codigo
- TypeScript bem tipado com interfaces consistentes
- Boa separacao de componentes e hooks
- Sem TODO/FIXME pendentes
- Keys corretas em listas
- Cleanup de event listeners bem feito no geral
- Uso correto de `mountedRef` em hooks
- Retry logic robusto no `useChat.ts`

---

## PRIORIDADES DE CORRECAO

### IMEDIATO (antes de producao)
- [ ] Fix #1: Password reset real via Supabase Auth
- [ ] Fix #2: Sanitizar inputs do RPC
- [ ] Fix #3: Verificar sanitizacao XSS no backend ou adicionar DOMPurify
- [ ] Fix #5: Validacao JS nos file uploads
- [ ] Fix #12: Remover todos console.log/error de producao

### ALTA PRIORIDADE (proximo sprint)
- [ ] Fix #6: Race condition no ReviewCard
- [ ] Fix #7: Cleanup de useEffect nas pages
- [ ] Fix #8: Race condition em propostas
- [ ] Fix #9-10: Error handling nos catch blocks
- [ ] Fix #11: Auth check no PremiumProductCard
- [ ] Fix #13: isSystemMessage baseado apenas em senderId

### MEDIA PRIORIDADE (tech debt)
- [ ] Fix #17, #19, #20: Cleanup de setTimeout em componentes
- [ ] Fix #23: Error handlers no FileReader
- [ ] Fix #25: Substituir window.confirm por modais customizados
- [ ] Fix #15: Validacao de inputs numericos
- [ ] Fix #26: Remover dead code

### BAIXA PRIORIDADE
- [ ] Fix #28-33: Melhorias de code quality
