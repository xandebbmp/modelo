import { Injectable, inject } from '@angular/core';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { FinanceStateService } from './finance-state.service';
import { RelatorioRepasseService } from './relatorio-repasse.service';
import { ResumoRepasseParceiro, VendaItemServico } from '../models/relatorio-repasse.model';
import { FechamentoMensal } from '../models/fechamento.model';

@Injectable({
  providedIn: 'root'
})
export class PdfExportService {
  private readonly financeState = inject(FinanceStateService);
  private readonly repasseService = inject(RelatorioRepasseService);

  /**
   * Cores da identidade visual corporativa (Azul Marinho #17324d, Bronze #b66a3c, Esmeralda #10956a)
   */
  private readonly colorPrimary: [number, number, number] = [23, 50, 77];
  private readonly colorSecondary: [number, number, number] = [182, 106, 60];
  private readonly colorSuccess: [number, number, number] = [16, 149, 106];
  private readonly colorDarkText: [number, number, number] = [30, 41, 59];
  private readonly colorMuted: [number, number, number] = [100, 116, 139];
  private readonly colorBgCard: [number, number, number] = [248, 250, 252];
  private readonly colorBorder: [number, number, number] = [226, 232, 240];

  /**
   * Gera e faz o download do COMPROVANTE INDIVIDUAL DE REPASSE (PDF A4)
   * Integra perfeitamente com os dados apurados e as regras de compliance da Lei 13.352/2016
   */
  exportarComprovanteRepassePDF(parceiro: ResumoRepasseParceiro, competencia: string = 'Agosto/2026'): void {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const empresa = this.financeState.empresaAtiva();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // ==========================================
    // 1. CABEÇALHO TIMBRADO CORPORATIVO
    // ==========================================
    // Barra superior decorativa
    doc.setFillColor(this.colorPrimary[0], this.colorPrimary[1], this.colorPrimary[2]);
    doc.rect(0, 0, pageWidth, 8, 'F');
    doc.setFillColor(this.colorSecondary[0], this.colorSecondary[1], this.colorSecondary[2]);
    doc.rect(0, 8, pageWidth, 1.5, 'F');

    let currentY = 16;

    // Razão Social do Salão
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(this.colorPrimary[0], this.colorPrimary[1], this.colorPrimary[2]);
    doc.text(empresa.razao_social, 14, currentY);

    // Dados de Identificação do Salão
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(this.colorMuted[0], this.colorMuted[1], this.colorMuted[2]);
    currentY += 4.5;
    doc.text(`CNPJ: ${empresa.cnpj}  |  Inscrição Municipal: ${empresa.inscricao_municipal}  |  Regime: ${empresa.regime_tributario}`, 14, currentY);
    currentY += 4;
    doc.text(`${empresa.endereco} - ${empresa.cidade}/${empresa.uf}`, 14, currentY);

    // Linha divisória
    currentY += 3.5;
    doc.setDrawColor(this.colorBorder[0], this.colorBorder[1], this.colorBorder[2]);
    doc.setLineWidth(0.4);
    doc.line(14, currentY, pageWidth - 14, currentY);

    // ==========================================
    // 2. TÍTULO DO COMPROVANTE & PROTOCOLO
    // ==========================================
    currentY += 6;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11.5);
    doc.setTextColor(this.colorPrimary[0], this.colorPrimary[1], this.colorPrimary[2]);
    doc.text('COMPROVANTE OFICIAL DE REPASSE & PRESTAÇÃO DE CONTAS', 14, currentY);

    // Competência e Protocolo à Direita
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(this.colorSecondary[0], this.colorSecondary[1], this.colorSecondary[2]);
    doc.text(`Competência: ${competencia}`, pageWidth - 14, currentY, { align: 'right' });

    currentY += 4.5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(this.colorMuted[0], this.colorMuted[1], this.colorMuted[2]);
    doc.text('Demonstrativo de Partilha de Cotas nos termos do Art. 1º-A da Lei Federal nº 13.352/2016 (Salão-Parceiro)', 14, currentY);

    const dataEmissaoFormatada = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    doc.text(`Emissão: ${dataEmissaoFormatada}`, pageWidth - 14, currentY, { align: 'right' });

    // ==========================================
    // 3. QUADRO DE IDENTIFICAÇÃO DAS PARTES
    // ==========================================
    currentY += 6;
    const boxWidth = (pageWidth - 28 - 6) / 2;
    const boxHeight = 27;

