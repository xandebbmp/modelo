import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { FinanceStateService } from '../../core/services/finance-state.service';
import { PdfExportService } from '../../core/services/pdf-export.service';
import { Parceiro } from '../../core/models/parceiro.model';
import { FechamentoMensal } from '../../core/models/fechamento.model';
import { NotaFiscal } from '../../core/models/nota-fiscal.model';

@Component({
  selector: 'app-painel-parceiros',
  imports: [CommonModule, FormsModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-6 animate-fade-in" id="painel-parceiros-mei-page">
      
      <!-- CABEÇALHO INSTITUCIONAL DO PAINEL MEI -->
      <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-2 flex-wrap">
            <h1 class="text-xl md:text-2xl font-bold text-app-text tracking-tight flex items-center gap-2">
              <mat-icon class="text-[#17324d] dark:text-blue-300">badge</mat-icon> 
              Painel do Profissional Parceiro MEI
            </h1>
            <span class="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-xs font-bold border border-emerald-300 dark:border-emerald-800 flex items-center gap-1">
              <mat-icon class="text-[14px]">verified_user</mat-icon> Lei 13.352/2016
            </span>
          </div>
          <p class="text-xs text-app-secondary mt-1">
            Histórico transparente de repasses financeiros, cotas contratuais e notas fiscais (NFS-e) vinculadas ao CNPJ 
            <strong class="font-mono text-app-text">{{ empresaAtiva().cnpj }}</strong>.
          </p>
        </div>

        <div class="flex items-center gap-2.5 flex-wrap">
          <button 
            type="button" 
            (click)="financeState.modoSimuladorMobile.set(true)" 
            class="btn-secondary text-xs">
            <mat-icon class="text-sm">smartphone</mat-icon> Visão Mobile Parceiro
          </button>

          <button 
            type="button" 
            (click)="exportarExtratoDASN()" 
            class="btn-primary text-xs">
            <mat-icon class="text-sm">download</mat-icon> Exportar Extrato Anual (DASN)
          </button>
        </div>
      </div>

      <!-- SELETOR DE PROFISSIONAL PARCEIRO & FILTROS -->
      <div class="card-corporate p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/70 dark:bg-[#12283e]/70">
        
        <div class="flex items-center gap-3 flex-1">
          <div class="w-10 h-10 rounded-lg bg-[#17324d] text-white flex items-center justify-center font-bold text-base overflow-hidden border border-[#244666] shrink-0">
            @if (parceiroSelecionado()?.foto_avatar; as foto) {
              <img [src]="foto" alt="Avatar" class="w-full h-full object-cover" />
            } @else {
              <mat-icon>person</mat-icon>
            }
          </div>

          <div class="flex-1 min-w-[200px]">
            <label for="select-parceiro-filtro" class="text-[10px] font-bold text-app-secondary uppercase tracking-wider block mb-0.5">
              Profissional Parceiro Selecionado:
            </label>
            <select 
              id="select-parceiro-filtro"
              [ngModel]="idParceiroSelecionado()"
              (ngModelChange)="idParceiroSelecionado.set($event)"
              class="w-full bg-white dark:bg-[#17324d] border border-app rounded-md px-3 py-1.5 text-xs font-semibold text-app-text outline-none focus:border-[#17324d]">
              <option value="TODOS">👥 Visão Consolidada (Todos os {{ parceiros().length }} Parceiros MEI)</option>
              @for (p of parceiros(); track p.id) {
                <option [value]="p.id">
                  {{ p.nome_fantasia || p.razao_social }} ({{ p.especialidade }}) - CNPJ: {{ p.cnpj }}
                </option>
              }
            </select>
          </div>
        </div>

        <!-- Filtro de Ano e Mês -->
        <div class="flex items-center gap-2">
          <div>
            <label for="select-ano-filtro" class="text-[10px] font-bold text-app-secondary uppercase tracking-wider block mb-0.5">Ano:</label>
            <select 
              id="select-ano-filtro"
              [ngModel]="anoFiltro()"
              (ngModelChange)="anoFiltro.set($event)"
              class="bg-white dark:bg-[#17324d] border border-app rounded-md px-2.5 py-1.5 text-xs font-semibold text-app-text outline-none">
              <option [value]="2026">2026</option>
              <option [value]="2025">2025</option>
            </select>
          </div>

          <div>
            <label for="select-mes-filtro" class="text-[10px] font-bold text-app-secondary uppercase tracking-wider block mb-0.5">Mês:</label>
            <select 
              id="select-mes-filtro"
              [ngModel]="mesFiltro()"
              (ngModelChange)="mesFiltro.set($event)"
              class="bg-white dark:bg-[#17324d] border border-app rounded-md px-2.5 py-1.5 text-xs font-semibold text-app-text outline-none">
              <option value="TODOS">Todos os Meses</option>
              <option [value]="8">Agosto / 2026</option>
              <option [value]="7">Julho / 2026</option>
              <option [value]="6">Junho / 2026</option>
              <option [value]="5">Maio / 2026</option>
            </select>
          </div>
        </div>

      </div>

      <!-- CARDS DE MÉTRICAS & INDICADORES DE CONFORMIDADE -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <!-- 1. Total Repasses Líquidos -->
        <div class="card-corporate p-4 flex flex-col justify-between">
          <div class="flex items-center justify-between text-xs text-app-secondary mb-1">
            <span class="font-bold uppercase tracking-wider text-[10px]">Repasses Líquidos Transferidos</span>
            <span class="p-1.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
              <mat-icon class="text-base">payments</mat-icon>
            </span>
          </div>
          <div class="my-1">
            <span class="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400">
              R$ {{ totais().totalRepassesLiquidos | number:'1.2-2' }}
            </span>
            <span class="text-[10px] text-app-muted block">
              100% via PIX com Recibo
            </span>
          </div>
          <div class="text-[11px] text-app-muted pt-2 border-t border-app flex justify-between">
            <span>Produção Bruta:</span>
            <span class="font-bold text-app-text">R$ {{ totais().totalProducaoBruta | number:'1.2-2' }}</span>
          </div>
        </div>

        <!-- 2. Cota Retida Salão -->
        <div class="card-corporate p-4 flex flex-col justify-between">
          <div class="flex items-center justify-between text-xs text-app-secondary mb-1">
            <span class="font-bold uppercase tracking-wider text-[10px]">Cota Retida do Salão</span>
            <span class="p-1.5 rounded-md bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300">
              <mat-icon class="text-base">pie_chart</mat-icon>
            </span>
          </div>
          <div class="my-1">
            <span class="text-2xl font-black font-mono text-app-text">
              R$ {{ totais().totalCotaSalao | number:'1.2-2' }}
            </span>
            <span class="text-[10px] text-app-muted block">
              Base do Simples Nacional (PGDAS-D)
            </span>
          </div>
          <div class="text-[11px] text-app-muted pt-2 border-t border-app flex justify-between">
            <span>Partilha Média:</span>
            <span class="font-bold text-[#b66a3c]">{{ parceiroSelecionado() ? parceiroSelecionado()?.percentual_padrao_empresa + '%' : '45% Salão / 55% MEI' }}</span>
          </div>
        </div>

        <!-- 3. Notas Fiscais MEI Emitidas -->
        <div class="card-corporate p-4 flex flex-col justify-between">
          <div class="flex items-center justify-between text-xs text-app-secondary mb-1">
            <span class="font-bold uppercase tracking-wider text-[10px]">NFS-e MEI Vinculadas</span>
            <span class="p-1.5 rounded-md bg-blue-100 dark:bg-blue-950 text-[#17324d] dark:text-blue-300">
              <mat-icon class="text-base">receipt_long</mat-icon>
            </span>
          </div>
          <div class="my-1">
            <div class="flex items-baseline gap-2">
              <span class="text-2xl font-black font-mono text-app-text">{{ totais().totalNotasEmitidas }}</span>
              <span class="text-xs text-emerald-600 font-bold">Autorizadas ADN</span>
            </div>
            <span class="text-[10px] text-app-muted block">
              Emitidas contra CNPJ {{ empresaAtiva().cnpj }}
            </span>
          </div>
          <div class="text-[11px] text-app-muted pt-2 border-t border-app flex justify-between">
            <span>Pendentes de Emissão:</span>
            <span class="font-bold" [class.text-amber-600]="totais().totalNotasPendentes > 0">
              {{ totais().totalNotasPendentes }} nota(s)
            </span>
          </div>
        </div>

        <!-- 4. Termômetro do Limite Anual MEI -->
        <div class="card-corporate p-4 flex flex-col justify-between">
          <div class="flex items-center justify-between text-xs text-app-secondary mb-1">
            <span class="font-bold uppercase tracking-wider text-[10px]">Termômetro Teto MEI (R$ 81k)</span>
            <mat-icon class="text-base" [class.text-red-500]="totais().percentualTeto >= 80" [class.text-emerald-500]="totais().percentualTeto < 80">speed</mat-icon>
          </div>
          <div class="my-1">
            <div class="flex justify-between items-baseline mb-1">
              <span class="text-xl font-bold font-mono text-app-text">{{ totais().percentualTeto | number:'1.1-1' }}%</span>
              <span class="text-[10px] text-app-muted">Limite: R$ 81.000,00</span>
            </div>
            <div class="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div 
                class="h-full rounded-full transition-all"
                [class.bg-emerald-500]="totais().percentualTeto < 70"
                [class.bg-amber-500]="totais().percentualTeto >= 70 && totais().percentualTeto < 85"
                [class.bg-red-500]="totais().percentualTeto >= 85"
                [style.width.%]="totais().percentualTeto">
              </div>
            </div>
          </div>
          <div class="text-[11px] text-app-muted pt-2 border-t border-app flex justify-between font-mono">
            <span>Saldo Disponível:</span>
            <span class="font-bold text-app-text">R$ {{ (81000 - totais().faturamentoAcumuladoAno) | number:'1.0-0' }}</span>
          </div>
        </div>

      </div>

      <!-- SELETOR DE ABAS DO PAINEL -->
      <div class="border-b border-app flex items-center gap-2 overflow-x-auto">
        <button 
          type="button" 
          (click)="abaAtiva.set('REPASSES')"
          [class.border-[#17324d]]="abaAtiva() === 'REPASSES'"
          [class.dark:border-blue-400]="abaAtiva() === 'REPASSES'"
          [class.text-[#17324d]]="abaAtiva() === 'REPASSES'"
          [class.dark:text-blue-300]="abaAtiva() === 'REPASSES'"
          [class.font-bold]="abaAtiva() === 'REPASSES'"
          class="px-4 py-2.5 border-b-2 border-transparent text-xs text-app-secondary hover:text-app-text transition-all flex items-center gap-1.5 whitespace-nowrap">
          <mat-icon class="text-sm">account_balance_wallet</mat-icon>
          Histórico de Repasses Financeiros ({{ fechamentosFiltrados().length }})
        </button>

        <button 
          type="button" 
          (click)="abaAtiva.set('NOTAS_FISCAIS')"
          [class.border-[#17324d]]="abaAtiva() === 'NOTAS_FISCAIS'"
          [class.dark:border-blue-400]="abaAtiva() === 'NOTAS_FISCAIS'"
          [class.text-[#17324d]]="abaAtiva() === 'NOTAS_FISCAIS'"
          [class.dark:text-blue-300]="abaAtiva() === 'NOTAS_FISCAIS'"
          [class.font-bold]="abaAtiva() === 'NOTAS_FISCAIS'"
          class="px-4 py-2.5 border-b-2 border-transparent text-xs text-app-secondary hover:text-app-text transition-all flex items-center gap-1.5 whitespace-nowrap">
          <mat-icon class="text-sm">receipt</mat-icon>
          Notas Fiscais Vinculadas (NFS-e MEI) ({{ notasFiltradas().length }})
        </button>

        <button 
          type="button" 
          (click)="abaAtiva.set('SERVICOS_PRODUCAO')"
          [class.border-[#17324d]]="abaAtiva() === 'SERVICOS_PRODUCAO'"
          [class.dark:border-blue-400]="abaAtiva() === 'SERVICOS_PRODUCAO'"
          [class.text-[#17324d]]="abaAtiva() === 'SERVICOS_PRODUCAO'"
          [class.dark:text-blue-300]="abaAtiva() === 'SERVICOS_PRODUCAO'"
          [class.font-bold]="abaAtiva() === 'SERVICOS_PRODUCAO'"
          class="px-4 py-2.5 border-b-2 border-transparent text-xs text-app-secondary hover:text-app-text transition-all flex items-center gap-1.5 whitespace-nowrap">
          <mat-icon class="text-sm">content_cut</mat-icon>
          Detalhamento de Serviços & Produtividade
        </button>

        <button 
          type="button" 
          (click)="abaAtiva.set('COMPLIANCE_LEGAL')"
          [class.border-[#17324d]]="abaAtiva() === 'COMPLIANCE_LEGAL'"
          [class.dark:border-blue-400]="abaAtiva() === 'COMPLIANCE_LEGAL'"
          [class.text-[#17324d]]="abaAtiva() === 'COMPLIANCE_LEGAL'"
          [class.dark:text-blue-300]="abaAtiva() === 'COMPLIANCE_LEGAL'"
          [class.font-bold]="abaAtiva() === 'COMPLIANCE_LEGAL'"
          class="px-4 py-2.5 border-b-2 border-transparent text-xs text-app-secondary hover:text-app-text transition-all flex items-center gap-1.5 whitespace-nowrap">
          <mat-icon class="text-sm">gavel</mat-icon>
          Dossiê Jurídico & Contrato Lei 13.352
        </button>
      </div>

      <!-- ABA 1: HISTÓRICO DE REPASSES FINANCEIROS -->
      @if (abaAtiva() === 'REPASSES') {
        <div class="card-corporate overflow-hidden">
          <div class="p-4 border-b border-app flex items-center justify-between gap-2">
            <div>
              <h3 class="text-sm font-bold text-app-text">Extrato de Liquidações e Repasses de Cotas</h3>
              <p class="text-xs text-app-secondary">Detalhamento dos valores brutos, retenção da cota do salão e transferências PIX efetuadas.</p>
            </div>

            <div class="flex items-center gap-2">
              <span class="text-xs text-app-muted">Total no período:</span>
              <span class="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                R$ {{ totais().totalRepassesLiquidos | number:'1.2-2' }}
              </span>
            </div>
          </div>

          <div class="overflow-x-auto">
            <table class="table-corporate text-xs">
              <thead>
                <tr>
                  <th>Competência</th>
                  <th>Profissional Parceiro</th>
                  <th>Produção Bruta</th>
                  <th>Cota Salão</th>
                  <th>Valor Líquido Repassado</th>
                  <th>Status do Repasse</th>
                  <th>NFS-e Vinculada</th>
                  <th class="text-right">Comprovante</th>
                </tr>
              </thead>
              <tbody>
                @for (fech of fechamentosFiltrados(); track fech.id) {
                  <tr>
                    <td>
                      <span class="font-bold text-app-text">{{ fech.mes_referencia | number:'2.0-0' }}/{{ fech.ano_referencia }}</span>
                      <span class="text-[10px] text-app-muted block">Fechamento Mensal</span>
                    </td>
                    <td>
                      <div class="flex items-center gap-2">
                        <div class="w-7 h-7 rounded-md bg-[#17324d] text-white flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden">
                          {{ getParceiroNome(fech.id_parceiro)[0] }}
                        </div>
                        <div>
                          <span class="font-bold text-app-text block">{{ getParceiroNome(fech.id_parceiro) }}</span>
                          <span class="font-mono text-[10px] text-app-muted">{{ getParceiroCnpj(fech.id_parceiro) }}</span>
                        </div>
                      </div>
                    </td>
                    <td class="font-mono text-app-text font-semibold">
                      R$ {{ fech.valor_bruto_producao | number:'1.2-2' }}
                    </td>
                    <td class="font-mono text-[#b66a3c] font-semibold">
                      R$ {{ fech.valor_cota_empresa | number:'1.2-2' }}
                    </td>
                    <td class="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      R$ {{ fech.valor_liquido_nota | number:'1.2-2' }}
                    </td>
                    <td>
                      @if (fech.status === 'PAGO' || fech.status === 'NOTA_EMITIDA') {
                        <span class="status-badge status-badge-success text-[10px]">
                          {{ fech.status === 'PAGO' ? 'Liquidado PIX' : 'NFS-e Emitida' }}
                        </span>
                      } @else {
                        <span class="status-badge status-badge-warning text-[10px]">
                          Aguardando Nota MEI
                        </span>
                      }
                    </td>
                    <td>
                      @if (fech.numero_nota_mei) {
                        <div class="font-mono text-[11px] text-app-text font-bold flex items-center gap-1">
                          <mat-icon class="text-xs text-blue-500">receipt</mat-icon>
                          NFS-e {{ fech.numero_nota_mei }}
                        </div>
                      } @else {
                        <span class="text-[10px] text-amber-600 font-semibold flex items-center gap-1">
                          <mat-icon class="text-xs">hourglass_empty</mat-icon> Pendente Emissão
                        </span>
                      }
                    </td>
                    <td class="text-right">
                      <div class="flex items-center justify-end gap-1.5">
                        <button 
                          type="button" 
                          (click)="baixarPdfLiquidoFechamento(fech)"
                          class="p-1.5 rounded-lg border border-emerald-300 dark:border-emerald-700 bg-emerald-50/50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 transition-all"
                          title="Baixar Comprovante Focado no Líquido (Normas de Transparência da Lei 13.352/2016)">
                          <mat-icon class="text-xs text-emerald-600 dark:text-emerald-400">verified</mat-icon>
                        </button>
                        <button 
                          type="button" 
                          (click)="abrirModalDetalheFechamento(fech)"
                          class="btn-secondary py-1 px-2 text-xs">
                          <mat-icon class="text-xs">visibility</mat-icon> Detalhes
                        </button>
                      </div>
                    </td>
                  </tr>
                }
                @if (fechamentosFiltrados().length === 0) {
                  <tr>
                    <td colspan="8" class="text-center py-8 text-app-muted">
                      Nenhum fechamento ou repasse encontrado para os filtros selecionados.
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }

      <!-- ABA 2: NOTAS FISCAIS VINCULADAS (NFS-e MEI) -->
      @if (abaAtiva() === 'NOTAS_FISCAIS') {
        <div class="card-corporate overflow-hidden">
          <div class="p-4 border-b border-app flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 class="text-sm font-bold text-app-text flex items-center gap-1.5">
                <mat-icon class="text-blue-500 text-base">verified</mat-icon>
                Espelho das NFS-e Emitidas pelos Parceiros MEI
              </h3>
              <p class="text-xs text-app-secondary">
                Documentos fiscais emitidos contra o CNPJ <strong class="font-mono">{{ empresaAtiva().cnpj }}</strong> que respaldam a dedução de base no PGDAS-D.
              </p>
            </div>

            <div class="flex items-center gap-2">
              <button 
                type="button"
                (click)="financeState.modoSimuladorMobile.set(true)"
                class="btn-primary py-1.5 px-3 text-xs">
                <mat-icon class="text-xs">add_task</mat-icon> Emitir NFS-e 1-Clique
              </button>
            </div>
          </div>

          <div class="overflow-x-auto">
            <table class="table-corporate text-xs">
              <thead>
                <tr>
                  <th>NFS-e / Chave ADN</th>
                  <th>Prestador MEI</th>
                  <th>Tomador (Salão)</th>
                  <th>Data Emissão</th>
                  <th>Valor do Serviço</th>
                  <th>ISS Retido</th>
                  <th>Status Receita</th>
                  <th class="text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                @for (nota of notasFiltradas(); track nota.id) {
                  <tr>
                    <td>
                      <div class="font-bold text-app-text flex items-center gap-1.5">
                        <mat-icon class="text-xs text-emerald-600">check_circle</mat-icon>
                        NFS-e nº {{ nota.numero_nfse }}
                      </div>
                      <span class="font-mono text-[10px] text-app-muted truncate max-w-[200px] block" [title]="nota.chave_acesso">
                        Chave: {{ nota.chave_acesso }}
                      </span>
                    </td>
                    <td>
                      <div class="font-bold text-app-text">{{ nota.razao_social_prestador }}</div>
                      <span class="font-mono text-[10px] text-app-muted">CNPJ: {{ nota.cnpj_prestador }}</span>
                    </td>
                    <td>
                      <div class="font-semibold text-app-text">{{ nota.razao_social_tomador }}</div>
                      <span class="font-mono text-[10px] text-app-muted">CNPJ: {{ nota.cnpj_tomador }}</span>
                    </td>
                    <td class="font-mono text-app-secondary">
                      {{ nota.data_emissao | date:'dd/MM/yyyy HH:mm' }}
                    </td>
                    <td class="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      R$ {{ nota.valor_total | number:'1.2-2' }}
                    </td>
                    <td class="font-mono text-app-muted">
                      {{ nota.valor_iss > 0 ? 'R$ ' + (nota.valor_iss | number:'1.2-2') : 'Isento (MEI)' }}
                    </td>
                    <td>
                      <span class="status-badge status-badge-success text-[10px]">
                        {{ nota.status }}
                      </span>
                    </td>
                    <td class="text-right">
                      <button 
                        type="button" 
                        (click)="abrirEspelhoNfse(nota)"
                        class="btn-secondary py-1 px-2.5 text-xs">
                        <mat-icon class="text-xs">description</mat-icon> Espelho DANFSE
                      </button>
                    </td>
                  </tr>
                }
                @if (notasFiltradas().length === 0) {
                  <tr>
                    <td colspan="8" class="text-center py-8 text-app-muted">
                      Nenhuma nota fiscal MEI vinculada encontrada para os critérios selecionados.
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }

      <!-- ABA 3: DETALHAMENTO DE SERVIÇOS & PRODUTIVIDADE -->
      @if (abaAtiva() === 'SERVICOS_PRODUCAO') {
        <div class="space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            <div class="card-corporate p-4 md:col-span-2">
              <h3 class="text-sm font-bold text-app-text mb-2 flex items-center gap-2">
                <mat-icon class="text-[#17324d] dark:text-blue-300">pie_chart</mat-icon>
                Serviços Mais Realizados pelo Profissional no Mês
              </h3>
              <p class="text-xs text-app-secondary mb-4">
                Composição das comandas que originaram o faturamento bruto e o repasse líquido.
              </p>

              <div class="space-y-3">
                <div class="p-3 bg-slate-50 dark:bg-[#12283e] rounded-lg border border-app flex items-center justify-between">
                  <div class="flex items-center gap-3">
                    <span class="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300 flex items-center justify-center font-bold text-xs">
                      1
                    </span>
                    <div>
                      <span class="font-bold text-xs text-app-text block">Mechas & Luzes Criativas</span>
                      <span class="text-[10px] text-app-muted">38 atendimentos realizados</span>
                    </div>
                  </div>
                  <div class="text-right font-mono">
                    <span class="font-bold text-xs text-app-text block">R$ 15.200,00</span>
                    <span class="text-[10px] text-emerald-600 font-semibold">Repasse: R$ 8.360,00</span>
                  </div>
                </div>

                <div class="p-3 bg-slate-50 dark:bg-[#12283e] rounded-lg border border-app flex items-center justify-between">
                  <div class="flex items-center gap-3">
                    <span class="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-300 flex items-center justify-center font-bold text-xs">
                      2
                    </span>
                    <div>
                      <span class="font-bold text-xs text-app-text block">Corte Feminino com Visagismo</span>
                      <span class="text-[10px] text-app-muted">54 atendimentos realizados</span>
                    </div>
                  </div>
                  <div class="text-right font-mono">
                    <span class="font-bold text-xs text-app-text block">R$ 8.640,00</span>
                    <span class="text-[10px] text-emerald-600 font-semibold">Repasse: R$ 4.752,00</span>
                  </div>
                </div>

                <div class="p-3 bg-slate-50 dark:bg-[#12283e] rounded-lg border border-app flex items-center justify-between">
                  <div class="flex items-center gap-3">
                    <span class="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-300 flex items-center justify-center font-bold text-xs">
                      3
                    </span>
                    <div>
                      <span class="font-bold text-xs text-app-text block">Tratamentos & Cronograma Capilar</span>
                      <span class="text-[10px] text-app-muted">26 atendimentos realizados</span>
                    </div>
                  </div>
                  <div class="text-right font-mono">
                    <span class="font-bold text-xs text-app-text block">R$ 4.940,00</span>
                    <span class="text-[10px] text-emerald-600 font-semibold">Repasse: R$ 2.717,00</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Card de Ticket Médio -->
            <div class="card-corporate p-4 flex flex-col justify-between">
              <div>
                <h3 class="text-sm font-bold text-app-text mb-2">Indicadores de Produtividade</h3>
                
                <div class="space-y-3 text-xs pt-2">
                  <div class="flex justify-between py-2 border-b border-app">
                    <span class="text-app-secondary">Total de Clientes Atendidos:</span>
                    <span class="font-bold text-app-text">118 clientes</span>
                  </div>
                  <div class="flex justify-between py-2 border-b border-app">
                    <span class="text-app-secondary">Ticket Médio por Atendimento:</span>
                    <span class="font-bold font-mono text-app-text">R$ 243,90</span>
                  </div>
                  <div class="flex justify-between py-2 border-b border-app">
                    <span class="text-app-secondary">Repasse Médio por Dia:</span>
                    <span class="font-bold font-mono text-emerald-600">R$ 674,00</span>
                  </div>
                  <div class="flex justify-between py-2">
                    <span class="text-app-secondary">Taxa de Fidelização:</span>
                    <span class="font-bold text-[#17324d] dark:text-blue-300">84.2%</span>
                  </div>
                </div>
              </div>

              <div class="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg border border-emerald-200 dark:border-emerald-900 text-xs text-emerald-800 dark:text-emerald-300">
                <span class="font-bold block mb-0.5">Parceria em Alta Performance:</span>
                Profissional com 100% de pontualidade na emissão de NFS-e e regularidade no teto do MEI.
              </div>
            </div>

          </div>
        </div>
      }

      <!-- ABA 4: DOSSIÊ JURÍDICO & COMPLIANCE LEI 13.352/2016 -->
      @if (abaAtiva() === 'COMPLIANCE_LEGAL') {
        <div class="card-corporate p-5 space-y-6">
          
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-app">
            <div>
              <h3 class="text-base font-bold text-app-text flex items-center gap-2">
                <mat-icon class="text-emerald-600">verified</mat-icon> 
                Blindagem Jurídica & Tributária da Parceria
              </h3>
              <p class="text-xs text-app-secondary mt-0.5">
                Validação das cláusulas obrigatórias exigidas pela <strong>Lei Federal nº 13.352/2016</strong> e Resolução CGSN nº 140/2018.
              </p>
            </div>

            <span class="status-badge status-badge-success text-xs font-bold">
              Contrato Homologado no Sindicato
            </span>
          </div>

          <!-- Checklist de Conformidade -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            
            <div class="p-3 rounded-lg border border-app bg-slate-50 dark:bg-[#12283e] flex items-start gap-2.5">
              <mat-icon class="text-emerald-600 text-sm mt-0.5">check_circle</mat-icon>
              <div>
                <span class="font-bold text-app-text block">Segregação de Receitas no PGDAS-D</span>
                <p class="text-app-secondary mt-0.5">
                  A base tributável do salão no Simples Nacional é unicamente a Cota-Parte do Salão, deduzindo 100% da cota repassada ao MEI.
                </p>
              </div>
            </div>

            <div class="p-3 rounded-lg border border-app bg-slate-50 dark:bg-[#12283e] flex items-start gap-2.5">
              <mat-icon class="text-emerald-600 text-sm mt-0.5">check_circle</mat-icon>
              <div>
                <span class="font-bold text-app-text block">Ausência de Vínculo Empregatício (CLT)</span>
                <p class="text-app-secondary mt-0.5">
                  Autonomia técnica e horários flexíveis conforme o contrato padrão homologado na entidade de classe.
                </p>
              </div>
            </div>

            <div class="p-3 rounded-lg border border-app bg-slate-50 dark:bg-[#12283e] flex items-start gap-2.5">
              <mat-icon class="text-emerald-600 text-sm mt-0.5">check_circle</mat-icon>
              <div>
                <span class="font-bold text-app-text block">Emissão Regular de NFS-e MEI</span>
                <p class="text-app-secondary mt-0.5">
                  Comprovação fiscal eletrônica de cada repasse mensal através do Emissor Nacional ADN.
                </p>
              </div>
            </div>

            <div class="p-3 rounded-lg border border-app bg-slate-50 dark:bg-[#12283e] flex items-start gap-2.5">
              <mat-icon class="text-emerald-600 text-sm mt-0.5">check_circle</mat-icon>
              <div>
                <span class="font-bold text-app-text block">Controle Rigoroso do Teto Anual (R$ 81k)</span>
                <p class="text-app-secondary mt-0.5">
                  Monitoramento em tempo real do faturamento acumulado para evitar desenquadramento fiscal involuntário do parceiro.
                </p>
              </div>
            </div>

          </div>

          <!-- Documentos e Anexos -->
          <div class="pt-4 border-t border-app">
            <h4 class="text-xs font-bold text-app-text mb-3">Documentos Anexados ao Prontuário do Parceiro:</h4>
            
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div class="p-3 bg-white dark:bg-[#17324d] rounded-lg border border-app flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <mat-icon class="text-red-500 text-base">picture_as_pdf</mat-icon>
                  <div>
                    <span class="text-xs font-bold text-app-text block">Contrato_Parceria_Homologado.pdf</span>
                    <span class="text-[10px] text-app-muted">Assinado digitalmente</span>
                  </div>
                </div>
                <button type="button" class="text-xs text-blue-500 hover:underline">Ver</button>
              </div>

              <div class="p-3 bg-white dark:bg-[#17324d] rounded-lg border border-app flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <mat-icon class="text-red-500 text-base">picture_as_pdf</mat-icon>
                  <div>
                    <span class="text-xs font-bold text-app-text block">CCMEI_Certificado_MEI.pdf</span>
                    <span class="text-[10px] text-app-muted">Situação: Ativo</span>
                  </div>
                </div>
                <button type="button" class="text-xs text-blue-500 hover:underline">Ver</button>
              </div>

              <div class="p-3 bg-white dark:bg-[#17324d] rounded-lg border border-app flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <mat-icon class="text-emerald-500 text-base">verified</mat-icon>
                  <div>
                    <span class="text-xs font-bold text-app-text block">Certidao_Negativa_Tributos.pdf</span>
                    <span class="text-[10px] text-app-muted">Válida até 12/2026</span>
                  </div>
                </div>
                <button type="button" class="text-xs text-blue-500 hover:underline">Ver</button>
              </div>
            </div>
          </div>

        </div>
      }

      <!-- MODAL: ESPELHO DA NOTA FISCAL (DANFSE) -->
      @if (modalNfseAberta(); as nota) {
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fade-in" id="modal-espelho-danfse">
          <div class="relative w-full max-w-2xl bg-surface border border-app rounded-xl shadow-2xl p-6 overflow-y-auto max-h-[90vh]">
            
            <div class="flex items-center justify-between pb-4 mb-4 border-b border-app">
              <div class="flex items-center gap-2.5">
                <span class="p-2 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 rounded-lg flex items-center">
                  <mat-icon>receipt</mat-icon>
                </span>
                <div>
                  <h3 class="text-base font-bold text-app-text">Documento Auxiliar da NFS-e (DANFSE)</h3>
                  <p class="text-xs text-app-secondary">Padrão Nacional de Nota Fiscal de Serviços Eletrônica</p>
                </div>
              </div>
              <button type="button" (click)="modalNfseAberta.set(null)" class="text-app-muted hover:text-app-text">
                <mat-icon>close</mat-icon>
              </button>
            </div>

            <!-- Corpo da NFS-e com layout oficial -->
            <div class="space-y-4 text-xs font-sans">
              
              <!-- Dados do Prestador -->
              <div class="p-3 bg-slate-50 dark:bg-[#12283e] rounded-lg border border-app">
                <span class="font-bold text-[10px] uppercase text-app-muted block mb-1">PRESTADOR DE SERVIÇOS (MEI)</span>
                <div class="font-bold text-app-text text-sm">{{ nota.razao_social_prestador }}</div>
                <div class="font-mono text-app-secondary">CNPJ: {{ nota.cnpj_prestador }}</div>
              </div>

              <!-- Dados do Tomador / Salão-Parceiro -->
              <div class="p-3 bg-slate-50 dark:bg-[#12283e] rounded-lg border border-app">
                <span class="font-bold text-[10px] uppercase text-app-muted block mb-1">TOMADOR DE SERVIÇOS / INTERMEDIADOR</span>
                <div class="font-bold text-app-text text-sm">{{ nota.razao_social_tomador }}</div>
                <div class="font-mono text-app-secondary">CNPJ: {{ nota.cnpj_tomador }}</div>
              </div>

              <!-- Discriminação dos Serviços -->
              <div class="p-3 bg-slate-50 dark:bg-[#12283e] rounded-lg border border-app">
                <span class="font-bold text-[10px] uppercase text-app-muted block mb-1">DISCRIMINAÇÃO DOS SERVIÇOS EXECUTADOS</span>
                <p class="text-app-text leading-relaxed">{{ nota.discriminacao_servicos }}</p>
                <div class="mt-2 pt-2 border-t border-app font-mono text-[11px] text-app-muted">
                  CNAE: 9602-5/01 (Cabeleireiros, manicure e pedicure) • LC 116/2003: 14.01
                </div>
              </div>

              <!-- Valores e Tributos -->
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div class="p-2.5 bg-slate-50 dark:bg-[#12283e] rounded-lg border border-app text-center">
                  <span class="text-[10px] text-app-muted block">VALOR DOS SERVIÇOS</span>
                  <span class="font-mono font-bold text-sm text-emerald-600 dark:text-emerald-400">
                    R$ {{ nota.valor_total | number:'1.2-2' }}
                  </span>
                </div>

                <div class="p-2.5 bg-slate-50 dark:bg-[#12283e] rounded-lg border border-app text-center">
                  <span class="text-[10px] text-app-muted block">ALÍQUOTA ISS</span>
                  <span class="font-mono font-bold text-sm text-app-text">0,00% (MEI)</span>
                </div>

                <div class="p-2.5 bg-slate-50 dark:bg-[#12283e] rounded-lg border border-app text-center">
                  <span class="text-[10px] text-app-muted block">ISS RETIDO</span>
                  <span class="font-mono font-bold text-sm text-app-text">R$ 0,00</span>
                </div>

                <div class="p-2.5 bg-slate-50 dark:bg-[#12283e] rounded-lg border border-app text-center">
                  <span class="text-[10px] text-app-muted block">VALOR LÍQUIDO</span>
                  <span class="font-mono font-bold text-sm text-emerald-600 dark:text-emerald-400">
                    R$ {{ nota.valor_total | number:'1.2-2' }}
                  </span>
                </div>
              </div>

              <div class="p-2.5 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 rounded-lg text-center font-mono text-[10px] text-emerald-800 dark:text-emerald-300">
                CHAVE DE AUTENTICAÇÃO: {{ nota.chave_acesso }}
              </div>

            </div>

            <div class="mt-6 flex items-center justify-end gap-2 pt-3 border-t border-app">
              <button 
                type="button" 
                (click)="modalNfseAberta.set(null)" 
                class="btn-secondary text-xs">
                Fechar
              </button>
              <button 
                type="button" 
                (click)="imprimirDanfse()" 
                class="btn-primary text-xs flex items-center gap-1">
                <mat-icon class="text-xs">print</mat-icon> Imprimir DANFSE
              </button>
            </div>

          </div>
        </div>
      }

      <!-- MODAL: DETALHES DO FECHAMENTO MENSAL -->
      @if (modalFechamentoAberto(); as fech) {
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fade-in" id="modal-detalhe-fechamento">
          <div class="relative w-full max-w-xl bg-surface border border-app rounded-xl shadow-2xl p-6 overflow-y-auto max-h-[90vh]">
            
            <div class="flex items-center justify-between pb-4 mb-4 border-b border-app">
              <div>
                <h3 class="text-base font-bold text-app-text">Detalhes do Repasse & Comprovante PIX</h3>
                <p class="text-xs text-app-secondary">Competência: {{ fech.mes_referencia }}/{{ fech.ano_referencia }}</p>
              </div>
              <button type="button" (click)="modalFechamentoAberto.set(null)" class="text-app-muted hover:text-app-text">
                <mat-icon>close</mat-icon>
              </button>
            </div>

            <div class="space-y-4 text-xs">
              <div class="grid grid-cols-2 gap-3">
                <div class="p-3 bg-slate-50 dark:bg-[#12283e] rounded-lg border border-app">
                  <span class="text-[10px] text-app-muted uppercase block">Produção Bruta</span>
                  <span class="text-sm font-bold font-mono text-app-text">R$ {{ fech.valor_bruto_producao | number:'1.2-2' }}</span>
                </div>

                <div class="p-3 bg-slate-50 dark:bg-[#12283e] rounded-lg border border-app">
                  <span class="text-[10px] text-app-muted uppercase block">Cota do Salão Retida</span>
                  <span class="text-sm font-bold font-mono text-[#b66a3c]">R$ {{ fech.valor_cota_empresa | number:'1.2-2' }}</span>
                </div>
              </div>

              <div class="p-4 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg border border-emerald-200 dark:border-emerald-900 flex items-center justify-between">
                <div>
                  <span class="text-[10px] text-emerald-800 dark:text-emerald-300 uppercase font-bold block">Valor Líquido Transferido ao MEI</span>
                  <span class="text-xl font-bold font-mono text-emerald-700 dark:text-emerald-400">R$ {{ fech.valor_liquido_nota | number:'1.2-2' }}</span>
                </div>
                <span class="status-badge status-badge-success text-xs font-bold">PIX Confirmado</span>
              </div>

              <div class="p-3 bg-slate-50 dark:bg-[#12283e] rounded-lg border border-app space-y-1.5 font-mono text-[11px]">
                <div class="flex justify-between text-app-secondary">
                  <span>Chave PIX Destino:</span>
                  <span class="font-bold text-app-text">{{ fech.chave_pix_pagamento || 'CNPJ do MEI' }}</span>
                </div>
                <div class="flex justify-between text-app-secondary">
                  <span>Data da Transferência:</span>
                  <span class="text-app-text">{{ fech.data_pagamento_efetuado || '05/08/2026 14:32' }}</span>
                </div>
                <div class="flex justify-between text-app-secondary">
                  <span>ID da Transação E2E:</span>
                  <span class="text-app-text text-[10px]">E12345678202608051432ABC999</span>
                </div>
              </div>
            </div>

            <div class="mt-6 flex justify-end gap-2 no-print flex-wrap">
              <button 
                type="button" 
                (click)="baixarPdfLiquidoFechamento(fech)" 
                class="btn-secondary text-xs border-emerald-300 dark:border-emerald-700 bg-emerald-50/50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                <mat-icon class="text-xs text-emerald-600 dark:text-emerald-400">verified</mat-icon> PDF Líquido (Lei 13.352)
              </button>
              <button 
                type="button" 
                (click)="baixarPdfAnaliticoFechamento(fech)" 
                class="btn-secondary text-xs flex items-center gap-1">
                <mat-icon class="text-xs text-red-500">picture_as_pdf</mat-icon> PDF Analítico
              </button>
              <button 
                type="button" 
                (click)="imprimirDanfse()" 
                class="btn-secondary text-xs flex items-center gap-1">
                <mat-icon class="text-xs">print</mat-icon> Imprimir
              </button>
              <button type="button" (click)="modalFechamentoAberto.set(null)" class="btn-primary text-xs">
                Concluído
              </button>
            </div>

          </div>
        </div>
      }

    </div>
  `
})
export class PainelParceirosComponent {
  readonly financeState = inject(FinanceStateService);
  readonly pdfExportService = inject(PdfExportService);

  readonly empresaAtiva = computed(() => this.financeState.empresaAtiva());
  readonly parceiros = computed(() => this.financeState.parceirosEmpresaAtiva());
  readonly fechamentos = computed(() => this.financeState.fechamentosEmpresaAtiva());
  readonly notasFiscais = computed(() => this.financeState.notasEmpresaAtiva());

  // Filtros e estados reativos
  readonly idParceiroSelecionado = signal<string>('TODOS');
  readonly anoFiltro = signal<number>(2026);
  readonly mesFiltro = signal<string | number>('TODOS');
  readonly abaAtiva = signal<'REPASSES' | 'NOTAS_FISCAIS' | 'SERVICOS_PRODUCAO' | 'COMPLIANCE_LEGAL'>('REPASSES');

  readonly modalNfseAberta = signal<NotaFiscal | null>(null);
  readonly modalFechamentoAberto = signal<FechamentoMensal | null>(null);

  readonly parceiroSelecionado = computed<Parceiro | null>(() => {
    const id = this.idParceiroSelecionado();
    if (id === 'TODOS') return null;
    return this.parceiros().find(p => p.id === id) || null;
  });

  readonly fechamentosFiltrados = computed<FechamentoMensal[]>(() => {
    const todos = this.fechamentos();
    const idParceiro = this.idParceiroSelecionado();
    const ano = this.anoFiltro();
    const mes = this.mesFiltro();

    return todos.filter(f => {
      const matchParceiro = idParceiro === 'TODOS' || f.id_parceiro === idParceiro;
      const matchAno = f.ano_referencia === ano;
      const matchMes = mes === 'TODOS' || f.mes_referencia === Number(mes);
      return matchParceiro && matchAno && matchMes;
    });
  });

  readonly notasFiltradas = computed<NotaFiscal[]>(() => {
    const todas = this.notasFiscais();
    const idParceiro = this.idParceiroSelecionado();

    // Filtra notas emitidas pelo parceiro contra a empresa
    return todas.filter(n => {
      const matchTipo = n.tipo_operacao === 'PARCEIRO_PARA_EMPRESA';
      const matchParceiro = idParceiro === 'TODOS' || n.id_parceiro === idParceiro;
      return matchTipo && matchParceiro;
    });
  });

  readonly totais = computed(() => {
    const fechamentos = this.fechamentosFiltrados();
    const parceiro = this.parceiroSelecionado();

    const totalProducaoBruta = fechamentos.reduce((acc, f) => acc + f.valor_bruto_producao, 0);
    const totalCotaSalao = fechamentos.reduce((acc, f) => acc + f.valor_cota_empresa, 0);
    const totalRepassesLiquidos = fechamentos.reduce((acc, f) => acc + f.valor_liquido_nota, 0);

    const totalNotasEmitidas = fechamentos.filter(f => f.status === 'PAGO' || f.status === 'NOTA_EMITIDA').length;
    const totalNotasPendentes = fechamentos.filter(f => f.status === 'PENDENTE_EMISSAO' || f.status === 'DISPONIVEL_CONFERENCIA').length;

    const faturamentoAcumuladoAno = parceiro 
      ? parceiro.faturamento_anual_acumulado 
      : this.parceiros().reduce((acc, p) => acc + p.faturamento_anual_acumulado, 0) / Math.max(1, this.parceiros().length);

    const percentualTeto = (faturamentoAcumuladoAno / 81000) * 100;

    return {
      totalProducaoBruta,
      totalCotaSalao,
      totalRepassesLiquidos,
      totalNotasEmitidas,
      totalNotasPendentes,
      faturamentoAcumuladoAno,
      percentualTeto
    };
  });

  getParceiroNome(idParceiro: string): string {
    const p = this.parceiros().find(item => item.id === idParceiro);
    return p?.nome_fantasia || p?.razao_social || 'Profissional MEI';
  }

  getParceiroCnpj(idParceiro: string): string {
    const p = this.parceiros().find(item => item.id === idParceiro);
    return p?.cnpj || '';
  }

  abrirEspelhoNfse(nota: NotaFiscal) {
    this.modalNfseAberta.set(nota);
  }

  abrirModalDetalheFechamento(fech: FechamentoMensal) {
    this.modalFechamentoAberto.set(fech);
  }

  exportarExtratoDASN() {
    const parceiro = this.parceiroSelecionado();
    const nome = parceiro ? parceiro.nome_fantasia : 'Consolidado_Parceiros';
    const fechamentos = this.fechamentosFiltrados();

    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'Competencia,Parceiro,CNPJ_MEI,Producao_Bruta,Cota_Salao,Repasse_Liquido,Status,Numero_NFSe\n';

    fechamentos.forEach(f => {
      csvContent += `${f.mes_referencia}/${f.ano_referencia},"${this.getParceiroNome(f.id_parceiro)}",${this.getParceiroCnpj(f.id_parceiro)},${f.valor_bruto_producao},${f.valor_cota_empresa},${f.valor_liquido_nota},${f.status},${f.numero_nota_mei || 'PENDENTE'}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Extrato_Repasses_MEI_${nome}_2026.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  imprimirDanfse() {
    if (typeof window !== 'undefined') {
      window.print();
    }
  }

  baixarPdfLiquidoFechamento(fech: FechamentoMensal) {
    try {
      this.pdfExportService.exportarComprovanteLiquidoFechamentoPDF(fech);
    } catch (err) {
      console.error('Erro ao exportar comprovante líquido:', err);
    }
  }

  baixarPdfAnaliticoFechamento(fech: FechamentoMensal) {
    try {
      this.pdfExportService.exportarComprovanteFechamentoMensalPDF(fech);
    } catch (err) {
      console.error('Erro ao exportar comprovante analítico:', err);
    }
  }
}
