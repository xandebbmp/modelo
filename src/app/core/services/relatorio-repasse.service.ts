import { Injectable, computed, inject, signal } from '@angular/core';
import { FinanceStateService } from './finance-state.service';
import {
  FormaPagamentoVenda,
  OperadoraCartao,
  RegraAbsorcaoTaxa,
  RelatorioRepasseConsolidado,
  ResumoRepasseParceiro,
  StatusRepasse,
  TaxaOperadoraConfig,
  VendaItemServico
} from '../models/relatorio-repasse.model';

@Injectable({
  providedIn: 'root'
})
export class RelatorioRepasseService {
  private readonly financeState = inject(FinanceStateService);

  // 1. Configurações de Taxas de Maquininha / Operadora
  readonly configTaxas = signal<TaxaOperadoraConfig>({
    operadora_padrao: 'Stone',
    regra_absorcao: 'PROPORCIONAL_COTA',
    taxa_debito_percentual: 1.19,
    taxa_credito_vista_percentual: 2.79,
    taxa_credito_parcelado_percentual: 4.39,
    taxa_pix_maquininha_percentual: 0.79
  });

  // 2. Filtros Ativos
  readonly filtroParceiroId = signal<string>('TODOS');
  readonly filtroFormaPagamento = signal<string>('TODAS');
  readonly filtroOperadora = signal<string>('TODAS');
  readonly filtroBuscaTermo = signal<string>('');
  readonly filtroPeriodoMes = signal<string>('2026-08');

  // 3. Status de Transferência Individual por Parceiro (Persistência em Memória/Sessão)
  readonly statusRepasses = signal<Record<string, { status: StatusRepasse; data?: string; comprovante?: string }>>({
    'parc-01': {
      status: 'TRANSFERIDO_PIX',
      data: '2026-08-25 16:30',
      comprovante: 'E24981332202608251630PIX00491'
    },
    'parc-02': {
      status: 'TRANSFERIDO_PIX',
      data: '2026-08-25 17:15',
      comprovante: 'E24981332202608251715PIX00492'
    },
    'parc-03': {
      status: 'TRANSFERIDO_PIX',
      data: '2026-08-26 10:00',
      comprovante: 'E24981332202608261000PIX00493'
    },
    'parc-04': {
      status: 'PRONTO_TRANSFERIR'
    },
    'parc-05': {
      status: 'PENDENTE_CONFERENCIA'
    }
  });

