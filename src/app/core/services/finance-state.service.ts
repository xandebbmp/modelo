import { Injectable, computed, signal } from '@angular/core';
import { Empresa, SocioEmpresa } from '../models/empresa.model';
import { Parceiro } from '../models/parceiro.model';
import { FechamentoMensal } from '../models/fechamento.model';
import { NotaFiscal } from '../models/nota-fiscal.model';

@Injectable({
  providedIn: 'root'
})
export class FinanceStateService {
  // 1. Empresa Principal
  readonly empresaAtiva = signal<Empresa>({
    id: 'emp-01',
    cnpj: '24.981.332/0001-45',
    razao_social: 'STUDIO CONCEPT BEAUTY & ESTETICA LTDA',
    nome_fantasia: 'Studio Concept Jardins',
    regime_tributario: 'SIMPLES_NACIONAL',
    anexo_simples: 'ANEXO_III',
    aliquota_efetiva_simples: 8.60, // 8.60% apurada
    fator_r_atual: 0.285, // 28.5%
    rbt12: 420000.00,
    folha_12m: 119700.00,
    pro_labore_mensal: 8500.00,
    aliquota_iss_municipal: 2.0,
    cidade: 'São Paulo',
    uf: 'SP',
    endereco: 'Rua Oscar Freire, 1280 - Jardins, São Paulo - SP',
    inscricao_municipal: '5.891.204-1',
    cnae_principal: '9602-5/01 - Cabeleireiros, manicure e pedicure',
    ambiente_emissao: 'HOMOLOGACAO',
    certificado_digital_status: 'VALIDO',
    regras_partilha_configuradas: true,
    socios: [
      {
        id: 'socio-1',
        nome: 'Renata Albuquerque Castro',
        cpf: '189.442.998-34',
        participacao_percentual: 70,
        qualificacao: 'Sócio-Administrador',
        pro_labore_mensal: 6000.00,
        email: 'renata@studioconcept.com.br',
        telefone: '(11) 98765-4321'
      },
      {
        id: 'socio-2',
        nome: 'Eduardo Guimarães Prado',
        cpf: '245.881.009-12',
        participacao_percentual: 30,
        qualificacao: 'Sócio Cotista',
        pro_labore_mensal: 2500.00,
        email: 'eduardo@studioconcept.com.br',
        telefone: '(11) 97654-3210'
      }
    ]
  });

