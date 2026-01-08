#!/bin/bash

cd /mnt/c/Users/Mauricio.ODuo/Desktop/Automation_ODUO/Ideias/LP_MarketPlace/locachef

# Remove todas as referências a razao_social nos SELECTs
sed -i 's/razao_social//g' src/contexts/AppContext.tsx

echo "✅ Correção aplicada!"
