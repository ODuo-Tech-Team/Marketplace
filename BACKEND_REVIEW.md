# RELATÓRIO DE REVISÃO BACKEND - Marketplace

> Gerado em: 15/03/2026
> Arquivos analisados: 65+
> Total de issues: 46

---

## PROBLEMAS CRÍTICOS (Corrigir Imediatamente)

### 1. Edge Function sem autenticação
- **Arquivo**: `supabase/functions/admin-delete-user/index.ts`
- **Linhas**: 13-21
- **Problema**: Qualquer pessoa pode deletar qualquer usuário. Não há verificação de JWT, role admin, ou identidade do chamador.
- **Linhas**: 3-6 — CORS com `*` permite que qualquer site chame essa função admin.
- **Impacto**: Vulnerabilidade de segurança total. Contas podem ser deletadas por qualquer atacante.
- **Correção**: Adicionar verificação de JWT + checagem de role admin + restringir CORS ao domínio da aplicação.

### 2. Query com coluna inexistente
- **Arquivo**: `src/contexts/AppContext.tsx`
- **Linha**: 533
- **Problema**: Fallback usa `.eq('disponivel', true)` mas a coluna real é `status`.
- **Impacto**: Fallback de busca de equipamentos nunca funciona. Erro de SQL em produção.
- **Correção**: Trocar para `.in('status', ['DISPONIVEL', 'disponivel'])`.

### 3. Deleção de histórico de chat sem consentimento
- **Arquivo**: `src/contexts/AppContext.tsx`
- **Linhas**: 2122-2140
- **Problema**: Na devolução de equipamento, deleta permanentemente todas as mensagens e histórico do chat. Sem backup, sem aviso ao usuário.
- **Impacto**: Perda de evidências contratuais importantes.
- **Correção**: Implementar soft-delete ou arquivamento antes de remover.

### 4. Perda de imagem no upload
- **Arquivo**: `src/pages/StoreSettings.tsx`
- **Linhas**: 359-366
- **Problema**: Deleta a imagem antiga ANTES do upload da nova. Se o upload falhar, o usuário perde ambas.
- **Impacto**: Perda de dados irrecuperável.
- **Correção**: Inverter a ordem — fazer upload da nova primeiro, depois deletar a antiga.

### 5. Campos não salvos no banco
- **Arquivo**: `src/pages/StoreSettings.tsx`
- **Linha**: 428
- **Problema**: `cor_marca` e `loja_slug` existem no formData mas NÃO são incluídos no `updateData` enviado ao Supabase.
- **Impacto**: Alterações de cor da marca e slug nunca persistem.
- **Correção**: Incluir `cor_marca` e `loja_slug` no objeto `updateData`.

---

## PROBLEMAS DE SEGURANÇA

### 6. CORS irrestrito na Edge Function
- **Arquivo**: `supabase/functions/admin-delete-user/index.ts`
- **Linhas**: 3-6
- **Problema**: `Access-Control-Allow-Origin: *` em endpoint admin.
- **Correção**: Restringir ao domínio da aplicação.

### 7. SELECT * expondo dados sensíveis
- **Arquivo**: `src/contexts/AuthContext.tsx` — Linha 68
- **Arquivo**: `src/contexts/AppContext.tsx` — Linha 511
- **Problema**: `SELECT *` em profiles e equipamentos expõe todos os campos, incluindo dados internos.
- **Correção**: Selecionar apenas campos necessários explicitamente.

### 8. Console.error expõe detalhes em produção
- **Arquivo**: `src/contexts/AppContext.tsx`
- **Linhas**: 1982-1983
- **Problema**: Detalhes de erro logados no console do browser são visíveis em produção.
- **Correção**: Usar serviço de logging ou remover em produção.

### 9. Sem rate limiting no login admin
- **Arquivo**: `src/pages/AdminLogin.tsx`
- **Problema**: Sem limitação de tentativas de login. Brute force possível.
- **Correção**: Implementar rate limiting via Edge Function ou RLS.

### 10. Path traversal na construção de URL
- **Arquivo**: `src/components/chat/FileAttachment.tsx`
- **Linhas**: 33-36
- **Problema**: URL construída por concatenação sem validar path traversal (`../`).
- **Correção**: Validar e sanitizar o path antes de concatenar.

### 11. Inputs de endereço sem sanitização
- **Arquivo**: `src/components/chat/PropostaRecebidaCard.tsx`
- **Linhas**: 52-72
- **Problema**: Dados de endereço passados direto ao backend sem sanitização.
- **Correção**: Sanitizar inputs antes de enviar.

