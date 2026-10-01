import { store } from './store';
import { renderDashboard } from '../features/dashboard/dashboard.view';
import { renderTaxCalculator } from '../features/calculator/tax.view';
import { renderSalaryCalculator } from '../features/calculator/salary.view';
import { renderPercentageCalculator } from '../features/calculator/percentage.view';
import { renderBasicCalculator } from '../features/calculator/basic.view';
import { renderRuleOfThree } from '../features/calculator/ruleOfThree.view';
import { renderCurrencyConverter } from '../features/converters/currency.view';
import { renderUnitsConverter } from '../features/converters/units.view';
import { renderPdfMerge } from '../features/pdf/pdf-merge.view';
import { renderPdfExtract } from '../features/pdf/pdf-extract.view';
import { renderPdfOrganize } from '../features/pdf/pdf-organize.view';
import { renderPdfToImage } from '../features/pdf/pdf-to-image.view';
import { renderImageToPdf } from '../features/pdf/image-to-pdf.view';
import { renderPdfMetadata } from '../features/pdf/pdf-metadata.view';
import { renderPdfCompress } from '../features/pdf/pdf-compress.view';
import { renderPdfEdit } from '../features/pdf/pdf-edit.view';
import { renderImageCompress } from '../features/image/image-compress.view';
import { renderImageConvert } from '../features/image/image-convert.view';
import { renderImageResize } from '../features/image/image-resize.view';
import { renderImageBase64 } from '../features/image/image-base64.view';
import { renderImageThumbnails } from '../features/image/image-thumbnails.view';
import { renderFileChecksum } from '../features/files/file-checksum.view';
import { renderFileAnalyzer } from '../features/files/file-analyzer.view';
import { renderMiniExcel } from '../features/excel/mini-excel.view';
import { renderDocumentsGenerator } from '../features/documents/documents.view';
import { renderScientificCalculator } from '../features/calculator/scientific.view';
import { renderFractionsCalculator } from '../features/calculator/fractions.view';
import { renderEquationsCalculator } from '../features/calculator/equations.view';
import { renderStatisticsCalculator } from '../features/calculator/statistics.view';
import { renderMatricesCalculator } from '../features/calculator/matrices.view';
import { renderGraphPlotter } from '../features/calculator/graphPlotter.view';
import { renderDatesCalculator } from '../features/converters/dates.view';
import { renderFitnessCalculator } from '../features/fitness/fitness.view';
import { renderCompoundInterest } from '../features/financial/compoundInterest.view';
import { renderFinancingCalculator } from '../features/financial/financing.view';
import { renderCashVsInstallment } from '../features/financial/cashVsInstallment.view';
import { renderBillSplit } from '../features/financial/billSplit.view';
import { renderTextView } from '../features/text/text.view';
import { renderDevTools } from '../features/devtools/devtools.view';
import { renderGeneratorsView } from '../features/generators/generators.view';
import { renderColorsView } from '../features/colors/colors.view';
import { renderCategoryView } from '../features/categories/category.view';
import { TOOLS_LIST } from './toolsRegistry';

