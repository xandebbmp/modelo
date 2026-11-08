export interface Cliente {
  id: number;
  id_empresa: number;
  tipo_documento: 'CPF' | 'CNPJ' | 'ESTRANGEIRO';
  documento: string;
  nome_razao_social: string;
  nome_social_apelido?: string;
  email: string;
  telefone: string;
  codigo_ibge_municipio: string;
  cidade: string;
  uf: string;
  cep: string;
  logradouro: string;
  numero: string;
  bairro: string;
  total_gasto_acumulado: number;
  total_visitas: number;
  ativo: boolean;
  data_criacao: string;
}
