#!/bin/bash

# 1. Remove imports não usados em App.tsx
sed -i "s/import ChatsPage from '\.\/pages\/ChatsPage'/\/\/ import ChatsPage from '.\/pages\/ChatsPage'/g" src/App.tsx
sed -i "s/import { useEffect, useState, useRef, useCallback }/import { useEffect, useState, useRef }/g" src/pages/ChatPage.tsx
sed -i "s/import { useEffect, useState, useRef, useCallback }/import { useEffect, useState, useRef }/g" src/pages/ChatSplitPage.tsx

# 2. Remove import de NovaProposta em ChatPage e ChatSplitPage (já não é mais usado)
sed -i "s/, type NovaProposta//g" src/pages/ChatPage.tsx
sed -i "s/, type NovaProposta//g" src/pages/ChatSplitPage.tsx

# 3. Remove imports não usados
sed -i "s/, getEquipamentoImageUrl//g" src/pages/ChatSplitPage.tsx
sed -i "s/, ArrowLeft//g" src/pages/ChatSplitPage.tsx
sed -i "s/, Camera//g" src/pages/MeusEquipamentos.tsx

# 4. Corrige uso de status_locacao para status
sed -i "s/equipamento\.status_locacao/equipamento\.status/g" src/pages/MeusEquipamentos.tsx

echo "Correções aplicadas com sucesso!"
