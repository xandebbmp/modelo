import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { FinanceStateService } from '../../core/services/finance-state.service';
import { NotaFiscal } from '../../core/models/nota-fiscal.model';
import { LeitorXmlNfseComponent } from './leitor-xml-nfse.component';

@Component({
  selector: 'app-visao-geral-nfse',
  imports: [CommonModule, FormsModule, RouterLink, MatIconModule, LeitorXmlNfseComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="card-corporate p-4 sm:p-5 space-y-4 shadow-sm" id="visao-geral-nfse-widget">
      
      <!-- CABEÇALHO DA VISÃO GERAL NFS-e -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-app">
        <div class="flex items-center gap-3">
          <div class="p-2.5 rounded-xl bg-blue-100 dark:bg-blue-950 text-[#17324d] dark:text-blue-300">
            <mat-icon class="text-xl">receipt_long</mat-icon>
          </div>
          <div>
            <div class="flex items-center gap-2 flex-wrap">
              <h2 class="font-bold text-sm sm:text-base text-app-text flex items-center gap-1.5">
                Visão Geral das Notas Fiscais Eletrônicas (NFS-e)
              </h2>
              <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                Sincronismo Prefeitura / SEFAZ
              </span>
            </div>
            <p class="text-xs text-app-secondary mt-0.5">
              Acompanhamento em tempo real de emissões, lotes de repasses MEI e status de autorização fiscal.
            </p>
          </div>
        </div>

        <!-- AÇÕES RÁPIDAS NO TOPO -->
        <div class="flex items-center gap-2 flex-wrap">
          <button 
            type="button" 
            (click)="mostrarLeitorXml.set(!mostrarLeitorXml())"
            [class.bg-indigo-600]="mostrarLeitorXml()"
            [class.text-white]="mostrarLeitorXml()"
            class="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5 hover:text-app-text">
            <mat-icon class="text-sm">upload_file</mat-icon>
            <span>{{ mostrarLeitorXml() ? 'Ocultar Leitor XML' : 'Importar XML NFS-e' }}</span>
          </button>

          @if (financeState.resumoNfse().pendentesQtd > 0) {
            <button 
              type="button" 
              (click)="transmitirTodasPendentes()"
              class="btn-primary text-xs py-1.5 px-3 bg-amber-600 hover:bg-amber-700 text-white border-amber-700 flex items-center gap-1.5 shadow-xs">
              <mat-icon class="text-sm">send</mat-icon>
              <span>Transmitir Pendentes ({{ financeState.resumoNfse().pendentesQtd }})</span>
            </button>
          }

          @if (financeState.resumoNfse().comErroQtd > 0) {
            <button 
              type="button" 
              (click)="reprocessarTodasComErro()"
              class="btn-primary text-xs py-1.5 px-3 bg-rose-600 hover:bg-rose-700 text-white border-rose-700 flex items-center gap-1.5 shadow-xs">
              <mat-icon class="text-sm">restart_alt</mat-icon>
              <span>Reprocessar com Erro ({{ financeState.resumoNfse().comErroQtd }})</span>
            </button>
          }

          <a 
            routerLink="/notas-fiscais" 
            class="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1 hover:text-app-text">
            <span>Central NFS-e</span>
            <mat-icon class="text-sm">open_in_new</mat-icon>
          </a>
        </div>
      </div>

      <!-- LEITOR DE ARQUIVOS XML EXPANSÍVEL -->
      @if (mostrarLeitorXml()) {
        <div class="animate-fade-in pb-2">
          <app-leitor-xml-nfse></app-leitor-xml-nfse>
        </div>
      }

      <!-- FEEDBACK DE SUCESSO / NOTIFICAÇÃO TEMPORÁRIA -->
      @if (mensagemSucesso()) {
        <div class="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs flex items-center justify-between gap-2 animate-fade-in">
          <div class="flex items-center gap-2">
            <mat-icon class="text-sm">check_circle</mat-icon>
            <span>{{ mensagemSucesso() }}</span>
          </div>
          <button type="button" (click)="mensagemSucesso.set(null)" class="text-emerald-700 hover:text-emerald-900">
            <mat-icon class="text-xs">close</mat-icon>
          </button>
        </div>
      }

      <!-- 4 CARTÕES DE RESUMO INTERATIVOS (STATUS DAS NOTAS) -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        
        <!-- CARD 1: PROCESSADAS / AUTORIZADAS -->
        <div 
          role="button"
          tabindex="0"
          (click)="selecionarFiltroStatus('AUTORIZADA')"
          (keydown.enter)="selecionarFiltroStatus('AUTORIZADA')"
          (keydown.space)="selecionarFiltroStatus('AUTORIZADA')"
          class="p-4 rounded-xl border transition-all cursor-pointer select-none text-left relative overflow-hidden"
          [class.border-emerald-500]="filtroStatusSelecionado() === 'AUTORIZADA'"
          [class.ring-2]="filtroStatusSelecionado() === 'AUTORIZADA'"
          [class.ring-emerald-500/20]="filtroStatusSelecionado() === 'AUTORIZADA'"
          [class.bg-emerald-50/50]="filtroStatusSelecionado() === 'AUTORIZADA'"
          [class.dark:bg-emerald-950/30]="filtroStatusSelecionado() === 'AUTORIZADA'"
          [class.border-app]="filtroStatusSelecionado() !== 'AUTORIZADA'"
          [class.bg-surface]="filtroStatusSelecionado() !== 'AUTORIZADA'"
          [class.hover:border-emerald-300]="filtroStatusSelecionado() !== 'AUTORIZADA'">
          
          <div class="flex items-center justify-between mb-2">
            <span class="text-[11px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
              <span class="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Processadas
            </span>
            <div class="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
              <mat-icon class="text-sm">verified</mat-icon>
            </div>
          </div>

          <div class="space-y-1">
            <div class="flex items-baseline gap-2">
              <span class="text-2xl font-black font-mono text-emerald-700 dark:text-emerald-300">
                {{ financeState.resumoNfse().processadasQtd }}
              </span>
              <span class="text-xs text-app-muted font-medium">notas autorizadas</span>
            </div>
            <div class="font-mono font-bold text-xs text-app-text">
              R$ {{ financeState.resumoNfse().processadasValor | number:'1.2-2' }}
            </div>
          </div>

          <div class="mt-3 pt-2.5 border-t border-emerald-200/60 dark:border-emerald-800/60 flex items-center justify-between text-[11px]">
            <span class="text-emerald-700 dark:text-emerald-400 font-medium">Validado na Prefeitura</span>
            <span class="font-bold text-emerald-600 flex items-center gap-0.5">
              Ver lista <mat-icon class="text-xs">chevron_right</mat-icon>
            </span>
          </div>
        </div>

        <!-- CARD 2: PENDENTES DE EMISSÃO / FILA -->
        <div 
          role="button"
          tabindex="0"
          (click)="selecionarFiltroStatus('PENDENTE')"
          (keydown.enter)="selecionarFiltroStatus('PENDENTE')"
          (keydown.space)="selecionarFiltroStatus('PENDENTE')"
          class="p-4 rounded-xl border transition-all cursor-pointer select-none text-left relative overflow-hidden"
          [class.border-amber-500]="filtroStatusSelecionado() === 'PENDENTE'"
          [class.ring-2]="filtroStatusSelecionado() === 'PENDENTE'"
          [class.ring-amber-500/20]="filtroStatusSelecionado() === 'PENDENTE'"
          [class.bg-amber-50/50]="filtroStatusSelecionado() === 'PENDENTE'"
          [class.dark:bg-amber-950/30]="filtroStatusSelecionado() === 'PENDENTE'"
          [class.border-app]="filtroStatusSelecionado() !== 'PENDENTE'"
          [class.bg-surface]="filtroStatusSelecionado() !== 'PENDENTE'"
          [class.hover:border-amber-300]="filtroStatusSelecionado() !== 'PENDENTE'">
          
          <div class="flex items-center justify-between mb-2">
            <span class="text-[11px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
              <span class="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
              Pendentes
            </span>
            <div class="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300">
              <mat-icon class="text-sm">hourglass_top</mat-icon>
            </div>
          </div>

          <div class="space-y-1">
            <div class="flex items-baseline gap-2">
              <span class="text-2xl font-black font-mono text-amber-700 dark:text-amber-300">
                {{ financeState.resumoNfse().pendentesQtd }}
              </span>
              <span class="text-xs text-app-muted font-medium">em transmissão/fila</span>
            </div>
            <div class="font-mono font-bold text-xs text-app-text">
              R$ {{ financeState.resumoNfse().pendentesValor | number:'1.2-2' }}
            </div>
          </div>

          <div class="mt-3 pt-2.5 border-t border-amber-200/60 dark:border-amber-800/60 flex items-center justify-between text-[11px]">
            <span class="text-amber-700 dark:text-amber-400 font-medium">Aguardando Envio</span>
            <span class="font-bold text-amber-600 flex items-center gap-0.5">
              Transmitir <mat-icon class="text-xs">arrow_upward</mat-icon>
            </span>
          </div>
        </div>

        <!-- CARD 3: COM ERRO / REJEITADAS -->
        <div 
          role="button"
          tabindex="0"
          (click)="selecionarFiltroStatus('REJEITADA')"
          (keydown.enter)="selecionarFiltroStatus('REJEITADA')"
          (keydown.space)="selecionarFiltroStatus('REJEITADA')"
          class="p-4 rounded-xl border transition-all cursor-pointer select-none text-left relative overflow-hidden"
          [class.border-rose-500]="filtroStatusSelecionado() === 'REJEITADA'"
          [class.ring-2]="filtroStatusSelecionado() === 'REJEITADA'"
          [class.ring-rose-500/20]="filtroStatusSelecionado() === 'REJEITADA'"
          [class.bg-rose-50/50]="filtroStatusSelecionado() === 'REJEITADA'"
          [class.dark:bg-rose-950/30]="filtroStatusSelecionado() === 'REJEITADA'"
          [class.border-app]="filtroStatusSelecionado() !== 'REJEITADA'"
          [class.bg-surface]="filtroStatusSelecionado() !== 'REJEITADA'"
          [class.hover:border-rose-300]="filtroStatusSelecionado() !== 'REJEITADA'">
          
          <div class="flex items-center justify-between mb-2">
            <span class="text-[11px] font-bold uppercase tracking-wider text-rose-800 dark:text-rose-300 flex items-center gap-1.5">
              <span class="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
              Com Erro
            </span>
            <div class="p-1.5 rounded-lg bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300">
              <mat-icon class="text-sm">report_problem</mat-icon>
            </div>
          </div>

          <div class="space-y-1">
            <div class="flex items-baseline gap-2">
              <span class="text-2xl font-black font-mono text-rose-700 dark:text-rose-300">
                {{ financeState.resumoNfse().comErroQtd }}
              </span>
              <span class="text-xs text-app-muted font-medium">rejeitadas pelo órgão</span>
            </div>
            <div class="font-mono font-bold text-xs text-app-text">
              R$ {{ financeState.resumoNfse().comErroValor | number:'1.2-2' }}
            </div>
          </div>

          <div class="mt-3 pt-2.5 border-t border-rose-200/60 dark:border-rose-800/60 flex items-center justify-between text-[11px]">
            <span class="text-rose-700 dark:text-rose-400 font-medium">Requer Correção</span>
            <span class="font-bold text-rose-600 flex items-center gap-0.5">
              Resolver <mat-icon class="text-xs">build</mat-icon>
            </span>
          </div>
        </div>

        <!-- CARD 4: VOLUME TOTAL & EFICIÊNCIA -->
        <div 
          role="button"
          tabindex="0"
          (click)="selecionarFiltroStatus('TODOS')"
          (keydown.enter)="selecionarFiltroStatus('TODOS')"
          (keydown.space)="selecionarFiltroStatus('TODOS')"
          class="p-4 rounded-xl border transition-all cursor-pointer select-none text-left relative overflow-hidden"
          [class.border-[#17324d]]="filtroStatusSelecionado() === 'TODOS'"
          [class.ring-2]="filtroStatusSelecionado() === 'TODOS'"
          [class.ring-blue-500/20]="filtroStatusSelecionado() === 'TODOS'"
          [class.bg-slate-50]="filtroStatusSelecionado() === 'TODOS'"
          [class.dark:bg-slate-900/40]="filtroStatusSelecionado() === 'TODOS'"
          [class.border-app]="filtroStatusSelecionado() !== 'TODOS'"
          [class.bg-surface]="filtroStatusSelecionado() !== 'TODOS'"
          [class.hover:border-slate-400]="filtroStatusSelecionado() !== 'TODOS'">
          
          <div class="flex items-center justify-between mb-2">
            <span class="text-[11px] font-bold uppercase tracking-wider text-app-secondary flex items-center gap-1.5">
              <span class="w-2.5 h-2.5 rounded-full bg-[#17324d] dark:bg-blue-400"></span>
              Volume Total
            </span>
            <div class="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-app-text">
              <mat-icon class="text-sm">analytics</mat-icon>
            </div>
          </div>

          <div class="space-y-1">
            <div class="flex items-baseline gap-2">
              <span class="text-2xl font-black font-mono text-app-text">
                {{ financeState.resumoNfse().total }}
              </span>
              <span class="text-xs text-app-muted font-medium">notas no período</span>
            </div>
            <div class="font-mono font-bold text-xs text-[#17324d] dark:text-blue-300">
              R$ {{ financeState.resumoNfse().valorTotalGeral | number:'1.2-2' }}
            </div>
          </div>

          <div class="mt-3 pt-2.5 border-t border-app flex items-center justify-between text-[11px]">
            <span class="text-app-secondary font-medium">
              Taxa de Sucesso: <strong class="text-emerald-600">{{ financeState.resumoNfse().taxaSucesso | number:'1.1-1' }}%</strong>
            </span>
            <span class="font-bold text-[#17324d] dark:text-blue-300 flex items-center gap-0.5">
              Ver todas <mat-icon class="text-xs">chevron_right</mat-icon>
            </span>
          </div>
        </div>

      </div>

      <!-- PAINEL EXPANSÍVEL DE LISTAGEM & GESTÃO INTERATIVA DE NFS-e -->
      @if (painelAberto()) {
        <div class="pt-3 border-t border-app space-y-3 animate-fade-in">
          
          <!-- BARRA DE CONTROLE DA TABELA EMBUTIDA -->
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="text-xs font-bold text-app-text">
                Listagem Filtrada:
              </span>
              
              <!-- ABAS DE FILTRO RÁPIDO -->
              <div class="flex items-center bg-slate-100 dark:bg-slate-900 p-0.5 rounded-lg border border-app text-xs">
                <button 
                  type="button" 
                  (click)="filtroStatusSelecionado.set('TODOS')"
                  [class.bg-surface]="filtroStatusSelecionado() === 'TODOS'"
                  [class.font-bold]="filtroStatusSelecionado() === 'TODOS'"
                  [class.text-app-text]="filtroStatusSelecionado() === 'TODOS'"
                  class="px-2.5 py-1 rounded text-app-secondary hover:text-app-text transition-all">
                  Todas ({{ financeState.resumoNfse().total }})
                </button>
                <button 
                  type="button" 
                  (click)="filtroStatusSelecionado.set('AUTORIZADA')"
                  [class.bg-surface]="filtroStatusSelecionado() === 'AUTORIZADA'"
                  [class.font-bold]="filtroStatusSelecionado() === 'AUTORIZADA'"
                  [class.text-emerald-600]="filtroStatusSelecionado() === 'AUTORIZADA'"
                  class="px-2.5 py-1 rounded text-app-secondary hover:text-app-text transition-all">
                  Processadas ({{ financeState.resumoNfse().processadasQtd }})
                </button>
                <button 
                  type="button" 
                  (click)="filtroStatusSelecionado.set('PENDENTE')"
                  [class.bg-surface]="filtroStatusSelecionado() === 'PENDENTE'"
                  [class.font-bold]="filtroStatusSelecionado() === 'PENDENTE'"
                  [class.text-amber-600]="filtroStatusSelecionado() === 'PENDENTE'"
                  class="px-2.5 py-1 rounded text-app-secondary hover:text-app-text transition-all">
                  Pendentes ({{ financeState.resumoNfse().pendentesQtd }})
                </button>
                <button 
                  type="button" 
                  (click)="filtroStatusSelecionado.set('REJEITADA')"
                  [class.bg-surface]="filtroStatusSelecionado() === 'REJEITADA'"
                  [class.font-bold]="filtroStatusSelecionado() === 'REJEITADA'"
                  [class.text-rose-600]="filtroStatusSelecionado() === 'REJEITADA'"
                  class="px-2.5 py-1 rounded text-app-secondary hover:text-app-text transition-all">
                  Com Erro ({{ financeState.resumoNfse().comErroQtd }})
                </button>
              </div>
            </div>

            <!-- CAMPO DE BUSCA -->
            <div class="relative min-w-[220px]">
              <mat-icon class="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-app-muted">search</mat-icon>
              <input 
                type="text" 
                [(ngModel)]="termoBusca"
                placeholder="Buscar por parceiro, NFS-e ou CNPJ..." 
                class="input-corporate pl-8 py-1 text-xs w-full">
            </div>
          </div>

          <!-- TABELA DE NOTAS FISCAIS -->
          <div class="border border-app rounded-xl overflow-hidden">
            <div class="overflow-x-auto">
              <table class="table-corporate text-xs">
                <thead>
                  <tr>
                    <th>Número / Chave</th>
                    <th>Prestador (MEI / Salão)</th>
                    <th>Tomador</th>
                    <th>Data Emissão</th>
                    <th class="text-right">Valor Total</th>
                    <th class="text-center">Status</th>
                    <th class="text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  @for (n of notasFiltradas(); track n.id) {
                    <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td class="whitespace-nowrap">
                        <span class="font-bold text-app-text block">NFS-e {{ n.numero_nfse }}</span>
                        <span class="font-mono text-[10px] text-app-muted truncate max-w-[140px] block" [title]="n.chave_acesso">
                          {{ n.chave_acesso }}
                        </span>
                      </td>
                      <td>
                        <span class="font-bold text-app-text block truncate max-w-[180px]">{{ n.razao_social_prestador }}</span>
                        <span class="font-mono text-[10px] text-app-muted">{{ n.cnpj_prestador }}</span>
                      </td>
                      <td>
                        <span class="font-medium text-app-text block truncate max-w-[160px]">{{ n.razao_social_tomador }}</span>
                        <span class="font-mono text-[10px] text-app-muted">{{ n.cnpj_tomador }}</span>
                      </td>
                      <td class="font-mono text-app-secondary whitespace-nowrap">
                        {{ n.data_emissao | date:'dd/MM/yyyy HH:mm' }}
                      </td>
                      <td class="text-right font-mono font-bold text-app-text whitespace-nowrap">
                        R$ {{ n.valor_total | number:'1.2-2' }}
                      </td>
                      <td class="text-center whitespace-nowrap">
                        @if (n.status === 'AUTORIZADA') {
                          <span class="status-badge status-badge-success text-[10px]">
                            ✓ Autorizada
                          </span>
                        } @else if (n.status === 'PENDENTE' || n.status === 'TRANSMITIDA') {
                          <span class="status-badge status-badge-warning text-[10px] animate-pulse">
                            ⏳ Em Fila
                          </span>
                        } @else if (n.status === 'REJEITADA') {
                          <span class="status-badge status-badge-danger text-[10px]" [title]="n.motivo_rejeicao || 'Rejeitada'">
                            ✕ Com Erro
                          </span>
                        }
                      </td>
                      <td class="text-right whitespace-nowrap">
                        <div class="flex items-center justify-end gap-1.5">
                          
                          <!-- Ação para Nota com Erro -->
                          @if (n.status === 'REJEITADA') {
                            <button 
                              type="button" 
                              (click)="reprocessarNota(n.id)"
                              class="btn-primary text-[11px] py-1 px-2 bg-rose-600 hover:bg-rose-700 text-white border-rose-700 flex items-center gap-1"
                              title="Corrigir divergência e reprocessar autorização">
                              <mat-icon class="text-xs">restart_alt</mat-icon>
                              <span>Corrigir & Emitir</span>
                            </button>
                          }

                          <!-- Ação para Nota Pendente -->
                          @if (n.status === 'PENDENTE' || n.status === 'TRANSMITIDA') {
                            <button 
                              type="button" 
                              (click)="transmitirNota(n.id)"
                              class="btn-primary text-[11px] py-1 px-2 bg-amber-600 hover:bg-amber-700 text-white border-amber-700 flex items-center gap-1"
                              title="Transmitir lote para a Prefeitura">
                              <mat-icon class="text-xs">send</mat-icon>
                              <span>Transmitir</span>
                            </button>
                          }

                          <!-- Ver DANFSe / Espelho da Nota -->
                          <button 
                            type="button" 
                            (click)="abrirModalDanfse(n)"
                            class="btn-secondary text-[11px] py-1 px-2 flex items-center gap-1"
                            title="Visualizar Espelho DANFSe e Detalhamento da Lei 13.352/2016">
                            <mat-icon class="text-xs">visibility</mat-icon>
                            <span>Espelho</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                    
                    <!-- Linha extra com o motivo de rejeição se houver -->
                    @if (n.status === 'REJEITADA' && n.motivo_rejeicao) {
                      <tr class="bg-rose-50/70 dark:bg-rose-950/30 text-[11px]">
                        <td colspan="7" class="py-2 px-3 text-rose-800 dark:text-rose-300">
                          <div class="flex items-center gap-1.5">
                            <mat-icon class="text-xs">warning</mat-icon>
                            <strong>Motivo da Inconsistência:</strong>
                            <span>{{ n.motivo_rejeicao }}</span>
                          </div>
                        </td>
                      </tr>
                    }
                  } @empty {
                    <tr>
                      <td colspan="7" class="text-center py-6 text-app-muted">
                        Nenhuma nota fiscal encontrada para o filtro selecionado.
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>

          <!-- BOTÃO PARA FECHAR / RECOLHER DETALHES -->
          <div class="flex justify-end pt-1">
            <button 
              type="button" 
              (click)="painelAberto.set(false)" 
              class="text-xs text-app-secondary hover:text-app-text flex items-center gap-1">
              <span>Recolher listagem</span>
              <mat-icon class="text-xs">expand_less</mat-icon>
            </button>
          </div>

        </div>
      }

    </div>

    <!-- MODAL DE VISUALIZAÇÃO DO ESPELHO DA NOTA FISCAL (DANFSe) -->
    @if (notaSelecionadaModal(); as modalNota) {
      <div class="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
        <div class="card-corporate max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto shadow-2xl">
          
          <!-- Cabeçalho do Modal -->
          <div class="flex items-center justify-between border-b border-app pb-3">
            <div class="flex items-center gap-2">
              <div class="p-2 rounded-lg bg-blue-100 dark:bg-blue-950 text-[#17324d] dark:text-blue-300">
                <mat-icon>receipt</mat-icon>
              </div>
              <div>
                <h3 class="font-bold text-base text-app-text">
                  Espelho da Nota Fiscal de Serviço Eletrônica (NFS-e)
                </h3>
                <span class="text-xs text-app-muted font-mono">
                  NFS-e Nº {{ modalNota.numero_nfse }} • Série {{ modalNota.serie }}
                </span>
              </div>
            </div>

            <button 
              type="button" 
              (click)="notaSelecionadaModal.set(null)"
              class="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-app-secondary">
              <mat-icon>close</mat-icon>
            </button>
          </div>

          <!-- Informações Principais da Nota -->
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-app text-xs">
            <div>
              <span class="text-[10px] text-app-muted block">Status de Autorização:</span>
              <span class="font-bold text-emerald-600 flex items-center gap-1">
                <mat-icon class="text-xs">check_circle</mat-icon> {{ modalNota.status }}
              </span>
            </div>
            <div>
              <span class="text-[10px] text-app-muted block">Data/Hora Emissão:</span>
              <span class="font-mono font-bold text-app-text">{{ modalNota.data_emissao | date:'dd/MM/yyyy HH:mm' }}</span>
            </div>
            <div>
              <span class="text-[10px] text-app-muted block">Código de Verificação:</span>
              <span class="font-mono font-bold text-[#17324d] dark:text-blue-300">{{ modalNota.codigo_verificacao || 'GERADO-PREF' }}</span>
            </div>
          </div>

          <!-- Dados do Prestador & Tomador -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <!-- Prestador -->
            <div class="p-3 rounded-xl border border-app space-y-1">
              <span class="text-[10px] font-bold uppercase text-app-muted block">Prestador do Serviço (MEI)</span>
              <div class="font-bold text-app-text">{{ modalNota.razao_social_prestador }}</div>
              <div class="font-mono text-app-secondary">CNPJ: {{ modalNota.cnpj_prestador }}</div>
              <div class="text-[11px] text-emerald-600">Optante pelo MEI / Simples Nacional</div>
            </div>

            <!-- Tomador -->
            <div class="p-3 rounded-xl border border-app space-y-1">
              <span class="text-[10px] font-bold uppercase text-app-muted block">Tomador do Serviço (Salão-Parceiro)</span>
              <div class="font-bold text-app-text">{{ modalNota.razao_social_tomador }}</div>
              <div class="font-mono text-app-secondary">CNPJ/CPF: {{ modalNota.cnpj_tomador }}</div>
              <div class="text-[11px] text-blue-600">Salão Parceiro - Lei 13.352/2016</div>
            </div>
          </div>

          <!-- Discriminação dos Serviços e Fundamento Legal -->
          <div class="p-3.5 rounded-xl border border-app space-y-2 text-xs">
            <span class="text-[10px] font-bold uppercase text-app-muted block">Discriminação dos Serviços Prestados</span>
            <p class="text-app-text leading-relaxed font-sans bg-surface p-2.5 rounded-lg border border-app">
              {{ modalNota.discriminacao_servicos }}
            </p>
            <div class="p-2 rounded bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 text-[11px] text-blue-800 dark:text-blue-300 flex items-center gap-1.5">
              <mat-icon class="text-xs">info</mat-icon>
              <span>Regime Especial Salão-Parceiro: Não há retenção de ISS nem bitributação (Lei Complementar 128/2008 e Lei 13.352/2016).</span>
            </div>
          </div>

          <!-- Resumo Financeiro & Chave de Acesso -->
          <div class="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-app space-y-2">
            <div class="flex justify-between items-center text-sm font-bold border-b border-app pb-2">
              <span class="text-app-text">Valor Total da Nota:</span>
              <span class="font-mono font-bold text-base text-emerald-600 dark:text-emerald-400">
                R$ {{ modalNota.valor_total | number:'1.2-2' }}
              </span>
            </div>

            <div class="text-[10px] text-app-muted space-y-0.5">
              <span class="block">Chave de Acesso Pública:</span>
              <span class="font-mono font-bold text-app-text select-all break-all block">{{ modalNota.chave_acesso }}</span>
            </div>
          </div>

          <!-- Ações do Modal -->
          <div class="flex items-center justify-between pt-2 border-t border-app no-print">
            <div class="flex items-center gap-2">
              <button 
                type="button" 
                (click)="imprimirDanfse()"
                class="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5">
                <mat-icon class="text-sm">print</mat-icon>
                <span>Imprimir DANFSe</span>
              </button>

              <button 
                type="button" 
                (click)="simularDownloadDanfse(modalNota)"
                class="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5">
                <mat-icon class="text-sm">download</mat-icon>
                <span>Baixar (PDF/XML)</span>
              </button>
            </div>

            <button 
              type="button" 
              (click)="notaSelecionadaModal.set(null)"
              class="btn-primary text-xs py-1.5 px-4">
              Fechar
            </button>
          </div>

        </div>
      </div>
    }
  `
})
export class VisaoGeralNfseComponent {
  readonly financeState = inject(FinanceStateService);

  readonly mostrarLeitorXml = signal<boolean>(false);
  readonly painelAberto = signal<boolean>(true);
  readonly filtroStatusSelecionado = signal<'TODOS' | 'AUTORIZADA' | 'PENDENTE' | 'REJEITADA'>('TODOS');
  readonly termoBusca = signal<string>('');
  readonly mensagemSucesso = signal<string | null>(null);

  readonly notaSelecionadaModal = signal<NotaFiscal | null>(null);

  readonly notasFiltradas = computed(() => {
    const todos = this.financeState.notasFiscais();
    const filtro = this.filtroStatusSelecionado();
    const busca = this.termoBusca().toLowerCase().trim();

    return todos.filter(n => {
      // Filtro de status
      if (filtro === 'AUTORIZADA' && n.status !== 'AUTORIZADA') return false;
      if (filtro === 'PENDENTE' && (n.status !== 'PENDENTE' && n.status !== 'TRANSMITIDA')) return false;
      if (filtro === 'REJEITADA' && n.status !== 'REJEITADA') return false;

      // Filtro de busca
      if (busca) {
        const matchNumero = n.numero_nfse.toLowerCase().includes(busca);
        const matchPrestador = n.razao_social_prestador.toLowerCase().includes(busca);
        const matchCnpjPrestador = n.cnpj_prestador.toLowerCase().includes(busca);
        const matchTomador = n.razao_social_tomador.toLowerCase().includes(busca);
        const matchChave = n.chave_acesso.toLowerCase().includes(busca);
        return matchNumero || matchPrestador || matchCnpjPrestador || matchTomador || matchChave;
      }

      return true;
    });
  });

  selecionarFiltroStatus(status: 'TODOS' | 'AUTORIZADA' | 'PENDENTE' | 'REJEITADA'): void {
    this.filtroStatusSelecionado.set(status);
    this.painelAberto.set(true);
  }

  transmitirNota(idNota: string): void {
    this.financeState.transmitirNotaPendente(idNota);
    this.mensagemSucesso.set('Nota fiscal transmitida com sucesso e autorizada pela Prefeitura!');
  }

  transmitirTodasPendentes(): void {
    this.financeState.transmitirTodasPendentes();
    this.mensagemSucesso.set('Lote de notas pendentes transmitido com sucesso!');
  }

  reprocessarNota(idNota: string): void {
    this.financeState.reprocessarNotaComErro(idNota);
    this.mensagemSucesso.set('Inconsistência corrigida! Nota reprocessada e autorizada com sucesso.');
  }

  reprocessarTodasComErro(): void {
    this.financeState.reprocessarTodasComErro();
    this.mensagemSucesso.set('Todas as notas com divergência foram reprocessadas e autorizadas!');
  }

  abrirModalDanfse(nota: NotaFiscal): void {
    this.notaSelecionadaModal.set(nota);
  }

  imprimirDanfse(): void {
    if (typeof window !== 'undefined') {
      window.print();
    }
  }

  simularDownloadDanfse(nota: NotaFiscal): void {
    this.mensagemSucesso.set(`Arquivo DANFSe e XML da NFS-e ${nota.numero_nfse} gerados para download.`);
  }
}
