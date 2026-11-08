export interface FechamentoMensal {
  id: string;
  id_empresa: string;
  id_parceiro: string;
  ano_referencia: number;
  mes_referencia: number;
  valor_bruto_producao: number;
  valor_taxas_cartao_descontadas: number;
  valor_insumos_descontados: number;
  percentual_aplicado_empresa: number;
  percentual_aplicado_parceiro: number;
  valor_cota_empresa: number; // Base de cálculo do salão no Simples
  valor_liquido_nota: number; // Valor que o MEI deve emitir em NFS-e e receber
  status: 'DISPONIVEL_CONFERENCIA' | 'PENDENTE_EMISSAO' | 'NOTA_EMITIDA' | 'PAGO';
  id_nota_fiscal_mei?: string;
  numero_nota_mei?: string;
  data_pagamento_efetuado?: string;
  chave_pix_pagamento?: string;
}
