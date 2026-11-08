import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { XmlNfseParserService, NfseExtraida } from '../../core/services/xml-nfse-parser.service';
import { FinanceStateService } from '../../core/services/finance-state.service';

@Component({
  selector: 'app-leitor-xml-nfse',
  imports: [CommonModule, FormsModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="card-corporate p-4 sm:p-6 space-y-6 shadow-sm border border-app" id="leitor-xml-nfse-widget">
      
      <!-- CABEÇALHO DO LEITOR XML -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-app">
        <div class="flex items-center gap-3">
          <div class="p-2.5 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
            <mat-icon class="text-2xl">code</mat-icon>
          </div>
          <div>
            <div class="flex items-center gap-2 flex-wrap">
              <h2 class="font-bold text-base sm:text-lg text-app-text flex items-center gap-1.5">
                Leitor e Importador Automático de XML de NFS-e
              </h2>
              <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                Padrão ABRASF & SEFAZ Nacional
              </span>
            </div>
            <p class="text-xs text-app-secondary mt-0.5">
              Faça upload dos arquivos XML das notas emitidas pelos profissionais MEI ou pelo salão. O sistema extrai automaticamente todos os dados fiscais e alimenta os fechamentos.
            </p>
          </div>
        </div>

        <!-- STATUS DE IMPORTAÇÃO RÁPIDO -->
        <div class="flex items-center gap-2">
          @if (notasProcessadas().length > 0) {
            <button 
              type="button" 
              (click)="limparArquivos()"
              class="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1">
              <mat-icon class="text-xs">clear_all</mat-icon>
              <span>Limpar Lista</span>
            </button>
          }
        </div>
      </div>

      <!-- MENSAGEM DE SUCESSO APÓS IMPORTAÇÃO -->
      @if (resultadoImportacao(); as res) {
        <div class="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 space-y-2 animate-fade-in">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2 font-bold text-sm">
              <mat-icon class="text-emerald-600">check_circle</mat-icon>
              <span>Importação Concluída com Sucesso!</span>
            </div>
            <button type="button" (click)="resultadoImportacao.set(null)" class="text-emerald-700 hover:text-emerald-900">
              <mat-icon class="text-xs">close</mat-icon>
            </button>
          </div>
          <p class="text-xs text-emerald-800 dark:text-emerald-300">
            Foram importadas <strong>{{ res.importadas }}</strong> notas fiscais, totalizando <strong>R$ {{ res.totalValor | number:'1.2-2' }}</strong>. Os dados de repasse aos MEIs e a base de cálculo do Simples Nacional já foram integrados ao painel.
          </p>
        </div>
      }

      <!-- ÁREA DE DROPZONE E UPLOAD DE XML -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        <!-- DROPZONE INTERATIVO -->
        <div 
          class="lg:col-span-2 border-2 border-dashed rounded-2xl p-6 text-center transition-all flex flex-col items-center justify-center cursor-pointer select-none"
          [class.border-indigo-500]="isDragging()"
          [class.bg-indigo-50/50]="isDragging()"
          [class.dark:bg-indigo-950/30]="isDragging()"
          [class.border-slate-300]="!isDragging()"
          [class.dark:border-slate-700]="!isDragging()"
          [class.bg-slate-50/50]="!isDragging()"
          [class.dark:bg-slate-900/40]="!isDragging()"
          (dragover)="onDragOver($event)"
          (dragleave)="onDragLeave($event)"
          (drop)="onDrop($event)"
          (click)="fileInput.click()">
          
          <input 
            #fileInput 
            type="file" 
            accept=".xml" 
            multiple 
            (change)="onFileSelected($event)" 
            class="hidden">

          <div class="p-3.5 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 mb-3 shadow-xs">
            <mat-icon class="text-3xl">cloud_upload</mat-icon>
          </div>

          <h3 class="font-bold text-sm sm:text-base text-app-text">
            Arraste os arquivos XML de NFS-e aqui
          </h3>
          <p class="text-xs text-app-secondary mt-1 max-w-md">
            Ou <span class="text-indigo-600 dark:text-indigo-400 font-semibold underline">clique para selecionar do seu computador</span>. Suporte a lotes com múltiplos arquivos de uma só vez (.xml).
          </p>

          <div class="flex items-center gap-3 mt-4 text-[11px] text-app-muted">
            <span class="flex items-center gap-1">
              <mat-icon class="text-xs text-emerald-600">check</mat-icon> ABRASF 1.0 & 2.0
            </span>
            <span class="flex items-center gap-1">
              <mat-icon class="text-xs text-emerald-600">check</mat-icon> Padrão Nacional SEFAZ
            </span>
            <span class="flex items-center gap-1">
              <mat-icon class="text-xs text-emerald-600">check</mat-icon> Pref. São Paulo / SP
            </span>
          </div>
        </div>

        <!-- MODELOS DE EXEMPLO PARA TESTE COM 1 CLIQUE -->
        <div class="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-app flex flex-col justify-between space-y-3">
          <div>
            <div class="flex items-center gap-1.5 font-bold text-xs text-app-text mb-1">
              <mat-icon class="text-sm text-indigo-600">bolt</mat-icon>
              <span>Testar com Modelos de XML Reais</span>
            </div>
            <p class="text-[11px] text-app-secondary">
              Não tem arquivos XML em mãos? Carregue nossos exemplos de teste para ver o extrator funcionando em tempo real:
            </p>
          </div>

          <div class="space-y-2">
            @for (mod of modelosExemplo; track mod.nome) {
              <button 
                type="button" 
                (click)="carregarExemploXml(mod)"
                class="w-full text-left p-2 rounded-xl border border-app bg-surface hover:border-indigo-300 dark:hover:border-indigo-700 transition-all text-xs flex items-center justify-between group">
                <div class="truncate pr-2">
                  <div class="font-bold text-app-text group-hover:text-indigo-600 dark:group-hover:text-indigo-300 truncate">
                    {{ mod.nome }}
                  </div>
                  <div class="text-[10px] text-app-muted truncate">{{ mod.descricao }}</div>
                </div>
                <mat-icon class="text-xs text-app-muted group-hover:text-indigo-600 transition-colors shrink-0">add_circle</mat-icon>
              </button>
            }
          </div>

          <button 
            type="button" 
            (click)="carregarTodosExemplos()"
            class="btn-secondary text-xs py-1.5 w-full flex items-center justify-center gap-1 text-indigo-600 dark:text-indigo-400 font-bold">
            <mat-icon class="text-xs">playlist_add</mat-icon>
            <span>Carregar Todos os Exemplos em Lote</span>
          </button>
        </div>

      </div>

      <!-- PAINEL DE NOTAS PROCESSADAS / PRÉ-VISUALIZAÇÃO DOS DADOS EXTRAÍDOS -->
      @if (notasProcessadas().length > 0) {
        <div class="space-y-4 animate-fade-in pt-2">
          
          <!-- CARDS DE TOTALIZADORES DOS XMLS PROCESSADOS -->
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div class="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-app">
              <span class="text-[11px] text-app-secondary block">Arquivos no Lote</span>
              <span class="font-mono font-black text-xl text-app-text">{{ totalNotasValidas() }}</span>
              <span class="text-[10px] text-app-muted block">notas prontas p/ importação</span>
            </div>

            <div class="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-app">
              <span class="text-[11px] text-app-secondary block">Faturamento Bruto Extraído</span>
              <span class="font-mono font-black text-lg text-emerald-600 dark:text-emerald-400">
                R$ {{ totalValorProcessado() | number:'1.2-2' }}
              </span>
              <span class="text-[10px] text-app-muted block">soma dos serviços declarados</span>
            </div>

            <div class="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-app">
              <span class="text-[11px] text-app-secondary block">Repasse Previsto aos MEIs</span>
              <span class="font-mono font-black text-lg text-blue-600 dark:text-blue-400">
                R$ {{ totalRepasseMeiCalculado() | number:'1.2-2' }}
              </span>
              <span class="text-[10px] text-app-muted block">cota-parte dos parceiros</span>
            </div>

            <div class="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-app">
              <span class="text-[11px] text-app-secondary block">Cota Salão (Base Simples)</span>
              <span class="font-mono font-black text-lg text-indigo-600 dark:text-indigo-400">
                R$ {{ totalCotaSalaoCalculada() | number:'1.2-2' }}
              </span>
              <span class="text-[10px] text-app-muted block">Lei 13.352/2016 dedutível</span>
            </div>
          </div>

          <!-- BARRA DE OPÇÕES E BOTÃO DE IMPORTAÇÃO -->
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800">
            <div class="flex items-center gap-4 flex-wrap text-xs">
              <label class="flex items-center gap-2 cursor-pointer font-medium text-app-text">
                <input 
                  type="checkbox" 
                  [(ngModel)]="criarParceirosNovos"
                  class="rounded text-indigo-600 focus:ring-indigo-500">
                <span>Cadastrar automaticamente novos parceiros MEI não localizados no sistema</span>
              </label>
            </div>

            <div class="flex items-center gap-2">
              <button 
                type="button" 
                (click)="executarImportacao()"
                [disabled]="totalNotasValidas() === 0"
                class="btn-primary text-xs py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-700 flex items-center gap-1.5 shadow-sm font-bold disabled:opacity-50">
                <mat-icon class="text-sm">system_update_alt</mat-icon>
                <span>Importar {{ totalNotasValidas() }} Notas no Sistema</span>
              </button>
            </div>
          </div>

          <!-- TABELA COM AS NOTAS EXTRAÍDAS -->
          <div class="border border-app rounded-xl overflow-hidden">
            <div class="overflow-x-auto">
              <table class="table-corporate text-xs">
                <thead>
                  <tr>
                    <th>NFS-e / Emissão</th>
                    <th>Prestador (MEI / Salão)</th>
                    <th>Tomador</th>
                    <th class="text-right">Valor do Serviço</th>
                    <th class="text-right">Repasse MEI</th>
                    <th class="text-center">Status / Validação</th>
                    <th class="text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  @for (n of notasProcessadas(); track n.id_temp) {
                    <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      
                      <!-- NFS-e e Data -->
                      <td class="whitespace-nowrap">
                        <span class="font-bold text-app-text block">NFS-e Nº {{ n.numero_nfse }}</span>
                        <span class="font-mono text-[10px] text-app-muted block">
                          {{ n.data_emissao | date:'dd/MM/yyyy HH:mm' }} • Série {{ n.serie }}
                        </span>
                      </td>

                      <!-- Prestador -->
                      <td>
                        <div class="flex items-center gap-1.5">
                          <span class="font-bold text-app-text truncate max-w-[200px] block" [title]="n.razao_social_prestador">
                            {{ n.razao_social_prestador }}
                          </span>
                        </div>
                        <div class="flex items-center gap-1 font-mono text-[10px] text-app-muted">
                          <span>CNPJ: {{ n.cnpj_prestador }}</span>
                          @if (n.nome_parceiro_vinculado) {
                            <span class="px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 text-[9px] font-bold">
                              ✓ Parceiro Vinculado
                            </span>
                          } @else if (n.tipo_operacao === 'PARCEIRO_PARA_EMPRESA') {
                            <span class="px-1.5 py-0.2 rounded bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200 text-[9px] font-bold">
                              + Novo Parceiro
                            </span>
                          }
                        </div>
                      </td>

                      <!-- Tomador -->
                      <td>
                        <span class="font-medium text-app-text truncate max-w-[170px] block">
                          {{ n.razao_social_tomador }}
                        </span>
                        <span class="font-mono text-[10px] text-app-muted block">
                          CNPJ/CPF: {{ n.cnpj_tomador }}
                        </span>
                      </td>

                      <!-- Valor do Serviço -->
                      <td class="text-right font-mono font-bold text-app-text whitespace-nowrap">
                        R$ {{ n.valor_total | number:'1.2-2' }}
                      </td>

                      <!-- Repasse Calculado -->
                      <td class="text-right font-mono font-bold text-blue-600 dark:text-blue-400 whitespace-nowrap">
                        R$ {{ n.repasse_mei_calculado | number:'1.2-2' }}
                        <span class="text-[10px] text-app-muted font-normal block">
                          ({{ n.percentual_repasse_aplicado }}% repasse)
                        </span>
                      </td>

                      <!-- Status / Validação -->
                      <td class="text-center whitespace-nowrap">
                        @if (n.status_validacao === 'VALIDA') {
                          <span class="status-badge status-badge-success text-[10px]">
                            ✓ Pronta
                          </span>
                        } @else if (n.status_validacao === 'ALERTA') {
                          <span class="status-badge status-badge-warning text-[10px]" [title]="n.avisos_validacao.join(' ')">
                            ! Atenção
                          </span>
                        } @else if (n.status_validacao === 'DUPLICADA') {
                          <span class="status-badge status-badge-neutral text-[10px]" title="Já cadastrada no sistema">
                            Duplicada
                          </span>
                        } @else {
                          <span class="status-badge status-badge-danger text-[10px]">
                            Erro XML
                          </span>
                        }
                      </td>

                      <!-- Ações -->
                      <td class="text-right whitespace-nowrap">
                        <div class="flex items-center justify-end gap-1">
                          <button 
                            type="button" 
                            (click)="abrirModalDetalhes(n)"
                            class="btn-secondary text-[11px] py-1 px-2 flex items-center gap-1"
                            title="Ver detalhes da extração e XML bruto">
                            <mat-icon class="text-xs">visibility</mat-icon>
                            <span>Detalhes</span>
                          </button>

                          <button 
                            type="button" 
                            (click)="removerNota(n.id_temp)"
                            class="p-1 rounded text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50"
                            title="Remover este arquivo">
                            <mat-icon class="text-xs">delete</mat-icon>
                          </button>
                        </div>
                      </td>

                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>

        </div>
      }

    </div>

    <!-- MODAL DE DETALHES DO XML EXTRAÍDO -->
    @if (notaDetalheModal(); as modalItem) {
      <div class="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
        <div class="card-corporate max-w-3xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto shadow-2xl">
          
          <div class="flex items-center justify-between border-b border-app pb-3">
            <div class="flex items-center gap-2">
              <div class="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                <mat-icon>data_object</mat-icon>
              </div>
              <div>
                <h3 class="font-bold text-base text-app-text">
                  Dados Estruturados Extraídos do XML
                </h3>
                <span class="text-xs text-app-muted font-mono">
                  Arquivo: {{ modalItem.nome_arquivo }} (NFS-e Nº {{ modalItem.numero_nfse }})
                </span>
              </div>
            </div>

            <button 
              type="button" 
              (click)="notaDetalheModal.set(null)"
              class="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-app-secondary">
              <mat-icon>close</mat-icon>
            </button>
          </div>

          <!-- QUADRO DE DETALHES -->
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
            <div class="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-app">
              <span class="text-[10px] text-app-muted block">Prestador (CNPJ):</span>
              <span class="font-bold text-app-text">{{ modalItem.razao_social_prestador }}</span>
              <span class="font-mono text-app-secondary block text-[10px]">{{ modalItem.cnpj_prestador }}</span>
            </div>

            <div class="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-app">
              <span class="text-[10px] text-app-muted block">Tomador (CNPJ/CPF):</span>
              <span class="font-bold text-app-text">{{ modalItem.razao_social_tomador }}</span>
              <span class="font-mono text-app-secondary block text-[10px]">{{ modalItem.cnpj_tomador }}</span>
            </div>

            <div class="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-app">
              <span class="text-[10px] text-app-muted block">Valor Total do Serviço:</span>
              <span class="font-bold font-mono text-base text-emerald-600 dark:text-emerald-400">
                R$ {{ modalItem.valor_total | number:'1.2-2' }}
              </span>
              <span class="text-[10px] text-app-muted block">ISS: R$ {{ modalItem.valor_iss | number:'1.2-2' }} ({{ modalItem.aliquota_iss }}%)</span>
            </div>
          </div>

          <!-- DISCRIMINAÇÃO DOS SERVIÇOS -->
          <div class="p-3.5 rounded-xl border border-app text-xs space-y-1.5">
            <span class="font-bold text-[10px] uppercase text-app-muted block">Discriminação Extraída dos Serviços</span>
            <div class="p-2.5 rounded-lg bg-surface font-sans text-app-text border border-app leading-relaxed">
              {{ modalItem.discriminacao_servicos }}
            </div>
          </div>

          <!-- XML BRUTO -->
          <div class="space-y-1 text-xs">
            <span class="font-bold text-[10px] uppercase text-app-muted block">Código XML Bruto Formatado</span>
            <pre class="p-3 rounded-xl bg-slate-900 text-slate-100 font-mono text-[11px] max-h-48 overflow-auto select-all border border-slate-800 leading-tight">{{ modalItem.xml_conteudo_bruto }}</pre>
          </div>

          <div class="flex justify-end pt-2 border-t border-app">
            <button 
              type="button" 
              (click)="notaDetalheModal.set(null)"
              class="btn-primary text-xs py-1.5 px-4">
              Fechar
            </button>
          </div>

        </div>
      </div>
    }
  `
})
export class LeitorXmlNfseComponent {
  private readonly parserService = inject(XmlNfseParserService);
  private readonly financeState = inject(FinanceStateService);

  readonly notasProcessadas = signal<NfseExtraida[]>([]);
  readonly isDragging = signal<boolean>(false);
  readonly criarParceirosNovos = true;
  readonly resultadoImportacao = signal<{ importadas: number; totalValor: number } | null>(null);
  readonly notaDetalheModal = signal<NfseExtraida | null>(null);

  readonly modelosExemplo = this.parserService.obterModelosExemploXml();

  readonly totalNotasValidas = computed(() => {
    return this.notasProcessadas().filter(n => n.status_validacao !== 'ERRO').length;
  });

  readonly totalValorProcessado = computed(() => {
    return this.notasProcessadas()
      .filter(n => n.status_validacao !== 'ERRO')
      .reduce((acc, n) => acc + n.valor_total, 0);
  });

  readonly totalRepasseMeiCalculado = computed(() => {
    return this.notasProcessadas()
      .filter(n => n.status_validacao !== 'ERRO')
      .reduce((acc, n) => acc + n.repasse_mei_calculado, 0);
  });

  readonly totalCotaSalaoCalculada = computed(() => {
    return this.notasProcessadas()
      .filter(n => n.status_validacao !== 'ERRO')
      .reduce((acc, n) => acc + n.cota_salao_calculada, 0);
  });

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);
  }

  async onDrop(event: DragEvent): Promise<void> {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);

    if (event.dataTransfer && event.dataTransfer.files.length > 0) {
      const files: File[] = Array.from(event.dataTransfer.files);
      await this.processarArquivos(files);
    }
  }

  async onFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const files: File[] = Array.from(input.files);
      await this.processarArquivos(files);
      input.value = '';
    }
  }

  async processarArquivos(files: File[]): Promise<void> {
    const extraidas = await this.parserService.processarArquivosXml(files);
    this.notasProcessadas.update(atuais => [...atuais, ...extraidas]);
  }

  carregarExemploXml(modelo: { nome: string; descricao: string; conteudo: string }): void {
    const extraida = this.parserService.parseXmlString(
      modelo.conteudo, 
      `${modelo.nome.toLowerCase().replace(/\s+/g, '_')}.xml`, 
      modelo.conteudo.length
    );
    this.notasProcessadas.update(atuais => [...atuais, extraida]);
  }

  carregarTodosExemplos(): void {
    const todos = this.modelosExemplo.map(mod => 
      this.parserService.parseXmlString(mod.conteudo, `${mod.nome.toLowerCase().replace(/\s+/g, '_')}.xml`, mod.conteudo.length)
    );
    this.notasProcessadas.update(atuais => [...atuais, ...todos]);
  }

  removerNota(idTemp: string): void {
    this.notasProcessadas.update(lista => lista.filter(n => n.id_temp !== idTemp));
  }

  limparArquivos(): void {
    this.notasProcessadas.set([]);
    this.resultadoImportacao.set(null);
  }

  abrirModalDetalhes(item: NfseExtraida): void {
    this.notaDetalheModal.set(item);
  }

  executarImportacao(): void {
    const notasParaImportar = this.notasProcessadas();
    if (notasParaImportar.length === 0) return;

    const res = this.parserService.importarNotasNoSistema(notasParaImportar, this.criarParceirosNovos);
    this.resultadoImportacao.set(res);
    this.notasProcessadas.set([]);
  }
}