  // 4. Base de Dados de Vendas/Comandas Processadas no Período
  readonly vendas = signal<VendaItemServico[]>([
    // JULIANA PAES (parc-01) - 55% Parceiro / 45% Empresa
    {
      id: 'venda-101',
      codigo_comanda: 'CMD-8491',
      data_hora: '2026-08-25 10:30',
      id_parceiro: 'parc-01',
      nome_parceiro: 'Juliana Paes (Master Hairstylist)',
      nome_cliente: 'Ana Beatriz Souza',
      servico_descricao: 'Mechas Criativas Blond Expert + Reconstrução Kérastase',
      categoria: 'Coloração',
      valor_bruto: 950.00,
      forma_pagamento: 'CARTAO_CREDITO_PARCELADO',
      operadora: 'Stone',
      taxa_operadora_percentual: 4.39,
      valor_taxa_operadora: 41.71,
      valor_desconto_insumos: 65.00,
      percentual_empresa: 45,
      percentual_parceiro: 55,
      valor_cota_empresa: 379.48,
      valor_liquido_parceiro: 463.81,
      observacao: '3x no Cartão de Crédito. Kit Blond Premium incluso.'
    },
    {
      id: 'venda-102',
      codigo_comanda: 'CMD-8494',
      data_hora: '2026-08-25 14:00',
      id_parceiro: 'parc-01',
      nome_parceiro: 'Juliana Paes (Master Hairstylist)',
      nome_cliente: 'Camila Albuquerque',
      servico_descricao: 'Corte Visagista Feminino + Escova Modelada',
      categoria: 'Cabelo',
      valor_bruto: 320.00,
      forma_pagamento: 'CARTAO_DEBITO',
      operadora: 'Stone',
      taxa_operadora_percentual: 1.19,
      valor_taxa_operadora: 3.81,
      valor_desconto_insumos: 0.00,
      percentual_empresa: 45,
      percentual_parceiro: 55,
      valor_cota_empresa: 142.29,
      valor_liquido_parceiro: 173.90
    },
    {
      id: 'venda-103',
      codigo_comanda: 'CMD-8501',
      data_hora: '2026-08-26 11:15',
      id_parceiro: 'parc-01',
      nome_parceiro: 'Juliana Paes (Master Hairstylist)',
      nome_cliente: 'Renata Vasconcellos',
      servico_descricao: 'Tratamento Cronograma Capilar + Finalização',
      categoria: 'Tratamento',
      valor_bruto: 450.00,
      forma_pagamento: 'PIX_MAQUININHA',
      operadora: 'Stone',
      taxa_operadora_percentual: 0.79,
      valor_taxa_operadora: 3.56,
      valor_desconto_insumos: 30.00,
      percentual_empresa: 45,
      percentual_parceiro: 55,
      valor_cota_empresa: 187.40,
      valor_liquido_parceiro: 229.04
    },
    {
      id: 'venda-104',
      codigo_comanda: 'CMD-8512',
      data_hora: '2026-08-27 16:40',
      id_parceiro: 'parc-01',
      nome_parceiro: 'Juliana Paes (Master Hairstylist)',
      nome_cliente: 'Mariana Ximenes',
      servico_descricao: 'Coloração Global Raiz + Tonalização',
      categoria: 'Coloração',
      valor_bruto: 580.00,
      forma_pagamento: 'CARTAO_CREDITO_VISTA',
      operadora: 'Stone',
      taxa_operadora_percentual: 2.79,
      valor_taxa_operadora: 16.18,
      valor_desconto_insumos: 45.00,
      percentual_empresa: 45,
      percentual_parceiro: 55,
      valor_cota_empresa: 233.47,
      valor_liquido_parceiro: 285.35
    },

    // MARCOS SILVA (parc-02) - 60% Parceiro / 40% Empresa
    {
      id: 'venda-201',
      codigo_comanda: 'CMD-8492',
      data_hora: '2026-08-25 11:00',
      id_parceiro: 'parc-02',
      nome_parceiro: 'Marcos Silva (Barbeiro Visagista)',
      nome_cliente: 'Rodrigo Santoro',
      servico_descricao: 'Corte Fade Masculino + Barboterapia com Toalha Quente',
      categoria: 'Barba',
      valor_bruto: 190.00,
      forma_pagamento: 'CARTAO_DEBITO',
      operadora: 'PagBank',
      taxa_operadora_percentual: 1.19,
      valor_taxa_operadora: 2.26,
      valor_desconto_insumos: 10.00,
      percentual_empresa: 40,
      percentual_parceiro: 60,
      valor_cota_empresa: 71.10,
      valor_liquido_parceiro: 106.64
    },
    {
      id: 'venda-202',
      codigo_comanda: 'CMD-8498',
      data_hora: '2026-08-25 16:30',
      id_parceiro: 'parc-02',
      nome_parceiro: 'Marcos Silva (Barbeiro Visagista)',
      nome_cliente: 'Gustavo Lima',
      servico_descricao: 'Camuflagem de Cabelo Branco + Alinhamento Barba',
      categoria: 'Coloração',
      valor_bruto: 260.00,
      forma_pagamento: 'PIX_DIRETO',
      operadora: 'Stone',
      taxa_operadora_percentual: 0.00,
      valor_taxa_operadora: 0.00,
      valor_desconto_insumos: 20.00,
      percentual_empresa: 40,
      percentual_parceiro: 60,
      valor_cota_empresa: 96.00,
      valor_liquido_parceiro: 144.00,
      observacao: 'PIX Direto na conta do Salão (Taxa R$ 0,00)'
    },
    {
      id: 'venda-203',
      codigo_comanda: 'CMD-8507',
      data_hora: '2026-08-26 15:00',
      id_parceiro: 'parc-02',
      nome_parceiro: 'Marcos Silva (Barbeiro Visagista)',
      nome_cliente: 'Bruno Gagliasso',
      servico_descricao: 'Corte Clássico na Tesoura + Hidratação Couro Cabeludo',
      categoria: 'Cabelo',
      valor_bruto: 220.00,
      forma_pagamento: 'CARTAO_CREDITO_VISTA',
      operadora: 'Stone',
      taxa_operadora_percentual: 2.79,
      valor_taxa_operadora: 6.14,
      valor_desconto_insumos: 0.00,
      percentual_empresa: 40,
      percentual_parceiro: 60,
      valor_cota_empresa: 85.54,
      valor_liquido_parceiro: 128.32
    },

    // CARLA DIAS (parc-03) - 60% Parceiro / 40% Empresa
    {
      id: 'venda-301',
      codigo_comanda: 'CMD-8490',
      data_hora: '2026-08-25 09:30',
      id_parceiro: 'parc-03',
      nome_parceiro: 'Carla Dias (Nail Designer)',
      nome_cliente: 'Patrícia Poeta',
      servico_descricao: 'Alongamento em Gel Moldado + Esmaltação em Gel',
      categoria: 'Unhas',
      valor_bruto: 280.00,
      forma_pagamento: 'CARTAO_CREDITO_VISTA',
      operadora: 'Stone',
      taxa_operadora_percentual: 2.79,
      valor_taxa_operadora: 7.81,
      valor_desconto_insumos: 25.00,
      percentual_empresa: 40,
      percentual_parceiro: 60,
      valor_cota_empresa: 98.88,
      valor_liquido_parceiro: 148.31
    },
    {
      id: 'venda-302',
      codigo_comanda: 'CMD-8499',
      data_hora: '2026-08-25 17:00',
      id_parceiro: 'parc-03',
      nome_parceiro: 'Carla Dias (Nail Designer)',
      nome_cliente: 'Fernanda Paes Leme',
      servico_descricao: 'Spa dos Pés + Manicure Russa Combinada',
      categoria: 'Unhas',
      valor_bruto: 160.00,
      forma_pagamento: 'CARTAO_DEBITO',
      operadora: 'Stone',
      taxa_operadora_percentual: 1.19,
      valor_taxa_operadora: 1.90,
      valor_desconto_insumos: 12.00,
      percentual_empresa: 40,
      percentual_parceiro: 60,
      valor_cota_empresa: 58.44,
      valor_liquido_parceiro: 87.66
    },
    {
      id: 'venda-303',
      codigo_comanda: 'CMD-8509',
      data_hora: '2026-08-27 10:15',
      id_parceiro: 'parc-03',
      nome_parceiro: 'Carla Dias (Nail Designer)',
      nome_cliente: 'Deborah Secco',
      servico_descricao: 'Manutenção de Gel + Nail Art Decorada',
      categoria: 'Unhas',
      valor_bruto: 210.00,
      forma_pagamento: 'PIX_MAQUININHA',
      operadora: 'PagBank',
      taxa_operadora_percentual: 0.79,
      valor_taxa_operadora: 1.66,
      valor_desconto_insumos: 15.00,
      percentual_empresa: 40,
      percentual_parceiro: 60,
      valor_cota_empresa: 77.34,
      valor_liquido_parceiro: 116.00
    },

    // FERNANDA LIMA (parc-04) - 50% Parceiro / 50% Empresa
    {
      id: 'venda-401',
      codigo_comanda: 'CMD-8495',
      data_hora: '2026-08-25 14:30',
      id_parceiro: 'parc-04',
      nome_parceiro: 'Fernanda Lima (Esteticista Facial)',
      nome_cliente: 'Giovanna Antonelli',
      servico_descricao: 'Limpeza de Pele Profunda com Peeling Ultrassônico & LED',
      categoria: 'Estética',
      valor_bruto: 380.00,
      forma_pagamento: 'CARTAO_CREDITO_VISTA',
      operadora: 'Cielo',
      taxa_operadora_percentual: 2.79,
      valor_taxa_operadora: 10.60,
      valor_desconto_insumos: 35.00,
      percentual_empresa: 50,
      percentual_parceiro: 50,
      valor_cota_empresa: 167.20,
      valor_liquido_parceiro: 167.20
    },
    {
      id: 'venda-402',
      codigo_comanda: 'CMD-8503',
      data_hora: '2026-08-26 13:00',
      id_parceiro: 'parc-04',
      nome_parceiro: 'Fernanda Lima (Esteticista Facial)',
      nome_cliente: 'Juliana Silveira',
      servico_descricao: 'Drenagem Linfática Facial + Máscara de Ouro 24k',
      categoria: 'Estética',
      valor_bruto: 290.00,
      forma_pagamento: 'CARTAO_DEBITO',
      operadora: 'Stone',
      taxa_operadora_percentual: 1.19,
      valor_taxa_operadora: 3.45,
      valor_desconto_insumos: 20.00,
      percentual_empresa: 50,
      percentual_parceiro: 50,
      valor_cota_empresa: 133.28,
      valor_liquido_parceiro: 133.27
    },
    {
      id: 'venda-403',
      codigo_comanda: 'CMD-8515',
      data_hora: '2026-08-28 11:00',
      id_parceiro: 'parc-04',
      nome_parceiro: 'Fernanda Lima (Esteticista Facial)',
      nome_cliente: 'Taís Araújo',
      servico_descricao: 'Revitalização Facial com Ácido Hialurônico',
      categoria: 'Estética',
      valor_bruto: 420.00,
      forma_pagamento: 'CARTAO_CREDITO_PARCELADO',
      operadora: 'Stone',
      taxa_operadora_percentual: 4.39,
      valor_taxa_operadora: 18.44,
      valor_desconto_insumos: 40.00,
      percentual_empresa: 50,
      percentual_parceiro: 50,
      valor_cota_empresa: 180.78,
      valor_liquido_parceiro: 180.78
    },

    // RAFAEL MENDES (parc-05) - 55% Parceiro / 45% Empresa
    {
      id: 'venda-501',
      codigo_comanda: 'CMD-8493',
      data_hora: '2026-08-25 11:30',
      id_parceiro: 'parc-05',
      nome_parceiro: 'Rafael Mendes (Colorista)',
      nome_cliente: 'Isis Valverde',
      servico_descricao: 'Morena Iluminada Toffee + Matização Gloss',
      categoria: 'Coloração',
      valor_bruto: 820.00,
      forma_pagamento: 'CARTAO_CREDITO_PARCELADO',
      operadora: 'Stone',
      taxa_operadora_percentual: 4.39,
      valor_taxa_operadora: 36.00,
      valor_desconto_insumos: 55.00,
      percentual_empresa: 45,
      percentual_parceiro: 55,
      valor_cota_empresa: 328.05,
      valor_liquido_parceiro: 400.95
    },
    {
      id: 'venda-502',
      codigo_comanda: 'CMD-8505',
      data_hora: '2026-08-26 14:20',
      id_parceiro: 'parc-05',
      nome_parceiro: 'Rafael Mendes (Colorista)',
      nome_cliente: 'Grazi Massafera',
      servico_descricao: 'Tratamento Fusio-Dose Kérastase + Babyliss Ondas',
      categoria: 'Tratamento',
      valor_bruto: 390.00,
      forma_pagamento: 'CARTAO_DEBITO',
      operadora: 'Stone',
      taxa_operadora_percentual: 1.19,
      valor_taxa_operadora: 4.64,
      valor_desconto_insumos: 25.00,
      percentual_empresa: 45,
      percentual_parceiro: 55,
      valor_cota_empresa: 162.16,
      valor_liquido_parceiro: 198.20
    },
    {
      id: 'venda-503',
      codigo_comanda: 'CMD-8511',
      data_hora: '2026-08-27 15:30',
      id_parceiro: 'parc-05',
      nome_parceiro: 'Rafael Mendes (Colorista)',
      nome_cliente: 'Marina Ruy Barbosa',
      servico_descricao: 'Ruivo Vibrante Cobreado + Proteção Plex',
      categoria: 'Coloração',
      valor_bruto: 750.00,
      forma_pagamento: 'CARTAO_CREDITO_VISTA',
      operadora: 'Stone',
      taxa_operadora_percentual: 2.79,
      valor_taxa_operadora: 20.93,
      valor_desconto_insumos: 48.00,
      percentual_empresa: 45,
      percentual_parceiro: 55,
      valor_cota_empresa: 306.48,
      valor_liquido_parceiro: 374.59
    }
  ]);

