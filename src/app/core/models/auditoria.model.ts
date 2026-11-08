export interface AuditoriaLog {
  id: number;
  nome_esquema: string;
  nome_tabela: string;
  operacao: 'INSERT' | 'UPDATE' | 'DELETE';
  id_registro_afetado: number;
  registro_anterior?: unknown;
  registro_novo?: unknown;
  usuario_banco: string;
  data_criacao: string;
}
