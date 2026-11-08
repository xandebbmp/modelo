export interface NotaFiscal {
  id: string;
  id_empresa: string;
  id_parceiro?: string;
  tipo_operacao: 'EMPRESA_PARA_CLIENTE' | 'PARCEIRO_PARA_EMPRESA';
  numero_nfse: string;
  serie: string;
  chave_acesso: string;
  data_emissao: string;
  razao_social_prestador: string;
  cnpj_prestador: string;
  razao_social_tomador: string;
  cnpj_tomador: string;
  discriminacao_servicos: string;
  valor_total: number;
  valor_iss: number;
  aliquota_iss: number;
  status: 'AUTORIZADA' | 'TRANSMITIDA' | 'CANCELADA' | 'REJEITADA' | 'PENDENTE';
  codigo_verificacao?: string;
  motivo_rejeicao?: string;
  lote_envio?: string;
  protocolo_prefeitura?: string;
}
