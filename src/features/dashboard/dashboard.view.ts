import { renderPdfCategoryHub } from '../categories/category.view';

/**
 * Nova Home do Arsenal PDF:
 * Central organizada com as 17 ferramentas PDF divididas em 4 temas com faixas coloridas,
 * busca em tempo real, badges contextuais, navegação de utilitários e ad slot reservado.
 */
export function renderDashboard(container: HTMLElement): void {
  renderPdfCategoryHub(container, true);
}
