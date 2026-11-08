import { ChangeDetectionStrategy, Component, computed, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { FinanceStateService } from '../../core/services/finance-state.service';
import { PushNotificationService } from '../../core/services/push-notification.service';

export interface AlertaFiscalVencimento {
  id: string;
  categoria: 'SIMPLES_NACIONAL' | 'REPASSE_MEI' | 'NFSE_PENDENTE' | 'DECLARACAO';
  prioridade: 'URGENTE' | 'ATENCAO' | 'NORMAL';
  titulo: string;
  descricao: string;
  dataLimite: string; // Ex: '20/09/2026'
  diasRestantes: number;
  valor?: number;
  destinatarioOuOrgao: string;
  linkAcao?: string;
  textoAcao: string;
  icone: string;
  resolvido?: boolean;
}

const STORAGE_LOCAL_NOTIFS_CFG = 'beauty_finance_browser_alerts_config_v1';
const STORAGE_NOTIF_DISPAROS = 'beauty_finance_browser_notifs_disparadas_v1';

@Component({
  selector: 'app-painel-alertas-vencimentos',
  imports: [CommonModule, FormsModule, RouterLink, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="card-corporate p-4 sm:p-5 space-y-4" id="painel-alertas-vencimentos-widget">
      
      <!-- CABEÇALHO DO COMPONENTE DE ALERTAS -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-app">
        <div class="flex items-center gap-2.5">
          <div class="p-2 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 relative">
            <mat-icon class="text-lg">notifications_active</mat-icon>
            @if (alertasPendentes().length > 0) {
              <span class="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-600 text-white font-bold text-[9px] flex items-center justify-center animate-pulse">
                {{ alertasPendentes().length }}
              </span>
            }
          </div>
          <div>
            <div class="flex items-center gap-2 flex-wrap">
              <h2 class="font-bold text-sm sm:text-base text-app-text flex items-center gap-2">
                Alertas de Vencimento Fiscal & Prazos de Repasse
              </h2>
              
              <!-- BADGE DO STATUS DA BROWSER NOTIFICATION API -->
              @if (statusPermissaoNavegador() === 'granted') {
                <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                  <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Browser Notifications Ativas
                </span>
              } @else if (statusPermissaoNavegador() === 'denied') {
                <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 dark:bg-red-950/80 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800 flex items-center gap-1">
                  <mat-icon class="text-[10px]">notifications_off</mat-icon>
                  Notificações Bloqueadas
                </span>
              } @else {
                <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 flex items-center gap-1">
                  <mat-icon class="text-[10px]">notifications_paused</mat-icon>
                  Notificações Locais Disponíveis
                </span>
              }
            </div>
            <p class="text-xs text-app-secondary mt-0.5">
              Notificações nativas no navegador para acompanhamento das guias DAS (Simples Nacional) e prazos contratuais de transferência aos MEIs.
            </p>
          </div>
        </div>

        <!-- CONTROLES DA BROWSER NOTIFICATION API & FILTROS -->
        <div class="flex items-center gap-2 flex-wrap">
          
          <!-- BOTÃO ATIVAR/CONFIGURAR NOTIFICAÇÕES DO NAVEGADOR -->
          @if (statusPermissaoNavegador() !== 'granted') {
            <button 
              type="button" 
              (click)="solicitarPermissaoNavegador()"
              class="btn-primary text-xs flex items-center gap-1.5 bg-[#17324d] hover:bg-[#204467] text-white border-[#17324d] shadow-xs"
              id="btn-ativar-browser-notifications">
              <mat-icon class="text-sm text-amber-300">notifications_active</mat-icon>
              <span>Ativar Notificações no Navegador</span>
            </button>
          } @else {
            <button 
              type="button" 
              (click)="abrirConfiguracoesNotificacao.set(true)"
              class="btn-secondary text-xs flex items-center gap-1.5"
              id="btn-configurar-notificacoes-locais"
              title="Configurar regras de alerta no navegador">
              <mat-icon class="text-sm text-blue-500">settings</mat-icon>
              <span>Configurar Alertas</span>
            </button>
          }

          <button 
            type="button" 
            (click)="testarNotificacaoSimplesNacional()"
            class="btn-secondary text-xs flex items-center gap-1"
            title="Disparar notificação local teste via Browser Notification API">
            <mat-icon class="text-sm text-amber-500">send</mat-icon>
            <span>Testar Alerta DAS</span>
          </button>
        </div>
      </div>

      <!-- BARRA DE FILTROS RÁPIDOS & STATUS -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
        <div class="flex items-center gap-1.5 flex-wrap">
          <span class="text-app-muted text-[11px] mr-1">Filtrar por:</span>
          <button 
            type="button" 
            (click)="filtroCategoria.set('TODOS')"
            [class.bg-surface]="filtroCategoria() === 'TODOS'"
            [class.font-bold]="filtroCategoria() === 'TODOS'"
            [class.text-app-text]="filtroCategoria() === 'TODOS'"
            [class.shadow-xs]="filtroCategoria() === 'TODOS'"
            class="px-2.5 py-1 rounded text-xs text-app-secondary hover:text-app-text border border-app transition-all">
            Todos ({{ alertas().length }})
          </button>
          
          <button 
            type="button" 
            (click)="filtroCategoria.set('SIMPLES_NACIONAL')"
            [class.bg-surface]="filtroCategoria() === 'SIMPLES_NACIONAL'"
            [class.font-bold]="filtroCategoria() === 'SIMPLES_NACIONAL'"
            [class.text-app-text]="filtroCategoria() === 'SIMPLES_NACIONAL'"
            [class.shadow-xs]="filtroCategoria() === 'SIMPLES_NACIONAL'"
            class="px-2.5 py-1 rounded text-xs text-app-secondary hover:text-app-text border border-app transition-all">
            Guias DAS (Simples Nacional)
          </button>

          <button 
            type="button" 
            (click)="filtroCategoria.set('REPASSE_MEI')"
            [class.bg-surface]="filtroCategoria() === 'REPASSE_MEI'"
            [class.font-bold]="filtroCategoria() === 'REPASSE_MEI'"
            [class.text-app-text]="filtroCategoria() === 'REPASSE_MEI'"
            [class.shadow-xs]="filtroCategoria() === 'REPASSE_MEI'"
            class="px-2.5 py-1 rounded text-xs text-app-secondary hover:text-app-text border border-app transition-all">
            Prazos de Repasse MEI
          </button>
        </div>

        <div class="text-[11px] text-app-muted flex items-center gap-2">
          <span>Verificação automática a cada 60s</span>
          <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
        </div>
      </div>

      <!-- BANNER DE FEEDBACK CASO NOTIFICAÇÃO DISPARADA -->
      @if (ultimoDisparoNotificacao()) {
        <div class="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 flex items-center justify-between text-xs animate-fade-in">
          <div class="flex items-center gap-2">
            <mat-icon class="text-blue-600 dark:text-blue-400 text-sm">notifications_active</mat-icon>
            <span class="text-app-text font-medium">{{ ultimoDisparoNotificacao() }}</span>
          </div>
          <button (click)="ultimoDisparoNotificacao.set(null)" class="text-app-muted hover:text-app-text text-[11px]">
            <mat-icon class="text-xs">close</mat-icon>
          </button>
        </div>
      }

      <!-- LISTA DE ALERTAS E VENCIMENTOS -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        @for (alerta of alertasFiltrados(); track alerta.id) {
          <div 
            class="p-3.5 rounded-xl border flex flex-col justify-between transition-all hover:shadow-xs"
            [class.border-red-300]="alerta.prioridade === 'URGENTE' && !alerta.resolvido"
            [class.dark:border-red-900]="alerta.prioridade === 'URGENTE' && !alerta.resolvido"
            [class.bg-red-50/40]="alerta.prioridade === 'URGENTE' && !alerta.resolvido"
            [class.dark:bg-red-950/20]="alerta.prioridade === 'URGENTE' && !alerta.resolvido"
            [class.border-amber-300]="alerta.prioridade === 'ATENCAO' && !alerta.resolvido"
            [class.dark:border-amber-900]="alerta.prioridade === 'ATENCAO' && !alerta.resolvido"
            [class.bg-amber-50/40]="alerta.prioridade === 'ATENCAO' && !alerta.resolvido"
            [class.dark:bg-amber-950/20]="alerta.prioridade === 'ATENCAO' && !alerta.resolvido"
            [class.border-app]="alerta.prioridade === 'NORMAL' || alerta.resolvido"
            [class.bg-surface]="alerta.prioridade === 'NORMAL' || alerta.resolvido"
            [class.opacity-60]="alerta.resolvido">
            
            <div>
              <!-- Cabeçalho do Card de Alerta -->
              <div class="flex items-center justify-between gap-2 mb-2">
                <span class="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                  [class.bg-red-100]="alerta.prioridade === 'URGENTE' && !alerta.resolvido"
                  [class.text-red-800]="alerta.prioridade === 'URGENTE' && !alerta.resolvido"
                  [class.dark:bg-red-950]="alerta.prioridade === 'URGENTE' && !alerta.resolvido"
                  [class.dark:text-red-300]="alerta.prioridade === 'URGENTE' && !alerta.resolvido"
                  [class.bg-amber-100]="alerta.prioridade === 'ATENCAO' && !alerta.resolvido"
                  [class.text-amber-800]="alerta.prioridade === 'ATENCAO' && !alerta.resolvido"
                  [class.dark:bg-amber-950]="alerta.prioridade === 'ATENCAO' && !alerta.resolvido"
                  [class.dark:text-amber-300]="alerta.prioridade === 'ATENCAO' && !alerta.resolvido"
                  [class.bg-blue-100]="alerta.prioridade === 'NORMAL' || alerta.resolvido"
                  [class.text-blue-800]="alerta.prioridade === 'NORMAL' || alerta.resolvido"
                  [class.dark:bg-blue-950]="alerta.prioridade === 'NORMAL' || alerta.resolvido"
                  [class.dark:text-blue-300]="alerta.prioridade === 'NORMAL' || alerta.resolvido">
                  <mat-icon class="text-xs">{{ alerta.icone }}</mat-icon>
                  {{ alerta.categoria === 'SIMPLES_NACIONAL' ? 'Simples Nacional' : (alerta.categoria === 'REPASSE_MEI' ? 'Repasse MEI' : 'NFS-e') }}
                </span>

                <span class="text-[11px] font-bold font-mono"
                  [class.text-red-600]="alerta.diasRestantes <= 2 && !alerta.resolvido"
                  [class.text-amber-600]="alerta.diasRestantes > 2 && alerta.diasRestantes <= 5 && !alerta.resolvido"
                  [class.text-app-muted]="alerta.diasRestantes > 5 || alerta.resolvido">
                  @if (alerta.resolvido) {
                    ✓ Concluído
                  } @else if (alerta.diasRestantes === 0) {
                    Vence Hoje!
                  } @else if (alerta.diasRestantes === 1) {
                    Vence Amanhã
                  } @else {
                    em {{ alerta.diasRestantes }} dias ({{ alerta.dataLimite }})
                  }
                </span>
              </div>

              <!-- Título & Descrição -->
              <h3 class="font-bold text-xs text-app-text line-clamp-1 mb-1">{{ alerta.titulo }}</h3>
              <p class="text-[11px] text-app-secondary leading-relaxed mb-3">{{ alerta.descricao }}</p>
            </div>

            <!-- Rodapé do Card com Valores e Ação -->
            <div class="pt-2.5 border-t border-app flex items-center justify-between gap-2 mt-auto">
              <div>
                @if (alerta.valor) {
                  <span class="text-[10px] text-app-muted block">Valor:</span>
                  <span class="font-mono font-bold text-xs text-app-text">R$ {{ alerta.valor | number:'1.2-2' }}</span>
                } @else {
                  <span class="text-[10px] text-app-muted block">Destino:</span>
                  <span class="text-[11px] font-medium text-app-text truncate max-w-[120px] block">{{ alerta.destinatarioOuOrgao }}</span>
                }
              </div>

              <div class="flex items-center gap-1.5">
                <!-- BOTÃO DISPARAR NOTIFICAÇÃO LOCAL DESTE ALERTA -->
                <button 
                  type="button" 
                  (click)="dispararNotificacaoNavegadorParaAlerta(alerta)"
                  class="p-1.5 rounded-lg border border-app hover:bg-slate-100 dark:hover:bg-slate-800 text-app-secondary hover:text-app-text transition-colors"
                  title="Enviar notificação local deste alerta para o navegador">
                  <mat-icon class="text-xs text-amber-500">notification_important</mat-icon>
                </button>

                @if (!alerta.resolvido) {
                  @if (alerta.linkAcao) {
                    <a 
                      [routerLink]="alerta.linkAcao" 
                      class="btn-secondary text-[11px] py-1 px-2.5 flex items-center gap-1">
                      <span>{{ alerta.textoAcao }}</span>
                      <mat-icon class="text-xs">arrow_forward</mat-icon>
                    </a>
                  } @else {
                    <button 
                      type="button" 
                      (click)="marcarComoResolvido(alerta.id)" 
                      class="btn-primary text-[11px] py-1 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-700">
                      <mat-icon class="text-xs">check</mat-icon> {{ alerta.textoAcao }}
                    </button>
                  }
                } @else {
                  <span class="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
                    <mat-icon class="text-sm">task_alt</mat-icon> Liquidado
                  </span>
                }
              </div>

            </div>

          </div>
        }
      </div>

      <!-- MODAL DE CONFIGURAÇÃO DE NOTIFICAÇÕES LOCAIS (BROWSER NOTIFICATION API) -->
      @if (abrirConfiguracoesNotificacao()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fade-in">
          <div class="relative w-full max-w-lg bg-surface border border-app rounded-2xl shadow-2xl p-5 sm:p-6 overflow-y-auto max-h-[90vh] space-y-4">
            
            <!-- CABEÇALHO DO MODAL -->
            <div class="flex items-center justify-between pb-3 border-b border-app">
              <div class="flex items-center gap-2.5">
                <div class="p-2 rounded-xl bg-blue-50 dark:bg-blue-950 text-[#17324d] dark:text-blue-300">
                  <mat-icon class="text-lg">tune</mat-icon>
                </div>
                <div>
                  <h3 class="font-bold text-sm sm:text-base text-app-text">Configuração de Notificações no Navegador</h3>
                  <p class="text-[11px] text-app-secondary">Browser Notification API para alertas de DAS e repasses MEI</p>
                </div>
              </div>

              <button 
                type="button" 
                (click)="abrirConfiguracoesNotificacao.set(false)" 
                class="text-app-muted hover:text-app-text p-1 rounded-lg">
                <mat-icon class="text-base">close</mat-icon>
              </button>
            </div>

            <!-- STATUS ATUAL DA API -->
            <div class="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-app flex items-center justify-between text-xs">
              <div>
                <span class="text-app-muted text-[10px] block">Status da Permissão no Navegador:</span>
                <strong class="text-app-text uppercase font-mono">{{ statusPermissaoNavegador() }}</strong>
              </div>
              
              @if (statusPermissaoNavegador() !== 'granted') {
                <button 
                  type="button" 
                  (click)="solicitarPermissaoNavegador()" 
                  class="btn-primary py-1 px-3 text-xs">
                  Solicitar Permissão
                </button>
              } @else {
                <span class="text-emerald-600 font-bold flex items-center gap-1">
                  <mat-icon class="text-sm">verified</mat-icon> Autorizado
                </span>
              }
            </div>

            <!-- OPÇÕES DE ALERTAS ATIVOS -->
            <div class="space-y-3 text-xs">
              <span class="font-bold text-app-secondary block text-[11px] uppercase tracking-wider">
                Eventos para Notificar no Navegador:
              </span>

              <label class="flex items-start gap-2.5 p-2.5 rounded-xl border border-app hover:bg-slate-50 dark:hover:bg-slate-900/40 cursor-pointer">
                <input 
                  type="checkbox" 
                  [(ngModel)]="configNotificacoes.notificarDasSimples" 
                  (change)="salvarConfiguracoes()" 
                  class="mt-0.5 rounded text-blue-600" 
                />
                <div>
                  <strong class="text-app-text block">Vencimentos do Simples Nacional (Guia DAS)</strong>
                  <span class="text-[11px] text-app-secondary">Alertar sobre o prazo limite do PGDAS-D calculado sobre a cota do salão.</span>
                </div>
              </label>

              <label class="flex items-start gap-2.5 p-2.5 rounded-xl border border-app hover:bg-slate-50 dark:hover:bg-slate-900/40 cursor-pointer">
                <input 
                  type="checkbox" 
                  [(ngModel)]="configNotificacoes.notificarRepassesMei" 
                  (change)="salvarConfiguracoes()" 
                  class="mt-0.5 rounded text-blue-600" 
                />
                <div>
                  <strong class="text-app-text block">Prazos de Repasse aos Profissionais Parceiros MEI</strong>
                  <span class="text-[11px] text-app-secondary">Alertar sobre datas limites contratuais para liquidação de PIX e fechamentos.</span>
                </div>
              </label>

              <label class="flex items-start gap-2.5 p-2.5 rounded-xl border border-app hover:bg-slate-50 dark:hover:bg-slate-900/40 cursor-pointer">
                <input 
                  type="checkbox" 
                  [(ngModel)]="configNotificacoes.notificarNfsePendentes" 
                  (change)="salvarConfiguracoes()" 
                  class="mt-0.5 rounded text-blue-600" 
                />
                <div>
                  <strong class="text-app-text block">NFS-e Pendentes de Validação</strong>
                  <span class="text-[11px] text-app-secondary">Alertar sobre notas fiscais pendentes há mais de 48 horas.</span>
                </div>
              </label>

              <label class="flex items-start gap-2.5 p-2.5 rounded-xl border border-app hover:bg-slate-50 dark:hover:bg-slate-900/40 cursor-pointer">
                <input 
                  type="checkbox" 
                  [(ngModel)]="configNotificacoes.tocarSom" 
                  (change)="salvarConfiguracoes()" 
                  class="mt-0.5 rounded text-blue-600" 
                />
                <div>
                  <strong class="text-app-text block">Emitir Sinal Sonoro (Web Audio API)</strong>
                  <span class="text-[11px] text-app-secondary">Tocar um acorde corporativo suave ao disparar a notificação.</span>
                </div>
              </label>
            </div>

            <!-- DIAS DE ANTECEDÊNCIA -->
            <div class="space-y-2 text-xs pt-2 border-t border-app">
              <span class="font-bold text-app-secondary block text-[11px] uppercase tracking-wider">
                Antecedência dos Disparos:
              </span>
              
              <div class="flex items-center gap-2 flex-wrap">
                <button 
                  type="button" 
                  (click)="alternarDiaAntecedencia(5)"
                  [class.bg-blue-600]="configNotificacoes.diasAntecedencia.includes(5)"
                  [class.text-white]="configNotificacoes.diasAntecedencia.includes(5)"
                  class="px-2.5 py-1 rounded-lg border border-app text-xs font-bold transition-all">
                  5 dias antes
                </button>
                <button 
                  type="button" 
                  (click)="alternarDiaAntecedencia(3)"
                  [class.bg-blue-600]="configNotificacoes.diasAntecedencia.includes(3)"
                  [class.text-white]="configNotificacoes.diasAntecedencia.includes(3)"
                  class="px-2.5 py-1 rounded-lg border border-app text-xs font-bold transition-all">
                  3 dias antes
                </button>
                <button 
                  type="button" 
                  (click)="alternarDiaAntecedencia(1)"
                  [class.bg-blue-600]="configNotificacoes.diasAntecedencia.includes(1)"
                  [class.text-white]="configNotificacoes.diasAntecedencia.includes(1)"
                  class="px-2.5 py-1 rounded-lg border border-app text-xs font-bold transition-all">
                  1 dia antes (Véspera)
                </button>
                <button 
                  type="button" 
                  (click)="alternarDiaAntecedencia(0)"
                  [class.bg-blue-600]="configNotificacoes.diasAntecedencia.includes(0)"
                  [class.text-white]="configNotificacoes.diasAntecedencia.includes(0)"
                  class="px-2.5 py-1 rounded-lg border border-app text-xs font-bold transition-all">
                  No dia do vencimento
                </button>
              </div>
            </div>

            <!-- RODAPÉ DO MODAL -->
            <div class="pt-3 border-t border-app flex justify-between items-center text-xs">
              <button 
                type="button" 
                (click)="testarNotificacaoSimplesNacional()" 
                class="btn-secondary py-1.5 px-3 text-xs flex items-center gap-1">
                <mat-icon class="text-sm text-amber-500">notifications</mat-icon> Testar Disparo
              </button>
              
              <button 
                type="button" 
                (click)="abrirConfiguracoesNotificacao.set(false)" 
                class="btn-primary py-1.5 px-4 text-xs">
                Concluir
              </button>
            </div>

          </div>
        </div>
      }

    </div>
  `
})
export class PainelAlertasVencimentosComponent implements OnInit, OnDestroy {
  readonly financeState = inject(FinanceStateService);
  readonly pushNotificationService = inject(PushNotificationService);

  readonly filtroCategoria = signal<'TODOS' | 'SIMPLES_NACIONAL' | 'REPASSE_MEI'>('TODOS');
  readonly statusPermissaoNavegador = signal<NotificationPermission | 'unsupported'>('default');
  readonly abrirConfiguracoesNotificacao = signal<boolean>(false);
  readonly ultimoDisparoNotificacao = signal<string | null>(null);

  private intervalTimer: any = null;

  configNotificacoes = {
    ativo: true,
    notificarDasSimples: true,
    notificarRepassesMei: true,
    notificarNfsePendentes: true,
    tocarSom: true,
    diasAntecedencia: [5, 3, 1, 0]
  };

  readonly alertas = signal<AlertaFiscalVencimento[]>([
    {
      id: 'alt-das-2026-08',
      categoria: 'SIMPLES_NACIONAL',
      prioridade: 'ATENCAO',
      titulo: 'Guia DAS Simples Nacional (Apuração 08/2026)',
      descricao: 'Vencimento do PGDAS-D calculado exclusivamente sobre a cota do salão (R$ 24.560,00), com dedução legal da Lei 13.352.',
      dataLimite: '20/09/2026',
      diasRestantes: 23,
      valor: 2063.04,
      destinatarioOuOrgao: 'Receita Federal / PGDAS-D',
      linkAcao: '/fechamentos',
      textoAcao: 'Ver Apuração DAS',
      icone: 'receipt_long',
      resolvido: false
    },
    {
      id: 'alt-repasse-quarto-lote',
      categoria: 'REPASSE_MEI',
      prioridade: 'URGENTE',
      titulo: 'Prazo Limite para Repasse PIX (Parceiros MEI)',
      descricao: 'Data contratual para liquidação das cotas dos profissionais MEI referente à produção quinzenal.',
      dataLimite: '05/09/2026',
      diasRestantes: 8,
      valor: 31340.00,
      destinatarioOuOrgao: '5 Profissionais MEI',
      linkAcao: '/relatorio-repasse',
      textoAcao: 'Executar Repasses',
      icone: 'payments',
      resolvido: false
    },
    {
      id: 'alt-nfse-marcos',
      categoria: 'NFSE_PENDENTE',
      prioridade: 'ATENCAO',
      titulo: 'NFS-e Pendente: Marcos Barbeiro MEI',
      descricao: 'Aguardando validação da nota fiscal de prestação de serviços no valor de R$ 6.720,00 antes da emissão do comprovante de repasse.',
      dataLimite: '02/09/2026',
      diasRestantes: 5,
      valor: 6720.00,
      destinatarioOuOrgao: 'Marcos Barbeiro MEI',
      linkAcao: '/notas-fiscais',
      textoAcao: 'Conferir NFS-e',
      icone: 'description',
      resolvido: false
    },
    {
      id: 'alt-das-mei-parceiros',
      categoria: 'SIMPLES_NACIONAL',
      prioridade: 'NORMAL',
      titulo: 'Lembrete DAS-MEI (Guias Próprias dos Parceiros)',
      descricao: 'Orientação preventiva aos parceiros MEI para pagamento da guia mensal fixa do DAS-MEI do mês vigente.',
      dataLimite: '20/09/2026',
      diasRestantes: 23,
      destinatarioOuOrgao: 'Equipe de Parceiros',
      linkAcao: '/painel-parceiros',
      textoAcao: 'Notificar MEIs',
      icone: 'send',
      resolvido: false
    },
    {
      id: 'alt-saude-fiscal-mei-teto',
      categoria: 'DECLARACAO',
      prioridade: 'ATENCAO',
      titulo: 'Saúde Fiscal MEI: 2 Parceiros com Projeção > R$ 81k',
      descricao: 'O script de análise de recorrência detectou que profissionais estão próximos de estourar o limite anual do MEI. Recomendada transição para ME.',
      dataLimite: '31/12/2026',
      diasRestantes: 123,
      destinatarioOuOrgao: 'Auditoria Fiscal Interna',
      linkAcao: '/dashboard',
      textoAcao: 'Ver Saúde Fiscal',
      icone: 'health_and_safety',
      resolvido: false
    }
  ]);

  readonly alertasFiltrados = computed(() => {
    const f = this.filtroCategoria();
    if (f === 'TODOS') return this.alertas();
    return this.alertas().filter(a => a.categoria === f);
  });

  readonly alertasPendentes = computed(() => {
    return this.alertas().filter(a => !a.resolvido && (a.prioridade === 'URGENTE' || a.prioridade === 'ATENCAO'));
  });

  ngOnInit() {
    this.carregarConfiguracoes();
    this.verificarPermissaoNavegador();

    // Verificação periódica dos alertas para notificação local
    this.verificarAlertasParaNotificar();
    this.intervalTimer = setInterval(() => {
      this.verificarAlertasParaNotificar();
    }, 60000);
  }

  ngOnDestroy() {
    if (this.intervalTimer) {
      clearInterval(this.intervalTimer);
    }
  }

  verificarPermissaoNavegador() {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      this.statusPermissaoNavegador.set(Notification.permission);
    } else {
      this.statusPermissaoNavegador.set('unsupported');
    }
  }

  async solicitarPermissaoNavegador(): Promise<boolean> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      this.statusPermissaoNavegador.set('unsupported');
      return false;
    }

    try {
      const perm = await Notification.requestPermission();
      this.statusPermissaoNavegador.set(perm);

      if (perm === 'granted') {
        this.emitirNotificacaoNavegador(
          '🔔 Notificações Ativadas no Navegador',
          'O BeautyFinance alertará sobre datas de vencimento do Simples Nacional (DAS) e prazos de repasse aos profissionais parceiros MEI.',
          'boas-vindas-alertas'
        );
        return true;
      }
      return false;
    } catch (err) {
      console.warn('Erro ao solicitar permissão de notificação:', err);
      return false;
    }
  }

  carregarConfiguracoes() {
    if (typeof window === 'undefined') return;
    try {
      const salvo = localStorage.getItem(STORAGE_LOCAL_NOTIFS_CFG);
      if (salvo) {
        this.configNotificacoes = { ...this.configNotificacoes, ...JSON.parse(salvo) };
      }
    } catch (e) {
      console.warn('Erro ao carregar configurações de notificações locais:', e);
    }
  }

  salvarConfiguracoes() {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_LOCAL_NOTIFS_CFG, JSON.stringify(this.configNotificacoes));
    } catch (e) {
      console.warn('Erro ao salvar configurações de notificações locais:', e);
    }
  }

  alternarDiaAntecedencia(dia: number) {
    const arr = this.configNotificacoes.diasAntecedencia;
    if (arr.includes(dia)) {
      this.configNotificacoes.diasAntecedencia = arr.filter(d => d !== dia);
    } else {
      this.configNotificacoes.diasAntecedencia = [...arr, dia].sort((a, b) => b - a);
    }
    this.salvarConfiguracoes();
  }

  /**
   * Checa os alertas configurados e dispara Browser Notifications caso estejam na janela de antecedência
   */
  verificarAlertasParaNotificar() {
    if (typeof window === 'undefined' || !('Notification' in window) || Notification.permission !== 'granted') {
      return;
    }
    if (!this.configNotificacoes.ativo) return;

    const hoje = new Date().toISOString().substring(0, 10);
    let disparosHoje: string[] = [];
    try {
      const raw = localStorage.getItem(`${STORAGE_NOTIF_DISPAROS}_${hoje}`);
      if (raw) disparosHoje = JSON.parse(raw);
    } catch {}

    for (const alerta of this.alertas()) {
      if (alerta.resolvido) continue;

      // Filtrar conforme categorias ativadas
      if (alerta.categoria === 'SIMPLES_NACIONAL' && !this.configNotificacoes.notificarDasSimples) continue;
      if (alerta.categoria === 'REPASSE_MEI' && !this.configNotificacoes.notificarRepassesMei) continue;
      if (alerta.categoria === 'NFSE_PENDENTE' && !this.configNotificacoes.notificarNfsePendentes) continue;

      // Verificar se a antecedência confere
      const dias = alerta.diasRestantes;
      const chaveDisparo = `${alerta.id}_dia_${dias}_${hoje}`;

      if (disparosHoje.includes(chaveDisparo)) continue;

      if (this.configNotificacoes.diasAntecedencia.includes(dias) || dias <= 1) {
        let msg = `${alerta.titulo}. Limite: ${alerta.dataLimite}.`;
        if (alerta.valor) {
          msg += ` Valor: R$ ${alerta.valor.toFixed(2)}.`;
        }

        this.emitirNotificacaoNavegador(
          `⏰ Alerta Fiscal: ${alerta.titulo}`,
          msg,
          `alerta-${alerta.id}`
        );

        disparosHoje.push(chaveDisparo);
        try {
          localStorage.setItem(`${STORAGE_NOTIF_DISPAROS}_${hoje}`, JSON.stringify(disparosHoje));
        } catch {}
      }
    }
  }

  /**
   * Dispara notificação local através da Browser Notification API
   */
  emitirNotificacaoNavegador(titulo: string, corpo: string, tag: string) {
    if (this.configNotificacoes.tocarSom) {
      this.pushNotificationService.tocarAlertaSonoro('CHIME_CORPORATIVO');
    }

    this.ultimoDisparoNotificacao.set(`Notificação disparada: ${titulo}`);

    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        const notif = new Notification(titulo, {
          body: corpo,
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          tag,
          requireInteraction: false
        });

        notif.onclick = () => {
          window.focus();
          notif.close();
        };
      } catch (e) {
        console.warn('Erro ao instanciar Notification:', e);
      }
    }
  }

  dispararNotificacaoNavegadorParaAlerta(alerta: AlertaFiscalVencimento) {
    if (this.statusPermissaoNavegador() !== 'granted') {
      this.solicitarPermissaoNavegador().then(concedida => {
        if (concedida) {
          this.executarDisparoAlerta(alerta);
        }
      });
      return;
    }

    this.executarDisparoAlerta(alerta);
  }

  private executarDisparoAlerta(alerta: AlertaFiscalVencimento) {
    const prefixo = alerta.categoria === 'SIMPLES_NACIONAL' ? '📄 Simples Nacional' : '💸 Repasse MEI';
    const corpo = `${alerta.descricao} - Limite: ${alerta.dataLimite} (em ${alerta.diasRestantes} dias).`;
    
    this.emitirNotificacaoNavegador(
      `${prefixo}: ${alerta.titulo}`,
      corpo,
      `alerta-manual-${alerta.id}`
    );
  }

  testarNotificacaoSimplesNacional() {
    if (this.statusPermissaoNavegador() !== 'granted') {
      this.solicitarPermissaoNavegador().then(concedida => {
        if (concedida) {
          this.dispararTesteDas();
        }
      });
      return;
    }

    this.dispararTesteDas();
  }

  private dispararTesteDas() {
    this.emitirNotificacaoNavegador(
      '🔔 Alerta DAS Simples Nacional (Comp. 08/2026)',
      'Vencimento da guia unificada DAS do Simples Nacional (R$ 2.063,04) em 20/09/2026. Apuração da cota salão com deduções da Lei 13.352.',
      'teste-das-simples'
    );
  }

  marcarComoResolvido(id: string): void {
    this.alertas.update(itens => 
      itens.map(item => item.id === id ? { ...item, resolvido: true } : item)
    );
  }
}

