export type CategoriaVencimento = 
  | 'IMPOSTO_FEDERAL' 
  | 'IMPOSTO_MUNICIPAL' 
  | 'PRAZO_ENVIO_NFSE' 
  | 'FATURA_CLIENTE' 
  | 'REPASSE_PARCEIRO_MEI' 
  | 'OBRIGACAO_ACESSORIA';

export type StatusVencimento = 
  | 'VENCIDO' 
  | 'VENCE_HOJE' 
  | 'PROXIMO' 
  | 'NO_PRAZO' 
  | 'CONCLUIDO' 
  | 'PAGO';

export interface EventoVencimentoFiscal {
  id: string;
  titulo: string;
  descricao: string;
  categoria: CategoriaVencimento;
  data_vencimento: string; // YYYY-MM-DD
  hora_limite?: string; // HH:mm
  competencia: string; // MM/AAAA
  valor?: number;
  status: StatusVencimento;
  diasParaVencer: number; // Negativo se vencido, 0 se hoje, positivo se futuro
  rotuloTempo: string;
  orgaoOuDestino: string;
  codigoGuiaOuDoc?: string;
  tipoAcao?: 'VER_NOTA' | 'PAGAR_GUIA' | 'GERAR_DAS' | 'CONVERTER_RPS' | 'REPASSAR_PIX' | 'MARCAR_CONCLUIDO' | 'BAIXAR_BOLETO';
  id_nota_fiscal?: number;
  id_fechamento?: number;
  id_parceiro?: number;
  nome_parceiro?: string;
  pagoOuTransmitido?: boolean;
  data_pagamento_ou_transmissao?: string;
}

export interface FiltroCalendarioVencimentos {
  categoria: 'TODAS' | CategoriaVencimento;
  status: 'TODOS' | 'URGENTES' | 'PENDENTES' | 'CONCLUIDOS';
  mes: number; // 1 a 12
  ano: number;
  termoBusca: string;
}
