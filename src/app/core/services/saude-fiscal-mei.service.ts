import { Injectable, computed, inject } from '@angular/core';
import { FinanceStateService } from './finance-state.service';
import { AnaliseRecorrenciaMei, ResumoSaudeFiscalMei } from '../models/saude-fiscal-mei.model';

@Injectable({
  providedIn: 'root'
})
export class SaudeFiscalMeiService {
  private readonly financeState = inject(FinanceStateService);

  // Script analítico que calcula a saúde fiscal e a recorrência dos repasses de cada MEI
  readonly analisesParceiros = computed<AnaliseRecorrenciaMei[]>(() => {
    const parceiros = this.financeState.parceiros();
    const fechamentos = this.financeState.fechamentos();
    const tetoPadrao = 81000.00;
    const mesesDecorridos = 8; // Competência Agosto/2026
    const mesesRestantes = 4;

    return parceiros.map(p => {
      // 1. Filtrar fechamentos deste parceiro
      const fechamentosParceiro = fechamentos.filter(f => f.id_parceiro === p.id);
      const totalRepasseMesAtual = fechamentosParceiro.reduce((acc, f) => acc + (f.valor_liquido_nota || 0), 0);

      // 2. Histórico e faturamento acumulado no ano
      const acumuladoAteAgora = p.faturamento_anual_acumulado || (totalRepasseMesAtual * mesesDecorridos);
      
      // 3. Média mensal ponderada baseada no histórico recente
      const mediaMensal = totalRepasseMesAtual > 0 
        ? ((acumuladoAteAgora - totalRepasseMesAtual) / (mesesDecorridos - 1 || 1) * 0.4) + (totalRepasseMesAtual * 0.6)
        : (acumuladoAteAgora / mesesDecorridos);

      // 4. Projeção anual total (acumulado atual + projeção dos meses restantes com base na recorrência)
      const projecaoRestante = mediaMensal * mesesRestantes;
      const projecaoAnualTotal = acumuladoAteAgora + projecaoRestante;
      const percentualTeto = (projecaoAnualTotal / tetoPadrao) * 100;

      // 5. Verificação de limites e tolerâncias
      const excedeTeto = projecaoAnualTotal > tetoPadrao;
      const excede20Pct = projecaoAnualTotal > (tetoPadrao * 1.20); // R$ 97.200,00

      // 6. Classificação do risco fiscal
      let statusRisco: 'SEGURO' | 'ALERTA_80_PCT' | 'RISCO_DESENQUADRAMENTO' | 'DESENQUADRADO' = 'SEGURO';
      let sugestaoTransicao = 'Manter enquadramento como MEI. Volume de repasses dentro da capacidade anual.';
      const acoesRecomendadas: string[] = [];

      if (acumuladoAteAgora > tetoPadrao || excede20Pct) {
        statusRisco = 'RISCO_DESENQUADRAMENTO';
        sugestaoTransicao = 'URGENTE: Iniciar transição para Microempresa (ME) no Simples Nacional ou Sociedade Limitada Unipessoal (SLU). Risco de desenquadramento retroativo pelo Fisco.';
        acoesRecomendadas.push('Notificar o profissional formalmente sobre o atingimento do teto MEI');
        acoesRecomendadas.push('Encaminhar para contador para processo de Desenquadramento Voluntário no Portal do Simples');
        acoesRecomendadas.push('Atualizar o contrato de Salão-Parceiro para pessoa jurídica comum (ME/EPP)');
        acoesRecomendadas.push('Ajustar a retenção e alíquota de NFS-e (Anexo III - 6%)');
      } else if (excedeTeto) {
        statusRisco = 'RISCO_DESENQUADRAMENTO';
        sugestaoTransicao = 'ALTO RISCO: A recorrência dos repasses projeta ultrapassar o teto de R$ 81.000,00 até dezembro. Recomenda-se planejar a migração para ME.';
        acoesRecomendadas.push('Emitir aviso de alerta preventivo de transição MEI -> ME');
        acoesRecomendadas.push('Monitorar as notas fiscais emitidas nas próximas competências');
        acoesRecomendadas.push('Solicitar consulta com o escritório contábil parceiro');
      } else if (percentualTeto >= 80) {
        statusRisco = 'ALERTA_80_PCT';
        sugestaoTransicao = 'ATENÇÃO: Parceiro atingiu mais de 80% da capacidade anual do MEI. Acompanhar a curva de repasses nas próximas quinzenas.';
        acoesRecomendadas.push('Acompanhar o saldo remanescente disponível no teto (R$ ' + (tetoPadrao - acumuladoAteAgora).toFixed(2) + ')');
        acoesRecomendadas.push('Orientar o parceiro sobre o limite de faturamento MEI anual');
      } else {
        statusRisco = 'SEGURO';
        acoesRecomendadas.push('Conformidade regular com a Lei 13.352/2016 e Estatuto da Microempresa');
        acoesRecomendadas.push('Manter controle das NFS-e mensais de repasse');
      }

      // Histórico simulado dos últimos 6 meses para visualização gráfica
      const historicoUltimosMeses = [
        { mes: 'Mar', valor: Math.round(mediaMensal * 0.88) },
        { mes: 'Abr', valor: Math.round(mediaMensal * 0.94) },
        { mes: 'Mai', valor: Math.round(mediaMensal * 1.02) },
        { mes: 'Jun', valor: Math.round(mediaMensal * 0.98) },
        { mes: 'Jul', valor: Math.round(mediaMensal * 1.05) },
        { mes: 'Ago', valor: Math.round(totalRepasseMesAtual) }
      ];

      return {
        id_parceiro: p.id,
        nome_parceiro: p.nome_fantasia,
        razao_social: p.razao_social,
        cnpj: p.cnpj,
        especialidade: p.especialidade,
        faturamento_anual_acumulado: acumuladoAteAgora,
        teto_anual_mei: tetoPadrao,
        meses_decorridos: mesesDecorridos,
        meses_restantes: mesesRestantes,
        media_mensal_repasse: mediaMensal,
        recorrencia_frequencia: 'QUINZENAL',
        projecao_anual_total: projecaoAnualTotal,
        percentual_teto_atingido: percentualTeto,
        excede_teto_anual: excedeTeto,
        excede_tolerancia_20_pct: excede20Pct,
        status_risco: statusRisco,
        sugestao_transicao: sugestaoTransicao,
        acoes_recomendadas: acoesRecomendadas,
        historico_ultimos_meses: historicoUltimosMeses
      };
    });
  });

