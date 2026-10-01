import { store } from '../app/store';

export function renderAdSlot(slotId: string = 'ad-banner-default'): HTMLElement {
  const wrapper = document.createElement('div');
  wrapper.className = 'ad-slot-wrapper';
  wrapper.id = slotId;

  const state = store.getState();

  if (!state.isOnline) {
    wrapper.innerHTML = `
      <span class="ad-slot-label">Backpack Tools</span>
      <span style="font-size: 0.78rem; color: var(--text-secondary);">⚡ Modo Offline Ativo • Produtividade Sem Interrupções</span>
    `;
    return wrapper;
  }

  // Em modo online, prepara o slot para Google AdSense
  wrapper.innerHTML = `
    <span class="ad-slot-label">Publicidade</span>
    <div style="font-size: 0.78rem; color: var(--text-tertiary); display: flex; align-items: center; gap: 6px;">
      <span>Espaço Reservado para Anúncio</span>
    </div>
  `;

  return wrapper;
}
