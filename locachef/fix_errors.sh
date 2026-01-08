#!/bin/bash

# Remove referências a imagem_url
find src -name "*.tsx" -type f -exec sed -i "s/equipamento\.fotos\?\.\?\[0\] || equipamento\.imagem_url/equipamento\.fotos?.[0]/g" {} \;
find src -name "*.tsx" -type f -exec sed -i "s/chat\.equipamento\?\.fotos\?\.\?\[0\] || chat\.equipamento\?\.imagem_url/chat\.equipamento?.fotos?.[0]/g" {} \;
find src -name "*.tsx" -type f -exec sed -i "s/eq\.fotos\?\.\?\[0\] || eq\.imagem_url/eq\.fotos?.[0]/g" {} \;

# Remove referências a locador_verificado, media_avaliacoes, total_avaliacoes, especificacoes
find src -name "*.tsx" -type f -exec sed -i "s/equipamento\.locador_verificado/false/g" {} \;
find src -name "*.tsx" -type f -exec sed -i "s/equipamento\.media_avaliacoes/0/g" {} \;
find src -name "*.tsx" -type f -exec sed -i "s/equipamento\.total_avaliacoes/0/g" {} \;

echo "Correções aplicadas!"