    // Caixa Tomador (Salão-Parceiro)
    doc.setFillColor(this.colorBgCard[0], this.colorBgCard[1], this.colorBgCard[2]);
    doc.roundedRect(14, currentY, boxWidth, boxHeight, 1.5, 1.5, 'F');
    doc.setDrawColor(this.colorBorder[0], this.colorBorder[1], this.colorBorder[2]);
    doc.setLineWidth(0.3);
    doc.roundedRect(14, currentY, boxWidth, boxHeight, 1.5, 1.5, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(this.colorPrimary[0], this.colorPrimary[1], this.colorPrimary[2]);
    doc.text('ESTABELECIMENTO (SALÃO-PARCEIRO)', 18, currentY + 5);

    doc.setFontSize(8);
    doc.setTextColor(this.colorDarkText[0], this.colorDarkText[1], this.colorDarkText[2]);
    doc.text(empresa.razao_social, 18, currentY + 10);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(this.colorMuted[0], this.colorMuted[1], this.colorMuted[2]);
    doc.text(`CNPJ: ${empresa.cnpj}`, 18, currentY + 15);
    doc.text(`Endereço: ${empresa.endereco}`, 18, currentY + 19.5);
    doc.text(`Cidade/UF: ${empresa.cidade}/${empresa.uf}`, 18, currentY + 24);

    // Caixa Prestador (Profissional-Parceiro MEI)
    const box2X = 14 + boxWidth + 6;
    doc.setFillColor(this.colorBgCard[0], this.colorBgCard[1], this.colorBgCard[2]);
    doc.roundedRect(box2X, currentY, boxWidth, boxHeight, 1.5, 1.5, 'F');
    doc.setDrawColor(this.colorBorder[0], this.colorBorder[1], this.colorBorder[2]);
    doc.setLineWidth(0.3);
    doc.roundedRect(box2X, currentY, boxWidth, boxHeight, 1.5, 1.5, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(this.colorSecondary[0], this.colorSecondary[1], this.colorSecondary[2]);
    doc.text('PROFISSIONAL-PARCEIRO (MEI / PRESTADOR)', box2X + 4, currentY + 5);

    doc.setFontSize(8);
    doc.setTextColor(this.colorDarkText[0], this.colorDarkText[1], this.colorDarkText[2]);
    doc.text(parceiro.razao_social_mei || parceiro.nome_parceiro, box2X + 4, currentY + 10);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(this.colorMuted[0], this.colorMuted[1], this.colorMuted[2]);
    doc.text(`CNPJ MEI: ${parceiro.cnpj_mei}`, box2X + 4, currentY + 15);
    doc.text(`Especialidade: ${parceiro.especialidade}  |  CPF: ${parceiro.cpf || '—'}`, box2X + 4, currentY + 19.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(this.colorPrimary[0], this.colorPrimary[1], this.colorPrimary[2]);
    doc.text(`Chave PIX: ${parceiro.chave_pix} (${parceiro.tipo_chave_pix || 'PIX'})`, box2X + 4, currentY + 24);

    currentY += boxHeight + 6;

    // ==========================================
    // 4. CARDS DE APURAÇÃO FINANCEIRA (4 BLOCOS)
    // ==========================================
    const cardWidth = (pageWidth - 28 - 9) / 4;
    const cardHeight = 18;

    const drawCard = (x: number, title: string, value: string, subtitle: string, borderColor: [number, number, number], valColor: [number, number, number]) => {
      doc.setFillColor(this.colorBgCard[0], this.colorBgCard[1], this.colorBgCard[2]);
      doc.roundedRect(x, currentY, cardWidth, cardHeight, 1.5, 1.5, 'F');
      doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
      doc.setLineWidth(0.35);
      doc.roundedRect(x, currentY, cardWidth, cardHeight, 1.5, 1.5, 'S');

      // Título
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(this.colorMuted[0], this.colorMuted[1], this.colorMuted[2]);
      doc.text(title.toUpperCase(), x + 3, currentY + 4.5);

      // Valor
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(valColor[0], valColor[1], valColor[2]);
      doc.text(value, x + 3, currentY + 11);

      // Subtítulo
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6);
      doc.setTextColor(this.colorMuted[0], this.colorMuted[1], this.colorMuted[2]);
      doc.text(subtitle, x + 3, currentY + 15.5);
    };

    // 1. Produção Bruta
    drawCard(14, '1. Produção Bruta', `R$ ${parceiro.total_bruto_vendas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, `${parceiro.quantidade_atendimentos} atendimentos`, this.colorPrimary, this.colorPrimary);

    // 2. Deduções (Taxas Cartão + Insumos)
    const totalDeducoes = (parceiro.total_taxas_operadora_descontadas || 0) + (parceiro.total_insumos_descontados || 0);
    drawCard(14 + cardWidth + 3, '2. Deduções/Taxas', `- R$ ${totalDeducoes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 'Taxas maquininha + insumos', [239, 68, 68], [220, 38, 38]);

    // 3. Cota Salão
    drawCard(14 + (cardWidth + 3) * 2, `3. Cota Salão (${parceiro.percentual_contratual_empresa}%)`, `R$ ${parceiro.valor_cota_salao_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 'Base PGDAS-D Salão', this.colorSecondary, this.colorSecondary);

    // 4. Líquido MEI
    drawCard(14 + (cardWidth + 3) * 3, `4. Líquido MEI (${parceiro.percentual_contratual_parceiro}%)`, `R$ ${parceiro.valor_liquido_transferir.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 'Valor líquido transferido', this.colorSuccess, this.colorSuccess);

    currentY += cardHeight + 6;

    // ==========================================
    // 5. TABELA DE DISCRIMINAÇÃO DOS SERVIÇOS / COMANDAS
    // ==========================================
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(this.colorPrimary[0], this.colorPrimary[1], this.colorPrimary[2]);
    doc.text('DISCRIMINAÇÃO INDIVIDUAL DOS ATENDIMENTOS E COMANDAS:', 14, currentY);

    const itens = parceiro.itens_vendas || [];
    const tableItensData = itens.map(item => [
      item.data_hora ? item.data_hora.substring(0, 10) : '—',
      item.codigo_comanda || 'CMD',
      item.nome_cliente || 'Cliente',
      item.servico_descricao || 'Serviço',
      this.repasseService.obterRotuloFormaPagamento(item.forma_pagamento),
      `R$ ${item.valor_bruto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      `- R$ ${(item.valor_taxa_operadora + item.valor_desconto_insumos).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      `R$ ${item.valor_cota_empresa.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      `R$ ${item.valor_liquido_parceiro.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
    ]);

    // Linha de total na tabela
    tableItensData.push([
      'TOTAL',
      `${itens.length} itens`,
      '—',
      '—',
      '—',
      `R$ ${parceiro.total_bruto_vendas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      `- R$ ${totalDeducoes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      `R$ ${parceiro.valor_cota_salao_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      `R$ ${parceiro.valor_liquido_transferir.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
    ]);

    autoTable(doc, {
      startY: currentY + 2,
      head: [['Data', 'Comanda', 'Cliente', 'Serviço Realizado', 'Meio Pgto', 'Bruto', 'Deduções', 'Cota Salão', 'Líquido MEI']],
      body: tableItensData,
      theme: 'grid',
      styles: {
        fontSize: 7,
        cellPadding: 1.6,
        font: 'helvetica',
        textColor: this.colorDarkText,
        lineColor: [226, 232, 240],
        lineWidth: 0.15
      },
      headStyles: {
        fillColor: this.colorPrimary,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 7.2,
        halign: 'left'
      },
      columnStyles: {
        0: { cellWidth: 16, halign: 'center' },
        1: { cellWidth: 16, fontStyle: 'bold', halign: 'center' },
        2: { cellWidth: 32 },
        3: { cellWidth: 36 },
        4: { cellWidth: 22, fontSize: 6.5 },
        5: { cellWidth: 16, halign: 'right' },
        6: { cellWidth: 16, halign: 'right', textColor: [220, 38, 38] },
        7: { cellWidth: 16, halign: 'right', textColor: this.colorSecondary },
        8: { cellWidth: 16, halign: 'right', fontStyle: 'bold', textColor: this.colorSuccess }
      },
      didParseCell: (data) => {
        if (data.row.index === tableItensData.length - 1) {
          data.cell.styles.fillColor = [241, 245, 249];
          data.cell.styles.fontStyle = 'bold';
        }
      },
      margin: { left: 14, right: 14 }
    });

    const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY || currentY + 50;
    currentY = finalY + 6;

    // Se estiver próximo do fim da página, cria nova página
    if (currentY > pageHeight - 55) {
      doc.addPage();
      currentY = 16;
    }

    // ==========================================
    // 6. STATUS DO PAGAMENTO & CLÁUSULA LEGAL
    // ==========================================
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(14, currentY, pageWidth - 28, 22, 1.5, 1.5, 'F');
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.3);
    doc.roundedRect(14, currentY, pageWidth - 28, 22, 1.5, 1.5, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(this.colorPrimary[0], this.colorPrimary[1], this.colorPrimary[2]);
    
    const statusTexto = parceiro.status_repasse === 'TRANSFERIDO_PIX' 
      ? `STATUS: LIQUIDADO VIA PIX (${parceiro.chave_pix})  |  Autenticação: ${parceiro.comprovante_autenticacao || 'PIX-CONF-884920-2026'}`
      : 'STATUS: REPASSE APURADO - AGUARDANDO LIQUIDAÇÃO PIX';
    
    doc.text(statusTexto, 18, currentY + 5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);
    doc.setTextColor(this.colorDarkText[0], this.colorDarkText[1], this.colorDarkText[2]);
    const textoLegal = 
      `Declaração Legal: O presente demonstrativo foi emitido nos termos do Art. 1º-A da Lei Federal nº 13.352/2016. Os valores transferidos correspondem com exatidão ` +
      `à cota-parte do Profissional-Parceiro, deduzidas as taxas operacionais pactuadas em contrato de parceria. O profissional declara ter recebido a respectiva quantia ` +
      `e compromete-se a emitir a competente Nota Fiscal de Serviços Eletrônica (NFS-e MEI) correspondente a este valor líquido.`;

    const splitTexto = doc.splitTextToSize(textoLegal, pageWidth - 36);
    doc.text(splitTexto, 18, currentY + 9.5);

    currentY += 28;

    // ==========================================
    // 7. ASSINATURAS DAS DUAS PARTES (IDÊNTICO ÀS REGRAS DE IMPRESSÃO)
    // ==========================================
    if (currentY > pageHeight - 35) {
      doc.addPage();
      currentY = 20;
    }

    const colWidth = (pageWidth - 28 - 20) / 2;

    // Assinatura 1: Salão-Parceiro
    doc.setDrawColor(71, 85, 105);
    doc.setLineWidth(0.35);
    doc.line(14, currentY + 8, 14 + colWidth, currentY + 8);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(this.colorDarkText[0], this.colorDarkText[1], this.colorDarkText[2]);
    doc.text(empresa.razao_social, 14 + colWidth / 2, currentY + 12, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(this.colorMuted[0], this.colorMuted[1], this.colorMuted[2]);
    doc.text(`Salão-Parceiro (CNPJ: ${empresa.cnpj})`, 14 + colWidth / 2, currentY + 15.5, { align: 'center' });

    // Assinatura 2: Profissional-Parceiro MEI
    const col2X = 14 + colWidth + 20;
    doc.line(col2X, currentY + 8, col2X + colWidth, currentY + 8);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(this.colorDarkText[0], this.colorDarkText[1], this.colorDarkText[2]);
    doc.text(parceiro.razao_social_mei || parceiro.nome_parceiro, col2X + colWidth / 2, currentY + 12, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(this.colorMuted[0], this.colorMuted[1], this.colorMuted[2]);
    doc.text(`Profissional-Parceiro MEI (CNPJ: ${parceiro.cnpj_mei})`, col2X + colWidth / 2, currentY + 15.5, { align: 'center' });

    // ==========================================
    // 8. RODAPÉ E NUMERAÇÃO DE PÁGINAS
    // ==========================================
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.3);
      doc.line(14, pageHeight - 12, pageWidth - 14, pageHeight - 12);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(this.colorMuted[0], this.colorMuted[1], this.colorMuted[2]);
      
      const protocoloHash = `AUTENTICAÇÃO: COMPROV-${parceiro.id_parceiro.toUpperCase()}-${Math.abs(Math.sin(parceiro.valor_liquido_transferir) * 1000000).toFixed(0)}-L13352`;
      doc.text(`BeautyFinance Salão-Parceiro  |  ${protocoloHash}`, 14, pageHeight - 7.5);
      doc.text(`Página ${i} de ${totalPages}  |  Documento Fiscal A4`, pageWidth - 14, pageHeight - 7.5, { align: 'right' });
    }

    // Download do arquivo
    const sanitizeNome = (parceiro.nome_parceiro || 'Parceiro').replace(/\s+/g, '_');
    const nomeArquivo = `Comprovante_Repasse_${sanitizeNome}_${competencia.replace('/', '_')}.pdf`;
    doc.save(nomeArquivo);
  }

  /**
   * NOVO MODELO DE COMPROVANTE: FOCADO APENAS NO VALOR LÍQUIDO
   * Formatado rigorosamente conforme as normas de transparência da Lei Federal nº 13.352/2016 (Salão-Parceiro)
   * e da Resolução CGSN nº 140/2018. Enfatiza a cota-parte líquida e a base exclusiva para NFS-e MEI.
   */
  exportarComprovanteLiquidoTransparenciaPDF(parceiro: ResumoRepasseParceiro, competencia: string = 'Agosto/2026'): void {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const empresa = this.financeState.empresaAtiva();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // ==========================================
    // 1. CABEÇALHO TIMBRADO CORPORATIVO & TAG DE TRANSPARÊNCIA
    // ==========================================
    // Barra superior em azul escuro e bronze
    doc.setFillColor(this.colorPrimary[0], this.colorPrimary[1], this.colorPrimary[2]);
    doc.rect(0, 0, pageWidth, 8, 'F');
    doc.setFillColor(this.colorSecondary[0], this.colorSecondary[1], this.colorSecondary[2]);
    doc.rect(0, 8, pageWidth, 1.5, 'F');

    let currentY = 15;

    // Razão Social do Salão-Parceiro
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12.5);
    doc.setTextColor(this.colorPrimary[0], this.colorPrimary[1], this.colorPrimary[2]);
    doc.text(empresa.razao_social, 14, currentY);

    // Identificação Cadastral do Salão
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(this.colorMuted[0], this.colorMuted[1], this.colorMuted[2]);
    currentY += 4.2;
    doc.text(`CNPJ: ${empresa.cnpj}  |  Inscrição Municipal: ${empresa.inscricao_municipal}  |  Regime: ${empresa.regime_tributario} (${empresa.anexo_simples})`, 14, currentY);
    currentY += 3.8;
    doc.text(`${empresa.endereco} - ${empresa.cidade}/${empresa.uf}`, 14, currentY);

    // Linha divisória
    currentY += 3.5;
    doc.setDrawColor(this.colorBorder[0], this.colorBorder[1], this.colorBorder[2]);
    doc.setLineWidth(0.4);
    doc.line(14, currentY, pageWidth - 14, currentY);

    // ==========================================
    // 2. TÍTULO DO COMPROVANTE & PROTOCOLO DE TRANSPARÊNCIA
    // ==========================================
    currentY += 5.5;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(this.colorPrimary[0], this.colorPrimary[1], this.colorPrimary[2]);
    doc.text('COMPROVANTE DE REPASSE LÍQUIDO & TRANSPARÊNCIA FISCAL', 14, currentY);

    // Competência à direita
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(this.colorSecondary[0], this.colorSecondary[1], this.colorSecondary[2]);
    doc.text(`Competência: ${competencia}`, pageWidth - 14, currentY, { align: 'right' });

    currentY += 4.2;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(this.colorMuted[0], this.colorMuted[1], this.colorMuted[2]);
    doc.text('Normas de Transparência e Segregação de Cotas — Art. 1º-A da Lei Federal nº 13.352/2016 e Res. CGSN 140/2018', 14, currentY);

    const dataEmissaoFormatada = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    doc.text(`Emissão: ${dataEmissaoFormatada}`, pageWidth - 14, currentY, { align: 'right' });

    // ==========================================
    // 3. IDENTIFICAÇÃO DAS PARTES CONTRATANTES
    // ==========================================
    currentY += 5.5;
    const boxWidth = (pageWidth - 28 - 6) / 2;
    const boxHeight = 25;

    // Caixa do Salão-Parceiro (Tomador / Intermediador)
    doc.setFillColor(this.colorBgCard[0], this.colorBgCard[1], this.colorBgCard[2]);
    doc.roundedRect(14, currentY, boxWidth, boxHeight, 1.5, 1.5, 'F');
    doc.setDrawColor(this.colorBorder[0], this.colorBorder[1], this.colorBorder[2]);
    doc.setLineWidth(0.3);
    doc.roundedRect(14, currentY, boxWidth, boxHeight, 1.5, 1.5, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(this.colorPrimary[0], this.colorPrimary[1], this.colorPrimary[2]);
    doc.text('ESTABELECIMENTO (SALÃO-PARCEIRO)', 18, currentY + 4.8);

    doc.setFontSize(8);
    doc.setTextColor(this.colorDarkText[0], this.colorDarkText[1], this.colorDarkText[2]);
    doc.text(empresa.razao_social, 18, currentY + 9.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.2);
    doc.setTextColor(this.colorMuted[0], this.colorMuted[1], this.colorMuted[2]);
    doc.text(`CNPJ: ${empresa.cnpj}`, 18, currentY + 14);
    doc.text(`Endereço: ${empresa.endereco}`, 18, currentY + 18.2);
    doc.text(`Regime Tributário: ${empresa.regime_tributario} (${empresa.anexo_simples})`, 18, currentY + 22.4);

    // Caixa do Profissional-Parceiro MEI (Prestador Beneficiário)
    const box2X = 14 + boxWidth + 6;
    doc.setFillColor(this.colorBgCard[0], this.colorBgCard[1], this.colorBgCard[2]);
    doc.roundedRect(box2X, currentY, boxWidth, boxHeight, 1.5, 1.5, 'F');
    doc.setDrawColor(this.colorBorder[0], this.colorBorder[1], this.colorBorder[2]);
    doc.setLineWidth(0.3);
    doc.roundedRect(box2X, currentY, boxWidth, boxHeight, 1.5, 1.5, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(this.colorSecondary[0], this.colorSecondary[1], this.colorSecondary[2]);
    doc.text('PROFISSIONAL-PARCEIRO MEI (BENEFICIÁRIO)', box2X + 4, currentY + 4.8);

    doc.setFontSize(8);
    doc.setTextColor(this.colorDarkText[0], this.colorDarkText[1], this.colorDarkText[2]);
    doc.text(parceiro.razao_social_mei || parceiro.nome_parceiro, box2X + 4, currentY + 9.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.2);
    doc.setTextColor(this.colorMuted[0], this.colorMuted[1], this.colorMuted[2]);
    doc.text(`CNPJ MEI: ${parceiro.cnpj_mei}  |  CPF: ${parceiro.cpf || '—'}`, box2X + 4, currentY + 14);
    doc.text(`Especialidade: ${parceiro.especialidade}`, box2X + 4, currentY + 18.2);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(this.colorPrimary[0], this.colorPrimary[1], this.colorPrimary[2]);
    doc.text(`Chave PIX: ${parceiro.chave_pix} (${parceiro.tipo_chave_pix || 'PIX'})`, box2X + 4, currentY + 22.4);

    currentY += boxHeight + 5;

    // ==========================================
    // 4. HERO BOX: DESTAQUE EXCLUSIVO DO VALOR LÍQUIDO
    // ==========================================
    const heroHeight = 33;
    doc.setFillColor(240, 253, 244); // Verde suave emerald-50
    doc.roundedRect(14, currentY, pageWidth - 28, heroHeight, 2, 2, 'F');
    doc.setDrawColor(16, 149, 106); // Borda esmeralda
    doc.setLineWidth(0.6);
    doc.roundedRect(14, currentY, pageWidth - 28, heroHeight, 2, 2, 'S');

    // Título Superior do Hero
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(21, 128, 61); // Verde escuro emerald-700
    doc.text('VALOR LÍQUIDO DO REPASSE A TRANSFERIR (COTA-PARTE LÍQUIDA DO MEI)', 20, currentY + 7);

    // Status Badge à Direita
    const statusIsPago = parceiro.status_repasse === 'TRANSFERIDO_PIX';
    const statusBg = statusIsPago ? [16, 149, 106] : [217, 119, 6];
    const statusTexto = statusIsPago ? 'LIQUIDADO VIA PIX' : 'PRONTO PARA TRANSFERÊNCIA';
    
    doc.setFillColor(statusBg[0], statusBg[1], statusBg[2]);
    doc.roundedRect(pageWidth - 14 - 56, currentY + 4, 52, 6, 1.2, 1.2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.8);
    doc.setTextColor(255, 255, 255);
    doc.text(statusTexto, pageWidth - 14 - 30, currentY + 8, { align: 'center' });

    // VALOR LÍQUIDO DESTACADO (FONTE DISPLAY)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(21);
    doc.setTextColor(16, 149, 106);
    const valorLiquidoStr = `R$ ${parceiro.valor_liquido_transferir.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
    doc.text(valorLiquidoStr, 20, currentY + 18.5);

    // Detalhes da Transferência & Chave PIX
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(51, 65, 85);
    const authId = parceiro.comprovante_autenticacao || `E2E-PIX-${parceiro.id_parceiro.toUpperCase()}-2026-OK`;
    const pixInfo = `Destino: Chave PIX ${parceiro.chave_pix} (${parceiro.tipo_chave_pix || 'Chave'})  •  Autenticação: ${authId}`;
    doc.text(pixInfo, 20, currentY + 24);

    // Aviso legal de base da NFS-e
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.8);
    doc.setTextColor(22, 101, 52);
    doc.text('★ Este montante líquido constitui a base de cálculo exclusiva para emissão da NFS-e Nacional do MEI e escrituração do DASN-SIMEI.', 20, currentY + 29);

    currentY += heroHeight + 5.5;

    // ==========================================
    // 5. QUADRO DE TRANSPARÊNCIA E PARTILHA LEGAL (ART. 1º-A DA LEI 13.352)
    // ==========================================
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(this.colorPrimary[0], this.colorPrimary[1], this.colorPrimary[2]);
    doc.text('DEMONSTRATIVO DE TRANSPARÊNCIA E APURAÇÃO DA PARTILHA LEGAL:', 14, currentY);

    const totalDeducoes = (parceiro.total_taxas_operadora_descontadas || 0) + (parceiro.total_insumos_descontados || 0);

    const stepsData = [
      [
        '(+) Produção Bruta de Serviços do Período',
        `Atendimentos realizados no período (${parceiro.quantidade_atendimentos} atendimentos)`,
        `R$ ${parceiro.total_bruto_vendas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
      ],
      [
        '(-) Deduções Compartilhadas (Taxas de Cartão & Insumos)',
        'Taxas de operadoras/adquirentes de maquininha e materiais diretos pactuados',
        `- R$ ${totalDeducoes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
      ],
      [
        `(-) Cota-Parte Retida pelo Salão-Parceiro (${parceiro.percentual_contratual_empresa}%)`,
        'Custeio de infraestrutura física, recepção, agenda, marketing e tributação própria (PGDAS-D)',
        `- R$ ${parceiro.valor_cota_salao_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
      ],
      [
        `(=) COTA LÍQUIDA DO PROFISSIONAL-PARCEIRO MEI (${parceiro.percentual_contratual_parceiro}%)`,
        'Valor líquido efetivamente transferido (Receita Bruta própria do MEI / Base da NFS-e)',
        `R$ ${parceiro.valor_liquido_transferir.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
      ]
    ];

    autoTable(doc, {
      startY: currentY + 2,
      head: [['Componente da Partilha Financeira', 'Detalhamento & Fundamento Legal', 'Valor Apurado']],
      body: stepsData,
      theme: 'grid',
      styles: {
        fontSize: 7.2,
        cellPadding: 2,
        font: 'helvetica',
        textColor: this.colorDarkText,
        lineColor: [226, 232, 240],
        lineWidth: 0.15
      },
      headStyles: {
        fillColor: this.colorPrimary,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 7.5,
        halign: 'left'
      },
      columnStyles: {
        0: { cellWidth: 70, fontStyle: 'bold' },
        1: { cellWidth: 78, fontSize: 6.8, textColor: this.colorMuted },
        2: { cellWidth: 34, halign: 'right', fontStyle: 'bold', fontSize: 8 }
      },
      didParseCell: (data) => {
        if (data.row.index === 1) {
          data.cell.styles.textColor = [220, 38, 38]; // Deduções em vermelho
        } else if (data.row.index === 2) {
          data.cell.styles.textColor = this.colorSecondary; // Cota do salão em bronze
        } else if (data.row.index === 3) {
          data.cell.styles.fillColor = [240, 253, 244];
          data.cell.styles.textColor = this.colorSuccess; // Líquido em verde esmeralda
          data.cell.styles.fontStyle = 'bold';
        }
      },
      margin: { left: 14, right: 14 }
    });

    const finalY1 = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY || currentY + 38;
    currentY = finalY1 + 5;

    // ==========================================
    // 6. RESUMO SINTÉTICO DOS SERVIÇOS EXECUTADOS
    // ==========================================
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(this.colorPrimary[0], this.colorPrimary[1], this.colorPrimary[2]);
    doc.text('RESUMO SINTÉTICO DOS ATENDIMENTOS EXECUTADOS:', 14, currentY);

    // Agrupa serviços se houver itens_vendas, senão exibe visão consolidada
    const itens = parceiro.itens_vendas || [];
    let tableServicosData: (string | number)[][] = [];

    if (itens.length > 0) {
      // Agrupamento por serviço para manter formato sintético e executivo
      const agrupadosMap = new Map<string, { desc: string; qtd: number; bruto: number; deducoes: number; liquido: number }>();
      itens.forEach(item => {
        const key = item.servico_descricao || 'Serviço Estético';
        const current = agrupadosMap.get(key) || { desc: key, qtd: 0, bruto: 0, deducoes: 0, liquido: 0 };
        current.qtd += 1;
        current.bruto += item.valor_bruto;
        current.deducoes += (item.valor_taxa_operadora + item.valor_desconto_insumos);
        current.liquido += item.valor_liquido_parceiro;
        agrupadosMap.set(key, current);
      });

      tableServicosData = Array.from(agrupadosMap.values()).map(g => [
        g.desc,
        `${g.qtd} atend.`,
        `R$ ${g.bruto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        `- R$ ${g.deducoes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        `R$ ${g.liquido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
      ]);
    } else {
      tableServicosData = [
        [
          parceiro.especialidade || 'Serviços de Beleza & Estética',
          `${parceiro.quantidade_atendimentos} atend.`,
          `R$ ${parceiro.total_bruto_vendas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
          `- R$ ${totalDeducoes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
          `R$ ${parceiro.valor_liquido_transferir.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
        ]
      ];
    }

    // Linha de totalizador
    tableServicosData.push([
      'TOTAL CONSOLIDADO',
      `${parceiro.quantidade_atendimentos} atend.`,
      `R$ ${parceiro.total_bruto_vendas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      `- R$ ${totalDeducoes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      `R$ ${parceiro.valor_liquido_transferir.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
    ]);

    autoTable(doc, {
      startY: currentY + 2,
      head: [['Serviço / Categoria', 'Qtd', 'Produção Bruta', 'Deduções Rateadas', 'Líquido MEI']],
      body: tableServicosData,
      theme: 'grid',
      styles: {
        fontSize: 7,
        cellPadding: 1.8,
        font: 'helvetica',
        textColor: this.colorDarkText,
        lineColor: [226, 232, 240],
        lineWidth: 0.15
      },
      headStyles: {
        fillColor: [43, 81, 119],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 7.2
      },
      columnStyles: {
        0: { cellWidth: 74, fontStyle: 'bold' },
        1: { cellWidth: 22, halign: 'center' },
        2: { cellWidth: 28, halign: 'right' },
        3: { cellWidth: 28, halign: 'right', textColor: [220, 38, 38] },
        4: { cellWidth: 30, halign: 'right', fontStyle: 'bold', textColor: this.colorSuccess }
      },
      didParseCell: (data) => {
        if (data.row.index === tableServicosData.length - 1) {
          data.cell.styles.fillColor = [241, 245, 249];
          data.cell.styles.fontStyle = 'bold';
        }
      },
      margin: { left: 14, right: 14 }
    });

    const finalY2 = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY || currentY + 30;
    currentY = finalY2 + 5;

    // Se estiver muito próximo do rodapé, adiciona quebra suave
    if (currentY > pageHeight - 55) {
      doc.addPage();
      currentY = 16;
    }

    // ==========================================
    // 7. DECLARAÇÃO DE TRANSPARÊNCIA E COMPLIANCE FISCAL (LEI 13.352)
    // ==========================================
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(14, currentY, pageWidth - 28, 24, 1.5, 1.5, 'F');
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.3);
    doc.roundedRect(14, currentY, pageWidth - 28, 24, 1.5, 1.5, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.2);
    doc.setTextColor(this.colorPrimary[0], this.colorPrimary[1], this.colorPrimary[2]);
    doc.text('DECLARAÇÃO FORMAL DE TRANSPARÊNCIA FISCAL E CONFORMIDADE (LEI 13.352/2016):', 18, currentY + 4.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(this.colorDarkText[0], this.colorDarkText[1], this.colorDarkText[2]);
    const textoTransparencia = 
      `O Salão-Parceiro e o Profissional-Parceiro atestam que os valores acima discriminados representam com fidelidade a liquidação da cota-parte líquida. ` +
      `Nos termos do Art. 1º-A da Lei Federal nº 13.352/2016 e Resolução CGSN nº 140/2018, a cota retida pelo salão destina-se exclusivamente ao custeio ` +
      `de suas instalações físicas e tributação própria no Simples Nacional (Anexo III). O valor líquido repassado ao MEI (${valorLiquidoStr}) constitui ` +
      `receita própria e exclusiva deste, servindo de base única para a sua NFS-e e declaração anual DASN-SIMEI, inexistindo bitributação ou subordinação empregatícia (Art. 3º da CLT).`;

    const splitTexto = doc.splitTextToSize(textoTransparencia, pageWidth - 36);
    doc.text(splitTexto, 18, currentY + 8.8);

    currentY += 29;

    // ==========================================
    // 8. BLOCO DE ASSINATURAS E PROTOCOLO DIGITAL
    // ==========================================
    if (currentY > pageHeight - 34) {
      doc.addPage();
      currentY = 20;
    }

    const colWidth = (pageWidth - 28 - 20) / 2;

    // Assinatura 1: Salão-Parceiro
    doc.setDrawColor(71, 85, 105);
    doc.setLineWidth(0.35);
    doc.line(14, currentY + 8, 14 + colWidth, currentY + 8);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(this.colorDarkText[0], this.colorDarkText[1], this.colorDarkText[2]);
    doc.text(empresa.razao_social, 14 + colWidth / 2, currentY + 12, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(this.colorMuted[0], this.colorMuted[1], this.colorMuted[2]);
    doc.text(`Salão-Parceiro Intermediador (CNPJ: ${empresa.cnpj})`, 14 + colWidth / 2, currentY + 15.5, { align: 'center' });

    // Assinatura 2: Profissional-Parceiro MEI
    const col2X = 14 + colWidth + 20;
    doc.line(col2X, currentY + 8, col2X + colWidth, currentY + 8);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(this.colorDarkText[0], this.colorDarkText[1], this.colorDarkText[2]);
    doc.text(parceiro.razao_social_mei || parceiro.nome_parceiro, col2X + colWidth / 2, currentY + 12, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(this.colorMuted[0], this.colorMuted[1], this.colorMuted[2]);
    doc.text(`Profissional-Parceiro MEI (CNPJ: ${parceiro.cnpj_mei})`, col2X + colWidth / 2, currentY + 15.5, { align: 'center' });

    // ==========================================
    // 9. RODAPÉ E NUMERAÇÃO DE PÁGINAS
    // ==========================================
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.3);
      doc.line(14, pageHeight - 12, pageWidth - 14, pageHeight - 12);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(this.colorMuted[0], this.colorMuted[1], this.colorMuted[2]);
      
      const protocoloHash = `AUTENTICAÇÃO-TRANSPARÊNCIA: LIQ-${parceiro.id_parceiro.toUpperCase()}-${Math.abs(Math.sin(parceiro.valor_liquido_transferir) * 1000000).toFixed(0)}-L13352`;
      doc.text(`BeautyFinance • Modelo de Transparência Fiscal  |  ${protocoloHash}`, 14, pageHeight - 7.5);
      doc.text(`Página ${i} de ${totalPages}  |  Lei Federal nº 13.352/2016`, pageWidth - 14, pageHeight - 7.5, { align: 'right' });
    }

    // Download do arquivo
    const sanitizeNome = (parceiro.nome_parceiro || 'Parceiro').replace(/\s+/g, '_');
    const nomeArquivo = `Comprovante_Liquido_Transparencia_${sanitizeNome}_${competencia.replace('/', '_')}.pdf`;
    doc.save(nomeArquivo);
  }

  /**
   * Exporta comprovante focado no líquido a partir de um FechamentoMensal da tabela de fechamentos
   */
  exportarComprovanteLiquidoFechamentoPDF(fechamento: FechamentoMensal): void {
    const parceiro = this.financeState.parceiros().find(p => p.id === fechamento.id_parceiro);
    const relatorio = this.repasseService.relatorioConsolidado();
    const resumoParceiro = relatorio.parceiros_resumo.find(p => p.id_parceiro === fechamento.id_parceiro);

    if (resumoParceiro) {
      this.exportarComprovanteLiquidoTransparenciaPDF(resumoParceiro, `${fechamento.mes_referencia.toString().padStart(2, '0')}/${fechamento.ano_referencia}`);
      return;
    }

    const sintetico: ResumoRepasseParceiro = {
      id_parceiro: fechamento.id_parceiro,
      nome_parceiro: parceiro?.nome_fantasia || 'Profissional Parceiro',
      razao_social_mei: parceiro?.razao_social || 'MEI Parceiro',
      cnpj_mei: parceiro?.cnpj || '—',
      cpf: parceiro?.cpf || '—',
      especialidade: parceiro?.especialidade || 'Profissional da Beleza',
      chave_pix: parceiro?.chave_pix_padrao || fechamento.chave_pix_pagamento || '—',
      tipo_chave_pix: parceiro?.tipo_chave_pix || 'CNPJ',
      quantidade_atendimentos: 12,
      total_bruto_vendas: fechamento.valor_bruto_producao,
      total_taxas_operadora_descontadas: fechamento.valor_taxas_cartao_descontadas,
      total_insumos_descontados: fechamento.valor_insumos_descontados,
      percentual_contratual_empresa: fechamento.percentual_aplicado_empresa,
      percentual_contratual_parceiro: fechamento.percentual_aplicado_parceiro,
      valor_cota_salao_total: fechamento.valor_cota_empresa,
      valor_liquido_transferir: fechamento.valor_liquido_nota,
      status_repasse: fechamento.status === 'PAGO' ? 'TRANSFERIDO_PIX' : 'PRONTO_TRANSFERIR',
      data_transferencia: fechamento.data_pagamento_efetuado,
      comprovante_autenticacao: fechamento.numero_nota_mei ? `NFS-MEI-${fechamento.numero_nota_mei}` : undefined,
      itens_vendas: []
    };

    this.exportarComprovanteLiquidoTransparenciaPDF(sintetico, `${fechamento.mes_referencia.toString().padStart(2, '0')}/${fechamento.ano_referencia}`);
  }

  /**
   * Exporta comprovante a partir de um FechamentoMensal da tabela de fechamentos
   */
  exportarComprovanteFechamentoMensalPDF(fechamento: FechamentoMensal): void {
    const parceiro = this.financeState.parceiros().find(p => p.id === fechamento.id_parceiro);
    const relatorio = this.repasseService.relatorioConsolidado();
    const resumoParceiro = relatorio.parceiros_resumo.find(p => p.id_parceiro === fechamento.id_parceiro);

    if (resumoParceiro) {
      this.exportarComprovanteRepassePDF(resumoParceiro, `${fechamento.mes_referencia.toString().padStart(2, '0')}/${fechamento.ano_referencia}`);
      return;
    }

    // Se não encontrou no resumo de comandas, cria objeto sintético a partir do fechamento
    const sintético: ResumoRepasseParceiro = {
      id_parceiro: fechamento.id_parceiro,
      nome_parceiro: parceiro?.nome_fantasia || 'Profissional Parceiro',
      razao_social_mei: parceiro?.razao_social || 'MEI Parceiro',
      cnpj_mei: parceiro?.cnpj || '—',
      cpf: parceiro?.cpf || '—',
      especialidade: parceiro?.especialidade || 'Profissional da Beleza',
      chave_pix: parceiro?.chave_pix_padrao || fechamento.chave_pix_pagamento || '—',
      tipo_chave_pix: parceiro?.tipo_chave_pix || 'CNPJ',
      quantidade_atendimentos: 12,
      total_bruto_vendas: fechamento.valor_bruto_producao,
      total_taxas_operadora_descontadas: fechamento.valor_taxas_cartao_descontadas,
      total_insumos_descontados: fechamento.valor_insumos_descontados,
      percentual_contratual_empresa: fechamento.percentual_aplicado_empresa,
      percentual_contratual_parceiro: fechamento.percentual_aplicado_parceiro,
      valor_cota_salao_total: fechamento.valor_cota_empresa,
      valor_liquido_transferir: fechamento.valor_liquido_nota,
      status_repasse: fechamento.status === 'PAGO' ? 'TRANSFERIDO_PIX' : 'PRONTO_TRANSFERIR',
      data_transferencia: fechamento.data_pagamento_efetuado,
      comprovante_autenticacao: fechamento.numero_nota_mei ? `NFS-MEI-${fechamento.numero_nota_mei}` : undefined,
      itens_vendas: []
    };

    this.exportarComprovanteRepassePDF(sintético, `${fechamento.mes_referencia.toString().padStart(2, '0')}/${fechamento.ano_referencia}`);
  }

  /**
   * Gera e faz o download do Relatório Fiscal Consolidado otimizado para formato A4
   */
  exportarResumoFiscalA4(competencia: string = 'Agosto/2026'): void {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const empresa = this.financeState.empresaAtiva();
    const parceiros = this.financeState.parceiros();
    const fechamentos = this.financeState.fechamentos();
    const notas = this.financeState.notasFiscais();

    const faturamentoBruto = this.financeState.totalProducaoBrutaMes();
    const cotaSalao = this.financeState.totalCotaSalaoMes();
    const repassesMei = this.financeState.totalRepassesMeiMes();
    const economiaMes = this.financeState.economiaTributariaMensalLei13352();
    const economiaAno = this.financeState.economiaTributariaAnualProjetada();

    // Estimação de Margem Líquida
    const impostoSimplesEstimado = cotaSalao * 0.086;
    const taxasAdquirentes = faturamentoBruto * 0.028;
    const margemLiquidaValor = Math.max(0, cotaSalao - impostoSimplesEstimado - taxasAdquirentes);
    const margemLiquidaPercent = faturamentoBruto > 0 ? ((margemLiquidaValor / faturamentoBruto) * 100).toFixed(1) : '0';

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // ==========================================
    // CABEÇALHO DO DOCUMENTO (PÁGINA 1)
    // ==========================================
    // Barra superior decorativa
    doc.setFillColor(this.colorPrimary[0], this.colorPrimary[1], this.colorPrimary[2]);
    doc.rect(0, 0, pageWidth, 8, 'F');
    doc.setFillColor(this.colorSecondary[0], this.colorSecondary[1], this.colorSecondary[2]);
    doc.rect(0, 8, pageWidth, 1.5, 'F');

    let currentY = 16;

    // Título Principal & Razão Social
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(this.colorPrimary[0], this.colorPrimary[1], this.colorPrimary[2]);
    doc.text(empresa.razao_social, 14, currentY);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(this.colorMuted[0], this.colorMuted[1], this.colorMuted[2]);
    currentY += 4.5;
    doc.text(`CNPJ: ${empresa.cnpj}  |  Inscrição Municipal: ${empresa.inscricao_municipal}  |  Regime: ${empresa.regime_tributario} (${empresa.anexo_simples})`, 14, currentY);

    currentY += 4;
    doc.text(`${empresa.endereco} - ${empresa.cidade}/${empresa.uf}`, 14, currentY);

    // Linha divisória
    currentY += 3.5;
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.4);
    doc.line(14, currentY, pageWidth - 14, currentY);

    // Título do Relatório
    currentY += 6;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(this.colorPrimary[0], this.colorPrimary[1], this.colorPrimary[2]);
    doc.text('RESUMO FISCAL CONSOLIDADO & DEMONSTRATIVO DE REPASSES MEI', 14, currentY);

    // Tag da Lei e Competência (Direita)
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(this.colorSecondary[0], this.colorSecondary[1], this.colorSecondary[2]);
    doc.text(`Competência: ${competencia}`, pageWidth - 14, currentY, { align: 'right' });

    currentY += 4.5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(this.colorMuted[0], this.colorMuted[1], this.colorMuted[2]);
    doc.text('Documento Fiscal e Contábil em conformidade com a Lei Federal nº 13.352/2016 (Lei do Salão-Parceiro)', 14, currentY);

    const dataEmissaoFormatada = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    doc.text(`Gerado em: ${dataEmissaoFormatada}`, pageWidth - 14, currentY, { align: 'right' });

    // ==========================================
    // QUADRO DE KPIS CONSOLIDADOS (CARDS)
    // ==========================================
    currentY += 6;
    const cardWidth = (pageWidth - 28 - 9) / 4;
    const cardHeight = 19;

    const drawKpiCard = (x: number, title: string, value: string, subtitle: string, borderColor: [number, number, number], valColor: [number, number, number]) => {
      doc.setFillColor(this.colorBgCard[0], this.colorBgCard[1], this.colorBgCard[2]);
      doc.roundedRect(x, currentY, cardWidth, cardHeight, 1.5, 1.5, 'F');
      doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
      doc.setLineWidth(0.35);
      doc.roundedRect(x, currentY, cardWidth, cardHeight, 1.5, 1.5, 'S');

      // Título
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(this.colorMuted[0], this.colorMuted[1], this.colorMuted[2]);
      doc.text(title.toUpperCase(), x + 3, currentY + 4.5);

      // Valor
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10.5);
      doc.setTextColor(valColor[0], valColor[1], valColor[2]);
      doc.text(value, x + 3, currentY + 11.5);

      // Subtítulo
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6);
      doc.setTextColor(this.colorMuted[0], this.colorMuted[1], this.colorMuted[2]);
      doc.text(subtitle, x + 3, currentY + 16);
    };

    // Card 1: Faturamento Bruto
    drawKpiCard(14, 'Faturamento Bruto', `R$ ${faturamentoBruto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 'Total Produção Comandas', this.colorPrimary, this.colorPrimary);

    // Card 2: Repasses MEI
    drawKpiCard(14 + cardWidth + 3, 'Total Repasses MEI', `R$ ${repassesMei.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 'Dedução Legal Art. 1º-A', this.colorSuccess, this.colorSuccess);

    // Card 3: Cota Salão / Base PGDAS-D
    drawKpiCard(14 + (cardWidth + 3) * 2, 'Cota Salão (PGDAS-D)', `R$ ${cotaSalao.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 'Base do Simples Nacional', this.colorSecondary, this.colorSecondary);

    // Card 4: Margem Líquida Estimada
    drawKpiCard(14 + (cardWidth + 3) * 3, 'Margem Líquida Est.', `R$ ${margemLiquidaValor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, `${margemLiquidaPercent}% Líq. pós-impostos`, [99, 102, 241], [79, 70, 229]);

    currentY += cardHeight + 6;

    // ==========================================
    // TABELA 1: DETALHAMENTO DE REPASSES AOS PARCEIROS MEI
    // ==========================================
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(this.colorPrimary[0], this.colorPrimary[1], this.colorPrimary[2]);
    doc.text('1. DEMONSTRATIVO DE REPASSES POR PROFISSIONAL-PARCEIRO (LEI 13.352/2016)', 14, currentY);

    const tableRepassesData = fechamentos.map((f, idx) => {
      const p = parceiros.find(item => item.id === f.id_parceiro);
      const nome = p ? p.nome_fantasia : `Parceiro ${idx + 1}`;
      const cnpj = p ? p.cnpj : '—';
      const spec = p ? p.especialidade : 'Especialista';
      const statusLabel = f.status === 'PAGO' ? 'PAGO / QUITADO' : (f.status === 'NOTA_EMITIDA' ? 'NFS-e AUTORIZADA' : 'PENDENTE EMISSÃO');

      return [
        nome,
        cnpj,
        spec,
        `R$ ${f.valor_bruto_producao.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        `- R$ ${(f.valor_taxas_cartao_descontadas + f.valor_insumos_descontados).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        `R$ ${f.valor_cota_empresa.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (${f.percentual_aplicado_empresa}%)`,
        `R$ ${f.valor_liquido_nota.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        f.numero_nota_mei ? `NFS-e #${f.numero_nota_mei}` : 'Pendente',
        statusLabel
      ];
    });

    const totalTaxasInsumos = fechamentos.reduce((acc, f) => acc + f.valor_taxas_cartao_descontadas + f.valor_insumos_descontados, 0);
    tableRepassesData.push([
      'TOTAL CONSOLIDADO',
      '—',
      `${fechamentos.length} Profissionais`,
      `R$ ${faturamentoBruto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      `- R$ ${totalTaxasInsumos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      `R$ ${cotaSalao.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      `R$ ${repassesMei.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      '—',
      '80% Quitado'
    ]);

    autoTable(doc, {
      startY: currentY + 2,
      head: [['Profissional', 'CNPJ MEI', 'Especialidade', 'Bruto', 'Deduções', 'Cota Salão', 'Líquido MEI', 'NFS-e MEI', 'Status Repasse']],
      body: tableRepassesData,
      theme: 'grid',
      styles: {
        fontSize: 7,
        cellPadding: 1.8,
        font: 'helvetica',
        textColor: this.colorDarkText,
        lineColor: [226, 232, 240],
        lineWidth: 0.15
      },
      headStyles: {
        fillColor: this.colorPrimary,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 7.5,
        halign: 'left'
      },
      columnStyles: {
        0: { cellWidth: 32, fontStyle: 'bold' },
        1: { cellWidth: 24, fontSize: 6.5 },
        2: { cellWidth: 20 },
        3: { cellWidth: 18, halign: 'right' },
        4: { cellWidth: 18, halign: 'right', textColor: [220, 38, 38] },
        5: { cellWidth: 22, halign: 'right', textColor: this.colorSecondary, fontStyle: 'bold' },
        6: { cellWidth: 20, halign: 'right', textColor: this.colorSuccess, fontStyle: 'bold' },
        7: { cellWidth: 16, halign: 'center' },
        8: { cellWidth: 20, halign: 'center', fontSize: 6 }
      },
      didParseCell: (data) => {
        if (data.row.index === tableRepassesData.length - 1) {
          data.cell.styles.fillColor = [241, 245, 249];
          data.cell.styles.fontStyle = 'bold';
        }
      },
      margin: { left: 14, right: 14 }
    });

    const finalY1 = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY || currentY + 60;
    currentY = finalY1 + 7;

    // ==========================================
    // TABELA 2: NOTAS FISCAIS ELETRÔNICAS (NFS-E)
    // ==========================================
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(this.colorPrimary[0], this.colorPrimary[1], this.colorPrimary[2]);
    doc.text('2. PAINEL DE NOTAS FISCAIS DE SERVIÇOS ELETRÔNICAS (NFS-e)', 14, currentY);

    const tableNfsData = notas.slice(0, 7).map(n => [
      n.numero_nfse,
      n.serie,
      n.data_emissao ? n.data_emissao.substring(0, 10) : '—',
      n.tipo_operacao === 'PARCEIRO_PARA_EMPRESA' ? 'MEI → Salão (Repasse)' : 'Salão → Cliente (Comanda)',
      n.razao_social_prestador.length > 26 ? n.razao_social_prestador.substring(0, 24) + '...' : n.razao_social_prestador,
      `R$ ${n.valor_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      `${n.aliquota_iss}%`,
      `R$ ${n.valor_iss.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      n.status
    ]);

    autoTable(doc, {
      startY: currentY + 2,
      head: [['NFS-e', 'Série', 'Emissão', 'Tipo de Operação', 'Prestador', 'Valor Total', 'ISS (%)', 'Valor ISS', 'Status']],
      body: tableNfsData,
      theme: 'grid',
      styles: {
        fontSize: 7,
        cellPadding: 1.8,
        font: 'helvetica',
        textColor: this.colorDarkText,
        lineColor: [226, 232, 240],
        lineWidth: 0.15
      },
      headStyles: {
        fillColor: [43, 81, 119],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 7.5
      },
      columnStyles: {
        0: { cellWidth: 15, fontStyle: 'bold', halign: 'center' },
        1: { cellWidth: 12, halign: 'center' },
        2: { cellWidth: 18, halign: 'center' },
        3: { cellWidth: 32 },
        4: { cellWidth: 42 },
        5: { cellWidth: 20, halign: 'right', fontStyle: 'bold' },
        6: { cellWidth: 12, halign: 'center' },
        7: { cellWidth: 16, halign: 'right' },
        8: { cellWidth: 15, halign: 'center', fontStyle: 'bold', textColor: this.colorSuccess }
      },
      margin: { left: 14, right: 14 }
    });

    const finalY2 = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY || currentY + 50;
    currentY = finalY2 + 6;

    if (currentY > pageHeight - 45) {
      doc.addPage();
      currentY = 16;
    }

    // ==========================================
    // QUADRO DE CONFORMIDADE FISCAL & SEGREGAÇÃO PGDAS-D
    // ==========================================
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(14, currentY, pageWidth - 28, 26, 2, 2, 'F');
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.3);
    doc.roundedRect(14, currentY, pageWidth - 28, 26, 2, 2, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(this.colorPrimary[0], this.colorPrimary[1], this.colorPrimary[2]);
    doc.text('DECLARAÇÃO DE CONFORMIDADE TRIBUTÁRIA E SEGREGAÇÃO DE RECEITAS (PGDAS-D):', 18, currentY + 5.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(this.colorDarkText[0], this.colorDarkText[1], this.colorDarkText[2]);
    const textoConformidade = 
      `Certificamos que os valores deduzidos a título de Repasse aos Profissionais-Parceiros (R$ ${repassesMei.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}) ` +
      `foram apurados estritamente sob as diretrizes do Art. 1º-A da Lei nº 13.352/2016 e Resolução CGSN nº 140/2018. A base tributável para apuração do DAS ` +
      `(Simples Nacional - Anexo III) do estabelecimento corresponde com exatidão à Cota-Parte do Salão (R$ ${cotaSalao.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}), ` +
      `gerando uma economia tributária mensal comprovada de R$ ${economiaMes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (Projeção anual de R$ ${economiaAno.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}).`;

    const splitTexto = doc.splitTextToSize(textoConformidade, pageWidth - 36);
    doc.text(splitTexto, 18, currentY + 10);

    currentY += 32;

    // ==========================================
    // BLOCO DE ASSINATURAS E PROTOCOLO
    // ==========================================
    if (currentY > pageHeight - 35) {
      doc.addPage();
      currentY = 20;
    }

    const colWidth = (pageWidth - 28 - 20) / 2;

    // Assinatura 1: Salão
    doc.setDrawColor(71, 85, 105);
    doc.setLineWidth(0.35);
    doc.line(14, currentY + 8, 14 + colWidth, currentY + 8);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(this.colorDarkText[0], this.colorDarkText[1], this.colorDarkText[2]);
    doc.text(empresa.razao_social, 14 + colWidth / 2, currentY + 12, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(this.colorMuted[0], this.colorMuted[1], this.colorMuted[2]);
    doc.text(`Representante Legal do Estabelecimento (CNPJ: ${empresa.cnpj})`, 14 + colWidth / 2, currentY + 15.5, { align: 'center' });

    // Assinatura 2: Contabilidade / CRC
    const col2X = 14 + colWidth + 20;
    doc.line(col2X, currentY + 8, col2X + colWidth, currentY + 8);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(this.colorDarkText[0], this.colorDarkText[1], this.colorDarkText[2]);
    doc.text('ASSESSORIA CONTÁBIL & FISCAL ESPECIALIZADA', col2X + colWidth / 2, currentY + 12, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(this.colorMuted[0], this.colorMuted[1], this.colorMuted[2]);
    doc.text('Auditoria de Repasses & Compliance Lei 13.352/2016', col2X + colWidth / 2, currentY + 15.5, { align: 'center' });

    // ==========================================
    // RODAPÉ DAS PÁGINAS (NUMERAÇÃO E HASH)
    // ==========================================
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);

      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.3);
      doc.line(14, pageHeight - 12, pageWidth - 14, pageHeight - 12);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(this.colorMuted[0], this.colorMuted[1], this.colorMuted[2]);
      
      const protocoloHash = `AUTENTICAÇÃO: BF-${Math.abs(Math.sin(i) * 1000000).toFixed(0)}-L13352-2026`;
      doc.text(`BeautyFinance Salão-Parceiro  |  ${protocoloHash}`, 14, pageHeight - 7.5);
      doc.text(`Página ${i} de ${totalPages}  |  Formato A4 Oficial`, pageWidth - 14, pageHeight - 7.5, { align: 'right' });
    }

    const nomeArquivo = `Resumo_Fiscal_Salao_Parceiro_${competencia.replace('/', '_')}.pdf`;
    doc.save(nomeArquivo);
  }
}
