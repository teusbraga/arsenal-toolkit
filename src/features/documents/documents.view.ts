import { store } from '../../app/store';

export function renderDocumentsGenerator(container: HTMLElement): void {
  const isFav = store.getState().favorites.includes('documents-generator');

  container.innerHTML = `
    <div class="tool-view-wrapper">
      <!-- Subheader -->
      <div class="tool-view-header">
        <div class="tool-header-left">
          <button class="btn-back" id="docs-btn-back" title="Voltar">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
            </svg>
          </button>
          <h2 class="tool-header-title">Gerador de Documentos</h2>
        </div>
        <button class="btn-favorite ${isFav ? 'active' : ''}" id="docs-btn-fav" title="Favoritar">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="${isFav ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
          </svg>
        </button>
      </div>

      <!-- Grid de Templates (conforme mockup) -->
      <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-bottom: 24px;">
        <div class="tool-card" data-template="contrato">
          <div class="tool-card-content">
            <div class="tool-icon-box">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
              </svg>
            </div>
            <div class="tool-card-info">
              <span class="tool-card-name">Contrato de Trabalho</span>
              <span class="tool-card-desc">Modelo padrão</span>
            </div>
          </div>
          <svg class="chevron-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </div>

        <div class="tool-card" data-template="proposta">
          <div class="tool-card-content">
            <div class="tool-icon-box">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
              </svg>
            </div>
            <div class="tool-card-info">
              <span class="tool-card-name">Proposta Comercial</span>
              <span class="tool-card-desc">Apresente suas ideias</span>
            </div>
          </div>
          <svg class="chevron-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </div>

        <div class="tool-card" data-template="recibo">
          <div class="tool-card-content">
            <div class="tool-icon-box">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>
              </svg>
            </div>
            <div class="tool-card-info">
              <span class="tool-card-name">Recibo</span>
              <span class="tool-card-desc">Comprovante de pagamentos</span>
            </div>
          </div>
          <svg class="chevron-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </div>

        <div class="tool-card" data-template="declaracao">
          <div class="tool-card-content">
            <div class="tool-icon-box">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              </svg>
            </div>
            <div class="tool-card-info">
              <span class="tool-card-name">Declaração</span>
              <span class="tool-card-desc">Diversos modelos</span>
            </div>
          </div>
          <svg class="chevron-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </div>
      </div>

      <!-- Área de Edição Rápida do Recibo (Padrão) -->
      <div id="receipt-editor" style="border-top: 1px solid var(--border-color); padding-top: 20px;">
        <h3 style="font-size: 0.95rem; font-weight: 600; color: var(--text-main); margin-bottom: 14px;">Preenchimento Rápido: Recibo de Pagamento</h3>
        
        <div class="form-group">
          <label class="form-label">Recebi de (Nome ou Empresa)</label>
          <input type="text" id="doc-payer" class="form-input" value="Mariana Silva" />
        </div>

        <div class="form-group">
          <label class="form-label">A quantia de (R$)</label>
          <input type="text" id="doc-amount" class="form-input" value="1.500,00" />
        </div>

        <div class="form-group">
          <label class="form-label">Referente aos serviços de</label>
          <input type="text" id="doc-service" class="form-input" value="Consultoria em Desenvolvimento Web e Otimização" />
        </div>

        <button class="btn-primary" id="btn-print-doc">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>
          </svg>
          Gerar e Imprimir / Salvar PDF
        </button>
      </div>
    </div>
  `;

  const btnBack = container.querySelector('#docs-btn-back') as HTMLButtonElement;
  const btnFav = container.querySelector('#docs-btn-fav') as HTMLButtonElement;
  const btnPrint = container.querySelector('#btn-print-doc') as HTMLButtonElement;

  btnBack.addEventListener('click', () => {
    window.location.hash = '#/';
  });

  btnFav.addEventListener('click', () => {
    store.toggleFavorite('documents-generator');
    const updated = store.getState().favorites.includes('documents-generator');
    btnFav.classList.toggle('active', updated);
  });

  btnPrint.addEventListener('click', () => {
    const payer = (container.querySelector('#doc-payer') as HTMLInputElement).value;
    const amount = (container.querySelector('#doc-amount') as HTMLInputElement).value;
    const service = (container.querySelector('#doc-service') as HTMLInputElement).value;

    const printWin = window.open('', '_blank');
    if (printWin) {
      printWin.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Recibo de Pagamento - Backpack Tools</title>
          <style>
            body { font-family: 'Inter', sans-serif; padding: 40px; color: #0F172A; max-width: 700px; margin: 0 auto; line-height: 1.6; }
            .header { text-align: center; border-bottom: 2px solid #0F172A; padding-bottom: 16px; margin-bottom: 24px; }
            .amount { font-size: 1.4rem; font-weight: bold; background: #F1F5F9; padding: 12px; border-radius: 6px; margin: 20px 0; text-align: right; }
            .body { font-size: 1.05rem; margin-bottom: 40px; }
            .signature { margin-top: 60px; border-top: 1px solid #64748B; width: 280px; text-align: center; padding-top: 8px; font-size: 0.9rem; }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>RECIBO DE PAGAMENTO</h2>
          </div>
          <div class="amount">VALOR: R$ ${amount}</div>
          <div class="body">
            <p>Recebi(emos) de <strong>${payer}</strong> a importância supra de <strong>R$ ${amount}</strong>, referente a <strong>${service}</strong>.</p>
            <p>Para maior clareza firmo(amos) o presente recibo para que produza os seus efeitos legais.</p>
            <p>Data: ${new Date().toLocaleDateString('pt-BR')}</p>
          </div>
          <div class="signature">
            Assinatura do Emissor
          </div>
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
        </html>
      `);
      printWin.document.close();
    }
  });
}