  // 2. Profissionais Parceiros MEI Cadastrados
  readonly parceiros = signal<Parceiro[]>([
    {
      id: 'parc-01',
      id_empresa: 'emp-01',
      cnpj: '38.112.904/0001-12',
      cpf: '298.112.448-09',
      razao_social: 'JULIANA PAES BEAUTY & HAIR MEI',
      nome_fantasia: 'Juliana Paes (Master Hairstylist)',
      email: 'juliana.hair@studioconcept.com.br',
      telefone: '(11) 98823-4411',
      especialidade: 'Cabeleireiro(a)',
      percentual_padrao_empresa: 45,
      percentual_padrao_parceiro: 55,
      status_contrato: 'HOMOLOGADO_SINDICATO',
      status_mei: 'ATIVO_REGULAR',
      faturamento_anual_acumulado: 48950.00,
      teto_anual_mei: 81000.00,
      chave_pix_padrao: '38.112.904/0001-12',
      tipo_chave_pix: 'CNPJ',
      data_inicio_parceria: '2024-02-15',
      foto_avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&h=120&q=80'
    },
    {
      id: 'parc-02',
      id_empresa: 'emp-01',
      cnpj: '41.220.890/0001-33',
      cpf: '312.455.789-22',
      razao_social: 'MARCOS SILVA BARBEARIA & VISAGISMO MEI',
      nome_fantasia: 'Marcos Silva (Barbeiro Visagista)',
      email: 'marcos.barber@studioconcept.com.br',
      telefone: '(11) 97711-2299',
      especialidade: 'Barbeiro(a)',
      percentual_padrao_empresa: 40,
      percentual_padrao_parceiro: 60,
      status_contrato: 'HOMOLOGADO_SINDICATO',
      status_mei: 'ATIVO_REGULAR',
      faturamento_anual_acumulado: 34200.00,
      teto_anual_mei: 81000.00,
      chave_pix_padrao: '41.220.890/0001-33',
      tipo_chave_pix: 'CNPJ',
      data_inicio_parceria: '2024-05-10',
      foto_avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&h=120&q=80'
    },
    {
      id: 'parc-03',
      id_empresa: 'emp-01',
      cnpj: '45.890.123/0001-88',
      cpf: '401.782.901-55',
      razao_social: 'CARLA DIAS NAIL DESIGN & SPA MEI',
      nome_fantasia: 'Carla Dias (Nail Designer)',
      email: 'carla.nails@studioconcept.com.br',
      telefone: '(11) 96655-3322',
      especialidade: 'Manicure/Pedicure',
      percentual_padrao_empresa: 40,
      percentual_padrao_parceiro: 60,
      status_contrato: 'HOMOLOGADO_SINDICATO',
      status_mei: 'ATIVO_REGULAR',
      faturamento_anual_acumulado: 29800.00,
      teto_anual_mei: 81000.00,
      chave_pix_padrao: '45.890.123/0001-88',
      tipo_chave_pix: 'CNPJ',
      data_inicio_parceria: '2024-01-20',
      foto_avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=120&h=120&q=80'
    },
    {
      id: 'parc-04',
      id_empresa: 'emp-01',
      cnpj: '49.330.441/0001-05',
      cpf: '350.899.112-70',
      razao_social: 'FERNANDA LIMA DERMO & ESTETICA MEI',
      nome_fantasia: 'Fernanda Lima (Esteticista Facial)',
      email: 'fernanda.estetica@studioconcept.com.br',
      telefone: '(11) 95544-7788',
      especialidade: 'Esteticista',
      percentual_padrao_empresa: 50,
      percentual_padrao_parceiro: 50,
      status_contrato: 'ASSINADO_PENDENTE_HOMOLOGACAO',
      status_mei: 'ATIVO_REGULAR',
      faturamento_anual_acumulado: 22400.00,
      teto_anual_mei: 81000.00,
      chave_pix_padrao: 'fernanda.estetica@gmail.com',
      tipo_chave_pix: 'EMAIL',
      data_inicio_parceria: '2024-06-01',
      foto_avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=120&h=120&q=80'
    },
    {
      id: 'parc-05',
      id_empresa: 'emp-01',
      cnpj: '52.771.889/0001-66',
      cpf: '388.901.224-33',
      razao_social: 'RAFAEL MENDES COLOR & BLOND MEI',
      nome_fantasia: 'Rafael Mendes (Colorista)',
      email: 'rafael.color@studioconcept.com.br',
      telefone: '(11) 94433-1100',
      especialidade: 'Cabeleireiro(a)',
      percentual_padrao_empresa: 45,
      percentual_padrao_parceiro: 55,
      status_contrato: 'HOMOLOGADO_SINDICATO',
      status_mei: 'ATIVO_REGULAR',
      faturamento_anual_acumulado: 41200.00,
      teto_anual_mei: 81000.00,
      chave_pix_padrao: '52.771.889/0001-66',
      tipo_chave_pix: 'CNPJ',
      data_inicio_parceria: '2024-03-12',
      foto_avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&h=120&q=80'
    }
  ]);

