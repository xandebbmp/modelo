export type ModoVisualizacaoGrafico = 'COMPARATIVO' | 'SEGREGACOES' | 'ECONOMIA';
export type FiltroPeriodoGrafico = 'ULTIMOS_6_MESES' | 'ANO_2026' | 'RBT12_MOVEL';

export interface DecomposicaoImpostosMes {
  iss: number;
  cpp: number;
  irpj: number;
  csll: number;
  cofins: number;
  pis: number;
}

export interface MesComparativoTributario {
  mes: number; // 1..12
  ano: number; // ex: 2026
  labelCurto: string; // 'Jan', 'Fev', 'Mar', ...
  labelCompleto: string; // 'Jan/2026'
  faturamentoBruto: number; // Volume total de serviços faturados no salão
  repassesMei: number; // Valor repassado aos profissionais MEI (Lei 13.352/2016)
  cotaSalaoBaseCalculo: number; // Base de cálculo do DAS (Faturamento Bruto - Repasses MEI)
  
  // Impostos
  impostosPagos: number; // DAS recolhido no Simples Nacional
  impostosSemSegregacao: number; // Valor se o salão tributasse sobre 100% da receita (bitributação)
  economiaGerada: number; // impostosSemSegregacao - impostosPagos
  
  // Margem e Carga Efetiva
  margemTributariaEfetiva: number; // (impostosPagos / faturamentoBruto) * 100 (em %)
  margemTributariaSemSegregacao: number; // (impostosSemSegregacao / faturamentoBruto) * 100 (em %)
  aliquotaEfetivaSobreBase: number; // (impostosPagos / cotaSalaoBaseCalculo) * 100 (alíquota efetiva Simples)
  
  margemLiquidaSalao: number; // cotaSalaoBaseCalculo - impostosPagos
  percentualMargemLiquida: number; // (margemLiquidaSalao / faturamentoBruto) * 100
  
  // Detalhamento dos tributos
  decomposicao: DecomposicaoImpostosMes;
  
  status: 'CONCLUIDO' | 'CORRENTE' | 'PROJETADO';
  qtdNotasEmitidas?: number;
  qtdProfissionaisAtivos?: number;
}

export interface ResumoEstatisticoTributario {
  totalFaturamentoBruto: number;
  totalRepassesMei: number;
  totalCotaSalao: number;
  totalImpostosPagos: number;
  totalImpostosSemSegregacao: number;
  totalEconomiaGerada: number;
  
  margemTributariaMedia: number; // Carga tributária média %
  margemTributariaMediaSemSegregacao: number;
  percentualEconomiaTotal: number;
  
  mesMaiorFaturamento: MesComparativoTributario;
  mesMenorCarga: MesComparativoTributario;
  mesMaiorEconomia: MesComparativoTributario;
}
