import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { SaudeFiscalMeiService } from '../../core/services/saude-fiscal-mei.service';
import { AnaliseRecorrenciaMei } from '../../core/models/saude-fiscal-mei.model';

@Component({
  selector: 'app-painel-saude-fiscal-mei',
  imports: [CommonModule, FormsModule, RouterLink, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-6 animate-tab-enter" id="painel-saude-fiscal-mei">

      <!-- CABEÇALHO COM DIAGNÓSTICO EM TEMPO REAL -->
      <div class="card-corporate p-6 bg-gradient-to-br from-slate-900 via-[#17324d] to-slate-950 text-white relative overflow-hidden shadow-lg border-0">
        <!-- Detalhes de iluminação de fundo -->
        <div class="absolute -right-10 -bottom-10 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div class="absolute top-0 right-1/4 w-48 h-48 bg-blue-500/10 rounded-full blur-2xl pointer-events-none"></div>

        <div class="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div class="space-y-2">
            <div class="flex items-center gap-2">
              <span class="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-amber-400/20 text-amber-300 border border-amber-400/30 flex items-center gap-1">
                <mat-icon class="text-xs">shield</mat-icon>
                Auditoria de Recorrência & Teto MEI
              </span>
              <span class="text-xs text-slate-300">Lei Complementar nº 123/2006</span>
            </div>

            <h2 class="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
              <mat-icon class="text-amber-400">health_and_safety</mat-icon>
              Saúde Fiscal dos Profissionais Parceiros MEI
            </h2>

            <p class="text-xs text-slate-300 max-w-2xl leading-relaxed">
              O algoritmo analisa a frequência e o volume dos repasses de cada parceiro, calculando a projeção anual contra o limite de <strong class="text-white font-mono">R$ 81.000,00/ano</strong> para prevenir desenquadramentos compulsórios e orientar a transição para Microempresa (ME).
            </p>
          </div>

          <div class="flex flex-col sm:flex-row md:flex-col items-start md:items-end gap-2.5 shrink-0">
            <button 
              type="button" 
              (click)="reexecutarAuditoria()"
              [disabled]="executandoAuditoria()"
              class="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-md transition-all cursor-pointer disabled:opacity-50"
              id="btn-reexecutar-auditoria-mei">
              <mat-icon [class.animate-spin]="executandoAuditoria()" class="text-sm">refresh</mat-icon>
              <span>{{ executandoAuditoria() ? 'Auditando Repasses...' : 'Reexecutar Auditoria' }}</span>
            </button>

            <span class="text-[11px] text-slate-300 flex items-center gap-1 font-mono">
              <mat-icon class="text-xs text-emerald-400">check_circle</mat-icon>
              {{ resumo().data_ultima_analise }}
            </span>
          </div>
        </div>

        <!-- CARDS INDICADORES RESUMIDOS DO CABEÇALHO -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 mt-6 border-t border-white/10 text-xs">
          <div class="p-3 rounded-xl bg-white/5 border border-white/10">
            <span class="text-[10px] uppercase font-bold text-slate-300 block">MEIs Monitorados</span>
            <span class="text-lg font-black font-mono text-white">{{ resumo().total_parceiros_analisados }} profissionais</span>
          </div>

          <div class="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <span class="text-[10px] uppercase font-bold text-amber-300 block">Em Alerta / Risco</span>
            <span class="text-lg font-black font-mono text-amber-400">{{ resumo().total_em_risco_ou_alerta }} parceiro(s)</span>
          </div>

          <div class="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <span class="text-[10px] uppercase font-bold text-emerald-300 block">Dentro do Limite</span>
            <span class="text-lg font-black font-mono text-emerald-400">{{ resumo().total_seguros }} parceiros</span>
          </div>

          <div class="p-3 rounded-xl bg-white/5 border border-white/10">
            <span class="text-[10px] uppercase font-bold text-slate-300 block">Teto Anual MEI</span>
            <span class="text-lg font-black font-mono text-white">R$ 81.000,00</span>
          </div>
        </div>
      </div>

      <!-- ALERTA DE DESTAQUE: TRANSIÇÃO SUGERIDA PARA ME / CNPJ COMUM -->
      @if (parceirosEmRisco().length > 0) {
        <div class="card-corporate p-5 border-l-4 border-l-rose-500 bg-rose-50/50 dark:bg-rose-950/20 space-y-3" id="banner-alerta-transicao-mei">
          <div class="flex items-start justify-between gap-4">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300 flex items-center justify-center shrink-0">
                <mat-icon>warning</mat-icon>
              </div>
              <div>
                <h3 class="text-sm font-black text-rose-950 dark:text-rose-200">
                  Atenção: {{ parceirosEmRisco().length }} Parceiro(s) Projetam Ultrapassar o Teto do MEI em 2026
                </h3>
                <p class="text-xs text-rose-800 dark:text-rose-300 mt-0.5">
                  Com base na média de repasses quinzenais apurada, o volume anual excederá R$ 81.000,00. É altamente recomendado iniciar o processo de transição para <strong>Microempresa (ME no Simples Nacional)</strong> ou <strong>Sociedade Limitada Unipessoal (SLU)</strong> para evitar autuações tributárias retroativas.
                </p>
              </div>
            </div>

            <button 
              type="button"
              (click)="abrirModalNotificacao(parceirosEmRisco()[0])"
              class="btn-primary bg-rose-600 hover:bg-rose-700 text-white text-xs py-2 px-3 shrink-0 flex items-center gap-1.5 shadow-sm"
              id="btn-emitir-notificacao-urgente">
              <mat-icon class="text-xs">description</mat-icon>
              <span>Gerar Notificação de Transição</span>
            </button>
          </div>
        </div>
      }

      <!-- FILTROS E BARRA DE PESQUISA -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div class="flex items-center gap-2">
          <button 
            type="button" 
            (click)="filtroStatus.set('TODOS')"
            [class.bg-[#17324d]]="filtroStatus() === 'TODOS'"
            [class.text-white]="filtroStatus() === 'TODOS'"
            [class.bg-surface]="filtroStatus() !== 'TODOS'"
            [class.text-app-secondary]="filtroStatus() !== 'TODOS'"
            class="px-3 py-1.5 rounded-lg text-xs font-bold border border-app transition-all cursor-pointer">
            Todos ({{ analises().length }})
          </button>

          <button 
            type="button" 
            (click)="filtroStatus.set('RISCO')"
            [class.bg-rose-600]="filtroStatus() === 'RISCO'"
            [class.text-white]="filtroStatus() === 'RISCO'"
            [class.bg-surface]="filtroStatus() !== 'RISCO'"
            [class.text-rose-600]="filtroStatus() !== 'RISCO'"
            class="px-3 py-1.5 rounded-lg text-xs font-bold border border-rose-200 dark:border-rose-900 transition-all cursor-pointer flex items-center gap-1">
            <mat-icon class="text-xs">error</mat-icon>
            <span>Risco de Desenquadramento ({{ totalRisco() }})</span>
          </button>

          <button 
            type="button" 
            (click)="filtroStatus.set('ALERTA')"
            [class.bg-amber-600]="filtroStatus() === 'ALERTA'"
            [class.text-white]="filtroStatus() === 'ALERTA'"
            [class.bg-surface]="filtroStatus() !== 'ALERTA'"
            [class.text-amber-600]="filtroStatus() !== 'ALERTA'"
            class="px-3 py-1.5 rounded-lg text-xs font-bold border border-amber-200 dark:border-amber-900 transition-all cursor-pointer flex items-center gap-1">
            <mat-icon class="text-xs">warning</mat-icon>
            <span>Alerta > 80% ({{ totalAlerta() }})</span>
          </button>
        </div>

        <div class="text-xs text-app-muted">
          Base de Análise: <strong class="text-app-text font-mono">8 meses decorridos (Jan-Ago/2026)</strong>
        </div>
      </div>

      <!-- GRID DE CARDS ANALÍTICOS DE CADA PARCEIRO -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        @for (parc of parceirosFiltrados(); track parc.id_parceiro) {
          <div 
            class="card-corporate p-5 relative overflow-hidden flex flex-col justify-between space-y-4 transition-all duration-200 hover:shadow-md"
            [class.border-l-4]="true"
            [class.border-l-rose-600]="parc.status_risco === 'RISCO_DESENQUADRAMENTO'"
            [class.border-l-amber-500]="parc.status_risco === 'ALERTA_80_PCT'"
            [class.border-l-emerald-500]="parc.status_risco === 'SEGURO'"
            [id]="'card-saude-mei-' + parc.id_parceiro">

            <div>
              <!-- TOPO DO CARD: IDENTIFICAÇÃO E STATUS -->
              <div class="flex items-start justify-between gap-3 border-b border-app pb-3">
                <div>
                  <div class="flex items-center gap-2">
                    <h3 class="text-sm font-black text-app-text">{{ parc.nome_parceiro }}</h3>
                    <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-app-secondary">
                      {{ parc.especialidade }}
                    </span>
                  </div>
                  <p class="text-[11px] text-app-muted font-mono mt-0.5">CNPJ: {{ parc.cnpj }} • {{ parc.razao_social }}</p>
                </div>

                <!-- BADGE DE RISCO -->
                @if (parc.status_risco === 'RISCO_DESENQUADRAMENTO') {
                  <span class="px-2.5 py-1 rounded-md text-[10px] font-extrabold bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800 flex items-center gap-1 shrink-0">
                    <mat-icon class="text-xs">dangerous</mat-icon>
                    Excede Teto MEI
                  </span>
                } @else if (parc.status_risco === 'ALERTA_80_PCT') {
                  <span class="px-2.5 py-1 rounded-md text-[10px] font-extrabold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 flex items-center gap-1 shrink-0">
                    <mat-icon class="text-xs">warning</mat-icon>
                    Alerta > 80%
                  </span>
                } @else {
                  <span class="px-2.5 py-1 rounded-md text-[10px] font-extrabold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 flex items-center gap-1 shrink-0">
                    <mat-icon class="text-xs">check_circle</mat-icon>
                    Regular / Seguro
                  </span>
                }
              </div>

              <!-- BARRA DE PROGRESSO DO TETO ANUAL DO MEI -->
              <div class="space-y-1.5 pt-3">
                <div class="flex items-center justify-between text-xs">
                  <span class="font-bold text-app-secondary">Projeção Anual vs Teto MEI:</span>
                  <span class="font-mono font-black" [class.text-rose-600]="parc.percentual_teto_atingido > 100" [class.text-amber-600]="parc.percentual_teto_atingido >= 80 && parc.percentual_teto_atingido <= 100" [class.text-emerald-600]="parc.percentual_teto_atingido < 80">
                    {{ parc.percentual_teto_atingido | number:'1.1-1' }}% (R$ {{ parc.projecao_anual_total | number:'1.2-2' }})
                  </span>
                </div>

                <div class="w-full bg-slate-200 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden relative">
                  <div 
                    class="h-full rounded-full transition-all duration-500"
                    [style.width.%]="Math.min(100, parc.percentual_teto_atingido)"
                    [class.bg-rose-600]="parc.status_risco === 'RISCO_DESENQUADRAMENTO'"
                    [class.bg-amber-500]="parc.status_risco === 'ALERTA_80_PCT'"
                    [class.bg-emerald-500]="parc.status_risco === 'SEGURO'">
                  </div>
                </div>

                <div class="flex items-center justify-between text-[10px] text-app-muted font-mono">
                  <span>Acumulado: R$ {{ parc.faturamento_anual_acumulado | number:'1.0-0' }}</span>
                  <span>Teto MEI: R$ 81.000</span>
                  <span>Saldo Restante: R$ {{ Math.max(0, parc.teto_anual_mei - parc.faturamento_anual_acumulado) | number:'1.0-0' }}</span>
                </div>
              </div>

              <!-- DETALHES DE MÉDIA E RECORRÊNCIA -->
              <div class="grid grid-cols-3 gap-2 text-xs pt-3 mt-3 border-t border-app bg-slate-50/60 dark:bg-slate-800/40 p-2.5 rounded-xl">
                <div>
                  <span class="text-[10px] text-app-muted uppercase font-bold block">Média Mensal</span>
                  <strong class="font-mono text-app-text">R$ {{ parc.media_mensal_repasse | number:'1.2-2' }}</strong>
                </div>

                <div>
                  <span class="text-[10px] text-app-muted uppercase font-bold block">Frequência</span>
                  <strong class="text-app-text">Quinzenal</strong>
                </div>

                <div>
                  <span class="text-[10px] text-app-muted uppercase font-bold block">Projeção 12m</span>
                  <strong class="font-mono" [class.text-rose-600]="parc.projecao_anual_total > 81000" [class.text-emerald-600]="parc.projecao_anual_total <= 81000">
                    R$ {{ parc.projecao_anual_total | number:'1.2-2' }}
                  </strong>
                </div>
              </div>

              <!-- DIAGNÓSTICO & SUGESTÃO DE TRANSIÇÃO -->
              <div class="mt-3 p-3 rounded-xl border text-xs" [class.bg-rose-50/60]="parc.status_risco === 'RISCO_DESENQUADRAMENTO'" [class.border-rose-200]="parc.status_risco === 'RISCO_DESENQUADRAMENTO'" [class.dark:bg-rose-950/20]="parc.status_risco === 'RISCO_DESENQUADRAMENTO'" [class.bg-amber-50/60]="parc.status_risco === 'ALERTA_80_PCT'" [class.border-amber-200]="parc.status_risco === 'ALERTA_80_PCT'" [class.dark:bg-amber-950/20]="parc.status_risco === 'ALERTA_80_PCT'" [class.bg-slate-50]="parc.status_risco === 'SEGURO'" [class.border-slate-200]="parc.status_risco === 'SEGURO'" [class.dark:bg-slate-800/20]="parc.status_risco === 'SEGURO'">
                <div class="flex items-start gap-2">
                  <mat-icon class="text-sm mt-0.5" [class.text-rose-600]="parc.status_risco === 'RISCO_DESENQUADRAMENTO'" [class.text-amber-600]="parc.status_risco === 'ALERTA_80_PCT'" [class.text-emerald-600]="parc.status_risco === 'SEGURO'">
                    {{ parc.status_risco === 'RISCO_DESENQUADRAMENTO' ? 'priority_high' : (parc.status_risco === 'ALERTA_80_PCT' ? 'info' : 'task_alt') }}
                  </mat-icon>
                  <div>
                    <strong class="font-bold text-app-text block mb-0.5">Diagnóstico Fiscal:</strong>
                    <p class="text-[11px] text-app-secondary leading-relaxed">{{ parc.sugestao_transicao }}</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- AÇÕES RECOMENDADAS E BOTÃO DE NOTIFICAÇÃO -->
            <div class="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t border-app">
              <span class="text-[10px] text-app-muted font-medium">
                {{ parc.acoes_recomendadas.length }} ação(ões) recomendada(s)
              </span>

              <div class="flex items-center gap-2">
                @if (parc.status_risco === 'RISCO_DESENQUADRAMENTO' || parc.status_risco === 'ALERTA_80_PCT') {
                  <button 
                    type="button" 
                    (click)="abrirModalNotificacao(parc)"
                    class="btn-secondary text-xs py-1.5 px-2.5 flex items-center gap-1 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800 hover:bg-rose-50"
                    [id]="'btn-gerar-notificacao-' + parc.id_parceiro">
                    <mat-icon class="text-xs">outgoing_mail</mat-icon>
                    <span>Emitir Aviso Transição ME</span>
                  </button>
                }

                <a 
                  routerLink="/relatorio-repasse" 
                  class="btn-primary text-xs py-1.5 px-2.5 flex items-center gap-1"
                  [id]="'btn-ver-extrato-' + parc.id_parceiro">
                  <mat-icon class="text-xs">receipt_long</mat-icon>
                  <span>Extrato de Repasses</span>
                </a>
              </div>
            </div>

          </div>
        }
      </div>

      <!-- GUIA EXPLICATIVO: TRANSIÇÃO MEI PARA ME (MICROEMPRESA) -->
      <div class="card-corporate p-5 space-y-4 max-w-5xl">
        <h3 class="text-sm font-black text-app-text border-b border-app pb-2 flex items-center gap-2">
          <mat-icon class="text-purple-600">lightbulb</mat-icon>
          Como Funciona a Transição de MEI para ME / CNPJ Comum sob a Lei 13.352?
        </h3>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div class="p-4 rounded-xl border border-app bg-slate-50/50 dark:bg-slate-800/30 space-y-2">
            <span class="font-bold text-app-text flex items-center gap-1.5 text-purple-700 dark:text-purple-300">
              <mat-icon class="text-xs">1</mat-icon> 1. Desenquadramento Voluntário
            </span>
            <p class="text-app-secondary leading-relaxed text-[11px]">
              O parceiro solicita o desenquadramento no Portal do Simples Nacional por ultrapassagem de receita. A transição voluntária evita multas de ofício da Receita Federal.
            </p>
          </div>

          <div class="p-4 rounded-xl border border-app bg-slate-50/50 dark:bg-slate-800/30 space-y-2">
            <span class="font-bold text-app-text flex items-center gap-1.5 text-blue-700 dark:text-blue-300">
              <mat-icon class="text-xs">2</mat-icon> 2. Tributação no Simples (Anexo III)
            </span>
            <p class="text-app-secondary leading-relaxed text-[11px]">
              Como Microempresa (ME), o parceiro emite NFS-e pelo Anexo III do Simples Nacional com alíquota inicial a partir de 6%, mantendo a dedução integral na contabilidade do salão.
            </p>
          </div>

          <div class="p-4 rounded-xl border border-app bg-slate-50/50 dark:bg-slate-800/30 space-y-2">
            <span class="font-bold text-app-text flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300">
              <mat-icon class="text-xs">3</mat-icon> 3. Termo Aditivo Homologado
            </span>
            <p class="text-app-secondary leading-relaxed text-[11px]">
              A empresa salão-parceiro firma um Termo Aditivo Contratual atualizando a qualificação jurídica do profissional para ME/EPP, mantendo a blindagem contra vínculo celetista.
            </p>
          </div>
        </div>
      </div>

      <!-- MODAL DE EMISSÃO DA NOTIFICAÇÃO DE TRANSIÇÃO -->
      @if (modalNotificacaoAberta() && parceiroSelecionado()) {
        <div class="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div class="card-corporate w-full max-w-2xl max-h-[90vh] flex flex-col p-6 space-y-4 shadow-2xl animate-tab-enter">
            
            <div class="flex items-center justify-between border-b border-app pb-3">
              <div class="flex items-center gap-2">
                <mat-icon class="text-rose-600">outgoing_mail</mat-icon>
                <h3 class="text-sm font-black text-app-text">Aviso Formal de Orientação & Transição Fiscal (MEI -> ME)</h3>
              </div>
              <button 
                type="button" 
                (click)="fecharModalNotificacao()" 
                class="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-app-muted cursor-pointer">
                <mat-icon class="text-base">close</mat-icon>
              </button>
            </div>

            <div class="text-xs text-app-secondary space-y-1">
              <p>Documento gerado automaticamente conforme o histórico de repasses de <strong>{{ parceiroSelecionado()?.nome_parceiro }}</strong>.</p>
            </div>

            <!-- TEXTAREA COM O MODELO FORMAL -->
            <div class="flex-1 overflow-y-auto">
              <textarea 
                [value]="textoNotificacaoGerado()" 
                readonly 
                rows="14" 
                class="w-full font-mono text-[11px] p-3 rounded-xl border border-app bg-slate-50 dark:bg-slate-900 text-app-text leading-relaxed focus:outline-none select-all"
                id="textarea-modelo-notificacao"></textarea>
            </div>

            <div class="pt-3 border-t border-app flex items-center justify-between gap-3">
              <span class="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
                @if (copiadoComSucesso()) {
                  <mat-icon class="text-xs">check</mat-icon>
                  <span>Texto copiado com sucesso!</span>
                }
              </span>

              <div class="flex items-center gap-2">
                <button 
                  type="button" 
                  (click)="fecharModalNotificacao()"
                  class="btn-secondary text-xs py-2 px-3">
                  Fechar
                </button>

                <button 
                  type="button" 
                  (click)="copiarTextoNotificacao()"
                  class="btn-primary text-xs py-2 px-4 flex items-center gap-1.5"
                  id="btn-copiar-notificacao">
                  <mat-icon class="text-xs">content_copy</mat-icon>
                  <span>Copiar Modelo Formal</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      }

    </div>
  `
})
export class PainelSaudeFiscalMeiComponent {
  readonly saudeFiscalService = inject(SaudeFiscalMeiService);

  readonly analises = computed(() => this.saudeFiscalService.analisesParceiros());
  readonly resumo = computed(() => this.saudeFiscalService.resumoSaudeFiscal());

  readonly filtroStatus = signal<'TODOS' | 'RISCO' | 'ALERTA'>('TODOS');
  readonly executandoAuditoria = signal<boolean>(false);

  readonly modalNotificacaoAberta = signal<boolean>(false);
  readonly parceiroSelecionado = signal<AnaliseRecorrenciaMei | null>(null);
  readonly textoNotificacaoGerado = signal<string>('');
  readonly copiadoComSucesso = signal<boolean>(false);

  readonly Math = Math;

  readonly parceirosEmRisco = computed(() => {
    return this.analises().filter(a => a.status_risco === 'RISCO_DESENQUADRAMENTO');
  });

  readonly totalRisco = computed(() => {
    return this.analises().filter(a => a.status_risco === 'RISCO_DESENQUADRAMENTO').length;
  });

  readonly totalAlerta = computed(() => {
    return this.analises().filter(a => a.status_risco === 'ALERTA_80_PCT').length;
  });

  readonly parceirosFiltrados = computed(() => {
    const filtro = this.filtroStatus();
    const lista = this.analises();

    if (filtro === 'RISCO') {
      return lista.filter(a => a.status_risco === 'RISCO_DESENQUADRAMENTO');
    }
    if (filtro === 'ALERTA') {
      return lista.filter(a => a.status_risco === 'ALERTA_80_PCT');
    }
    return lista;
  });

  reexecutarAuditoria(): void {
    this.executandoAuditoria.set(true);
    setTimeout(() => {
      this.executandoAuditoria.set(false);
    }, 600);
  }

  abrirModalNotificacao(parceiro: AnaliseRecorrenciaMei): void {
    this.parceiroSelecionado.set(parceiro);
    this.textoNotificacaoGerado.set(this.saudeFiscalService.gerarTextoNotificacaoTransicao(parceiro));
    this.copiadoComSucesso.set(false);
    this.modalNotificacaoAberta.set(true);
  }

  fecharModalNotificacao(): void {
    this.modalNotificacaoAberta.set(false);
    this.parceiroSelecionado.set(null);
    this.copiadoComSucesso.set(false);
  }

  copiarTextoNotificacao(): void {
    const texto = this.textoNotificacaoGerado();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(texto).then(() => {
        this.copiadoComSucesso.set(true);
        setTimeout(() => this.copiadoComSucesso.set(false), 3000);
      });
    }
  }
}