  // 3. Fechamentos Mensais & Repasses
  readonly fechamentos = signal<FechamentoMensal[]>([
    {
      id: 'fech-2026-08-01',
      id_empresa: 'emp-01',
      id_parceiro: 'parc-01',
      ano_referencia: 2026,
      mes_referencia: 8,
      valor_bruto_producao: 16800.00,
      valor_taxas_cartao_descontadas: 420.00,
      valor_insumos_descontados: 350.00,
      percentual_aplicado_empresa: 45,
      percentual_aplicado_parceiro: 55,
      valor_cota_empresa: 7560.00,
      valor_liquido_nota: 9240.00,
      status: 'PAGO',
      id_nota_fiscal_mei: 'nfse-001',
      numero_nota_mei: '2026-0041',
      data_pagamento_efetuado: '2026-08-05 15:40',
      chave_pix_pagamento: '38.112.904/0001-12'
    },
    {
      id: 'fech-2026-08-02',
      id_empresa: 'emp-01',
      id_parceiro: 'parc-02',
      ano_referencia: 2026,
      mes_referencia: 8,
      valor_bruto_producao: 11200.00,
      valor_taxas_cartao_descontadas: 280.00,
      valor_insumos_descontados: 120.00,
      percentual_aplicado_empresa: 40,
      percentual_aplicado_parceiro: 60,
      valor_cota_empresa: 4480.00,
      valor_liquido_nota: 6720.00,
      status: 'PAGO',
      id_nota_fiscal_mei: 'nfse-002',
      numero_nota_mei: '2026-0019',
      data_pagamento_efetuado: '2026-08-05 16:10',
      chave_pix_pagamento: '41.220.890/0001-33'
    },
    {
      id: 'fech-2026-08-03',
      id_empresa: 'emp-01',
      id_parceiro: 'parc-03',
      ano_referencia: 2026,
      mes_referencia: 8,
      valor_bruto_producao: 8900.00,
      valor_taxas_cartao_descontadas: 220.00,
      valor_insumos_descontados: 180.00,
      percentual_aplicado_empresa: 40,
      percentual_aplicado_parceiro: 60,
      valor_cota_empresa: 3560.00,
      valor_liquido_nota: 5340.00,
      status: 'PAGO',
      id_nota_fiscal_mei: 'nfse-003',
      numero_nota_mei: '2026-0028',
      data_pagamento_efetuado: '2026-08-05 16:30',
      chave_pix_pagamento: '45.890.123/0001-88'
    },
    {
      id: 'fech-2026-08-04',
      id_empresa: 'emp-01',
      id_parceiro: 'parc-04',
      ano_referencia: 2026,
      mes_referencia: 8,
      valor_bruto_producao: 7400.00,
      valor_taxas_cartao_descontadas: 180.00,
      valor_insumos_descontados: 220.00,
      percentual_aplicado_empresa: 50,
      percentual_aplicado_parceiro: 50,
      valor_cota_empresa: 3700.00,
      valor_liquido_nota: 3700.00,
      status: 'NOTA_EMITIDA',
      id_nota_fiscal_mei: 'nfse-004',
      numero_nota_mei: '2026-0012',
      chave_pix_pagamento: 'fernanda.estetica@gmail.com'
    },
    {
      id: 'fech-2026-08-05',
      id_empresa: 'emp-01',
      id_parceiro: 'parc-05',
      ano_referencia: 2026,
      mes_referencia: 8,
      valor_bruto_producao: 13500.00,
      valor_taxas_cartao_descontadas: 340.00,
      valor_insumos_descontados: 410.00,
      percentual_aplicado_empresa: 45,
      percentual_aplicado_parceiro: 55,
      valor_cota_empresa: 6075.00,
      valor_liquido_nota: 7425.00,
      status: 'PENDENTE_EMISSAO',
      chave_pix_pagamento: '52.771.889/0001-66'
    }
  ]);