### 12. Dados de usuário no PDF sem sanitização
- **Arquivo**: `src/utils/gerarContrato.ts`
- **Problema**: Nomes, endereços e descrições inseridos diretamente no PDF.
- **Correção**: Sanitizar e limitar tamanho de strings.

### 13. Sem validação de cálculos financeiros
- **Arquivo**: `src/utils/contractDataMapper.ts`
- **Linhas**: 263-278
- **Problema**: Valores financeiros aceitos sem verificar se `valor_total == (diaria * dias) + frete + operador - desconto`.
- **Correção**: Adicionar validação de cálculo antes de gerar contrato.

### 14. Sem audit trail na Edge Function
- **Arquivo**: `supabase/functions/admin-delete-user/index.ts`
- **Problema**: Nenhum log de quem deletou qual usuário e quando.
- **Correção**: Criar tabela `admin_audit_log` e registrar ações admin.

---

## BUGS E ERROS DE LÓGICA

### 15. Bug de timezone em formatarData()
- **Arquivo**: `src/utils/chat.ts`
- **Linhas**: 55-72
- **Problema**: Comparação de datas com `toDateString()` é timezone-dependente. "Hoje"/"Ontem" incorreto para fusos diferentes.
- **Correção**: Usar comparações baseadas em UTC ou normalizar timezone.

### 16. Cálculo de dias não inclui dia inicial
- **Arquivo**: `src/components/chat/PropostaModal.tsx` — Linhas 74-80
- **Arquivo**: `src/components/SolicitarModal.tsx` — Linhas 53-59
- **Problema**: Aluguel de 1 dia (mesmo início e fim) retorna 0 dias.
- **Correção**: Adicionar +1 ao cálculo para rental inclusivo, ou validar que fim > início.

### 17. Download de arquivo falha
- **Arquivo**: `src/components/chat/FileAttachment.tsx`
- **Linhas**: 69-76
- **Problema**: `URL.revokeObjectURL(url)` chamado imediatamente após `link.click()`, antes do download completar.
- **Correção**: Usar `setTimeout(() => URL.revokeObjectURL(url), 1000)`.

### 18. Preview URLs revogadas prematuramente
- **Arquivo**: `src/components/chat/InspectionWizard.tsx`
- **Linhas**: 61-67
- **Problema**: useEffect com `[photos]` como dependência revoga TODAS as preview URLs a cada mudança de foto.
- **Correção**: Remover dependency `[photos]` ou usar useRef para rastrear URLs separadamente.

### 19. revokeObjectURL em data URLs (código morto)
- **Arquivo**: `src/components/chat/InspectionWizard.tsx`
- **Linhas**: 84, 102
- **Problema**: `FileReader.readAsDataURL()` gera data URLs, não blob URLs. `URL.revokeObjectURL()` não faz nada nesse caso.
- **Correção**: Remover as chamadas de `revokeObjectURL` ou trocar para `URL.createObjectURL()`.

### 20. Race condition permite reviews duplicadas
- **Arquivo**: `src/components/chat/ReviewCard.tsx`
- **Linhas**: 24-48
- **Problema**: Usuário pode submeter review enquanto `checkReviewExists` ainda está carregando.
- **Correção**: Adicionar check de `alreadyReviewed` e loading state no `handleSubmit`.

### 21. Duas operações sem transação
- **Arquivo**: `src/pages/ChatPage.tsx`
- **Linhas**: 185-214
- **Problema**: Deleta proposta e depois atualiza chat separadamente. Se a segunda falhar, dados ficam inconsistentes.
- **Correção**: Tratar erro da segunda operação e reverter se necessário.

### 22. Truthy check pula valores válidos
- **Arquivo**: `src/utils/contractDataMapper.ts`
- **Linhas**: 131-142
- **Problema**: `if (value)` pula `0` e `false` — specs como `horimetro_atual: 0` não aparecem no contrato.
- **Correção**: Usar `if (value !== null && value !== undefined && value !== '')`.

### 23. Crash em nome null
- **Arquivo**: `src/utils/gerarContrato.ts`
- **Linha**: 500
- **Problema**: `.replace()` em `dados.equipamento.nome` sem null check. Crash se nome for null.
- **Correção**: `(dados.equipamento.nome || 'Equipamento').replace(...)`.

### 24. Concatenação de timezone frágil
- **Arquivo**: `src/components/FinancialWallet.tsx`
- **Linhas**: 63-71
- **Problema**: Concatena `T00:00:00` em datas que podem já ter hora (ISO string), criando data inválida.
- **Correção**: Verificar formato antes de concatenar.

