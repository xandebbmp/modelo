export interface AnaliseRecorrenciaMei {
  id_parceiro: string;
  nome_parceiro: string;
  razao_social: string;
  cnpj: string;
  especialidade: string;
  faturamento_anual_acumulado: number;
  teto_anual_mei: number; // Padrão R$ 81.000,00
  meses_decorridos: number; // Ex: 8 meses (Jan a Ago)
  meses_restantes: number; // Ex: 4 meses (Set a Dez)
  media_mensal_repasse: number;
  recorrencia_frequencia: 'SEMANAL' | 'QUINZENAL' | 'MENSAL';
  projecao_anual_total: number;
  percentual_teto_atingido: number; // Ex: 85%
  excede_teto_anual: boolean;
  excede_tolerancia_20_pct: boolean; // Se > R$ 97.200,00 (desenquadramento retroativo)
  status_risco: 'SEGURO' | 'ALERTA_80_PCT' | 'RISCO_DESENQUADRAMENTO' | 'DESENQUADRADO';
  sugestao_transicao: string;
  acoes_recomendadas: string[];
  historico_ultimos_meses: { mes: string; valor: number }[];
}

export interface ResumoSaudeFiscalMei {
  total_parceiros_analisados: number;
  total_em_risco_ou_alerta: number;
  total_seguros: number;
  total_repasses_acumulados_equipe: number;
  data_ultima_analise: string;
  status_geral_equipe: 'CONFORME' | 'ATENCAO_NECESSARIA' | 'RISCO_CRITICO';
}
