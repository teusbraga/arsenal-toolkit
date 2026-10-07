# Plano de Implementação: Compilador Web (Ctrl+C -> Ctrl+V = PDF)
> **Backpack Tools** · Foco: MVP de Colagem Perfeita  
> Gerado em: 2026-10-07  
> Status: Aprovado para MVP

---

## Visão de Negócio (O MVP)

O usuário está coletando conteúdos de diversos sites (PC, tablet, celular) e precisa de uma ferramenta rápida para compilar tudo em um único PDF sem perder a formatação original. Ele não quer um "Microsoft Word", ele quer um **"Ctrl+C -> Ctrl+V -> PDF"** extremamente funcional e à prova de falhas. A edição manual é secundária.

### O que foi CONGELADO (Não faremos na V1):
- ❌ Paginação visual em tela (réguas, folhas A4 separadas).
- ❌ Botão/placeholder de exportação DOCX (foco total em entregar o melhor PDF possível).
- ❌ Barra de ferramentas hiper-complexa.

### O que será ENTREGUE:
- ✅ **Área de Fluxo Contínuo:** Um canvas infinito e limpo para colar conteúdos seguidos.
- ✅ **Smart Paste Engine:** Um interceptador de colagem que limpa códigos que quebram o layout (position absolute, scripts), mas **preserva perfeitamente** tabelas, imagens, negritos, cabeçalhos e listas originais da web.
- ✅ **Toolbar de Ajuste Rápido:** Ferramentas apenas para "dar um tapa" (Limpar Formatação, B/I/U, Listas, Apagar).
- ✅ **Exportação Nativa Pura:** Uso inteligente do `window.print()` e `@media print` aproveitando a capacidade do navegador de fazer quebras de página automáticas perfeitas em tabelas e parágrafos.

---

## Passos de Implementação (Refinado)

> A execução deve ser estrita a estes 8 passos focados.

### Passo 1: Registry e Rota
Adicionar a ferramenta no `toolsRegistry.ts` e `router.ts`.
- **ID:** `web-compiler` ou `text-to-pdf`
- **Nome:** Compilador de Texto para PDF
- **Descrição:** Cole textos e artigos da web mantendo a formatação e exporte para PDF instantaneamente.

### Passo 2: CSS do Canvas Contínuo e Print
Em `components.css`. 
A grande sacada aqui é o CSS de impressão para garantir que tabelas e imagens não sejam cortadas no meio pela quebra de página do PDF.
```css
.compiler-editor-area {
  min-height: 70vh;
  padding: 24px;
  background: white; /* Sempre branco, mesmo no dark mode, pois é o "papel" */
  color: black;
  border-radius: var(--radius-md);
  outline: none;
}

@media print {
  /* Esconder UI do app */
  .app-sidebar, .app-header, .compiler-toolbar, .tool-view-header { display: none !important; }
  
  /* Garantir que imagens e linhas de tabela não cortem no meio da página */
  img, tr, td, th, h1, h2, h3 { page-break-inside: avoid; }
  h1, h2, h3 { page-break-after: avoid; }
}
```

### Passo 3: View Scaffold
Criar o arquivo `text-to-pdf.view.ts`. HTML super enxuto.
- Toolbar fixa no topo.
- Container `contenteditable="true"` fluido.

### Passo 4: O "Smart Paste" Engine (O Coração da Feature)
Onde a mágica acontece. Interceptamos a colagem para evitar que o CSS dos sites originais destrua nosso layout, mas mantemos o HTML semântico.

```typescript
editorArea.addEventListener('paste', (e) => {
  e.preventDefault();
  const html = e.clipboardData?.getData('text/html');
  const text = e.clipboardData?.getData('text/plain');

  if (html) {
    const cleanHtml = sanitizeWebHtml(html);
    document.execCommand('insertHTML', false, cleanHtml);
  } else if (text) {
    document.execCommand('insertText', false, text);
  }
});

function sanitizeWebHtml(html: string): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  
  // 1. Remover lixo destrutivo
  doc.querySelectorAll('script, style, iframe, form, button, nav, header, footer').forEach(el => el.remove());
  
  // 2. Limpar atributos que quebram o PDF
  doc.querySelectorAll('*').forEach(el => {
    const element = el as HTMLElement;
    // Remover event listeners inline (onclick, etc)
    Array.from(element.attributes).forEach(attr => {
      if (attr.name.startsWith('on') || attr.name === 'class' || attr.name === 'id') {
        element.removeAttribute(attr.name);
      }
    });
    
    // Limpar estilos inline problemáticos, manter os inofensivos (color, font-weight, text-align)
    if (element.style) {
      element.style.position = '';
      element.style.margin = '';
      element.style.padding = '';
      element.style.float = '';
      element.style.display = (element.style.display === 'none') ? '' : element.style.display;
    }
    
    // Garantir que imagens não transbordem o A4
    if (element.tagName === 'IMG') {
      element.style.maxWidth = '100%';
      element.style.height = 'auto';
    }
  });
  
  return doc.body.innerHTML;
}
```

### Passo 5: Toolbar Minimalista
Implementar os botões de "tapa":
- Negrito, Itálico, Sublinhado.
- **Botão "Limpar Formatação":** Essencial. Se o usuário colar algo feio, ele seleciona e clica nisso (`document.execCommand('removeFormat')`).
- Listas (ul, ol).
- Undo / Redo.

### Passo 6: Exportação (O Botão Mágico)
Acionar `window.print()`. Modificar o `document.title` dinamicamente antes de imprimir para que o PDF salvo tenha um nome útil baseado na primeira linha do texto, e restaurar depois.

### Passo 7: Interatividade PWA
Garantir que a colagem de imagens funcione corretamente (imagens em base64 e URLs externas). Como o PDF é gerado pelo navegador, URLs externas de imagens são resolvidas nativamente na hora de gerar o PDF (desde que o usuário tenha internet no momento da colagem).

### Passo 8: Integração de Estado
Acionar o `historyManager` após a exportação bem-sucedida, registrando um resumo do documento criado. Favoritar também é configurado.
