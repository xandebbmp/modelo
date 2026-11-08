export type FormaPagamentoVenda = 
  | 'CARTAO_CREDITO_VISTA'
  | 'CARTAO_CREDITO_PARCELADO'
  | 'CARTAO_DEBITO'
  | 'PIX_MAQUININHA'
  | 'PIX_DIRETO'
  | 'DINHEIRO';

export type OperadoraCartao = 'Stone' | 'Cielo' | 'PagBank' | 'Rede' | 'InfinitePay' | 'Mercado Pago';

export type RegraAbsorcaoTaxa = 
  | 'PROPORCIONAL_COTA' // A taxa é rateada na mesma proporção contratual (ex: 55% parceiro / 45% salão)
  | 'PARCEIRO_INTEGRAL' // O parceiro absorve a taxa de cartão sobre o serviço
  | 'SALAO_INTEGRAL';   // O salão absorve 100% da taxa da maquininha

export type StatusRepasse = 'PENDENTE_CONFERENCIA' | 'PRONTO_TRANSFERIR' | 'TRANSFERIDO_PIX';

export interface VendaItemServico {
  id: string;
  codigo_comanda: string;
  data_hora: string;
  id_parceiro: string;
  nome_parceiro: string;
  id_cliente?: number;
  nome_cliente: string;
  servico_descricao: string;
  categoria: 'Cabelo' | 'Barba' | 'Unhas' | 'Estética' | 'Coloração' | 'Tratamento';
  valor_bruto: number;
  forma_pagamento: FormaPagamentoVenda;
  operadora: OperadoraCartao;
  taxa_operadora_percentual: number; // Ex: 2.8%
  valor_taxa_operadora: number;      // Calculado: valor_bruto * taxa_percentual
  valor_desconto_insumos: number;    // Ex: R$ 15.00 de produtos/tintura
  percentual_empresa: number;        // Ex: 45 (%)
  percentual_parceiro: number;       // Ex: 55 (%)
  valor_cota_empresa: number;        // Cota do Salão (Base Simples Nacional)
  valor_liquido_parceiro: number;    // Valor líquido efetivo a repassar ao MEI
  observacao?: string;
}

export interface TaxaOperadoraConfig {
  operadora_padrao: OperadoraCartao;
  regra_absorcao: RegraAbsorcaoTaxa;
  taxa_debito_percentual: number;
  taxa_credito_vista_percentual: number;
  taxa_credito_parcelado_percentual: number;
  taxa_pix_maquininha_percentual: number;
}

export interface ResumoRepasseParceiro {
  id_parceiro: string;
  nome_parceiro: string;
  razao_social_mei: string;
  cnpj_mei: string;
  cpf: string;
  especialidade: string;
  foto_avatar?: string;
  chave_pix: string;
  tipo_chave_pix: 'CNPJ' | 'CPF' | 'EMAIL' | 'ALEATORIA';
  quantidade_atendimentos: number;
  total_bruto_vendas: number;
  total_taxas_operadora_descontadas: number;
  total_insumos_descontados: number;
  percentual_contratual_empresa: number;
  percentual_contratual_parceiro: number;
  valor_cota_salao_total: number;
  valor_liquido_transferir: number;
  status_repasse: StatusRepasse;
  data_transferencia?: string;
  comprovante_autenticacao?: string;
  itens_vendas: VendaItemServico[];
}

export interface RelatorioRepasseConsolidado {
  periodo_referencia: string;
  data_inicio: string;
  data_fim: string;
  quantidade_total_vendas: number;
  total_bruto_geral: number;
  total_taxas_operadora_geral: number;
  total_insumos_geral: number;
  total_cota_salao_geral: number;
  total_liquido_repasses_geral: number;
  total_repasses_pagos: number;
  total_repasses_pendentes: number;
  parceiros_resumo: ResumoRepasseParceiro[];
}
