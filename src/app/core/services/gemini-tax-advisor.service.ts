import { Injectable, computed, inject, signal, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FinanceStateService } from './finance-state.service';
import {
  PlanejamentoTributarioIAResponse,
  RequisicaoPlanejamentoTributario
} from '../models/planejamento-tributario-ia.model';

@Injectable({
  providedIn: 'root'
})
export class GeminiTaxAdvisorService {
  private readonly http = inject(HttpClient);
  private readonly financeState = inject(FinanceStateService);
  private readonly platformId = inject(PLATFORM_ID);

  readonly carregando = signal<boolean>(false);
  readonly erro = signal<string | null>(null);

  readonly dadosRequisicaoPadrao = computed<RequisicaoPlanejamentoTributario>(() => {
    const emp = this.financeState.empresaAtiva();
    const parceiros = this.financeState.parceiros();
    const totalProducao = this.financeState.totalProducaoBrutaMes();
    const totalCota = this.financeState.totalCotaSalaoMes();
    const totalRepasses = this.financeState.totalRepassesMeiMes();

    return {
      empresa_nome: emp.razao_social,
      cnpj: emp.cnpj,
      cidade: emp.cidade,
      uf: emp.uf,
      rbt12: emp.rbt12,
      faturamento_mensal_atual: totalProducao || 45000,
      cota_salao_mensal: totalCota || 20250,
      repasses_mei_mensal: totalRepasses || 24750,
      folha_salarios_pro_labore_12m: emp.folha_12m,
      fator_r_atual: emp.fator_r_atual,
      quantidade_parceiros_ativos: parceiros.length,
      aliquota_iss_municipal: emp.aliquota_iss_municipal,
      foco_estrategico: 'GERAL'
    };
  });

  // Inicializa com cálculo heurístico instantâneo para que o SSR e CSR nunca fiquem vazios ou bloqueados
  readonly planoTributario = signal<PlanejamentoTributarioIAResponse>(
    this.calcularPlanejamentoHeuristico(this.obterSnapshotRequisicaoInicial())
  );

  readonly ultimaAtualizacao = computed(() => this.planoTributario().data_geracao);

  private obterSnapshotRequisicaoInicial(): RequisicaoPlanejamentoTributario {
    const emp = this.financeState.empresaAtiva();
    return {
      empresa_nome: emp.razao_social,
      cnpj: emp.cnpj,
      cidade: emp.cidade,
      uf: emp.uf,
      rbt12: emp.rbt12,
      faturamento_mensal_atual: 45000,
      cota_salao_mensal: 20250,
      repasses_mei_mensal: 24750,
      folha_salarios_pro_labore_12m: emp.folha_12m,
      fator_r_atual: emp.fator_r_atual,
      quantidade_parceiros_ativos: 5,
      aliquota_iss_municipal: emp.aliquota_iss_municipal,
      foco_estrategico: 'GERAL'
    };
  }

  gerarConsultoriaTributaria(customizacao?: Partial<RequisicaoPlanejamentoTributario>) {
    const payload: RequisicaoPlanejamentoTributario = {
      ...this.dadosRequisicaoPadrao(),
      ...customizacao
    };

    // Durante SSR no Node, não realizamos requisições HTTP locais que bloqueiam o render
    if (!isPlatformBrowser(this.platformId)) {
      const calculo = this.calcularPlanejamentoHeuristico(payload);
      this.planoTributario.set(calculo);
      return;
    }

    this.carregando.set(true);
    this.erro.set(null);

    this.http.post<PlanejamentoTributarioIAResponse>('/api/planejamento-tributario-ia', payload)
      .subscribe({
        next: (resposta) => {
          if (resposta && resposta.diagnostico) {
            this.planoTributario.set(resposta);
          } else {
            this.planoTributario.set(this.calcularPlanejamentoHeuristico(payload));
          }
          this.carregando.set(false);
        },
        error: () => {
          // Em caso de offline, ausência de chave ou resposta lenta, aplica o motor heurístico local sem travar a interface
          const calculoLocal = this.calcularPlanejamentoHeuristico(payload);
          this.planoTributario.set(calculoLocal);
          this.erro.set(null);
          this.carregando.set(false);
        }
      });
  }