  // 4. Notas Fiscais Registradas (NFS-e)
  readonly notasFiscais = signal<NotaFiscal[]>([
    {
      id: 'nfse-001',
      id_empresa: 'emp-01',
      id_parceiro: 'parc-01',
      tipo_operacao: 'PARCEIRO_PARA_EMPRESA',
      numero_nfse: '2026-0041',
      serie: 'MEI',
      chave_acesso: '35260838112904000112560010000000411234567890',
      data_emissao: '2026-08-04T10:15:00',
      razao_social_prestador: 'JULIANA PAES BEAUTY & HAIR MEI',
      cnpj_prestador: '38.112.904/0001-12',
      razao_social_tomador: 'STUDIO CONCEPT BEAUTY & ESTETICA LTDA',
      cnpj_tomador: '24.981.332/0001-45',
      discriminacao_servicos: 'Prestação de serviços de cabeleireiro profissional parceiro ref. competência 08/2026 conforme Lei Federal 13.352/2016 e Contrato de Parceria homologado.',
      valor_total: 9240.00,
      valor_iss: 0,
      aliquota_iss: 0,
      status: 'AUTORIZADA',
      codigo_verificacao: 'ADN-88912-SP'
    },
    {
      id: 'nfse-002',
      id_empresa: 'emp-01',
      id_parceiro: 'parc-02',
      tipo_operacao: 'PARCEIRO_PARA_EMPRESA',
      numero_nfse: '2026-0019',
      serie: 'MEI',
      chave_acesso: '35260841220890000133560010000000191234567891',
      data_emissao: '2026-08-04T11:30:00',
      razao_social_prestador: 'MARCOS SILVA BARBEARIA & VISAGISMO MEI',
      cnpj_prestador: '41.220.890/0001-33',
      razao_social_tomador: 'STUDIO CONCEPT BEAUTY & ESTETICA LTDA',
      cnpj_tomador: '24.981.332/0001-45',
      discriminacao_servicos: 'Serviços de barbearia e visagismo executados como profissional parceiro ref. competência 08/2026 (Lei 13.352/2016).',
      valor_total: 6720.00,
      valor_iss: 0,
      aliquota_iss: 0,
      status: 'AUTORIZADA',
      codigo_verificacao: 'ADN-55412-SP'
    },
    {
      id: 'nfse-003',
      id_empresa: 'emp-01',
      id_parceiro: 'parc-03',
      tipo_operacao: 'PARCEIRO_PARA_EMPRESA',
      numero_nfse: '2026-0028',
      serie: 'MEI',
      chave_acesso: '35260845890123000188560010000000281234567892',
      data_emissao: '2026-08-04T14:20:00',
      razao_social_prestador: 'CARLA DIAS NAIL DESIGN & SPA MEI',
      cnpj_prestador: '45.890.123/0001-88',
      razao_social_tomador: 'STUDIO CONCEPT BEAUTY & ESTETICA LTDA',
      cnpj_tomador: '24.981.332/0001-45',
      discriminacao_servicos: 'Serviços de manicure, pedicure e nail design prestados em parceria ref. 08/2026 nos termos da Lei 13.352/2016.',
      valor_total: 5340.00,
      valor_iss: 0,
      aliquota_iss: 0,
      status: 'AUTORIZADA',
      codigo_verificacao: 'ADN-22190-SP'
    },
    {
      id: 'nfse-004',
      id_empresa: 'emp-01',
      id_parceiro: 'parc-04',
      tipo_operacao: 'PARCEIRO_PARA_EMPRESA',
      numero_nfse: '2026-0012',
      serie: 'MEI',
      chave_acesso: '35260849330441000105560010000000121234567893',
      data_emissao: '2026-08-05T09:00:00',
      razao_social_prestador: 'FERNANDA LIMA DERMO & ESTETICA MEI',
      cnpj_prestador: '49.330.441/0001-05',
      razao_social_tomador: 'STUDIO CONCEPT BEAUTY & ESTETICA LTDA',
      cnpj_tomador: '24.981.332/0001-45',
      discriminacao_servicos: 'Serviços de estética e dermoestética facial prestados no salão parceiro ref. 08/2026 (Lei 13.352/2016).',
      valor_total: 3700.00,
      valor_iss: 0,
      aliquota_iss: 0,
      status: 'AUTORIZADA',
      codigo_verificacao: 'ADN-77631-SP'
    },
    {
      id: 'nfse-005',
      id_empresa: 'emp-01',
      id_parceiro: 'parc-05',
      tipo_operacao: 'PARCEIRO_PARA_EMPRESA',
      numero_nfse: '2026-0055',
      serie: 'MEI',
      chave_acesso: '35260852771889000166560010000000551234567894',
      data_emissao: '2026-08-05T15:45:00',
      razao_social_prestador: 'RAFAEL MENDES COLOR & BLOND MEI',
      cnpj_prestador: '52.771.889/0001-66',
      razao_social_tomador: 'STUDIO CONCEPT BEAUTY & ESTETICA LTDA',
      cnpj_tomador: '24.981.332/0001-45',
      discriminacao_servicos: 'Serviços de coloração e corte ref. quinzena 08/2026 nos termos da Lei 13.352/2016.',
      valor_total: 7425.00,
      valor_iss: 0,
      aliquota_iss: 0,
      status: 'PENDENTE',
      lote_envio: 'LOTE-2026-08-A'
    },
    {
      id: 'nfse-006',
      id_empresa: 'emp-01',
      tipo_operacao: 'EMPRESA_PARA_CLIENTE',
      numero_nfse: '2026-0089',
      serie: 'NFS',
      chave_acesso: '35260824981332000145560010000000891234567895',
      data_emissao: '2026-08-05T16:20:00',
      razao_social_prestador: 'STUDIO CONCEPT BEAUTY & ESTETICA LTDA',
      cnpj_prestador: '24.981.332/0001-45',
      razao_social_tomador: 'BEATRIZ ALBUQUERQUE (CLIENTE FINAL)',
      cnpj_tomador: '289.412.308-99',
      discriminacao_servicos: 'Serviços de embelezamento e cuidados pessoais (cota-parte salão parceiro Lei 13.352/2016).',
      valor_total: 1250.00,
      valor_iss: 25.00,
      aliquota_iss: 2.0,
      status: 'REJEITADA',
      motivo_rejeicao: 'Inconsistência cadastral: Inscrição Municipal do tomador não informada ou código de tributação municipal inválido na Prefeitura.',
      codigo_verificacao: 'ERR-LOTE-403'
    }
  ]);

