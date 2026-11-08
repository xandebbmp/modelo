export interface SocioEmpresa {
  id: string;
  nome: string;
  cpf: string;
  participacao_percentual: number;
  qualificacao: string; // Ex: 'Sócio-Administrador', 'Sócio'
  pro_labore_mensal?: number;
  email?: string;
  telefone?: string;
}

export interface Empresa {
  id: string;
  cnpj: string;
  razao_social: string;
  nome_fantasia: string;
  regime_tributario: 'SIMPLES_NACIONAL' | 'LUCRO_PRESUMIDO' | 'LUCRO_REAL';
  anexo_simples: 'ANEXO_III' | 'ANEXO_IV' | 'ANEXO_V';
  aliquota_efetiva_simples?: number; // Ex: 8.6 (%)
  fator_r_atual: number;
  rbt12: number;
  folha_12m: number;
  pro_labore_mensal: number;
  aliquota_iss_municipal: number;
  cidade: string;
  uf: string;
  endereco: string;
  inscricao_municipal: string;
  cnae_principal?: string;
  ambiente_emissao: 'HOMOLOGACAO' | 'PRODUCAO';
  certificado_digital_status: 'VALIDO' | 'EXPIRADO' | 'NAO_CONFIGURADO';
  socios?: SocioEmpresa[];
  regras_partilha_configuradas?: boolean;
}

