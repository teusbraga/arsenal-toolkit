# CHECKPOINT V1: MOTOR HÍBRIDO DE CAIXAS MÓVEIS (BOUNDING BOX CROPPING)

**Data do Salvamento**: 04/10/2026  
**Status**: 85% do padrão de mercado alcançado 100% no navegador (Client-Side).

## O que esta versão conquistou:
1. **Caixas Móveis Independentes**:
   - Detecta regiões não-texto (tabelas, contornos, assinaturas, carimbos, molduras, fotos).
   - Recorta cirurgicamente (`crop`) apenas as regiões ativas em PNGs transparentes.
   - Insere cada elemento como uma caixa solta que pode ser clicada, movida e redimensionada no PowerPoint e no Word!
2. **Camada de Textos Editáveis**:
   - Apaga o texto do canvas para não haver texto duplicado/borrado.
   - Sobrepõe o texto nativo com alinhamento preciso, sem quebras indesejadas de linha.
3. **Casos Testados com Sucesso**:
   - Tabela com linhas e fotos soltas no slide.
   - Certidão oficial com bandeira, carimbos e assinatura do Vasco Correia Maia.

## Arquivos inclusos neste Checkpoint:
- `hybrid-office.service.ts`
- `box-detector.ts`
- `office.service.ts`
- `pdf-to-pptx.view.ts`
- `pdf-to-word.view.ts`
- `AGRESSIVE_ENGINE_PPTX.ts`

Para restaurar manualmente caso algo dê errado no futuro, basta copiar estes arquivos de volta para `src/features/pdf/`.
