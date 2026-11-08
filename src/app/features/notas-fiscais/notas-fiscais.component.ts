import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { FinanceStateService } from '../../core/services/finance-state.service';
import { VisaoGeralNfseComponent } from '../../shared/components/visao-geral-nfse.component';
import { LeitorXmlNfseComponent } from '../../shared/components/leitor-xml-nfse.component';

@Component({
  selector: 'app-notas-fiscais',
  imports: [CommonModule, FormsModule, MatIconModule, VisaoGeralNfseComponent, LeitorXmlNfseComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-6 animate-fade-in" id="notas-fiscais-page">
      
      <!-- CABEÇALHO DA PÁGINA -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 class="text-xl md:text-2xl font-bold text-app-text tracking-tight flex items-center gap-2">
            <mat-icon class="text-[#17324d] dark:text-blue-300">receipt_long</mat-icon>
            Central de Notas Fiscais Eletrônicas (NFS-e)
          </h1>
          <p class="text-xs text-app-secondary mt-0.5">
            Gestão fiscal completa: leitor automático de XMLs de repasse, integração SEFAZ/Prefeituras e espelhos DANFSe.
          </p>
        </div>

        <!-- SELETOR DE ABAS PRINCIPAIS -->
        <div class="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-app self-start sm:self-auto">
          <button 
            type="button" 
            (click)="abaAtiva.set('visao_geral')"
            [class.bg-white]="abaAtiva() === 'visao_geral'"
            [class.dark:bg-slate-700]="abaAtiva() === 'visao_geral'"
            [class.shadow-xs]="abaAtiva() === 'visao_geral'"
            [class.text-app-text]="abaAtiva() === 'visao_geral'"
            [class.text-app-muted]="abaAtiva() !== 'visao_geral'"
            class="px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5">
            <mat-icon class="text-xs">dashboard</mat-icon>
            <span>Visão Geral & Notas</span>
          </button>

          <button 
            type="button" 
            (click)="abaAtiva.set('importador_xml')"
            [class.bg-white]="abaAtiva() === 'importador_xml'"
            [class.dark:bg-slate-700]="abaAtiva() === 'importador_xml'"
            [class.shadow-xs]="abaAtiva() === 'importador_xml'"
            [class.text-indigo-600]="abaAtiva() === 'importador_xml'"
            [class.dark:text-indigo-300]="abaAtiva() === 'importador_xml'"
            [class.text-app-muted]="abaAtiva() !== 'importador_xml'"
            class="px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5">
            <mat-icon class="text-xs">cloud_upload</mat-icon>
            <span>Importador de XMLs</span>
          </button>
        </div>
      </div>

      <!-- CONTEÚDO DAS ABAS -->
      @if (abaAtiva() === 'importador_xml') {
        <div class="space-y-4 animate-fade-in">
          <app-leitor-xml-nfse></app-leitor-xml-nfse>
          <app-visao-geral-nfse></app-visao-geral-nfse>
        </div>
      } @else {
        <div class="space-y-4 animate-fade-in">
          <!-- VISÃO GERAL NFS-e COM CARTÕES INTERATIVOS -->
          <app-visao-geral-nfse></app-visao-geral-nfse>
        </div>
      }

    </div>
  `
})
export class NotasFiscaisComponent {
  readonly financeState = inject(FinanceStateService);
  readonly abaAtiva = signal<'visao_geral' | 'importador_xml'>('visao_geral');
}
