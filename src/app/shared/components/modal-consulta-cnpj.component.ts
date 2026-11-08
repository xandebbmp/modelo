import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { CnpjValidatorService, CnpjConsultaResultado } from '../../core/services/cnpj-validator.service';

@Component({
  selector: 'app-modal-consulta-cnpj',
  imports: [CommonModule, FormsModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fade-in" id="modal-consulta-cnpj">
      <div class="relative w-full max-w-lg bg-surface border border-app rounded-2xl shadow-2xl p-5 sm:p-6 overflow-hidden flex flex-col max-h-[90vh]">
        
        <!-- CABEÇALHO -->
        <div class="flex items-center justify-between pb-3 border-b border-app">
          <div class="flex items-center gap-2.5">
            <div class="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/70 text-[#17324d] dark:text-blue-300 border border-blue-100 dark:border-blue-900/50">
              <mat-icon class="text-base">verified_user</mat-icon>
            </div>
            <div>
              <h3 class="font-bold text-sm sm:text-base text-app-text">Consulta & Validação de CNPJ MEI</h3>
              <p class="text-[11px] text-app-secondary">Conformidade com a Receita Federal e Lei 13.352/2016</p>
            </div>
          </div>

          <button 
            type="button" 
            (click)="fecharModal()" 
            class="text-app-muted hover:text-app-text p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <mat-icon class="text-lg">close</mat-icon>
          </button>
        </div>

        <!-- FORMULÁRIO DE CONSULTA -->
        <div class="py-4 space-y-3">
          <div>
            <label class="block text-xs font-bold text-app-secondary mb-1">
              Informe o CNPJ do Profissional Parceiro:
            </label>
            <div class="flex gap-2">
              <input 
                type="text" 
                [(ngModel)]="cnpjInput" 
                (input)="formatarInput()"
                (keydown.enter)="executarConsulta()"
                class="input-corporate font-mono text-sm tracking-wide flex-1" 
                placeholder="00.000.000/0001-00" 
                maxlength="18"
              />
              <button 
                type="button" 
                (click)="executarConsulta()" 
                [disabled]="cnpjValidator.consultando() || !cnpjInput"
                class="btn-primary text-xs flex items-center gap-1 px-4 disabled:opacity-60">
                @if (cnpjValidator.consultando()) {
                  <mat-icon class="text-sm animate-spin">sync</mat-icon>
                  <span>Consultando...</span>
                } @else {
                  <mat-icon class="text-sm">search</mat-icon>
                  <span>Consultar</span>
                }
              </button>
            </div>
            <span class="text-[10px] text-app-muted mt-1 block">
              Algoritmo Módulo 11 + Consulta em tempo real à base da Receita Federal / SIMEI.
            </span>
          </div>

          <!-- ATALHOS RÁPIDOS DE TESTE -->
          <div class="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-app text-[11px]">
            <span class="font-bold text-app-secondary block mb-1 text-[10px] uppercase">Exemplos Rápidos de Teste:</span>
            <div class="flex flex-wrap gap-1.5">
              <button 
                type="button"
                (click)="selecionarExemplo('38112904000112')"
                class="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 font-mono text-[10px] hover:bg-emerald-200">
                ✓ 38.112.904/0001-12 (Ativo MEI)
              </button>
              <button 
                type="button"
                (click)="selecionarExemplo('41220890000133')"
                class="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 font-mono text-[10px] hover:bg-emerald-200">
                ✓ 41.220.890/0001-33 (Barbeiro Ativo)
              </button>
              <button 
                type="button"
                (click)="selecionarExemplo('11222333000181')"
                class="px-2 py-0.5 rounded-md bg-red-100 dark:bg-red-950/80 text-red-800 dark:text-red-300 font-mono text-[10px] hover:bg-red-200">
                ✗ 11.222.333/0001-81 (Baixado/Inativo)
              </button>
            </div>
          </div>
        </div>

        <!-- RESULTADO DA CONSULTA -->
        @if (resultado()) {
          <div class="overflow-y-auto space-y-3 pb-2 flex-1">
            
            <!-- STATUS PRINCIPAL -->
            <div 
              class="p-3.5 rounded-xl border flex items-start gap-3"
              [class.bg-emerald-50]="resultado()!.permiteRepasse"
              [class.dark:bg-emerald-950/40]="resultado()!.permiteRepasse"
              [class.border-emerald-200]="resultado()!.permiteRepasse"
              [class.dark:border-emerald-800]="resultado()!.permiteRepasse"
              [class.bg-red-50]="!resultado()!.permiteRepasse"
              [class.dark:bg-red-950/40]="!resultado()!.permiteRepasse"
              [class.border-red-200]="!resultado()!.permiteRepasse"
              [class.dark:border-red-800]="!resultado()!.permiteRepasse">
              
              <div 
                class="p-2 rounded-lg shrink-0"
                [class.bg-emerald-100]="resultado()!.permiteRepasse"
                [class.dark:bg-emerald-900]="resultado()!.permiteRepasse"
                [class.text-emerald-700]="resultado()!.permiteRepasse"
                [class.dark:text-emerald-300]="resultado()!.permiteRepasse"
                [class.bg-red-100]="!resultado()!.permiteRepasse"
                [class.dark:bg-red-900]="!resultado()!.permiteRepasse"
                [class.text-red-700]="!resultado()!.permiteRepasse"
                [class.dark:text-red-300]="!resultado()!.permiteRepasse">
                <mat-icon class="text-base">
                  {{ resultado()!.permiteRepasse ? 'check_circle' : 'gpp_bad' }}
                </mat-icon>
              </div>

              <div>
                <div class="flex items-center gap-2 flex-wrap">
                  <span class="font-bold text-xs" [class.text-emerald-900]="resultado()!.permiteRepasse" [class.dark:text-emerald-200]="resultado()!.permiteRepasse" [class.text-red-900]="!resultado()!.permiteRepasse" [class.dark:text-red-200]="!resultado()!.permiteRepasse">
                    Situação Cadastral: {{ resultado()!.situacaoCadastral }}
                  </span>
                  
                  @if (resultado()!.opcaoSimei) {
                    <span class="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-200 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-100">
                      Optante SIMEI (MEI)
                    </span>
                  }
                </div>

                <p class="text-[11px] mt-0.5" [class.text-emerald-800]="resultado()!.permiteRepasse" [class.dark:text-emerald-300]="resultado()!.permiteRepasse" [class.text-red-800]="!resultado()!.permiteRepasse" [class.dark:text-red-300]="!resultado()!.permiteRepasse">
                  {{ resultado()!.mensagem }}
                </p>
              </div>
            </div>

            <!-- DADOS CADASTRAIS RECEITA FEDERAL -->
            <div class="card-corporate p-3.5 space-y-2 text-xs">
              <div class="flex justify-between items-start border-b border-app pb-2">
                <div>
                  <span class="text-[10px] text-app-muted block">Razão Social:</span>
                  <strong class="text-app-text block">{{ resultado()!.razaoSocial || '—' }}</strong>
                </div>
                <div class="text-right">
                  <span class="text-[10px] text-app-muted block">CNPJ:</span>
                  <span class="font-mono font-bold text-app-text">{{ resultado()!.cnpjFormatado }}</span>
                </div>
              </div>

              <div class="grid grid-cols-2 gap-2 text-[11px] pt-1">
                <div>
                  <span class="text-[10px] text-app-muted block">Nome Fantasia:</span>
                  <span class="text-app-text font-medium">{{ resultado()!.nomeFantasia || '—' }}</span>
                </div>
                <div>
                  <span class="text-[10px] text-app-muted block">Município / UF:</span>
                  <span class="text-app-text font-medium">{{ resultado()!.municipio }} / {{ resultado()!.uf }}</span>
                </div>
                <div class="col-span-2">
                  <span class="text-[10px] text-app-muted block">CNAE Principal:</span>
                  <span class="text-app-text font-medium">
                    {{ resultado()!.cnaePrincipalCodigo }} - {{ resultado()!.cnaePrincipalDescricao }}
                  </span>
                </div>
              </div>

              <div class="pt-2 border-t border-app flex items-center justify-between text-[10px] text-app-muted">
                <span>Fonte: <strong>{{ resultado()!.fonteConsulta === 'API_RECEITA_FEDERAL' ? 'Receita Federal (API)' : 'Base Oficial MEI' }}</strong></span>
                <span>Data: {{ resultado()!.dataConsulta | date:'dd/MM/yyyy HH:mm' }}</span>
              </div>
            </div>

          </div>
        }

        <!-- RODAPÉ -->
        <div class="pt-3 border-t border-app flex justify-between items-center text-xs">
          <span class="text-[10px] text-app-muted">
            Art. 1º-A § 3º Lei 13.352/2016
          </span>
          <button 
            type="button" 
            (click)="fecharModal()" 
            class="btn-secondary py-1.5 px-4 text-xs">
            Fechar
          </button>
        </div>

      </div>
    </div>
  `
})
export class ModalConsultaCnpjComponent {
  readonly cnpjValidator = inject(CnpjValidatorService);
  
  cnpjInput = '';
  readonly resultado = signal<CnpjConsultaResultado | null>(null);

  abrirComCnpj(cnpj: string) {
    this.cnpjInput = this.cnpjValidator.formatarCnpj(cnpj);
    this.executarConsulta();
  }

  formatarInput() {
    this.cnpjInput = this.cnpjValidator.formatarCnpj(this.cnpjInput);
  }

  selecionarExemplo(cnpj: string) {
    this.cnpjInput = this.cnpjValidator.formatarCnpj(cnpj);
    this.executarConsulta();
  }

  async executarConsulta() {
    if (!this.cnpjInput) return;
    const res = await this.cnpjValidator.consultarCnpjEmTempoReal(this.cnpjInput);
    this.resultado.set(res);
  }

  fecharModal() {
    this.resultado.set(null);
    this.cnpjInput = '';
  }
}
