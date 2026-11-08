import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { ConfirmDialogService } from '../../core/services/confirm-dialog.service';

@Component({
  selector: 'app-confirm-dialog',
  imports: [CommonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(window:keydown.escape)': 'onEscape()'
  },
  template: `
    @if (dialogService.isOpen() && dialogService.options(); as opt) {
      <div 
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-fade-in"
        role="dialog"
        aria-modal="true"
        [attr.aria-labelledby]="'confirm-dialog-title'"
        [attr.aria-describedby]="'confirm-dialog-desc'"
        id="confirm-dialog-backdrop"
        (click)="onBackdropClick($event)">
        
        <div 
          class="relative w-full max-w-lg bg-surface border rounded-2xl shadow-2xl overflow-hidden transition-all transform animate-scale-in"
          [class.border-red-300]="opt.type === 'danger'"
          [class.dark:border-red-800]="opt.type === 'danger'"
          [class.border-emerald-300]="opt.type === 'export'"
          [class.dark:border-emerald-800]="opt.type === 'export'"
          [class.border-amber-300]="opt.type === 'warning' || opt.type === 'financial'"
          [class.dark:border-amber-800]="opt.type === 'warning' || opt.type === 'financial'"
          [class.border-blue-300]="opt.type === 'info'"
          [class.dark:border-blue-800]="opt.type === 'info'"
          id="confirm-dialog-card"
          (click)="$event.stopPropagation()">

          <!-- FAIXA SUPERIOR DE DESTAQUE COLORIDA -->
          <div 
            class="h-1.5 w-full"
            [class.bg-rose-600]="opt.type === 'danger'"
            [class.bg-emerald-600]="opt.type === 'export'"
            [class.bg-amber-500]="opt.type === 'warning' || opt.type === 'financial'"
            [class.bg-blue-600]="opt.type === 'info'">
          </div>

          <div class="p-5 sm:p-6 space-y-4">
            
            <!-- CABEÇALHO DO DIALOG COM ÍCONE E BADGE -->
            <div class="flex items-start gap-3.5">
              
              <!-- ÍCONE DO TIPO -->
              <div 
                class="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-xs"
                [class.bg-rose-100]="opt.type === 'danger'"
                [class.dark:bg-rose-950/80]="opt.type === 'danger'"
                [class.text-rose-700]="opt.type === 'danger'"
                [class.dark:text-rose-300]="opt.type === 'danger'"
                [class.bg-emerald-100]="opt.type === 'export'"
                [class.dark:bg-emerald-950/80]="opt.type === 'export'"
                [class.text-emerald-700]="opt.type === 'export'"
                [class.dark:text-emerald-300]="opt.type === 'export'"
                [class.bg-amber-100]="opt.type === 'warning' || opt.type === 'financial'"
                [class.dark:bg-amber-950/80]="opt.type === 'warning' || opt.type === 'financial'"
                [class.text-amber-700]="opt.type === 'warning' || opt.type === 'financial'"
                [class.dark:text-amber-300]="opt.type === 'warning' || opt.type === 'financial'"
                [class.bg-blue-100]="opt.type === 'info'"
                [class.dark:bg-blue-950/80]="opt.type === 'info'"
                [class.text-blue-700]="opt.type === 'info'"
                [class.dark:text-blue-300]="opt.type === 'info'">
                <mat-icon class="text-2xl">{{ opt.icon || defaultIcon() }}</mat-icon>
              </div>

              <!-- TÍTULO E SUBTÍTULO / BADGE -->
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 flex-wrap mb-1">
                  @if (opt.badgeText) {
                    <span 
                      class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
                      [class.bg-rose-100]="opt.type === 'danger'"
                      [class.dark:bg-rose-950]="opt.type === 'danger'"
                      [class.text-rose-800]="opt.type === 'danger'"
                      [class.dark:text-rose-300]="opt.type === 'danger'"
                      [class.bg-emerald-100]="opt.type === 'export'"
                      [class.dark:bg-emerald-950]="opt.type === 'export'"
                      [class.text-emerald-800]="opt.type === 'export'"
                      [class.dark:text-emerald-300]="opt.type === 'export'"
                      [class.bg-amber-100]="opt.type === 'warning' || opt.type === 'financial'"
                      [class.dark:bg-amber-950]="opt.type === 'warning' || opt.type === 'financial'"
                      [class.text-amber-800]="opt.type === 'warning' || opt.type === 'financial'"
                      [class.dark:text-amber-300]="opt.type === 'warning' || opt.type === 'financial'"
                      [class.bg-blue-100]="opt.type === 'info'"
                      [class.dark:bg-blue-950]="opt.type === 'info'"
                      [class.text-blue-800]="opt.type === 'info'"
                      [class.dark:text-blue-300]="opt.type === 'info'">
                      {{ opt.badgeText }}
                    </span>
                  }
                  <span class="text-[10px] text-app-muted font-medium">Confirmação de Segurança</span>
                </div>

                <h3 
                  class="text-base sm:text-lg font-bold text-app-text leading-snug"
                  id="confirm-dialog-title">
                  {{ opt.title }}
                </h3>
              </div>

              <!-- BOTÃO FECHAR (X) -->
              <button 
                type="button" 
                (click)="dialogService.onCancel()"
                class="p-1 rounded-lg text-app-muted hover:text-app-text hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                aria-label="Fechar diálogo">
                <mat-icon class="text-sm">close</mat-icon>
              </button>
            </div>

            <!-- MENSAGEM PRINCIPAL -->
            <p 
              class="text-xs sm:text-sm text-app-secondary leading-relaxed"
              id="confirm-dialog-desc">
              {{ opt.message }}
            </p>

            <!-- ITEM EM DESTAQUE (CARD INTERNO SE FORNECIDO) -->
            @if (opt.highlightItem; as item) {
              <div class="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-app flex items-center justify-between gap-3 text-xs">
                <div>
                  <strong class="text-app-text block">{{ item.title }}</strong>
                  @if (item.subtitle) {
                    <span class="text-[11px] text-app-muted block">{{ item.subtitle }}</span>
                  }
                </div>
                @if (item.badge) {
                  <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-200 dark:bg-slate-800 text-app-text">
                    {{ item.badge }}
                  </span>
                }
              </div>
            }

            <!-- GRID DE DETALHES TÉCNICOS/FINANCEIROS SE FORNECIDOS -->
            @if (opt.details && opt.details.length > 0) {
              <div class="p-3 rounded-xl bg-slate-50/70 dark:bg-slate-900/40 border border-app space-y-1.5 text-xs">
                @for (d of opt.details; track d.label) {
                  <div class="flex items-center justify-between gap-2">
                    <span class="text-app-secondary text-[11px]">{{ d.label }}:</span>
                    <strong 
                      class="font-mono text-[11px]"
                      [class.text-emerald-600]="d.highlight && opt.type === 'export'"
                      [class.text-rose-600]="d.highlight && opt.type === 'danger'"
                      [class.text-app-text]="!d.highlight">
                      {{ d.value }}
                    </strong>
                  </div>
                }
              </div>
            }

            <!-- AVISO DE RISCO OU SEGURANÇA FISCAL -->
            @if (opt.riskWarning) {
              <div class="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 text-[11px] text-rose-800 dark:text-rose-300 flex items-start gap-2">
                <mat-icon class="text-sm shrink-0 mt-0.5">warning</mat-icon>
                <span>{{ opt.riskWarning }}</span>
              </div>
            }

            @if (opt.securityNote) {
              <div class="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/60 text-[11px] text-[#17324d] dark:text-blue-300 flex items-start gap-2">
                <mat-icon class="text-sm shrink-0 mt-0.5">shield</mat-icon>
                <span>{{ opt.securityNote }}</span>
              </div>
            }

            <!-- AÇÕES DO RODAPÉ -->
            <div class="pt-3 border-t border-app flex items-center justify-end gap-2.5">
              <button 
                type="button" 
                (click)="dialogService.onCancel()"
                class="btn-secondary text-xs py-2 px-4 cursor-pointer"
                id="btn-confirm-dialog-cancel">
                {{ opt.cancelText || 'Cancelar' }}
              </button>

              <button 
                type="button" 
                (click)="dialogService.onConfirm()"
                class="btn-primary text-xs py-2 px-5 flex items-center gap-1.5 cursor-pointer shadow-sm font-bold"
                [class.bg-rose-600]="opt.type === 'danger'"
                [class.hover:bg-rose-700]="opt.type === 'danger'"
                [class.border-rose-700]="opt.type === 'danger'"
                [class.bg-emerald-600]="opt.type === 'export'"
                [class.hover:bg-emerald-700]="opt.type === 'export'"
                [class.border-emerald-700]="opt.type === 'export'"
                [class.bg-emerald-600]="opt.type === 'financial'"
                [class.hover:bg-emerald-700]="opt.type === 'financial'"
                [class.border-emerald-700]="opt.type === 'financial'"
                id="btn-confirm-dialog-action">
                <mat-icon class="text-sm">{{ opt.icon || defaultIcon() }}</mat-icon>
                <span>{{ opt.confirmText || 'Confirmar' }}</span>
              </button>
            </div>

          </div>

        </div>
      </div>
    }
  `
})
export class ConfirmDialogComponent {
  readonly dialogService = inject(ConfirmDialogService);

  readonly defaultIcon = computed(() => {
    const type = this.dialogService.options()?.type;
    switch (type) {
      case 'danger': return 'delete_forever';
      case 'export': return 'file_download';
      case 'financial': return 'payments';
      case 'info': return 'info';
      case 'warning':
      default:
        return 'warning';
    }
  });

  onEscape(): void {
    if (this.dialogService.isOpen()) {
      this.dialogService.onCancel();
    }
  }

  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.dialogService.onCancel();
    }
  }
}
