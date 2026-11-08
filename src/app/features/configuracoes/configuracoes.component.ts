import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { FinanceStateService } from '../../core/services/finance-state.service';
import { TourGuiadoService } from '../../core/services/tour-guiado.service';
import { ConfirmDialogService } from '../../core/services/confirm-dialog.service';
import { SocioEmpresa } from '../../core/models/empresa.model';

@Component({
  selector: 'app-configuracoes',
  imports: [CommonModule, FormsModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-6 animate-fade-in" id="configuracoes-page">
      
      <div>
        <h1 class="text-xl md:text-2xl font-bold text-app-text tracking-tight flex items-center gap-2">
          <mat-icon class="text-[#17324d] dark:text-blue-300">settings</mat-icon>
          Configurações da Empresa & Parâmetros Fiscais
        </h1>
        <p class="text-xs text-app-secondary mt-0.5">
          Cadastros fiscais para apuração da Lei 13.352/2016, alíquota efetiva do Simples Nacional, quadro de sócios (QSA) e emissor nacional de NFS-e.
        </p>
      </div>

      <!-- GUIA DE ONBOARDING & TOUR -->
      <div class="card-corporate p-5 space-y-3 max-w-4xl border-l-4 border-l-blue-600">
        <div class="flex items-start justify-between gap-4">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 flex items-center justify-center shrink-0">
              <mat-icon>help_center</mat-icon>
            </div>
            <div>
              <h3 class="text-sm font-bold text-app-text">Tour Guiado & Check-list Fiscal</h3>
              <p class="text-xs text-app-secondary">
                Aprenda passo a passo como preencher o check-list de primeiros passos, configurar alíquotas efetivas, cadastrar sócios e emitir comprovantes oficiais.
              </p>
            </div>
          </div>

          <button 
            type="button" 
            (click)="tourService.reiniciarTour()" 
            class="btn-primary text-xs shrink-0 flex items-center gap-1.5"
            id="btn-reiniciar-tour-config">
            <mat-icon class="text-sm">replay</mat-icon>
            <span>Iniciar Tour Guiado</span>
          </button>
        </div>
      </div>

      <!-- PAINEL 1: PARÂMETROS FISCAIS & SIMPLES NACIONAL -->
      <div class="card-corporate p-5 space-y-4 max-w-4xl">
        <div class="flex items-center justify-between border-b border-app pb-2">
          <div>
            <h3 class="text-sm font-bold text-app-text">Parâmetros Fiscais & Alíquota Efetiva</h3>
            <p class="text-[10px] text-app-muted">Dados utilizados no cálculo da segregação de receitas e D-DAS</p>
          </div>
          <span class="status-badge status-badge-info text-[10px]">Simples Nacional</span>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div>
            <label class="font-bold text-app-secondary block mb-1">Alíquota Efetiva do Simples (%):</label>
            <div class="relative">
              <input 
                type="number" 
                step="0.01" 
                [(ngModel)]="editAliquotaEfetiva" 
                class="input-corporate font-mono text-xs w-full pr-7" 
                placeholder="Ex: 8.60" />
              <span class="absolute right-2.5 top-2 font-bold text-app-muted text-xs">%</span>
            </div>
          </div>

          <div>
            <label class="font-bold text-app-secondary block mb-1">Faturamento RBT12 Acumulado (R$):</label>
            <input 
              type="number" 
              step="1000" 
              [(ngModel)]="editRbt12" 
              class="input-corporate font-mono text-xs w-full" />
          </div>

          <div>
            <label class="font-bold text-app-secondary block mb-1">Folha de Pagamento 12m (R$):</label>
            <input 
              type="number" 
              step="1000" 
              [(ngModel)]="editFolha12m" 
              class="input-corporate font-mono text-xs w-full" />
          </div>

          <div>
            <label class="font-bold text-app-secondary block mb-1">Regime Tributário:</label>
            <select [(ngModel)]="editRegime" class="input-corporate text-xs w-full">
              <option value="SIMPLES_NACIONAL">Simples Nacional (Lei 13.352)</option>
              <option value="LUCRO_PRESUMIDO">Lucro Presumido</option>
              <option value="LUCRO_REAL">Lucro Real</option>
            </select>
          </div>

          <div>
            <label class="font-bold text-app-secondary block mb-1">Anexo do Simples:</label>
            <select [(ngModel)]="editAnexo" class="input-corporate text-xs w-full">
              <option value="ANEXO_III">Anexo III (Com Fator R >= 28%)</option>
              <option value="ANEXO_IV">Anexo IV (Não elegível Salão-Parceiro)</option>
              <option value="ANEXO_V">Anexo V (Sem Fator R)</option>
            </select>
          </div>

          <div>
            <label class="font-bold text-app-secondary block mb-1">Alíquota ISS Municipal (%):</label>
            <div class="relative">
              <input 
                type="number" 
                step="0.1" 
                [(ngModel)]="editAliquotaIss" 
                class="input-corporate font-mono text-xs w-full pr-7" />
              <span class="absolute right-2.5 top-2 font-bold text-app-muted text-xs">%</span>
            </div>
          </div>
        </div>

        <div class="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div class="text-xs space-y-0.5">
            <span class="font-bold text-blue-950 dark:text-blue-200 block">
              Fator R Apurado: {{ getFatorRCalculado() | number:'1.1-1' }}%
            </span>
            <span class="text-[11px] text-blue-800 dark:text-blue-300">
              {{ getFatorRCalculado() >= 28 ? 'Enquadramento ideal no Anexo III com alíquota inicial reduzida (6%).' : 'Fator R inferior a 28% requer atenção na folha para manter Anexo III.' }}
            </span>
          </div>

          <button 
            type="button" 
            (click)="salvarConfiguracoesFiscais()" 
            class="btn-primary text-xs shrink-0 flex items-center gap-1">
            <mat-icon class="text-xs">save</mat-icon>
            <span>Salvar Parâmetros Fiscais</span>
          </button>
        </div>
      </div>

      <!-- PAINEL 2: QUADRO DE SÓCIOS E ADMINISTRADORES (QSA) -->
      <div class="card-corporate p-5 space-y-4 max-w-4xl">
        <div class="flex items-center justify-between border-b border-app pb-2">
          <div>
            <h3 class="text-sm font-bold text-app-text">Quadro de Sócios e Administradores (QSA)</h3>
            <p class="text-[10px] text-app-muted">Identificação dos sócios, participação societária e pró-labore</p>
          </div>
          <span class="text-xs font-mono font-bold text-app-secondary">{{ socios().length }} sócio(s) cadastrado(s)</span>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          @for (s of socios(); track s.id) {
            <div class="p-3.5 rounded-xl border border-app bg-slate-50/50 dark:bg-slate-800/40 space-y-2 relative">
              <div class="flex items-start justify-between gap-2">
                <div>
                  <h4 class="text-xs font-bold text-app-text">{{ s.nome }}</h4>
                  <span class="text-[10px] text-app-muted font-mono">CPF: {{ s.cpf }}</span>
                </div>
                <span class="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300">
                  {{ s.qualificacao }}
                </span>
              </div>

              <div class="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-slate-200 dark:border-slate-700">
                <div>
                  <span class="text-app-muted block">Participação:</span>
                  <strong class="font-mono text-app-text">{{ s.participacao_percentual }}%</strong>
                </div>
                <div>
                  <span class="text-app-muted block">Pró-labore:</span>
                  <strong class="font-mono text-app-text">R$ {{ (s.pro_labore_mensal || 0) | number:'1.2-2' }}</strong>
                </div>
              </div>

              <div class="text-right pt-1">
                <button 
                  type="button" 
                  (click)="confirmarRemocaoSocio(s)"
                  class="text-[11px] text-rose-500 hover:text-rose-700 font-medium inline-flex items-center gap-0.5 cursor-pointer">
                  <mat-icon class="text-xs">delete</mat-icon>
                  <span>Remover</span>
                </button>
              </div>
            </div>
          }
        </div>

        <!-- FORMULÁRIO DE ADIÇÃO DE SÓCIO -->
        <div class="p-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 space-y-3">
          <span class="font-bold text-xs text-app-text flex items-center gap-1.5">
            <mat-icon class="text-xs text-purple-600">person_add</mat-icon>
            Cadastrar Novo Sócio / Administrador
          </span>

          <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div>
              <label class="font-bold text-app-secondary block mb-1">Nome Completo:</label>
              <input type="text" [(ngModel)]="novoSocioNome" placeholder="Ex: Carlos Mendes" class="input-corporate text-xs w-full" />
            </div>

            <div>
              <label class="font-bold text-app-secondary block mb-1">CPF:</label>
              <input type="text" [(ngModel)]="novoSocioCpf" placeholder="000.000.000-00" class="input-corporate font-mono text-xs w-full" />
            </div>

            <div>
              <label class="font-bold text-app-secondary block mb-1">Participação (%):</label>
              <input type="number" [(ngModel)]="novoSocioParticipacao" placeholder="Ex: 50" class="input-corporate font-mono text-xs w-full" />
            </div>

            <div>
              <label class="font-bold text-app-secondary block mb-1">Pró-labore (R$):</label>
              <input type="number" [(ngModel)]="novoSocioProLabore" placeholder="Ex: 5000" class="input-corporate font-mono text-xs w-full" />
            </div>
          </div>

          <div class="text-right">
            <button 
              type="button" 
              (click)="adicionarSocio()" 
              [disabled]="!novoSocioNome || !novoSocioCpf"
              class="btn-primary text-xs py-1.5 px-3 disabled:opacity-50 inline-flex items-center gap-1">
              <mat-icon class="text-xs">add</mat-icon>
              <span>Adicionar Sócio</span>
            </button>
          </div>
        </div>
      </div>

      <!-- PAINEL 3: DADOS CADASTRAIS DA EMPRESA -->
      <div class="card-corporate p-5 space-y-4 max-w-4xl">
        <h3 class="text-sm font-bold text-app-text border-b border-app pb-2">Dados Cadastrais da Empresa Salão-Parceiro</h3>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <label class="font-bold text-app-secondary block mb-1">Razão Social:</label>
            <input type="text" [value]="empresa().razao_social" readonly class="input-corporate bg-slate-50 dark:bg-slate-800 text-xs" />
          </div>

          <div>
            <label class="font-bold text-app-secondary block mb-1">CNPJ:</label>
            <input type="text" [value]="empresa().cnpj" readonly class="input-corporate bg-slate-50 dark:bg-slate-800 font-mono text-xs" />
          </div>

          <div>
            <label class="font-bold text-app-secondary block mb-1">Nome Fantasia:</label>
            <input type="text" [value]="empresa().nome_fantasia" readonly class="input-corporate bg-slate-50 dark:bg-slate-800 text-xs font-semibold" />
          </div>

          <div>
            <label class="font-bold text-app-secondary block mb-1">Inscrição Municipal:</label>
            <input type="text" [value]="empresa().inscricao_municipal" readonly class="input-corporate bg-slate-50 dark:bg-slate-800 font-mono text-xs" />
          </div>
        </div>

        <div class="pt-4 border-t border-app flex items-center justify-between text-xs">
          <span class="text-app-secondary">Certificado Digital e-CNPJ:</span>
          <span class="status-badge status-badge-success text-[10px]">A1 Válido (Vence em 12/2026)</span>
        </div>
      </div>

    </div>
  `
})
export class ConfiguracoesComponent {
  readonly financeState = inject(FinanceStateService);
  readonly tourService = inject(TourGuiadoService);
  readonly confirmDialog = inject(ConfirmDialogService);
  readonly empresa = computed(() => this.financeState.empresaAtiva());
  readonly socios = computed(() => this.empresa().socios || []);

  // Campos de edição fiscal
  editAliquotaEfetiva = 8.60;
  editRbt12 = 420000;
  editFolha12m = 119700;
  editRegime: 'SIMPLES_NACIONAL' | 'LUCRO_PRESUMIDO' | 'LUCRO_REAL' = 'SIMPLES_NACIONAL';
  editAnexo: 'ANEXO_III' | 'ANEXO_IV' | 'ANEXO_V' = 'ANEXO_III';
  editAliquotaIss = 2.0;

  // Campos de novo sócio
  novoSocioNome = '';
  novoSocioCpf = '';
  novoSocioParticipacao = 50;
  novoSocioProLabore = 5000;

  constructor() {
    const emp = this.empresa();
    this.editAliquotaEfetiva = emp.aliquota_efetiva_simples || 8.60;
    this.editRbt12 = emp.rbt12 || 420000;
    this.editFolha12m = emp.folha_12m || 119700;
    this.editRegime = emp.regime_tributario || 'SIMPLES_NACIONAL';
    this.editAnexo = emp.anexo_simples || 'ANEXO_III';
    this.editAliquotaIss = emp.aliquota_iss_municipal || 2.0;
  }

  getFatorRCalculado(): number {
    if (!this.editRbt12 || this.editRbt12 <= 0) return 0;
    return (this.editFolha12m / this.editRbt12) * 100;
  }

  salvarConfiguracoesFiscais() {
    const fatorR = this.editRbt12 > 0 ? (this.editFolha12m / this.editRbt12) : 0.285;

    this.financeState.atualizarEmpresa({
      aliquota_efetiva_simples: Number(this.editAliquotaEfetiva),
      rbt12: Number(this.editRbt12),
      folha_12m: Number(this.editFolha12m),
      regime_tributario: this.editRegime,
      anexo_simples: this.editAnexo,
      aliquota_iss_municipal: Number(this.editAliquotaIss),
      fator_r_atual: Number((fatorR).toFixed(4))
    });
  }

  adicionarSocio() {
    if (!this.novoSocioNome || !this.novoSocioCpf) return;

    const socio: SocioEmpresa = {
      id: `socio-${Date.now()}`,
      nome: this.novoSocioNome.trim(),
      cpf: this.novoSocioCpf.trim(),
      participacao_percentual: Number(this.novoSocioParticipacao) || 50,
      qualificacao: 'Sócio-Administrador',
      pro_labore_mensal: Number(this.novoSocioProLabore) || 5000
    };

    this.financeState.salvarSocio(socio);

    this.novoSocioNome = '';
    this.novoSocioCpf = '';
    this.novoSocioParticipacao = 50;
    this.novoSocioProLabore = 5000;
  }

  async confirmarRemocaoSocio(socio: SocioEmpresa): Promise<void> {
    const confirmou = await this.confirmDialog.confirmDestructive(
      'Excluir Sócio / Administrador do QSA',
      `Tem certeza que deseja remover o sócio "${socio.nome}" do Quadro de Sócios e Administradores da empresa?`,
      {
        highlightItem: {
          title: socio.nome,
          subtitle: `CPF: ${socio.cpf} • Participação: ${socio.participacao_percentual}%`,
          badge: socio.qualificacao
        },
        details: [
          { label: 'Pró-labore Mensal', value: `R$ ${(socio.pro_labore_mensal || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` },
          { label: 'Impacto no Fator R', value: 'Recálculo automático da folha de pagamento' }
        ],
        confirmText: 'Sim, Remover Sócio',
        riskWarning: 'A remoção do sócio impactará o cálculo do Fator R e da alíquota do Simples Nacional.'
      }
    );

    if (confirmou) {
      this.financeState.removerSocio(socio.id);
    }
  }
}

