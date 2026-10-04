# Backlog de Bugs e Melhorias

## Extrator de PDF para Office (Motor Agressivo)
- **Imagens Injetadas Localmente**: Imagens adicionadas ao PDF através do nosso próprio editor (pdf-lib) não estão sendo detectadas pelo extrator. Isso acontece porque a `pdf-lib` provavelmente as empacota usando um subtipo diferente (como um FormXObject ou com compressões específicas) que o nosso mapeamento atual do `paintImageXObject` ignora. Precisamos debugar como a `pdf-lib` grava os bytes da imagem na árvore do PDF para englobar no `getOperatorList()`.
