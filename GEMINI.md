# Regras Técnicas do Projeto BP Tools

## 1. Manipulação de ArrayBuffers (Detached ArrayBuffer)
**Risco Crítico**: Passar um ArrayBuffer diretamente para a API do PDF.js (pdfjsLib.getDocument({ data: new Uint8Array(buffer) })) faz com que o buffer seja transferido para um Web Worker. Isso esvazia/destrói (detach) a referência original na main thread, quebrando o uso subsequente desse buffer (como passá-lo para PDFDocument.load do pdf-lib ou outra criptografia).

**Solução Mandatória**: SEMPRE clone o buffer utilizando .slice(0) antes de enviá-lo para leituras ou análises.
- **Forma Incorreta:** pdfjsLib.getDocument({ data: new Uint8Array(buffer) })
- **Forma Correta:** pdfjsLib.getDocument({ data: new Uint8Array(buffer.slice(0)) })

Esta regra se aplica a TODOS os componentes de visualização, edição, desbloqueio e conversão de PDFs (.view.ts e .service.ts).
