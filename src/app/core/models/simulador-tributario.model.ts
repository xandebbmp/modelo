export interface FaixaSimplesNacional {
  faixa: number;
  limiteInferior: number;
  limiteSuperior: number;
  aliquotaNominal: number; // Em decimal, ex: 0.06 para 6%
  parcelaDeduzir: number;
}

export interface DecomposicaoTributaria {
  iss: number;
  cpp: number;
  irpj: number;
  csll: number;
  cofins: number;
  pis: number;
}

export interface ResultadoSimulacaoTributaria {
  // Entradas
  faturamentoBrutoMensal: number;
  percentualRepasseMei: number;
  valorRepasseMei: number;
  cotaRetidaSalao: number; // Base de cálculo do DAS no Simples Nacional
  rbt12: number;
  
  // Simples Nacional - COM Segregação (Lei 13.352/2016)
  faixaSimples: number;
  aliquotaNominal: number;
  parcelaDeduzir: number;
  aliquotaEfetiva: number;
  valorDasMensal: number;
  valorDasAnual: number;
  decomposicaoDas: DecomposicaoTributaria;

  // Simples Nacional - SEM Segregação (Risco / Bitributação sobre 100%)
  faixaSemSegregacao: number;
  aliquotaEfetivaSemSegregacao: number;
  valorDasSemSegregacaoMensal: number;
  valorDasSemSegregacaoAnual: number;

  // Lucro Presumido (Base comparativa ~16.33% sobre serviços com presunção)
  aliquotaLucroPresumido: number;
  valorLucroPresumidoMensal: number;
  valorLucroPresumidoAnual: number;

  // Economias Tributárias
  economiaMensalVsSemSegregacao: number;
  economiaAnualVsSemSegregacao: number;
  economiaMensalVsLucroPresumido: number;
  economiaAnualVsLucroPresumido: number;
  percentualEconomia: number;

  // Carga Tributária Efetiva sobre o Faturamento Total
  cargaEfetivaRealSobreTotal: number;
}

export const TABELA_ANEXO_III_SIMPLES: FaixaSimplesNacional[] = [
  { faixa: 1, limiteInferior: 0, limiteSuperior: 180000, aliquotaNominal: 0.06, parcelaDeduzir: 0 },
  { faixa: 2, limiteInferior: 180000.01, limiteSuperior: 360000, aliquotaNominal: 0.112, parcelaDeduzir: 9360 },
  { faixa: 3, limiteInferior: 360000.01, limiteSuperior: 720000, aliquotaNominal: 0.135, parcelaDeduzir: 17640 },
  { faixa: 4, limiteInferior: 720000.01, limiteSuperior: 1800000, aliquotaNominal: 0.16, parcelaDeduzir: 35640 },
  { faixa: 5, limiteInferior: 1800000.01, limiteSuperior: 3600000, aliquotaNominal: 0.21, parcelaDeduzir: 125640 },
  { faixa: 6, limiteInferior: 3600000.01, limiteSuperior: 4800000, aliquotaNominal: 0.33, parcelaDeduzir: 648000 }
];

export const PERCENTUAIS_REPARTICAO_ANEXO_III = {
  iss: 0.3350,
  cpp: 0.4340,
  irpj: 0.0400,
  csll: 0.0350,
  cofins: 0.1282,
  pis: 0.0278
};
