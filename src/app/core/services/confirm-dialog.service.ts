import { Injectable, signal } from '@angular/core';
import { ConfirmDialogOptions, ConfirmDialogType } from '../models/confirm-dialog.model';

@Injectable({
  providedIn: 'root'
})
export class ConfirmDialogService {
  readonly isOpen = signal<boolean>(false);
  readonly options = signal<ConfirmDialogOptions | null>(null);

  private resolver: ((value: boolean) => void) | null = null;

  /**
   * Abre o modal de confirmação retornando uma Promise<boolean>.
   * Resolve `true` se o usuário confirmou e `false` se cancelou ou fechou.
   */
  confirm(options: ConfirmDialogOptions): Promise<boolean> {
    this.options.set({
      type: 'warning',
      confirmText: 'Confirmar Ação',
      cancelText: 'Cancelar',
      ...options
    });
    this.isOpen.set(true);

    return new Promise<boolean>((resolve) => {
      this.resolver = resolve;
    });
  }

  /**
   * Helper para ações destrutivas (exclusões, exclusão de sócio, reset de dados)
   */
  confirmDestructive(
    title: string,
    message: string,
    extraOptions: Partial<ConfirmDialogOptions> = {}
  ): Promise<boolean> {
    return this.confirm({
      title,
      message,
      type: 'danger',
      icon: 'delete_forever',
      confirmText: 'Sim, Excluir',
      cancelText: 'Voltar',
      badgeText: 'Operação Destrutiva',
      riskWarning: 'Esta ação não poderá ser desfeita após a confirmação.',
      ...extraOptions
    });
  }

  /**
   * Helper para exportação de dados (CSV, PDF, XML, DASN)
   */
  confirmExport(
    formato: 'CSV' | 'PDF' | 'XML' | 'DASN',
    descricaoArquivo: string,
    extraOptions: Partial<ConfirmDialogOptions> = {}
  ): Promise<boolean> {
    const iconMap: Record<string, string> = {
      CSV: 'table_view',
      PDF: 'picture_as_pdf',
      XML: 'code',
      DASN: 'download'
    };

    return this.confirm({
      title: `Confirmar Exportação em ${formato}`,
      message: `Você deseja gerar e fazer o download do arquivo de ${descricaoArquivo}?`,
      type: 'export',
      icon: iconMap[formato] || 'file_download',
      confirmText: `Exportar ${formato}`,
      cancelText: 'Cancelar',
      badgeText: `Exportação ${formato}`,
      securityNote: 'O arquivo exportado conterá dados contábeis/fiscais e de rateio da empresa. Mantenha os arquivos em local seguro.',
      ...extraOptions
    });
  }

  /**
   * Helper para operações financeiras críticas (pagamentos PIX, liquidação de cotas)
   */
  confirmFinancial(
    title: string,
    message: string,
    extraOptions: Partial<ConfirmDialogOptions> = {}
  ): Promise<boolean> {
    return this.confirm({
      title,
      message,
      type: 'financial',
      icon: 'payments',
      confirmText: 'Confirmar Pagamento',
      cancelText: 'Cancelar',
      badgeText: 'Operação Financeira',
      riskWarning: 'O status do fechamento será atualizado para Liquidado (PIX Concluído).',
      ...extraOptions
    });
  }

  /**
   * Helper para emissão / transmissão fiscal (NFS-e em lote ou individual)
   */
  confirmFiscal(
    title: string,
    message: string,
    extraOptions: Partial<ConfirmDialogOptions> = {}
  ): Promise<boolean> {
    return this.confirm({
      title,
      message,
      type: 'warning',
      icon: 'receipt_long',
      confirmText: 'Confirmar Transmissão',
      cancelText: 'Cancelar',
      badgeText: 'Operação Fiscal',
      securityNote: 'As informações serão sincronizadas com o Ambiente Nacional da NFS-e / Prefeitura.',
      ...extraOptions
    });
  }

  /**
   * Chamado pelo componente de modal ao clicar em Confirmar
   */
  onConfirm(): void {
    this.close(true);
  }

  /**
   * Chamado pelo componente de modal ao clicar em Cancelar ou no backdrop/ESC
   */
  onCancel(): void {
    this.close(false);
  }

  private close(result: boolean): void {
    this.isOpen.set(false);
    this.options.set(null);
    if (this.resolver) {
      const res = this.resolver;
      this.resolver = null;
      res(result);
    }
  }
}
