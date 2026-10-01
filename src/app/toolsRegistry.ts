export interface ToolItem {
  id: string;
  name: string;
  category: 'calculators' | 'converters' | 'fitness' | 'financial' | 'text' | 'devtools' | 'colors' | 'generators' | 'pdf' | 'images' | 'files' | 'excel' | 'general' | 'everyday' | 'engineering' | 'documents';
  categoryName: string;
  description: string;
  path: string;
  featured?: boolean;
}

export const CATEGORIES_LIST = [
  {
    id: 'calculators',
    name: 'Calculadoras',
    desc: 'Impostos, salário, financeiras, básicas e científicas.',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="6" x2="16" y2="6"/><line x1="16" y1="14" x2="16" y2="18"/><path d="M8 10h.01M12 10h.01M16 10h.01M8 14h.01M12 14h.01M8 18h.01M12 18h.01"/></svg>`,
    path: '#/categoria/calculators'
  },
  {
    id: 'converters',
    name: 'Conversores',
    desc: 'Moedas em tempo real, unidades, datas e fusos.',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 10l5-5 5 5M7 14l5 5 5-5"/></svg>`,
    path: '#/categoria/converters'
  },
  {
    id: 'pdf',
    name: 'PDF',
    desc: 'Editar, converter, unir, dividir e organizar.',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>`,
    path: '#/categoria/pdf'
  },
  {
    id: 'documents',
    name: 'Documentos',
    desc: 'Modelos, recibos, propostas e declarações.',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>`,
    path: '#/categoria/documents'
  }
];

export const TOOLS_LIST: ToolItem[] = [
  // Calculadoras em Destaque
  {
    id: 'tax-calc',
    name: 'Calculadora de Impostos',
    category: 'calculators',
    categoryName: 'Calculadoras',
    description: 'Calcule IR, INSS, PIS/COFINS e Simples Nacional.',
    path: '#/calculadora-impostos',
    featured: true,
  },
  {
    id: 'salary-calc',
    name: 'Calculadora de Salário',
    category: 'calculators',
    categoryName: 'Calculadoras',
    description: 'Veja seu salário líquido, descontos e CLT vs PJ.',
    path: '#/calculadora-salario',
    featured: true,
  },
  {
    id: 'percentage-calc',
    name: 'Porcentagem',
    category: 'calculators',
    categoryName: 'Calculadoras',
    description: 'Variação percentual, aumentos e descontos rápidos.',
    path: '#/calculadora-porcentagem',
    featured: false,
  },
  {
    id: 'basic-calc',
    name: 'Calculadora Básica',
    category: 'calculators',
    categoryName: 'Calculadoras',
    description: 'Operações fundamentais com histórico de fita.',
    path: '#/calculadora-basica',
    featured: false,
  },
  {
    id: 'rule-of-three',
    name: 'Regra de Três',
    category: 'calculators',
    categoryName: 'Calculadoras',
    description: 'Proporções diretas e inversas sem complicação.',
    path: '#/regra-de-tres',
    featured: false,
  },

  // Conversores em Destaque
  {
    id: 'currency-converter',
    name: 'Conversor de Moedas',
    category: 'converters',
    categoryName: 'Conversores',
    description: 'Dólar, Euro, Bitcoin e mais de 150 moedas.',
    path: '#/conversor-moedas',
    featured: true,
  },
  {
    id: 'units-converter',
    name: 'Conversor de Unidades',
    category: 'converters',
    categoryName: 'Conversores',
    description: 'Comprimento, peso, volume, temperatura e dados.',
    path: '#/conversor-unidades',
    featured: true,
  },

  // PDF
  {
    id: 'pdf-editor',
    name: 'Editor de PDF',
    category: 'pdf',
    categoryName: 'PDF',
    description: 'Edite, una, divida e organize seus PDFs.',
    path: '#/editor-pdf',
    featured: true,
  },

  // Documentos
  {
    id: 'documents-generator',
    name: 'Gerador de Documentos',
    category: 'documents',
    categoryName: 'Documentos',
    description: 'Crie recibos, contratos e propostas na hora.',
    path: '#/gerador-documentos',
    featured: true,
  }
];
