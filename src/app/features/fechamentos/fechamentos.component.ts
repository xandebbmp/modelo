import { ChangeDetectionStrategy, Component, computed, inject, signal, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { FinanceStateService } from '../../core/services/finance-state.service';
import { PdfExportService } from '../../core/services/pdf-export.service';
import { XmlExportService } from '../../core/services/xml-export.service';
import { CnpjValidatorService } from '../../core/services/cnpj-validator.service';
import { ConfirmDialogService } from '../../core/services/confirm-dialog.service';
import { FechamentoMensal } from '../../core/models/fechamento.model';
import { GraficoFaturamentoRepassesComponent } from '../../shared/components/grafico-faturamento-repasses.component';
import { ModalConsultaCnpjComponent } from '../../shared/components/modal-consulta-cnpj.component';

@Component({
  selector: 'app-fechamentos',
  imports: [
    CommonModule, 
    FormsModule, 
    RouterLink, 
    MatIconModule, 
    GraficoFaturamentoRepassesComponent,
    ModalConsultaCnpjComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-6 animate-fade-in" id="fechamentos-page">
      
      <!-- CABEÇALHO DA PÁGINA -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 class="text-xl md:text-2xl font-bold text-app-text tracking-tight flex items-center gap-2">
            <mat-icon class="text-[#17324d] dark:text-blue-300">calculate</mat-icon>
            Fechamentos Mensais & Partilha de Cotas
          </h1>
          <p class="text-xs text-app-secondary mt-0.5">
            Cálculo das deduções de taxas de cartão, insumos, cota do salão e validação do CNPJ MEI ativo antes do repasse (Lei 13.352/2016).
          </p>
        </div>

        <div class="flex items-center gap-2 flex-wrap">
          <!-- BOTÃO CONSULTAR CNPJ RECEITA -->
          <button 
            type="button" 
            (click)="abrirConsultaCnpjGeral()"
            class="btn-secondary text-xs flex items-center gap-1.5"
            id="btn-consultar-cnpj-fechamento">
            <mat-icon class="text-sm text-blue-500">verified_user</mat-icon> 
            <span>Validar CNPJ MEI</span>
          </button>

          <!-- BOTÃO EXPORTAR LOTE XML (ABRASF/CONTABILIDADE) -->
          <button 
            type="button" 
            (click)="exportarLoteXmlNfse()"
            class="btn-secondary text-xs flex items-center gap-1.5 text-amber-800 dark:text-amber-200 border-amber-300 dark:border-amber-800 hover:bg-amber-50 dark:hover:bg-amber-950/40"
            id="btn-exportar-lote-xml-fechamentos"
            title="Exportar Lote de NFS-e em XML (Padrão ABRASF 2.04 / SPED Nacional para escrituração contábil)">
            <mat-icon class="text-sm text-amber-600 dark:text-amber-400">code</mat-icon>
            <span>Exportar Lote XML</span>
          </button>

          <!-- BOTÃO EXPORTAR RESUMO FISCAL A4 -->
          <button 
            type="button" 
            (click)="exportarResumoFiscal()"
            [disabled]="gerandoPdf()"
            class="btn-secondary text-xs flex items-center gap-1.5"
            id="btn-exportar-pdf-fechamentos"
            title="Exportar Resumo Fiscal Consolidado A4 (jsPDF)">
            @if (gerandoPdf()) {
              <mat-icon class="text-sm animate-spin">sync</mat-icon> 
              <span>Gerando PDF...</span>
            } @else {
              <mat-icon class="text-sm text-amber-500">picture_as_pdf</mat-icon> 
              <span>Exportar Resumo Fiscal</span>
            }
          </button>

          <a routerLink="/relatorio-repasse" class="btn-primary text-xs bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-700">
            <mat-icon class="text-sm">payments</mat-icon> Relatório Analítico de Repasses
          </a>
        </div>
      </div>

      <!-- ALERTA INFORMATIVO DE SEGURANÇA FISCAL -->
      <div class="p-3.5 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 flex items-start gap-3 text-xs">
        <div class="p-2 rounded-xl bg-blue-100 dark:bg-blue-900 text-[#17324d] dark:text-blue-300 shrink-0">
          <mat-icon class="text-base">security</mat-icon>
        </div>
        <div class="flex-1">
          <span class="font-bold text-[#17324d] dark:text-blue-200 block">
            Garantia de CNPJ MEI Ativo e Regular antes do Repasse
          </span>
          <p class="text-app-secondary text-[11px] mt-0.5">
            O sistema valida automaticamente o algoritmo Módulo 11 da Receita Federal e a situação cadastral do CNPJ do parceiro. Repasses para MEIs inativos ou suspensos são bloqueados para evitar autuações e riscos de vínculo empregatício.
          </p>
        </div>
      </div>

      <!-- GRÁFICO COMPARATIVO MENSAL -->
      <app-grafico-faturamento-repasses></app-grafico-faturamento-repasses>

      <!-- CARDS DE TOTAIS -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div class="card-corporate p-4">
          <span class="text-[10px] uppercase font-bold text-app-muted block">Produção Total Bruta</span>
          <span class="text-xl font-bold font-mono text-app-text mt-1 block">
            R$ {{ financeState.totalProducaoBrutaMes() | number:'1.2-2' }}
          </span>
          <span class="text-[10px] text-app-muted mt-1 block">Comandas e Serviços</span>
        </div>

        <div class="card-corporate p-4">
          <span class="text-[10px] uppercase font-bold text-app-muted block">Cota Total Retida do Salão</span>
          <span class="text-xl font-bold font-mono text-[#b66a3c] mt-1 block">
            R$ {{ financeState.totalCotaSalaoMes() | number:'1.2-2' }}
          </span>
          <span class="text-[10px] text-app-muted mt-1 block">Base PGDAS-D (Simples Nacional)</span>
        </div>

        <div class="card-corporate p-4">
          <span class="text-[10px] uppercase font-bold text-app-muted block">Total Líquido Repassado</span>
          <span class="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1 block">
            R$ {{ financeState.totalRepassesMeiMes() | number:'1.2-2' }}
          </span>
          <span class="text-[10px] text-emerald-600 mt-1 block font-semibold">Dedução Lei 13.352/2016</span>
        </div>
      </div>

      <!-- TABELA DE FECHAMENTOS -->
      <div class="card-corporate overflow-hidden">
        <div class="p-4 border-b border-app flex items-center justify-between flex-wrap gap-2">
          <div class="flex items-center gap-2">
            <span class="font-bold text-xs text-app-text">Ordens de Fechamento & Repasses</span>
            <span class="px-2 py-0.5 rounded-full text-[10px] bg-slate-100 dark:bg-slate-800 text-app-secondary border border-app font-mono">
              Competência 08/2026
            </span>
          </div>
          <span class="text-[11px] text-app-muted">Validação de CNPJ Ativo em tempo real</span>
        </div>

        <div class="overflow-x-auto">
          <table class="table-corporate text-xs">
            <thead>
              <tr>
                <th>Mês/Ano</th>
                <th>Profissional Parceiro</th>
                <th>Status CNPJ MEI</th>
                <th>Bruto Produzido</th>
                <th>Descontos</th>
                <th>Cota Salão</th>
                <th>Líquido Repasse</th>
                <th>Status NFS-e & Repasse</th>
                <th class="text-right">Ações de Repasse</th>
              </tr>
            </thead>
            <tbody>
              @for (f of financeState.fechamentos(); track f.id) {
                @let parceiro = getParceiro(f.id_parceiro);
                <tr>
                  <td class="font-bold text-app-text">
                    {{ f.mes_referencia | number:'2.0-0' }}/{{ f.ano_referencia }}
                  </td>
                  <td>
                    <span class="font-bold text-app-text block">{{ parceiro?.nome_fantasia || parceiro?.razao_social || 'Profissional' }}</span>
                    <span class="font-mono text-[10px] text-app-muted">{{ parceiro?.cnpj }}</span>
                  </td>
                  <td>
                    <button 
                      type="button" 
                      (click)="consultarCnpjParceiro(parceiro?.cnpj || '')"
                      class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border transition-all cursor-pointer"
                      [class.bg-emerald-50]="parceiro?.status_mei === 'ATIVO_REGULAR'"
                      [class.dark:bg-emerald-950/60]="parceiro?.status_mei === 'ATIVO_REGULAR'"
                      [class.text-emerald-700]="parceiro?.status_mei === 'ATIVO_REGULAR'"
                      [class.dark:text-emerald-300]="parceiro?.status_mei === 'ATIVO_REGULAR'"
                      [class.border-emerald-300]="parceiro?.status_mei === 'ATIVO_REGULAR'"
                      [class.bg-red-50]="parceiro?.status_mei !== 'ATIVO_REGULAR'"
                      [class.text-red-700]="parceiro?.status_mei !== 'ATIVO_REGULAR'"
                      [class.border-red-300]="parceiro?.status_mei !== 'ATIVO_REGULAR'"
                      title="Clique para consultar na Receita Federal">
                      <mat-icon class="text-xs">
                        {{ parceiro?.status_mei === 'ATIVO_REGULAR' ? 'check_circle' : 'warning' }}
                      </mat-icon>
                      <span>{{ parceiro?.status_mei === 'ATIVO_REGULAR' ? 'CNPJ Ativo' : 'Verificar' }}</span>
                    </button>
                  </td>
                  <td class="font-mono text-app-text font-semibold">
                    R$ {{ f.valor_bruto_producao | number:'1.2-2' }}
                  </td>
                  <td class="font-mono text-red-500">
                    - R$ {{ (f.valor_taxas_cartao_descontadas + f.valor_insumos_descontados) | number:'1.2-2' }}
                  </td>
                  <td class="font-mono text-[#b66a3c] font-semibold">
                    R$ {{ f.valor_cota_empresa | number:'1.2-2' }}
                  </td>
                  <td class="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    R$ {{ f.valor_liquido_nota | number:'1.2-2' }}
                  </td>
                  <td>
                    @if (f.status === 'PAGO') {
                      <span class="status-badge status-badge-success text-[10px]">PIX Liquidado</span>
                    } @else if (f.status === 'NOTA_EMITIDA') {
                      <span class="status-badge status-badge-success text-[10px]">NFS-e Emitida</span>
                    } @else {
                      <span class="status-badge status-badge-warning text-[10px]">Pendente NFS-e</span>
                    }
                  </td>
                  <td class="text-right">
                    <div class="flex items-center justify-end gap-1.5">
                      <button 
                        type="button" 
                        (click)="exportarComprovanteLiquidoIndividual(f)"
                        class="p-1.5 rounded-lg border border-emerald-300 dark:border-emerald-700 bg-emerald-50/50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 transition-all"
                        title="Baixar Comprovante Focado no Valor Líquido (Normas de Transparência da Lei 13.352/2016)">
                        <mat-icon class="text-sm text-emerald-600 dark:text-emerald-400">verified</mat-icon>
                      </button>

                      <button 
                        type="button" 
                        (click)="exportarComprovanteIndividual(f)"
                        class="p-1.5 rounded-lg border border-app text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                        title="Baixar Comprovante de Repasse Analítico em PDF (A4)">
                        <mat-icon class="text-sm text-red-500">picture_as_pdf</mat-icon>
                      </button>

                      <button 
                        type="button" 
                        (click)="exportarNfseIndividualXml(f)"
                        class="p-1.5 rounded-lg border border-amber-300 dark:border-amber-700 bg-amber-50/60 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 hover:bg-amber-100 transition-all"
                        title="Baixar Arquivo XML da NFS-e de Repasse (Padrão ABRASF/Contabilidade)">
                        <mat-icon class="text-sm text-amber-600 dark:text-amber-400">code</mat-icon>
                      </button>

                      @if (f.status === 'PENDENTE_EMISSAO') {
                        <button 
                          type="button" 
                          (click)="processarEmissaoNfseComValidacao(f)"
                          class="btn-primary py-1 px-2.5 text-xs flex items-center gap-1">
                          <mat-icon class="text-xs">touch_app</mat-icon> 
                          <span>Emitir NFS-e</span>
                        </button>
                      } @else if (f.status === 'NOTA_EMITIDA') {
                        <button 
                          type="button" 
                          (click)="processarPagamentoPixComValidacao(f)"
                          class="btn-accent py-1 px-2.5 text-xs flex items-center gap-1">
                          <mat-icon class="text-xs">pix</mat-icon> 
                          <span>Pagar PIX</span>
                        </button>
                      } @else {
                        <span class="text-[11px] text-emerald-600 font-bold inline-flex items-center gap-1 px-2 py-0.5">
                          <mat-icon class="text-xs">task_alt</mat-icon> Liquidado
                        </span>
                      }
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>

      <!-- MODAL DE CONSULTA DE CNPJ -->
      @if (exibirModalCnpj()) {
        <app-modal-consulta-cnpj></app-modal-consulta-cnpj>
      }

      <!-- MODAL DE ALERTA DE CNPJ BLOQUEADO / INATIVO -->
      @if (alertaBloqueio()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fade-in">
          <div class="relative w-full max-w-md bg-surface border border-red-300 dark:border-red-800 rounded-2xl shadow-2xl p-6 space-y-4">
            <div class="flex items-center gap-3">
              <div class="p-2.5 rounded-xl bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300">
                <mat-icon class="text-xl">gpp_bad</mat-icon>
              </div>
              <div>
                <h3 class="font-bold text-base text-red-700 dark:text-red-300">Repasse Bloqueado por Segurança</h3>
                <span class="text-[11px] text-app-secondary">Conformidade Fiscal Lei 13.352/2016</span>
              </div>
            </div>

            <p class="text-xs text-app-text leading-relaxed">
              {{ alertaBloqueio() }}
            </p>

            <div class="pt-3 border-t border-app flex justify-end gap-2">
              <button 
                type="button" 
                (click)="alertaBloqueio.set(null)" 
                class="btn-secondary py-1.5 px-4 text-xs">
                Entendido
              </button>
            </div>
          </div>
        </div>
      }

    </div>
  `
})
export class FechamentosComponent {
  readonly financeState = inject(FinanceStateService);
  readonly pdfExportService = inject(PdfExportService);
  readonly xmlExportService = inject(XmlExportService);
  readonly cnpjValidator = inject(CnpjValidatorService);
  readonly confirmDialog = inject(ConfirmDialogService);

  readonly gerandoPdf = signal<boolean>(false);
  readonly exibirModalCnpj = signal<boolean>(false);
  readonly alertaBloqueio = signal<string | null>(null);

  readonly modalConsultaCnpjComponent = viewChild(ModalConsultaCnpjComponent);

  getParceiro(idParceiro: string) {
    return this.financeState.parceiros().find(item => item.id === idParceiro);
  }

  consultarCnpjParceiro(cnpj: string) {
    this.exibirModalCnpj.set(true);
    setTimeout(() => {
      this.modalConsultaCnpjComponent()?.abrirComCnpj(cnpj);
    }, 50);
  }

  abrirConsultaCnpjGeral() {
    this.exibirModalCnpj.set(true);
  }

  async processarEmissaoNfseComValidacao(fechamento: FechamentoMensal) {
    const parceiro = this.getParceiro(fechamento.id_parceiro);
    if (!parceiro) return;

    // Validação do CNPJ antes de emitir NFS-e
    const validacao = this.cnpjValidator.podeProcessarRepasse(parceiro.cnpj);
    if (!validacao.apto) {
      this.alertaBloqueio.set(
        `Não foi possível emitir a NFS-e para ${parceiro.nome_fantasia}. Motivo: ${validacao.motivo}. ` +
        `Regularize o cadastro do MEI na Receita Federal antes de continuar.`
      );
      return;
    }

    const confirmou = await this.confirmDialog.confirmFiscal(
      'Emitir NFS-e Nacional para Profissional Parceiro',
      `Confirma a emissão da NFS-e para ${parceiro.nome_fantasia} no valor de R$ ${fechamento.valor_liquido_nota.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} referente à competência ${fechamento.mes_referencia}/${fechamento.ano_referencia}?`,
      {
        highlightItem: {
          title: parceiro.nome_fantasia,
          subtitle: `CNPJ MEI: ${parceiro.cnpj}`,
          badge: `Líquido: R$ ${fechamento.valor_liquido_nota.toFixed(2)}`
        },
        details: [
          { label: 'Cota Salão', value: `R$ ${fechamento.valor_cota_empresa.toFixed(2)}` },
          { label: 'Taxas Cartão', value: `R$ ${fechamento.valor_taxas_cartao_descontadas.toFixed(2)}` }
        ],
        confirmText: 'Sim, Emitir NFS-e'
      }
    );

    if (confirmou) {
      this.financeState.emitirNotaFiscalMei1Clique(fechamento.id);
    }
  }

  async processarPagamentoPixComValidacao(fechamento: FechamentoMensal) {
    const parceiro = this.getParceiro(fechamento.id_parceiro);
    if (!parceiro) return;

    // Validação do CNPJ antes de liquidar o repasse
    const validacao = this.cnpjValidator.podeProcessarRepasse(parceiro.cnpj);
    if (!validacao.apto) {
      this.alertaBloqueio.set(
        `Pagamento PIX bloqueado para ${parceiro.nome_fantasia}. Motivo: ${validacao.motivo}. ` +
        `O repasse de cota exige que o profissional parceiro possua CNPJ MEI ativo.`
      );
      return;
    }

    const confirmou = await this.confirmDialog.confirmFinancial(
      'Confirmar Transferência e Pagamento PIX',
      `Confirma a liquidação do repasse financeiro de R$ ${fechamento.valor_liquido_nota.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} para a chave PIX do profissional parceiro?`,
      {
        highlightItem: {
          title: parceiro.nome_fantasia,
          subtitle: `Chave PIX: ${parceiro.chave_pix_padrao || parceiro.cnpj}`,
          badge: `R$ ${fechamento.valor_liquido_nota.toFixed(2)}`
        },
        details: [
          { label: 'Favorecido MEI', value: parceiro.razao_social },
          { label: 'CNPJ do Prestador', value: parceiro.cnpj },
          { label: 'Nota Fiscal', value: fechamento.numero_nota_mei || 'Autorizada' }
        ],
        confirmText: 'Sim, Realizar Repasse PIX'
      }
    );

    if (confirmou) {
      this.financeState.confirmarPagamentoRepassePix(fechamento.id);
    }
  }

  async exportarComprovanteIndividual(fechamento: FechamentoMensal) {
    const parceiro = this.getParceiro(fechamento.id_parceiro);
    const confirmou = await this.confirmDialog.confirmExport(
      'PDF',
      `Comprovante Analítico de Repasse de ${parceiro?.nome_fantasia || 'Parceiro'}`,
      {
        details: [
          { label: 'Tipo de Documento', value: 'Comprovante Timbrado Analítico A4' },
          { label: 'Competência', value: `${fechamento.mes_referencia}/${fechamento.ano_referencia}` },
          { label: 'Valor Líquido', value: `R$ ${fechamento.valor_liquido_nota.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` }
        ]
      }
    );

    if (confirmou) {
      try {
        this.pdfExportService.exportarComprovanteFechamentoMensalPDF(fechamento);
      } catch (err) {
        console.error('Erro ao exportar comprovante de repasse analítico:', err);
      }
    }
  }

  async exportarComprovanteLiquidoIndividual(fechamento: FechamentoMensal) {
    const parceiro = this.getParceiro(fechamento.id_parceiro);
    const confirmou = await this.confirmDialog.confirmExport(
      'PDF',
      `Comprovante Focado no Líquido de ${parceiro?.nome_fantasia || 'Parceiro'}`,
      {
        details: [
          { label: 'Tipo de Documento', value: 'Recibo Simplificado de Repasse Líquido' },
          { label: 'Competência', value: `${fechamento.mes_referencia}/${fechamento.ano_referencia}` },
          { label: 'Valor Líquido', value: `R$ ${fechamento.valor_liquido_nota.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` }
        ]
      }
    );

    if (confirmou) {
      try {
        this.pdfExportService.exportarComprovanteLiquidoFechamentoPDF(fechamento);
      } catch (err) {
        console.error('Erro ao exportar comprovante de repasse focado no líquido:', err);
      }
    }
  }

  async exportarResumoFiscal() {
    const confirmou = await this.confirmDialog.confirmExport(
      'PDF',
      'Resumo Fiscal Consolidado da Empresa (Simples Nacional & Lei 13.352)',
      {
        details: [
          { label: 'Documento', value: 'Relatório Fiscal Timbrado em Formato A4' },
          { label: 'Competência', value: 'Agosto/2026' },
          { label: 'Conteúdo', value: 'Base de cálculo segregada, deduções legais e bitributação evitada' }
        ]
      }
    );

    if (confirmou) {
      this.gerandoPdf.set(true);
      setTimeout(() => {
        try {
          this.pdfExportService.exportarResumoFiscalA4('Agosto/2026');
        } catch (err) {
          console.error('Erro ao gerar relatório fiscal:', err);
        } finally {
          this.gerandoPdf.set(false);
        }
      }, 200);
    }
  }

  async exportarLoteXmlNfse() {
    const confirmou = await this.confirmDialog.confirmExport(
      'XML',
      'Lote Consolidado de NFS-e (Padrão ABRASF 2.04 / SPED Contábil)',
      {
        details: [
          { label: 'Formato', value: 'XML (Lote RPS / NFS-e ABRASF 2.04)' },
          { label: 'Competência', value: 'Agosto/2026' },
          { label: 'Total de Notas', value: `${this.financeState.fechamentos().length} declarações de repasse` },
          { label: 'Destino', value: 'Importação em sistemas contábeis (Domínio, Questor, Fortes, Contmatic)' }
        ]
      }
    );

    if (confirmou) {
      try {
        this.xmlExportService.exportarLoteNfseXml();
      } catch (err) {
        console.error('Erro ao exportar lote XML:', err);
      }
    }
  }

  async exportarNfseIndividualXml(fechamento: FechamentoMensal) {
    const parceiro = this.getParceiro(fechamento.id_parceiro);
    const confirmou = await this.confirmDialog.confirmExport(
      'XML',
      `Arquivo XML da NFS-e de ${parceiro?.nome_fantasia || 'Parceiro MEI'}`,
      {
        details: [
          { label: 'Formato', value: 'XML (NFS-e Padrão ABRASF)' },
          { label: 'Prestador (MEI)', value: parceiro?.razao_social || 'MEI' },
          { label: 'Valor do Repasse', value: `R$ ${fechamento.valor_liquido_nota.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` },
          { label: 'Competência', value: `${fechamento.mes_referencia}/${fechamento.ano_referencia}` }
        ]
      }
    );

    if (confirmou) {
      try {
        this.xmlExportService.exportarNfseIndividualXml(fechamento);
      } catch (err) {
        console.error('Erro ao exportar XML individual:', err);
      }
    }
  }
}
