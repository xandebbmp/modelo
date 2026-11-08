import { Injectable, inject } from '@angular/core';
import { FinanceStateService } from './finance-state.service';
import { RelatorioRepasseService } from './relatorio-repasse.service';
import { FechamentoMensal } from '../models/fechamento.model';
import { ResumoRepasseParceiro, VendaItemServico } from '../models/relatorio-repasse.model';

@Injectable({
  providedIn: 'root'
})
export class CsvExportService {
  private readonly financeState = inject(FinanceStateService);
  private readonly repasseService = inject(RelatorioRepasseService);

  /**
   * Exporta o histórico completo consolidado de repasses por profissional MEI.
   * Ideal para conciliação contábil, apuração do Simples Nacional e auditoria da Lei 13.352/2016.
   */
  exportarHistoricoCompletoRepassesCSV(): void {
    const fechamentos = this.financeState.fechamentos();
    const parceiros = this.financeState.parceiros();
    const empresa = this.financeState.empresaAtiva();
    const relatorio = this.repasseService.relatorioConsolidado();

    const headers = [
      'ID_FECHAMENTO',
      'COMPETENCIA',
      'EMPRESA_SALAO',
      'CNPJ_SALAO',
      'PROFISSIONAL_PARCEIRO',
      'RAZAO_SOCIAL_MEI',
      'CNPJ_MEI',
      'CPF_MEI',
      'ESPECIALIDADE',
      'TIPO_CHAVE_PIX',
      'CHAVE_PIX',
      'PRODUCAO_BRUTA_RS',
      'TAXA_CARTAO_DEDUZIDA_RS',
      'DESCONTO_INSUMOS_RS',
      'PERCENTUAL_COTA_SALAO',
      'PERCENTUAL_COTA_MEI',
      'VALOR_COTA_SALAO_BASE_SIMPLES_RS',
      'VALOR_LIQUIDO_REPASSE_MEI_RS',
      'STATUS_NFSE_MEI',
      'NUMERO_NFSE',
      'STATUS_PAGAMENTO_REPASSE',
      'DATA_PAGAMENTO_PIX',
      'PROTOCOLO_AUTENTICACAO_PIX',
      'BASE_LEGAL'
    ];

    const rows: string[][] = [];

    // Linhas de fechamento mensal do sistema
    for (const f of fechamentos) {
      const parceiro = parceiros.find(p => p.id === f.id_parceiro);
      const resumo = relatorio.parceiros_resumo.find(r => r.id_parceiro === f.id_parceiro);

      const mesFormatado = `${String(f.mes_referencia).padStart(2, '0')}/${f.ano_referencia}`;
      const statusNfse = f.status === 'PAGO' || f.status === 'NOTA_EMITIDA' 
        ? 'EMITIDA' 
        : 'PENDENTE_EMISSAO';
      
      const statusPagamento = f.status === 'PAGO' || (resumo && resumo.status_repasse === 'TRANSFERIDO_PIX')
        ? 'TRANSFERIDO_PIX'
        : (f.status === 'NOTA_EMITIDA' ? 'PRONTO_TRANSFERIR' : 'PENDENTE_CONFERENCIA');

      const dataPagamento = f.data_pagamento_efetuado || resumo?.data_transferencia || '—';
      const protocoloPix = resumo?.comprovante_autenticacao || (f.status === 'PAGO' ? `PIX-${f.id}-AUTENTICADO` : '—');

      rows.push([
        f.id,
        mesFormatado,
        empresa.razao_social,
        empresa.cnpj,
        parceiro?.nome_fantasia || parceiro?.razao_social || 'Profissional MEI',
        parceiro?.razao_social || `${parceiro?.nome_fantasia || 'MEI'} Serviços de Beleza`,
        parceiro?.cnpj || '—',
        parceiro?.cpf || '—',
        parceiro?.especialidade || 'Beleza & Estética',
        parceiro?.tipo_chave_pix || 'CNPJ',
        parceiro?.chave_pix_padrao || f.chave_pix_pagamento || '—',
        this.formatarMoedaCsv(f.valor_bruto_producao),
        this.formatarMoedaCsv(f.valor_taxas_cartao_descontadas),
        this.formatarMoedaCsv(f.valor_insumos_descontados),
        `${f.percentual_aplicado_empresa}%`,
        `${f.percentual_aplicado_parceiro}%`,
        this.formatarMoedaCsv(f.valor_cota_empresa),
        this.formatarMoedaCsv(f.valor_liquido_nota),
        statusNfse,
        f.numero_nota_mei || '—',
        statusPagamento,
        dataPagamento,
        protocoloPix,
        'Lei Federal nº 13.352/2016 (Salão-Parceiro)'
      ]);
    }

    const nomeArquivo = `historico_repasses_salao_parceiro_${new Date().toISOString().slice(0, 10)}.csv`;
    this.gerarEDownloadCsv(headers, rows, nomeArquivo);
  }

