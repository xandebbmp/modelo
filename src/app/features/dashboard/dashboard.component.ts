import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { FinanceStateService } from '../../core/services/finance-state.service';
import { TourGuiadoService } from '../../core/services/tour-guiado.service';
import { CsvExportService } from '../../core/services/csv-export.service';
import { XmlExportService } from '../../core/services/xml-export.service';
import { ConfirmDialogService } from '../../core/services/confirm-dialog.service';
import { FechamentoMensal } from '../../core/models/fechamento.model';
import { WidgetPlanejamentoTributarioGeminiComponent } from '../../shared/components/widget-planejamento-tributario-gemini.component';
import { RelatorioRepasseWidgetComponent } from '../../shared/components/relatorio-repasse.component';
import { GraficoFaturamentoRepassesComponent } from '../../shared/components/grafico-faturamento-repasses.component';
import { PainelAlertasVencimentosComponent } from '../../shared/components/painel-alertas-vencimentos.component';
import { VisaoGeralNfseComponent } from '../../shared/components/visao-geral-nfse.component';
import { CardsKpiDashboardComponent } from '../../shared/components/cards-kpi-dashboard.component';
import { CardsResumoTopoDashboardComponent } from '../../shared/components/cards-resumo-topo-dashboard.component';
import { SimuladorEnquadramentoTributarioComponent } from '../../shared/components/simulador-enquadramento-tributario.component';
import { PainelSaudeFiscalMeiComponent } from '../../shared/components/painel-saude-fiscal-mei.component';
import { PrimeirosPassosChecklistComponent } from '../../shared/components/primeiros-passos-checklist.component';

