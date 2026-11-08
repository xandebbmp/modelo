export type CategoriaEstrategiaTributaria =
  | 'SALAO_PARCEIRO'
  | 'FATOR_R'
  | 'PRO_LABORE_LUCROS'
  | 'FAIXA_SIMPLES'
  | 'CREDITOS_PIS_COFINS'
  | 'HOLDING_PATRIMONIAL';

export type StatusSaudeTributaria =
  | 'EXCELENTE'
  | 'OTIMA'
  | 'ATENCAO'
  | 'RISCO_FISCAL';

export interface DiagnosticoTributario {
  rbt12: number;
  faixa_simples_descricao: string;
  faixa_numero: number;
  aliquota_nominal: number;
  aliquota_efetiva: number;
  fator_r_percentual: number;
  anexo_otimo: 'Anexo III' | 'Anexo V' | 'Anexo IV';
  status_saude: StatusSaudeTributaria;
  resumo_executivo: string;
  distancia_proxima_faixa_r: number;
  distancia_sublimite_r: number;
  potencial_economia_anual_total: number;
}

export interface EstrategiaTributaria {
  id: string;
  titulo: string;
  categoria: CategoriaEstrategiaTributaria;
  categoria_rotulo: string;
  impacto_financeiro_mensal_estimado: number;
  impacto_financeiro_anual_estimado: number;
  dificuldade_implementacao: 'BAIXA' | 'MEDIA' | 'ALTA';
  tempo_estimado: string;
  fundamentacao_legal: string;
  diagnostico_atual: string;
  acao_recomendada: string;
  passo_a_passo: string[];
  alerta_compliance?: string;
}

export interface CenarioSimulacaoTributaria {
  nome: string;
  imposto_mensal: number;
  imposto_anual: number;
  economia_anual: number;
  aliquota_efetiva_percentual: number;
  descricao: string;
  recomendado: boolean;
}

export interface PlanejamentoTributarioIAResponse {
  sucesso: boolean;
  origem: 'GEMINI_3_7_FLASH' | 'MOTOR_HEURISTICO_TRIBUTARIO';
  tempo_processamento_ms?: number;
  data_geracao: string;
  aviso_resiliencia?: string;
  diagnostico: DiagnosticoTributario;
  estrategias: EstrategiaTributaria[];
  simulacoes_cenarios: CenarioSimulacaoTributaria[];
  alertas_criticos: string[];
  dicas_insights_ia: string[];
}

export interface RequisicaoPlanejamentoTributario {
  empresa_nome: string;
  cnpj: string;
  cidade: string;
  uf: string;
  rbt12: number;
  faturamento_mensal_atual: number;
  cota_salao_mensal: number;
  repasses_mei_mensal: number;
  folha_salarios_pro_labore_12m: number;
  fator_r_atual: number;
  quantidade_parceiros_ativos: number;
  aliquota_iss_municipal: number;
  foco_estrategico?: 'GERAL' | 'SALAO_PARCEIRO' | 'FATOR_R' | 'PRO_LABORE';
  cenario_simulacao?: {
    novo_pro_labore_mensal?: number;
    novo_faturamento_mensal?: number;
    novos_parceiros_qtd?: number;
  };
}