  // 5. Vendas Filtradas
  readonly vendasFiltradas = computed<VendaItemServico[]>(() => {
    const termo = this.filtroBuscaTermo().toLowerCase().trim();
    const parceiroId = this.filtroParceiroId();
    const forma = this.filtroFormaPagamento();
    const op = this.filtroOperadora();

    return this.vendas().filter(v => {
      if (parceiroId !== 'TODOS' && v.id_parceiro !== parceiroId) return false;
      if (forma !== 'TODAS' && v.forma_pagamento !== forma) return false;
      if (op !== 'TODAS' && v.operadora !== op) return false;
      if (termo) {
        const matchNome = v.nome_cliente.toLowerCase().includes(termo);
        const matchServico = v.servico_descricao.toLowerCase().includes(termo);
        const matchComanda = v.codigo_comanda.toLowerCase().includes(termo);
        const matchParceiro = v.nome_parceiro.toLowerCase().includes(termo);
        if (!matchNome && !matchServico && !matchComanda && !matchParceiro) return false;
      }
      return true;
    });
  });

  // 6. Relatório Consolidado Processado em Tempo Real
  readonly relatorioConsolidado = computed<RelatorioRepasseConsolidado>(() => {
    const parceirosCadastrados = this.financeState.parceiros();
    const todasVendas = this.vendas();
    const statusMap = this.statusRepasses();
    const config = this.configTaxas();

    const parceirosResumo: ResumoRepasseParceiro[] = parceirosCadastrados.map(parc => {
      const itensDoParceiro = todasVendas.filter(v => v.id_parceiro === parc.id);
      
      const totalBruto = itensDoParceiro.reduce((acc, v) => acc + v.valor_bruto, 0);
      const totalTaxas = itensDoParceiro.reduce((acc, v) => acc + v.valor_taxa_operadora, 0);
      const totalInsumos = itensDoParceiro.reduce((acc, v) => acc + v.valor_desconto_insumos, 0);
      const valorCotaSalao = itensDoParceiro.reduce((acc, v) => acc + v.valor_cota_empresa, 0);
      const valorLiquido = itensDoParceiro.reduce((acc, v) => acc + v.valor_liquido_parceiro, 0);

      const statusInfo = statusMap[parc.id] || { status: 'PENDENTE_CONFERENCIA' };

      return {
        id_parceiro: parc.id,
        nome_parceiro: parc.nome_fantasia,
        razao_social_mei: parc.razao_social,
        cnpj_mei: parc.cnpj,
        cpf: parc.cpf,
        especialidade: parc.especialidade,
        foto_avatar: parc.foto_avatar,
        chave_pix: parc.chave_pix_padrao,
        tipo_chave_pix: parc.tipo_chave_pix,
        quantidade_atendimentos: itensDoParceiro.length,
        total_bruto_vendas: totalBruto,
        total_taxas_operadora_descontadas: totalTaxas,
        total_insumos_descontados: totalInsumos,
        percentual_contratual_empresa: parc.percentual_padrao_empresa,
        percentual_contratual_parceiro: parc.percentual_padrao_parceiro,
        valor_cota_salao_total: valorCotaSalao,
        valor_liquido_transferir: valorLiquido,
        status_repasse: statusInfo.status,
        data_transferencia: statusInfo.data,
        comprovante_autenticacao: statusInfo.comprovante,
        itens_vendas: itensDoParceiro
      };
    });

    const totalBrutoGeral = parceirosResumo.reduce((acc, p) => acc + p.total_bruto_vendas, 0);
    const totalTaxasGeral = parceirosResumo.reduce((acc, p) => acc + p.total_taxas_operadora_descontadas, 0);
    const totalInsumosGeral = parceirosResumo.reduce((acc, p) => acc + p.total_insumos_descontados, 0);
    const totalCotaSalaoGeral = parceirosResumo.reduce((acc, p) => acc + p.valor_cota_salao_total, 0);
    const totalLiquidoGeral = parceirosResumo.reduce((acc, p) => acc + p.valor_liquido_transferir, 0);

    const totalPagos = parceirosResumo
      .filter(p => p.status_repasse === 'TRANSFERIDO_PIX')
      .reduce((acc, p) => acc + p.valor_liquido_transferir, 0);

    const totalPendentes = parceirosResumo
      .filter(p => p.status_repasse !== 'TRANSFERIDO_PIX')
      .reduce((acc, p) => acc + p.valor_liquido_transferir, 0);

    return {
      periodo_referencia: 'Agosto de 2026',
      data_inicio: '2026-08-01',
      data_fim: '2026-08-31',
      quantidade_total_vendas: todasVendas.length,
      total_bruto_geral: totalBrutoGeral,
      total_taxas_operadora_geral: totalTaxasGeral,
      total_insumos_geral: totalInsumosGeral,
      total_cota_salao_geral: totalCotaSalaoGeral,
      total_liquido_repasses_geral: totalLiquidoGeral,
      total_repasses_pagos: totalPagos,
      total_repasses_pendentes: totalPendentes,
      parceiros_resumo: parceirosResumo
    };
  });

