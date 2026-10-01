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
  },
  {
    id: 'fitness',
    name: 'Fitness & Saúde',
    desc: 'IMC, BMR, TDEE, macros, pace de corrida e 1RM.',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 4v16M18 4v16M2 8h4M2 16h4M18 8h4M18 16h4M6 12h12"/></svg>`,
    path: '#/categoria/fitness'
  },
  {
    id: 'financial',
    name: 'Financeiro',
    desc: 'Juros compostos, financiamentos SAC/Price e margem.',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>`,
    path: '#/categoria/financial'
  },
  {
    id: 'text',
    name: 'Texto & Produtividade',
    desc: 'Contador de caracteres, case converter, diff e slug.',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="17" y1="10" x2="3" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="14" x2="3" y2="14"/><line x1="17" y1="18" x2="3" y2="18"/></svg>`,
    path: '#/categoria/text'
  },
  {
    id: 'devtools',
    name: 'Developer Tools',
    desc: 'JSON Formatter, Base64, Hashes, UUID, JWT e Regex.',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>`,
    path: '#/categoria/devtools'
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
  {
    id: 'scientific-calc',
    name: 'Calculadora Científica',
    category: 'calculators',
    categoryName: 'Calculadoras',
    description: 'Trigonometria, potências, logaritmos e constantes.',
    path: '#/calculadora-cientifica',
    featured: false,
  },
  {
    id: 'fractions-calc',
    name: 'Frações, MDC e MMC',
    category: 'calculators',
    categoryName: 'Calculadoras',
    description: 'Operações fracionárias, simplificação, MDC e MMC.',
    path: '#/fracoes-mdc-mmc',
    featured: false,
  },
  {
    id: 'equations-calc',
    name: 'Resolução de Equações',
    category: 'calculators',
    categoryName: 'Calculadoras',
    description: 'Equações de 1º e 2º grau (Bhaskara e vértice).',
    path: '#/equacoes',
    featured: false,
  },
  {
    id: 'statistics-calc',
    name: 'Estatística Descritiva',
    category: 'calculators',
    categoryName: 'Calculadoras',
    description: 'Média, mediana, moda, variância e desvio padrão.',
    path: '#/estatistica',
    featured: false,
  },
  {
    id: 'matrices-calc',
    name: 'Matrizes & Determinantes',
    category: 'calculators',
    categoryName: 'Calculadoras',
    description: 'Cálculo de determinantes 2x2 e 3x3 e propriedades.',
    path: '#/matrizes',
    featured: false,
  },
  {
    id: 'graph-plotter',
    name: 'Gráficos de Funções 2D',
    category: 'calculators',
    categoryName: 'Calculadoras',
    description: 'Plotador visual em eixos cartesianos com zoom.',
    path: '#/graficos-funcoes',
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
  },
  {
    id: 'dates-calc',
    name: 'Calculadora de Datas & Dias Úteis',
    category: 'converters',
    categoryName: 'Conversores',
    description: 'Diferença de datas, dias úteis, prazos e fusos.',
    path: '#/calculadora-datas',
    featured: false,
  },
  {
    id: 'fitness-calc',
    name: 'Saúde & Fitness',
    category: 'fitness',
    categoryName: 'Fitness & Saúde',
    description: 'IMC, BMR, TDEE, macros, pace de corrida e 1RM.',
    path: '#/fitness',
    featured: true,
  },
  {
    id: 'compound-interest',
    name: 'Juros Compostos',
    category: 'financial',
    categoryName: 'Financeiro',
    description: 'Simulação patrimonial com aportes mensais e evolução.',
    path: '#/juros-compostos',
    featured: true,
  },
  {
    id: 'financing-calc',
    name: 'Simulador de Financiamento',
    category: 'financial',
    categoryName: 'Financeiro',
    description: 'Comparativo SAC vs PRICE para imóveis e veículos.',
    path: '#/financiamento',
    featured: false,
  },
  {
    id: 'cash-vs-installment',
    name: 'À Vista vs Parcelado & Margem',
    category: 'financial',
    categoryName: 'Financeiro',
    description: 'Avaliação de desconto com CDI e markup comercial.',
    path: '#/a-vista-vs-parcelado',
    featured: false,
  },
  {
    id: 'bill-split',
    name: 'Divisão de Conta & Gorjeta',
    category: 'financial',
    categoryName: 'Financeiro',
    description: 'Divisão rápida de bar, restaurante e taxa de serviço.',
    path: '#/divisao-conta',
    featured: false,
  },
  {
    id: 'text-tools',
    name: 'Manipulação de Texto',
    category: 'text',
    categoryName: 'Texto & Produtividade',
    description: 'Contador de palavras, maiúsculas/minúsculas, diff e slug.',
    path: '#/texto',
    featured: true,
  },
  {
    id: 'dev-tools',
    name: 'Developer Tools',
    category: 'devtools',
    categoryName: 'Developer Tools',
    description: 'JSON Formatter, Base64, Hashes, UUID, JWT e Regex.',
    path: '#/dev-tools',
    featured: true,
  }
];
