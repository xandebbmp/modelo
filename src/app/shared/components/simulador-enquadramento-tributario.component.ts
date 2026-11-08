import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { FinanceStateService } from '../../core/services/finance-state.service';

interface FaixaSimples {
  faixa: number;
  teto: number;
  aliqNominal: number;
  parcelaDeduzir: number;
}

const TABELA_ANEXO_III: FaixaSimples[] = [
  { faixa: 1, teto: 180000, aliqNominal: 0.06, parcelaDeduzir: 0 },
  { faixa: 2, teto: 360000, aliqNominal: 0.112, parcelaDeduzir: 9360 },
  { faixa: 3, teto: 720000, aliqNominal: 0.135, parcelaDeduzir: 17640 },
  { faixa: 4, teto: 1800000, aliqNominal: 0.16, parcelaDeduzir: 35640 },
  { faixa: 5, teto: 3600000, aliqNominal: 0.21, parcelaDeduzir: 125640 },
  { faixa: 6, teto: 4800000, aliqNominal: 0.33, parcelaDeduzir: 648000 }
];

const TABELA_ANEXO_V: FaixaSimples[] = [
  { faixa: 1, teto: 180000, aliqNominal: 0.155, parcelaDeduzir: 0 },
  { faixa: 2, teto: 360000, aliqNominal: 0.18, parcelaDeduzir: 4500 },
  { faixa: 3, teto: 720000, aliqNominal: 0.195, parcelaDeduzir: 9900 },
  { faixa: 4, teto: 1800000, aliqNominal: 0.205, parcelaDeduzir: 17100 },
  { faixa: 5, teto: 3600000, aliqNominal: 0.23, parcelaDeduzir: 62100 },
  { faixa: 6, teto: 4800000, aliqNominal: 0.305, parcelaDeduzir: 540000 }
];