  // 7. Ações e Mutações de Estado

  // Processa a adição de uma nova comanda/venda calculando a taxa de operadora e divisão contratual
  adicionarVenda(vendaData: {
    codigo_comanda: string;
    id_parceiro: string;
    nome_cliente: string;
    servico_descricao: string;
    categoria: 'Cabelo' | 'Barba' | 'Unhas' | 'Estética' | 'Coloração' | 'Tratamento';
    valor_bruto: number;
    forma_pagamento: FormaPagamentoVenda;
    operadora?: OperadoraCartao;
    valor_desconto_insumos?: number;
    observacao?: string;
  }) {
    const parceiro = this.financeState.parceiros().find(p => p.id === vendaData.id_parceiro);
    if (!parceiro) return;

    const config = this.configTaxas();
    const operadora = vendaData.operadora || config.operadora_padrao;
    const insumos = vendaData.valor_desconto_insumos || 0;

    let taxaPerc = 0;
    if (vendaData.forma_pagamento === 'CARTAO_DEBITO') {
      taxaPerc = config.taxa_debito_percentual;
    } else if (vendaData.forma_pagamento === 'CARTAO_CREDITO_VISTA') {
      taxaPerc = config.taxa_credito_vista_percentual;
    } else if (vendaData.forma_pagamento === 'CARTAO_CREDITO_PARCELADO') {
      taxaPerc = config.taxa_credito_parcelado_percentual;
    } else if (vendaData.forma_pagamento === 'PIX_MAQUININHA') {
      taxaPerc = config.taxa_pix_maquininha_percentual;
    } else {
      taxaPerc = 0; // PIX direto ou Dinheiro
    }

    const valorTaxaOperadora = Number(((vendaData.valor_bruto * taxaPerc) / 100).toFixed(2));
    const baseLiquida = Math.max(0, vendaData.valor_bruto - valorTaxaOperadora - insumos);

    const percParceiro = parceiro.percentual_padrao_parceiro;
    const percEmpresa = parceiro.percentual_padrao_empresa;

    let valorLiquidoParceiro = 0;
    let valorCotaEmpresa = 0;

    if (config.regra_absorcao === 'PROPORCIONAL_COTA') {
      // Taxa e insumo rateados proporcionalmente
      valorLiquidoParceiro = Number(((baseLiquida * percParceiro) / 100).toFixed(2));
      valorCotaEmpresa = Number(((baseLiquida * percEmpresa) / 100).toFixed(2));
    } else if (config.regra_absorcao === 'PARCEIRO_INTEGRAL') {
      // Parceiro absorve toda a taxa de cartão e insumos
      const brutoParceiro = (vendaData.valor_bruto * percParceiro) / 100;
      valorLiquidoParceiro = Number(Math.max(0, brutoParceiro - valorTaxaOperadora - insumos).toFixed(2));
      valorCotaEmpresa = Number(((vendaData.valor_bruto * percEmpresa) / 100).toFixed(2));
    } else {
      // Salão absorve 100% da taxa
      valorLiquidoParceiro = Number((((vendaData.valor_bruto - insumos) * percParceiro) / 100).toFixed(2));
      const cotaBrutaEmpresa = ((vendaData.valor_bruto - insumos) * percEmpresa) / 100;
      valorCotaEmpresa = Number(Math.max(0, cotaBrutaEmpresa - valorTaxaOperadora).toFixed(2));
    }

    const novaVenda: VendaItemServico = {
      id: `venda-${Date.now()}`,
      codigo_comanda: vendaData.codigo_comanda || `CMD-${Math.floor(1000 + Math.random() * 9000)}`,
      data_hora: new Date().toISOString().replace('T', ' ').substring(0, 16),
      id_parceiro: parceiro.id,
      nome_parceiro: parceiro.nome_fantasia,
      nome_cliente: vendaData.nome_cliente,
      servico_descricao: vendaData.servico_descricao,
      categoria: vendaData.categoria,
      valor_bruto: vendaData.valor_bruto,
      forma_pagamento: vendaData.forma_pagamento,
      operadora: operadora,
      taxa_operadora_percentual: taxaPerc,
      valor_taxa_operadora: valorTaxaOperadora,
      valor_desconto_insumos: insumos,
      percentual_empresa: percEmpresa,
      percentual_parceiro: percParceiro,
      valor_cota_empresa: valorCotaEmpresa,
      valor_liquido_parceiro: valorLiquidoParceiro,
      observacao: vendaData.observacao
    };

    this.vendas.update(lista => [novaVenda, ...lista]);
  }

