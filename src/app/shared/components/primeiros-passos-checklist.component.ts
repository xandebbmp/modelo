import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { FinanceStateService } from '../../core/services/finance-state.service';
import { TourGuiadoService } from '../../core/services/tour-guiado.service';
import { SocioEmpresa } from '../../core/models/empresa.model';

export interface ItemChecklistFiscal {
  id: string;
  titulo: string;
  subtitulo: string;
  descricao: string;
  categoria: 'FISCAL' | 'SOCIETARIO' | 'OPERACIONAL' | 'LEI_SALAO';
  icone: string;
  concluido: boolean;
  obrigatorio: boolean;
  valorAtual?: string;
  alertaPendente?: string;
  acaoTexto: string;
  tipoAcao: 'MODAL_ALIQUOTA' | 'MODAL_SOCIOS' | 'MODAL_CERTIFICADO' | 'ROTA_PARCEIROS' | 'ROTA_CONFIG' | 'ROTA_REPASSES';
  rota?: string;
}

@Component({
  selector: 'app-primeiros-passos-checklist',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="card-corporate overflow-hidden border-2 border-blue-500/30 dark:border-blue-400/20 shadow-md animate-fade-in" id="card-checklist-primeiros-passos">
      
      <!-- CABEÇALHO COM STATUS GERAL E PROGRESSO -->
      <div class="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-[#17324d] to-[#122438] text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        <div class="space-y-1">
          <div class="flex items-center gap-2">
            <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-400/30">
              <mat-icon class="text-xs">checklist</mat-icon>
              Check-list de Primeiros Passos
            </span>
            <span class="text-xs text-blue-200/80 font-medium">
              Conformidade Fiscal & Tributária
            </span>
          </div>

          <h2 class="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-2">
            <span>Configurações Essenciais para Apuração Lei 13.352</span>
            @if (percentualConcluido() === 100) {
              <mat-icon class="text-emerald-400 text-lg">verified</mat-icon>
            }
          </h2>
          <p class="text-xs text-slate-300 max-w-2xl leading-relaxed">
            Verifique as pendências fiscais da empresa para garantir a segregação de receitas no Simples Nacional e a correta dedução das cotas dos profissionais parceiros MEI.
          </p>
        </div>

        <!-- INDICADOR DE PROGRESSO E AÇÕES DO TOUR -->
        <div class="flex items-center sm:items-end md:items-center gap-3 shrink-0 flex-wrap">
          
          <div class="bg-white/10 dark:bg-black/30 backdrop-blur-xs p-3 rounded-xl border border-white/10 text-right min-w-[140px]">
            <div class="flex items-baseline justify-between gap-2">
              <span class="text-[10px] font-bold uppercase tracking-wider text-slate-300">Progresso</span>
              <span class="text-lg font-black font-mono text-emerald-400 leading-none">
                {{ percentualConcluido() }}%
              </span>
            </div>
            <div class="w-full bg-white/20 h-2 rounded-full mt-1.5 overflow-hidden">
              <div 
                class="h-full bg-gradient-to-r from-emerald-500 to-teal-300 rounded-full transition-all duration-500"
                [style.width.%]="percentualConcluido()">
              </div>
            </div>
            <span class="text-[10px] text-slate-300 mt-1 block">
              {{ totalConcluidos() }} de {{ itens().length }} requisitos atendidos
            </span>
          </div>

          <div class="flex items-center gap-2">
            <button 
              type="button" 
              (click)="tourService.iniciarTour()" 
              class="px-3 py-2 rounded-xl text-xs font-bold bg-blue-500 hover:bg-blue-600 text-white shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
              id="btn-iniciar-tour-checklist"
              title="Iniciar Tour Guiado Interativo">
              <mat-icon class="text-sm">play_circle</mat-icon>
              <span>Ver Tour Guiado</span>
            </button>

            <button 
              type="button" 
              (click)="expandido.set(!expandido())" 
              class="p-2 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 text-white border border-white/15 transition-all cursor-pointer"
              [title]="expandido() ? 'Recolher Check-list' : 'Expandir Check-list'"
              id="btn-toggle-expandir-checklist">
              <mat-icon class="text-sm transition-transform duration-200" [class.rotate-180]="expandido()">
                expand_more
              </mat-icon>
            </button>
          </div>

        </div>

      </div>

      <!-- CORPO DO CHECK-LIST (QUANDO EXPANDIDO) -->
      @if (expandido()) {
        <div class="p-4 sm:p-5 space-y-4 bg-surface">
          
          <!-- AVISO DE PENDÊNCIAS SE HOUVER ITENS INCOMPLETOS -->
          @if (totalPendentes() > 0) {
            <div class="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div class="flex items-start gap-2.5">
                <mat-icon class="text-amber-600 dark:text-amber-400 text-base mt-0.5 shrink-0">warning</mat-icon>
                <div>
                  <span class="text-xs font-bold text-amber-900 dark:text-amber-200 block">
                    {{ totalPendentes() }} configuração(ões) fiscal(is) ainda requerem sua atenção
                  </span>
                  <p class="text-[11px] text-amber-800 dark:text-amber-300">
                    O preenchimento completo da alíquota efetiva e dados societários blinda o salão contra bitributação no Simples Nacional.
                  </p>
                </div>
              </div>

              <button 
                type="button" 
                (click)="preencherDadosDemonstracao()" 
                class="px-3 py-1.5 rounded-lg text-xs font-bold text-amber-900 dark:text-amber-200 bg-amber-200/80 dark:bg-amber-900/50 hover:bg-amber-300 dark:hover:bg-amber-800/80 transition-colors shrink-0 flex items-center gap-1 cursor-pointer"
                id="btn-auto-preencher-demonstracao">
                <mat-icon class="text-xs">auto_fix_high</mat-icon>
                <span>Preencher Automaticamente (Demo)</span>
              </button>
            </div>
          } @else {
            <div class="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/60 flex items-center justify-between gap-2">
              <div class="flex items-center gap-2">
                <mat-icon class="text-emerald-600 dark:text-emerald-400 text-base">check_circle</mat-icon>
                <span class="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                  Parabéns! Todas as configurações fiscais e societárias essenciais foram concluídas com sucesso.
                </span>
              </div>
              <span class="text-[11px] font-mono font-bold text-emerald-700 dark:text-emerald-400">100% Homologado</span>
            </div>
          }

          <!-- GRID DOS ITENS DO CHECKLIST FISCAL -->
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            @for (item of itens(); track item.id) {
              <div 
                class="p-4 rounded-xl border transition-all duration-200 flex flex-col justify-between gap-3 relative"
                [class.bg-emerald-50/40]="item.concluido"
                [class.dark:bg-emerald-950/15]="item.concluido"
                [class.border-emerald-300]="item.concluido"
                [class.dark:border-emerald-800/60]="item.concluido"
                [class.bg-white]="!item.concluido"
                [class.dark:bg-slate-900/60]="!item.concluido"
                [class.border-amber-300]="!item.concluido && item.obrigatorio"
                [class.dark:border-amber-800/60]="!item.concluido && item.obrigatorio"
                [class.border-slate-200]="!item.concluido && !item.obrigatorio"
                [class.dark:border-slate-800]="!item.concluido && !item.obrigatorio">
                
                <div class="space-y-2">
                  <!-- CABEÇALHO DO ITEM -->
                  <div class="flex items-start justify-between gap-2">
                    <div class="flex items-center gap-2">
                      <div 
                        class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                        [class.bg-emerald-100]="item.concluido"
                        [class.text-emerald-700]="item.concluido"
                        [class.dark:bg-emerald-950]="item.concluido"
                        [class.dark:text-emerald-300]="item.concluido"
                        [class.bg-amber-100]="!item.concluido"
                        [class.text-amber-700]="!item.concluido"
                        [class.dark:bg-amber-950]="!item.concluido"
                        [class.dark:text-amber-300]="!item.concluido">
                        <mat-icon class="text-base">{{ item.icone }}</mat-icon>
                      </div>
                      <div>
                        <h4 class="text-xs font-black text-app-text leading-snug">
                          {{ item.titulo }}
                        </h4>
                        <span class="text-[10px] text-app-muted block">
                          {{ item.subtitulo }}
                        </span>
                      </div>
                    </div>

                    <!-- BADGE CONCLUÍDO / PENDENTE -->
                    @if (item.concluido) {
                      <span class="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 shrink-0">
                        <mat-icon class="text-[10px]">check</mat-icon> Pronto
                      </span>
                    } @else {
                      <span class="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800 shrink-0">
                        <mat-icon class="text-[10px]">schedule</mat-icon> Pendente
                      </span>
                    }
                  </div>

                  <!-- DESCRIÇÃO DO REQUISITO -->
                  <p class="text-[11px] text-app-secondary leading-relaxed">
                    {{ item.descricao }}
                  </p>

                  <!-- VALOR ATUAL OU ALERTA -->
                  @if (item.concluido && item.valorAtual) {
                    <div class="p-2 rounded-lg bg-emerald-100/60 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 text-[11px] font-medium flex items-center gap-1.5">
                      <mat-icon class="text-xs text-emerald-600 dark:text-emerald-400">info</mat-icon>
                      <span class="truncate"><strong>Definido:</strong> {{ item.valorAtual }}</span>
                    </div>
                  } @else if (item.alertaPendente) {
                    <div class="p-2 rounded-lg bg-amber-100/60 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 text-[11px] font-medium flex items-center gap-1.5">
                      <mat-icon class="text-xs text-amber-600 dark:text-amber-400">priority_high</mat-icon>
                      <span class="truncate">{{ item.alertaPendente }}</span>
                    </div>
                  }
                </div>

                <!-- BOTÃO DE AÇÃO / CONFIGURAÇÃO -->
                <div class="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2">
                  <span class="text-[10px] text-app-muted uppercase font-bold">
                    {{ item.categoria }}
                  </span>

                  <button 
                    type="button" 
                    (click)="executarAcaoItem(item)"
                    class="px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                    [class.btn-primary]="!item.concluido"
                    [class.btn-secondary]="item.concluido"
                    [id]="'btn-acao-checklist-' + item.id">
                    <span>{{ item.acaoTexto }}</span>
                    <mat-icon class="text-xs">arrow_forward</mat-icon>
                  </button>
                </div>

              </div>
            }
          </div>

        </div>
      }

      <!-- MODAL DE CONFIGURAÇÃO RÁPIDA: ALÍQUOTA EFETIVA & DADOS TRIBUTÁRIOS -->
      @if (modalAliquotaAberto()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div class="bg-surface border border-app rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col text-app-text">
            
            <div class="p-5 border-b border-app flex items-center justify-between bg-slate-50 dark:bg-slate-900/60">
              <div class="flex items-center gap-2.5">
                <div class="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 flex items-center justify-center">
                  <mat-icon class="text-base">percent</mat-icon>
                </div>
                <div>
                  <h3 class="text-sm font-bold text-app-text">Alíquota Efetiva do Simples Nacional</h3>
                  <p class="text-[10px] text-app-muted">Parâmetro de apuração fiscal sobre a cota do salão</p>
                </div>
              </div>

              <button type="button" (click)="modalAliquotaAberto.set(false)" class="p-1 text-app-muted hover:text-app-text">
                <mat-icon class="text-base">close</mat-icon>
              </button>
            </div>

            <div class="p-5 space-y-4 text-xs">
              <div>
                <label class="font-bold text-app-secondary block mb-1">Alíquota Efetiva Mensal Estimada (%):</label>
                <div class="relative">
                  <input 
                    type="number" 
                    step="0.01" 
                    min="4" 
                    max="30" 
                    [(ngModel)]="tempAliquotaEfetiva" 
                    class="input-corporate font-mono text-sm pl-3 pr-8 w-full" 
                    placeholder="Ex: 8.60" />
                  <span class="absolute right-3 top-2.5 font-bold text-app-muted">%</span>
                </div>
                <p class="text-[10px] text-app-muted mt-1">
                  Taxa efetiva considerando Fator R e Anexo III (habitual entre 6.0% e 12.5%).
                </p>
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="font-bold text-app-secondary block mb-1">Faturamento RBT12 (R$):</label>
                  <input 
                    type="number" 
                    step="1000" 
                    [(ngModel)]="tempRbt12" 
                    class="input-corporate font-mono text-xs w-full" />
                </div>
                <div>
                  <label class="font-bold text-app-secondary block mb-1">Folha de Pagamento 12m (R$):</label>
                  <input 
                    type="number" 
                    step="1000" 
                    [(ngModel)]="tempFolha12m" 
                    class="input-corporate font-mono text-xs w-full" />
                </div>
              </div>

              <div class="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/60 text-[11px] space-y-1">
                <div class="flex justify-between font-medium text-blue-950 dark:text-blue-200">
                  <span>Fator R Apurado:</span>
                  <strong class="font-mono">{{ calcularFatorR() | number:'1.1-1' }}%</strong>
                </div>
                <div class="flex justify-between font-medium text-blue-950 dark:text-blue-200">
                  <span>Enquadramento Atual:</span>
                  <strong class="font-mono text-emerald-600 dark:text-emerald-400">
                    {{ calcularFatorR() >= 28 ? 'Anexo III (Alíquota Reduzida)' : 'Anexo V (Sem Fator R)' }}
                  </strong>
                </div>
              </div>
            </div>

            <div class="p-4 bg-slate-50 dark:bg-slate-900/40 border-t border-app flex items-center justify-end gap-2">
              <button type="button" (click)="modalAliquotaAberto.set(false)" class="btn-secondary text-xs">
                Cancelar
              </button>
              <button type="button" (click)="salvarAliquotaEfetiva()" class="btn-primary text-xs flex items-center gap-1">
                <mat-icon class="text-xs">save</mat-icon>
                <span>Salvar Configuração Fiscal</span>
              </button>
            </div>

          </div>
        </div>
      }

      <!-- MODAL DE CONFIGURAÇÃO RÁPIDA: DADOS DOS SÓCIOS (QSA) -->
      @if (modalSociosAberto()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div class="bg-surface border border-app rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col text-app-text max-h-[90vh]">
            
            <div class="p-5 border-b border-app flex items-center justify-between bg-slate-50 dark:bg-slate-900/60">
              <div class="flex items-center gap-2.5">
                <div class="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 flex items-center justify-center">
                  <mat-icon class="text-base">badge</mat-icon>
                </div>
                <div>
                  <h3 class="text-sm font-bold text-app-text">Quadro de Sócios e Administradores (QSA)</h3>
                  <p class="text-[10px] text-app-muted">Identificação dos sócios, participação no capital e pró-labore</p>
                </div>
              </div>

              <button type="button" (click)="modalSociosAberto.set(false)" class="p-1 text-app-muted hover:text-app-text">
                <mat-icon class="text-base">close</mat-icon>
              </button>
            </div>

            <div class="p-5 space-y-4 overflow-y-auto text-xs">
              
              <!-- LISTAGEM DE SÓCIOS CADASTRADOS -->
              <div class="space-y-2">
                <div class="flex items-center justify-between">
                  <span class="font-bold text-app-secondary">Sócios Cadastrados:</span>
                  <span class="text-[11px] font-mono text-app-muted">{{ socios().length }} sócio(s)</span>
                </div>

                @if (socios().length === 0) {
                  <div class="p-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-center text-app-muted">
                    Nenhum sócio cadastrado até o momento. Adicione os dados abaixo.
                  </div>
                } @else {
                  <div class="space-y-2">
                    @for (s of socios(); track s.id) {
                      <div class="p-3 rounded-xl border border-app bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between gap-3">
                        <div class="space-y-0.5">
                          <div class="flex items-center gap-2">
                            <strong class="text-xs text-app-text">{{ s.nome }}</strong>
                            <span class="text-[10px] font-bold px-1.5 py-0.2 rounded bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300">
                              {{ s.qualificacao }}
                            </span>
                          </div>
                          <p class="text-[10px] text-app-muted">
                            CPF: <span class="font-mono">{{ s.cpf }}</span> • Participação: <span class="font-bold">{{ s.participacao_percentual }}%</span>
                            @if (s.pro_labore_mensal) {
                              • Pró-labore: <span class="font-mono">R$ {{ s.pro_labore_mensal | number:'1.2-2' }}</span>
                            }
                          </p>
                        </div>

                        <button 
                          type="button" 
                          (click)="financeState.removerSocio(s.id)" 
                          class="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950 rounded-lg"
                          title="Remover Sócio">
                          <mat-icon class="text-xs">delete</mat-icon>
                        </button>
                      </div>
                    }
                  </div>
                }
              </div>

              <!-- FORMULÁRIO PARA ADICIONAR NOVO SÓCIO -->
              <div class="p-3.5 rounded-xl border border-purple-200 dark:border-purple-900/60 bg-purple-50/40 dark:bg-purple-950/20 space-y-3">
                <span class="font-bold text-xs text-purple-950 dark:text-purple-200 flex items-center gap-1">
                  <mat-icon class="text-xs">person_add</mat-icon>
                  Adicionar Sócio / Administrador
                </span>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label class="font-bold text-[11px] text-app-secondary block mb-1">Nome Completo:</label>
                    <input type="text" [(ngModel)]="novoSocioNome" placeholder="Nome do sócio" class="input-corporate text-xs w-full" />
                  </div>
                  <div>
                    <label class="font-bold text-[11px] text-app-secondary block mb-1">CPF:</label>
                    <input type="text" [(ngModel)]="novoSocioCpf" placeholder="000.000.000-00" class="input-corporate font-mono text-xs w-full" />
                  </div>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div>
                    <label class="font-bold text-[11px] text-app-secondary block mb-1">Participação (%):</label>
                    <input type="number" min="1" max="100" [(ngModel)]="novoSocioPercentual" placeholder="Ex: 50" class="input-corporate font-mono text-xs w-full" />
                  </div>
                  <div>
                    <label class="font-bold text-[11px] text-app-secondary block mb-1">Qualificação:</label>
                    <select [(ngModel)]="novoSocioQualificacao" class="input-corporate text-xs w-full">
                      <option value="Sócio-Administrador">Sócio-Administrador</option>
                      <option value="Sócio Cotista">Sócio Cotista</option>
                      <option value="Titular">Titular (EIRELI / SLU)</option>
                    </select>
                  </div>
                  <div>
                    <label class="font-bold text-[11px] text-app-secondary block mb-1">Pró-labore Mensal (R$):</label>
                    <input type="number" step="100" [(ngModel)]="novoSocioProLabore" placeholder="Ex: 4500" class="input-corporate font-mono text-xs w-full" />
                  </div>
                </div>

                <div class="text-right pt-1">
                  <button 
                    type="button" 
                    (click)="adicionarSocioManual()" 
                    [disabled]="!novoSocioNome || !novoSocioCpf"
                    class="btn-primary text-xs py-1.5 px-3 disabled:opacity-50 flex items-center gap-1 ml-auto">
                    <mat-icon class="text-xs">add</mat-icon>
                    <span>Salvar Sócio</span>
                  </button>
                </div>
              </div>

            </div>

            <div class="p-4 bg-slate-50 dark:bg-slate-900/40 border-t border-app flex items-center justify-end">
              <button type="button" (click)="modalSociosAberto.set(false)" class="btn-primary text-xs">
                Concluir
              </button>
            </div>

          </div>
        </div>
      }

    </div>
  `
})
export class PrimeirosPassosChecklistComponent {
  readonly financeState = inject(FinanceStateService);
  readonly tourService = inject(TourGuiadoService);

  readonly expandido = signal<boolean>(true);
  readonly modalAliquotaAberto = signal<boolean>(false);
  readonly modalSociosAberto = signal<boolean>(false);

  // Estados temporários do modal de alíquota
  tempAliquotaEfetiva = 8.60;
  tempRbt12 = 420000;
  tempFolha12m = 119700;

  // Estados temporários do modal de sócios
  novoSocioNome = '';
  novoSocioCpf = '';
  novoSocioPercentual = 50;
  novoSocioQualificacao = 'Sócio-Administrador';
  novoSocioProLabore = 5000;

  readonly empresa = computed(() => this.financeState.empresaAtiva());
  readonly parceiros = computed(() => this.financeState.parceiros());
  readonly socios = computed(() => this.empresa().socios || []);

  readonly itens = computed<ItemChecklistFiscal[]>(() => {
    const emp = this.empresa();
    const parcs = this.parceiros();
    const socs = emp.socios || [];

    const temAliquota = (emp.aliquota_efetiva_simples && emp.aliquota_efetiva_simples > 0) || false;
    const temSocios = socs.length > 0;
    const temCertificado = emp.certificado_digital_status === 'VALIDO';
    const temParceiros = parcs.length > 0;
    const temContratosHomologados = parcs.some(p => p.status_contrato === 'HOMOLOGADO_SINDICATO');
    const temInscricaoMunicipal = !!emp.inscricao_municipal && emp.inscricao_municipal.trim().length > 3;

    return [
      {
        id: 'aliquota-efetiva',
        titulo: 'Alíquota Efetiva do Simples',
        subtitulo: 'Anexo III vs V & Fator R',
        descricao: 'Defina a alíquota mensal incidente sobre a cota retida da empresa (ex: 8,60%) para cálculo correto do DAS.',
        categoria: 'FISCAL',
        icone: 'percent',
        concluido: temAliquota,
        obrigatorio: true,
        valorAtual: temAliquota ? `${emp.aliquota_efetiva_simples?.toFixed(2)}% (Fator R ${(emp.fator_r_atual * 100).toFixed(1)}%)` : undefined,
        alertaPendente: 'Alíquota efetiva ainda não informada',
        acaoTexto: temAliquota ? 'Alterar' : 'Configurar',
        tipoAcao: 'MODAL_ALIQUOTA'
      },
      {
        id: 'dados-socios',
        titulo: 'Quadro Societário (Sócios)',
        subtitulo: 'QSA, CPFs & Pró-labore',
        descricao: 'Cadastro dos sócios cotistas e administradores para distribuição de lucros isentos e cálculo da folha 12m.',
        categoria: 'SOCIETARIO',
        icone: 'badge',
        concluido: temSocios,
        obrigatorio: true,
        valorAtual: temSocios ? `${socs.length} sócio(s) registrado(s)` : undefined,
        alertaPendente: 'Nenhum sócio registrado no sistema',
        acaoTexto: temSocios ? 'Ver Sócios' : 'Cadastrar Sócios',
        tipoAcao: 'MODAL_SOCIOS'
      },
      {
        id: 'profissionais-parceiros',
        titulo: 'Profissionais MEI Parceiros',
        subtitulo: 'Validação CNPJ & Chaves PIX',
        descricao: 'Cadastro de cabeleireiros, manicures e barbeiros com contrato de parceria e chave PIX cadastrada.',
        categoria: 'LEI_SALAO',
        icone: 'groups',
        concluido: temParceiros,
        obrigatorio: true,
        valorAtual: temParceiros ? `${parcs.length} MEI(s) ativo(s)` : undefined,
        alertaPendente: 'Nenhum parceiro MEI cadastrado',
        acaoTexto: 'Gerenciar MEIs',
        tipoAcao: 'ROTA_PARCEIROS',
        rota: '/parceiros'
      },
      {
        id: 'homologacao-contratos',
        titulo: 'Contratos Homologados',
        subtitulo: 'Sindicato da Categoria / MTE',
        descricao: 'Exigência da Lei 13.352 para evitar vínculo empregatício e legitimar a retenção de cotas do salão.',
        categoria: 'LEI_SALAO',
        icone: 'gavel',
        concluido: temContratosHomologados,
        obrigatorio: true,
        valorAtual: temContratosHomologados ? 'Contratos homologados válidos' : undefined,
        alertaPendente: 'Contratos pendentes de homologação',
        acaoTexto: 'Ver Contratos',
        tipoAcao: 'ROTA_PARCEIROS',
        rota: '/parceiros'
      },
      {
        id: 'certificado-digital',
        titulo: 'Certificado Digital e-CNPJ',
        subtitulo: 'Emissão de NFS-e A1',
        descricao: 'Certificado digital ICP-Brasil para comunicação e autorização de notas fiscais de serviço no emissor.',
        categoria: 'FISCAL',
        icone: 'verified_user',
        concluido: temCertificado,
        obrigatorio: false,
        valorAtual: temCertificado ? 'Certificado A1 Válido (e-CNPJ)' : undefined,
        alertaPendente: 'Certificado A1 não configurado',
        acaoTexto: 'Ver Certificado',
        tipoAcao: 'ROTA_CONFIG',
        rota: '/configuracoes'
      },
      {
        id: 'inscricao-municipal',
        titulo: 'Inscrição Municipal & CNAE',
        subtitulo: 'Alíquota ISS 2.0% (São Paulo)',
        descricao: 'Inscrição tributária municipal da prefeitura e CNAE 9602-5/01 para apuração do ISS no Simples.',
        categoria: 'OPERACIONAL',
        icone: 'domain',
        concluido: temInscricaoMunicipal,
        obrigatorio: true,
        valorAtual: temInscricaoMunicipal ? `IM: ${emp.inscricao_municipal}` : undefined,
        alertaPendente: 'Inscrição municipal não informada',
        acaoTexto: 'Ver Dados',
        tipoAcao: 'ROTA_CONFIG',
        rota: '/configuracoes'
      }
    ];
  });

  readonly totalConcluidos = computed(() => this.itens().filter(i => i.concluido).length);
  readonly totalPendentes = computed(() => this.itens().filter(i => !i.concluido).length);
  
  readonly percentualConcluido = computed(() => {
    const list = this.itens();
    if (!list.length) return 0;
    return Math.round((this.totalConcluidos() / list.length) * 100);
  });

  calcularFatorR(): number {
    if (!this.tempRbt12 || this.tempRbt12 <= 0) return 0;
    return (this.tempFolha12m / this.tempRbt12) * 100;
  }

  executarAcaoItem(item: ItemChecklistFiscal) {
    if (item.tipoAcao === 'MODAL_ALIQUOTA') {
      const emp = this.empresa();
      this.tempAliquotaEfetiva = emp.aliquota_efetiva_simples || 8.60;
      this.tempRbt12 = emp.rbt12 || 420000;
      this.tempFolha12m = emp.folha_12m || 119700;
      this.modalAliquotaAberto.set(true);
    } else if (item.tipoAcao === 'MODAL_SOCIOS') {
      this.modalSociosAberto.set(true);
    } else if (item.rota) {
      window.location.hash = item.rota;
    }
  }

  salvarAliquotaEfetiva() {
    const fatorR = this.tempRbt12 > 0 ? (this.tempFolha12m / this.tempRbt12) : 0.285;
    const anexo = fatorR >= 0.28 ? 'ANEXO_III' : 'ANEXO_V';

    this.financeState.atualizarEmpresa({
      aliquota_efetiva_simples: Number(this.tempAliquotaEfetiva),
      rbt12: Number(this.tempRbt12),
      folha_12m: Number(this.tempFolha12m),
      fator_r_atual: Number((fatorR).toFixed(4)),
      anexo_simples: anexo
    });

    this.modalAliquotaAberto.set(false);
  }

  adicionarSocioManual() {
    if (!this.novoSocioNome || !this.novoSocioCpf) return;

    const novoSocio: SocioEmpresa = {
      id: `socio-${Date.now()}`,
      nome: this.novoSocioNome.trim(),
      cpf: this.novoSocioCpf.trim(),
      participacao_percentual: Number(this.novoSocioPercentual) || 50,
      qualificacao: this.novoSocioQualificacao || 'Sócio-Administrador',
      pro_labore_mensal: Number(this.novoSocioProLabore) || 5000
    };

    this.financeState.salvarSocio(novoSocio);

    // Limpa campos
    this.novoSocioNome = '';
    this.novoSocioCpf = '';
    this.novoSocioPercentual = 50;
    this.novoSocioProLabore = 5000;
  }

  preencherDadosDemonstracao() {
    this.financeState.atualizarEmpresa({
      aliquota_efetiva_simples: 8.60,
      rbt12: 420000,
      folha_12m: 119700,
      fator_r_atual: 0.285,
      anexo_simples: 'ANEXO_III',
      certificado_digital_status: 'VALIDO',
      inscricao_municipal: '5.891.204-1',
      socios: [
        {
          id: 'socio-1',
          nome: 'Renata Albuquerque Castro',
          cpf: '189.442.998-34',
          participacao_percentual: 70,
          qualificacao: 'Sócio-Administrador',
          pro_labore_mensal: 6000.00
        },
        {
          id: 'socio-2',
          nome: 'Eduardo Guimarães Prado',
          cpf: '245.881.009-12',
          participacao_percentual: 30,
          qualificacao: 'Sócio Cotista',
          pro_labore_mensal: 2500.00
        }
      ]
    });
  }
}
