import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { FinanceStateService } from '../../core/services/finance-state.service';

@Component({
  selector: 'app-cards-resumo-topo-dashboard',
  imports: [CommonModule, RouterLink, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-2 mb-4" id="cards-resumo-topo-dashboard">
      <!-- GRID COM OS 3 NÚMEROS CHAVE PRINCIPAIS COM ANIMAÇÃO DE ENTRADA SUAVE -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">

        <!-- CARD 1: TOTAL REPASSADO NO MÊS -->
        <div 
          class="card-corporate p-5 relative overflow-hidden flex flex-col justify-between border-l-4 border-l-emerald-500 hover:border-emerald-400 dark:hover:border-emerald-600 transition-all duration-300 shadow-xs hover:shadow-md animate-card-stagger-1 group"
          id="card-resumo-total-repassado">
          
          <!-- Brilho sutil de fundo decorativo -->
          <div class="absolute -right-6 -bottom-6 w-24 h-24 bg-emerald-500/10 rounded-full blur-xl pointer-events-none group-hover:scale-125 transition-transform duration-500"></div>

          <div>
            <div class="flex items-center justify-between gap-2 mb-2">
              <span class="text-[11px] font-extrabold uppercase tracking-wider text-app-secondary">
                Total Repassado no Mês
              </span>
              <div class="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0 border border-emerald-200 dark:border-emerald-900/50">
                <mat-icon class="text-base">payments</mat-icon>
              </div>
            </div>

            <div class="space-y-1">
              <div class="flex items-baseline gap-1.5">
                <span class="text-2xl lg:text-3xl font-black font-mono text-emerald-600 dark:text-emerald-400 tracking-tight">
                  R$ {{ totalRepassadoMes() | number:'1.2-2' }}
                </span>
              </div>

              <div class="flex items-center gap-1.5 text-[11px] text-app-muted">
                <span class="inline-flex items-center text-emerald-600 dark:text-emerald-400 font-bold">
                  <mat-icon class="text-xs mr-0.5">verified_user</mat-icon> Lei 13.352/2016
                </span>
                <span>• Base 100% Isenta</span>
              </div>
            </div>
          </div>

          <div class="pt-3 mt-3 border-t border-app flex items-center justify-between text-xs">
            <span class="text-app-secondary text-[11px]">
              <strong class="text-app-text font-mono">{{ repassesLiquidadosCount() }}</strong> de <strong class="text-app-text font-mono">{{ totalFechamentosCount() }}</strong> liquidados
            </span>
            <a 
              routerLink="/relatorio-repasse" 
              class="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 hover:underline inline-flex items-center gap-0.5"
              id="link-ver-relatorio-repasses">
              <span>Ver Rateio</span>
              <mat-icon class="text-xs">arrow_forward</mat-icon>
            </a>
          </div>
        </div>

        <!-- CARD 2: NÚMERO DE MEIS ATIVOS -->
        <div 
          class="card-corporate p-5 relative overflow-hidden flex flex-col justify-between border-l-4 border-l-[#17324d] dark:border-l-blue-400 hover:border-blue-400 dark:hover:border-blue-500 transition-all duration-300 shadow-xs hover:shadow-md animate-card-stagger-2 group"
          id="card-resumo-meis-ativos">
          
          <!-- Brilho sutil de fundo decorativo -->
          <div class="absolute -right-6 -bottom-6 w-24 h-24 bg-blue-500/10 rounded-full blur-xl pointer-events-none group-hover:scale-125 transition-transform duration-500"></div>

          <div>
            <div class="flex items-center justify-between gap-2 mb-2">
              <span class="text-[11px] font-extrabold uppercase tracking-wider text-app-secondary">
                Número de MEIs Ativos
              </span>
              <div class="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-950/80 text-[#17324d] dark:text-blue-300 flex items-center justify-center shrink-0 border border-blue-200 dark:border-blue-900/50">
                <mat-icon class="text-base">groups</mat-icon>
              </div>
            </div>

            <div class="space-y-1">
              <div class="flex items-baseline gap-2">
                <span class="text-2xl lg:text-3xl font-black font-mono text-app-text tracking-tight">
                  {{ meisAtivosCount() }}
                </span>
                <span class="text-xs font-bold text-app-secondary">
                  profissionais homologados
                </span>
              </div>

              <div class="flex items-center gap-1.5 text-[11px] text-app-muted">
                <span class="inline-flex items-center text-blue-700 dark:text-blue-300 font-bold">
                  <mat-icon class="text-xs mr-0.5">check_circle</mat-icon> CNPJ & Contratos Regulares
                </span>
              </div>
            </div>
          </div>

          <div class="pt-3 mt-3 border-t border-app flex items-center justify-between text-xs">
            <span class="text-app-secondary text-[11px]">
              Teto Anual: <strong class="text-app-text font-mono">R$ 81.000</strong>
            </span>
            <a 
              routerLink="/parceiros" 
              class="text-[11px] font-bold text-[#17324d] dark:text-blue-300 hover:underline inline-flex items-center gap-0.5"
              id="link-gerenciar-parceiros">
              <span>Gerenciar Equipe</span>
              <mat-icon class="text-xs">arrow_forward</mat-icon>
            </a>
          </div>
        </div>

        <!-- CARD 3: DATA DA PRÓXIMA APURAÇÃO DO SIMPLES -->
        <div 
          class="card-corporate p-5 relative overflow-hidden flex flex-col justify-between border-l-4 border-l-purple-600 hover:border-purple-400 dark:hover:border-purple-500 transition-all duration-300 shadow-xs hover:shadow-md animate-card-stagger-3 group"
          id="card-resumo-proxima-apuracao">
          
          <!-- Brilho sutil de fundo decorativo -->
          <div class="absolute -right-6 -bottom-6 w-24 h-24 bg-purple-500/10 rounded-full blur-xl pointer-events-none group-hover:scale-125 transition-transform duration-500"></div>

          <div>
            <div class="flex items-center justify-between gap-2 mb-2">
              <span class="text-[11px] font-extrabold uppercase tracking-wider text-app-secondary">
                Data da Próxima Apuração do Simples
              </span>
              <div class="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 flex items-center justify-center shrink-0 border border-purple-200 dark:border-purple-900/50">
                <mat-icon class="text-base">event</mat-icon>
              </div>
            </div>

            <div class="space-y-1">
              <div class="flex items-baseline gap-2">
                <span class="text-2xl lg:text-3xl font-black font-mono text-purple-700 dark:text-purple-300 tracking-tight">
                  {{ dataProximaApuracao() }}
                </span>
                <span class="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-100 dark:bg-purple-900/60 text-purple-800 dark:text-purple-200 border border-purple-200 dark:border-purple-800">
                  PGDAS-D
                </span>
              </div>

              <div class="flex items-center gap-1.5 text-[11px] text-app-muted">
                <span class="inline-flex items-center text-purple-700 dark:text-purple-300 font-bold">
                  <mat-icon class="text-xs mr-0.5">schedule</mat-icon> Em {{ diasRestantesApuracao() }} dias
                </span>
                <span>• Vencimento DAS</span>
              </div>
            </div>
          </div>

          <div class="pt-3 mt-3 border-t border-app flex items-center justify-between text-xs">
            <span class="text-app-secondary text-[11px]">
              Alíquota Efetiva: <strong class="text-app-text font-mono">{{ aliquotaEfetiva() }}%</strong>
            </span>
            <a 
              routerLink="/simulador-tributario" 
              class="text-[11px] font-bold text-purple-700 dark:text-purple-300 hover:underline inline-flex items-center gap-0.5"
              id="link-simular-das">
              <span>Simular DAS</span>
              <mat-icon class="text-xs">arrow_forward</mat-icon>
            </a>
          </div>
        </div>

      </div>
    </div>
  `
})
export class CardsResumoTopoDashboardComponent {
  readonly financeState = inject(FinanceStateService);

  readonly totalRepassadoMes = computed(() => this.financeState.totalRepassesMeiMes());
  
  readonly repassesLiquidadosCount = computed(() => {
    return this.financeState.fechamentos().filter(f => f.status === 'PAGO').length;
  });

  readonly totalFechamentosCount = computed(() => {
    return this.financeState.fechamentos().length;
  });

  readonly meisAtivosCount = computed(() => {
    return this.financeState.parceiros().filter(p => p.status_mei === 'ATIVO_REGULAR').length;
  });

  readonly empresa = computed(() => this.financeState.empresaAtiva());

  readonly aliquotaEfetiva = computed(() => {
    return this.empresa().aliquota_efetiva_simples || 8.60;
  });

  // Data da próxima apuração do Simples Nacional (Dia 20 do mês seguinte à competência de Agosto/2026)
  readonly dataProximaApuracao = computed(() => '20/09/2026');

  readonly diasRestantesApuracao = computed(() => {
    // Calculado a partir de 30/08/2026 até 20/09/2026 = 21 dias
    const hoje = new Date(2026, 7, 30); // Agosto é mês 7 (0-indexed)
    const dataVencimento = new Date(2026, 8, 20); // Setembro é mês 8
    const diffTime = dataVencimento.getTime() - hoje.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(1, diffDays);
  });
}
