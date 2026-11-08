export type TendenciaMoM = 'ALTA' | 'QUEDA' | 'ESTAVEL';

export interface ComparativoMeiMoMItem {
  id_parceiro: number;
  nome: string;
  nome_fantasia: string;
  especialidade: string;
  foto_avatar?: string;
  cnpj: string;
  
  // Faturamento (Volume Bruto dos Serviços)
  faturamentoAtual: number;
  faturamentoAnterior: number;
  variacaoNominal: number; // Atual - Anterior
  variacaoPercentual: number; // ((Atual - Anterior) / Anterior) * 100
  tendencia: TendenciaMoM;

  // Segregação Fiscal (Lei nº 13.352/2016)
  repasseMeiAtual: number;
  repasseMeiAnterior: number;
  variacaoRepassePercentual: number;
  
  cotaSalaoAtual: number;
  cotaSalaoAnterior: number;

  // Métricas Operacionais
  qtdAtendimentosAtual: number;
  qtdAtendimentosAnterior: number;
  variacaoAtendimentosPercentual: number;

  ticketMedioAtual: number;
  ticketMedioAnterior: number;
  variacaoTicketMedioPercentual: number;

  // Limite MEI
  faturamentoAnualAcumulado: number;
  tetoAnualLimite: number;
  percentualTetoUtilizado: number;
}

export interface ResumoGeralComparativoMoM {
  mesAtualLabel: string;
  mesAnteriorLabel: string;
  mesAtualNumero: number;
  anoAtual: number;
  mesAnteriorNumero: number;
  anoAnterior: number;
  
  totalFaturamentoAtual: number;
  totalFaturamentoAnterior: number;
  variacaoTotalNominal: number;
  variacaoTotalPercentual: number;
  tendenciaGeral: TendenciaMoM;

  totalRepassesMeiAtual: number;
  totalRepassesMeiAnterior: number;

  totalCotaSalaoAtual: number;
  totalCotaSalaoAnterior: number;

  totalAtendimentosAtual: number;
  totalAtendimentosAnterior: number;

  ticketMedioGeralAtual: number;
  ticketMedioGeralAnterior: number;

  // Destaques e Insights
  parceiroMaiorCrescimento: ComparativoMeiMoMItem | null;
  parceiroMaiorQueda: ComparativoMeiMoMItem | null;
  parceiroMaiorVolume: ComparativoMeiMoMItem | null;
  
  itensPorParceiro: ComparativoMeiMoMItem[];
}
