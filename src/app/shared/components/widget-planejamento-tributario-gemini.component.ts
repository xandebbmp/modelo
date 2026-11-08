import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { GeminiTaxAdvisorService } from '../../core/services/gemini-tax-advisor.service';
import { FinanceStateService } from '../../core/services/finance-state.service';
import { EstrategiaTributaria, CenarioSimulacaoTributaria } from '../../core/models/planejamento-tributario-ia.model';

@Component({
  selector: 'app-widget-planejamento-tributario-gemini',
  imports: [CommonModule, FormsModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="card-corporate overflow-hidden border-2 border-[#17324d]/20 dark:border-blue-900/40" id="widget-planejamento-tributario-ia">
      
      <!-- CABEÇALHO DO WIDGET COM ASSINATURA DE IA -->
      <div class="p-4 sm:p-5 bg-gradient-to-r from-[#17324d] via-[#1e3f5e] to-[#2a557c] text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div class="flex items-start gap-3">
          <div class="p-2.5 rounded-xl bg-white/10 backdrop-blur-xs border border-white/20 text-blue-200 shrink-0">
            <mat-icon class="text-2xl">psychology</mat-icon>
          </div>
          <div>
            <div class="flex items-center gap-2 flex-wrap">
              <h3 class="text-base sm:text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
                Consultoria Tributária Gemini AI
              </h3>
              <span class="px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 text-[10px] font-bold border border-emerald-400/30 flex items-center gap-1">
                <mat-icon class="text-[12px]">auto_awesome</mat-icon> Simples Nacional & Lei 13.352
              </span>
            </div>
            <p class="text-xs text-blue-100/90 mt-0.5">
              Diagnóstico em tempo real, otimização de Fator R, faixas do PGDAS-D e cálculo de Elisão Fiscal legal.
            </p>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <button
            type="button"
            (click)="atualizarDiagnostico()"
            [disabled]="taxAdvisor.carregando()"
            class="px-3 py-1.5 rounded-lg bg-white text-[#17324d] hover:bg-blue-50 text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm disabled:opacity-50">
            <mat-icon class="text-sm" [class.animate-spin]="taxAdvisor.carregando()">refresh</mat-icon>
            {{ taxAdvisor.carregando() ? 'Analisando...' : 'Reavaliar Cenário' }}
          </button>
        </div>
      </div>

      <!-- CORPO PRINCIPAL DO WIDGET -->
      <div class="p-4 sm:p-5 space-y-5">
        
        @if (taxAdvisor.carregando()) {
          <div class="py-12 flex flex-col items-center justify-center text-center space-y-3">
            <div class="w-12 h-12 rounded-full border-4 border-[#17324d]/20 border-t-[#17324d] animate-spin"></div>
            <div>
              <span class="font-bold text-sm text-app-text block">Auditoria Tributária em Processamento...</span>
              <p class="text-xs text-app-secondary mt-0.5">Avaliando cruzamento entre RBT12, Fator R e segregação das cotas MEI com Gemini 3.7 Flash.</p>
            </div>
          </div>
        } @else if (plano(); as p) {

          <!-- BANNER DE DIAGNÓSTICO E POTENCIAL DE ECONOMIA -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            
            <div class="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex flex-col justify-between">
              <div class="flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-300">
                <span class="font-bold uppercase tracking-wider text-[10px]">Economia Anual Estimada</span>
                <mat-icon class="text-base text-emerald-600">savings</mat-icon>
              </div>
              <div class="my-1.5">
                <span class="text-2xl font-black font-mono text-emerald-700 dark:text-emerald-400">
                  R$ {{ p.diagnostico.potencial_economia_anual_total | number:'1.2-2' }}
                </span>
                <span class="text-[11px] text-emerald-800/80 dark:text-emerald-300/80 block font-medium">
                  Segregação Lei 13.352 + Fator R
                </span>
              </div>
              <div class="text-[10px] text-emerald-700 dark:text-emerald-300 pt-1.5 border-t border-emerald-200 dark:border-emerald-800 flex justify-between">
                <span>Alíquota Efetiva Atual:</span>
                <strong class="font-mono">{{ p.diagnostico.aliquota_efetiva }}%</strong>
              </div>
            </div>

            <div class="p-3.5 rounded-xl bg-slate-50 dark:bg-[#12283e] border border-app flex flex-col justify-between">
              <div class="flex items-center justify-between text-xs text-app-secondary">
                <span class="font-bold uppercase tracking-wider text-[10px]">Enquadramento Simples</span>
                <mat-icon class="text-base text-[#17324d] dark:text-blue-300">analytics</mat-icon>
              </div>
              <div class="my-1.5">
                <span class="text-lg font-bold text-app-text block">
                  {{ p.diagnostico.faixa_simples_descricao }}
                </span>
                <span class="text-[11px] text-app-secondary block font-mono">
                  RBT12: R$ {{ p.diagnostico.rbt12 | number:'1.2-2' }}
                </span>
              </div>
              <div class="text-[10px] text-app-muted pt-1.5 border-t border-app flex justify-between">
                <span>Distância do Sublimite R$ 3,6M:</span>
                <strong class="font-mono text-app-text">R$ {{ p.diagnostico.distancia_sublimite_r | number:'1.0-0' }}</strong>
              </div>
            </div>

            <div class="p-3.5 rounded-xl bg-slate-50 dark:bg-[#12283e] border border-app flex flex-col justify-between">
              <div class="flex items-center justify-between text-xs text-app-secondary">
                <span class="font-bold uppercase tracking-wider text-[10px]">Termômetro do Fator R</span>
                <mat-icon class="text-base text-purple-600">speed</mat-icon>
              </div>
              <div class="my-1.5">
                <div class="flex items-baseline justify-between">
                  <span class="text-2xl font-black font-mono" [class.text-emerald-600]="p.diagnostico.fator_r_percentual >= 28" [class.text-amber-600]="p.diagnostico.fator_r_percentual < 28">
                    {{ p.diagnostico.fator_r_percentual }}%
                  </span>
                  <span class="text-xs font-bold px-2 py-0.5 rounded-full" [class.bg-emerald-100]="p.diagnostico.fator_r_percentual >= 28" [class.text-emerald-800]="p.diagnostico.fator_r_percentual >= 28" [class.bg-amber-100]="p.diagnostico.fator_r_percentual < 28" [class.text-amber-800]="p.diagnostico.fator_r_percentual < 28">
                    {{ p.diagnostico.anexo_otimo }} (6.0%)
                  </span>
                </div>
                <span class="text-[11px] text-app-secondary block">
                  {{ p.diagnostico.fator_r_percentual >= 28 ? 'Meta mínima de 28% atingida' : 'Abaixo dos 28% (Risco Anexo V)' }}
                </span>
              </div>
              <div class="text-[10px] text-app-muted pt-1.5 border-t border-app flex justify-between">
                <span>Status de Conformidade:</span>
                <strong class="text-emerald-600">{{ p.diagnostico.status_saude }}</strong>
              </div>
            </div>

          </div>

          <!-- RESUMO EXECUTIVO DA IA -->
          <div class="p-3.5 bg-blue-50/70 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/50 rounded-xl flex items-start gap-3">
            <mat-icon class="text-[#17324d] dark:text-blue-300 text-lg shrink-0 mt-0.5">info</mat-icon>
            <p class="text-xs text-app-text leading-relaxed">
              {{ p.diagnostico.resumo_executivo }}
            </p>
          </div>

          <!-- SELEÇÃO DE ESTRATÉGIAS RECOMENDADAS -->
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <h4 class="text-xs font-bold text-app-secondary uppercase tracking-wider flex items-center gap-1.5">
                <mat-icon class="text-sm text-[#17324d] dark:text-blue-300">lightbulb</mat-icon>
                Estratégias de Elisão Fiscal Recomendadas ({{ p.estrategias.length }})
              </h4>
              <span class="text-[11px] text-app-muted">Ordenadas por retorno financeiro</span>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              @for (est of p.estrategias; track est.id) {
                <div class="p-3.5 rounded-xl border border-app bg-white dark:bg-[#152e47] hover:border-[#17324d] dark:hover:border-blue-400 transition-all flex flex-col justify-between gap-3">
                  <div>
                    <div class="flex items-start justify-between gap-2">
                      <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-[#17324d] dark:text-blue-300 border border-app">
                        {{ est.categoria_rotulo }}
                      </span>
                      <span class="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        + R$ {{ est.impacto_financeiro_anual_estimado | number:'1.0-0' }}/ano
                      </span>
                    </div>

                    <h5 class="font-bold text-xs text-app-text mt-2 leading-snug">
                      {{ est.titulo }}
                    </h5>
                    <p class="text-[11px] text-app-secondary mt-1 line-clamp-2">
                      {{ est.acao_recomendada }}
                    </p>
                  </div>

                  <div class="pt-2 border-t border-app flex items-center justify-between text-[10px]">
                    <span class="font-mono text-app-muted truncate max-w-[180px]" [title]="est.fundamentacao_legal">
                      {{ est.fundamentacao_legal }}
                    </span>
                    <button 
                      type="button" 
                      (click)="abrirModalDetalheEstrategia(est)"
                      class="text-blue-600 dark:text-blue-400 font-bold hover:underline flex items-center gap-0.5">
                      Ver Ação <mat-icon class="text-[14px]">arrow_forward</mat-icon>
                    </button>
                  </div>
                </div>
              }
            </div>
          </div>

          <!-- SIMULADOR COMPARATIVO DE CENÁRIOS TRIBUTÁRIOS -->
          <div class="p-4 rounded-xl bg-slate-50 dark:bg-[#12283e] border border-app space-y-3">
            <div class="flex items-center justify-between">
              <h4 class="text-xs font-bold text-app-text flex items-center gap-1.5">
                <mat-icon class="text-sm text-emerald-600">compare_arrows</mat-icon>
                Simulador Comparativo de Cenários Tributários
              </h4>
              <span class="text-[10px] text-app-muted">Base de cálculo mensal</span>
            </div>

            <div class="overflow-x-auto">
              <table class="table-corporate text-xs">
                <thead>
                  <tr>
                    <th>Cenário Simulado</th>
                    <th>Imposto Mensal</th>
                    <th>Imposto Anual</th>
                    <th>Economia Anual</th>
                    <th>Alíq. Efetiva</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  @for (c of p.simulacoes_cenarios; track c.nome) {
                    <tr [class.bg-emerald-500/5]="c.recomendado">
                      <td class="font-bold text-app-text">
                        {{ c.nome }}
                        <span class="text-[10px] text-app-muted block font-normal">{{ c.descricao }}</span>
                      </td>
                      <td class="font-mono text-app-text">R$ {{ c.imposto_mensal | number:'1.2-2' }}</td>
                      <td class="font-mono text-app-text">R$ {{ c.imposto_anual | number:'1.2-2' }}</td>
                      <td class="font-mono font-bold" [class.text-emerald-600]="c.economia_anual > 0" [class.text-app-muted]="c.economia_anual === 0">
                        {{ c.economia_anual > 0 ? '+ R$ ' + (c.economia_anual | number:'1.2-2') : 'Cenário Base' }}
                      </td>
                      <td class="font-mono font-semibold">{{ c.aliquota_efetiva_percentual }}%</td>
                      <td>
                        @if (c.recomendado) {
                          <span class="status-badge status-badge-success text-[10px]">Recomendado</span>
                        } @else {
                          <span class="status-badge status-badge-warning text-[10px]">Desfavorável</span>
                        }
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>

        } @else {
          <div class="py-8 text-center text-app-secondary">
            <mat-icon class="text-3xl text-app-muted mb-1">psychology_alt</mat-icon>
            <p class="text-xs">Nenhuma consultoria processada ainda. Clique em "Reavaliar Cenário" para gerar o planejamento.</p>
          </div>
        }

      </div>

      <!-- MODAL DE DETALHAMENTO DA ESTRATÉGIA -->
      @if (estrategiaSelecionada(); as est) {
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fade-in" id="modal-detalhe-estrategia">
          <div class="relative w-full max-w-xl bg-surface border border-app rounded-xl shadow-2xl p-6 overflow-y-auto max-h-[90vh]">
            
            <div class="flex items-start justify-between gap-3 pb-4 mb-4 border-b border-app">
              <div>
                <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 dark:bg-blue-950 text-[#17324d] dark:text-blue-300">
                  {{ est.categoria_rotulo }}
                </span>
                <h3 class="text-base font-bold text-app-text mt-1.5">{{ est.titulo }}</h3>
                <span class="font-mono text-[11px] text-app-muted">{{ est.fundamentacao_legal }}</span>
              </div>
              <button type="button" (click)="estrategiaSelecionada.set(null)" class="text-app-muted hover:text-app-text">
                <mat-icon>close</mat-icon>
              </button>
            </div>

            <div class="space-y-4 text-xs">
              
              <!-- Impacto Financeiro -->
              <div class="grid grid-cols-2 gap-3">
                <div class="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg border border-emerald-200 dark:border-emerald-900">
                  <span class="text-[10px] text-emerald-800 dark:text-emerald-300 uppercase font-bold block">Impacto Mensal</span>
                  <span class="text-base font-black font-mono text-emerald-700 dark:text-emerald-400">
                    + R$ {{ est.impacto_financeiro_mensal_estimado | number:'1.2-2' }}
                  </span>
                </div>
                <div class="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg border border-emerald-200 dark:border-emerald-900">
                  <span class="text-[10px] text-emerald-800 dark:text-emerald-300 uppercase font-bold block">Impacto Anual</span>
                  <span class="text-base font-black font-mono text-emerald-700 dark:text-emerald-400">
                    + R$ {{ est.impacto_financeiro_anual_estimado | number:'1.2-2' }}
                  </span>
                </div>
              </div>

              <!-- Ação Recomendada -->
              <div>
                <h4 class="font-bold text-app-text mb-1">Ação Recomendada pelo Gemini AI:</h4>
                <p class="text-app-secondary leading-relaxed bg-slate-50 dark:bg-[#12283e] p-3 rounded-lg border border-app">
                  {{ est.acao_recomendada }}
                </p>
              </div>

              <!-- Passo a Passo -->
              <div>
                <h4 class="font-bold text-app-text mb-2">Roteiro Prático de Implementação:</h4>
                <ol class="space-y-2 list-decimal list-inside text-app-secondary">
                  @for (passo of est.passo_a_passo; track $index) {
                    <li class="p-2 rounded bg-slate-50 dark:bg-[#12283e] border border-app text-[11px]">
                      {{ passo }}
                    </li>
                  }
                </ol>
              </div>

              @if (est.alerta_compliance) {
                <div class="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-300 text-[11px] flex items-start gap-2">
                  <mat-icon class="text-sm mt-0.5 shrink-0">warning</mat-icon>
                  <div>
                    <strong class="block font-bold">Atenção ao Compliance:</strong>
                    {{ est.alerta_compliance }}
                  </div>
                </div>
              }

            </div>

            <div class="mt-6 flex justify-end">
              <button type="button" (click)="estrategiaSelecionada.set(null)" class="btn-primary text-xs">
                Entendido
              </button>
            </div>

          </div>
        </div>
      }

    </div>
  `
})
export class WidgetPlanejamentoTributarioGeminiComponent implements OnInit {
  readonly taxAdvisor = inject(GeminiTaxAdvisorService);
  readonly financeState = inject(FinanceStateService);
  private readonly platformId = inject(PLATFORM_ID);

  readonly plano = computed(() => this.taxAdvisor.planoTributario());
  readonly estrategiaSelecionada = signal<EstrategiaTributaria | null>(null);

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      // No navegador, os dados já iniciam carregados com o motor heurístico e o usuário pode reavaliar com a IA a qualquer momento
    }
  }

  atualizarDiagnostico() {
    this.taxAdvisor.gerarConsultoriaTributaria();
  }

  abrirModalDetalheEstrategia(est: EstrategiaTributaria) {
    this.estrategiaSelecionada.set(est);
  }
}
