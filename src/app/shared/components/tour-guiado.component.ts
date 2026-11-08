import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { TourGuiadoService } from '../../core/services/tour-guiado.service';

@Component({
  selector: 'app-tour-guiado',
  imports: [CommonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (tourService.tourAtivo()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in" id="tour-overlay">
        
        <!-- CARD DO MODAL DO TOUR -->
        <div 
          class="bg-surface border border-app rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col transform transition-all duration-300 relative text-app-text"
          id="tour-modal-card">
          
          <!-- BARRA SUPERIOR DECORATIVA COM PALETA CORPORATIVA -->
          <div class="h-2 bg-gradient-to-r from-[#17324d] via-[#b66a3c] to-[#10956a]"></div>

          <!-- CABEÇALHO DO PASSO -->
          <div class="p-5 sm:p-6 pb-4 border-b border-app flex items-start justify-between gap-4">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-[#17324d] text-white flex items-center justify-center shadow-sm shrink-0">
                <mat-icon class="text-xl">{{ passo().icone }}</mat-icon>
              </div>
              <div>
                <div class="flex items-center gap-2">
                  <span class="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#17324d]/10 dark:bg-blue-500/20 text-[#17324d] dark:text-blue-300">
                    {{ passo().badge || 'Passo ' + (tourService.passoAtualIndex() + 1) + ' de ' + tourService.totalPassos() }}
                  </span>
                  <span class="text-xs text-app-muted font-mono">
                    {{ tourService.passoAtualIndex() + 1 }} / {{ tourService.totalPassos() }}
                  </span>
                </div>
                <h2 class="text-base sm:text-lg font-bold text-app-text leading-tight mt-1">
                  {{ passo().titulo }}
                </h2>
              </div>
            </div>

            <!-- BOTÃO FECHAR / PULAR -->
            <button 
              type="button" 
              (click)="tourService.concluirTour()" 
              class="p-1.5 rounded-lg text-app-muted hover:text-app-text hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Fechar Tour"
              id="btn-fechar-tour">
              <mat-icon class="text-base">close</mat-icon>
            </button>
          </div>

          <!-- CORPO PRINCIPAL DO PASSO -->
          <div class="p-5 sm:p-6 space-y-4">
            
            <div class="space-y-1.5">
              <h3 class="text-xs font-bold uppercase tracking-wide text-app-secondary">
                {{ passo().subtitulo }}
              </h3>
              <p class="text-sm text-app-text leading-relaxed">
                {{ passo().descricao }}
              </p>
            </div>

            <!-- DESTAQUE ESPECIAL / DICA LEGAL -->
            @if (passo().dicaLegal) {
              <div class="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 flex items-start gap-2.5">
                <mat-icon class="text-amber-600 dark:text-amber-400 text-sm mt-0.5 shrink-0">gavel</mat-icon>
                <div class="text-xs text-amber-900 dark:text-amber-200 leading-snug">
                  <span class="font-bold block mb-0.5">Conformidade Lei 13.352/2016:</span>
                  {{ passo().dicaLegal }}
                </div>
              </div>
            }

            <!-- BARRA DE PROGRESSO EM ETAPAS / DOTS -->
            <div class="flex items-center justify-center gap-1.5 pt-2">
              @for (p of tourService.passos; track p.id; let i = $index) {
                <button 
                  type="button" 
                  (click)="tourService.irParaPasso(i)"
                  class="h-2 rounded-full transition-all duration-300 cursor-pointer"
                  [class.w-6]="i === tourService.passoAtualIndex()"
                  [class.w-2]="i !== tourService.passoAtualIndex()"
                  [class.bg-[#17324d]]="i === tourService.passoAtualIndex()"
                  [class.dark:bg-blue-400]="i === tourService.passoAtualIndex()"
                  [class.bg-slate-200]="i !== tourService.passoAtualIndex()"
                  [class.dark:bg-slate-700]="i !== tourService.passoAtualIndex()"
                  [title]="p.titulo">
                </button>
              }
            </div>

          </div>

          <!-- RODAPÉ DE AÇÕES / NAVEGAÇÃO -->
          <div class="p-4 sm:p-5 bg-slate-50 dark:bg-slate-900/50 border-t border-app flex items-center justify-between gap-3">
            
            <button 
              type="button" 
              (click)="tourService.concluirTour()" 
              class="btn-secondary text-xs"
              id="btn-pular-tour">
              Pular Tour
            </button>

            <div class="flex items-center gap-2">
              @if (tourService.passoAtualIndex() > 0) {
                <button 
                  type="button" 
                  (click)="tourService.voltarPasso()" 
                  class="btn-secondary text-xs flex items-center gap-1"
                  id="btn-voltar-tour">
                  <mat-icon class="text-sm">arrow_back</mat-icon>
                  <span>Anterior</span>
                </button>
              }

              @if (tourService.passoAtualIndex() < tourService.totalPassos() - 1) {
                <button 
                  type="button" 
                  (click)="tourService.avancarPasso()" 
                  class="btn-primary text-xs flex items-center gap-1"
                  id="btn-proximo-tour">
                  <span>{{ passo().acaoTexto || 'Próximo' }}</span>
                  <mat-icon class="text-sm">arrow_forward</mat-icon>
                </button>
              } @else {
                <button 
                  type="button" 
                  (click)="tourService.concluirTour()" 
                  class="btn-primary text-xs flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                  id="btn-concluir-tour">
                  <mat-icon class="text-sm">check_circle</mat-icon>
                  <span>Concluir e Começar</span>
                </button>
              }
            </div>

          </div>

        </div>

      </div>
    }
  `
})
export class TourGuiadoComponent {
  readonly tourService = inject(TourGuiadoService);
  readonly passo = computed(() => this.tourService.passoAtual());
}
