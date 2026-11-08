import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { FinanceStateService } from '../../core/services/finance-state.service';
import { Parceiro } from '../../core/models/parceiro.model';
import { FechamentoMensal } from '../../core/models/fechamento.model';

@Component({
  selector: 'app-simulador-mobile-mei',
  imports: [CommonModule, FormsModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-fade-in" id="modal-simulador-mobile">
      
      <!-- Container do Smartphone Mockup -->
      <div class="relative w-full max-w-sm bg-slate-900 rounded-[2.5rem] p-3 shadow-2xl border-4 border-slate-700">
        
        <!-- Notch Superior -->
        <div class="absolute top-4 left-1/2 -translate-x-1/2 w-24 h-4 bg-slate-800 rounded-full z-20 flex items-center justify-center">
          <div class="w-2.5 h-2.5 rounded-full bg-slate-900 border border-slate-700"></div>
        </div>

        <!-- Tela do Celular -->
        <div class="bg-slate-950 text-slate-100 rounded-[2rem] overflow-hidden flex flex-col h-[600px] text-xs">
          
          <!-- Status Bar -->
          <div class="pt-3 px-5 pb-2 flex justify-between items-center text-[10px] text-slate-400">
            <span>09:41</span>
            <div class="flex items-center gap-1.5">
              <mat-icon class="text-xs">wifi</mat-icon>
              <mat-icon class="text-xs">battery_full</mat-icon>
            </div>
          </div>

          <!-- Header do App do Parceiro -->
          <div class="px-4 py-3 bg-[#17324d] text-white flex items-center justify-between border-b border-[#244666]">
            <div class="flex items-center gap-2">
              <div class="w-8 h-8 rounded-full bg-blue-400/20 text-blue-300 flex items-center justify-center font-bold text-xs overflow-hidden border border-blue-400/30">
                @if (parceiroAtivo()?.foto_avatar; as foto) {
                  <img [src]="foto" alt="Avatar" class="w-full h-full object-cover" />
                } @else {
                  <mat-icon class="text-sm">person</mat-icon>
                }
              </div>
              <div>
                <span class="font-bold text-xs block leading-tight">{{ parceiroAtivo()?.nome_fantasia || 'Parceiro MEI' }}</span>
                <span class="text-[9px] text-blue-200 block">{{ parceiroAtivo()?.especialidade }} • MEI Ativo</span>
              </div>
            </div>

            <button 
              type="button" 
              (click)="fecharSimulador()"
              class="p-1 rounded-full bg-white/10 hover:bg-white/20 text-white">
              <mat-icon class="text-sm">close</mat-icon>
            </button>
          </div>

          <!-- Seletor do Parceiro Simulado -->
          <div class="p-2 bg-slate-900 border-b border-slate-800 flex items-center gap-2">
            <span class="text-[10px] text-slate-400">Ver como:</span>
            <select 
              [ngModel]="financeState.parceiroMobileSimuladoId()"
              (ngModelChange)="financeState.parceiroMobileSimuladoId.set($event)"
              class="flex-1 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-[11px] text-slate-200 outline-none">
              @for (p of financeState.parceiros(); track p.id) {
                <option [value]="p.id">{{ p.nome_fantasia }}</option>
              }
            </select>
          </div>

          <!-- Conteúdo Rolável do App Mobile -->
          <div class="flex-1 overflow-y-auto p-4 space-y-4">
            
            <!-- Card de Repasse Disponível -->
            <div class="p-4 rounded-2xl bg-gradient-to-br from-emerald-900/60 to-emerald-950 border border-emerald-700/50 space-y-2">
              <div class="flex justify-between items-center text-[10px] text-emerald-300">
                <span class="font-bold uppercase tracking-wider">Repasse Líquido de Agosto</span>
                <span class="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                  {{ fechamentoParceiro()?.status === 'PAGO' ? 'RECEBIDO PIX' : 'LIBERADO' }}
                </span>
              </div>
              <div class="text-2xl font-black font-mono text-emerald-400">
                R$ {{ fechamentoParceiro()?.valor_liquido_nota | number:'1.2-2' }}
              </div>
              <div class="text-[10px] text-slate-300 pt-2 border-t border-emerald-800/40 flex justify-between">
                <span>Produção Bruta:</span>
                <span class="font-mono">R$ {{ fechamentoParceiro()?.valor_bruto_producao | number:'1.2-2' }}</span>
              </div>
            </div>

            <!-- Ação Rápida: Emissão de NFS-e 1-Clique -->
            @if (fechamentoParceiro()?.status === 'PENDENTE_EMISSAO') {
              <div class="p-3 bg-amber-950/40 border border-amber-800/50 rounded-xl space-y-2">
                <div class="flex items-center gap-1.5 text-amber-300 font-bold text-[11px]">
                  <mat-icon class="text-sm">notification_important</mat-icon>
                  <span>NFS-e MEI Pendente de Emissão</span>
                </div>
                <p class="text-[10px] text-slate-300">
                  Emita agora a sua nota fiscal eletrônica contra o CNPJ {{ financeState.empresaAtiva().cnpj }} para liberar a transferência PIX.
                </p>
                <button 
                  type="button" 
                  (click)="emitirNota1Clique()"
                  class="w-full py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md">
                  <mat-icon class="text-sm">touch_app</mat-icon> Emitir NFS-e com 1-Clique
                </button>
              </div>
            } @else {
              <div class="p-3 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <mat-icon class="text-emerald-400 text-base">check_circle</mat-icon>
                  <div>
                    <span class="font-bold text-[11px] text-slate-200 block">NFS-e Emitida com Sucesso</span>
                    <span class="text-[9px] text-slate-400 font-mono">Nº {{ fechamentoParceiro()?.numero_nota_mei }}</span>
                  </div>
                </div>
                <span class="text-[10px] text-blue-400 font-bold">Ver DANFSE</span>
              </div>
            }

            <!-- Termômetro do Limite MEI -->
            <div class="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-1.5">
              <div class="flex justify-between text-[10px]">
                <span class="text-slate-400">Limite Anual do MEI:</span>
                <span class="font-bold text-slate-200">R$ {{ parceiroAtivo()?.faturamento_anual_acumulado | number:'1.0-0' }} / 81k</span>
              </div>
              <div class="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div class="h-full bg-emerald-500 rounded-full" [style.width.%]="percentualTetoMei()"></div>
              </div>
              <span class="text-[9px] text-slate-400 block text-right">
                Saldo restante: R$ {{ (81000 - (parceiroAtivo()?.faturamento_anual_acumulado || 0)) | number:'1.0-0' }}
              </span>
            </div>

            <!-- Comprovante de Pagamento PIX -->
            @if (fechamentoParceiro()?.status === 'PAGO') {
              <div class="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-1.5">
                <div class="flex items-center gap-1.5 text-emerald-400 font-bold text-[11px]">
                  <mat-icon class="text-sm">receipt</mat-icon> Comprovante de Quitação PIX
                </div>
                <div class="text-[10px] text-slate-400 space-y-1 font-mono">
                  <div class="flex justify-between">
                    <span>Data:</span>
                    <span class="text-slate-200">{{ fechamentoParceiro()?.data_pagamento_efetuado }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span>Chave PIX:</span>
                    <span class="text-slate-200">{{ fechamentoParceiro()?.chave_pix_pagamento }}</span>
                  </div>
                </div>
              </div>
            }

          </div>

          <!-- Bottom Nav Bar -->
          <div class="p-2 bg-slate-900 border-t border-slate-800 flex justify-around text-[10px] text-slate-400">
            <div class="flex flex-col items-center text-blue-400 font-bold">
              <mat-icon class="text-base">account_balance_wallet</mat-icon>
              <span>Repasses</span>
            </div>
            <div class="flex flex-col items-center hover:text-slate-200 cursor-pointer">
              <mat-icon class="text-base">receipt_long</mat-icon>
              <span>NFS-e</span>
            </div>
            <div class="flex flex-col items-center hover:text-slate-200 cursor-pointer">
              <mat-icon class="text-base">gavel</mat-icon>
              <span>Contrato</span>
            </div>
          </div>

        </div>

      </div>

    </div>
  `
})
export class SimuladorMobileMeiComponent {
  readonly financeState = inject(FinanceStateService);

  readonly parceiroAtivo = computed<Parceiro | null>(() => {
    const id = this.financeState.parceiroMobileSimuladoId();
    return this.financeState.parceiros().find(p => p.id === id) || this.financeState.parceiros()[0] || null;
  });

  readonly fechamentoParceiro = computed<FechamentoMensal | null>(() => {
    const id = this.financeState.parceiroMobileSimuladoId();
    return this.financeState.fechamentos().find(f => f.id_parceiro === id) || null;
  });

  readonly percentualTetoMei = computed<number>(() => {
    const p = this.parceiroAtivo();
    if (!p) return 0;
    return (p.faturamento_anual_acumulado / 81000) * 100;
  });

  fecharSimulador() {
    this.financeState.modoSimuladorMobile.set(false);
  }

  emitirNota1Clique() {
    const fech = this.fechamentoParceiro();
    if (fech) {
      this.financeState.emitirNotaFiscalMei1Clique(fech.id);
    }
  }
}