### 25. formatDate sem try/catch
- **Arquivo**: `src/utils/gerarContrato.ts`
- **Linhas**: 68-75
- **Problema**: Data inválida causa crash no `toLocaleDateString()`. Diferente de `contractDataMapper.ts` que tem tratamento.
- **Correção**: Adicionar try/catch como em `contractDataMapper.ts`.

### 26. Perfil delete silencioso
- **Arquivo**: `supabase/functions/admin-delete-user/index.ts`
- **Linhas**: 30-37
- **Problema**: Falha ao deletar profile é apenas logada. Função continua e deleta auth user, deixando dados órfãos.
- **Correção**: Retornar erro ou implementar rollback.

---

## MEMORY LEAKS E RACE CONDITIONS

### 27. Polling redundante com Realtime
- **Arquivo**: `src/hooks/useChat.ts`
- **Linha**: 172
- **Problema**: Polling a cada 5s MESMO com 3 channels Realtime ativos. Queries desnecessárias ao banco.
- **Correção**: Remover polling ou usar apenas como fallback com flag.

### 28. Subscriptions Realtime duplicadas
- **Arquivo**: `src/hooks/useChat.ts`
- **Linhas**: 101-184
- **Problema**: 3 channels + 1 interval criados sem guard contra duplicatas. Remount rápido cria leaks.
- **Correção**: Verificar se já existe subscription antes de criar nova.

### 29. Set de notificações cresce sem limite
- **Arquivo**: `src/components/NotificationListener.tsx`
- **Linhas**: 113-248
- **Problema**: `checkedPropostasRef` Set cresce indefinidamente. Cleanup de 30s pode não ser suficiente.
- **Correção**: Adicionar limite de tamanho máximo no Set.

### 30. Race condition no calendário
- **Arquivo**: `src/components/CalendarioDisponibilidade.tsx`
- **Linhas**: 63-136
- **Problema**: Queries sequenciais sem AbortController. Toggle rápido do modal causa state updates com dados antigos.
- **Correção**: Adicionar AbortController e cleanup no useEffect.

### 31. Race condition no setup Realtime
- **Arquivo**: `src/contexts/AppContext.tsx`
- **Linhas**: 2445-2476
- **Problema**: Chamadas rápidas criam múltiplas subscriptions antes da limpeza.
- **Correção**: Adicionar flag de controle antes de criar novo channel.

### 32. FileReader sem cleanup
- **Arquivo**: `src/pages/MeusEquipamentos.tsx`
- **Linhas**: 105-119
- **Problema**: Object URLs de previews de foto nunca são revogados.
- **Correção**: Usar `URL.createObjectURL` com cleanup ou revogar no unmount.

### 33. mountedRef não resetado
- **Arquivo**: `src/pages/ChatPage.tsx`
- **Linha**: 486
- **Problema**: `mountedRef.current` não é resetado no cleanup do useEffect.
- **Correção**: Adicionar `return () => { mountedRef.current = false }`.

### 34. File upload race condition
- **Arquivo**: `src/components/OwnerDashboard.tsx`
- **Linhas**: 269-296
- **Problema**: `setFotosFiles` atualiza state antes dos previews estarem prontos. Clicks rápidos dessincronizam.
- **Correção**: Aguardar previews antes de atualizar state, ou adicionar loading state.

---

## ERROR HANDLING AUSENTE

### 35. Erros de sessão ignorados
- **Arquivo**: `src/contexts/AuthContext.tsx`
- **Linhas**: 98-105
- **Problema**: `if (error) { }` — catch block completamente vazio.
- **Correção**: Logar erro e/ou notificar usuário.

### 36. signOut sem tratamento de erro
- **Arquivo**: `src/contexts/AuthContext.tsx`
- **Linhas**: 182-186
- **Problema**: `await supabase.auth.signOut()` pode falhar sem aviso.
- **Correção**: Adicionar try/catch.

### 37. Múltiplos catch blocks vazios
- **Arquivo**: `src/contexts/AppContext.tsx`
- **Linhas**: 1415, 1535, 1633, 1644, 2129, 2138, 1722
- **Problema**: `if (error) {}` em vários pontos — erros silenciosamente ignorados.
- **Correção**: Adicionar logging e feedback ao usuário.

### 38. Queries sem error handling
- **Arquivo**: `src/pages/MeusEquipamentos.tsx`
- **Linhas**: 504-554
- **Problema**: 3 queries Supabase sequenciais sem nenhum tratamento de erro.
- **Correção**: Adicionar error handling para cada query.

