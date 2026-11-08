export interface Parceiro {
  id: string;
  id_empresa: string;
  cnpj: string;
  cpf: string;
  razao_social: string;
  nome_fantasia: string;
  email: string;
  telefone: string;
  especialidade: 'Cabeleireiro(a)' | 'Barbeiro(a)' | 'Manicure/Pedicure' | 'Esteticista' | 'Maquiador(a)' | 'Depilador(a)';
  percentual_padrao_empresa: number; // Ex: 45 (%)
  percentual_padrao_parceiro: number; // Ex: 55 (%)
  status_contrato: 'HOMOLOGADO_SINDICATO' | 'ASSINADO_PENDENTE_HOMOLOGACAO' | 'MINUTA_GERADA';
  status_mei: 'ATIVO_REGULAR' | 'PENDENCIA_DASN' | 'DESENQUADRADO';
  faturamento_anual_acumulado: number;
  teto_anual_mei: number; // 81000.00
  chave_pix_padrao: string;
  tipo_chave_pix: 'CNPJ' | 'CPF' | 'EMAIL' | 'ALEATORIA';
  data_inicio_parceria: string;
  foto_avatar?: string;
}