  public calcularPlanejamentoHeuristico(dados: RequisicaoPlanejamentoTributario): PlanejamentoTributarioIAResponse {
    const rbt12 = dados.rbt12 || 420000;
    const faturamentoMensal = dados.faturamento_mensal_atual || 45000;
    const cotaSalaoMensal = dados.cota_salao_mensal || 20250;
    const repassesMeiMensal = dados.repasses_mei_mensal || 24750;
    const fatorRAtual = dados.fator_r_atual || 0.285;

    let faixaNum = 1;
    let faixaDesc = 'Faixa 1 (Até R$ 180.000,00)';
    let aliqNominal = 0.06;
    let deducao = 0;
    let limiteSuperiorFaixa = 180000;

    if (rbt12 <= 180000) {
      faixaNum = 1;
      faixaDesc = 'Faixa 1 (Até R$ 180.000,00)';
      aliqNominal = 0.06;
      deducao = 0;
      limiteSuperiorFaixa = 180000;
    } else if (rbt12 <= 360000) {
      faixaNum = 2;
      faixaDesc = 'Faixa 2 (R$ 180.000,01 a R$ 360.000,00)';
      aliqNominal = 0.112;
      deducao = 9360;
      limiteSuperiorFaixa = 360000;
    } else if (rbt12 <= 720000) {
      faixaNum = 3;
      faixaDesc = 'Faixa 3 (R$ 360.000,01 a R$ 720.000,00)';
      aliqNominal = 0.135;
      deducao = 17640;
      limiteSuperiorFaixa = 720000;
    } else if (rbt12 <= 1800000) {
      faixaNum = 4;
      faixaDesc = 'Faixa 4 (R$ 720.000,01 a R$ 1.800.000,00)';
      aliqNominal = 0.16;
      deducao = 35640;
      limiteSuperiorFaixa = 1800000;
    } else if (rbt12 <= 3600000) {
      faixaNum = 5;
      faixaDesc = 'Faixa 5 (R$ 1.800.000,01 a R$ 3.600.000,00 - Sublimite ISS)';
      aliqNominal = 0.21;
      deducao = 125640;
      limiteSuperiorFaixa = 3600000;
    } else {
      faixaNum = 6;
      faixaDesc = 'Faixa 6 (R$ 3.600.000,01 a R$ 4.800.000,00)';
      aliqNominal = 0.33;
      deducao = 648000;
      limiteSuperiorFaixa = 4800000;
    }

    const aliquotaEfetiva = Math.max(0.06, ((rbt12 * aliqNominal) - deducao) / rbt12);
    const impostoMensalSegregado = cotaSalaoMensal * aliquotaEfetiva;
    const impostoMensalSemSegregacao = faturamentoMensal * aliquotaEfetiva;
    const economiaMensalSalaoParceiro = Math.max(0, impostoMensalSemSegregacao - impostoMensalSegregado);
    const economiaAnualSalaoParceiro = economiaMensalSalaoParceiro * 12;

    const aliqAnexoVFaixa2 = 0.18;
    const impostoMensalAnexoV = cotaSalaoMensal * aliqAnexoVFaixa2;
    const economiaFatorRMensal = Math.max(0, impostoMensalAnexoV - impostoMensalSegregado);
    const economiaFatorRAnual = economiaFatorRMensal * 12;

    const distanciaProximaFaixa = Math.max(0, limiteSuperiorFaixa - rbt12);
    const distanciaSublimite = Math.max(0, 3600000 - rbt12);
    const potencialEconomiaTotal = economiaAnualSalaoParceiro + (fatorRAtual < 0.28 ? economiaFatorRAnual : 0);

    return {
      sucesso: true,
      origem: 'MOTOR_HEURISTICO_TRIBUTARIO',
      data_geracao: new Date().toISOString(),
      diagnostico: {
        rbt12: rbt12,
        faixa_simples_descricao: faixaDesc,
        faixa_numero: faixaNum,
        aliquota_nominal: Number((aliqNominal * 100).toFixed(2)),
        aliquota_efetiva: Number((aliquotaEfetiva * 100).toFixed(2)),
        fator_r_percentual: Number((fatorRAtual * 100).toFixed(2)),
        anexo_otimo: (fatorRAtual >= 0.28 ? 'Anexo III' : 'Anexo V'),
        status_saude: (fatorRAtual >= 0.28 ? 'EXCELENTE' : 'ATENCAO'),
        resumo_executivo: `A empresa está enquadrada na ${faixaDesc} com alíquota efetiva de ${(aliquotaEfetiva * 100).toFixed(2)}%. A aplicação estrita da segregação de cotas da Lei 13.352/2016 gera uma economia anual imediata de R$ ${economiaAnualSalaoParceiro.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}. O Fator R atual está em ${(fatorRAtual * 100).toFixed(1)}% (${fatorRAtual >= 0.28 ? 'em conformidade no Anexo III' : 'abaixo dos 28%, gerando risco de tributação no Anexo V'}).`,
        distancia_proxima_faixa_r: distanciaProximaFaixa,
        distancia_sublimite_r: distanciaSublimite,
        potencial_economia_anual_total: potencialEconomiaTotal
      },
      estrategias: [
        {
          id: 'est-01-salao-parceiro',
          titulo: 'Segregação Integral da Cota do Salão-Parceiro',
          categoria: 'SALAO_PARCEIRO',
          categoria_rotulo: 'Lei 13.352/2016',
          impacto_financeiro_mensal_estimado: Number(economiaMensalSalaoParceiro.toFixed(2)),
          impacto_financeiro_anual_estimado: Number(economiaAnualSalaoParceiro.toFixed(2)),
          dificuldade_implementacao: 'BAIXA',
          tempo_estimado: 'Imediato (Próximo Fechamento)',
          fundamentacao_legal: 'Lei Federal 13.352/2016, Art. 1º-A § 4º e Resolução CGSN 140/2018',
          diagnostico_atual: `Dos R$ ${faturamentoMensal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} faturados, R$ ${repassesMeiMensal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} são repasses diretos aos MEIs parceiros.`,
          acao_recomendada: 'Tributar no PGDAS-D estritamente a cota do salão (R$ ' + cotaSalaoMensal.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) + '), excluindo a receita dos profissionais parceiros.',
          passo_a_passo: [
            'Verificar se todos os profissionais possuem contratos de parceria homologados ou registrados.',
            'Exigir que os MEIs emitam NFS-e individual contra o salão no valor líquido repassado.',
            'Informar no PGDAS-D a receita segregada com dedução legal da cota-parte dos parceiros.'
          ],
          alerta_compliance: 'Parceiros sem NFS-e emitida podem levar a Receita Federal a desqualificar a dedução.'
        },
        {
          id: 'est-02-fator-r',
          titulo: 'Otimização Contínua do Fator R (Anexo III vs Anexo V)',
          categoria: 'FATOR_R',
          categoria_rotulo: 'Fator R Simples Nacional',
          impacto_financeiro_mensal_estimado: Number(economiaFatorRMensal.toFixed(2)),
          impacto_financeiro_anual_estimado: Number(economiaFatorRAnual.toFixed(2)),
          dificuldade_implementacao: 'MEDIA',
          tempo_estimado: 'Mensal',
          fundamentacao_legal: 'Lei Complementar 123/2006, Art. 18, §§ 5º-J e 5º-M',
          diagnostico_atual: `O Fator R da empresa está em ${(fatorRAtual * 100).toFixed(1)}% (limiar mínimo legal: 28.0%).`,
          acao_recomendada: fatorRAtual >= 0.28
            ? 'Manter o pró-labore e a folha de pagamento calibrados para não cair abaixo do limiar de 28% nos próximos meses.'
            : 'Ajustar o pró-labore dos sócios em R$ ' + Math.max(500, (rbt12 * 0.28 - (dados.folha_salarios_pro_labore_12m || 0)) / 12).toFixed(2) + ' ao mês para migrar do Anexo V (15.5%) para o Anexo III (6.0%).',
          passo_a_passo: [
            'Monitorar a proporção da folha + pró-labore nos últimos 12 meses antes do encerramento de cada competência.',
            'Emitir a guia do INSS dos sócios com base no pró-labore calculado para manter o Fator R >= 28%.',
            'Economizar até 9.5% de imposto sobre toda a cota do salão.'
          ]
        },
        {
          id: 'est-03-pro-labore-lucros',
          titulo: 'Equilíbrio Tributário: Pró-Labore Mínimo + Distribuição de Lucros Isenta',
          categoria: 'PRO_LABORE_LUCROS',
          categoria_rotulo: 'Eficiência de Sócios',
          impacto_financeiro_mensal_estimado: 1250.00,
          impacto_financeiro_anual_estimado: 15000.00,
          dificuldade_implementacao: 'BAIXA',
          tempo_estimado: 'Próxima Competência',
          fundamentacao_legal: 'Lei 9.249/1995, Art. 10 e Art. 14 da LC 123/2006',
          diagnostico_atual: 'Sócios recebendo rendimentos sem a segregação adequada entre remuneração pelo trabalho e distribuição de lucros contábeis.',
          acao_recomendada: 'Fixar pró-labore estritamente no valor necessário para sustentar o Fator R em 28%, distribuindo todo o excedente como Lucro Isento e Não Tributável pelo IRPF/INSS.',
          passo_a_passo: [
            'Alinhar com a contabilidade a emissão de balancetes periódicos comprovando o lucro contábil.',
            'Realizar as transferências de lucros aos sócios com a rubrica correta no extrato bancário.',
            'Declarar os valores na DIRF/e-Financeira como rendimentos isentos.'
          ]
        }
      ],
      simulacoes_cenarios: [
        {
          nome: 'Cenário 1: Atual com Salão-Parceiro e Fator R (Recomendado)',
          imposto_mensal: Number(impostoMensalSegregado.toFixed(2)),
          imposto_anual: Number((impostoMensalSegregado * 12).toFixed(2)),
          economia_anual: Number(potencialEconomiaTotal.toFixed(2)),
          aliquota_efetiva_percentual: Number((aliquotaEfetiva * 100).toFixed(2)),
          descricao: 'Cota do salão apurada no Anexo III com segregação integral dos MEIs parceiros.',
          recomendado: true
        },
        {
          nome: 'Cenário 2: Sem Segregação da Lei 13.352 (Tributando 100% da Produção)',
          imposto_mensal: Number(impostoMensalSemSegregacao.toFixed(2)),
          imposto_anual: Number((impostoMensalSemSegregacao * 12).toFixed(2)),
          economia_anual: 0,
          aliquota_efetiva_percentual: Number((aliquotaEfetiva * 100).toFixed(2)),
          descricao: 'Cenário de alto custo tributário caso a empresa tribute a comanda inteira no Simples.',
          recomendado: false
        },
        {
          nome: 'Cenário 3: Enquadramento no Anexo V (Fator R < 28%)',
          imposto_mensal: Number(impostoMensalAnexoV.toFixed(2)),
          imposto_anual: Number((impostoMensalAnexoV * 12).toFixed(2)),
          economia_anual: Number((impostoMensalSemSegregacao * 12 - impostoMensalAnexoV * 12).toFixed(2)),
          aliquota_efetiva_percentual: Number((aliqAnexoVFaixa2 * 100).toFixed(2)),
          descricao: 'Cenário desfavorável caso a folha/pró-labore caia abaixo de 28% da receita bruta.',
          recomendado: false
        }
      ],
      alertas_criticos: [
        'Contratos de parceria precisam estar formalizados por escrito com cláusulas da Lei 13.352/2016.',
        'Todos os parceiros MEI devem emitir NFS-e correspondente aos valores recebidos no mês.',
        'O pró-labore deve ser recolhido mensalmente para garantir o cálculo ininterrupto do Fator R.'
      ],
      dicas_insights_ia: [
        'A emissão 1-Clique de NFS-e MEI pelos parceiros blinda 100% da dedução tributária perante a Receita Federal.',
        'A economia gerada pela Lei Salão Parceiro ultrapassa 45% do valor total de impostos pagos anualmente.',
        'Mantenha uma reserva tributária mensal para a guia única do DAS calculada estritamente sobre a cota do salão.'
      ]
    };
  }
}
