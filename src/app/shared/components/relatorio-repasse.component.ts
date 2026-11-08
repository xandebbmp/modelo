import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { RelatorioRepasseService } from '../../core/services/relatorio-repasse.service';
import { FinanceStateService } from '../../core/services/finance-state.service';
import { CsvExportService } from '../../core/services/csv-export.service';
import { ResumoRepasseParceiro } from '../../core/models/relatorio-repasse.model';

@Component({
  selector: 'app-relatorio-repasse-widget',
  imports: [CommonModule, RouterLink, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="card-corporate p-5 space-y-4" id="relatorio-repasse-widget">
      
      <!-- Cabeçalho do Widget -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div class="flex items-center gap-2.5">
          <div class="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
            <mat-icon class="text-lg">payments</mat-icon>
          </div>
          <div>
            <h3 class="font-bold text-sm text-app-text">Relatório de Repasses & Taxas (Lei 13.352)</h3>
            <p class="text-[11px] text-app-muted">Vendas brutas com deduções de operadora e valor líquido por parceiro</p>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <button 
            type="button" 
            (click)="csvExport.exportarHistoricoCompletoRepassesCSV()" 
            class="btn-secondary text-xs py-1 px-2.5 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900 flex items-center gap-1"
            id="btn-csv-widget-repasses"
            title="Exportar Repasses em CSV">
            <mat-icon class="text-xs text-emerald-600 dark:text-emerald-400">table_view</mat-icon>
            <span>CSV</span>
          </button>

          <a routerLink="/relatorio-repasse" class="text-xs font-bold text-[#17324d] dark:text-blue-300 hover:underline flex items-center gap-1">
            <span>Ver Completo</span>
            <mat-icon class="text-xs">arrow_forward</mat-icon>
          </a>
        </div>
      </div>

      <!-- Resumo Numérico Rápido -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
        <div class="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-app">
          <span class="text-[9px] uppercase font-bold text-app-muted block">Vendas Brutas</span>
          <span class="text-sm font-bold font-mono text-app-text mt-0.5 block">
            R$ {{ relatorio().total_bruto_geral | number:'1.2-2' }}
          </span>
        </div>

        <div class="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-app">
          <span class="text-[9px] uppercase font-bold text-red-500 block">Taxas Cartão</span>
          <span class="text-sm font-bold font-mono text-red-500 mt-0.5 block">
            - R$ {{ relatorio().total_taxas_operadora_geral | number:'1.2-2' }}
          </span>
        </div>

        <div class="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-app">
          <span class="text-[9px] uppercase font-bold text-[#b66a3c] block">Cota Salão</span>
          <span class="text-sm font-bold font-mono text-[#b66a3c] mt-0.5 block">
            R$ {{ relatorio().total_cota_salao_geral | number:'1.2-2' }}
          </span>
        </div>

        <div class="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
          <span class="text-[9px] uppercase font-bold text-emerald-700 dark:text-emerald-300 block">Líquido MEIs</span>
          <span class="text-sm font-black font-mono text-emerald-700 dark:text-emerald-300 mt-0.5 block">
            R$ {{ relatorio().total_liquido_repasses_geral | number:'1.2-2' }}
          </span>
        </div>
      </div>

      <!-- Lista Rápida dos Parceiros -->
      <div class="space-y-2 pt-1">
        @for (p of relatorio().parceiros_resumo.slice(0, 3); track p.id_parceiro) {
          <div class="p-2.5 rounded-lg border border-app bg-surface flex items-center justify-between text-xs">
            <div class="flex items-center gap-2.5 min-w-0">
              <img 
                [src]="p.foto_avatar" 
                [alt]="p.nome_parceiro" 
                referrerpolicy="no-referrer"
                class="w-7 h-7 rounded-full object-cover border border-app shrink-0">
              <div class="truncate">
                <span class="font-bold text-app-text block leading-none truncate">{{ p.nome_parceiro }}</span>
                <span class="text-[10px] text-app-muted">{{ p.quantidade_atendimentos }} atendimentos • Taxa Cartão: R$ {{ p.total_taxas_operadora_descontadas | number:'1.0-0' }}</span>
              </div>
            </div>

            <div class="text-right shrink-0">
              <span class="font-bold font-mono text-emerald-600 dark:text-emerald-400 block text-xs">
                R$ {{ p.valor_liquido_transferir | number:'1.2-2' }}
              </span>
              <span class="text-[9px] font-semibold" [class.text-emerald-600]="p.status_repasse === 'TRANSFERIDO_PIX'" [class.text-amber-600]="p.status_repasse !== 'TRANSFERIDO_PIX'">
                {{ p.status_repasse === 'TRANSFERIDO_PIX' ? 'PIX Pago' : 'Pendente' }}
              </span>
            </div>
          </div>
        }
      </div>

    </div>
  `
})
export class RelatorioRepasseWidgetComponent {
  readonly repasseService = inject(RelatorioRepasseService);
  readonly csvExport = inject(CsvExportService);
  readonly relatorio = computed(() => this.repasseService.relatorioConsolidado());
}