@Component({
  selector: 'app-simulador-enquadramento-tributario',
  imports: [CommonModule, FormsModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="card-corporate p-4 sm:p-6 space-y-6" id="simulador-enquadramento-widget">
      
      <!-- CABEÇALHO DO SIMULADOR -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-app">
        <div class="flex items-start gap-3">
          <div class="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/80 text-[#17324d] dark:text-blue-300">
            <mat-icon class="text-xl">calculate</mat-icon>
          </div>
          <div>
            <div class="flex items-center gap-2 flex-wrap">
              <h2 class="text-base sm:text-lg font-bold text-app-text tracking-tight">
                Simulador de Enquadramento Tributário & Fator R
              </h2>
              <span class="px-2 py-0.5 rounded-full text-[11px] font-bold"
                [class.bg-emerald-100]="resultado().eficienteAnexoIII"
                [class.text-emerald-800]="resultado().eficienteAnexoIII"
                [class.dark:bg-emerald-950]="resultado().eficienteAnexoIII"
                [class.dark:text-emerald-300]="resultado().eficienteAnexoIII"
                [class.bg-amber-100]="!resultado().eficienteAnexoIII"
                [class.text-amber-800]="!resultado().eficienteAnexoIII"
                [class.dark:bg-amber-950]="!resultado().eficienteAnexoIII"
                [class.dark:text-amber-300]="!resultado().eficienteAnexoIII">
                {{ resultado().eficienteAnexoIII ? '✅ Modelo Eficiente (Anexo III)' : '⚠️ Atenção: Risco de Anexo V' }}
              </span>
            </div>
            <p class="text-xs text-app-secondary mt-0.5">
              Simule o Fator R (Folha de Salários / RBT12 ≥ 28%) e a segregação de receitas da Lei 13.352/2016 para otimização do Simples Nacional.
            </p>
          </div>
        </div>

        <button 
          type="button" 
          (click)="redefinirValoresPadrao()" 
          class="btn-secondary text-xs flex items-center gap-1.5 self-start md:self-auto"
          title="Restaurar dados fiscais cadastrados na empresa">
          <mat-icon class="text-sm">restart_alt</mat-icon>
          <span>Restaurar Dados da Empresa</span>
        </button>
      </div>

      <!-- INPUTS INTERATIVOS DO SIMULADOR -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <!-- FATURAMENTO BRUTO DOS SERVIÇOS (MÊS) -->
        <div class="p-3.5 rounded-xl bg-surface border border-app space-y-1.5 shadow-xs">
          <label class="text-[11px] font-semibold text-app-secondary block uppercase tracking-wider">
            Faturamento Bruto Mensal
          </label>
          <div class="relative">
            <span class="absolute left-3 top-2.5 text-xs text-app-muted font-bold">R$</span>
            <input 
              type="number" 
              [(ngModel)]="faturamentoMensal" 
              (ngModelChange)="onParametrosAlterados()"
              class="w-full pl-9 pr-3 py-1.5 text-sm font-mono font-bold bg-app rounded-lg border border-app focus:outline-hidden focus:ring-1 focus:ring-blue-500 text-app-text" 
              step="1000" min="0" />
          </div>
          <span class="text-[10px] text-app-muted block">Volume total gerado no salão</span>
        </div>

        <!-- REPASSES A PROFISSIONAIS MEI (LEI 13.352) -->
        <div class="p-3.5 rounded-xl bg-surface border border-app space-y-1.5 shadow-xs">
          <div class="flex items-center justify-between">
            <label class="text-[11px] font-semibold text-[#b66a3c] block uppercase tracking-wider">
              Repasses MEI (Cota Parceiro)
            </label>
            <span class="text-[10px] font-bold text-app-secondary">{{ percentualRepasseMei() }}%</span>
          </div>
          <div class="relative">
            <span class="absolute left-3 top-2.5 text-xs text-app-muted font-bold">R$</span>
            <input 
              type="number" 
              [(ngModel)]="repassesMeiMensal" 
              (ngModelChange)="onParametrosAlterados()"
              class="w-full pl-9 pr-3 py-1.5 text-sm font-mono font-bold bg-app rounded-lg border border-app focus:outline-hidden focus:ring-1 focus:ring-[#b66a3c] text-app-text" 
              step="500" min="0" />
          </div>
          <span class="text-[10px] text-app-muted block">Dedução legal da base de cálculo</span>
        </div>

        <!-- RBT12 (RECEITA BRUTA DOS ÚLTIMOS 12 MESES) -->
        <div class="p-3.5 rounded-xl bg-surface border border-app space-y-1.5 shadow-xs">
          <label class="text-[11px] font-semibold text-app-secondary block uppercase tracking-wider">
            RBT12 Acumulado (12 Meses)
          </label>
          <div class="relative">
            <span class="absolute left-3 top-2.5 text-xs text-app-muted font-bold">R$</span>
            <input 
              type="number" 
              [(ngModel)]="rbt12" 
              (ngModelChange)="onParametrosAlterados()"
              class="w-full pl-9 pr-3 py-1.5 text-sm font-mono font-bold bg-app rounded-lg border border-app focus:outline-hidden focus:ring-1 focus:ring-blue-500 text-app-text" 
              step="10000" min="1000" />
          </div>
          <span class="text-[10px] text-app-muted block">Define a alíquota nominal</span>
        </div>

        <!-- FOLHA DE SALÁRIOS + PRÓ-LABORE (12 MESES) -->
        <div class="p-3.5 rounded-xl bg-surface border border-app space-y-1.5 shadow-xs">
          <div class="flex items-center justify-between">
            <label class="text-[11px] font-semibold text-blue-600 dark:text-blue-400 block uppercase tracking-wider">
              Folha + Pró-Labore (12M)
            </label>
            <span class="text-[10px] font-bold font-mono text-app-text">{{ (resultado().fatorR * 100) | number:'1.1-1' }}% Fator R</span>
          </div>
          <div class="relative">
            <span class="absolute left-3 top-2.5 text-xs text-app-muted font-bold">R$</span>
            <input 
              type="number" 
              [(ngModel)]="folha12m" 
              (ngModelChange)="onParametrosAlterados()"
              class="w-full pl-9 pr-3 py-1.5 text-sm font-mono font-bold bg-app rounded-lg border border-app focus:outline-hidden focus:ring-1 focus:ring-blue-500 text-app-text" 
              step="2000" min="0" />
          </div>
          <span class="text-[10px] text-app-muted block">Para atingir os 28% do Fator R</span>
        </div>

      </div>

      <!-- CARDS COMPARATIVOS: ANEXO III vs ANEXO V vs SEM LEI SALÃO-PARCEIRO -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        <!-- CARD 1: CENÁRIO ATUAL COM LEI 13.352 (ANEXO III OTIMIZADO) -->
        <div class="p-4 rounded-xl border-2 transition-all"
          [class.border-emerald-500]="resultado().eficienteAnexoIII"
          [class.bg-emerald-50/40]="resultado().eficienteAnexoIII"
          [class.dark:bg-emerald-950/20]="resultado().eficienteAnexoIII"
          [class.border-app]="!resultado().eficienteAnexoIII"
          [class.bg-surface]="!resultado().eficienteAnexoIII">
          
          <div class="flex items-center justify-between pb-2 border-b border-app">
            <div>
              <span class="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 block">
                Cenário Recomendado
              </span>
              <h3 class="font-bold text-sm text-app-text">Anexo III + Lei 13.352</h3>
            </div>
            <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200">
              Aliq. {{ (resultado().aliquotaEfetivaAnexoIII * 100) | number:'1.2-2' }}%
            </span>
          </div>

          <div class="mt-3 space-y-2 text-xs">
            <div class="flex justify-between text-app-secondary">
              <span>Base Tributável (Cota Salão):</span>
              <strong class="font-mono text-app-text">R$ {{ resultado().cotaSalao | number:'1.2-2' }}</strong>
            </div>
            <div class="flex justify-between text-app-secondary">
              <span>Imposto Mensal (DAS):</span>
              <strong class="font-mono text-emerald-600 dark:text-emerald-400 text-sm">
                R$ {{ resultado().dasAnexoIII | number:'1.2-2' }}
              </strong>
            </div>
            <div class="flex justify-between text-app-secondary text-[11px]">
              <span>Carga Tributária Efetiva Geral:</span>
              <span class="font-mono font-bold text-app-text">
                {{ (resultado().cargaEfetivaAnexoIIISobreBruto * 100) | number:'1.2-2' }}% sobre o bruto
              </span>
            </div>
          </div>

          <div class="mt-3 pt-2.5 border-t border-app/60 text-[11px] text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
            <mat-icon class="text-xs">verified</mat-icon>
            <span>Fator R atendido (≥ 28%) com dedução dos MEIs</span>
          </div>
        </div>

        <!-- CARD 2: CENÁRIO ANEXO V (SE FATOR R < 28%) -->
        <div class="p-4 rounded-xl border-2 transition-all"
          [class.border-amber-500]="!resultado().eficienteAnexoIII"
          [class.bg-amber-50/40]="!resultado().eficienteAnexoIII"
          [class.dark:bg-amber-950/20]="!resultado().eficienteAnexoIII"
          [class.border-app]="resultado().eficienteAnexoIII"
          [class.bg-surface]="resultado().eficienteAnexoIII">
          
          <div class="flex items-center justify-between pb-2 border-b border-app">
            <div>
              <span class="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 block">
                Cenário Penalizado
              </span>
              <h3 class="font-bold text-sm text-app-text">Anexo V + Lei 13.352</h3>
            </div>
            <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200">
              Aliq. {{ (resultado().aliquotaEfetivaAnexoV * 100) | number:'1.2-2' }}%
            </span>
          </div>

          <div class="mt-3 space-y-2 text-xs">
            <div class="flex justify-between text-app-secondary">
              <span>Base Tributável (Cota Salão):</span>
              <strong class="font-mono text-app-text">R$ {{ resultado().cotaSalao | number:'1.2-2' }}</strong>
            </div>
            <div class="flex justify-between text-app-secondary">
              <span>Imposto Mensal (DAS):</span>
              <strong class="font-mono text-amber-600 dark:text-amber-400 text-sm">
                R$ {{ resultado().dasAnexoV | number:'1.2-2' }}
              </strong>
            </div>
            <div class="flex justify-between text-app-secondary text-[11px]">
              <span>Diferença a mais (Prejuízo):</span>
              <span class="font-mono font-bold text-red-600 dark:text-red-400">
                + R$ {{ (resultado().dasAnexoV - resultado().dasAnexoIII) | number:'1.2-2' }}/mês
              </span>
            </div>
          </div>

          <div class="mt-3 pt-2.5 border-t border-app/60 text-[11px] text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
            <mat-icon class="text-xs">warning</mat-icon>
            <span>Ocorre se a folha/pró-labore for menor que 28%</span>
          </div>
        </div>

        <!-- CARD 3: CENÁRIO SEM LEI SALÃO-PARCEIRO (TRIBUTAÇÃO SOBRE O BRUTO TOTAL) -->
        <div class="p-4 rounded-xl border border-red-200 dark:border-red-900/40 bg-red-50/30 dark:bg-red-950/10">
          
          <div class="flex items-center justify-between pb-2 border-b border-app">
            <div>
              <span class="text-[10px] font-bold uppercase tracking-wider text-red-700 dark:text-red-400 block">
                Sem a Lei 13.352 (Erro Grave)
              </span>
              <h3 class="font-bold text-sm text-app-text">Tributando s/ Total Bruto</h3>
            </div>
            <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200">
              Bitributação
            </span>
          </div>

          <div class="mt-3 space-y-2 text-xs">
            <div class="flex justify-between text-app-secondary">
              <span>Base Tributável (Sem Dedução):</span>
              <strong class="font-mono text-red-700 dark:text-red-300">R$ {{ faturamentoMensal | number:'1.2-2' }}</strong>
            </div>
            <div class="flex justify-between text-app-secondary">
              <span>DAS se tributasse tudo:</span>
              <strong class="font-mono text-red-700 dark:text-red-300 text-sm">
                R$ {{ resultado().dasSemLeiSalaoParceiro | number:'1.2-2' }}
              </strong>
            </div>
            <div class="flex justify-between text-app-secondary text-[11px]">
              <span>Economia gerada pela Lei:</span>
              <span class="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                R$ {{ resultado().economiaMensalComLei | number:'1.2-2' }}/mês
              </span>
            </div>
          </div>

          <div class="mt-3 pt-2.5 border-t border-app/60 text-[11px] text-red-800 dark:text-red-300 flex items-center gap-1.5">
            <mat-icon class="text-xs">block</mat-icon>
            <span>Evita pagar imposto sobre o dinheiro dos MEIs</span>
          </div>
        </div>

      </div>

      <!-- PAINEL DE DIAGNÓSTICO E SUGESTÃO ESTRATÉGICA -->
      <div class="p-4 rounded-xl border bg-slate-50 dark:bg-slate-900/60 border-app space-y-3">
        <div class="flex items-center gap-2">
          <mat-icon class="text-blue-600 dark:text-blue-400 text-base">psychology</mat-icon>
          <h4 class="font-bold text-xs sm:text-sm text-app-text">Diagnóstico & Sugestão de Otimização Tributária</h4>
        </div>

        <div class="text-xs text-app-secondary space-y-2 leading-relaxed">
          @if (resultado().eficienteAnexoIII) {
            <p>
              <strong class="text-emerald-600 dark:text-emerald-400">Excelente Enquadramento:</strong> 
              Seu Fator R atual está em <strong class="text-app-text font-mono">{{ (resultado().fatorR * 100) | number:'1.1-1' }}%</strong> (acima do mínimo legal de 28,0%). 
              Sua empresa está legitimamente enquadrada no <strong>Anexo III do Simples Nacional</strong>, usufruindo da menor alíquota efetiva (<strong>{{ (resultado().aliquotaEfetivaAnexoIII * 100) | number:'1.2-2' }}%</strong>).
            </p>
            <p>
              Com a dedução legal de <strong>R$ {{ repassesMeiMensal | number:'1.2-2' }}</strong> repassados aos profissionais parceiros MEI, sua economia tributária mensal é de 
              <strong class="text-emerald-600 dark:text-emerald-400 font-mono">R$ {{ resultado().economiaMensalComLei | number:'1.2-2' }}</strong> 
              (R$ {{ (resultado().economiaMensalComLei * 12) | number:'1.2-2' }}/ano).
            </p>
          } @else {
            <p class="text-amber-800 dark:text-amber-300 font-medium">
              <strong class="text-red-600 dark:text-red-400">Alerta de Ineficiência:</strong> 
              Seu Fator R atual está em <strong class="font-mono">{{ (resultado().fatorR * 100) | number:'1.1-1' }}%</strong>, abaixo do gatilho de 28%. 
              Isso força sua atividade a ser tributada no <strong>Anexo V</strong>, gerando um custo extra de 
              <strong class="font-mono">R$ {{ (resultado().dasAnexoV - resultado().dasAnexoIII) | number:'1.2-2' }}/mês</strong>.
            </p>
            <p>
              <strong>Sugestão Estratégica:</strong> Para retornar ao Anexo III e economizar tributos, ajuste o pró-labore dos sócios em 
              <strong class="text-blue-600 dark:text-blue-400 font-mono">R$ {{ resultado().proLaboreMinimoNecessarioMensal | number:'1.2-2' }}/mês</strong> 
              ou contrate funções de apoio CLT (recepção/limpeza), elevando o somatório anual da folha para <strong>R$ {{ resultado().folhaMinimaParaAnexoIII | number:'1.2-2' }}</strong>.
            </p>
          }
        </div>

        <!-- BARRA VISUAL DO FATOR R -->
        <div class="pt-2">
          <div class="flex justify-between text-[11px] mb-1 font-mono">
            <span class="text-app-muted">Fator R: {{ (resultado().fatorR * 100) | number:'1.1-1' }}%</span>
            <span class="text-emerald-600 font-bold">Meta: ≥ 28.0% (Anexo III)</span>
          </div>
          <div class="w-full h-2.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden relative">
            <div 
              class="h-full transition-all duration-500 rounded-full"
              [class.bg-emerald-500]="resultado().eficienteAnexoIII"
              [class.bg-amber-500]="!resultado().eficienteAnexoIII"
              [style.width.%]="mathMin(resultado().fatorR * 100 * (100 / 40), 100)">
            </div>
            <!-- Marcador do 28% -->
            <div class="absolute top-0 bottom-0 left-[70%] w-0.5 bg-red-500" title="Limite 28%"></div>
          </div>
        </div>

      </div>

    </div>
  `
})
export class SimuladorEnquadramentoTributarioComponent {
  readonly financeState = inject(FinanceStateService);

  faturamentoMensal = 57800.00;
  repassesMeiMensal = 32425.00;
  rbt12 = 420000.00;
  folha12m = 119700.00;

  constructor() {
    this.redefinirValoresPadrao();
  }

  redefinirValoresPadrao() {
    const emp = this.financeState.empresaAtiva();
    this.rbt12 = emp.rbt12 || 420000.00;
    this.folha12m = emp.folha_12m || 119700.00;

    // Calcular valores a partir dos fechamentos ativos
    const fechamentos = this.financeState.fechamentos();
    const totalBruto = fechamentos.reduce((acc, f) => acc + f.valor_bruto_producao, 0);
    const totalRepasses = fechamentos.reduce((acc, f) => acc + f.valor_liquido_nota, 0);

    if (totalBruto > 0) {
      this.faturamentoMensal = totalBruto;
      this.repassesMeiMensal = totalRepasses;
    }
  }

  onParametrosAlterados() {
    // gatilho para recomputar
  }

  readonly percentualRepasseMei = computed(() => {
    if (!this.faturamentoMensal || this.faturamentoMensal <= 0) return 0;
    return Math.round((this.repassesMeiMensal / this.faturamentoMensal) * 100);
  });

  readonly resultado = computed(() => {
    const bruto = Math.max(0, this.faturamentoMensal);
    const repasses = Math.max(0, this.repassesMeiMensal);
    const rbt12Val = Math.max(1000, this.rbt12);
    const folha12mVal = Math.max(0, this.folha12m);

    // Cota Salão (Base de cálculo Lei 13.352)
    const cotaSalao = Math.max(0, bruto - repasses);

    // Fator R = Folha 12m / RBT12
    const fatorR = folha12mVal / rbt12Val;
    const eficienteAnexoIII = fatorR >= 0.28;

    // Cálculo Alíquota Efetiva Anexo III: (RBT12 * AliqNom - Ded) / RBT12
    const aliqNomAnexoIII = this.calcularAliquotaEfetiva(rbt12Val, TABELA_ANEXO_III);
    const aliqNomAnexoV = this.calcularAliquotaEfetiva(rbt12Val, TABELA_ANEXO_V);

    // DAS nos diferentes cenários
    const dasAnexoIII = cotaSalao * aliqNomAnexoIII;
    const dasAnexoV = cotaSalao * aliqNomAnexoV;

    // DAS se não usasse a Lei 13.352 (tributando sobre todo o faturamento bruto)
    const dasSemLeiSalaoParceiro = bruto * (eficienteAnexoIII ? aliqNomAnexoIII : aliqNomAnexoV);
    const dasEfetivoAtual = eficienteAnexoIII ? dasAnexoIII : dasAnexoV;
    const economiaMensalComLei = Math.max(0, dasSemLeiSalaoParceiro - dasEfetivoAtual);

    // Meta para atingir 28% caso esteja abaixo
    const folhaMinimaParaAnexoIII = rbt12Val * 0.28;
    const diferencaFolhaAnual = Math.max(0, folhaMinimaParaAnexoIII - folha12mVal);
    const proLaboreMinimoNecessarioMensal = diferencaFolhaAnual / 12;

    const cargaEfetivaAnexoIIISobreBruto = bruto > 0 ? dasAnexoIII / bruto : 0;

    return {
      cotaSalao,
      fatorR,
      eficienteAnexoIII,
      aliquotaEfetivaAnexoIII: aliqNomAnexoIII,
      aliquotaEfetivaAnexoV: aliqNomAnexoV,
      dasAnexoIII,
      dasAnexoV,
      dasSemLeiSalaoParceiro,
      economiaMensalComLei,
      folhaMinimaParaAnexoIII,
      proLaboreMinimoNecessarioMensal,
      cargaEfetivaAnexoIIISobreBruto
    };
  });

  private calcularAliquotaEfetiva(rbt12: number, tabela: FaixaSimples[]): number {
    const faixa = tabela.find(f => rbt12 <= f.teto) || tabela[tabela.length - 1];
    const aliqEfetiva = ((rbt12 * faixa.aliqNominal) - faixa.parcelaDeduzir) / rbt12;
    return Math.max(0.04, aliqEfetiva);
  }

  mathMin(a: number, b: number): number {
    return Math.min(a, b);
  }
}