  // Resumo consolidado da saúde fiscal da equipe
  readonly resumoSaudeFiscal = computed<ResumoSaudeFiscalMei>(() => {
    const analises = this.analisesParceiros();
    const emRisco = analises.filter(a => a.status_risco === 'RISCO_DESENQUADRAMENTO' || a.status_risco === 'ALERTA_80_PCT').length;
    const seguros = analises.filter(a => a.status_risco === 'SEGURO').length;
    const totalRepasses = analises.reduce((acc, a) => acc + a.faturamento_anual_acumulado, 0);

    let statusGeral: 'CONFORME' | 'ATENCAO_NECESSARIA' | 'RISCO_CRITICO' = 'CONFORME';
    if (analises.some(a => a.status_risco === 'RISCO_DESENQUADRAMENTO')) {
      statusGeral = 'RISCO_CRITICO';
    } else if (emRisco > 0) {
      statusGeral = 'ATENCAO_NECESSARIA';
    }

    return {
      total_parceiros_analisados: analises.length,
      total_em_risco_ou_alerta: emRisco,
      total_seguros: seguros,
      total_repasses_acumulados_equipe: totalRepasses,
      data_ultima_analise: '30/08/2026 às 15:45 (Tempo Real)',
      status_geral_equipe: statusGeral
    };
  });

  // Gerador de modelo formal de Notificação / Orientação de Transição MEI -> ME
  gerarTextoNotificacaoTransicao(parceiro: AnaliseRecorrenciaMei): string {
    const dataAtual = new Date().toLocaleDateString('pt-BR');
    const valorExcedente = Math.max(0, parceiro.projecao_anual_total - parceiro.teto_anual_mei);

    return `COMUNICADO DE ORIENTAÇÃO FISCAL E TRANSIÇÃO MEI PARA ME
Ref.: Cumprimento da Lei Federal nº 13.352/2016 e Limites do Simples Nacional (LC 123/2006)

Data: ${dataAtual}
Ao Profissional Parceiro: ${parceiro.nome_parceiro}
Razão Social: ${parceiro.razao_social}
CNPJ: ${parceiro.cnpj}
Especialidade: ${parceiro.especialidade}

Prezado(a) Parceiro(a),

Em cumprimento às normas de governança fiscal e em consonância com o contrato de parceria firmado sob a égide da Lei Federal nº 13.352/2016 (Lei do Salão-Parceiro), informamos que nosso sistema de auditoria contínua apurou os seguintes indicadores de produção e repasses no ano-calendário de 2026:

1. Faturamento Acumulado até o momento: R$ ${parceiro.faturamento_anual_acumulado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
2. Média Mensal de Repasses Líquidos: R$ ${parceiro.media_mensal_repasse.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
3. Projeção Anual Estimada com base na recorrência: R$ ${parceiro.projecao_anual_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
4. Teto Limite Anual do MEI (Lei Complementar 123/2006): R$ ${parceiro.teto_anual_mei.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
5. Excesso Projetado sobre o Teto MEI: R$ ${valorExcedente.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (${parceiro.percentual_teto_atingido.toFixed(1)}% do teto)

DIAGNÓSTICO E RECOMENDAÇÃO TÉCNICA:
Devido ao excelente desempenho de sua produção técnica, o volume financeiro acumulado indica que o seu enquadramento na condição de Microempreendedor Individual (MEI) está prestes a ser superado.

Para evitar riscos de desenquadramento compulsório pelo Fisco (Receita Federal / SEFAZ), que acarreta cobrança retroativa de tributos e multas, RECOMENDAMOS FORTEMENTE:
a) Abertura do procedimento de transição voluntária para Microempresa (ME) no regime do Simples Nacional (Anexo III - alíquota a partir de 6%); ou
b) Alteração para Sociedade Limitada Unipessoal (SLU) com CNPJ comum;
c) Atualização do Termo Aditivo ao Contrato de Salão-Parceiro perante o sindicato da categoria.

Colocamos nossa assessoria contábil à disposição para orientá-lo(a) em todas as etapas dessa transição.

Atenciosamente,
Diretoria Administrativa & Contábil
Studio Concept & Spa Hair Ltda
CNPJ: 12.345.678/0001-90`;
  }
}
