export type TipoPerfilUsuario = 'ADMINISTRADOR' | 'PRESTADOR_MEI' | 'GERENTE_CONTABIL';

export interface PreferenciasUsuario {
  notificacoes_email_nfse: boolean;
  notificacoes_whatsapp_fechamento: boolean;
  alerta_limite_teto_mei: boolean;
  autenticacao_dois_fatores: boolean;
  formato_danfse_padrao: 'COMPLETO' | 'SIMPLIFICADO';
  backup_automatico_xml: boolean;
  tema_preferido: 'claro' | 'escuro' | 'sistema';
}

export interface UsuarioPerfil {
  id: number;
  nome_completo: string;
  nome_exibicao: string;
  email: string;
  telefone: string;
  cpf: string;
  tipo_perfil: TipoPerfilUsuario;
  cargo_funcao: string;
  registro_profissional?: string; // CBO, CRBM, ou CNPJ MEI
  cnpj_mei_vinculado?: string;
  id_empresa_padrao: number;
  id_parceiro_vinculado?: number; // Caso seja perfil PRESTADOR_MEI
  foto_avatar: string;
  status: 'ATIVO' | 'SUSPENSO' | 'PENDENTE';
  data_cadastro: string;
  ultimo_acesso: string;
  ip_ultimo_acesso: string;
  preferencias: PreferenciasUsuario;
}