@Component({
  selector: 'app-dashboard',
  imports: [
    CommonModule, 
    RouterLink, 
    MatIconModule, 
    CardsResumoTopoDashboardComponent,
    PrimeirosPassosChecklistComponent,
    VisaoGeralNfseComponent,
    CardsKpiDashboardComponent,
    WidgetPlanejamentoTributarioGeminiComponent, 
    RelatorioRepasseWidgetComponent,
    GraficoFaturamentoRepassesComponent,
    PainelAlertasVencimentosComponent,
    SimuladorEnquadramentoTributarioComponent,
    PainelSaudeFiscalMeiComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-6 animate-fade-in relative" id="dashboard-page">
      
      <!-- TOAST DE CONFIRMAÇÃO DE DOWNLOAD CSV -->
      @if (toastMensagem()) {
        <div class="fixed bottom-6 right-6 z-50 p-4 rounded-xl bg-[#17324d] text-white shadow-2xl border border-blue-400/30 flex items-center gap-3 animate-fade-in">
          <div class="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
            <mat-icon class="text-xl">file_download_done</mat-icon>
          </div>
          <div class="text-xs">
            <span class="font-bold block text-sm">Exportação CSV Concluída</span>
            <span class="text-blue-200">{{ toastMensagem() }}</span>
          </div>
        </div>
      }

      <!-- CABEÇALHO DO PAINEL GERAL -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 class="text-xl md:text-2xl font-bold text-app-text tracking-tight flex items-center gap-2">
            <mat-icon class="text-[#17324d] dark:text-blue-300">dashboard</mat-icon>
            Visão Geral Financeira & Tributária
          </h1>
          <p class="text-xs text-app-secondary mt-0.5">
            Gestão estratégica de receitas, cotas do salão-parceiro e conformidade fiscal (Simples Nacional).
          </p>
        </div>

        <div class="flex items-center gap-2 flex-wrap">
          
          <!-- BOTÃO TOGGLE MODO LEITURA (ALTO CONTRASTE / MOBILE) -->
          <button 
            type="button" 
            (click)="modoLeitura.set(!modoLeitura())" 
            [class.bg-slate-900]="modoLeitura()"
            [class.text-white]="modoLeitura()"
            [class.border-slate-900]="modoLeitura()"
            [class.dark:bg-white]="modoLeitura()"
            [class.dark:text-black]="modoLeitura()"
            class="btn-secondary text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-all"
            id="btn-toggle-modo-leitura"
            title="Alternar para Modo Leitura com alto contraste e sem distrações visuais para telas móveis">
            <mat-icon class="text-sm">{{ modoLeitura() ? 'visibility' : 'chrome_reader_mode' }}</mat-icon>
            <span>{{ modoLeitura() ? 'Visão Padrão' : 'Modo Leitura' }}</span>
          </button>

          <!-- BOTÃO PRINCIPAL DE EXPORTAÇÃO CSV / XML -->
          <div class="relative inline-block text-left">
            <button 
              type="button" 
              (click)="menuExportacaoAberto.set(!menuExportacaoAberto())" 
              class="btn-secondary text-xs font-bold text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 flex items-center gap-1.5 cursor-pointer shadow-xs"
              id="btn-exportar-csv-dashboard"
              title="Exportar dados de repasses em CSV e XML para Contabilidade e ERPs">
              <mat-icon class="text-sm text-emerald-600 dark:text-emerald-400">download</mat-icon>
              <span>Exportar Dados</span>
              <mat-icon class="text-xs transition-transform duration-200" [class.rotate-180]="menuExportacaoAberto()">expand_more</mat-icon>
            </button>

            <!-- MENU DROPDOWN DE EXPORTAÇÃO (CSV & XML CONTÁBIL) -->
            @if (menuExportacaoAberto()) {
              <div 
                class="origin-top-right absolute right-0 mt-2 w-80 rounded-2xl shadow-2xl bg-surface border border-app divide-y divide-app z-50 overflow-hidden animate-fade-in"
                id="dropdown-menu-exportacao-csv">
                
                <!-- SEÇÃO 1: XML CONTÁBIL (PADRÃO ABRASF / SPED) -->
                <div class="px-4 py-2.5 bg-amber-50/80 dark:bg-amber-950/30">
                  <span class="text-xs font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                    <mat-icon class="text-sm text-amber-600 dark:text-amber-400">code</mat-icon>
                    Exportação XML para Contabilidade
                  </span>
                  <span class="text-[10px] text-amber-800/80 dark:text-amber-400 block">Padrão ABRASF 2.04 & Lei 13.352 (Domínio, Questor, Fortes)</span>
                </div>

                <div class="p-1.5 space-y-1 text-xs">
                  <button 
                    type="button" 
                    (click)="exportarLoteXmlNfse()"
                    class="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 flex items-start gap-2.5 transition-colors group cursor-pointer"
                    id="btn-xml-lote-nfse">
                    <div class="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 mt-0.5 group-hover:scale-105 transition-transform">
                      <mat-icon class="text-base">receipt</mat-icon>
                    </div>
                    <div>
                      <span class="font-bold text-app-text block leading-tight">Lote NFS-e XML (ABRASF 2.04)</span>
                      <span class="text-[10px] text-app-muted">Lote de notas fiscais MEI dos parceiros para escrituração</span>
                    </div>
                  </button>

                  <button 
                    type="button" 
                    (click)="exportarIntegracaoContabilXml()"
                    class="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 flex items-start gap-2.5 transition-colors group cursor-pointer"
                    id="btn-xml-integracao-contabil">
                    <div class="p-1.5 rounded-lg bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-300 mt-0.5 group-hover:scale-105 transition-transform">
                      <mat-icon class="text-base">integration_instructions</mat-icon>
                    </div>
                    <div>
                      <span class="font-bold text-app-text block leading-tight">Integração Contábil Completa (XML)</span>
                      <span class="text-[10px] text-app-muted">Segregação cota-salão, repasses, taxas e conciliação</span>
                    </div>
                  </button>
                </div>

                <!-- SEÇÃO 2: PLANILHAS CSV -->
                <div class="px-4 py-2 bg-slate-50 dark:bg-slate-900/60">
                  <span class="text-xs font-bold text-app-text block">Planilhas Financeiras (CSV)</span>
                  <span class="text-[10px] text-app-muted">Compatível com Excel, Sheets e ERPs (UTF-8 com BOM)</span>
                </div>

                <div class="p-1.5 space-y-1 text-xs">
                  <button 
                    type="button" 
                    (click)="exportarHistoricoRepasses()"
                    class="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 flex items-start gap-2.5 transition-colors group cursor-pointer"
                    id="btn-csv-historico-repasses">
                    <div class="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 mt-0.5 group-hover:scale-105 transition-transform">
                      <mat-icon class="text-base">payments</mat-icon>
                    </div>
                    <div>
                      <span class="font-bold text-app-text block leading-tight">Histórico de Repasses (CSV)</span>
                      <span class="text-[10px] text-app-muted">Fechamentos, cotas MEI/Salão, chaves PIX e NFS-e</span>
                    </div>
                  </button>

                  <button 
                    type="button" 
                    (click)="exportarAnaliticoComandas()"
                    class="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 flex items-start gap-2.5 transition-colors group cursor-pointer"
                    id="btn-csv-analitico-comandas">
                    <div class="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 mt-0.5 group-hover:scale-105 transition-transform">
                      <mat-icon class="text-base">receipt_long</mat-icon>
                    </div>
                    <div>
                      <span class="font-bold text-app-text block leading-tight">Comandas & Rateio Analítico</span>
                      <span class="text-[10px] text-app-muted">Todas as vendas com taxas de operadora descontadas</span>
                    </div>
                  </button>

                  <button 
                    type="button" 
                    (click)="exportarConciliacaoTributaria()"
                    class="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 flex items-start gap-2.5 transition-colors group cursor-pointer"
                    id="btn-csv-conciliacao-simples">
                    <div class="p-1.5 rounded-lg bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 mt-0.5 group-hover:scale-105 transition-transform">
                      <mat-icon class="text-base">account_balance</mat-icon>
                    </div>
                    <div>
                      <span class="font-bold text-app-text block leading-tight">Conciliação Simples Nacional</span>
                      <span class="text-[10px] text-app-muted">Base de cálculo da empresa e economia tributária</span>
                    </div>
                  </button>
                </div>

                <div class="p-2 bg-slate-50 dark:bg-slate-900/40 text-center">
                  <button 
                    type="button" 
                    (click)="menuExportacaoAberto.set(false)" 
                    class="text-[11px] text-app-secondary hover:text-app-text font-medium">
                    Fechar Menu
                  </button>
                </div>
              </div>
            }
          </div>

          <button 
            type="button" 
            (click)="tourService.iniciarTour()" 
            class="btn-secondary text-xs text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-800"
            id="btn-tour-dashboard"
            title="Iniciar Tour Guiado do Sistema">
            <mat-icon class="text-sm text-blue-600 dark:text-blue-400">help_outline</mat-icon> 
            <span>Tour Guiado</span>
          </button>

          <button 
            type="button" 
            (click)="financeState.modoSimuladorMobile.set(true)" 
            class="btn-secondary text-xs">
            <mat-icon class="text-sm">smartphone</mat-icon> Simular App do MEI
          </button>
          
          <a routerLink="/painel-parceiros" class="btn-primary text-xs">
            <mat-icon class="text-sm">badge</mat-icon> Painel do Profissional MEI
          </a>
        </div>
      </div>

      <!-- MODO LEITURA ATIVO (ALTO CONTRASTE, SEM ELEMENTOS DECORATIVOS, FORMATO MOBILE) -->
      @if (modoLeitura()) {
        <div class="space-y-5 animate-fade-in" id="modo-leitura-container">
          
          <!-- BANNER DO MODO LEITURA -->
          <div class="p-4 rounded-xl border-2 border-slate-900 dark:border-white bg-slate-900 text-white dark:bg-white dark:text-slate-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
            <div class="flex items-center gap-3">
              <mat-icon class="text-2xl">chrome_reader_mode</mat-icon>
              <div>
                <h2 class="text-base font-black tracking-tight leading-none">Modo Leitura Ativo</h2>
                <p class="text-xs opacity-90 mt-1">Interface simplificada em alto contraste, sem gráficos ou efeitos decorativos.</p>
              </div>
            </div>

            <div class="flex items-center gap-2">
              <button 
                type="button" 
                (click)="exportarHistoricoRepasses()"
                class="px-3 py-1.5 rounded-lg text-xs font-bold border-2 border-current hover:opacity-80 flex items-center gap-1 cursor-pointer">
                <mat-icon class="text-xs">table_view</mat-icon>
                <span>Baixar CSV</span>
              </button>

              <button 
                type="button" 
                (click)="modoLeitura.set(false)"
                class="px-3 py-1.5 rounded-lg text-xs font-black bg-white text-slate-950 dark:bg-slate-950 dark:text-white border-2 border-current hover:opacity-90 flex items-center gap-1 cursor-pointer"
                id="btn-sair-modo-leitura">
                <mat-icon class="text-xs">close</mat-icon>
                <span>Voltar ao Padrão</span>
              </button>
            </div>
          </div>

          <!-- MÉTRICAS ESSENCIAIS EM ALTO CONTRASTE (4 CARDS VERTICAIS/GRID) -->
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            
            <!-- CARD 1: PRODUÇÃO BRUTA -->
            <div class="p-4 rounded-xl border-2 border-slate-900 dark:border-white bg-white dark:bg-black text-slate-950 dark:text-white space-y-1">
              <span class="text-xs font-extrabold uppercase tracking-wider block opacity-75">1. Faturamento Total</span>
              <div class="text-2xl font-black font-mono">
                R$ {{ financeState.totalProducaoBrutaMes() | number:'1.2-2' }}
              </div>
              <p class="text-xs font-medium opacity-80">Total bruto movimentado pela equipe no salão.</p>
            </div>

            <!-- CARD 2: REPASSES AOS MEIS (DEDUÇÃO LEGAL) -->
            <div class="p-4 rounded-xl border-2 border-slate-900 dark:border-white bg-white dark:bg-black text-slate-950 dark:text-white space-y-1">
              <span class="text-xs font-extrabold uppercase tracking-wider block opacity-75">2. Repasses aos MEIs (Dedução)</span>
              <div class="text-2xl font-black font-mono">
                R$ {{ financeState.totalRepassesMeiMes() | number:'1.2-2' }}
              </div>
              <p class="text-xs font-medium opacity-80">Cota dos parceiros dedutível da base fiscal (Lei 13.352).</p>
            </div>

            <!-- CARD 3: COTA RETIDA SALÃO (BASE SIMPLES) -->
            <div class="p-4 rounded-xl border-2 border-slate-900 dark:border-white bg-white dark:bg-black text-slate-950 dark:text-white space-y-1">
              <span class="text-xs font-extrabold uppercase tracking-wider block opacity-75">3. Cota Salão (Base Imposto)</span>
              <div class="text-2xl font-black font-mono">
                R$ {{ financeState.totalCotaSalaoMes() | number:'1.2-2' }}
              </div>
              <p class="text-xs font-medium opacity-80">Receita própria real tributável no Simples Nacional.</p>
            </div>

            <!-- CARD 4: ECONOMIA TRIBUTÁRIA -->
            <div class="p-4 rounded-xl border-2 border-slate-900 dark:border-white bg-white dark:bg-black text-slate-950 dark:text-white space-y-1">
              <span class="text-xs font-extrabold uppercase tracking-wider block opacity-75">4. Economia Tributária</span>
              <div class="text-2xl font-black font-mono text-emerald-700 dark:text-emerald-300">
                R$ {{ financeState.economiaTributariaMensalLei13352() | number:'1.2-2' }}
              </div>
              <p class="text-xs font-medium opacity-80">Imposto evitado mensalmente sem bitributação.</p>
            </div>

          </div>

          <!-- LISTA DE REPASSES POR PROFISSIONAL (LEITURA RÁPIDA EM FORMATO CARD MOBILE) -->
          <div class="rounded-xl border-2 border-slate-900 dark:border-white bg-white dark:bg-black text-slate-950 dark:text-white p-4 space-y-4">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b-2 border-slate-900 dark:border-white pb-3">
              <div>
                <h3 class="text-base font-black uppercase tracking-tight">Repasses e Fechamentos da Equipe</h3>
                <p class="text-xs font-medium opacity-80">Detalhamento individual de produção, taxas e valores líquidos a transferir.</p>
              </div>
              <span class="text-xs font-black font-mono px-2.5 py-1 rounded-md border border-current">
                {{ financeState.fechamentos().length }} Profissionais Cadastrados
              </span>
            </div>

            <div class="space-y-3">
              @for (fech of financeState.fechamentos(); track fech.id; let idx = $index) {
                <div class="p-3.5 rounded-lg border-2 border-slate-300 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  
                  <!-- DADOS DO PROFISSIONAL -->
                  <div class="space-y-1">
                    <div class="flex items-center gap-2">
                      <span class="text-xs font-black font-mono px-1.5 py-0.5 rounded bg-slate-900 text-white dark:bg-white dark:text-black">
                        #{{ idx + 1 }}
                      </span>
                      <h4 class="text-sm font-black">{{ getParceiroNome(fech.id_parceiro) }}</h4>
                    </div>
                    <div class="text-xs font-medium opacity-80 space-y-0.5">
                      <p>Especialidade: <strong class="font-bold">{{ getParceiroEspecialidade(fech.id_parceiro) }}</strong></p>
                      <p>Chave PIX: <strong class="font-mono font-bold">{{ fech.chave_pix_pagamento || 'CNPJ do MEI' }}</strong></p>
                    </div>
                  </div>

                  <!-- VALORES NUMÉRICOS EM ALTO CONTRASTE -->
                  <div class="grid grid-cols-3 gap-3 text-center sm:text-left py-2 sm:py-0 border-y sm:border-y-0 border-slate-200 dark:border-zinc-800">
                    <div>
                      <span class="text-[10px] font-bold uppercase opacity-70 block">Produção Bruta</span>
                      <span class="text-xs font-black font-mono">R$ {{ fech.valor_bruto_producao | number:'1.2-2' }}</span>
                    </div>
                    <div>
                      <span class="text-[10px] font-bold uppercase opacity-70 block">Cota Salão</span>
                      <span class="text-xs font-black font-mono">R$ {{ fech.valor_cota_empresa | number:'1.2-2' }}</span>
                    </div>
                    <div>
                      <span class="text-[10px] font-bold uppercase opacity-70 block">Líquido Repasse</span>
                      <span class="text-sm font-black font-mono text-emerald-800 dark:text-emerald-300">R$ {{ fech.valor_liquido_nota | number:'1.2-2' }}</span>
                    </div>
                  </div>

                  <!-- STATUS E AÇÕES -->
                  <div class="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                    <div>
                      @if (fech.status === 'PAGO' || fech.status === 'NOTA_EMITIDA') {
                        <span class="text-xs font-black font-mono px-2 py-1 rounded bg-emerald-100 text-emerald-950 dark:bg-emerald-950 dark:text-emerald-200 border border-emerald-500">
                          NFS-e {{ fech.numero_nota_mei }}
                        </span>
                      } @else {
                        <span class="text-xs font-black font-mono px-2 py-1 rounded bg-amber-100 text-amber-950 dark:bg-amber-950 dark:text-amber-200 border border-amber-500">
                          Pendente NFS-e
                        </span>
                      }
                    </div>

                    <div>
                      @if (fech.status === 'PENDENTE_EMISSAO') {
                        <button 
                          type="button" 
                          (click)="financeState.emitirNotaFiscalMei1Clique(fech.id)"
                          class="px-3 py-1.5 rounded-lg text-xs font-black bg-slate-900 text-white dark:bg-white dark:text-black border-2 border-current hover:opacity-90 cursor-pointer">
                          Emitir NFS-e
                        </button>
                      } @else if (fech.status === 'NOTA_EMITIDA') {
                        <button 
                          type="button" 
                          (click)="financeState.confirmarPagamentoRepassePix(fech.id)"
                          class="px-3 py-1.5 rounded-lg text-xs font-black bg-emerald-700 text-white dark:bg-emerald-400 dark:text-black border-2 border-current hover:opacity-90 cursor-pointer">
                          Pagar PIX
                        </button>
                      } @else {
                        <span class="text-xs font-black text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                          <mat-icon class="text-sm">check_circle</mat-icon> Pago
                        </span>
                      }
                    </div>
                  </div>

                </div>
              }
            </div>
          </div>

          <!-- PRAZOS FISCAIS EM ALTO CONTRASTE -->
          <div class="rounded-xl border-2 border-slate-900 dark:border-white bg-white dark:bg-black text-slate-950 dark:text-white p-4 space-y-3">
            <h3 class="text-sm font-black uppercase tracking-tight border-b border-current pb-2">Prazos Fiscais & Vencimentos</h3>
            
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-medium">
              <div class="p-3 rounded-lg border border-slate-300 dark:border-zinc-700 space-y-1">
                <span class="font-black block uppercase text-[10px] opacity-75">Guia DAS Simples Nacional</span>
                <p class="text-sm font-black font-mono">Vencimento: Dia 20/09/2026</p>
                <p class="text-[11px] opacity-80">Apuração com segregação de receitas Lei 13.352.</p>
              </div>

              <div class="p-3 rounded-lg border border-slate-300 dark:border-zinc-700 space-y-1">
                <span class="font-black block uppercase text-[10px] opacity-75">Prazo de Emissão NFS-e dos MEIs</span>
                <p class="text-sm font-black font-mono">Até o dia 05 do mês seguinte</p>
                <p class="text-[11px] opacity-80">Exigência para liberação de repasses bancários.</p>
              </div>

              <div class="p-3 rounded-lg border border-slate-300 dark:border-zinc-700 space-y-1">
                <span class="font-black block uppercase text-[10px] opacity-75">Contratos Homologados</span>
                <p class="text-sm font-black text-emerald-700 dark:text-emerald-300">100% Homologados</p>
                <p class="text-[11px] opacity-80">Sindicato da Categoria / MTE em conformidade.</p>
              </div>
            </div>
          </div>

          <!-- BOTÃO INFERIOR PARA VOLTAR À VISÃO PADRÃO -->
          <div class="text-center pt-2">
            <button 
              type="button" 
              (click)="modoLeitura.set(false)"
              class="px-4 py-2 rounded-xl text-xs font-bold border-2 border-slate-900 dark:border-white bg-white dark:bg-black text-slate-950 dark:text-white hover:bg-slate-100 dark:hover:bg-zinc-900 transition-colors inline-flex items-center gap-1.5 cursor-pointer">
              <mat-icon class="text-sm">arrow_back</mat-icon>
              <span>Retornar para a Visão Padrão Completa</span>
            </button>
          </div>

        </div>
      } @else {

        <!-- NAVEGAÇÃO POR ABAS NO PAINEL PRINCIPAL -->
        <div class="flex items-center gap-2 border-b border-app pb-2 overflow-x-auto">
          <button 
            type="button" 
            (click)="abaAtiva.set('VISAO_GERAL')"
            [class.bg-[#17324d]]="abaAtiva() === 'VISAO_GERAL'"
            [class.text-white]="abaAtiva() === 'VISAO_GERAL'"
            [class.border-[#17324d]]="abaAtiva() === 'VISAO_GERAL'"
            [class.bg-surface]="abaAtiva() !== 'VISAO_GERAL'"
            [class.text-app-secondary]="abaAtiva() !== 'VISAO_GERAL'"
            class="px-4 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-2 shadow-xs cursor-pointer shrink-0"
            id="tab-visao-geral">
            <mat-icon class="text-sm">grid_view</mat-icon>
            <span>Visão Geral & Indicadores</span>
          </button>

          <button 
            type="button" 
            (click)="abaAtiva.set('SAUDE_FISCAL_MEI')"
            [class.bg-[#17324d]]="abaAtiva() === 'SAUDE_FISCAL_MEI'"
            [class.text-white]="abaAtiva() === 'SAUDE_FISCAL_MEI'"
            [class.border-[#17324d]]="abaAtiva() === 'SAUDE_FISCAL_MEI'"
            [class.bg-surface]="abaAtiva() !== 'SAUDE_FISCAL_MEI'"
            [class.text-app-secondary]="abaAtiva() !== 'SAUDE_FISCAL_MEI'"
            class="px-4 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-2 shadow-xs cursor-pointer shrink-0"
            id="tab-saude-fiscal-mei">
            <mat-icon class="text-sm text-emerald-400">health_and_safety</mat-icon>
            <span>Saúde Fiscal MEI</span>
            <span class="px-1.5 py-0.2 rounded-full text-[9px] font-extrabold bg-rose-500 text-white animate-pulse">Alerta</span>
          </button>

          <button 
            type="button" 
            (click)="abaAtiva.set('SIMULADOR_TRIBUTARIO')"
            [class.bg-[#17324d]]="abaAtiva() === 'SIMULADOR_TRIBUTARIO'"
            [class.text-white]="abaAtiva() === 'SIMULADOR_TRIBUTARIO'"
            [class.border-[#17324d]]="abaAtiva() === 'SIMULADOR_TRIBUTARIO'"
            [class.bg-surface]="abaAtiva() !== 'SIMULADOR_TRIBUTARIO'"
            [class.text-app-secondary]="abaAtiva() !== 'SIMULADOR_TRIBUTARIO'"
            class="px-4 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-2 shadow-xs cursor-pointer shrink-0"
            id="tab-simulador-tributario">
            <mat-icon class="text-sm text-amber-400">calculate</mat-icon>
            <span>Simulador de Enquadramento (Anexo III vs V)</span>
          </button>
        </div>

        <!-- CONTEÚDO DA ABA: SAÚDE FISCAL MEI & ANÁLISE DE RECORRÊNCIA -->
        @if (abaAtiva() === 'SAUDE_FISCAL_MEI') {
          <div class="space-y-6 animate-tab-enter">
            <app-painel-saude-fiscal-mei></app-painel-saude-fiscal-mei>
          </div>
        }

        <!-- CONTEÚDO DA ABA: SIMULADOR DE ENQUADRAMENTO TRIBUTÁRIO -->
        @if (abaAtiva() === 'SIMULADOR_TRIBUTARIO') {
          <div class="space-y-6 animate-tab-enter">
            <app-simulador-enquadramento-tributario></app-simulador-enquadramento-tributario>
            
            <!-- CONSULTORIA TRIBUTÁRIA COMPLEMENTAR GEMINI -->
            <app-widget-planejamento-tributario-gemini></app-widget-planejamento-tributario-gemini>
          </div>
        }

        <!-- CONTEÚDO DA ABA: VISÃO GERAL -->
        @if (abaAtiva() === 'VISAO_GERAL') {
          <div class="space-y-6 animate-tab-enter">
            <!-- CARDS DE RESUMO DO TOPO: NÚMEROS CHAVE COM ANIMAÇÃO SUAVE -->
            <app-cards-resumo-topo-dashboard></app-cards-resumo-topo-dashboard>

            <!-- CHECK-LIST DE PRIMEIROS PASSOS & CONFIGURAÇÕES FISCAIS PENDENTES -->
            <app-primeiros-passos-checklist></app-primeiros-passos-checklist>

            <!-- CARDS KPI DE DESTAQUE COM FATURAMENTO BRUTO, REPASSES MEI, MARGEM LÍQUIDA E ECONOMIA -->
            <app-cards-kpi-dashboard></app-cards-kpi-dashboard>

            <!-- COMPONENTE DE VISÃO GERAL DE NFS-e (CARTÕES INTERATIVOS DE STATUS NO TOPO) -->
            <app-visao-geral-nfse></app-visao-geral-nfse>

            <!-- PAINEL DE ALERTAS & PRAZOS FISCAIS / REPASSES -->
            <app-painel-alertas-vencimentos></app-painel-alertas-vencimentos>

            <!-- GRÁFICO COMPARATIVO D3: EVOLUÇÃO DO FATURAMENTO VS REPASSES AOS MEIS -->
            <app-grafico-faturamento-repasses></app-grafico-faturamento-repasses>

            <!-- WIDGET CONSULTORIA TRIBUTÁRIA GEMINI AI -->
            <app-widget-planejamento-tributario-gemini></app-widget-planejamento-tributario-gemini>

            <!-- WIDGET RELATÓRIO DE REPASSE & TAXAS DE OPERADORA -->
            <app-relatorio-repasse-widget></app-relatorio-repasse-widget>

            <!-- TABELA RÁPIDA DE FECHAMENTOS DO MÊS -->
            <div class="card-corporate overflow-hidden">
              <div class="p-4 border-b border-app flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 class="text-sm font-bold text-app-text">Fechamentos e Repasses Recentes</h3>
                  <p class="text-xs text-app-secondary">Resumo do repasse de cotas dos profissionais da equipe.</p>
                </div>
                
                <div class="flex items-center gap-2">
                  <button 
                    type="button" 
                    (click)="exportarHistoricoRepasses()"
                    class="btn-secondary text-xs py-1 px-2.5 flex items-center gap-1 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900"
                    id="btn-baixar-csv-fechamentos-recentes"
                    title="Baixar histórico de fechamentos em formato CSV">
                    <mat-icon class="text-xs text-emerald-600 dark:text-emerald-400">table_view</mat-icon>
                    <span>Baixar CSV</span>
                  </button>

                  <a routerLink="/fechamentos" class="text-xs text-blue-600 dark:text-blue-400 font-bold hover:underline">
                    Ver Todos os Fechamentos
                  </a>
                </div>
              </div>

              <div class="overflow-x-auto">
                <table class="table-corporate text-xs">
                  <thead>
                    <tr>
                      <th>Profissional Parceiro</th>
                      <th>Especialidade</th>
                      <th>Produção Bruta</th>
                      <th>Cota Salão</th>
                      <th>Repasse Líquido</th>
                      <th>Status NFS-e MEI</th>
                      <th class="text-right">Ação</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (fech of financeState.fechamentos(); track fech.id) {
                      <tr>
                        <td class="font-bold text-app-text">
                          {{ getParceiroNome(fech.id_parceiro) }}
                        </td>
                        <td class="text-app-secondary">
                          {{ getParceiroEspecialidade(fech.id_parceiro) }}
                        </td>
                        <td class="font-mono text-app-text font-semibold">
                          R$ {{ fech.valor_bruto_producao | number:'1.2-2' }}
                        </td>
                        <td class="font-mono text-[#b66a3c] font-semibold">
                          R$ {{ fech.valor_cota_empresa | number:'1.2-2' }}
                        </td>
                        <td class="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          R$ {{ fech.valor_liquido_nota | number:'1.2-2' }}
                        </td>
                        <td>
                          @if (fech.status === 'PAGO' || fech.status === 'NOTA_EMITIDA') {
                            <span class="status-badge status-badge-success text-[10px]">
                              NFS-e Emitida ({{ fech.numero_nota_mei }})
                            </span>
                          } @else {
                            <span class="status-badge status-badge-warning text-[10px]">
                              Pendente Emissão
                            </span>
                          }
                        </td>
                        <td class="text-right">
                          @if (fech.status === 'PENDENTE_EMISSAO') {
                            <button 
                              type="button" 
                              (click)="emitirNfseRapida(fech)"
                              class="btn-primary py-1 px-2.5 text-xs cursor-pointer">
                              <mat-icon class="text-xs">touch_app</mat-icon> Emitir NFS-e
                            </button>
                          } @else if (fech.status === 'NOTA_EMITIDA') {
                            <button 
                              type="button" 
                              (click)="pagarPixRapido(fech)"
                              class="btn-accent py-1 px-2.5 text-xs cursor-pointer">
                              <mat-icon class="text-xs">pix</mat-icon> Pagar PIX
                            </button>
                          } @else {
                            <span class="text-[11px] text-emerald-600 font-bold flex items-center justify-end gap-1">
                              <mat-icon class="text-xs">check_circle</mat-icon> Liquidado
                            </span>
                          }
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        }

      }

    </div>
  `
})
export class DashboardComponent {
  readonly financeState = inject(FinanceStateService);
  readonly tourService = inject(TourGuiadoService);
  readonly csvExportService = inject(CsvExportService);
  readonly xmlExportService = inject(XmlExportService);
  readonly confirmDialog = inject(ConfirmDialogService);

  readonly abaAtiva = signal<'VISAO_GERAL' | 'SIMULADOR_TRIBUTARIO' | 'SAUDE_FISCAL_MEI'>('VISAO_GERAL');
  readonly modoLeitura = signal<boolean>(false);
  readonly menuExportacaoAberto = signal<boolean>(false);
  readonly toastMensagem = signal<string | null>(null);

  getParceiroNome(idParceiro: string): string {
    const p = this.financeState.parceiros().find(item => item.id === idParceiro);
    return p?.nome_fantasia || p?.razao_social || 'Profissional';
  }

  getParceiroEspecialidade(idParceiro: string): string {
    const p = this.financeState.parceiros().find(item => item.id === idParceiro);
    return p?.especialidade || 'Serviços de Beleza';
  }

  async exportarLoteXmlNfse(): Promise<void> {
    this.menuExportacaoAberto.set(false);
    const confirmou = await this.confirmDialog.confirmExport(
      'XML',
      'Lote Fiscal de NFS-e (Padrão ABRASF 2.04 / SPED Nacional)',
      {
        details: [
          { label: 'Formato', value: 'XML (Padrão ABRASF 2.04 / SPED para Escrituração)' },
          { label: 'Documentos', value: `${this.financeState.fechamentos().length} declarações de repasse` },
          { label: 'Sistemas Compatíveis', value: 'Domínio, Questor, Alterdata, Fortes, Prosoft, Contmatic' }
        ]
      }
    );

    if (confirmou) {
      this.xmlExportService.exportarLoteNfseXml();
      this.exibirToastFeedback('Lote de NFS-e em XML exportado com sucesso para contabilidade (.XML)');
    }
  }

  async exportarIntegracaoContabilXml(): Promise<void> {
    this.menuExportacaoAberto.set(false);
    const confirmou = await this.confirmDialog.confirmExport(
      'XML',
      'Arquivo de Integração Contábil & Fiscal (Lei 13.352/2016)',
      {
        details: [
          { label: 'Formato', value: 'XML (Estrutura de dados contábeis Salão-Parceiro)' },
          { label: 'Contém', value: 'Segregação cota-salão, deduções de taxas, PIX e NFS-e vinculadas' },
          { label: 'Finalidade', value: 'Importação contábil para apuração do Simples Nacional' }
        ]
      }
    );

    if (confirmou) {
      this.xmlExportService.exportarIntegracaoContabilXml();
      this.exibirToastFeedback('Arquivo de integração contábil XML gerado e baixado (.XML)');
    }
  }

  async exportarHistoricoRepasses(): Promise<void> {
    this.menuExportacaoAberto.set(false);
    const confirmou = await this.confirmDialog.confirmExport(
      'CSV',
      'Histórico Consolidado de Repasses e Fechamentos MEI',
      {
        details: [
          { label: 'Formato', value: 'CSV (Compatível com Microsoft Excel e Google Sheets)' },
          { label: 'Registros', value: `${this.financeState.fechamentos().length} competências apuradas` },
          { label: 'Finalidade', value: 'Auditoria fiscal e conciliação bancária' }
        ]
      }
    );

    if (confirmou) {
      this.csvExportService.exportarHistoricoCompletoRepassesCSV();
      this.exibirToastFeedback('Histórico de repasses consolidado exportado com sucesso (.CSV)');
    }
  }

  async exportarAnaliticoComandas(): Promise<void> {
    this.menuExportacaoAberto.set(false);
    const confirmou = await this.confirmDialog.confirmExport(
      'CSV',
      'Relatório Analítico de Vendas, Comandas e Rateio de Taxas',
      {
        details: [
          { label: 'Formato', value: 'CSV (Valores brutos, taxas de maquininha e cota líquida)' },
          { label: 'Empresa', value: `${this.financeState.empresaAtiva().razao_social}` },
          { label: 'Base Legal', value: 'Lei 13.352/2016 (Salão-Parceiro)' }
        ]
      }
    );

    if (confirmou) {
      this.csvExportService.exportarHistoricoAnaliticoVendasCSV();
      this.exibirToastFeedback('Relatório analítico de vendas e rateio de taxas exportado (.CSV)');
    }
  }

  async exportarConciliacaoTributaria(): Promise<void> {
    this.menuExportacaoAberto.set(false);
    const confirmou = await this.confirmDialog.confirmExport(
      'CSV',
      'Conciliação do Simples Nacional e Economia Fiscal Gerada',
      {
        details: [
          { label: 'Formato', value: 'CSV (Demonstrativo de bitributação evitada)' },
          { label: 'Economia Calculada', value: `R$ ${this.financeState.economiaTributariaMensalLei13352().toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` }
        ]
      }
    );

    if (confirmou) {
      this.csvExportService.exportarConciliacaoTributariaCsv();
      this.exibirToastFeedback('Conciliação Simples Nacional e economia fiscal exportada (.CSV)');
    }
  }

  async emitirNfseRapida(fech: FechamentoMensal): Promise<void> {
    const parceiroNome = this.getParceiroNome(fech.id_parceiro);
    const confirmou = await this.confirmDialog.confirmFiscal(
      'Transmitir e Autorizar NFS-e Nacional MEI',
      `Deseja autorizar a emissão da NFS-e referente aos serviços prestados por "${parceiroNome}" no valor de R$ ${fech.valor_liquido_nota.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}?`,
      {
        highlightItem: {
          title: parceiroNome,
          subtitle: `Competência: ${fech.mes_referencia}/${fech.ano_referencia}`,
          badge: `R$ ${fech.valor_liquido_nota.toFixed(2)}`
        },
        details: [
          { label: 'Tomador (Salão)', value: this.financeState.empresaAtiva().razao_social },
          { label: 'Natureza da Operação', value: 'Prestação de Serviço de Beleza (MEI - Salão-Parceiro)' }
        ],
        confirmText: 'Emitir NFS-e Agora'
      }
    );

    if (confirmou) {
      this.financeState.emitirNotaFiscalMei1Clique(fech.id);
      this.exibirToastFeedback(`NFS-e de ${parceiroNome} emitida com sucesso!`);
    }
  }

  async pagarPixRapido(fech: FechamentoMensal): Promise<void> {
    const parceiroNome = this.getParceiroNome(fech.id_parceiro);
    const parceiro = this.financeState.parceiros().find(p => p.id === fech.id_parceiro);
    const confirmou = await this.confirmDialog.confirmFinancial(
      'Confirmar Liquidação de Repasse PIX',
      `Confirma a liquidação do repasse de R$ ${fech.valor_liquido_nota.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} para a chave PIX do profissional parceiro?`,
      {
        highlightItem: {
          title: parceiroNome,
          subtitle: `Chave PIX: ${parceiro?.chave_pix_padrao || parceiro?.cnpj || 'CNPJ do MEI'}`,
          badge: `R$ ${fech.valor_liquido_nota.toFixed(2)}`
        },
        details: [
          { label: 'Valor Líquido MEI', value: `R$ ${fech.valor_liquido_nota.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` },
          { label: 'NFS-e Vinculada', value: fech.numero_nota_mei || 'Autorizada' },
          { label: 'Comprovante', value: 'Geração automática de recibo timbrado' }
        ],
        confirmText: 'Confirmar Pagamento PIX'
      }
    );

    if (confirmou) {
      this.financeState.confirmarPagamentoRepassePix(fech.id);
      this.exibirToastFeedback(`Repasse PIX de R$ ${fech.valor_liquido_nota.toFixed(2)} liquidado para ${parceiroNome}!`);
    }
  }

  private exibirToastFeedback(mensagem: string): void {
    this.toastMensagem.set(mensagem);
    setTimeout(() => {
      this.toastMensagem.set(null);
    }, 4500);
  }
}
