export type TipoDocumentoFiscalDigitalizado = 
  | 'NFSE' 
  | 'NFE' 
  | 'CUPOM_FISCAL_SAT' 
  | 'RECIBO_MEI' 
  | 'COMPROVANTE_DESPESA' 
  | 'OUTRO';

export type CategoriaDespesaSugerida = 
  | 'INSUMO_SALAO' 
  | 'SERVICO_PARCEIRO_MEI' 
  | 'EQUIPAMENTO_ESTETICA' 
  | 'MANUTENCAO_PREDIAL' 
  | 'MARKETING_PUBLICIDADE' 
  | 'SOFTWARE_SISTEMA' 
  | 'UTILIDADES_ENERGIA_AGUA' 
  | 'OUTROS';

export type StatusEtapaDigitalizacao = 
  | 'CAPTURA' 
  | 'PREPROCESSAMENTO' 
  | 'ANALISE_IA' 
  | 'REVISAO' 
  | 'CONCLUIDO' 
  | 'ERRO';

export interface ConfiguracaoPreprocessamento {
  brilho: number;          // -100 a +100 (padrão: 10)
  contraste: number;       // -100 a +100 (padrão: 25)
  nitidez: number;         // 0 a 10 (padrão: 3)
  escalaCinza: boolean;    // padrão: true
  binarizacao: boolean;    // padrão: false
  limiarBinarizacao: number; // 0 a 255 (padrão: 128)
  rotacao: number;         // 0, 90, 180, 270 graus
  inverterCores: boolean;  // padrão: false
  filtroReducaoRuido: boolean; // padrão: true
}

export interface ItemDocumentoExtraido {
  item_numero?: number;
  descricao: string;
  quantidade: number;
  unidade?: string;
  valor_unitario: number;
  valor_total: number;
  codigo_servico_ou_ncm?: string;
}

export interface DadosEmitenteExtraidos {
  razao_social: string;
  nome_fantasia?: string;
  cnpj_cpf: string;
  inscricao_municipal?: string;
  inscricao_estadual?: string;
  endereco?: string;
  cidade?: string;
  uf?: string;
  telefone?: string;
  email?: string;
}

export interface DadosTomadorExtraidos {
  razao_social: string;
  cnpj_cpf: string;
  endereco?: string;
  cidade?: string;
  uf?: string;
  email?: string;
}

export interface ValoresImpostosExtraidos {
  valor_bruto: number;
  valor_desconto: number;
  valor_liquido: number;
  base_calculo_iss: number;
  aliquota_iss: number;
  valor_iss: number;
  iss_retido: boolean;
  
  // Retenções federais / previdenciárias
  inss: number;
  irrf: number;
  pis: number;
  cofins: number;
  csll: number;
  outras_retencoes: number;
}

export interface DadosExtraidosDocumento {
  tipo_documento: TipoDocumentoFiscalDigitalizado;
  numero_documento: string;
  serie?: string;
  data_emissao: string; // Formato YYYY-MM-DD
  data_vencimento?: string; // Formato YYYY-MM-DD
  chave_acesso?: string; // 44 dígitos se NFe/NFCe
  codigo_verificacao?: string; // Para NFS-e
  numero_rps_dps?: string;
  
  emitente: DadosEmitenteExtraidos;
  tomador: DadosTomadorExtraidos;
  
  itens: ItemDocumentoExtraido[];
  valores: ValoresImpostosExtraidos;
  
  discriminacao_servicos: string;
  categoria_sugerida: CategoriaDespesaSugerida;
  observacoes_fiscais?: string;
  
  // Metadados de IA e Conformidade
  confianca_geral_percentual: number; // 0 a 100
  tempo_processamento_ms?: number;
  modelo_ia_utilizado?: string;
  alertas_inconsistencias: string[];
  enquadramento_lei_salao_parceiro?: boolean;
  mensagem_conformidade?: string;
}

export interface RegistroDigitalizacaoNota {
  id: string;
  timestamp: string;
  imagemOriginalBase64: string;
  imagemProcessadaBase64: string;
  nomeArquivoOrigem?: string;
  origemCaptura: 'CAMERA_DISPOSITIVO' | 'UPLOAD_ARQUIVO' | 'AMOSTRA_DEMO';
  configuracaoAplicada: ConfiguracaoPreprocessamento;
  dadosExtraidos?: DadosExtraidosDocumento;
  salvoNoSistema: boolean;
  idNotaFiscalGerada?: number;
}
