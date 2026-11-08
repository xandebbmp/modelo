import { ChangeDetectionStrategy, Component, computed, inject, signal, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { FinanceStateService } from '../../core/services/finance-state.service';
import { CnpjValidatorService, CnpjConsultaResultado } from '../../core/services/cnpj-validator.service';
import { CsvExportService } from '../../core/services/csv-export.service';
import { ConfirmDialogService } from '../../core/services/confirm-dialog.service';
import { Parceiro } from '../../core/models/parceiro.model';
import { ModalConsultaCnpjComponent } from '../../shared/components/modal-consulta-cnpj.component';

@Component({
  selector: 'app-parceiros',
  imports: [
    CommonModule, 
    FormsModule, 
    RouterLink, 
    MatIconModule,
    ModalConsultaCnpjComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-6 animate-fade-in" id="parceiros-page">
      
      <!-- CABEÇALHO DA PÁGINA -->
      <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-2">
            <span class="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide bg-blue-100 dark:bg-blue-950/60 text-[#17324d] dark:text-blue-300 border border-blue-200 dark:border-blue-900">
              Lei Salão-Parceiro nº 13.352/2016
            </span>
            <span class="text-xs text-app-muted font-medium">Contratos & Conformidade MEI</span>
          </div>
          <h1 class="text-xl sm:text-2xl font-bold text-app-text tracking-tight flex items-center gap-2 mt-1">
            <mat-icon class="text-[#17324d] dark:text-blue-300">groups</mat-icon>
            Gestão de Profissionais Parceiros MEI
          </h1>
          <p class="text-xs text-app-secondary mt-0.5">
            Cadastre novos MEIs, monitore a homologação sindical dos contratos, acompanhe o teto de faturamento (R$ 81k) e audite a regularidade fiscal perante a Receita Federal.
          </p>
        </div>

        <div class="flex items-center gap-2 flex-wrap">
          <!-- Toggle Modo de Visualização (Lista vs Grade) -->
          <div class="p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-app flex items-center gap-1">
            <button 
              type="button" 
              (click)="modoVisualizacao.set('lista')"
              [class.bg-surface]="modoVisualizacao() === 'lista'"
              [class.shadow-xs]="modoVisualizacao() === 'lista'"
              [class.text-[#17324d]]="modoVisualizacao() === 'lista'"
              [class.dark:text-blue-300]="modoVisualizacao() === 'lista'"
              [class.text-app-muted]="modoVisualizacao() !== 'lista'"
              class="px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              id="btn-modo-lista-parceiros"
              title="Visualização em Lista Detalhada">
              <mat-icon class="text-sm">format_list_bulleted</mat-icon>
              <span>Lista</span>
            </button>
            <button 
              type="button" 
              (click)="modoVisualizacao.set('grade')"
              [class.bg-surface]="modoVisualizacao() === 'grade'"
              [class.shadow-xs]="modoVisualizacao() === 'grade'"
              [class.text-[#17324d]]="modoVisualizacao() === 'grade'"
              [class.dark:text-blue-300]="modoVisualizacao() === 'grade'"
              [class.text-app-muted]="modoVisualizacao() !== 'grade'"
              class="px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              id="btn-modo-grade-parceiros"
              title="Visualização em Cards">
              <mat-icon class="text-sm">grid_view</mat-icon>
              <span>Grade</span>
            </button>
          </div>

          <button 
            type="button" 
            (click)="exportarRelatorioCsv()"
            class="btn-secondary text-xs flex items-center gap-1.5"
            id="btn-exportar-conformidade-csv"
            title="Exportar planilha de conformidade dos parceiros">
            <mat-icon class="text-sm text-emerald-600">table_view</mat-icon> 
            <span class="hidden sm:inline">Exportar CSV</span>
          </button>

          <button 
            type="button" 
            (click)="abrirConsultaCnpjGeral()"
            class="btn-secondary text-xs flex items-center gap-1.5"
            id="btn-consultar-cnpj-parceiros">
            <mat-icon class="text-sm text-blue-500">search</mat-icon> 
            <span>Consultar CNPJ RFB</span>
          </button>

          <button 
            type="button" 
            (click)="abrirModalNovoParceiro()" 
            class="btn-primary text-xs flex items-center gap-1.5 shadow-sm"
            id="btn-novo-profissional-mei">
            <mat-icon class="text-sm">person_add</mat-icon> 
            <span>Novo Profissional MEI</span>
          </button>
        </div>
      </div>

      <!-- CARDS DE RESUMO DE CONFORMIDADE NO TOPO -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        
        <!-- Total Parceiros -->
        <div class="card-corporate p-4 flex items-center justify-between">
          <div>
            <span class="text-[11px] font-bold uppercase tracking-wider text-app-muted block">Total Parceiros</span>
            <div class="text-2xl font-black font-mono text-app-text mt-0.5">{{ totalParceiros() }}</div>
            <span class="text-[10px] text-app-secondary mt-0.5 block">MEIs ativos no salão</span>
          </div>
          <div class="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-[#17324d] dark:text-blue-300 flex items-center justify-center shrink-0">
            <mat-icon>groups</mat-icon>
          </div>
        </div>

        <!-- Homologados no Sindicato (100% Conformes) -->
        <div class="card-corporate p-4 flex items-center justify-between border-l-4 border-l-emerald-500">
          <div>
            <span class="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 block">Homologados Sindicato</span>
            <div class="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">
              {{ totalHomologados() }} <span class="text-xs font-normal text-app-muted">/ {{ totalParceiros() }}</span>
            </div>
            <span class="text-[10px] text-emerald-800 dark:text-emerald-300 mt-0.5 font-bold block">
              {{ percentualHomologados() }}% Blindagem Lei 13.352
            </span>
          </div>
          <div class="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-300 flex items-center justify-center shrink-0">
            <mat-icon>verified</mat-icon>
          </div>
        </div>

        <!-- CNPJs Ativos na Receita Federal -->
        <div class="card-corporate p-4 flex items-center justify-between">
          <div>
            <span class="text-[11px] font-bold uppercase tracking-wider text-app-muted block">CNPJs Ativos na RFB</span>
            <div class="text-2xl font-black font-mono text-app-text mt-0.5">
              {{ totalCnpjsAtivos() }} <span class="text-xs font-normal text-app-muted">/ {{ totalParceiros() }}</span>
            </div>
            <span class="text-[10px] text-app-secondary mt-0.5 block">Validados Módulo 11</span>
          </div>
          <div class="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0">
            <mat-icon>domain_verification</mat-icon>
          </div>
        </div>

        <!-- Alertas de Limite Teto MEI -->
        <div class="card-corporate p-4 flex items-center justify-between"
             [class.border-l-4]="totalAlertaTeto() > 0"
             [class.border-l-amber-500]="totalAlertaTeto() > 0">
          <div>
            <span class="text-[11px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 block">Alerta Teto MEI</span>
            <div class="text-2xl font-black font-mono text-amber-600 dark:text-amber-400 mt-0.5">
              {{ totalAlertaTeto() }}
            </div>
            <span class="text-[10px] text-amber-800 dark:text-amber-300 mt-0.5 font-medium block">
              > 80% do teto anual (R$ 81k)
            </span>
          </div>
          <div class="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-300 flex items-center justify-center shrink-0">
            <mat-icon>notification_important</mat-icon>
          </div>
        </div>

      </div>

      <!-- BARRA DE PESQUISA E FILTROS DE CONFORMIDADE -->
      <div class="card-corporate p-4 space-y-3">
        <div class="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          
          <!-- Busca em tempo real -->
          <div class="relative flex-1">
            <mat-icon class="absolute left-3 top-1/2 -translate-y-1/2 text-app-muted text-sm pointer-events-none">search</mat-icon>
            <input 
              type="text" 
              [ngModel]="termoBusca()"
              (ngModelChange)="termoBusca.set($event)"
              placeholder="Buscar por profissional, razão social MEI, CNPJ ou especialidade..."
              class="input-corporate pl-9 text-xs py-2 w-full"
              id="input-busca-parceiros"
            />
            @if (termoBusca()) {
              <button 
                type="button" 
                (click)="termoBusca.set('')"
                class="absolute right-2.5 top-1/2 -translate-y-1/2 text-app-muted hover:text-app-text p-1">
                <mat-icon class="text-xs">clear</mat-icon>
              </button>
            }
          </div>

          <!-- Filtro de Status de Conformidade -->
          <div class="flex items-center gap-2 flex-wrap">
            <div class="flex items-center gap-1.5 text-xs text-app-secondary">
              <mat-icon class="text-sm">filter_alt</mat-icon>
              <span class="font-bold">Conformidade:</span>
            </div>
            <select 
              [ngModel]="filtroConformidade()" 
              (ngModelChange)="filtroConformidade.set($event)"
              class="input-corporate text-xs py-1.5 px-2.5 w-auto"
              id="select-filtro-conformidade">
              <option value="TODOS">Todos os Status</option>
              <option value="HOMOLOGADOS">Homologados no Sindicato (100% Blindados)</option>
              <option value="PENDENTES_HOMOLOGACAO">Pendentes de Homologação</option>
              <option value="ALERTA_TETO">Alerta de Teto MEI (>80% de R$ 81k)</option>
              <option value="PENDENCIA_DASN">Com Pendência DASN / RFB</option>
            </select>

            <!-- Filtro por Especialidade -->
            <select 
              [ngModel]="filtroEspecialidade()" 
              (ngModelChange)="filtroEspecialidade.set($event)"
              class="input-corporate text-xs py-1.5 px-2.5 w-auto"
              id="select-filtro-especialidade">
              <option value="TODAS">Todas as Especialidades</option>
              <option value="Cabeleireiro(a)">Cabeleireiro(a)</option>
              <option value="Barbeiro(a)">Barbeiro(a)</option>
              <option value="Manicure/Pedicure">Manicure/Pedicure</option>
              <option value="Esteticista">Esteticista</option>
              <option value="Maquiador(a)">Maquiador(a)</option>
              <option value="Depilador(a)">Depilador(a)</option>
            </select>
          </div>

        </div>

        <!-- Indicador de Registros Filtrados -->
        <div class="flex items-center justify-between text-[11px] text-app-muted pt-2 border-t border-app">
          <div class="flex items-center gap-1.5">
            <span>Exibindo <strong>{{ parceirosFiltrados().length }}</strong> de <strong>{{ totalParceiros() }}</strong> profissionais parceiros</span>
            @if (termoBusca() || filtroConformidade() !== 'TODOS' || filtroEspecialidade() !== 'TODAS') {
              <button 
                type="button" 
                (click)="limparFiltros()"
                class="text-blue-600 dark:text-blue-400 font-bold hover:underline ml-2">
                Limpar Filtros
              </button>
            }
          </div>
          <div class="hidden sm:flex items-center gap-2">
            <span class="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400">
              <span class="w-2 h-2 rounded-full bg-emerald-500"></span> Conforme
            </span>
            <span class="inline-flex items-center gap-1 text-amber-700 dark:text-amber-400">
              <span class="w-2 h-2 rounded-full bg-amber-500"></span> Em trâmite / Alerta
            </span>
            <span class="inline-flex items-center gap-1 text-rose-700 dark:text-rose-400">
              <span class="w-2 h-2 rounded-full bg-rose-500"></span> Não Conforme
            </span>
          </div>
        </div>
      </div>

      <!-- ========================================================================= -->
      <!-- 1. VISUALIZAÇÃO EM LISTA (TABELA ANALÍTICA DE CONFORMIDADE) -->
      <!-- ========================================================================= -->
      @if (modoVisualizacao() === 'lista') {
        <div class="card-corporate overflow-hidden" id="tabela-parceiros-container">
          <div class="overflow-x-auto">
            <table class="table-corporate w-full text-left border-collapse" id="tabela-profissionais-parceiros">
              <thead>
                <tr class="border-b border-app text-[11px] uppercase tracking-wider font-bold bg-slate-50 dark:bg-slate-900/40 text-app-secondary">
                  <th class="py-3 px-4">Profissional / MEI</th>
                  <th class="py-3 px-4">Conformidade Lei 13.352</th>
                  <th class="py-3 px-4">Partilha (Cotas)</th>
                  <th class="py-3 px-4">Chave PIX Cadastrada</th>
                  <th class="py-3 px-4">Teto MEI (R$ 81k)</th>
                  <th class="py-3 px-4 text-right">Ações de Gestão</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-app text-xs">
                @for (p of parceirosFiltrados(); track p.id) {
                  <tr class="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group">
                    
                    <!-- 1. Coluna Profissional / MEI -->
                    <td class="py-3.5 px-4">
                      <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-xl bg-[#17324d] text-white flex items-center justify-center font-bold text-sm overflow-hidden border border-[#244666] shrink-0 shadow-xs">
                          @if (p.foto_avatar) {
                            <img [src]="p.foto_avatar" [alt]="p.nome_fantasia" class="w-full h-full object-cover" />
                          } @else {
                            <mat-icon>person</mat-icon>
                          }
                        </div>
                        <div class="min-w-0">
                          <div class="flex items-center gap-1.5">
                            <span class="font-bold text-app-text truncate max-w-[200px]" [title]="p.nome_fantasia || p.razao_social">
                              {{ p.nome_fantasia || p.razao_social }}
                            </span>
                            <span class="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-slate-100 dark:bg-slate-800 text-app-secondary shrink-0">
                              {{ p.especialidade }}
                            </span>
                          </div>
                          <div class="text-[11px] text-app-muted truncate max-w-[220px]" [title]="p.razao_social">
                            {{ p.razao_social }}
                          </div>
                          <div class="flex items-center gap-2 mt-0.5">
                            <span class="font-mono text-[10px] text-app-muted">CNPJ: {{ p.cnpj }}</span>
                            <button 
                              type="button" 
                              (click)="consultarCnpj(p.cnpj)"
                              class="text-[10px] text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-0.5">
                              <mat-icon class="text-[11px]">search</mat-icon> RFB
                            </button>
                          </div>
                        </div>
                      </div>
                    </td>

                    <!-- 2. Coluna Conformidade Lei 13.352 -->
                    <td class="py-3.5 px-4">
                      <div class="space-y-1">
                        
                        <!-- Status do Contrato (Homologação Sindical) -->
                        <div>
                          @if (p.status_contrato === 'HOMOLOGADO_SINDICATO') {
                            <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800"
                                  title="Contrato formalmente homologado no sindicato da categoria profissional e patronal (Art. 1º-A, § 6º da Lei 13.352/2016)">
                              <mat-icon class="text-xs">verified</mat-icon>
                              Homologado no Sindicato
                            </span>
                          } @else if (p.status_contrato === 'ASSINADO_PENDENTE_HOMOLOGACAO') {
                            <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800"
                                  title="Contrato assinado pelas partes, em trâmite de homologação sindical">
                              <mat-icon class="text-xs">pending_actions</mat-icon>
                              Assinado (Pendente Homologação)
                            </span>
                          } @else {
                            <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800"
                                  title="Minuta pendente de assinatura e homologação formal. Risco trabalhista.">
                              <mat-icon class="text-xs">warning</mat-icon>
                              Minuta Pendente
                            </span>
                          }
                        </div>

                        <!-- Status na Receita Federal -->
                        <div class="flex items-center gap-1.5 text-[11px]">
                          @if (p.status_mei === 'ATIVO_REGULAR') {
                            <span class="text-emerald-700 dark:text-emerald-400 font-medium flex items-center gap-1">
                              <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                              CNPJ Ativo na RFB
                            </span>
                          } @else if (p.status_mei === 'PENDENCIA_DASN') {
                            <span class="text-amber-700 dark:text-amber-400 font-medium flex items-center gap-1">
                              <span class="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                              Pendência de DASN
                            </span>
                          } @else {
                            <span class="text-rose-700 dark:text-rose-400 font-bold flex items-center gap-1">
                              <span class="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                              Desenquadrado MEI
                            </span>
                          }
                        </div>

                        <!-- Selo Resumido de Blindagem -->
                        <div class="text-[10px] text-app-muted">
                          @if (p.status_contrato === 'HOMOLOGADO_SINDICATO' && p.status_mei === 'ATIVO_REGULAR') {
                            <span class="text-emerald-600 dark:text-emerald-400 font-bold">✓ Blindagem Fiscal Ativa</span>
                          } @else {
                            <span class="text-amber-600 dark:text-amber-400 font-semibold">⚠ Atenção aos requisitos legais</span>
                          }
                        </div>

                      </div>
                    </td>

                    <!-- 3. Coluna Partilha (Cotas) -->
                    <td class="py-3.5 px-4">
                      <div class="space-y-1">
                        <div class="flex items-center gap-2">
                          <span class="font-bold text-app-text font-mono">{{ p.percentual_padrao_empresa }}% Salão</span>
                          <span class="text-app-muted">/</span>
                          <span class="font-bold text-[#17324d] dark:text-blue-300 font-mono">{{ p.percentual_padrao_parceiro }}% MEI</span>
                        </div>
                        <div class="w-28 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden flex">
                          <div class="h-full bg-slate-400 dark:bg-slate-500" [style.width.%]="p.percentual_padrao_empresa" title="Cota Salão"></div>
                          <div class="h-full bg-[#17324d] dark:bg-blue-400" [style.width.%]="p.percentual_padrao_parceiro" title="Cota MEI"></div>
                        </div>
                        <span class="text-[10px] text-app-muted block">Insumos/taxas dedutíveis</span>
                      </div>
                    </td>

                    <!-- 4. Coluna Chave PIX Cadastrada -->
                    <td class="py-3.5 px-4">
                      <div class="space-y-1 max-w-[180px]">
                        <div class="flex items-center gap-1.5">
                          <span class="px-1.5 py-0.2 rounded font-mono text-[9px] font-bold"
                                [class.bg-emerald-100]="p.tipo_chave_pix === 'CNPJ'"
                                [class.dark:bg-emerald-950]="p.tipo_chave_pix === 'CNPJ'"
                                [class.text-emerald-800]="p.tipo_chave_pix === 'CNPJ'"
                                [class.dark:text-emerald-300]="p.tipo_chave_pix === 'CNPJ'"
                                [class.bg-amber-100]="p.tipo_chave_pix !== 'CNPJ'"
                                [class.dark:bg-amber-950]="p.tipo_chave_pix !== 'CNPJ'"
                                [class.text-amber-800]="p.tipo_chave_pix !== 'CNPJ'"
                                [class.dark:text-amber-300]="p.tipo_chave_pix !== 'CNPJ'">
                            {{ p.tipo_chave_pix }}
                          </span>
                          <span class="font-mono text-xs text-app-text truncate font-bold" [title]="p.chave_pix_padrao">
                            {{ p.chave_pix_padrao }}
                          </span>
                        </div>
                        @if (p.tipo_chave_pix === 'CNPJ') {
                          <span class="text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                            <mat-icon class="text-[11px]">check</mat-icon> Conta PJ Recomendada
                          </span>
                        } @else {
                          <span class="text-[10px] text-amber-600 dark:text-amber-400 flex items-center gap-0.5" title="Recomenda-se chave vinculada ao CNPJ do MEI para evitar confusão patrimonial e risco trabalhista">
                            <mat-icon class="text-[11px]">info</mat-icon> Alerta: Conta PF
                          </span>
                        }
                      </div>
                    </td>

                    <!-- 5. Coluna Teto MEI (R$ 81k) -->
                    <td class="py-3.5 px-4">
                      <div class="space-y-1 min-w-[130px]">
                        <div class="flex justify-between items-center text-[11px]">
                          <span class="font-mono font-bold text-app-text">
                            R$ {{ p.faturamento_anual_acumulado | number:'1.0-0' }}
                          </span>
                          <span class="font-mono text-[10px]"
                                [class.text-emerald-600]="(p.faturamento_anual_acumulado / 81000) < 0.7"
                                [class.text-amber-600]="(p.faturamento_anual_acumulado / 81000) >= 0.7 && (p.faturamento_anual_acumulado / 81000) < 0.9"
                                [class.text-rose-600]="(p.faturamento_anual_acumulado / 81000) >= 0.9">
                            {{ ((p.faturamento_anual_acumulado / 81000) * 100) | number:'1.0-0' }}%
                          </span>
                        </div>
                        <div class="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div 
                            class="h-full rounded-full transition-all duration-300" 
                            [class.bg-emerald-500]="(p.faturamento_anual_acumulado / 81000) < 0.7"
                            [class.bg-amber-500]="(p.faturamento_anual_acumulado / 81000) >= 0.7 && (p.faturamento_anual_acumulado / 81000) < 0.9"
                            [class.bg-rose-500]="(p.faturamento_anual_acumulado / 81000) >= 0.9"
                            [style.width.%]="calcularPorcentagemTeto(p.faturamento_anual_acumulado, 81000)">
                          </div>
                        </div>
                        <div class="text-[10px] text-app-muted">
                          @if ((p.faturamento_anual_acumulado / 81000) >= 0.8) {
                            <span class="text-amber-600 font-bold">Alerta: Proximidade teto</span>
                          } @else {
                            <span>Teto: R$ 81.000 / ano</span>
                          }
                        </div>
                      </div>
                    </td>

                    <!-- 6. Coluna Ações de Gestão -->
                    <td class="py-3.5 px-4 text-right">
                      <div class="flex items-center justify-end gap-1.5">
                        
                        <!-- Botão Dossiê de Conformidade -->
                        <button 
                          type="button" 
                          (click)="abrirDossieConformidade(p)"
                          class="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-blue-600 dark:text-blue-400 transition-colors"
                          title="Ver Dossiê e Checklist de Conformidade da Lei 13.352">
                          <mat-icon class="text-base">policy</mat-icon>
                        </button>

                        <!-- Botão Simular App MEI -->
                        <button 
                          type="button" 
                          (click)="simularComoParceiro(p.id)"
                          class="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-emerald-600 dark:text-emerald-400 transition-colors"
                          title="Simular Visão do Parceiro no Smartphone">
                          <mat-icon class="text-base">smartphone</mat-icon>
                        </button>

                        <!-- Botão Editar Parceiro -->
                        <button 
                          type="button" 
                          (click)="abrirModalEditarParceiro(p)"
                          class="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-app-secondary hover:text-app-text transition-colors"
                          title="Editar Dados e Cotas do Parceiro">
                          <mat-icon class="text-base">edit</mat-icon>
                        </button>

                        <!-- Botão Excluir Parceiro -->
                        <button 
                          type="button" 
                          (click)="excluirParceiro(p)"
                          class="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 hover:text-rose-700 transition-colors"
                          title="Remover Profissional Parceiro">
                          <mat-icon class="text-base">delete</mat-icon>
                        </button>

                      </div>
                    </td>

                  </tr>
                } @empty {
                  <tr>
                    <td colspan="6" class="py-8 px-4 text-center text-app-muted">
                      <div class="max-w-sm mx-auto space-y-2">
                        <mat-icon class="text-3xl text-app-muted">search_off</mat-icon>
                        <p class="font-bold text-sm text-app-text">Nenhum profissional MEI encontrado</p>
                        <p class="text-xs">Não foram encontrados parceiros com os critérios e filtros selecionados.</p>
                        <button type="button" (click)="limparFiltros()" class="btn-secondary text-xs mt-2">
                          Limpar Filtros de Busca
                        </button>
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }

      <!-- ========================================================================= -->
      <!-- 2. VISUALIZAÇÃO EM GRADE (CARDS CORPORATIVOS) -->
      <!-- ========================================================================= -->
      @if (modoVisualizacao() === 'grade') {
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" id="cards-parceiros-container">
          @for (p of parceirosFiltrados(); track p.id) {
            <div class="card-corporate p-4 flex flex-col justify-between space-y-4 hover:border-[#17324d] transition-all">
              
              <div class="flex items-start justify-between gap-3">
                <div class="flex items-center gap-3">
                  <div class="w-12 h-12 rounded-xl bg-[#17324d] text-white flex items-center justify-center font-bold text-base overflow-hidden border border-[#244666] shrink-0">
                    @if (p.foto_avatar) {
                      <img [src]="p.foto_avatar" alt="Avatar" class="w-full h-full object-cover" />
                    } @else {
                      <mat-icon>person</mat-icon>
                    }
                  </div>
                  <div>
                    <h3 class="font-bold text-sm text-app-text leading-tight">{{ p.nome_fantasia || p.razao_social }}</h3>
                    <span class="text-[11px] text-app-secondary block font-medium">{{ p.especialidade }}</span>
                    <div class="flex items-center gap-1.5 mt-0.5">
                      <span class="font-mono text-[10px] text-app-muted">CNPJ: {{ p.cnpj }}</span>
                    </div>
                  </div>
                </div>

                <!-- BADGE DA SITUAÇÃO DO CNPJ -->
                <button 
                  type="button" 
                  (click)="consultarCnpj(p.cnpj)"
                  class="px-2 py-0.5 rounded-full text-[9px] font-bold border transition-colors flex items-center gap-1 shrink-0 cursor-pointer"
                  [class.bg-emerald-50]="p.status_mei === 'ATIVO_REGULAR'"
                  [class.dark:bg-emerald-950/60]="p.status_mei === 'ATIVO_REGULAR'"
                  [class.text-emerald-700]="p.status_mei === 'ATIVO_REGULAR'"
                  [class.dark:text-emerald-300]="p.status_mei === 'ATIVO_REGULAR'"
                  [class.border-emerald-300]="p.status_mei === 'ATIVO_REGULAR'"
                  title="Consultar CNPJ na Receita Federal">
                  <mat-icon class="text-[11px]">verified_user</mat-icon>
                  <span>CNPJ Ativo</span>
                </button>
              </div>

              <!-- Status do Contrato (Lei 13.352) -->
              <div class="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-100/60 dark:bg-slate-800/40 border border-app">
                <span class="text-app-secondary font-medium">Contrato Parceria:</span>
                @if (p.status_contrato === 'HOMOLOGADO_SINDICATO') {
                  <span class="text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-1 text-[11px]">
                    <mat-icon class="text-xs">verified</mat-icon> Homologado
                  </span>
                } @else if (p.status_contrato === 'ASSINADO_PENDENTE_HOMOLOGACAO') {
                  <span class="text-amber-700 dark:text-amber-400 font-bold flex items-center gap-1 text-[11px]">
                    <mat-icon class="text-xs">pending_actions</mat-icon> Em trâmite
                  </span>
                } @else {
                  <span class="text-rose-700 dark:text-rose-400 font-bold flex items-center gap-1 text-[11px]">
                    <mat-icon class="text-xs">warning</mat-icon> Minuta
                  </span>
                }
              </div>

              <!-- Dados de Partilha e Chave PIX -->
              <div class="p-3 bg-slate-50 dark:bg-[#12283e] rounded-lg border border-app space-y-2 text-xs">
                <div class="flex justify-between items-center">
                  <span class="text-app-secondary">Cota Salão / Parceiro:</span>
                  <span class="font-bold text-app-text font-mono">{{ p.percentual_padrao_empresa }}% Salão / {{ p.percentual_padrao_parceiro }}% MEI</span>
                </div>
                <div class="flex justify-between items-center">
                  <span class="text-app-secondary">Chave PIX Cadastrada:</span>
                  <span class="font-mono text-[11px] text-[#17324d] dark:text-blue-300 font-bold truncate max-w-[150px]" [title]="p.chave_pix_padrao">
                    {{ p.chave_pix_padrao }}
                  </span>
                </div>
              </div>

              <!-- Termômetro de Faturamento Anual MEI -->
              <div class="space-y-1">
                <div class="flex justify-between text-[11px]">
                  <span class="text-app-secondary">Faturamento Acumulado 2026:</span>
                  <span class="font-bold font-mono text-app-text">R$ {{ p.faturamento_anual_acumulado | number:'1.0-0' }} / 81k</span>
                </div>
                <div class="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div 
                    class="h-full rounded-full transition-all" 
                    [class.bg-emerald-500]="(p.faturamento_anual_acumulado / 81000) < 0.7"
                    [class.bg-amber-500]="(p.faturamento_anual_acumulado / 81000) >= 0.7 && (p.faturamento_anual_acumulado / 81000) < 0.9"
                    [class.bg-rose-500]="(p.faturamento_anual_acumulado / 81000) >= 0.9"
                    [style.width.%]="calcularPorcentagemTeto(p.faturamento_anual_acumulado, 81000)">
                  </div>
                </div>
              </div>

              <!-- Ações do Card -->
              <div class="pt-2 border-t border-app flex items-center justify-between">
                <button 
                  type="button" 
                  (click)="abrirDossieConformidade(p)"
                  class="text-xs text-blue-600 dark:text-blue-400 font-bold hover:underline flex items-center gap-1">
                  <mat-icon class="text-xs">policy</mat-icon> Conformidade
                </button>

                <div class="flex items-center gap-1.5">
                  <button 
                    type="button" 
                    (click)="abrirModalEditarParceiro(p)"
                    class="p-1 text-app-secondary hover:text-app-text"
                    title="Editar">
                    <mat-icon class="text-sm">edit</mat-icon>
                  </button>

                  <button 
                    type="button" 
                    (click)="simularComoParceiro(p.id)"
                    class="btn-secondary py-1 px-2 text-xs flex items-center gap-1">
                    <mat-icon class="text-xs">smartphone</mat-icon> App MEI
                  </button>
                </div>
              </div>

            </div>
          }
        </div>
      }

      <!-- ========================================================================= -->
      <!-- 3. MODAL DE DOSSIÊ DE CONFORMIDADE DA LEI 13.352/2016 -->
      <!-- ========================================================================= -->
      @if (parceiroDossie(); as dossie) {
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-fade-in" id="modal-dossie-conformidade">
          <div class="relative w-full max-w-2xl bg-surface border border-app rounded-2xl shadow-2xl p-6 overflow-y-auto max-h-[92vh] space-y-5">
            
            <!-- Cabeçalho do Dossiê -->
            <div class="flex items-center justify-between pb-3 border-b border-app">
              <div class="flex items-center gap-2.5">
                <div class="p-2 rounded-xl bg-blue-100 dark:bg-blue-950 text-[#17324d] dark:text-blue-300">
                  <mat-icon class="text-lg">policy</mat-icon>
                </div>
                <div>
                  <h3 class="text-base font-bold text-app-text flex items-center gap-2">
                    Dossiê de Conformidade Jurídica e Fiscal
                  </h3>
                  <span class="text-xs text-app-secondary">{{ dossie.nome_fantasia }} • {{ dossie.cnpj }}</span>
                </div>
              </div>

              <button type="button" (click)="parceiroDossie.set(null)" class="text-app-muted hover:text-app-text p-1 rounded-lg">
                <mat-icon>close</mat-icon>
              </button>
            </div>

            <!-- Resumo do Status de Conformidade -->
            <div class="p-4 rounded-xl border flex items-center justify-between flex-wrap gap-3"
                 [class.bg-emerald-50]="dossie.status_contrato === 'HOMOLOGADO_SINDICATO'"
                 [class.dark:bg-emerald-950/40]="dossie.status_contrato === 'HOMOLOGADO_SINDICATO'"
                 [class.border-emerald-200]="dossie.status_contrato === 'HOMOLOGADO_SINDICATO'"
                 [class.bg-amber-50]="dossie.status_contrato !== 'HOMOLOGADO_SINDICATO'"
                 [class.dark:bg-amber-950/40]="dossie.status_contrato !== 'HOMOLOGADO_SINDICATO'"
                 [class.border-amber-200]="dossie.status_contrato !== 'HOMOLOGADO_SINDICATO'">
              <div class="flex items-center gap-3">
                <mat-icon class="text-2xl" [class.text-emerald-600]="dossie.status_contrato === 'HOMOLOGADO_SINDICATO'" [class.text-amber-600]="dossie.status_contrato !== 'HOMOLOGADO_SINDICATO'">
                  {{ dossie.status_contrato === 'HOMOLOGADO_SINDICATO' ? 'verified' : 'pending_actions' }}
                </mat-icon>
                <div>
                  <h4 class="font-bold text-sm" [class.text-emerald-900]="dossie.status_contrato === 'HOMOLOGADO_SINDICATO'" [class.dark:text-emerald-200]="dossie.status_contrato === 'HOMOLOGADO_SINDICATO'" [class.text-amber-900]="dossie.status_contrato !== 'HOMOLOGADO_SINDICATO'" [class.dark:text-amber-200]="dossie.status_contrato !== 'HOMOLOGADO_SINDICATO'">
                    {{ dossie.status_contrato === 'HOMOLOGADO_SINDICATO' ? 'Blindagem Jurídica Completa Ativa' : 'Homologação Sindical Pendente' }}
                  </h4>
                  <p class="text-xs" [class.text-emerald-800]="dossie.status_contrato === 'HOMOLOGADO_SINDICATO'" [class.dark:text-emerald-300]="dossie.status_contrato === 'HOMOLOGADO_SINDICATO'" [class.text-amber-800]="dossie.status_contrato !== 'HOMOLOGADO_SINDICATO'" [class.dark:text-amber-300]="dossie.status_contrato !== 'HOMOLOGADO_SINDICATO'">
                    {{ dossie.status_contrato === 'HOMOLOGADO_SINDICATO' ? 'Atende a todos os requisitos do art. 1º-A da Lei 13.352/2016 e garante a segregação de receita no Simples Nacional.' : 'Recomenda-se providenciar a homologação sindical para evitar riscos de vínculo empregatício retroativo.' }}
                  </p>
                </div>
              </div>

              @if (dossie.status_contrato !== 'HOMOLOGADO_SINDICATO') {
                <button 
                  type="button" 
                  (click)="homologarContrato(dossie.id)"
                  class="btn-primary text-xs flex items-center gap-1.5 shrink-0">
                  <mat-icon class="text-sm">verified</mat-icon>
                  Homologar no Sindicato
                </button>
              }
            </div>

            <!-- CHECKLIST DE AUDITORIA DA LEI 13.352/2016 -->
            <div class="space-y-3">
              <h4 class="text-xs font-bold uppercase tracking-wider text-app-muted">
                Auditoria de Requisitos Obrigatórios da Lei
              </h4>

              <div class="divide-y divide-app border border-app rounded-xl overflow-hidden text-xs">
                
                <!-- 1. Contrato Escrito -->
                <div class="p-3 flex items-start justify-between gap-3 bg-surface">
                  <div class="flex items-start gap-2.5">
                    <mat-icon class="text-emerald-600 text-sm mt-0.5">check_circle</mat-icon>
                    <div>
                      <span class="font-bold text-app-text block">1. Contrato de Parceria Formal Escrito (Art. 1º-A, § 2º)</span>
                      <span class="text-app-secondary text-[11px]">
                        Cláusulas obrigatórias de partilha ({{ dossie.percentual_padrao_empresa }}% Salão / {{ dossie.percentual_padrao_parceiro }}% MEI), periodicidade de repasse e custeio de insumos.
                      </span>
                    </div>
                  </div>
                  <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                    Conforme
                  </span>
                </div>

                <!-- 2. Homologação Sindical -->
                <div class="p-3 flex items-start justify-between gap-3 bg-surface">
                  <div class="flex items-start gap-2.5">
                    <mat-icon class="text-sm mt-0.5" [class.text-emerald-600]="dossie.status_contrato === 'HOMOLOGADO_SINDICATO'" [class.text-amber-500]="dossie.status_contrato !== 'HOMOLOGADO_SINDICATO'">
                      {{ dossie.status_contrato === 'HOMOLOGADO_SINDICATO' ? 'check_circle' : 'pending' }}
                    </mat-icon>
                    <div>
                      <span class="font-bold text-app-text block">2. Homologação Sindical Obrigatória (Art. 1º-A, § 6º)</span>
                      <span class="text-app-secondary text-[11px]">
                        Contrato homologado perante o sindicato profissional da categoria e patronal ou Ministério do Trabalho.
                      </span>
                    </div>
                  </div>
                  <span class="px-2 py-0.5 rounded text-[10px] font-bold"
                        [class.bg-emerald-100]="dossie.status_contrato === 'HOMOLOGADO_SINDICATO'"
                        [class.text-emerald-800]="dossie.status_contrato === 'HOMOLOGADO_SINDICATO'"
                        [class.bg-amber-100]="dossie.status_contrato !== 'HOMOLOGADO_SINDICATO'"
                        [class.text-amber-800]="dossie.status_contrato !== 'HOMOLOGADO_SINDICATO'">
                    {{ dossie.status_contrato === 'HOMOLOGADO_SINDICATO' ? 'Homologado' : 'Em Trâmite' }}
                  </span>
                </div>

                <!-- 3. Inscrição Ativa MEI -->
                <div class="p-3 flex items-start justify-between gap-3 bg-surface">
                  <div class="flex items-start gap-2.5">
                    <mat-icon class="text-emerald-600 text-sm mt-0.5">check_circle</mat-icon>
                    <div>
                      <span class="font-bold text-app-text block">3. Inscrição Cadastral do MEI na Receita Federal</span>
                      <span class="text-app-secondary text-[11px]">
                        CNPJ {{ dossie.cnpj }} ativo e validado pelo algoritmo Módulo 11 da Receita Federal.
                      </span>
                    </div>
                  </div>
                  <button 
                    type="button" 
                    (click)="consultarCnpj(dossie.cnpj)"
                    class="text-blue-600 dark:text-blue-400 font-bold text-[10px] hover:underline flex items-center gap-0.5">
                    <mat-icon class="text-xs">search</mat-icon> Consultar RFB
                  </button>
                </div>

                <!-- 4. Chave PIX e Titularidade Bancária -->
                <div class="p-3 flex items-start justify-between gap-3 bg-surface">
                  <div class="flex items-start gap-2.5">
                    <mat-icon class="text-sm mt-0.5" [class.text-emerald-600]="dossie.tipo_chave_pix === 'CNPJ'" [class.text-amber-500]="dossie.tipo_chave_pix !== 'CNPJ'">
                      {{ dossie.tipo_chave_pix === 'CNPJ' ? 'check_circle' : 'info' }}
                    </mat-icon>
                    <div>
                      <span class="font-bold text-app-text block">4. Titularidade da Conta de Repasses (PIX)</span>
                      <span class="text-app-secondary text-[11px]">
                        Chave {{ dossie.tipo_chave_pix }}: {{ dossie.chave_pix_padrao }} ({{ dossie.tipo_chave_pix === 'CNPJ' ? 'Conta PJ em conformidade com o Fisco' : 'Recomendado usar chave CNPJ para resguardo fiscal' }}).
                      </span>
                    </div>
                  </div>
                  <span class="px-2 py-0.5 rounded text-[10px] font-bold"
                        [class.bg-emerald-100]="dossie.tipo_chave_pix === 'CNPJ'"
                        [class.text-emerald-800]="dossie.tipo_chave_pix === 'CNPJ'"
                        [class.bg-amber-100]="dossie.tipo_chave_pix !== 'CNPJ'"
                        [class.text-amber-800]="dossie.tipo_chave_pix !== 'CNPJ'">
                    {{ dossie.tipo_chave_pix === 'CNPJ' ? 'Conta PJ' : 'Conta PF' }}
                  </span>
                </div>

                <!-- 5. Teto do MEI -->
                <div class="p-3 flex items-start justify-between gap-3 bg-surface">
                  <div class="flex items-start gap-2.5">
                    <mat-icon class="text-emerald-600 text-sm mt-0.5">check_circle</mat-icon>
                    <div>
                      <span class="font-bold text-app-text block">5. Faturamento Acumulado no Exercício 2026</span>
                      <span class="text-app-secondary text-[11px]">
                        R$ {{ dossie.faturamento_anual_acumulado | number:'1.2-2' }} acumulados de um teto de R$ {{ (dossie.teto_anual_mei || 81000) | number:'1.2-2' }} ({{ ((dossie.faturamento_anual_acumulado / 81000) * 100) | number:'1.0-0' }}% atingido).
                      </span>
                    </div>
                  </div>
                  <span class="font-mono text-xs font-bold text-app-text">
                    R$ {{ (81000 - dossie.faturamento_anual_acumulado) | number:'1.2-2' }} saldo
                  </span>
                </div>

              </div>
            </div>

            <!-- Ações do Dossiê -->
            <div class="pt-3 border-t border-app flex items-center justify-between flex-wrap gap-2 text-xs">
              <button 
                type="button" 
                (click)="simularComoParceiro(dossie.id)"
                class="btn-secondary text-xs flex items-center gap-1.5">
                <mat-icon class="text-sm">smartphone</mat-icon>
                Simular Visão MEI
              </button>

              <div class="flex items-center gap-2">
                <button 
                  type="button" 
                  (click)="parceiroDossie.set(null)"
                  class="btn-secondary text-xs">
                  Fechar
                </button>
                <button 
                  type="button" 
                  (click)="abrirModalEditarParceiro(dossie)"
                  class="btn-primary text-xs flex items-center gap-1.5">
                  <mat-icon class="text-sm">edit</mat-icon>
                  Editar Dados Cadastrais
                </button>
              </div>
            </div>

          </div>
        </div>
      }

      <!-- ========================================================================= -->
      <!-- 4. MODAL NOVO PROFISSIONAL MEI COM VALIDAÇÃO RFB -->
      <!-- ========================================================================= -->
      @if (modalNovoParceiro()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fade-in" id="modal-novo-parceiro">
          <div class="relative w-full max-w-lg bg-surface border border-app rounded-2xl shadow-2xl p-6 overflow-y-auto max-h-[90vh]">
            
            <div class="flex items-center justify-between pb-3 mb-4 border-b border-app">
              <div class="flex items-center gap-2">
                <div class="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-950 text-[#17324d] dark:text-blue-300">
                  <mat-icon class="text-base">person_add</mat-icon>
                </div>
                <div>
                  <h3 class="text-base font-bold text-app-text">Cadastrar Novo Profissional MEI</h3>
                  <span class="text-xs text-app-secondary">Homologação no âmbito da Lei 13.352/2016</span>
                </div>
              </div>
              
              <button type="button" (click)="modalNovoParceiro.set(false)" class="text-app-muted hover:text-app-text p-1 rounded-lg">
                <mat-icon>close</mat-icon>
              </button>
            </div>

            <form (ngSubmit)="salvarNovoParceiro()" class="space-y-3.5 text-xs">
              
              <!-- CAMPO CNPJ COM CONSULTA EM TEMPO REAL -->
              <div>
                <label class="font-bold text-app-secondary block mb-1">
                  CNPJ do MEI (com Validação Módulo 11):
                </label>
                <div class="flex gap-2">
                  <input 
                    type="text" 
                    [(ngModel)]="novoCnpj" 
                    (input)="aoDigitarCnpj()"
                    name="novoCnpj" 
                    required 
                    class="input-corporate text-xs font-mono tracking-wide flex-1" 
                    placeholder="00.000.000/0001-00" 
                    maxlength="18"
                    id="input-novo-cnpj"
                  />
                  <button 
                    type="button" 
                    (click)="consultarCnpjFormulario()"
                    [disabled]="cnpjValidator.consultando() || !novoCnpj"
                    class="btn-secondary text-xs flex items-center gap-1 px-3 disabled:opacity-60"
                    title="Consultar dados na Receita Federal">
                    @if (cnpjValidator.consultando()) {
                      <mat-icon class="text-sm animate-spin">sync</mat-icon>
                    } @else {
                      <mat-icon class="text-sm text-blue-500">search</mat-icon>
                      <span>Validar RFB</span>
                    }
                  </button>
                </div>

                <!-- Feedback de Validação do CNPJ -->
                @if (resultadoValidacaoCnpj()) {
                  <div 
                    class="mt-2 p-2.5 rounded-xl border flex items-center gap-2 text-[11px]"
                    [class.bg-emerald-50]="resultadoValidacaoCnpj()!.permiteRepasse"
                    [class.dark:bg-emerald-950/40]="resultadoValidacaoCnpj()!.permiteRepasse"
                    [class.border-emerald-200]="resultadoValidacaoCnpj()!.permiteRepasse"
                    [class.text-emerald-800]="resultadoValidacaoCnpj()!.permiteRepasse"
                    [class.dark:text-emerald-300]="resultadoValidacaoCnpj()!.permiteRepasse"
                    [class.bg-red-50]="!resultadoValidacaoCnpj()!.permiteRepasse"
                    [class.dark:bg-red-950/40]="!resultadoValidacaoCnpj()!.permiteRepasse"
                    [class.border-red-200]="!resultadoValidacaoCnpj()!.permiteRepasse"
                    [class.text-red-800]="!resultadoValidacaoCnpj()!.permiteRepasse"
                    [class.dark:text-red-300]="!resultadoValidacaoCnpj()!.permiteRepasse">
                    <mat-icon class="text-sm">
                      {{ resultadoValidacaoCnpj()!.permiteRepasse ? 'check_circle' : 'cancel' }}
                    </mat-icon>
                    <span class="font-medium">{{ resultadoValidacaoCnpj()!.mensagem }}</span>
                  </div>
                }
              </div>

              <div>
                <label class="font-bold text-app-secondary block mb-1">Nome Completo / Fantasia:</label>
                <input type="text" [(ngModel)]="novoNome" name="novoNome" required class="input-corporate text-xs" placeholder="Ex: Patrícia Alves Hair Design" id="input-novo-nome" />
              </div>

              <div>
                <label class="font-bold text-app-secondary block mb-1">Razão Social MEI:</label>
                <input type="text" [(ngModel)]="novaRazaoSocial" name="novaRazaoSocial" class="input-corporate text-xs" placeholder="Ex: PATRICIA ALVES CABELEIREIRA MEI" />
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="font-bold text-app-secondary block mb-1">CPF do Responsável:</label>
                  <input type="text" [(ngModel)]="novoCpf" name="novoCpf" class="input-corporate text-xs font-mono" placeholder="000.000.000-00" />
                </div>
                <div>
                  <label class="font-bold text-app-secondary block mb-1">Especialidade:</label>
                  <select [(ngModel)]="novaEspecialidade" name="novaEspecialidade" class="input-corporate text-xs">
                    <option value="Cabeleireiro(a)">Cabeleireiro(a)</option>
                    <option value="Barbeiro(a)">Barbeiro(a)</option>
                    <option value="Manicure/Pedicure">Manicure/Pedicure</option>
                    <option value="Esteticista">Esteticista</option>
                    <option value="Maquiador(a)">Maquiador(a)</option>
                    <option value="Depilador(a)">Depilador(a)</option>
                  </select>
                </div>
              </div>

              <div class="grid grid-cols-3 gap-3">
                <div class="col-span-2">
                  <label class="font-bold text-app-secondary block mb-1">Chave PIX para Repasses:</label>
                  <input type="text" [(ngModel)]="novaChavePix" name="novaChavePix" required class="input-corporate text-xs font-mono" placeholder="Chave PIX PJ" />
                </div>
                <div>
                  <label class="font-bold text-app-secondary block mb-1">Tipo Chave:</label>
                  <select [(ngModel)]="novoTipoChavePix" name="novoTipoChavePix" class="input-corporate text-xs">
                    <option value="CNPJ">CNPJ (Recomendado)</option>
                    <option value="CPF">CPF</option>
                    <option value="EMAIL">E-mail</option>
                    <option value="ALEATORIA">Aleatória</option>
                  </select>
                </div>
              </div>

              <!-- Status Inicial do Contrato e Conformidade -->
              <div>
                <label class="font-bold text-app-secondary block mb-1">Status do Contrato de Parceria (Lei 13.352):</label>
                <select [(ngModel)]="novoStatusContrato" name="novoStatusContrato" class="input-corporate text-xs">
                  <option value="HOMOLOGADO_SINDICATO">Homologado no Sindicato (100% Conforme)</option>
                  <option value="ASSINADO_PENDENTE_HOMOLOGACAO">Assinado (Aguardando Homologação)</option>
                  <option value="MINUTA_GERADA">Minuta Gerada (Pendente Assinatura)</option>
                </select>
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="font-bold text-app-secondary block mb-1">Cota Salão (%):</label>
                  <input type="number" [(ngModel)]="novoPercentualSalao" (ngModelChange)="ajustarPercentualMei()" name="novoPercentualSalao" min="10" max="90" class="input-corporate text-xs font-mono" />
                </div>
                <div>
                  <label class="font-bold text-app-secondary block mb-1">Cota MEI (%):</label>
                  <input type="number" [(ngModel)]="novoPercentualMei" name="novoPercentualMei" min="10" max="90" class="input-corporate text-xs font-mono" />
                </div>
              </div>

              <div class="pt-4 flex justify-end gap-2 border-t border-app">
                <button type="button" (click)="modalNovoParceiro.set(false)" class="btn-secondary text-xs">Cancelar</button>
                <button 
                  type="submit" 
                  [disabled]="!novoNome || !novoCnpj"
                  class="btn-primary text-xs disabled:opacity-60 shadow-sm"
                  id="btn-confirmar-cadastro-mei">
                  <mat-icon class="text-sm">verified</mat-icon>
                  Cadastrar e Homologar MEI
                </button>
              </div>
            </form>

          </div>
        </div>
      }

      <!-- ========================================================================= -->
      <!-- 5. MODAL DE EDIÇÃO DO PROFISSIONAL MEI -->
      <!-- ========================================================================= -->
      @if (modalEditarParceiro() && parceiroEmEdicao()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fade-in" id="modal-editar-parceiro">
          <div class="relative w-full max-w-lg bg-surface border border-app rounded-2xl shadow-2xl p-6 overflow-y-auto max-h-[90vh]">
            
            <div class="flex items-center justify-between pb-3 mb-4 border-b border-app">
              <div class="flex items-center gap-2">
                <div class="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-950 text-[#17324d] dark:text-blue-300">
                  <mat-icon class="text-base">edit</mat-icon>
                </div>
                <div>
                  <h3 class="text-base font-bold text-app-text">Editar Profissional Parceiro</h3>
                  <span class="text-xs text-app-secondary">Atualização de dados cadastrais e cotas</span>
                </div>
              </div>
              
              <button type="button" (click)="modalEditarParceiro.set(false)" class="text-app-muted hover:text-app-text p-1 rounded-lg">
                <mat-icon>close</mat-icon>
              </button>
            </div>

            <form (ngSubmit)="salvarEdicaoParceiro()" class="space-y-3.5 text-xs">
              
              <div>
                <label class="font-bold text-app-secondary block mb-1">Nome Fantasia:</label>
                <input type="text" [(ngModel)]="edicaoNome" name="edicaoNome" required class="input-corporate text-xs" />
              </div>

              <div>
                <label class="font-bold text-app-secondary block mb-1">Razão Social MEI:</label>
                <input type="text" [(ngModel)]="edicaoRazaoSocial" name="edicaoRazaoSocial" class="input-corporate text-xs" />
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="font-bold text-app-secondary block mb-1">CNPJ:</label>
                  <input type="text" [(ngModel)]="edicaoCnpj" name="edicaoCnpj" class="input-corporate text-xs font-mono bg-slate-50 dark:bg-slate-800" readonly />
                </div>
                <div>
                  <label class="font-bold text-app-secondary block mb-1">Especialidade:</label>
                  <select [(ngModel)]="edicaoEspecialidade" name="edicaoEspecialidade" class="input-corporate text-xs">
                    <option value="Cabeleireiro(a)">Cabeleireiro(a)</option>
                    <option value="Barbeiro(a)">Barbeiro(a)</option>
                    <option value="Manicure/Pedicure">Manicure/Pedicure</option>
                    <option value="Esteticista">Esteticista</option>
                    <option value="Maquiador(a)">Maquiador(a)</option>
                    <option value="Depilador(a)">Depilador(a)</option>
                  </select>
                </div>
              </div>

              <!-- Status do Contrato (Lei 13.352) -->
              <div>
                <label class="font-bold text-app-secondary block mb-1">Status de Homologação Sindical (Lei 13.352):</label>
                <select [(ngModel)]="edicaoStatusContrato" name="edicaoStatusContrato" class="input-corporate text-xs font-semibold">
                  <option value="HOMOLOGADO_SINDICATO">Homologado no Sindicato (100% Conforme)</option>
                  <option value="ASSINADO_PENDENTE_HOMOLOGACAO">Assinado (Aguardando Homologação)</option>
                  <option value="MINUTA_GERADA">Minuta Gerada (Sem Homologação)</option>
                </select>
              </div>

              <!-- Situação Cadastral Receita Federal -->
              <div>
                <label class="font-bold text-app-secondary block mb-1">Situação MEI na Receita Federal:</label>
                <select [(ngModel)]="edicaoStatusMei" name="edicaoStatusMei" class="input-corporate text-xs">
                  <option value="ATIVO_REGULAR">Ativo e Regular</option>
                  <option value="PENDENCIA_DASN">Com Pendência de DASN</option>
                  <option value="DESENQUADRADO">Desenquadrado MEI</option>
                </select>
              </div>

              <div class="grid grid-cols-3 gap-3">
                <div class="col-span-2">
                  <label class="font-bold text-app-secondary block mb-1">Chave PIX:</label>
                  <input type="text" [(ngModel)]="edicaoChavePix" name="edicaoChavePix" class="input-corporate text-xs font-mono" />
                </div>
                <div>
                  <label class="font-bold text-app-secondary block mb-1">Tipo:</label>
                  <select [(ngModel)]="edicaoTipoChavePix" name="edicaoTipoChavePix" class="input-corporate text-xs">
                    <option value="CNPJ">CNPJ</option>
                    <option value="CPF">CPF</option>
                    <option value="EMAIL">E-mail</option>
                    <option value="ALEATORIA">Aleatória</option>
                  </select>
                </div>
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="font-bold text-app-secondary block mb-1">Cota Salão (%):</label>
                  <input type="number" [(ngModel)]="edicaoPercentualSalao" name="edicaoPercentualSalao" min="10" max="90" class="input-corporate text-xs font-mono" />
                </div>
                <div>
                  <label class="font-bold text-app-secondary block mb-1">Cota MEI (%):</label>
                  <input type="number" [(ngModel)]="edicaoPercentualMei" name="edicaoPercentualMei" min="10" max="90" class="input-corporate text-xs font-mono" />
                </div>
              </div>

              <div class="pt-4 flex justify-end gap-2 border-t border-app">
                <button type="button" (click)="modalEditarParceiro.set(false)" class="btn-secondary text-xs">Cancelar</button>
                <button type="submit" class="btn-primary text-xs shadow-sm">
                  Salvar Alterações
                </button>
              </div>
            </form>

          </div>
        </div>
      }

      <!-- MODAL DE CONSULTA CNPJ -->
      @if (exibirModalCnpj()) {
        <app-modal-consulta-cnpj></app-modal-consulta-cnpj>
      }

    </div>
  `
})
export class ParceirosComponent {
  readonly financeState = inject(FinanceStateService);
  readonly cnpjValidator = inject(CnpjValidatorService);
  readonly csvExportService = inject(CsvExportService);
  readonly confirmDialog = inject(ConfirmDialogService);

  readonly parceiros = computed(() => this.financeState.parceiros());

  // Estado de Visualização
  readonly modoVisualizacao = signal<'lista' | 'grade'>('lista');
  readonly termoBusca = signal<string>('');
  readonly filtroConformidade = signal<string>('TODOS');
  readonly filtroEspecialidade = signal<string>('TODAS');

  // Modais
  readonly modalNovoParceiro = signal<boolean>(false);
  readonly modalEditarParceiro = signal<boolean>(false);
  readonly exibirModalCnpj = signal<boolean>(false);
  readonly parceiroDossie = signal<Parceiro | null>(null);
  readonly parceiroEmEdicao = signal<Parceiro | null>(null);
  readonly resultadoValidacaoCnpj = signal<CnpjConsultaResultado | null>(null);

  readonly modalConsultaCnpjComponent = viewChild(ModalConsultaCnpjComponent);

  // Formulário Novo Parceiro
  novoNome = '';
  novaRazaoSocial = '';
  novoCnpj = '';
  novoCpf = '';
  novaEspecialidade: Parceiro['especialidade'] = 'Cabeleireiro(a)';
  novaChavePix = '';
  novoTipoChavePix: Parceiro['tipo_chave_pix'] = 'CNPJ';
  novoStatusContrato: Parceiro['status_contrato'] = 'HOMOLOGADO_SINDICATO';
  novoPercentualSalao = 45;
  novoPercentualMei = 55;

  // Formulário Edição
  edicaoNome = '';
  edicaoRazaoSocial = '';
  edicaoCnpj = '';
  edicaoEspecialidade: Parceiro['especialidade'] = 'Cabeleireiro(a)';
  edicaoStatusContrato: Parceiro['status_contrato'] = 'HOMOLOGADO_SINDICATO';
  edicaoStatusMei: Parceiro['status_mei'] = 'ATIVO_REGULAR';
  edicaoChavePix = '';
  edicaoTipoChavePix: Parceiro['tipo_chave_pix'] = 'CNPJ';
  edicaoPercentualSalao = 45;
  edicaoPercentualMei = 55;

  // Métricas do Topo
  readonly totalParceiros = computed(() => this.parceiros().length);

  readonly totalHomologados = computed(() => 
    this.parceiros().filter(p => p.status_contrato === 'HOMOLOGADO_SINDICATO').length
  );

  readonly percentualHomologados = computed(() => {
    const total = this.totalParceiros();
    return total > 0 ? Math.round((this.totalHomologados() / total) * 100) : 100;
  });

  readonly totalCnpjsAtivos = computed(() => 
    this.parceiros().filter(p => p.status_mei === 'ATIVO_REGULAR').length
  );

  readonly totalAlertaTeto = computed(() => 
    this.parceiros().filter(p => (p.faturamento_anual_acumulado || 0) >= 64800).length
  );

  // Filtro Dinâmico
  readonly parceirosFiltrados = computed(() => {
    let lista = this.parceiros();
    const busca = this.termoBusca().toLowerCase().trim();
    const conformidade = this.filtroConformidade();
    const especialidade = this.filtroEspecialidade();

    // Filtro texto
    if (busca) {
      lista = lista.filter(p => 
        p.nome_fantasia.toLowerCase().includes(busca) ||
        p.razao_social.toLowerCase().includes(busca) ||
        p.cnpj.includes(busca) ||
        p.especialidade.toLowerCase().includes(busca)
      );
    }

    // Filtro conformidade
    if (conformidade === 'HOMOLOGADOS') {
      lista = lista.filter(p => p.status_contrato === 'HOMOLOGADO_SINDICATO');
    } else if (conformidade === 'PENDENTES_HOMOLOGACAO') {
      lista = lista.filter(p => p.status_contrato === 'ASSINADO_PENDENTE_HOMOLOGACAO' || p.status_contrato === 'MINUTA_GERADA');
    } else if (conformidade === 'ALERTA_TETO') {
      lista = lista.filter(p => (p.faturamento_anual_acumulado || 0) >= 64800);
    } else if (conformidade === 'PENDENCIA_DASN') {
      lista = lista.filter(p => p.status_mei !== 'ATIVO_REGULAR');
    }

    // Filtro especialidade
    if (especialidade !== 'TODAS') {
      lista = lista.filter(p => p.especialidade === especialidade);
    }

    return lista;
  });

  limparFiltros() {
    this.termoBusca.set('');
    this.filtroConformidade.set('TODOS');
    this.filtroEspecialidade.set('TODAS');
  }

  calcularPorcentagemTeto(acumulado: number, teto: number): number {
    if (!teto || teto <= 0) return 0;
    return Math.min(100, Math.round((acumulado / teto) * 100));
  }

  abrirModalNovoParceiro() {
    this.resultadoValidacaoCnpj.set(null);
    this.novoNome = '';
    this.novaRazaoSocial = '';
    this.novoCnpj = '';
    this.novoCpf = '';
    this.novaChavePix = '';
    this.novoTipoChavePix = 'CNPJ';
    this.novoStatusContrato = 'HOMOLOGADO_SINDICATO';
    this.novoPercentualSalao = 45;
    this.novoPercentualMei = 55;
    this.modalNovoParceiro.set(true);
  }

  ajustarPercentualMei() {
    this.novoPercentualMei = Math.max(0, 100 - (this.novoPercentualSalao || 0));
  }

  aoDigitarCnpj() {
    this.novoCnpj = this.cnpjValidator.formatarCnpj(this.novoCnpj);
    if (!this.novaChavePix || this.novaChavePix === this.novoCnpj.slice(0, -1)) {
      this.novaChavePix = this.novoCnpj;
    }
  }

  async consultarCnpjFormulario() {
    if (!this.novoCnpj) return;
    const res = await this.cnpjValidator.consultarCnpjEmTempoReal(this.novoCnpj);
    this.resultadoValidacaoCnpj.set(res);

    if (res.validoReceita && res.razaoSocial) {
      if (!this.novaRazaoSocial) {
        this.novaRazaoSocial = res.razaoSocial;
      }
      if (!this.novoNome) {
        this.novoNome = res.nomeFantasia || res.razaoSocial;
      }
    }
  }

  consultarCnpj(cnpj: string) {
    this.exibirModalCnpj.set(true);
    setTimeout(() => {
      this.modalConsultaCnpjComponent()?.abrirComCnpj(cnpj);
    }, 50);
  }

  abrirConsultaCnpjGeral() {
    this.exibirModalCnpj.set(true);
  }

  simularComoParceiro(id: string) {
    this.financeState.parceiroMobileSimuladoId.set(id);
    this.financeState.modoSimuladorMobile.set(true);
  }

  abrirDossieConformidade(parceiro: Parceiro) {
    this.parceiroDossie.set(parceiro);
  }

  homologarContrato(idParceiro: string) {
    this.financeState.atualizarParceiro(idParceiro, {
      status_contrato: 'HOMOLOGADO_SINDICATO'
    });
    // Atualiza visualização no dossiê se aberto
    const dossieAtual = this.parceiroDossie();
    if (dossieAtual && dossieAtual.id === idParceiro) {
      this.parceiroDossie.set({
        ...dossieAtual,
        status_contrato: 'HOMOLOGADO_SINDICATO'
      });
    }
  }

  abrirModalEditarParceiro(parceiro: Parceiro) {
    this.parceiroEmEdicao.set(parceiro);
    this.edicaoNome = parceiro.nome_fantasia;
    this.edicaoRazaoSocial = parceiro.razao_social;
    this.edicaoCnpj = parceiro.cnpj;
    this.edicaoEspecialidade = parceiro.especialidade;
    this.edicaoStatusContrato = parceiro.status_contrato;
    this.edicaoStatusMei = parceiro.status_mei;
    this.edicaoChavePix = parceiro.chave_pix_padrao;
    this.edicaoTipoChavePix = parceiro.tipo_chave_pix;
    this.edicaoPercentualSalao = parceiro.percentual_padrao_empresa;
    this.edicaoPercentualMei = parceiro.percentual_padrao_parceiro;
    this.modalEditarParceiro.set(true);
  }

  salvarEdicaoParceiro() {
    const atual = this.parceiroEmEdicao();
    if (!atual) return;

    this.financeState.atualizarParceiro(atual.id, {
      nome_fantasia: this.edicaoNome,
      razao_social: this.edicaoRazaoSocial,
      especialidade: this.edicaoEspecialidade,
      status_contrato: this.edicaoStatusContrato,
      status_mei: this.edicaoStatusMei,
      chave_pix_padrao: this.edicaoChavePix,
      tipo_chave_pix: this.edicaoTipoChavePix,
      percentual_padrao_empresa: this.edicaoPercentualSalao,
      percentual_padrao_parceiro: this.edicaoPercentualMei
    });

    // Se o dossiê estiver aberto para o mesmo parceiro, atualiza
    if (this.parceiroDossie()?.id === atual.id) {
      this.parceiroDossie.set({
        ...atual,
        nome_fantasia: this.edicaoNome,
        razao_social: this.edicaoRazaoSocial,
        especialidade: this.edicaoEspecialidade,
        status_contrato: this.edicaoStatusContrato,
        status_mei: this.edicaoStatusMei,
        chave_pix_padrao: this.edicaoChavePix,
        tipo_chave_pix: this.edicaoTipoChavePix,
        percentual_padrao_empresa: this.edicaoPercentualSalao,
        percentual_padrao_parceiro: this.edicaoPercentualMei
      });
    }

    this.modalEditarParceiro.set(false);
    this.parceiroEmEdicao.set(null);
  }

  async excluirParceiro(parceiro: Parceiro) {
    const confirmado = await this.confirmDialog.confirmDestructive(
      'Excluir Profissional Parceiro',
      `Tem certeza que deseja remover o MEI "${parceiro.nome_fantasia || parceiro.razao_social}" (CNPJ ${parceiro.cnpj})? Esta ação removerá o profissional do cadastro ativo do salão.`,
      {
        highlightItem: {
          title: parceiro.nome_fantasia,
          subtitle: `CNPJ: ${parceiro.cnpj}`,
          badge: `${parceiro.percentual_padrao_parceiro}% MEI`
        },
        confirmText: 'Sim, Remover MEI'
      }
    );

    if (confirmado) {
      this.financeState.removerParceiro(parceiro.id);
      if (this.parceiroDossie()?.id === parceiro.id) {
        this.parceiroDossie.set(null);
      }
    }
  }

  salvarNovoParceiro() {
    if (!this.novoNome || !this.novoCnpj) return;

    this.financeState.adicionarParceiro({
      id_empresa: this.financeState.empresaAtiva().id,
      cnpj: this.novoCnpj,
      cpf: this.novoCpf || '000.000.000-00',
      razao_social: this.novaRazaoSocial || `${this.novoNome.toUpperCase()} MEI`,
      nome_fantasia: this.novoNome,
      email: `${this.novoNome.toLowerCase().replace(/\s+/g, '.')}@email.com`,
      telefone: '(11) 98888-0000',
      especialidade: this.novaEspecialidade,
      percentual_padrao_empresa: this.novoPercentualSalao,
      percentual_padrao_parceiro: this.novoPercentualMei,
      status_contrato: this.novoStatusContrato,
      status_mei: 'ATIVO_REGULAR',
      faturamento_anual_acumulado: 0,
      teto_anual_mei: 81000,
      chave_pix_padrao: this.novaChavePix || this.novoCnpj,
      tipo_chave_pix: this.novoTipoChavePix,
      data_inicio_parceria: new Date().toISOString().split('T')[0]
    });

    this.modalNovoParceiro.set(false);
    this.novoNome = '';
    this.novaRazaoSocial = '';
    this.novoCnpj = '';
    this.novaChavePix = '';
    this.resultadoValidacaoCnpj.set(null);
  }

  exportarRelatorioCsv() {
    this.csvExportService.exportarListaConformidadeParceirosCSV();
  }
}