  // Atualiza as taxas padrão da maquininha e recalcula todas as vendas
  atualizarConfiguracaoTaxas(novasTaxas: Partial<TaxaOperadoraConfig>) {
    this.configTaxas.update(atual => ({ ...atual, ...novasTaxas }));
    
    // Recalcula as vendas existentes de acordo com as novas diretrizes de taxas
    const config = this.configTaxas();
    const parceirosMap = new Map(this.financeState.parceiros().map(p => [p.id, p]));

    this.vendas.update(lista =>
      lista.map(v => {
        let taxaPerc = v.taxa_operadora_percentual;
        if (v.forma_pagamento === 'CARTAO_DEBITO') taxaPerc = config.taxa_debito_percentual;
        else if (v.forma_pagamento === 'CARTAO_CREDITO_VISTA') taxaPerc = config.taxa_credito_vista_percentual;
        else if (v.forma_pagamento === 'CARTAO_CREDITO_PARCELADO') taxaPerc = config.taxa_credito_parcelado_percentual;
        else if (v.forma_pagamento === 'PIX_MAQUININHA') taxaPerc = config.taxa_pix_maquininha_percentual;
        else taxaPerc = 0;

        const valorTaxa = Number(((v.valor_bruto * taxaPerc) / 100).toFixed(2));
        const baseLiquida = Math.max(0, v.valor_bruto - valorTaxa - v.valor_desconto_insumos);
        
        let liq = 0;
        let cota = 0;
        if (config.regra_absorcao === 'PROPORCIONAL_COTA') {
          liq = Number(((baseLiquida * v.percentual_parceiro) / 100).toFixed(2));
          cota = Number(((baseLiquida * v.percentual_empresa) / 100).toFixed(2));
        } else if (config.regra_absorcao === 'PARCEIRO_INTEGRAL') {
          const brutoParc = (v.valor_bruto * v.percentual_parceiro) / 100;
          liq = Number(Math.max(0, brutoParc - valorTaxa - v.valor_desconto_insumos).toFixed(2));
          cota = Number(((v.valor_bruto * v.percentual_empresa) / 100).toFixed(2));
        } else {
          liq = Number((((v.valor_bruto - v.valor_desconto_insumos) * v.percentual_parceiro) / 100).toFixed(2));
          const cotaBruta = ((v.valor_bruto - v.valor_desconto_insumos) * v.percentual_empresa) / 100;
          cota = Number(Math.max(0, cotaBruta - valorTaxa).toFixed(2));
        }

        return {
          ...v,
          taxa_operadora_percentual: taxaPerc,
          valor_taxa_operadora: valorTaxa,
          valor_cota_empresa: cota,
          valor_liquido_parceiro: liq
        };
      })
    );
  }