### 39. RPC fallback silencioso
- **Arquivo**: `src/pages/Storefront.tsx`
- **Linhas**: 90-98
- **Problema**: Catch vazio com comentário "RPC nao disponivel".
- **Correção**: Adicionar fallback UI ou toast de erro.

### 40. ConsumiveisManager trava em erro
- **Arquivo**: `src/components/ConsumiveisManager.tsx`
- **Linhas**: 18-31
- **Problema**: Sem try/catch. Se `onAdd` falhar, `setAdicionando(false)` nunca executa e UI trava.
- **Correção**: Envolver em try/finally.

### 41. Form reseta em falha
- **Arquivo**: `src/components/chat/PropostaModal.tsx`
- **Linhas**: 173-213
- **Problema**: Todos os campos do form são limpos mesmo se a submissão falhar. Usuário perde input.
- **Correção**: Só resetar form após sucesso confirmado.

### 42. Upload sem validação
- **Arquivo**: `src/components/chat/HorimetroInput.tsx`
- **Linhas**: 17-26
- **Problema**: Sem limite de tamanho, sem validação de MIME type, sem error handler no FileReader.
- **Correção**: Adicionar validações antes de processar arquivo.

---

## CÓDIGO MORTO / DESNECESSÁRIO

### 43. Função inteira nunca usada (~240 linhas)
- **Arquivo**: `src/utils/gerarContrato.ts`
- **Linhas**: 14-65 (interface) + 266-504 (função)
- **Problema**: `DadosContratoCompleto` e `gerarContratoCompleto()` nunca são importados/usados.
- **Ação**: Remover ou documentar se será usado futuramente.

### 44. Prop não utilizada
- **Arquivo**: `src/components/chat/ChatMessages.tsx`
- **Linhas**: 8, 12
- **Problema**: `locadorId` definido como prop mas nunca usado no componente.
- **Ação**: Remover prop.

### 45. Menu items sem funcionalidade
- **Arquivo**: `src/pages/Perfil.tsx`
- **Linhas**: 12-17
- **Problema**: Todos `onClick: () => {}` — botões que não fazem nada.
- **Ação**: Implementar handlers ou remover items.

### 46. Hook não exportado
- **Arquivo**: `src/hooks/index.ts`
- **Problema**: `useVertical` existe mas não é exportado no barrel file.
- **Ação**: Adicionar export.

---

## INCONSISTÊNCIAS DE PADRÃO

| Categoria | Problema |
|-----------|----------|
| Error handling | Mistura de `toast.error()`, `mostrarErro()`, `alert()`, e catch vazio |
| Status strings | Hardcoded (`'finalizada'`, `'DISPONIVEL'`, `'OCUPADO'`) sem enums/constantes |
| Mensagens sistema | Detecção baseada em emojis e strings hardcoded (frágil) |
| TypeScript | Uso de `any` em AppContext (linhas 1118, 1358, 2073) e gerarContrato (250, 489) |
| Retry strategy | Backoff linear em vez de exponencial (useChat.ts:38) |
| Regras de negócio | Forma pagamento, multa rescisória hardcoded (contractDataMapper.ts:294) |

---

## RESUMO

| Prioridade | Qtd | Categorias |
|------------|-----|------------|
| Crítico | 5 | Auth, coluna errada, deleção de chat, perda de imagem, campos não salvos |
| Segurança | 9 | CORS, SELECT *, rate limit, path traversal, sanitização, audit |
| Bugs | 12 | Timezone, cálculos, downloads, race conditions, crashes |
| Memory leaks | 8 | Subscriptions, polling, refs, FileReader |
| Error handling | 8 | Catches vazios, forms sem try/catch |
| Código morto | 4 | ~300+ linhas removíveis |

---

## CHECKLIST DE CORREÇÃO

- [ ] Adicionar auth + CORS restrito na Edge Function
- [ ] Corrigir coluna `disponivel` para `status` no AppContext
- [ ] Implementar soft-delete no histórico de chat
- [ ] Inverter ordem de delete/upload em StoreSettings
- [ ] Incluir `cor_marca` e `loja_slug` no updateData
- [ ] Corrigir cálculo de dias (PropostaModal + SolicitarModal)
- [ ] Corrigir revokeObjectURL prematuro no FileAttachment
- [ ] Corrigir memory leak no InspectionWizard
- [ ] Adicionar error handling nos catch blocks vazios
- [ ] Remover código morto de gerarContrato.ts
- [ ] Padronizar error handling (toast vs alert vs console)
- [ ] Criar enums para status strings
- [ ] Adicionar validação financeira no contractDataMapper
- [ ] Remover polling redundante no useChat
- [ ] Adicionar rate limiting no AdminLogin