export function initRouter(appContainer: HTMLElement): void {
  function handleRoute() {
    const hash = window.location.hash || '#/';
    store.setRoute(hash);

    appContainer.innerHTML = '';
    window.scrollTo(0, 0);

    if (hash === '#/' || hash === '') {
      renderDashboard(appContainer);
    } else if (hash === '#/calculadora-impostos') {
      renderTaxCalculator(appContainer);
    } else if (hash === '#/calculadora-salario') {
      renderSalaryCalculator(appContainer);
    } else if (hash === '#/calculadora-porcentagem') {
      renderPercentageCalculator(appContainer);
    } else if (hash === '#/calculadora-basica') {
      renderBasicCalculator(appContainer);
    } else if (hash === '#/regra-de-tres') {
      renderRuleOfThree(appContainer);
    } else if (hash === '#/conversor-moedas') {
      renderCurrencyConverter(appContainer);
    } else if (hash === '#/conversor-unidades') {
      renderUnitsConverter(appContainer);
    } else if (hash === '#/pdf/juntar') {
      renderPdfMerge(appContainer);
    } else if (hash === '#/pdf/extrair') {
      renderPdfExtract(appContainer);
    } else if (hash === '#/pdf/organizar') {
      renderPdfOrganize(appContainer);
    } else if (hash === '#/pdf/para-imagem') {
      renderPdfToImage(appContainer);
    } else if (hash === '#/pdf/imagem-para-pdf') {
      renderImageToPdf(appContainer);
    } else if (hash === '#/pdf/metadados') {
      renderPdfMetadata(appContainer);
    } else if (hash === '#/pdf/comprimir') {
      renderPdfCompress(appContainer);
    } else if (hash === '#/pdf/editor') {
      renderPdfEdit(appContainer);
    } else if (hash === '#/imagem/comprimir') {
      renderImageCompress(appContainer);
    } else if (hash === '#/imagem/converter') {
      renderImageConvert(appContainer);
    } else if (hash === '#/imagem/redimensionar') {
      renderImageResize(appContainer);
    } else if (hash === '#/imagem/base64') {
      renderImageBase64(appContainer);
    } else if (hash === '#/imagem/thumbnails') {
      renderImageThumbnails(appContainer);
    } else if (hash === '#/arquivo/checksum') {
      renderFileChecksum(appContainer);
    } else if (hash === '#/arquivo/analisador') {
      renderFileAnalyzer(appContainer);
    } else if (hash === '#/excel/mini-planilha') {
      renderMiniExcel(appContainer);
    } else if (hash === '#/gerador-documentos') {
      renderDocumentsGenerator(appContainer);
    } else if (hash === '#/calculadora-cientifica') {
      renderScientificCalculator(appContainer);
    } else if (hash === '#/fracoes-mdc-mmc') {
      renderFractionsCalculator(appContainer);
    } else if (hash === '#/equacoes') {
      renderEquationsCalculator(appContainer);
    } else if (hash === '#/estatistica') {
      renderStatisticsCalculator(appContainer);
    } else if (hash === '#/matrizes') {
      renderMatricesCalculator(appContainer);
    } else if (hash === '#/graficos-funcoes') {
      renderGraphPlotter(appContainer);
    } else if (hash === '#/calculadora-datas') {
      renderDatesCalculator(appContainer);
    } else if (hash === '#/fitness') {
      renderFitnessCalculator(appContainer);
    } else if (hash === '#/juros-compostos') {
      renderCompoundInterest(appContainer);
    } else if (hash === '#/financiamento') {
      renderFinancingCalculator(appContainer);
    } else if (hash === '#/a-vista-vs-parcelado') {
      renderCashVsInstallment(appContainer);
    } else if (hash === '#/divisao-conta') {
      renderBillSplit(appContainer);
    } else if (hash === '#/texto') {
      renderTextView(appContainer);
    } else if (hash === '#/dev-tools') {
      renderDevTools(appContainer);
    } else if (hash === '#/geradores') {
      renderGeneratorsView(appContainer);
    } else if (hash === '#/cores-css') {
      renderColorsView(appContainer);
    } else if (hash.startsWith('#/categoria/')) {
      const catId = hash.replace('#/categoria/', '');
      renderCategoryView(appContainer, catId);
    } else if (hash === '#/favoritos') {
      renderFavoritesView(appContainer);
    } else {
      renderDashboard(appContainer);
    }
  }

  window.addEventListener('hashchange', handleRoute);
  handleRoute();
}

function renderFavoritesView(container: HTMLElement): void {
  const favIds = store.getState().favorites;
  const favTools = TOOLS_LIST.filter((t) => favIds.includes(t.id));

  container.innerHTML = `
    <div class="dashboard-hero">
      <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px;">
        <button class="btn-back" id="fav-btn-back" title="Voltar">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
          </svg>
        </button>
        <h1 class="hero-title" style="margin-bottom: 0;">Meus Favoritos</h1>
      </div>
      <p class="hero-subtitle">Acesso rápido às suas ferramentas marcadas com estrela.</p>
    </div>

    ${favTools.length === 0 ? `
      <div style="padding: 40px; text-align: center; color: var(--text-secondary); background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: var(--radius-md);">
        Nenhuma ferramenta favoritada ainda. Clique no ícone de estrela (☆) no topo de qualquer ferramenta para fixá-la aqui.
      </div>
    ` : `
      <div class="featured-grid" style="grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));">
        ${favTools.map((tool) => `
          <div class="tool-card" data-path="${tool.path}">
            <div class="tool-card-content">
              <div class="tool-icon-box">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                </svg>
              </div>
              <div class="tool-card-info">
                <span class="tool-card-name">${tool.name}</span>
                <span class="tool-card-desc">${tool.description}</span>
              </div>
            </div>
            <svg class="chevron-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </div>
        `).join('')}
      </div>
    `}
  `;

  const btnBack = container.querySelector('#fav-btn-back') as HTMLButtonElement | null;
  btnBack?.addEventListener('click', () => { window.location.hash = '#/'; });

  container.querySelectorAll('.tool-card').forEach((el) => {
    el.addEventListener('click', () => {
      const path = el.getAttribute('data-path');
      if (path) window.location.hash = path;
    });
  });
}
