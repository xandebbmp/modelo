import { 
  ChangeDetectionStrategy, 
  Component, 
  ElementRef, 
  OnInit, 
  OnDestroy, 
  afterNextRender, 
  computed, 
  effect, 
  inject, 
  signal, 
  viewChild 
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { FinanceStateService } from '../../core/services/finance-state.service';
import * as d3 from 'd3';

export interface DadoEvolucaoMensal {
  mesNum: number;
  ano: number;
  mesLabel: string;
  faturamentoBruto: number;
  repassesRealizados: number;
  cotaSalaoRetida: number;
  percentualRepasse: number;
  qtdAtendimentos: number;
  status: 'HISTORICO' | 'ATUAL' | 'PROJETADO';
}

@Component({
  selector: 'app-grafico-faturamento-repasses',
  imports: [CommonModule, FormsModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="card-corporate p-5 space-y-4" id="grafico-faturamento-repasses-card">
      
      <!-- CABEÇALHO DO GRÁFICO -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-app">
        <div>
          <div class="flex items-center gap-2">
            <div class="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-950 text-[#17324d] dark:text-blue-300">
              <mat-icon class="text-lg">bar_chart</mat-icon>
            </div>
            <div>
              <h2 class="font-bold text-sm sm:text-base text-app-text flex items-center gap-1.5">
                Evolução do Faturamento vs. Repasses aos MEIs
                <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  Lei 13.352/2016
                </span>
              </h2>
              <p class="text-xs text-app-secondary">
                Comparativo mensal entre a receita bruta total de serviços e os repasses transferidos aos profissionais-parceiros.
              </p>
            </div>
          </div>
        </div>

        <!-- CONTROLES DO GRÁFICO (PERÍODO & MODO) -->
        <div class="flex items-center gap-2 flex-wrap">
          <!-- Seletor de Período -->
          <div class="flex items-center bg-slate-100 dark:bg-slate-900 p-0.5 rounded-lg border border-app text-xs">
            <button 
              type="button" 
              (click)="periodoFiltro.set('ULTIMOS_6')"
              [class.bg-surface]="periodoFiltro() === 'ULTIMOS_6'"
              [class.shadow-xs]="periodoFiltro() === 'ULTIMOS_6'"
              [class.font-bold]="periodoFiltro() === 'ULTIMOS_6'"
              [class.text-app-text]="periodoFiltro() === 'ULTIMOS_6'"
              class="px-2.5 py-1 rounded text-app-secondary hover:text-app-text transition-all">
              Últimos 6 Meses
            </button>
            <button 
              type="button" 
              (click)="periodoFiltro.set('ANO_2026')"
              [class.bg-surface]="periodoFiltro() === 'ANO_2026'"
              [class.shadow-xs]="periodoFiltro() === 'ANO_2026'"
              [class.font-bold]="periodoFiltro() === 'ANO_2026'"
              [class.text-app-text]="periodoFiltro() === 'ANO_2026'"
              class="px-2.5 py-1 rounded text-app-secondary hover:text-app-text transition-all">
              Ano 2026 Completo
            </button>
          </div>

          <!-- Tipo de Agrupamento das Barras -->
          <div class="flex items-center bg-slate-100 dark:bg-slate-900 p-0.5 rounded-lg border border-app text-xs">
            <button 
              type="button" 
              (click)="modoVisualizacao.set('LADO_A_LADO')"
              [class.bg-surface]="modoVisualizacao() === 'LADO_A_LADO'"
              [class.shadow-xs]="modoVisualizacao() === 'LADO_A_LADO'"
              [class.font-bold]="modoVisualizacao() === 'LADO_A_LADO'"
              [class.text-app-text]="modoVisualizacao() === 'LADO_A_LADO'"
              class="px-2 py-1 rounded text-app-secondary hover:text-app-text transition-all flex items-center gap-1"
              title="Barras Lado a Lado">
              <mat-icon class="text-xs">view_column</mat-icon>
              <span class="hidden sm:inline">Lado a Lado</span>
            </button>
            <button 
              type="button" 
              (click)="modoVisualizacao.set('EMPILHADO')"
              [class.bg-surface]="modoVisualizacao() === 'EMPILHADO'"
              [class.shadow-xs]="modoVisualizacao() === 'EMPILHADO'"
              [class.font-bold]="modoVisualizacao() === 'EMPILHADO'"
              [class.text-app-text]="modoVisualizacao() === 'EMPILHADO'"
              class="px-2 py-1 rounded text-app-secondary hover:text-app-text transition-all flex items-center gap-1"
              title="Composição Empilhada (Repasses + Cota Salão = Faturamento)">
              <mat-icon class="text-xs">table_rows</mat-icon>
              <span class="hidden sm:inline">Composição</span>
            </button>
          </div>
        </div>
      </div>

      <!-- CARDS RÁPIDOS DE MÉTRICAS DO PERÍODO SELECIONADO -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div class="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-app">
          <div class="flex items-center justify-between text-app-secondary mb-0.5">
            <span class="text-[10px] uppercase font-bold tracking-wider">Faturamento Total</span>
            <span class="w-2.5 h-2.5 rounded-full bg-[#17324d] dark:bg-blue-400"></span>
          </div>
          <span class="text-base sm:text-lg font-bold font-mono text-app-text block">
            R$ {{ totaisPeriodo().totalFaturamento | number:'1.2-2' }}
          </span>
          <span class="text-[10px] text-app-muted">Média: R$ {{ totaisPeriodo().mediaFaturamento | number:'1.0-0' }}/mês</span>
        </div>

        <div class="p-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
          <div class="flex items-center justify-between text-emerald-800 dark:text-emerald-300 mb-0.5">
            <span class="text-[10px] uppercase font-bold tracking-wider">Repasses MEI Pagos</span>
            <span class="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
          </div>
          <span class="text-base sm:text-lg font-bold font-mono text-emerald-700 dark:text-emerald-300 block">
            R$ {{ totaisPeriodo().totalRepasses | number:'1.2-2' }}
          </span>
          <span class="text-[10px] text-emerald-600/80">{{ totaisPeriodo().taxaMediaRepasse | number:'1.1-1' }}% do faturamento</span>
        </div>

        <div class="p-3 rounded-xl bg-amber-50/50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
          <div class="flex items-center justify-between text-amber-800 dark:text-amber-300 mb-0.5">
            <span class="text-[10px] uppercase font-bold tracking-wider">Cota Salão Retida</span>
            <span class="w-2.5 h-2.5 rounded-full bg-[#b66a3c]"></span>
          </div>
          <span class="text-base sm:text-lg font-bold font-mono text-[#b66a3c] block">
            R$ {{ totaisPeriodo().totalCotaSalao | number:'1.2-2' }}
          </span>
          <span class="text-[10px] text-amber-600/80">Base Simples Nacional</span>
        </div>

        <div class="p-3 rounded-xl bg-purple-50/50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800">
          <div class="flex items-center justify-between text-purple-800 dark:text-purple-300 mb-0.5">
            <span class="text-[10px] uppercase font-bold tracking-wider">Mês Recorde</span>
            <mat-icon class="text-sm text-purple-600">trending_up</mat-icon>
          </div>
          <span class="text-base sm:text-lg font-bold font-mono text-purple-700 dark:text-purple-300 block">
            {{ totaisPeriodo().mesRecorde.mesLabel }} (R$ {{ totaisPeriodo().mesRecorde.faturamentoBruto | number:'1.0-0' }})
          </span>
          <span class="text-[10px] text-purple-600/80">Repasse: R$ {{ totaisPeriodo().mesRecorde.repassesRealizados | number:'1.0-0' }}</span>
        </div>
      </div>

      <!-- ÁREA DO GRÁFICO SVG COM D3.JS -->
      <div class="relative w-full overflow-hidden bg-slate-50/60 dark:bg-slate-900/40 rounded-xl p-3 border border-app">
        
        <!-- Legenda Customizada Interativa -->
        <div class="flex items-center justify-between flex-wrap gap-2 text-xs mb-3 px-2">
          <div class="flex items-center gap-4 flex-wrap">
            <div class="flex items-center gap-1.5">
              <span class="w-3 h-3 rounded-sm bg-[#17324d] dark:bg-blue-500 inline-block shadow-xs"></span>
              <span class="font-bold text-app-text">Faturamento Bruto</span>
            </div>
            
            <div class="flex items-center gap-1.5">
              <span class="w-3 h-3 rounded-sm bg-emerald-500 inline-block shadow-xs"></span>
              <span class="font-bold text-app-text">Repasses Realizados (MEIs)</span>
            </div>

            @if (modoVisualizacao() === 'EMPILHADO') {
              <div class="flex items-center gap-1.5">
                <span class="w-3 h-3 rounded-sm bg-[#b66a3c] inline-block shadow-xs"></span>
                <span class="font-bold text-app-text">Cota Salão</span>
              </div>
            }
          </div>

          <div class="text-[11px] text-app-muted flex items-center gap-1">
            <mat-icon class="text-xs">touch_app</mat-icon>
            <span>Passe o mouse ou toque nas barras para ver detalhes</span>
          </div>
        </div>

        <!-- Container do Canvas SVG D3 -->
        <div #chartContainer class="w-full h-[280px] sm:h-[320px] relative select-none"></div>

        <!-- Tooltip Flutuante -->
        @if (tooltipData()) {
          <div 
            class="absolute z-20 pointer-events-none p-3 rounded-xl bg-slate-900/95 text-white dark:bg-slate-800/95 dark:text-slate-100 border border-slate-700 shadow-xl text-xs space-y-1.5 min-w-[200px] animate-fade-in"
            [style.left.px]="tooltipX()"
            [style.top.px]="tooltipY()">
            
            <div class="flex items-center justify-between border-b border-slate-700 pb-1">
              <strong class="text-sm font-bold text-blue-300">{{ tooltipData()?.mesLabel }}</strong>
              <span class="px-1.5 py-0.2 rounded text-[9px] font-bold"
                [class.bg-emerald-950]="tooltipData()?.status === 'HISTORICO'"
                [class.text-emerald-300]="tooltipData()?.status === 'HISTORICO'"
                [class.bg-blue-950]="tooltipData()?.status === 'ATUAL'"
                [class.text-blue-300]="tooltipData()?.status === 'ATUAL'">
                {{ tooltipData()?.status === 'ATUAL' ? 'Mês Atual' : 'Concluído' }}
              </span>
            </div>

            <div class="space-y-1 text-[11px]">
              <div class="flex justify-between items-center text-slate-300">
                <span class="flex items-center gap-1">
                  <span class="w-2 h-2 rounded-full bg-blue-400"></span> Faturamento:
                </span>
                <span class="font-mono font-bold text-white">R$ {{ tooltipData()?.faturamentoBruto | number:'1.2-2' }}</span>
              </div>

              <div class="flex justify-between items-center text-emerald-300">
                <span class="flex items-center gap-1">
                  <span class="w-2 h-2 rounded-full bg-emerald-400"></span> Repasse MEIs:
                </span>
                <span class="font-mono font-bold">R$ {{ tooltipData()?.repassesRealizados | number:'1.2-2' }}</span>
              </div>

              <div class="flex justify-between items-center text-amber-300">
                <span class="flex items-center gap-1">
                  <span class="w-2 h-2 rounded-full bg-amber-400"></span> Cota Salão:
                </span>
                <span class="font-mono font-bold">R$ {{ tooltipData()?.cotaSalaoRetida | number:'1.2-2' }}</span>
              </div>

              <div class="pt-1 border-t border-slate-700 flex justify-between items-center text-[10px] text-slate-400">
                <span>Taxa de Repasse:</span>
                <span class="font-bold text-emerald-400 font-mono">{{ tooltipData()?.percentualRepasse | number:'1.1-1' }}%</span>
              </div>
            </div>

          </div>
        }

      </div>

      <!-- DETALHE ANALÍTICO MÊS A MÊS EM TABELA COMPACTA -->
      <div class="border border-app rounded-xl overflow-hidden">
        <div class="p-3 bg-slate-50 dark:bg-slate-900/70 border-b border-app flex items-center justify-between">
          <span class="text-xs font-bold text-app-text flex items-center gap-1.5">
            <mat-icon class="text-sm text-[#17324d] dark:text-blue-300">table_chart</mat-icon>
            Discriminação Numérica dos Períodos
          </span>
          <span class="text-[11px] text-app-muted">Lei Federal 13.352/2016</span>
        </div>

        <div class="overflow-x-auto">
          <table class="table-corporate text-xs">
            <thead>
              <tr>
                <th>Mês/Ano</th>
                <th class="text-right">Faturamento Bruto</th>
                <th class="text-right">Repasse Realizado (MEIs)</th>
                <th class="text-right">% Repassado</th>
                <th class="text-right">Cota Salão Retida</th>
                <th class="text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              @for (item of dadosFiltrados(); track item.mesLabel) {
                <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td class="font-bold text-app-text whitespace-nowrap">
                    {{ item.mesLabel }}
                  </td>
                  <td class="text-right font-mono font-bold text-app-text whitespace-nowrap">
                    R$ {{ item.faturamentoBruto | number:'1.2-2' }}
                  </td>
                  <td class="text-right font-mono font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                    R$ {{ item.repassesRealizados | number:'1.2-2' }}
                  </td>
                  <td class="text-right font-mono text-app-secondary whitespace-nowrap">
                    {{ item.percentualRepasse | number:'1.1-1' }}%
                  </td>
                  <td class="text-right font-mono font-bold text-[#b66a3c] whitespace-nowrap">
                    R$ {{ item.cotaSalaoRetida | number:'1.2-2' }}
                  </td>
                  <td class="text-center whitespace-nowrap">
                    @if (item.status === 'ATUAL') {
                      <span class="status-badge status-badge-info text-[10px]">Em Andamento</span>
                    } @else {
                      <span class="status-badge status-badge-success text-[10px]">Consolidado</span>
                    }
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>

    </div>
  `
})
export class GraficoFaturamentoRepassesComponent implements OnInit, OnDestroy {
  readonly financeState = inject(FinanceStateService);
  readonly chartContainer = viewChild<ElementRef<HTMLDivElement>>('chartContainer');

  readonly periodoFiltro = signal<'ULTIMOS_6' | 'ANO_2026'>('ULTIMOS_6');
  readonly modoVisualizacao = signal<'LADO_A_LADO' | 'EMPILHADO'>('LADO_A_LADO');

  // Tooltip
  readonly tooltipData = signal<DadoEvolucaoMensal | null>(null);
  readonly tooltipX = signal<number>(0);
  readonly tooltipY = signal<number>(0);

  private resizeObserver: ResizeObserver | null = null;

  // Base completa de dados do ano de 2026
  readonly dadosHistoricos = signal<DadoEvolucaoMensal[]>([
    {
      mesNum: 1,
      ano: 2026,
      mesLabel: 'Jan/2026',
      faturamentoBruto: 39500.00,
      repassesRealizados: 21800.00,
      cotaSalaoRetida: 17700.00,
      percentualRepasse: 55.19,
      qtdAtendimentos: 230,
      status: 'HISTORICO'
    },
    {
      mesNum: 2,
      ano: 2026,
      mesLabel: 'Fev/2026',
      faturamentoBruto: 41200.00,
      repassesRealizados: 22900.00,
      cotaSalaoRetida: 18300.00,
      percentualRepasse: 55.58,
      qtdAtendimentos: 245,
      status: 'HISTORICO'
    },
    {
      mesNum: 3,
      ano: 2026,
      mesLabel: 'Mar/2026',
      faturamentoBruto: 44800.00,
      repassesRealizados: 25100.00,
      cotaSalaoRetida: 19700.00,
      percentualRepasse: 56.03,
      qtdAtendimentos: 268,
      status: 'HISTORICO'
    },
    {
      mesNum: 4,
      ano: 2026,
      mesLabel: 'Abr/2026',
      faturamentoBruto: 46100.00,
      repassesRealizados: 25800.00,
      cotaSalaoRetida: 20300.00,
      percentualRepasse: 55.97,
      qtdAtendimentos: 275,
      status: 'HISTORICO'
    },
    {
      mesNum: 5,
      ano: 2026,
      mesLabel: 'Mai/2026',
      faturamentoBruto: 51200.00,
      repassesRealizados: 28900.00,
      cotaSalaoRetida: 22300.00,
      percentualRepasse: 56.45,
      qtdAtendimentos: 310,
      status: 'HISTORICO'
    },
    {
      mesNum: 6,
      ano: 2026,
      mesLabel: 'Jun/2026',
      faturamentoBruto: 48900.00,
      repassesRealizados: 27400.00,
      cotaSalaoRetida: 21500.00,
      percentualRepasse: 56.03,
      qtdAtendimentos: 295,
      status: 'HISTORICO'
    },
    {
      mesNum: 7,
      ano: 2026,
      mesLabel: 'Jul/2026',
      faturamentoBruto: 52400.00,
      repassesRealizados: 29400.00,
      cotaSalaoRetida: 23000.00,
      percentualRepasse: 56.11,
      qtdAtendimentos: 320,
      status: 'HISTORICO'
    },
    {
      mesNum: 8,
      ano: 2026,
      mesLabel: 'Ago/2026',
      faturamentoBruto: 55900.00, // Refletindo o estado dinâmico atual
      repassesRealizados: 31340.00,
      cotaSalaoRetida: 24560.00,
      percentualRepasse: 56.06,
      qtdAtendimentos: 342,
      status: 'ATUAL'
    }
  ]);

  readonly dadosFiltrados = computed(() => {
    const todos = this.dadosHistoricos();
    if (this.periodoFiltro() === 'ULTIMOS_6') {
      return todos.slice(-6);
    }
    return todos;
  });

  readonly totaisPeriodo = computed(() => {
    const itens = this.dadosFiltrados();
    const totalFaturamento = itens.reduce((acc, i) => acc + i.faturamentoBruto, 0);
    const totalRepasses = itens.reduce((acc, i) => acc + i.repassesRealizados, 0);
    const totalCotaSalao = itens.reduce((acc, i) => acc + i.cotaSalaoRetida, 0);
    const mediaFaturamento = itens.length > 0 ? totalFaturamento / itens.length : 0;
    const taxaMediaRepasse = totalFaturamento > 0 ? (totalRepasses / totalFaturamento) * 100 : 0;

    let mesRecorde = itens[0];
    for (const item of itens) {
      if (item.faturamentoBruto > (mesRecorde?.faturamentoBruto || 0)) {
        mesRecorde = item;
      }
    }

    return {
      totalFaturamento,
      totalRepasses,
      totalCotaSalao,
      mediaFaturamento,
      taxaMediaRepasse,
      mesRecorde
    };
  });

  constructor() {
    afterNextRender(() => {
      this.initChart();
    });

    effect(() => {
      // Reagir a mudanças de filtro, modo ou dados
      const _p = this.periodoFiltro();
      const _m = this.modoVisualizacao();
      const _d = this.dadosFiltrados();
      this.renderChart();
    });
  }

  ngOnInit(): void {}

  ngOnDestroy(): void {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
  }

  private initChart(): void {
    const container = this.chartContainer()?.nativeElement;
    if (!container) return;

    this.resizeObserver = new ResizeObserver(() => {
      this.renderChart();
    });
    this.resizeObserver.observe(container);

    this.renderChart();
  }

  private renderChart(): void {
    const container = this.chartContainer()?.nativeElement;
    if (!container) return;

    // Limpar renderização anterior
    d3.select(container).selectAll('*').remove();

    const data = this.dadosFiltrados();
    if (!data || data.length === 0) return;

    const width = container.clientWidth || 600;
    const height = container.clientHeight || 300;

    const margin = { top: 25, right: 20, bottom: 40, left: 55 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const svg = d3
      .select(container)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .attr('class', 'overflow-visible');

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Escala X (Band Scale para os meses)
    const x0 = d3
      .scaleBand()
      .domain(data.map(d => d.mesLabel))
      .rangeRound([0, innerWidth])
      .paddingInner(0.25)
      .paddingOuter(0.15);

    // Grid horizontal suave
    const maxY = this.modoVisualizacao() === 'EMPILHADO' 
      ? d3.max(data, d => d.faturamentoBruto * 1.15) || 60000
      : d3.max(data, d => Math.max(d.faturamentoBruto, d.repassesRealizados) * 1.15) || 60000;

    const y = d3
      .scaleLinear()
      .domain([0, maxY])
      .rangeRound([innerHeight, 0])
      .nice();

    // Adicionar Grid Lines horizontais
    g.append('g')
      .attr('class', 'grid-lines opacity-10')
      .call(
        d3.axisLeft(y)
          .ticks(5)
          .tickSize(-innerWidth)
          .tickFormat(() => '')
      );

    // Eixo Y
    const yAxis = d3.axisLeft(y)
      .ticks(5)
      .tickFormat(d => {
        const val = d.valueOf();
        return val >= 1000 ? `R$ ${val / 1000}k` : `R$ ${val}`;
      });

    g.append('g')
      .attr('class', 'text-[10px] text-slate-500 font-mono')
      .call(yAxis)
      .call(g => g.select('.domain').remove());

    // Eixo X
    const xAxis = d3.axisBottom(x0);
    g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .attr('class', 'text-[11px] font-bold text-slate-600 dark:text-slate-400')
      .call(xAxis)
      .call(g => g.select('.domain').attr('class', 'stroke-slate-300 dark:stroke-slate-700'));

    if (this.modoVisualizacao() === 'LADO_A_LADO') {
      // Sub-escala para barras agrupadas lado a lado
      const x1 = d3
        .scaleBand()
        .domain(['faturamento', 'repasses'])
        .rangeRound([0, x0.bandwidth()])
        .padding(0.08);

      // Grupos por mês
      const monthGroups = g
        .selectAll('.month-group')
        .data(data)
        .enter()
        .append('g')
        .attr('class', 'month-group cursor-pointer')
        .attr('transform', d => `translate(${x0(d.mesLabel)},0)`);

      // 1. Barra de Faturamento Bruto (animada da base até a altura com stagger e easing)
      monthGroups
        .append('rect')
        .attr('x', x1('faturamento') || 0)
        .attr('y', innerHeight)
        .attr('width', x1.bandwidth())
        .attr('height', 0)
        .attr('rx', 4)
        .attr('ry', 4)
        .attr('fill', '#17324d')
        .attr('class', 'transition-colors duration-150 hover:brightness-125')
        .on('mouseenter', (event, d) => this.showTooltip(event, d, container))
        .on('mousemove', (event, d) => this.showTooltip(event, d, container))
        .on('mouseleave', () => this.hideTooltip())
        .transition()
        .duration(650)
        .delay((d, i) => i * 40)
        .ease(d3.easeCubicOut)
        .attr('y', d => y(d.faturamentoBruto))
        .attr('height', d => Math.max(2, innerHeight - y(d.faturamentoBruto)));

      // 2. Barra de Repasses aos MEIs (animada com stagger suave)
      monthGroups
        .append('rect')
        .attr('x', x1('repasses') || 0)
        .attr('y', innerHeight)
        .attr('width', x1.bandwidth())
        .attr('height', 0)
        .attr('rx', 4)
        .attr('ry', 4)
        .attr('fill', '#10b981')
        .attr('class', 'transition-colors duration-150 hover:brightness-125')
        .on('mouseenter', (event, d) => this.showTooltip(event, d, container))
        .on('mousemove', (event, d) => this.showTooltip(event, d, container))
        .on('mouseleave', () => this.hideTooltip())
        .transition()
        .duration(650)
        .delay((d, i) => i * 40 + 60)
        .ease(d3.easeCubicOut)
        .attr('y', d => y(d.repassesRealizados))
        .attr('height', d => Math.max(2, innerHeight - y(d.repassesRealizados)));

      // Rótulos de valor no topo das barras com entrada suave e fade-in
      if (width > 500) {
        monthGroups
          .append('text')
          .attr('x', (x1('faturamento') || 0) + x1.bandwidth() / 2)
          .attr('y', d => y(d.faturamentoBruto) - 6)
          .attr('text-anchor', 'middle')
          .attr('class', 'text-[9px] font-mono font-bold fill-slate-700 dark:fill-slate-300')
          .attr('opacity', 0)
          .text(d => `R$ ${(d.faturamentoBruto / 1000).toFixed(0)}k`)
          .transition()
          .duration(450)
          .delay((d, i) => i * 40 + 350)
          .ease(d3.easeCubicOut)
          .attr('opacity', 1);

        monthGroups
          .append('text')
          .attr('x', (x1('repasses') || 0) + x1.bandwidth() / 2)
          .attr('y', d => y(d.repassesRealizados) - 6)
          .attr('text-anchor', 'middle')
          .attr('class', 'text-[9px] font-mono font-bold fill-emerald-600 dark:fill-emerald-400')
          .attr('opacity', 0)
          .text(d => `R$ ${(d.repassesRealizados / 1000).toFixed(0)}k`)
          .transition()
          .duration(450)
          .delay((d, i) => i * 40 + 400)
          .ease(d3.easeCubicOut)
          .attr('opacity', 1);
      }

    } else {
      // MODO COMPOSIÇÃO EMPILHADA: Repasses (Verde) + Cota Salão (Laranja) = Faturamento Total
      const monthGroups = g
        .selectAll('.month-group-stacked')
        .data(data)
        .enter()
        .append('g')
        .attr('class', 'month-group-stacked cursor-pointer')
        .attr('transform', d => `translate(${x0(d.mesLabel)},0)`);

      const barWidth = x0.bandwidth();

      // Parte Inferior: Repasse MEI (Verde) - animada da base
      monthGroups
        .append('rect')
        .attr('x', 0)
        .attr('y', innerHeight)
        .attr('width', barWidth)
        .attr('height', 0)
        .attr('fill', '#10b981')
        .attr('class', 'transition-colors duration-150 hover:brightness-125')
        .on('mouseenter', (event, d) => this.showTooltip(event, d, container))
        .on('mousemove', (event, d) => this.showTooltip(event, d, container))
        .on('mouseleave', () => this.hideTooltip())
        .transition()
        .duration(650)
        .delay((d, i) => i * 40)
        .ease(d3.easeCubicOut)
        .attr('y', d => y(d.repassesRealizados))
        .attr('height', d => Math.max(2, innerHeight - y(d.repassesRealizados)));

      // Parte Superior: Cota Salão (Laranja/Terracota) - animada acima do repasse
      monthGroups
        .append('rect')
        .attr('x', 0)
        .attr('y', d => y(d.repassesRealizados))
        .attr('width', barWidth)
        .attr('height', 0)
        .attr('rx', 4)
        .attr('ry', 4)
        .attr('fill', '#b66a3c')
        .attr('class', 'transition-colors duration-150 hover:brightness-125')
        .on('mouseenter', (event, d) => this.showTooltip(event, d, container))
        .on('mousemove', (event, d) => this.showTooltip(event, d, container))
        .on('mouseleave', () => this.hideTooltip())
        .transition()
        .duration(650)
        .delay((d, i) => i * 40 + 100)
        .ease(d3.easeCubicOut)
        .attr('y', d => y(d.faturamentoBruto))
        .attr('height', d => Math.max(2, y(d.repassesRealizados) - y(d.faturamentoBruto)));

      // Valor Total no topo da pilha com fade-in suave
      monthGroups
        .append('text')
        .attr('x', barWidth / 2)
        .attr('y', d => y(d.faturamentoBruto) - 6)
        .attr('text-anchor', 'middle')
        .attr('class', 'text-[10px] font-mono font-bold fill-slate-800 dark:fill-slate-200')
        .attr('opacity', 0)
        .text(d => `R$ ${(d.faturamentoBruto / 1000).toFixed(1)}k`)
        .transition()
        .duration(450)
        .delay((d, i) => i * 40 + 350)
        .ease(d3.easeCubicOut)
        .attr('opacity', 1);
    }
  }

  private showTooltip(event: MouseEvent, d: DadoEvolucaoMensal, container: HTMLElement): void {
    const rect = container.getBoundingClientRect();
    const x = event.clientX - rect.left + 15;
    const y = Math.max(10, event.clientY - rect.top - 60);

    this.tooltipData.set(d);
    this.tooltipX.set(Math.min(x, container.clientWidth - 220));
    this.tooltipY.set(y);
  }

  private hideTooltip(): void {
    this.tooltipData.set(null);
  }
}