  // Controles de UI
  readonly modoSimuladorMobile = signal<boolean>(false);
  readonly parceiroMobileSimuladoId = signal<string>('parc-01');

  // Computed signals
  readonly parceirosEmpresaAtiva = computed(() => this.parceiros());
  readonly fechamentosEmpresaAtiva = computed(() => this.fechamentos());
  readonly notasEmpresaAtiva = computed(() => this.notasFiscais());

  readonly totalProducaoBrutaMes = computed(() => {
    return this.fechamentos().reduce((acc, f) => acc + f.valor_bruto_producao, 0);
  });

  readonly totalCotaSalaoMes = computed(() => {
    return this.fechamentos().reduce((acc, f) => acc + f.valor_cota_empresa, 0);
  });

  readonly totalRepassesMeiMes = computed(() => {
    return this.fechamentos().reduce((acc, f) => acc + f.valor_liquido_nota, 0);
  });

  readonly economiaTributariaMensalLei13352 = computed(() => {
    // Exemplo: Simples Nacional 8.6% sobre R$ 57.800 bruto = R$ 4.970,80
    // Com segregação sobre cota salão R$ 25.375 = R$ 2.182,25 -> Economia = R$ 2.788,55
    const aliquotaSimplesMedia = 0.086;
    const impostoSemLei = this.totalProducaoBrutaMes() * aliquotaSimplesMedia;
    const impostoComLei = this.totalCotaSalaoMes() * aliquotaSimplesMedia;
    return Math.max(0, impostoSemLei - impostoComLei);
  });

  readonly economiaTributariaAnualProjetada = computed(() => {
    return this.economiaTributariaMensalLei13352() * 12;
  });

  // Estatísticas de NFS-e
  readonly resumoNfse = computed(() => {
    const notas = this.notasFiscais();
    const processadas = notas.filter(n => n.status === 'AUTORIZADA');
    const pendentes = notas.filter(n => n.status === 'PENDENTE' || n.status === 'TRANSMITIDA');
    const comErro = notas.filter(n => n.status === 'REJEITADA');

    const valorProcessadas = processadas.reduce((acc, n) => acc + n.valor_total, 0);
    const valorPendentes = pendentes.reduce((acc, n) => acc + n.valor_total, 0);
    const valorComErro = comErro.reduce((acc, n) => acc + n.valor_total, 0);
    const valorTotalGeral = notas.reduce((acc, n) => acc + n.valor_total, 0);

    const taxaSucesso = notas.length > 0 ? (processadas.length / notas.length) * 100 : 100;

    return {
      total: notas.length,
      processadasQtd: processadas.length,
      processadasValor: valorProcessadas,
      pendentesQtd: pendentes.length,
      pendentesValor: valorPendentes,
      comErroQtd: comErro.length,
      comErroValor: valorComErro,
      valorTotalGeral,
      taxaSucesso
    };
  });

  // Métodos de Ação
  transmitirNotaPendente(idNota: string) {
    this.notasFiscais.update(notas =>
      notas.map(n => n.id === idNota ? {
        ...n,
        status: 'AUTORIZADA',
        codigo_verificacao: `ADN-${Math.floor(10000 + Math.random() * 90000)}-SP`,
        protocolo_prefeitura: `PROT-${Date.now().toString().slice(-6)}`
      } : n)
    );
  }

  transmitirTodasPendentes() {
    this.notasFiscais.update(notas =>
      notas.map(n => (n.status === 'PENDENTE' || n.status === 'TRANSMITIDA') ? {
        ...n,
        status: 'AUTORIZADA',
        codigo_verificacao: `ADN-${Math.floor(10000 + Math.random() * 90000)}-SP`,
        protocolo_prefeitura: `PROT-${Date.now().toString().slice(-6)}`
      } : n)
    );
  }