  /**
   * Exporta o histórico detalhado analítico de todas as vendas e atendimentos com deduções de maquininha.
   */
  exportarHistoricoAnaliticoVendasCSV(): void {
    const vendas = this.repasseService.vendas();

    const headers = [
      'ID_VENDA',
      'CODIGO_COMANDA',
      'DATA_HORA',
      'ID_PARCEIRO',
      'PROFISSIONAL_PARCEIRO',
      'CLIENTE',
      'CATEGORIA_SERVICO',
      'DESCRICAO_SERVICO',
      'VALOR_BRUTO_RS',
      'FORMA_PAGAMENTO',
      'OPERADORA_CARTAO',
      'TAXA_OPERADORA_PERCENTUAL',
      'VALOR_TAXA_OPERADORA_RS',
      'VALOR_DESCONTO_INSUMOS_RS',
      'PERCENTUAL_EMPRESA',
      'PERCENTUAL_PARCEIRO',
      'VALOR_COTA_SALAO_RS',
      'VALOR_LIQUIDO_PARCEIRO_RS',
      'OBSERVACOES'
    ];

    const rows: string[][] = vendas.map(v => [
      v.id,
      v.codigo_comanda,
      v.data_hora,
      v.id_parceiro,
      v.nome_parceiro,
      v.nome_cliente,
      v.categoria,
      v.servico_descricao,
      this.formatarMoedaCsv(v.valor_bruto),
      this.formatarFormaPagamento(v.forma_pagamento),
      v.operadora,
      `${v.taxa_operadora_percentual.toFixed(2)}%`,
      this.formatarMoedaCsv(v.valor_taxa_operadora),
      this.formatarMoedaCsv(v.valor_desconto_insumos),
      `${v.percentual_empresa}%`,
      `${v.percentual_parceiro}%`,
      this.formatarMoedaCsv(v.valor_cota_empresa),
      this.formatarMoedaCsv(v.valor_liquido_parceiro),
      v.observacao || ''
    ]);

    const nomeArquivo = `analitico_vendas_taxas_comandas_${new Date().toISOString().slice(0, 10)}.csv`;
    this.gerarEDownloadCsv(headers, rows, nomeArquivo);
  }

  /**
   * Exporta a conciliação completa de tributos e economia Simples Nacional.
   */
  exportarConciliacaoTributariaCsv(): void {
    const faturamentoBruto = this.financeState.totalProducaoBrutaMes();
    const repassesMei = this.financeState.totalRepassesMeiMes();
    const cotaSalao = this.financeState.totalCotaSalaoMes();
    const economiaMensal = this.financeState.economiaTributariaMensalLei13352();
    const economiaAnual = this.financeState.economiaTributariaAnualProjetada();

    const aliquotaSimplesMedia = 0.086;
    const impostoSemLei = faturamentoBruto * aliquotaSimplesMedia;
    const impostoComLei = cotaSalao * aliquotaSimplesMedia;

    const headers = [
      'INDICADOR_FISCAL',
      'VALOR_FATURAMENTO_TOTAL_RS',
      'VALOR_REPASSES_MEI_DEDUZIDOS_RS',
      'BASE_CALCULO_SALAO_SIMPLES_RS',
      'ALIQUOTA_EFETIVA_SIMPLES',
      'IMPOSTO_APURADO_LEI_SALAO_PARCEIRO_RS',
      'IMPOSTO_SEM_A_LEI_BITRIBUTACAO_RS',
      'ECONOMIA_TRIBUTARIA_MENSAL_RS',
      'ECONOMIA_ANUAL_PROJETADA_RS',
      'PERCENTUAL_ECONOMIA'
    ];

    const rows: string[][] = [[
      'Competência Atual (Agosto/2026)',
      this.formatarMoedaCsv(faturamentoBruto),
      this.formatarMoedaCsv(repassesMei),
      this.formatarMoedaCsv(cotaSalao),
      `${(aliquotaSimplesMedia * 100).toFixed(2)}%`,
      this.formatarMoedaCsv(impostoComLei),
      this.formatarMoedaCsv(impostoSemLei),
      this.formatarMoedaCsv(economiaMensal),
      this.formatarMoedaCsv(economiaAnual),
      `${((economiaMensal / (impostoSemLei || 1)) * 100).toFixed(1)}%`
    ]];

    const nomeArquivo = `planejamento_tributario_simples_${new Date().toISOString().slice(0, 10)}.csv`;
    this.gerarEDownloadCsv(headers, rows, nomeArquivo);
  }

