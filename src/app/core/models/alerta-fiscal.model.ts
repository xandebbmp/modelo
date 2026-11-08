export type TipoAlertaFiscal = 
  | 'VENCIMENTO_PROXIMO'
  | 'VENCIDA'
  | 'PENDENTE_48H'
  | 'FECHAMENTO_PENDENTE_48H'
  | 'REJEICAO_PENDENTE';

export type SeveridadeAlerta = 'CRITICO' | 'ATENCAO' | 'INFO';

export interface AlertaFiscal {
  id: string;
  tipo: TipoAlertaFiscal;
  severidade: SeveridadeAlerta;
  titulo: string;
  descricao: string;
  tempoDecorridoOuRestante: string;
  id_nota_fiscal?: number;
  numero_documento?: string;
  id_fechamento?: number;
  id_parceiro?: number;
  nome_parceiro_ou_tomador?: string;
  valor: number;
  data_referencia: string;
  data_vencimento?: string;
  acaoTexto: string;
  acaoTipo: 'VER_NOTA' | 'REPROCESSAR' | 'COBRAR_WHATSAPP' | 'CONCILIAR_QR' | 'VER_FECHAMENTO' | 'CONSULTAR_SEFIN';
  dispensado?: boolean;
}