  // Executa e confirma transferência PIX para o parceiro
  confirmarTransferenciaPix(idParceiro: string) {
    const authCode = `E24981332${new Date().toISOString().replace(/\D/g, '').substring(0, 12)}PIX${Math.floor(1000 + Math.random() * 9000)}`;
    const agora = new Date().toLocaleString('pt-BR');

    this.statusRepasses.update(map => ({
      ...map,
      [idParceiro]: {
        status: 'TRANSFERIDO_PIX',
        data: agora,
        comprovante: authCode
      }
    }));

    // Sincroniza também no Fechamento do Parceiro no FinanceState
    this.financeState.fechamentos.update(lista =>
      lista.map(f => f.id_parceiro === idParceiro ? {
        ...f,
        status: 'PAGO',
        data_pagamento_efetuado: agora
      } : f)
    );
  }

  // Marca como pronto para transferir
  marcarProntoTransferir(idParceiro: string) {
    this.statusRepasses.update(map => ({
      ...map,
      [idParceiro]: {
        status: 'PRONTO_TRANSFERIR'
      }
    }));
  }

  // Formatação de Meio de Pagamento
  obterRotuloFormaPagamento(forma: FormaPagamentoVenda): string {
    switch (forma) {
      case 'CARTAO_CREDITO_VISTA': return 'Crédito à Vista';
      case 'CARTAO_CREDITO_PARCELADO': return 'Crédito Parcelado';
      case 'CARTAO_DEBITO': return 'Cartão Débito';
      case 'PIX_MAQUININHA': return 'PIX Maquininha';
      case 'PIX_DIRETO': return 'PIX Direto Salão';
      case 'DINHEIRO': return 'Dinheiro / Espécie';
      default: return forma;
    }
  }

  obterIconeFormaPagamento(forma: FormaPagamentoVenda): string {
    switch (forma) {
      case 'CARTAO_CREDITO_VISTA':
      case 'CARTAO_CREDITO_PARCELADO': return 'credit_card';
      case 'CARTAO_DEBITO': return 'payment';
      case 'PIX_MAQUININHA':
      case 'PIX_DIRETO': return 'qr_code_2';
      case 'DINHEIRO': return 'payments';
      default: return 'receipt';
    }
  }
}
