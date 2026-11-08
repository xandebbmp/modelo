import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { RelatorioRepasseService } from '../../core/services/relatorio-repasse.service';
import { FinanceStateService } from '../../core/services/finance-state.service';
import { PdfExportService } from '../../core/services/pdf-export.service';
import { CsvExportService } from '../../core/services/csv-export.service';
import { XmlExportService } from '../../core/services/xml-export.service';
import { ConfirmDialogService } from '../../core/services/confirm-dialog.service';
import {
  FormaPagamentoVenda,
  OperadoraCartao,
  RegraAbsorcaoTaxa,
  ResumoRepasseParceiro,
  VendaItemServico
} from '../../core/models/relatorio-repasse.model';

@Component({
  selector: 'app-relatorio-repasse',
  imports: [CommonModule, FormsModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-6 animate-fade-in" id="relatorio-repasse-page">
      
      <!-- CABEÇALHO DO RELATÓRIO DE REPASSE -->
      <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-2">
            <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-100 dark:bg-blue-950 text-[#17324d] dark:text-blue-300 border border-blue-200 dark:border-blue-800">
              Lei 13.352/2016 • Salão-Parceiro
            </span>
            <span class="text-xs text-app-muted font-medium">Competência: Agosto/2026</span>
          </div>
          <h1 class="text-xl md:text-2xl font-bold text-app-text tracking-tight flex items-center gap-2 mt-1">
            <mat-icon class="text-[#17324d] dark:text-blue-300">payments</mat-icon>
            Relatório de Repasse & Taxas de Operadora
          </h1>
          <p class="text-xs text-app-secondary mt-0.5">
            Processamento de vendas brutas, apuração das taxas de maquininha e insumos, retenção da cota do salão e cálculo do valor líquido a transferir aos parceiros MEI.
          </p>
        </div>

        <!-- AÇÕES PRINCIPAIS -->
        <div class="flex items-center gap-2 flex-wrap">
          <button 
            type="button" 
            (click)="exportarXmlRepasses()" 
            class="btn-secondary text-xs font-bold text-amber-800 dark:text-amber-200 border-amber-300 dark:border-amber-800 hover:bg-amber-50 dark:hover:bg-amber-950/40 flex items-center gap-1.5 shadow-xs"
            id="btn-exportar-xml-relatorio"
            title="Exportar dados de integração e fechamento em formato XML para contabilidade">
            <mat-icon class="text-sm text-amber-600 dark:text-amber-400">code</mat-icon>
            <span>Exportar XML</span>
          </button>

          <button 
            type="button" 
            (click)="exportarCsvRepasses()" 
            class="btn-secondary text-xs font-bold text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 flex items-center gap-1.5 shadow-xs"
            id="btn-exportar-csv-relatorio"
            title="Exportar dados do relatório em CSV para Excel">
            <mat-icon class="text-sm text-emerald-600 dark:text-emerald-400">table_view</mat-icon>
            <span>Exportar CSV</span>
          </button>

          <button 
            type="button" 
            (click)="abrirModalConfigTaxas.set(true)" 
            class="btn-secondary text-xs"
            id="btn-config-taxas">
            <mat-icon class="text-sm">tune</mat-icon> Configurar Taxas ({{ repasseService.configTaxas().operadora_padrao }})
          </button>

          <button 
            type="button" 
            (click)="abrirModalNovaVenda.set(true)" 
            class="btn-primary text-xs"
            id="btn-nova-venda-repasse">
            <mat-icon class="text-sm">add_circle</mat-icon> Lançar Venda/Comanda
          </button>
        </div>
      </div>

      <!-- CARDS KPI DE RESUMO FINANCEIRO -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        
        <!-- 1. Total Produção Bruta -->
        <div class="card-corporate p-4 flex flex-col justify-between">
          <div class="flex items-center justify-between text-xs text-app-secondary mb-1">
            <span class="font-bold uppercase tracking-wider text-[10px]">Vendas Brutas</span>
            <span class="p-1 rounded bg-blue-50 dark:bg-blue-950/50 text-[#17324d] dark:text-blue-300">
              <mat-icon class="text-base">point_of_sale</mat-icon>
            </span>
          </div>
          <div>
            <span class="text-xl font-bold font-mono text-app-text block">
              R$ {{ relatorio().total_bruto_geral | number:'1.2-2' }}
            </span>
            <span class="text-[10px] text-app-muted">
              {{ relatorio().quantidade_total_vendas }} comandas processadas
            </span>
          </div>
        </div>

        <!-- 2. Taxas de Operadora Descontadas -->
        <div class="card-corporate p-4 flex flex-col justify-between border-l-4 border-l-red-500">
          <div class="flex items-center justify-between text-xs text-app-secondary mb-1">
            <span class="font-bold uppercase tracking-wider text-[10px]">Taxas Maquininha</span>
            <span class="p-1 rounded bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400">
              <mat-icon class="text-base">credit_card_off</mat-icon>
            </span>
          </div>
          <div>
            <span class="text-xl font-bold font-mono text-red-600 dark:text-red-400 block">
              - R$ {{ relatorio().total_taxas_operadora_geral | number:'1.2-2' }}
            </span>
            <span class="text-[10px] text-app-muted">
              Média: {{ ((relatorio().total_taxas_operadora_geral / (relatorio().total_bruto_geral || 1)) * 100) | number:'1.2-2' }}% sobre o bruto
            </span>
          </div>
        </div>

        <!-- 3. Insumos Descontados -->
        <div class="card-corporate p-4 flex flex-col justify-between border-l-4 border-l-amber-500">
          <div class="flex items-center justify-between text-xs text-app-secondary mb-1">
            <span class="font-bold uppercase tracking-wider text-[10px]">Insumos / Produtos</span>
            <span class="p-1 rounded bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400">
              <mat-icon class="text-base">inventory_2</mat-icon>
            </span>
          </div>
          <div>
            <span class="text-xl font-bold font-mono text-amber-600 dark:text-amber-400 block">
              - R$ {{ relatorio().total_insumos_geral | number:'1.2-2' }}
            </span>
            <span class="text-[10px] text-app-muted">
              Materiais & químicas rateados
            </span>
          </div>
        </div>

        <!-- 4. Cota Salão (Base Simples Nacional) -->
        <div class="card-corporate p-4 flex flex-col justify-between border-l-4 border-l-[#b66a3c]">
          <div class="flex items-center justify-between text-xs text-app-secondary mb-1">
            <span class="font-bold uppercase tracking-wider text-[10px]">Cota Retida Salão</span>
            <span class="p-1 rounded bg-orange-50 dark:bg-orange-950/50 text-[#b66a3c]">
              <mat-icon class="text-base">account_balance</mat-icon>
            </span>
          </div>
          <div>
            <span class="text-xl font-bold font-mono text-[#b66a3c] block">
              R$ {{ relatorio().total_cota_salao_geral | number:'1.2-2' }}
            </span>
            <span class="text-[10px] text-app-muted">
              Base do PGDAS-D (Economia garantida)
            </span>
          </div>
        </div>

        <!-- 5. Total Líquido a Transferir -->
        <div class="card-corporate p-4 flex flex-col justify-between border-l-4 border-l-emerald-500 bg-emerald-50/30 dark:bg-emerald-950/20">
          <div class="flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-300 mb-1">
            <span class="font-bold uppercase tracking-wider text-[10px]">Líquido MEIs</span>
            <span class="p-1 rounded bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300">
              <mat-icon class="text-base">account_balance_wallet</mat-icon>
            </span>
          </div>
          <div>
            <span class="text-xl font-bold font-mono text-emerald-700 dark:text-emerald-300 block">
              R$ {{ relatorio().total_liquido_repasses_geral | number:'1.2-2' }}
            </span>
            <div class="flex items-center justify-between text-[10px] mt-1 text-app-muted">
              <span class="text-emerald-600 font-semibold">Pago: R$ {{ relatorio().total_repasses_pagos | number:'1.0-0' }}</span>
              <span class="text-amber-600 font-semibold">Pend: R$ {{ relatorio().total_repasses_pendentes | number:'1.0-0' }}</span>
            </div>
          </div>
        </div>

      </div>

      <!-- INFORMAÇÃO DA REGRA DE ABSORÇÃO DE TAXA -->
      <div class="p-3.5 rounded-xl bg-slate-100/80 dark:bg-slate-900 border border-app flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div class="flex items-center gap-2.5">
          <mat-icon class="text-[#17324d] dark:text-blue-300 text-lg">info</mat-icon>
          <div>
            <span class="font-bold text-app-text">Regra de Absorção de Taxa de Cartão Ativa:</span>
            <span class="text-app-secondary ml-1">
              @if (repasseService.configTaxas().regra_absorcao === 'PROPORCIONAL_COTA') {
                Rateio proporcional à cota contratual (Salão e Parceiro compartilham a taxa na mesma divisão das vendas).
              } @else if (repasseService.configTaxas().regra_absorcao === 'PARCEIRO_INTEGRAL') {
                Parceiro absorve integralmente as taxas de operadora incidentes sobre o seu serviço.
              } @else {
                Salão absorve 100% das taxas de cartão como custo operacional do estabelecimento.
              }
            </span>
          </div>
        </div>

        <div class="flex items-center gap-2 shrink-0">
          <span class="px-2 py-1 rounded bg-surface border border-app font-mono text-[11px] font-bold text-app-text">
            {{ repasseService.configTaxas().operadora_padrao }}: Débito {{ repasseService.configTaxas().taxa_debito_percentual }}% | Crédito {{ repasseService.configTaxas().taxa_credito_vista_percentual }}% | Parcelado {{ repasseService.configTaxas().taxa_credito_parcelado_percentual }}%
          </span>
        </div>
      </div>

      <!-- ABAS DE VISUALIZAÇÃO & FILTROS -->
      <div class="space-y-4">
        
        <!-- Barra de Abas e Filtros -->
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-app pb-3">
          
          <!-- Botões de Aba -->
          <div class="flex items-center gap-2 bg-slate-100 dark:bg-slate-900 p-1 rounded-lg border border-app">
            <button 
              type="button" 
              (click)="abaAtiva.set('RESUMO_PARCEIROS')"
              [class.bg-surface]="abaAtiva() === 'RESUMO_PARCEIROS'"
              [class.shadow-xs]="abaAtiva() === 'RESUMO_PARCEIROS'"
              [class.font-bold]="abaAtiva() === 'RESUMO_PARCEIROS'"
              [class.text-app-text]="abaAtiva() === 'RESUMO_PARCEIROS'"
              class="px-3 py-1.5 rounded-md text-xs text-app-secondary hover:text-app-text transition-all flex items-center gap-1.5">
              <mat-icon class="text-sm">groups</mat-icon>
              <span>Resumo por Profissional ({{ relatorio().parceiros_resumo.length }})</span>
            </button>

            <button 
              type="button" 
              (click)="abaAtiva.set('DETALHE_VENDAS')"
              [class.bg-surface]="abaAtiva() === 'DETALHE_VENDAS'"
              [class.shadow-xs]="abaAtiva() === 'DETALHE_VENDAS'"
              [class.font-bold]="abaAtiva() === 'DETALHE_VENDAS'"
              [class.text-app-text]="abaAtiva() === 'DETALHE_VENDAS'"
              class="px-3 py-1.5 rounded-md text-xs text-app-secondary hover:text-app-text transition-all flex items-center gap-1.5">
              <mat-icon class="text-sm">receipt_long</mat-icon>
              <span>Comandas & Vendas Detalhadas ({{ repasseService.vendasFiltradas().length }})</span>
            </button>
          </div>

          <!-- Filtros de Busca e Parceiro -->
          <div class="flex items-center gap-2 flex-wrap">
            
            <!-- Campo de Busca -->
            <div class="relative min-w-[180px]">
              <mat-icon class="absolute left-2.5 top-1/2 -translate-y-1/2 text-app-muted text-sm">search</mat-icon>
              <input 
                type="text" 
                [ngModel]="repasseService.filtroBuscaTermo()"
                (ngModelChange)="repasseService.filtroBuscaTermo.set($event)"
                placeholder="Buscar cliente, comanda..." 
                class="input-corporate pl-8 py-1.5 text-xs w-full">
            </div>

            <!-- Filtro de Parceiro -->
            <select 
              [ngModel]="repasseService.filtroParceiroId()"
              (ngModelChange)="repasseService.filtroParceiroId.set($event)"
              class="select-corporate py-1.5 text-xs">
              <option value="TODOS">Todos os Parceiros</option>
              @for (p of financeState.parceiros(); track p.id) {
                <option [value]="p.id">{{ p.nome_fantasia }}</option>
              }
            </select>

            <!-- Filtro Forma de Pagamento -->
            <select 
              [ngModel]="repasseService.filtroFormaPagamento()"
              (ngModelChange)="repasseService.filtroFormaPagamento.set($event)"
              class="select-corporate py-1.5 text-xs">
              <option value="TODAS">Todas as Formas de Pgto</option>
              <option value="CARTAO_CREDITO_VISTA">Crédito à Vista</option>
              <option value="CARTAO_CREDITO_PARCELADO">Crédito Parcelado</option>
              <option value="CARTAO_DEBITO">Débito</option>
              <option value="PIX_MAQUININHA">PIX Maquininha</option>
              <option value="PIX_DIRETO">PIX Direto Salão</option>
              <option value="DINHEIRO">Dinheiro</option>
            </select>

          </div>

        </div>

        <!-- CONTEÚDO DA ABA 1: RESUMO CONSOLIDADO POR PROFISSIONAL PARCEIRO -->
        @if (abaAtiva() === 'RESUMO_PARCEIROS') {
          <div class="grid grid-cols-1 gap-4">
            
            @for (resumo of parceirosFiltrados(); track resumo.id_parceiro; let i = $index) {
              <div class="card-corporate p-5 transition-all hover:border-slate-300 dark:hover:border-slate-700">
                
                <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-app">
                  
                  <!-- Info do Parceiro -->
                  <div class="flex items-center gap-3.5">
                    <img 
                      [src]="resumo.foto_avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&h=120&q=80'" 
                      [alt]="resumo.nome_parceiro"
                      referrerpolicy="no-referrer"
                      class="w-12 h-12 rounded-full object-cover border-2 border-app shrink-0 shadow-xs">
                    <div>
                      <div class="flex items-center gap-2">
                        <h3 class="font-bold text-base text-app-text leading-tight">{{ resumo.nome_parceiro }}</h3>
                        <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 dark:bg-slate-800 text-app-secondary border border-app">
                          {{ resumo.especialidade }}
                        </span>
                      </div>
                      <div class="flex items-center gap-3 text-xs text-app-muted mt-0.5 flex-wrap">
                        <span class="font-mono">CNPJ: {{ resumo.cnpj_mei }}</span>
                        <span>•</span>
                        <span class="font-bold text-[#17324d] dark:text-blue-300">
                          Contrato: {{ resumo.percentual_contratual_parceiro }}% Parceiro / {{ resumo.percentual_contratual_empresa }}% Salão
                        </span>
                        <span>•</span>
                        <span>{{ resumo.quantidade_atendimentos }} atendimentos</span>
                      </div>
                    </div>
                  </div>

                  <!-- Status & Ações de Repasse -->
                  <div class="flex items-center gap-2.5 flex-wrap lg:justify-end">
                    
                    @if (resumo.status_repasse === 'TRANSFERIDO_PIX') {
                      <div class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-bold">
                        <mat-icon class="text-sm">check_circle</mat-icon>
                        <span>PIX Liquidado ({{ resumo.data_transferencia }})</span>
                      </div>
                    } @else if (resumo.status_repasse === 'PRONTO_TRANSFERIR') {
                      <span class="status-badge status-badge-warning text-xs">
                        Aguardando Pagamento
                      </span>
                    } @else {
                      <span class="status-badge status-badge-neutral text-xs">
                        Em Conferência
                      </span>
                    }

                    <button 
                      type="button" 
                      (click)="baixarPdfComprovanteLiquidoParceiro(resumo)" 
                      class="btn-secondary text-xs py-1.5 border-emerald-300 dark:border-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300"
                      [id]="'btn-pdf-liquido-' + i"
                      title="Baixar Comprovante Focado no Líquido (Transparência Lei 13.352/2016)">
                      <mat-icon class="text-sm text-emerald-600 dark:text-emerald-400">verified</mat-icon> PDF Líquido (Lei 13.352)
                    </button>

                    <button 
                      type="button" 
                      (click)="abrirDemonstrativo(resumo)" 
                      class="btn-secondary text-xs py-1.5"
                      [id]="'btn-demonstrativo-' + i"
                      title="Ver Extrato Detalhado de Prestação de Contas">
                      <mat-icon class="text-sm">description</mat-icon> Demonstrativo
                    </button>

                    <button 
                      type="button" 
                      (click)="baixarPdfComprovanteParceiro(resumo)" 
                      class="btn-secondary text-xs py-1.5"
                      title="Baixar Comprovante de Repasse Analítico em PDF (A4)">
                      <mat-icon class="text-sm text-red-500">picture_as_pdf</mat-icon> PDF Analítico
                    </button>

                    @if (resumo.status_repasse !== 'TRANSFERIDO_PIX') {
                      <button 
                        type="button" 
                        (click)="executarTransferenciaPix(resumo)" 
                        class="btn-primary text-xs py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-700"
                        title="Efetuar Transferência PIX do Líquido">
                        <mat-icon class="text-sm">send</mat-icon> Pagar PIX Líquido
                      </button>
                    }

                  </div>

                </div>

                <!-- Detalhamento dos Números do Parceiro -->
                <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-4 text-xs">
                  
                  <div class="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-app">
                    <span class="text-[10px] text-app-muted uppercase font-bold block">1. Total Bruto Vendas</span>
                    <span class="text-sm font-bold font-mono text-app-text mt-0.5 block">
                      R$ {{ resumo.total_bruto_vendas | number:'1.2-2' }}
                    </span>
                  </div>

                  <div class="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-app">
                    <span class="text-[10px] text-red-600 dark:text-red-400 uppercase font-bold block">2. Taxas Cartão</span>
                    <span class="text-sm font-bold font-mono text-red-600 dark:text-red-400 mt-0.5 block">
                      - R$ {{ resumo.total_taxas_operadora_descontadas | number:'1.2-2' }}
                    </span>
                  </div>

                  <div class="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-app">
                    <span class="text-[10px] text-amber-600 dark:text-amber-400 uppercase font-bold block">3. Insumos/Produtos</span>
                    <span class="text-sm font-bold font-mono text-amber-600 dark:text-amber-400 mt-0.5 block">
                      - R$ {{ resumo.total_insumos_descontados | number:'1.2-2' }}
                    </span>
                  </div>

                  <div class="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-app">
                    <span class="text-[10px] text-[#b66a3c] uppercase font-bold block">4. Cota Salão ({{ resumo.percentual_contratual_empresa }}%)</span>
                    <span class="text-sm font-bold font-mono text-[#b66a3c] mt-0.5 block">
                      R$ {{ resumo.valor_cota_salao_total | number:'1.2-2' }}
                    </span>
                  </div>

                  <div class="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 col-span-2 sm:col-span-1">
                    <span class="text-[10px] text-emerald-800 dark:text-emerald-300 uppercase font-bold block">5. Líquido a Transferir</span>
                    <span class="text-base font-black font-mono text-emerald-700 dark:text-emerald-300 mt-0.5 block">
                      R$ {{ resumo.valor_liquido_transferir | number:'1.2-2' }}
                    </span>
                  </div>

                </div>

                <!-- Chave PIX e Informações de Pagamento -->
                <div class="mt-3 pt-3 border-t border-app flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-app-muted">
                  <div class="flex items-center gap-2">
                    <mat-icon class="text-xs text-emerald-600">qr_code_2</mat-icon>
                    <span>Chave PIX ({{ resumo.tipo_chave_pix }}): <strong class="text-app-text font-mono">{{ resumo.chave_pix }}</strong></span>
                    <button 
                      type="button" 
                      (click)="copiarChavePix(resumo.chave_pix)" 
                      class="text-xs text-[#17324d] dark:text-blue-300 hover:underline inline-flex items-center gap-0.5">
                      <mat-icon class="text-[13px]">content_copy</mat-icon> Copiar
                    </button>
                  </div>

                  @if (resumo.comprovante_autenticacao) {
                    <div class="font-mono text-[10px]">
                      Autenticação Bancária: <span class="text-app-text">{{ resumo.comprovante_autenticacao }}</span>
                    </div>
                  }
                </div>

              </div>
            }

          </div>
        }

        <!-- CONTEÚDO DA ABA 2: TABELA DE COMANDAS & VENDAS DETALHADAS -->
        @if (abaAtiva() === 'DETALHE_VENDAS') {
          <div class="card-corporate overflow-hidden">
            <div class="overflow-x-auto">
              <table class="table-corporate text-xs">
                <thead>
                  <tr>
                    <th>Data/Hora</th>
                    <th>Comanda</th>
                    <th>Cliente</th>
                    <th>Profissional Parceiro</th>
                    <th>Serviço Executado</th>
                    <th>Forma de Pgto</th>
                    <th class="text-right">Bruto</th>
                    <th class="text-right">Taxa Operadora</th>
                    <th class="text-right">Insumos</th>
                    <th class="text-right">Cota Salão</th>
                    <th class="text-right">Líquido MEI</th>
                  </tr>
                </thead>
                <tbody>
                  @for (v of repasseService.vendasFiltradas(); track v.id) {
                    <tr>
                      <td class="font-mono text-app-muted whitespace-nowrap">
                        {{ v.data_hora }}
                      </td>
                      <td class="font-mono font-bold text-app-text whitespace-nowrap">
                        {{ v.codigo_comanda }}
                      </td>
                      <td>
                        <span class="font-bold text-app-text block">{{ v.nome_cliente }}</span>
                      </td>
                      <td>
                        <span class="font-semibold text-app-text block">{{ v.nome_parceiro }}</span>
                        <span class="text-[10px] text-app-muted font-mono">{{ v.percentual_parceiro }}% / {{ v.percentual_empresa }}%</span>
                      </td>
                      <td>
                        <span class="text-app-text block font-medium">{{ v.servico_descricao }}</span>
                        <span class="text-[10px] text-app-muted">{{ v.categoria }}</span>
                      </td>
                      <td>
                        <div class="flex items-center gap-1.5 whitespace-nowrap">
                          <mat-icon class="text-sm text-app-muted">{{ repasseService.obterIconeFormaPagamento(v.forma_pagamento) }}</mat-icon>
                          <span>{{ repasseService.obterRotuloFormaPagamento(v.forma_pagamento) }}</span>
                          <span class="text-[10px] text-app-muted">({{ v.operadora }})</span>
                        </div>
                      </td>
                      <td class="text-right font-mono font-bold text-app-text whitespace-nowrap">
                        R$ {{ v.valor_bruto | number:'1.2-2' }}
                      </td>
                      <td class="text-right font-mono text-red-500 whitespace-nowrap">
                        - R$ {{ v.valor_taxa_operadora | number:'1.2-2' }}
                        <span class="text-[9px] text-app-muted block">({{ v.taxa_operadora_percentual }}%)</span>
                      </td>
                      <td class="text-right font-mono text-amber-600 whitespace-nowrap">
                        @if (v.valor_desconto_insumos > 0) {
                          - R$ {{ v.valor_desconto_insumos | number:'1.2-2' }}
                        } @else {
                          <span class="text-app-muted">—</span>
                        }
                      </td>
                      <td class="text-right font-mono text-[#b66a3c] font-semibold whitespace-nowrap">
                        R$ {{ v.valor_cota_empresa | number:'1.2-2' }}
                      </td>
                      <td class="text-right font-mono font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                        R$ {{ v.valor_liquido_parceiro | number:'1.2-2' }}
                      </td>
                    </tr>
                  }
                </tbody>
                <tfoot>
                  <tr class="bg-slate-100 dark:bg-slate-900 font-bold">
                    <td colspan="6" class="text-right text-app-text uppercase text-[11px]">
                      Totais Filtrados ({{ repasseService.vendasFiltradas().length }} itens):
                    </td>
                    <td class="text-right font-mono font-bold text-app-text">
                      R$ {{ totalBrutoFiltrado() | number:'1.2-2' }}
                    </td>
                    <td class="text-right font-mono text-red-500">
                      - R$ {{ totalTaxasFiltrado() | number:'1.2-2' }}
                    </td>
                    <td class="text-right font-mono text-amber-600">
                      - R$ {{ totalInsumosFiltrado() | number:'1.2-2' }}
                    </td>
                    <td class="text-right font-mono text-[#b66a3c]">
                      R$ {{ totalCotaFiltrado() | number:'1.2-2' }}
                    </td>
                    <td class="text-right font-mono text-emerald-600 dark:text-emerald-400 font-black">
                      R$ {{ totalLiquidoFiltrado() | number:'1.2-2' }}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        }

      </div>

      <!-- =============================================================== -->
      <!-- MODAL 1: DEMONSTRATIVO DE PRESTAÇÃO DE CONTAS INDIVIDUAL (LEI 13.352) -->
      <!-- =============================================================== -->
      @if (parceiroDemonstrativo()) {
        <div class="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div class="card-corporate w-full max-w-3xl bg-surface max-h-[90vh] flex flex-col shadow-2xl">
            
            <!-- Topo do Modal -->
            <div class="p-4 sm:p-6 border-b border-app flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="p-2 rounded-xl bg-gradient-to-br from-[#17324d] to-[#2b5177] text-white">
                  <mat-icon class="text-xl">receipt</mat-icon>
                </div>
                <div>
                  <h3 class="font-bold text-base text-app-text">Demonstrativo Oficial de Repasse</h3>
                  <p class="text-xs text-app-secondary">Prestação de Contas Mensal conforme Lei Federal 13.352/2016</p>
                </div>
              </div>

              <button 
                type="button" 
                (click)="parceiroDemonstrativo.set(null)"
                class="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-app-secondary">
                <mat-icon>close</mat-icon>
              </button>
            </div>

            <!-- Corpo do Demonstrativo Timbrado -->
            <div class="p-4 sm:p-6 overflow-y-auto space-y-6 text-xs" id="comprovante-print-area">
              
              <!-- Dados das Partes Contratantes -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-app">
                <div>
                  <span class="text-[10px] font-bold text-app-muted uppercase block">Salão-Parceiro (Tomador)</span>
                  <strong class="text-app-text block mt-0.5">{{ financeState.empresaAtiva().razao_social }}</strong>
                  <span class="font-mono text-app-secondary block">CNPJ: {{ financeState.empresaAtiva().cnpj }}</span>
                  <span class="text-app-muted block">{{ financeState.empresaAtiva().endereco }}</span>
                </div>

                <div>
                  <span class="text-[10px] font-bold text-app-muted uppercase block">Profissional-Parceiro MEI (Prestador)</span>
                  <strong class="text-app-text block mt-0.5">{{ parceiroDemonstrativo()?.razao_social_mei }}</strong>
                  <span class="font-mono text-app-secondary block">CNPJ MEI: {{ parceiroDemonstrativo()?.cnpj_mei }}</span>
                  <span class="text-app-muted block">Especialidade: {{ parceiroDemonstrativo()?.especialidade }}</span>
                  <span class="text-app-muted block">Chave PIX: <strong class="font-mono text-app-text">{{ parceiroDemonstrativo()?.chave_pix }}</strong></span>
                </div>
              </div>

              <!-- Quadro de Apuração Financeira -->
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div class="p-3 rounded-lg border border-app bg-surface">
                  <span class="text-[10px] text-app-muted uppercase font-bold block">1. Produção Bruta</span>
                  <span class="text-base font-bold font-mono text-app-text block mt-1">
                    R$ {{ parceiroDemonstrativo()?.total_bruto_vendas | number:'1.2-2' }}
                  </span>
                </div>

                <div class="p-3 rounded-lg border border-app bg-surface">
                  <span class="text-[10px] text-red-500 uppercase font-bold block">2. Taxas Cartão/Insumos</span>
                  <span class="text-base font-bold font-mono text-red-500 block mt-1">
                    - R$ {{ ((parceiroDemonstrativo()?.total_taxas_operadora_descontadas || 0) + (parceiroDemonstrativo()?.total_insumos_descontados || 0)) | number:'1.2-2' }}
                  </span>
                </div>

                <div class="p-3 rounded-lg border border-app bg-surface">
                  <span class="text-[10px] text-[#b66a3c] uppercase font-bold block">3. Cota Salão ({{ parceiroDemonstrativo()?.percentual_contratual_empresa }}%)</span>
                  <span class="text-base font-bold font-mono text-[#b66a3c] block mt-1">
                    R$ {{ parceiroDemonstrativo()?.valor_cota_salao_total | number:'1.2-2' }}
                  </span>
                </div>

                <div class="p-3 rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40">
                  <span class="text-[10px] text-emerald-800 dark:text-emerald-300 uppercase font-bold block">4. Líquido MEI ({{ parceiroDemonstrativo()?.percentual_contratual_parceiro }}%)</span>
                  <span class="text-base font-black font-mono text-emerald-700 dark:text-emerald-300 block mt-1">
                    R$ {{ parceiroDemonstrativo()?.valor_liquido_transferir | number:'1.2-2' }}
                  </span>
                </div>
              </div>

              <!-- Lista de Comandas que compõem o valor -->
              <div>
                <h4 class="font-bold text-xs text-app-text mb-2 flex items-center justify-between">
                  <span>Discriminação Individual dos Atendimentos:</span>
                  <span class="text-app-muted font-normal">{{ parceiroDemonstrativo()?.itens_vendas?.length }} serviços</span>
                </h4>

                <div class="border border-app rounded-lg overflow-hidden">
                  <table class="table-corporate text-xs">
                    <thead>
                      <tr>
                        <th>Data</th>
                        <th>Comanda</th>
                        <th>Cliente / Serviço</th>
                        <th>Meio Pgto</th>
                        <th class="text-right">Bruto</th>
                        <th class="text-right">Taxa Cartão</th>
                        <th class="text-right">Líquido MEI</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (item of parceiroDemonstrativo()?.itens_vendas; track item.id) {
                        <tr>
                          <td class="font-mono text-[11px]">{{ item.data_hora.substring(0, 10) }}</td>
                          <td class="font-mono font-bold">{{ item.codigo_comanda }}</td>
                          <td>
                            <strong class="block text-app-text">{{ item.nome_cliente }}</strong>
                            <span class="text-[10px] text-app-muted">{{ item.servico_descricao }}</span>
                          </td>
                          <td>
                            <span class="text-[11px]">{{ repasseService.obterRotuloFormaPagamento(item.forma_pagamento) }}</span>
                          </td>
                          <td class="text-right font-mono font-bold">R$ {{ item.valor_bruto | number:'1.2-2' }}</td>
                          <td class="text-right font-mono text-red-500">- R$ {{ item.valor_taxa_operadora | number:'1.2-2' }}</td>
                          <td class="text-right font-mono font-bold text-emerald-600">R$ {{ item.valor_liquido_parceiro | number:'1.2-2' }}</td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              </div>

              <!-- Fundamentação Legal -->
              <div class="p-3 rounded-lg bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 text-[11px] text-[#17324d] dark:text-blue-300">
                <strong>Fundamentação Legal:</strong> Demonstrativo emitido em conformidade com o Art. 1º-A da Lei 13.352/2016. Os valores transferidos ao MEI referem-se à sua cota-parte pela prestação direta dos serviços estéticos/cabeleireiro, servindo de base para a emissão da respectiva NFS-e contra o salão-parceiro.
              </div>

              <!-- ASSINATURAS PARA DOCUMENTO IMPRESSO (EXIBIDO APENAS NA IMPRESSÃO) -->
              <div class="print-only print-assinaturas pt-8 mt-6 border-t border-slate-300 text-xs">
                <div class="w-5/12 text-center">
                  <div class="border-t border-black pt-1 mb-1 font-bold">
                    {{ financeState.empresaAtiva().razao_social }}
                  </div>
                  <span class="text-[10px] text-slate-600 block">Salão-Parceiro (CNPJ: {{ financeState.empresaAtiva().cnpj }})</span>
                </div>

                <div class="w-5/12 text-center">
                  <div class="border-t border-black pt-1 mb-1 font-bold">
                    {{ parceiroDemonstrativo()?.razao_social_mei }}
                  </div>
                  <span class="text-[10px] text-slate-600 block">Profissional-Parceiro MEI (CNPJ: {{ parceiroDemonstrativo()?.cnpj_mei }})</span>
                </div>
              </div>

            </div>

            <!-- Rodapé com Ações -->
            <div class="p-4 border-t border-app flex items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-900/50 no-print">
              <div class="text-xs text-app-muted">
                Status: <strong class="text-app-text">{{ parceiroDemonstrativo()?.status_repasse === 'TRANSFERIDO_PIX' ? 'Liquidado via PIX' : 'Aguardando Pagamento' }}</strong>
              </div>

              <div class="flex items-center gap-2 flex-wrap justify-end">
                <button 
                  type="button" 
                  (click)="baixarPdfComprovanteLiquidoModal()" 
                  class="btn-secondary text-xs border-emerald-300 dark:border-emerald-700 bg-emerald-50/50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300"
                  id="btn-baixar-pdf-liquido-modal"
                  title="Baixar Comprovante Focado no Valor Líquido (Normas de Transparência da Lei 13.352/2016)">
                  <mat-icon class="text-sm text-emerald-600 dark:text-emerald-400">verified</mat-icon> PDF Líquido (Lei 13.352)
                </button>

                <button 
                  type="button" 
                  (click)="baixarPdfComprovante()" 
                  class="btn-secondary text-xs"
                  id="btn-baixar-pdf-comprovante"
                  title="Baixar Arquivo PDF Analítico Completo Formatado A4">
                  <mat-icon class="text-sm text-red-500">picture_as_pdf</mat-icon> PDF Analítico
                </button>

                <button 
                  type="button" 
                  (click)="imprimirComprovante()" 
                  class="btn-secondary text-xs"
                  id="btn-imprimir-comprovante">
                  <mat-icon class="text-sm">print</mat-icon> Imprimir
                </button>

                @if (parceiroDemonstrativo()?.status_repasse !== 'TRANSFERIDO_PIX') {
                  <button 
                    type="button" 
                    (click)="executarTransferenciaPix(parceiroDemonstrativo()!)" 
                    class="btn-primary text-xs bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-700">
                    <mat-icon class="text-sm">send</mat-icon> Liquidar PIX
                  </button>
                }
              </div>
            </div>

          </div>
        </div>
      }

      <!-- =============================================================== -->
      <!-- MODAL 2: LANÇAR NOVA COMANDA / VENDA COM CÁLCULO DE TAXAS -->
      <!-- =============================================================== -->
      @if (abrirModalNovaVenda()) {
        <div class="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div class="card-corporate w-full max-w-lg bg-surface shadow-2xl">
            
            <div class="p-4 sm:p-6 border-b border-app flex items-center justify-between">
              <div class="flex items-center gap-2.5">
                <mat-icon class="text-[#17324d] dark:text-blue-300">add_shopping_cart</mat-icon>
                <h3 class="font-bold text-base text-app-text">Lançar Nova Comanda de Serviço</h3>
              </div>
              <button 
                type="button" 
                (click)="abrirModalNovaVenda.set(false)"
                class="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-app-secondary">
                <mat-icon>close</mat-icon>
              </button>
            </div>

            <form (ngSubmit)="salvarNovaVenda()" class="p-4 sm:p-6 space-y-4 text-xs">
              
              <!-- Seleção do Profissional Parceiro -->
              <div>
                <label class="block font-bold text-app-text mb-1">Profissional Parceiro *</label>
                <select 
                  [(ngModel)]="novaVendaForm.id_parceiro" 
                  name="id_parceiro" 
                  required
                  class="select-corporate w-full">
                  @for (p of financeState.parceiros(); track p.id) {
                    <option [value]="p.id">{{ p.nome_fantasia }} ({{ p.especialidade }}) - Contrato: {{ p.percentual_padrao_parceiro }}%</option>
                  }
                </select>
              </div>

              <!-- Nome do Cliente & Código da Comanda -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label class="block font-bold text-app-text mb-1">Nome do Cliente *</label>
                  <input 
                    type="text" 
                    [(ngModel)]="novaVendaForm.nome_cliente" 
                    name="nome_cliente" 
                    required 
                    placeholder="Ex: Mariana Silva" 
                    class="input-corporate w-full">
                </div>

                <div>
                  <label class="block font-bold text-app-text mb-1">Nº da Comanda</label>
                  <input 
                    type="text" 
                    [(ngModel)]="novaVendaForm.codigo_comanda" 
                    name="codigo_comanda" 
                    placeholder="Ex: CMD-8520" 
                    class="input-corporate w-full font-mono">
                </div>
              </div>

              <!-- Descrição do Serviço e Categoria -->
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div class="sm:col-span-2">
                  <label class="block font-bold text-app-text mb-1">Descrição do Serviço *</label>
                  <input 
                    type="text" 
                    [(ngModel)]="novaVendaForm.servico_descricao" 
                    name="servico_descricao" 
                    required 
                    placeholder="Ex: Mechas Blond + Escova Modelada" 
                    class="input-corporate w-full">
                </div>

                <div>
                  <label class="block font-bold text-app-text mb-1">Categoria</label>
                  <select [(ngModel)]="novaVendaForm.categoria" name="categoria" class="select-corporate w-full">
                    <option value="Coloração">Coloração</option>
                    <option value="Cabelo">Cabelo</option>
                    <option value="Unhas">Unhas</option>
                    <option value="Estética">Estética</option>
                    <option value="Barba">Barba</option>
                    <option value="Tratamento">Tratamento</option>
                  </select>
                </div>
              </div>

              <!-- Valor Bruto & Desconto de Insumos -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label class="block font-bold text-app-text mb-1">Valor Bruto do Serviço (R$) *</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    min="1" 
                    [(ngModel)]="novaVendaForm.valor_bruto" 
                    name="valor_bruto" 
                    required 
                    class="input-corporate w-full font-mono font-bold text-sm">
                </div>

                <div>
                  <label class="block font-bold text-app-text mb-1">Insumos / Produtos (R$)</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    min="0" 
                    [(ngModel)]="novaVendaForm.valor_desconto_insumos" 
                    name="valor_desconto_insumos" 
                    placeholder="0.00" 
                    class="input-corporate w-full font-mono">
                </div>
              </div>

              <!-- Meio de Pagamento e Maquininha -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label class="block font-bold text-app-text mb-1">Forma de Pagamento *</label>
                  <select [(ngModel)]="novaVendaForm.forma_pagamento" name="forma_pagamento" class="select-corporate w-full">
                    <option value="CARTAO_CREDITO_PARCELADO">Cartão de Crédito Parcelado</option>
                    <option value="CARTAO_CREDITO_VISTA">Cartão de Crédito à Vista</option>
                    <option value="CARTAO_DEBITO">Cartão de Débito</option>
                    <option value="PIX_MAQUININHA">PIX Maquininha</option>
                    <option value="PIX_DIRETO">PIX Direto Salão (Sem Taxa)</option>
                    <option value="DINHEIRO">Dinheiro</option>
                  </select>
                </div>

                <div>
                  <label class="block font-bold text-app-text mb-1">Operadora / Maquininha</label>
                  <select [(ngModel)]="novaVendaForm.operadora" name="operadora" class="select-corporate w-full">
                    <option value="Stone">Stone</option>
                    <option value="Cielo">Cielo</option>
                    <option value="PagBank">PagBank</option>
                    <option value="Rede">Rede</option>
                    <option value="InfinitePay">InfinitePay</option>
                  </select>
                </div>
              </div>

              <!-- PRÉVIA DO CÁLCULO INSTANTÂNEO -->
              <div class="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-app space-y-1.5 text-xs">
                <span class="font-bold text-app-text block text-[11px]">Simulação Instantânea da Partilha:</span>
                <div class="flex justify-between text-app-muted">
                  <span>Taxa Estimada da Maquininha:</span>
                  <span class="font-mono text-red-500 font-bold">- R$ {{ estimativaTaxaOperadora() | number:'1.2-2' }}</span>
                </div>
                <div class="flex justify-between text-app-muted">
                  <span>Cota Retida do Salão:</span>
                  <span class="font-mono text-[#b66a3c] font-bold">R$ {{ estimativaCotaSalao() | number:'1.2-2' }}</span>
                </div>
                <div class="flex justify-between text-app-text pt-1 border-t border-app font-bold">
                  <span class="text-emerald-700 dark:text-emerald-300">Líquido do Profissional MEI:</span>
                  <span class="font-mono text-emerald-700 dark:text-emerald-300 text-sm">R$ {{ estimativaLiquidoParceiro() | number:'1.2-2' }}</span>
                </div>
              </div>

              <!-- Botões de Ação -->
              <div class="flex items-center justify-end gap-2 pt-2 border-t border-app">
                <button 
                  type="button" 
                  (click)="abrirModalNovaVenda.set(false)" 
                  class="btn-secondary text-xs">
                  Cancelar
                </button>

                <button 
                  type="submit" 
                  class="btn-primary text-xs">
                  <mat-icon class="text-sm">check</mat-icon> Processar Venda & Repasse
                </button>
              </div>

            </form>

          </div>
        </div>
      }

      <!-- =============================================================== -->
      <!-- MODAL 3: CONFIGURAR TAXAS DE OPERADORA & REGRA DE ABSORÇÃO -->
      <!-- =============================================================== -->
      @if (abrirModalConfigTaxas()) {
        <div class="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div class="card-corporate w-full max-w-lg bg-surface shadow-2xl">
            
            <div class="p-4 sm:p-6 border-b border-app flex items-center justify-between">
              <div class="flex items-center gap-2.5">
                <mat-icon class="text-[#17324d] dark:text-blue-300">tune</mat-icon>
                <h3 class="font-bold text-base text-app-text">Configurar Taxas de Maquininha & Regras</h3>
              </div>
              <button 
                type="button" 
                (click)="abrirModalConfigTaxas.set(false)"
                class="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-app-secondary">
                <mat-icon>close</mat-icon>
              </button>
            </div>

            <div class="p-4 sm:p-6 space-y-4 text-xs">
              
              <!-- Operadora Principal -->
              <div>
                <label class="block font-bold text-app-text mb-1">Operadora Padrão</label>
                <select [(ngModel)]="taxasForm.operadora_padrao" class="select-corporate w-full">
                  <option value="Stone">Stone</option>
                  <option value="Cielo">Cielo</option>
                  <option value="PagBank">PagBank</option>
                  <option value="Rede">Rede</option>
                  <option value="InfinitePay">InfinitePay</option>
                </select>
              </div>

              <!-- Regra de Absorção das Taxas -->
              <div>
                <label class="block font-bold text-app-text mb-1">Regra de Rateio / Absorção da Taxa de Cartão</label>
                <select [(ngModel)]="taxasForm.regra_absorcao" class="select-corporate w-full">
                  <option value="PROPORCIONAL_COTA">Proporcional às Cotas (Recomendado - 55% Parceiro / 45% Salão)</option>
                  <option value="PARCEIRO_INTEGRAL">Parceiro Absorve 100% da Taxa do Cartão</option>
                  <option value="SALAO_INTEGRAL">Salão Absorve 100% da Taxa (Custo Operacional)</option>
                </select>
              </div>

              <!-- Grade de Taxas Percentuais -->
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block font-bold text-app-text mb-1">Taxa Cartão Débito (%)</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    [(ngModel)]="taxasForm.taxa_debito_percentual" 
                    class="input-corporate w-full font-mono">
                </div>

                <div>
                  <label class="block font-bold text-app-text mb-1">Crédito à Vista (%)</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    [(ngModel)]="taxasForm.taxa_credito_vista_percentual" 
                    class="input-corporate w-full font-mono">
                </div>

                <div>
                  <label class="block font-bold text-app-text mb-1">Crédito Parcelado (2x-6x) (%)</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    [(ngModel)]="taxasForm.taxa_credito_parcelado_percentual" 
                    class="input-corporate w-full font-mono">
                </div>

                <div>
                  <label class="block font-bold text-app-text mb-1">PIX Maquininha (%)</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    [(ngModel)]="taxasForm.taxa_pix_maquininha_percentual" 
                    class="input-corporate w-full font-mono">
                </div>
              </div>

              <div class="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-[11px] text-emerald-800 dark:text-emerald-300">
                Ao salvar, todas as comandas e repasses do período serão recalculados automaticamente em tempo real com as novas alíquotas.
              </div>

              <!-- Botões de Ação -->
              <div class="flex items-center justify-end gap-2 pt-2 border-t border-app">
                <button 
                  type="button" 
                  (click)="abrirModalConfigTaxas.set(false)" 
                  class="btn-secondary text-xs">
                  Fechar
                </button>

                <button 
                  type="button" 
                  (click)="salvarConfiguracaoTaxas()" 
                  class="btn-primary text-xs">
                  <mat-icon class="text-sm">save</mat-icon> Aplicar & Recalcular
                </button>
              </div>

            </div>

          </div>
        </div>
      }

      <!-- TOAST DE SUCESSO DE TRANSFERÊNCIA PIX -->
      @if (toastMensagem()) {
        <div class="fixed bottom-6 right-6 z-50 p-4 rounded-xl bg-emerald-900 text-white shadow-2xl flex items-center gap-3 border border-emerald-700 animate-slide-up">
          <mat-icon class="text-emerald-300">verified</mat-icon>
          <div class="text-xs">
            <strong class="block text-emerald-200">Transferência PIX Confirmada!</strong>
            <span>{{ toastMensagem() }}</span>
          </div>
          <button type="button" (click)="toastMensagem.set(null)" class="text-emerald-300 hover:text-white ml-2">
            <mat-icon class="text-sm">close</mat-icon>
          </button>
        </div>
      }

    </div>
  `
})
export class RelatorioRepasseComponent {
  readonly repasseService = inject(RelatorioRepasseService);
  readonly financeState = inject(FinanceStateService);
  readonly pdfExport = inject(PdfExportService);
  readonly csvExport = inject(CsvExportService);
  readonly xmlExport = inject(XmlExportService);
  readonly confirmDialog = inject(ConfirmDialogService);

  readonly abaAtiva = signal<'RESUMO_PARCEIROS' | 'DETALHE_VENDAS'>('RESUMO_PARCEIROS');
  readonly parceiroDemonstrativo = signal<ResumoRepasseParceiro | null>(null);
  readonly abrirModalNovaVenda = signal<boolean>(false);
  readonly abrirModalConfigTaxas = signal<boolean>(false);
  readonly toastMensagem = signal<string | null>(null);

  // Formulário Nova Venda
  novaVendaForm = {
    id_parceiro: 'parc-01',
    codigo_comanda: '',
    nome_cliente: '',
    servico_descricao: '',
    categoria: 'Cabelo' as const,
    valor_bruto: 250.00,
    forma_pagamento: 'CARTAO_CREDITO_VISTA' as FormaPagamentoVenda,
    operadora: 'Stone' as OperadoraCartao,
    valor_desconto_insumos: 0.00
  };

  // Formulário Configuração Taxas
  taxasForm = {
    operadora_padrao: 'Stone' as OperadoraCartao,
    regra_absorcao: 'PROPORCIONAL_COTA' as RegraAbsorcaoTaxa,
    taxa_debito_percentual: 1.19,
    taxa_credito_vista_percentual: 2.79,
    taxa_credito_parcelado_percentual: 4.39,
    taxa_pix_maquininha_percentual: 0.79
  };

  readonly relatorio = computed(() => this.repasseService.relatorioConsolidado());

  readonly parceirosFiltrados = computed(() => {
    const todos = this.relatorio().parceiros_resumo;
    const filtroId = this.repasseService.filtroParceiroId();
    if (filtroId === 'TODOS') return todos;
    return todos.filter(p => p.id_parceiro === filtroId);
  });

  readonly totalBrutoFiltrado = computed(() => {
    return this.repasseService.vendasFiltradas().reduce((acc, v) => acc + v.valor_bruto, 0);
  });

  readonly totalTaxasFiltrado = computed(() => {
    return this.repasseService.vendasFiltradas().reduce((acc, v) => acc + v.valor_taxa_operadora, 0);
  });

  readonly totalInsumosFiltrado = computed(() => {
    return this.repasseService.vendasFiltradas().reduce((acc, v) => acc + v.valor_desconto_insumos, 0);
  });

  readonly totalCotaFiltrado = computed(() => {
    return this.repasseService.vendasFiltradas().reduce((acc, v) => acc + v.valor_cota_empresa, 0);
  });

  readonly totalLiquidoFiltrado = computed(() => {
    return this.repasseService.vendasFiltradas().reduce((acc, v) => acc + v.valor_liquido_parceiro, 0);
  });

  // Estimativas em tempo real no formulário
  readonly estimativaTaxaOperadora = computed(() => {
    const config = this.repasseService.configTaxas();
    const forma = this.novaVendaForm.forma_pagamento;
    let perc = 0;
    if (forma === 'CARTAO_DEBITO') perc = config.taxa_debito_percentual;
    else if (forma === 'CARTAO_CREDITO_VISTA') perc = config.taxa_credito_vista_percentual;
    else if (forma === 'CARTAO_CREDITO_PARCELADO') perc = config.taxa_credito_parcelado_percentual;
    else if (forma === 'PIX_MAQUININHA') perc = config.taxa_pix_maquininha_percentual;
    return (this.novaVendaForm.valor_bruto * perc) / 100;
  });

  readonly estimativaLiquidoParceiro = computed(() => {
    const parceiro = this.financeState.parceiros().find(p => p.id === this.novaVendaForm.id_parceiro);
    const percParceiro = parceiro ? parceiro.percentual_padrao_parceiro : 55;
    const taxa = this.estimativaTaxaOperadora();
    const insumos = this.novaVendaForm.valor_desconto_insumos || 0;
    const base = Math.max(0, this.novaVendaForm.valor_bruto - taxa - insumos);
    return (base * percParceiro) / 100;
  });

  readonly estimativaCotaSalao = computed(() => {
    const parceiro = this.financeState.parceiros().find(p => p.id === this.novaVendaForm.id_parceiro);
    const percEmpresa = parceiro ? parceiro.percentual_padrao_empresa : 45;
    const taxa = this.estimativaTaxaOperadora();
    const insumos = this.novaVendaForm.valor_desconto_insumos || 0;
    const base = Math.max(0, this.novaVendaForm.valor_bruto - taxa - insumos);
    return (base * percEmpresa) / 100;
  });

  abrirDemonstrativo(parceiro: ResumoRepasseParceiro) {
    this.parceiroDemonstrativo.set(parceiro);
  }

  async executarTransferenciaPix(parceiro: ResumoRepasseParceiro): Promise<void> {
    const confirmou = await this.confirmDialog.confirmFinancial(
      'Confirmar Liquidação de Repasse PIX',
      `Confirma a liquidação do repasse de R$ ${parceiro.valor_liquido_transferir.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} para a chave PIX de ${parceiro.nome_parceiro}?`,
      {
        highlightItem: {
          title: parceiro.nome_parceiro,
          subtitle: `Chave PIX: ${parceiro.chave_pix}`,
          badge: `Líquido: R$ ${parceiro.valor_liquido_transferir.toFixed(2)}`
        },
        details: [
          { label: 'CNPJ MEI', value: parceiro.cnpj_mei },
          { label: 'Total Bruto Vendas', value: `R$ ${parceiro.total_bruto_vendas.toFixed(2)}` },
          { label: 'Cota Salão Retida', value: `R$ ${parceiro.valor_cota_salao_total.toFixed(2)}` }
        ],
        confirmText: 'Realizar Pagamento PIX'
      }
    );

    if (!confirmou) return;

    this.repasseService.confirmarTransferenciaPix(parceiro.id_parceiro);
    this.toastMensagem.set(`PIX de R$ ${parceiro.valor_liquido_transferir.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} liquidado com sucesso para ${parceiro.nome_parceiro}.`);
    
    // Se o modal estiver aberto, atualiza o item
    if (this.parceiroDemonstrativo()?.id_parceiro === parceiro.id_parceiro) {
      const atualizado = this.relatorio().parceiros_resumo.find(p => p.id_parceiro === parceiro.id_parceiro);
      if (atualizado) this.parceiroDemonstrativo.set(atualizado);
    }

    setTimeout(() => this.toastMensagem.set(null), 5000);
  }

  copiarChavePix(chave: string) {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(chave);
      this.toastMensagem.set(`Chave PIX "${chave}" copiada para a área de transferência.`);
      setTimeout(() => this.toastMensagem.set(null), 4000);
    }
  }

  imprimirComprovante() {
    window.print();
  }

  async baixarPdfComprovante(): Promise<void> {
    const parceiro = this.parceiroDemonstrativo();
    if (parceiro) {
      const confirmou = await this.confirmDialog.confirmExport(
        'PDF',
        `Comprovante Analítico de Repasse de ${parceiro.nome_parceiro}`,
        {
          details: [
            { label: 'Profissional MEI', value: parceiro.nome_parceiro },
            { label: 'Valor Líquido Apurado', value: `R$ ${parceiro.valor_liquido_transferir.toFixed(2)}` }
          ]
        }
      );
      if (confirmou) {
        this.pdfExport.exportarComprovanteRepassePDF(parceiro);
        this.toastMensagem.set(`PDF Analítico de Repasse gerado com sucesso!`);
        setTimeout(() => this.toastMensagem.set(null), 4000);
      }
    }
  }

  async baixarPdfComprovanteLiquidoModal(): Promise<void> {
    const parceiro = this.parceiroDemonstrativo();
    if (parceiro) {
      const confirmou = await this.confirmDialog.confirmExport(
        'PDF',
        `Comprovante Focado no Líquido de ${parceiro.nome_parceiro}`,
        {
          details: [
            { label: 'Profissional MEI', value: parceiro.nome_parceiro },
            { label: 'Cota Líquida MEI', value: `R$ ${parceiro.valor_liquido_transferir.toFixed(2)}` }
          ]
        }
      );
      if (confirmou) {
        this.pdfExport.exportarComprovanteLiquidoTransparenciaPDF(parceiro);
        this.toastMensagem.set(`Comprovante de Transparência Fiscal (Foco no Líquido - Lei 13.352) baixado em PDF.`);
        setTimeout(() => this.toastMensagem.set(null), 4000);
      }
    }
  }

  async baixarPdfComprovanteParceiro(parceiro: ResumoRepasseParceiro): Promise<void> {
    const confirmou = await this.confirmDialog.confirmExport(
      'PDF',
      `Comprovante Analítico de Repasse de ${parceiro.nome_parceiro}`,
      {
        details: [
          { label: 'Profissional MEI', value: parceiro.nome_parceiro },
          { label: 'Cota Líquida MEI', value: `R$ ${parceiro.valor_liquido_transferir.toFixed(2)}` }
        ]
      }
    );
    if (confirmou) {
      this.pdfExport.exportarComprovanteRepassePDF(parceiro);
      this.toastMensagem.set(`Comprovante Analítico de Repasse de ${parceiro.nome_parceiro} baixado em PDF.`);
      setTimeout(() => this.toastMensagem.set(null), 4000);
    }
  }

  async baixarPdfComprovanteLiquidoParceiro(parceiro: ResumoRepasseParceiro): Promise<void> {
    const confirmou = await this.confirmDialog.confirmExport(
      'PDF',
      `Comprovante de Transparência Fiscal de ${parceiro.nome_parceiro}`,
      {
        details: [
          { label: 'Profissional MEI', value: parceiro.nome_parceiro },
          { label: 'Cota Líquida MEI', value: `R$ ${parceiro.valor_liquido_transferir.toFixed(2)}` }
        ]
      }
    );
    if (confirmou) {
      this.pdfExport.exportarComprovanteLiquidoTransparenciaPDF(parceiro);
      this.toastMensagem.set(`Comprovante de Transparência Fiscal (Foco no Líquido - Lei 13.352) de ${parceiro.nome_parceiro} baixado em PDF.`);
      setTimeout(() => this.toastMensagem.set(null), 4000);
    }
  }

  salvarNovaVenda() {
    this.repasseService.adicionarVenda({
      codigo_comanda: this.novaVendaForm.codigo_comanda,
      id_parceiro: this.novaVendaForm.id_parceiro,
      nome_cliente: this.novaVendaForm.nome_cliente,
      servico_descricao: this.novaVendaForm.servico_descricao,
      categoria: this.novaVendaForm.categoria,
      valor_bruto: Number(this.novaVendaForm.valor_bruto),
      forma_pagamento: this.novaVendaForm.forma_pagamento,
      operadora: this.novaVendaForm.operadora,
      valor_desconto_insumos: Number(this.novaVendaForm.valor_desconto_insumos || 0)
    });

    this.abrirModalNovaVenda.set(false);
    this.toastMensagem.set(`Comanda processada com sucesso e repasse rateado!`);
    setTimeout(() => this.toastMensagem.set(null), 4000);

    // Limpa campos
    this.novaVendaForm.nome_cliente = '';
    this.novaVendaForm.servico_descricao = '';
    this.novaVendaForm.codigo_comanda = '';
    this.novaVendaForm.valor_bruto = 250.00;
  }

  salvarConfiguracaoTaxas() {
    this.repasseService.atualizarConfiguracaoTaxas({
      operadora_padrao: this.taxasForm.operadora_padrao,
      regra_absorcao: this.taxasForm.regra_absorcao,
      taxa_debito_percentual: Number(this.taxasForm.taxa_debito_percentual),
      taxa_credito_vista_percentual: Number(this.taxasForm.taxa_credito_vista_percentual),
      taxa_credito_parcelado_percentual: Number(this.taxasForm.taxa_credito_parcelado_percentual),
      taxa_pix_maquininha_percentual: Number(this.taxasForm.taxa_pix_maquininha_percentual)
    });

    this.abrirModalConfigTaxas.set(false);
    this.toastMensagem.set(`Taxas de operadora e regras de absorção atualizadas.`);
    setTimeout(() => this.toastMensagem.set(null), 4000);
  }

  async exportarCsvRepasses(): Promise<void> {
    const isDetalhe = this.abaAtiva() === 'DETALHE_VENDAS';
    const descricao = isDetalhe 
      ? 'Relatório Analítico de Vendas, Comandas e Deduções de Taxas'
      : 'Histórico Consolidado de Repasses e Rateio de Cotas MEI';

    const confirmou = await this.confirmDialog.confirmExport(
      'CSV',
      descricao,
      {
        details: [
          { label: 'Formato', value: 'CSV (Microsoft Excel / Google Planilhas)' },
          { label: 'Visualização', value: isDetalhe ? 'Analítico por Comanda' : 'Consolidado por Profissional' }
        ]
      }
    );

    if (confirmou) {
      if (isDetalhe) {
        this.csvExport.exportarHistoricoAnaliticoVendasCSV();
        this.toastMensagem.set(`Relatório analítico de vendas exportado em CSV.`);
      } else {
        this.csvExport.exportarHistoricoCompletoRepassesCSV();
        this.toastMensagem.set(`Histórico de repasses consolidado exportado em CSV.`);
      }
      setTimeout(() => this.toastMensagem.set(null), 4000);
    }
  }

  async exportarXmlRepasses(): Promise<void> {
    const confirmou = await this.confirmDialog.confirmExport(
      'XML',
      'Integração Contábil Completa & Lote NFS-e Lei 13.352 (XML)',
      {
        details: [
          { label: 'Formato', value: 'XML (Padrão ABRASF 2.04 & Integração Contábil)' },
          { label: 'Escrituração', value: 'Importação automática em ERPs contábeis tradicionais' },
          { label: 'Segregação', value: 'Cota do salão, repasses MEI, taxas e retenções apuradas' }
        ]
      }
    );

    if (confirmou) {
      try {
        this.xmlExport.exportarIntegracaoContabilXml();
        this.toastMensagem.set(`Arquivo XML de integração contábil gerado e baixado.`);
        setTimeout(() => this.toastMensagem.set(null), 4000);
      } catch (err) {
        console.error('Erro ao exportar XML contábil:', err);
      }
    }
  }
}
