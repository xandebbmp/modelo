export type StatusPermissaoPush = 'default' | 'granted' | 'denied' | 'unsupported';

export type CategoriaNotificacaoPush = 
  | 'IMPOSTO_FEDERAL' 
  | 'IMPOSTO_MUNICIPAL' 
  | 'OBRIGACAO_ACESSORIA' 
  | 'DAS_MEI_PARCEIROS' 
  | 'NFSE_PENDENTE_48H' 
  | 'FATURA_CLIENTE'
  | 'TETO_MEI_PREVENTIVO'
  | 'FECHAMENTO_RATEIO'
  | 'PERSONALIZADO'
  | 'SISTEMA_GERAL';

export interface LembreteFiscalPersonalizado {
  id: string;
  titulo: string;
  descricao?: string;
  categoria: CategoriaNotificacaoPush;
  diaDoMes?: number; // 1 a 31
  dataEspecifica?: string; // YYYY-MM-DD
  diasAntecedencia: number[]; // ex: [5, 2, 0]
  recorrencia: 'MENSAL' | 'QUINZENAL' | 'ANUAL' | 'UNICA';
  ativo: boolean;
  valorEstimado?: number;
  destinatarioOuOrgao?: string;
  criadoEm?: string;
}

export interface PreferenciasNotificacaoPush {
  ativo: boolean;
  canalWebPush: boolean;
  canalInApp: boolean;
  notificarDasSimples: boolean;
  notificarIssMunicipal: boolean;
  notificarEfdReinf: boolean;
  notificarDasMeiParceiros: boolean;
  notificarNfsePendentes48h: boolean;
  notificarFaturasClientes: boolean;
  notificarTetoMei80Porcento: boolean;
  notificarFechamentosRateio: boolean;
  diasAntecedencia: number[]; // ex: [10, 5, 3, 1, 0]
  alertarVencidosDiariamente: boolean;
  horarioChecagem: string; // "08:30"
  tocarSom: boolean;
  somTipo: 'CHIME_CORPORATIVO' | 'SUTIL' | 'SUAVE' | 'ALERTA_CRITICO';
  lembretesPersonalizados: LembreteFiscalPersonalizado[];
  ultimoEnvioDiario?: string; // YYYY-MM-DD
}

export interface RegistroNotificacaoPush {
  id: string;
  idEventoOrigem?: string;
  titulo: string;
  mensagem: string;
  categoria: CategoriaNotificacaoPush;
  severidade: 'INFO' | 'ATENCAO' | 'CRITICO' | 'URGENTE';
  timestamp: string; // ISO String
  dataVencimento?: string; // YYYY-MM-DD
  valor?: number;
  orgao?: string;
  lida: boolean;
  aberta: boolean;
  canal: 'WEB_PUSH' | 'SERVICE_WORKER' | 'IN_APP';
  acaoUrl?: string;
  acaoTexto?: string;
  tag?: string;
}

export interface NotificacaoAgendadaPreview {
  id: string;
  titulo: string;
  categoria: CategoriaNotificacaoPush;
  dataPrevisaoEnvio: string;
  dataVencimentoImposto: string;
  diasRestantes: number;
  valor?: number;
  motivoGatilho: string;
  severidade?: 'INFO' | 'ATENCAO' | 'CRITICO' | 'URGENTE';
  personalizado?: boolean;
}