  /**
   * Exporta a lista de parceiros com os status de conformidade da Lei 13.352/2016 e Receita Federal.
   */
  exportarListaConformidadeParceirosCSV(): void {
    const parceiros = this.financeState.parceiros();
    const empresa = this.financeState.empresaAtiva();

    const headers = [
      'ID_PARCEIRO',
      'NOME_FANTASIA',
      'RAZAO_SOCIAL_MEI',
      'CNPJ_MEI',
      'CPF_RESPONSAVEL',
      'ESPECIALIDADE',
      'STATUS_CONTRATO_LEI_13352',
      'SITUACAO_RECEITA_FEDERAL',
      'STATUS_CONFORMIDADE_GERAL',
      'COTA_SALAO_PCT',
      'COTA_MEI_PCT',
      'TIPO_CHAVE_PIX',
      'CHAVE_PIX',
      'FATURAMENTO_ANUAL_ACUMULADO_RS',
      'TETO_ANUAL_MEI_RS',
      'PERCENTUAL_TETO_CONSUMIDO_PCT',
      'STATUS_RISCO_TETO',
      'DATA_INICIO_PARCERIA',
      'EMPRESA_SALAO',
      'CNPJ_SALAO'
    ];

    const rows: string[][] = parceiros.map(p => {
      const pctTeto = ((p.faturamento_anual_acumulado / (p.teto_anual_mei || 81000)) * 100).toFixed(1);
      const riscoTeto = (p.faturamento_anual_acumulado > 81000)
        ? 'ULTRAPASSOU_TETO'
        : (p.faturamento_anual_acumulado >= 64800)
        ? 'ALERTA_80_PORCENTO'
        : 'REGULAR_SEGURO';

      const conformidadeGeral = (p.status_contrato === 'HOMOLOGADO_SINDICATO' && p.status_mei === 'ATIVO_REGULAR')
        ? '100%_CONFORME_LEI_13352'
        : (p.status_contrato === 'ASSINADO_PENDENTE_HOMOLOGACAO')
        ? 'CONFORMIDADE_PARCIAL_EM_HOMOLOGACAO'
        : 'PENDENCIA_CONTRATUAL_FISCAL';

      return [
        p.id,
        p.nome_fantasia,
        p.razao_social,
        p.cnpj,
        p.cpf,
        p.especialidade,
        p.status_contrato,
        p.status_mei,
        conformidadeGeral,
        `${p.percentual_padrao_empresa}%`,
        `${p.percentual_padrao_parceiro}%`,
        p.tipo_chave_pix,
        p.chave_pix_padrao,
        this.formatarMoedaCsv(p.faturamento_anual_acumulado),
        this.formatarMoedaCsv(p.teto_anual_mei || 81000),
        `${pctTeto}%`,
        riscoTeto,
        p.data_inicio_parceria,
        empresa.nome_fantasia,
        empresa.cnpj
      ];
    });

    const dataAtual = new Date().toISOString().split('T')[0];
    const nomeArquivo = `conformidade_parceiros_lei_13352_${dataAtual}.csv`;
    this.gerarEDownloadCsv(headers, rows, nomeArquivo);
  }

  private formatarMoedaCsv(valor: number): string {
    return (valor || 0).toFixed(2).replace('.', ',');
  }

  private formatarFormaPagamento(forma: string): string {
    const map: Record<string, string> = {
      'CARTAO_CREDITO_VISTA': 'Crédito à Vista',
      'CARTAO_CREDITO_PARCELADO': 'Crédito Parcelado',
      'CARTAO_DEBITO': 'Débito',
      'PIX_MAQUININHA': 'PIX Maquininha',
      'PIX_DIRETO': 'PIX Direto',
      'DINHEIRO': 'Dinheiro'
    };
    return map[forma] || forma;
  }

  private gerarEDownloadCsv(headers: string[], rows: string[][], nomeArquivo: string): void {
    // Usamos ';' como separador padrão internacional/brasileiro compatível com Excel
    const separador = ';';
    
    // Tratamento de escape para CSV (aspas duplas)
    const escaparCampo = (campo: string | undefined | null) => {
      const str = (campo ?? '').toString();
      if (str.includes(separador) || str.includes('"') || str.includes('\n') || str.includes('\r')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const conteudoLinhas = [
      headers.map(escaparCampo).join(separador),
      ...rows.map(r => r.map(escaparCampo).join(separador))
    ].join('\r\n');

    // Adiciona o BOM UTF-8 (\uFEFF) para garantir que caracteres acentuados funcionem perfeitamente no Excel
    const blob = new Blob(['\uFEFF' + conteudoLinhas], { type: 'text/csv;charset=utf-8;' });
    
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', nomeArquivo);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}