  reprocessarNotaComErro(idNota: string) {
    this.notasFiscais.update(notas =>
      notas.map(n => n.id === idNota ? {
        ...n,
        status: 'AUTORIZADA',
        motivo_rejeicao: undefined,
        codigo_verificacao: `ADN-${Math.floor(10000 + Math.random() * 90000)}-SP`,
        protocolo_prefeitura: `REPROC-${Date.now().toString().slice(-6)}`
      } : n)
    );
  }

  reprocessarTodasComErro() {
    this.notasFiscais.update(notas =>
      notas.map(n => n.status === 'REJEITADA' ? {
        ...n,
        status: 'AUTORIZADA',
        motivo_rejeicao: undefined,
        codigo_verificacao: `ADN-${Math.floor(10000 + Math.random() * 90000)}-SP`,
        protocolo_prefeitura: `REPROC-${Date.now().toString().slice(-6)}`
      } : n)
    );
  }
  emitirNotaFiscalMei1Clique(idFechamento: string) {
    const fech = this.fechamentos().find(f => f.id === idFechamento);
    if (!fech) return;

    const parc = this.parceiros().find(p => p.id === fech.id_parceiro);
    if (!parc) return;

    const emp = this.empresaAtiva();
    const novoNumero = `2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const novaChave = `352608${parc.cnpj.replace(/\D/g, '')}56001${Math.floor(100000000000 + Math.random() * 900000000000)}`;

    const novaNota: NotaFiscal = {
      id: `nfse-${Date.now()}`,
      id_empresa: emp.id,
      id_parceiro: parc.id,
      tipo_operacao: 'PARCEIRO_PARA_EMPRESA',
      numero_nfse: novoNumero,
      serie: 'MEI',
      chave_acesso: novaChave,
      data_emissao: new Date().toISOString(),
      razao_social_prestador: parc.razao_social,
      cnpj_prestador: parc.cnpj,
      razao_social_tomador: emp.razao_social,
      cnpj_tomador: emp.cnpj,
      discriminacao_servicos: `Serviços profissionais executados por parceiro MEI ref. competência ${fech.mes_referencia}/${fech.ano_referencia} conforme Lei 13.352/2016.`,
      valor_total: fech.valor_liquido_nota,
      valor_iss: 0,
      aliquota_iss: 0,
      status: 'AUTORIZADA',
      codigo_verificacao: `ADN-${Math.floor(10000 + Math.random() * 90000)}-SP`
    };

    // Atualiza fechamento
    this.fechamentos.update(lista =>
      lista.map(item => item.id === idFechamento ? {
        ...item,
        status: 'NOTA_EMITIDA',
        id_nota_fiscal_mei: novaNota.id,
        numero_nota_mei: novoNumero
      } : item)
    );

    // Insere nota fiscal
    this.notasFiscais.update(notas => [novaNota, ...notas]);
  }

  confirmarPagamentoRepassePix(idFechamento: string) {
    this.fechamentos.update(lista =>
      lista.map(item => item.id === idFechamento ? {
        ...item,
        status: 'PAGO',
        data_pagamento_efetuado: new Date().toLocaleString('pt-BR')
      } : item)
    );
  }

  adicionarParceiro(novo: Omit<Parceiro, 'id'>) {
    const id = `parc-${Date.now()}`;
    this.parceiros.update(lista => [{ ...novo, id }, ...lista]);
  }

  atualizarParceiro(id: string, dados: Partial<Parceiro>) {
    this.parceiros.update(lista =>
      lista.map(p => p.id === id ? { ...p, ...dados } : p)
    );
  }

  removerParceiro(id: string) {
    this.parceiros.update(lista => lista.filter(p => p.id !== id));
  }

  atualizarEmpresa(dados: Partial<Empresa>) {
    this.empresaAtiva.update(atual => ({
      ...atual,
      ...dados
    }));
  }

  salvarSocio(socio: SocioEmpresa) {
    this.empresaAtiva.update(atual => {
      const sociosAtuais = atual.socios ? [...atual.socios] : [];
      const idx = sociosAtuais.findIndex(s => s.id === socio.id);
      if (idx >= 0) {
        sociosAtuais[idx] = socio;
      } else {
        sociosAtuais.push(socio);
      }
      return {
        ...atual,
        socios: sociosAtuais
      };
    });
  }

  removerSocio(idSocio: string) {
    this.empresaAtiva.update(atual => ({
      ...atual,
      socios: (atual.socios || []).filter(s => s.id !== idSocio)
    }));
  }
}

