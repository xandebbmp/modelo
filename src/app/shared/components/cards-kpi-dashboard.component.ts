import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { FinanceStateService } from '../../core/services/finance-state.service';
import { PdfExportService } from '../../core/services/pdf-export.service';

@Component({
  selector: 'app-cards-kpi-dashboard',
  imports: [CommonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-4" id="cards-kpi-dashboard-widget">
      
      <!-- BARRA DE CONTROLE / FILTRO RÁPIDO DE VISUALIZAÇÃO E BOTÃO EXPORTAR PDF -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
        <div class="flex items-center gap-2">
          <div class="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
          <span class="text-xs font-bold text-app-text">Indicadores Estratégicos de Performance (KPIs)</span>
          <span class="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-app-secondary border border-app">
            Lei 13.352/2016
          </span>
        </div>

        <div class="flex items-center gap-2 flex-wrap self-start sm:self-auto">
          <!-- Filtro de Período -->
          <div class="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-app text-[11px]">
            <button 
              type="button" 
              (click)="periodoSelecionado.set('mes_atual')"
              [class.bg-white]="periodoSelecionado() === 'mes_atual'"
              [class.dark:bg-slate-700]="periodoSelecionado() === 'mes_atual'"
              [class.text-app-text]="periodoSelecionado() === 'mes_atual'"
              [class.shadow-xs]="periodoSelecionado() === 'mes_atual'"
              [class.text-app-muted]="periodoSelecionado() !== 'mes_atual'"
              class="px-2.5 py-1 rounded-lg font-bold transition-all">
              Mês Atual (Agosto/26)
            </button>
            
            <button 
              type="button" 
              (click)="periodoSelecionado.set('trimestre')"
              [class.bg-white]="periodoSelecionado() === 'trimestre'"
              [class.dark:bg-slate-700]="periodoSelecionado() === 'trimestre'"
              [class.text-app-text]="periodoSelecionado() === 'trimestre'"
              [class.shadow-xs]="periodoSelecionado() === 'trimestre'"
              [class.text-app-muted]="periodoSelecionado() !== 'trimestre'"
              class="px-2.5 py-1 rounded-lg font-bold transition-all">
              Trimestre Acumulado
            </button>
          </div>

          <!-- BOTÃO EXPORTAR RESUMO FISCAL (PDF A4) -->
          <button 
            type="button" 
            (click)="exportarPdf()"
            [disabled]="gerandoPdf()"
            class="px-3 py-1.5 rounded-xl text-xs font-bold bg-[#17324d] hover:bg-[#204467] text-white border border-[#17324d] flex items-center gap-1.5 transition-all shadow-xs cursor-pointer disabled:opacity-60"
            id="btn-exportar-resumo-fiscal-kpi"
            title="Gerar Relatório Fiscal Consolidado A4 (jsPDF)">
            @if (gerandoPdf()) {
              <mat-icon class="text-sm animate-spin">sync</mat-icon>
              <span>Gerando PDF A4...</span>
            } @else {
              <mat-icon class="text-sm text-amber-300">picture_as_pdf</mat-icon>
              <span>Exportar Resumo Fiscal</span>
            }
          </button>
        </div>
      </div>

      <!-- GRID DE CARDS MODERNOS COM INDICADORES CHAVE -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        
        <!-- CARD 1: FATURAMENTO BRUTO TOTAL -->
        <div class="card-corporate p-4 sm:p-5 relative overflow-hidden flex flex-col justify-between group hover:border-blue-400 dark:hover:border-blue-700 transition-all shadow-xs">
          <!-- Brilho sutil de fundo -->
          <div class="absolute -right-6 -bottom-6 w-24 h-24 bg-blue-500/5 rounded-full blur-xl pointer-events-none"></div>

          <div>
            <div class="flex items-center justify-between text-xs mb-2">
              <span class="font-bold uppercase tracking-wider text-[10px] text-app-secondary">
                Faturamento Bruto
              </span>
              <div class="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-[#17324d] dark:text-blue-300 border border-blue-100 dark:border-blue-900/50">
                <mat-icon class="text-base">point_of_sale</mat-icon>
              </div>
            </div>

            <div class="space-y-1">
              <div class="flex items-baseline gap-2">
                <span class="text-2xl sm:text-3xl font-black font-mono text-app-text tracking-tight">
                  R$ {{ kpis().faturamentoBruto | number:'1.2-2' }}
                </span>
              </div>
              
              <div class="flex items-center gap-1.5 text-[11px]">
                <span class="inline-flex items-center text-emerald-600 dark:text-emerald-400 font-bold">
                  <mat-icon class="text-xs">trending_up</mat-icon> +{{ kpis().variacaoFaturamento }}%
                </span>
                <span class="text-app-muted">vs mês anterior</span>
              </div>
            </div>
          </div>

          <!-- MINI GRÁFICO SPARKLINE EM SVG -->
          <div class="pt-4 mt-3 border-t border-app">
            <div class="flex items-center justify-between text-[11px] mb-1.5">
              <span class="text-app-secondary">Comandas Fechadas</span>
              <span class="font-bold text-app-text font-mono">{{ kpis().totalComandas }} atendimentos</span>
            </div>
            
            <div class="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div class="bg-blue-600 h-full rounded-full" style="width: 88%"></div>
            </div>

            <div class="flex justify-between items-center text-[10px] text-app-muted mt-1.5">
              <span>Ticket Médio: <strong class="text-app-text font-mono">R$ {{ kpis().ticketMedio | number:'1.2-2' }}</strong></span>
              <span class="text-blue-600 dark:text-blue-400 font-semibold">{{ financeState.parceiros().length }} Parceiros</span>
            </div>
          </div>
        </div>

        <!-- CARD 2: TOTAL DE REPASSES AOS MEIS (LEI 13.352/2016) -->
        <div class="card-corporate p-4 sm:p-5 relative overflow-hidden flex flex-col justify-between group hover:border-emerald-400 dark:hover:border-emerald-700 transition-all shadow-xs">
          <div class="absolute -right-6 -bottom-6 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl pointer-events-none"></div>

          <div>
            <div class="flex items-center justify-between text-xs mb-2">
              <span class="font-bold uppercase tracking-wider text-[10px] text-app-secondary">
                Total de Repasses MEI
              </span>
              <div class="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-900/50">
                <mat-icon class="text-base">payments</mat-icon>
              </div>
            </div>

            <div class="space-y-1">
              <div class="flex items-baseline gap-2">
                <span class="text-2xl sm:text-3xl font-black font-mono text-emerald-600 dark:text-emerald-400 tracking-tight">
                  R$ {{ kpis().repassesMei | number:'1.2-2' }}
                </span>
              </div>
              
              <div class="flex items-center gap-1.5 text-[11px]">
                <span class="inline-flex items-center text-emerald-600 font-bold">
                  {{ kpis().percentualRepasseMedio }}% do Faturamento
                </span>
                <span class="text-app-muted">cota dos parceiros</span>
              </div>
            </div>
          </div>

          <!-- BARRA DE REPASSE E STATUS DE NFS-E -->
          <div class="pt-4 mt-3 border-t border-app">
            <div class="flex items-center justify-between text-[11px] mb-1.5">
              <span class="text-app-secondary">Quitação via PIX / NFS-e</span>
              <span class="font-bold text-emerald-600 dark:text-emerald-400 font-mono">{{ kpis().repassesQuitadosPercent }}% Liquidado</span>
            </div>
            
            <div class="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden flex">
              <div class="bg-emerald-500 h-full rounded-l-full" [style.width.%]="kpis().repassesQuitadosPercent"></div>
              <div class="bg-amber-400 h-full rounded-r-full" [style.width.%]="100 - kpis().repassesQuitadosPercent"></div>
            </div>

            <div class="flex justify-between items-center text-[10px] text-app-muted mt-1.5">
              <span>Art. 1º-A Lei 13.352</span>
              <span class="text-emerald-700 dark:text-emerald-300 font-bold">100% Isento Salão</span>
            </div>
          </div>
        </div>

        <!-- CARD 3: MARGEM LÍQUIDA ESTIMADA DO SALÃO -->
        <div class="card-corporate p-4 sm:p-5 relative overflow-hidden flex flex-col justify-between group hover:border-indigo-400 dark:hover:border-indigo-700 transition-all shadow-xs">
          <div class="absolute -right-6 -bottom-6 w-24 h-24 bg-indigo-500/5 rounded-full blur-xl pointer-events-none"></div>

          <div>
            <div class="flex items-center justify-between text-xs mb-2">
              <span class="font-bold uppercase tracking-wider text-[10px] text-app-secondary">
                Margem Líquida Estimada
              </span>
              <div class="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900/50">
                <mat-icon class="text-base">account_balance_wallet</mat-icon>
              </div>
            </div>

            <div class="space-y-1">
              <div class="flex items-baseline gap-2">
                <span class="text-2xl sm:text-3xl font-black font-mono text-indigo-600 dark:text-indigo-400 tracking-tight">
                  R$ {{ kpis().margemLiquidaValor | number:'1.2-2' }}
                </span>
              </div>
              
              <div class="flex items-center gap-1.5 text-[11px]">
                <span class="inline-flex items-center px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900/60 text-indigo-800 dark:text-indigo-200 font-bold text-[10px]">
                  {{ kpis().margemLiquidaPercent }}% Líquido
                </span>
                <span class="text-app-muted">após taxas & Simples</span>
              </div>
            </div>
          </div>

          <!-- DETALHAMENTO DA MARGEM -->
          <div class="pt-4 mt-3 border-t border-app">
            <div class="flex items-center justify-between text-[11px] mb-1.5">
              <span class="text-app-secondary">Cota Bruta Retida</span>
              <span class="font-bold text-app-text font-mono">R$ {{ kpis().cotaSalaoBruta | number:'1.2-2' }}</span>
            </div>
            
            <div class="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div class="bg-indigo-600 h-full rounded-full" [style.width.%]="kpis().margemLiquidaPercent"></div>
            </div>

            <div class="flex justify-between items-center text-[10px] text-app-muted mt-1.5">
              <span>Simples: R$ {{ kpis().impostoSimplesEstimado | number:'1.0-0' }}</span>
              <span>Cartões: R$ {{ kpis().taxasAdquirenteEstimadas | number:'1.0-0' }}</span>
            </div>
          </div>
        </div>

        <!-- CARD 4: ECONOMIA TRIBUTÁRIA LEI SALÃO-PARCEIRO -->
        <div class="card-corporate p-4 sm:p-5 relative overflow-hidden flex flex-col justify-between group hover:border-purple-400 dark:hover:border-purple-700 transition-all shadow-xs sm:col-span-2 lg:col-span-3 xl:col-span-1">
          <div class="absolute -right-6 -bottom-6 w-24 h-24 bg-purple-500/5 rounded-full blur-xl pointer-events-none"></div>

          <div>
            <div class="flex items-center justify-between text-xs mb-2">
              <span class="font-bold uppercase tracking-wider text-[10px] text-app-secondary">
                Economia Tributária Mensal
              </span>
              <div class="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-100 dark:border-purple-900/50">
                <mat-icon class="text-base">verified</mat-icon>
              </div>
            </div>

            <div class="space-y-1">
              <div class="flex items-baseline gap-2">
                <span class="text-2xl sm:text-3xl font-black font-mono text-purple-600 dark:text-purple-400 tracking-tight">
                  R$ {{ kpis().economiaTributariaMes | number:'1.2-2' }}
                </span>
              </div>
              
              <div class="flex items-center gap-1.5 text-[11px]">
                <span class="text-app-muted">Projeção Anual:</span>
                <span class="font-mono font-bold text-purple-700 dark:text-purple-300">
                  R$ {{ kpis().economiaTributariaAno | number:'1.0-0' }}/ano
                </span>
              </div>
            </div>
          </div>

          <!-- STATUS DE COMPLIANCE -->
          <div class="pt-4 mt-3 border-t border-app">
            <div class="flex items-center justify-between text-[11px] mb-1.5">
              <span class="text-app-secondary">Blindagem Fiscal PGDAS-D</span>
              <span class="font-bold text-purple-600 dark:text-purple-400">100% Conforme</span>
            </div>
            
            <div class="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div class="bg-purple-600 h-full rounded-full" style="width: 100%"></div>
            </div>

            <div class="flex justify-between items-center text-[10px] text-app-muted mt-1.5">
              <span>Sem Bi-Tributação</span>
              <span class="text-emerald-600 font-bold">Nenhum Passivo</span>
            </div>
          </div>
        </div>

      </div>

      <!-- QUADRO INFORMATIVO DE DEMONSTRAÇÃO DO CÁLCULO DE MARGEM -->
      <div class="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-app flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
        <div class="flex items-center gap-2.5">
          <div class="p-1.5 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
            <mat-icon class="text-sm">analytics</mat-icon>
          </div>
          <div>
            <span class="font-bold text-app-text block">Entenda a Composição da Margem Líquida</span>
            <span class="text-[11px] text-app-secondary">
              Faturamento Bruto (R$ {{ kpis().faturamentoBruto | number:'1.2-2' }}) = Repasses MEIs ({{ kpis().percentualRepasseMedio }}%) + Cota Salão ({{ 100 - kpis().percentualRepasseMedio }}%) → Simples Nacional é recolhido exclusivamente sobre a Cota do Salão.
            </span>
          </div>
        </div>

        <div class="flex items-center gap-3 self-end md:self-auto shrink-0 font-mono text-[11px]">
          <div class="text-right">
            <span class="text-[10px] text-app-muted block">Base PGDAS-D Salão:</span>
            <strong class="text-[#b66a3c]">R$ {{ kpis().cotaSalaoBruta | number:'1.2-2' }}</strong>
          </div>
          <div class="h-6 w-px bg-slate-300 dark:bg-slate-700"></div>
          <div class="text-right">
            <span class="text-[10px] text-app-muted block">Repasse MEI Dedução:</span>
            <strong class="text-emerald-600">R$ {{ kpis().repassesMei | number:'1.2-2' }}</strong>
          </div>
        </div>
      </div>

    </div>
  `
})
export class CardsKpiDashboardComponent {
  readonly financeState = inject(FinanceStateService);
  readonly pdfExportService = inject(PdfExportService);
  readonly periodoSelecionado = signal<'mes_atual' | 'trimestre'>('mes_atual');
  readonly gerandoPdf = signal<boolean>(false);

  exportarPdf(): void {
    this.gerandoPdf.set(true);
    setTimeout(() => {
      try {
        const competencia = this.periodoSelecionado() === 'trimestre' ? '3º Trimestre/2026' : 'Agosto/2026';
        this.pdfExportService.exportarResumoFiscalA4(competencia);
      } catch (err) {
        console.error('Erro ao gerar relatório fiscal PDF:', err);
      } finally {
        this.gerandoPdf.set(false);
      }
    }, 200);
  }

  readonly kpis = computed(() => {
    const isTrimestre = this.periodoSelecionado() === 'trimestre';
    const multiplicador = isTrimestre ? 3 : 1;

    const faturamentoBrutoBase = this.financeState.totalProducaoBrutaMes();
    const cotaSalaoBrutaBase = this.financeState.totalCotaSalaoMes();
    const repassesMeiBase = this.financeState.totalRepassesMeiMes();

    const faturamentoBruto = faturamentoBrutoBase * multiplicador;
    const cotaSalaoBruta = cotaSalaoBrutaBase * multiplicador;
    const repassesMei = repassesMeiBase * multiplicador;

    // Alíquota média do Simples Nacional sobre a cota do salão (8.6%)
    const impostoSimplesEstimado = cotaSalaoBruta * 0.086;
    
    // Taxas estimadas de adquirentes e cartão (2.8% do faturamento bruto)
    const taxasAdquirenteEstimadas = faturamentoBruto * 0.028;

    // Margem Líquida Efetiva do Salão = Cota Bruta - Impostos do Salão - Taxas de Meios de Pagamento
    const margemLiquidaValor = Math.max(0, cotaSalaoBruta - impostoSimplesEstimado - taxasAdquirenteEstimadas);
    
    const margemLiquidaPercent = faturamentoBruto > 0 
      ? Number(((margemLiquidaValor / faturamentoBruto) * 100).toFixed(1)) 
      : 0;

    const percentualRepasseMedio = faturamentoBruto > 0 
      ? Number(((repassesMei / faturamentoBruto) * 100).toFixed(1)) 
      : 55.0;

    const totalComandas = isTrimestre ? 742 : 248;
    const ticketMedio = totalComandas > 0 ? faturamentoBruto / totalComandas : 233.00;

    const economiaTributariaMes = this.financeState.economiaTributariaMensalLei13352() * multiplicador;
    const economiaTributariaAno = this.financeState.economiaTributariaAnualProjetada();

    // Fechamentos pagos
    const fechamentos = this.financeState.fechamentos();
    const fechamentosPagos = fechamentos.filter(f => f.status === 'PAGO' || f.status === 'NOTA_EMITIDA').length;
    const repassesQuitadosPercent = fechamentos.length > 0 
      ? Math.round((fechamentosPagos / fechamentos.length) * 100) 
      : 80;

    return {
      faturamentoBruto,
      cotaSalaoBruta,
      repassesMei,
      margemLiquidaValor,
      margemLiquidaPercent,
      percentualRepasseMedio,
      impostoSimplesEstimado,
      taxasAdquirenteEstimadas,
      totalComandas,
      ticketMedio,
      variacaoFaturamento: 12.8,
      economiaTributariaMes,
      economiaTributariaAno,
      repassesQuitadosPercent
    };
  });
}
