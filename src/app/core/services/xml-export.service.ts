import { Injectable, inject } from '@angular/core';
import { FinanceStateService } from './finance-state.service';
import { FechamentoMensal } from '../models/fechamento.model';
import { NotaFiscal } from '../models/nota-fiscal.model';

@Injectable({
  providedIn: 'root'
})
export class XmlExportService {
  private readonly financeState = inject(FinanceStateService);

  /**
   * Exporta o lote consolidado de NFS-e no padrão ABRASF 2.04 / Padrão Nacional
   * amplamente suportado por sistemas contábeis (Domínio, Questor, Alterdata, Fortes, Prosoft, Contmatic).
   */
  exportarLoteNfseXml(fechamentos?: FechamentoMensal[]): void {
    const empresa = this.financeState.empresaAtiva();
    const fechamentosParaExportar = fechamentos || this.financeState.fechamentos();
    const parceiros = this.financeState.parceiros();
    const notas = this.financeState.notasFiscais();

    const timestamp = new Date().toISOString().replace(/[-:T.]/g, '').substring(0, 14);
    const numeroLote = `LOTE${timestamp.substring(2, 10)}`;
    const mesRef = fechamentosParaExportar[0]?.mes_referencia || (new Date().getMonth() + 1);
    const anoRef = fechamentosParaExportar[0]?.ano_referencia || new Date().getFullYear();

    const xml = this.gerarXmlLoteAbrasf(empresa, fechamentosParaExportar, parceiros, notas, numeroLote, mesRef, anoRef);
    this.fazerDownloadXml(xml, `Lote_NFSe_Contabilidade_${mesRef.toString().padStart(2, '0')}_${anoRef}_${numeroLote}.xml`);
  }

  /**
   * Exporta arquivo XML de Integração Contábil Completo (Lei 13.352/2016 - Salão-Parceiro)
   * contendo segregação de faturamento bruto, rateio de taxas de cartão, cota do salão e repasses MEI.
   */
  exportarIntegracaoContabilXml(): void {
    const empresa = this.financeState.empresaAtiva();
    const fechamentos = this.financeState.fechamentos();
    const parceiros = this.financeState.parceiros();
    const notas = this.financeState.notasFiscais();

    const timestamp = new Date().toISOString().replace(/[-:T.]/g, '').substring(0, 14);
    const xml = this.gerarXmlIntegracaoContabilCompleto(empresa, fechamentos, parceiros, notas);
    this.fazerDownloadXml(xml, `Integracao_Contabil_Salao_Parceiro_Lei13352_${empresa.cnpj.replace(/\D/g, '')}_${timestamp}.xml`);
  }

  /**
   * Exporta o XML individual de uma NFS-e de repasse emitida pelo parceiro MEI
   */
  exportarNfseIndividualXml(fechamento: FechamentoMensal): void {
    const empresa = this.financeState.empresaAtiva();
    const parceiro = this.financeState.parceiros().find(p => p.id === fechamento.id_parceiro);
    const notaExistente = this.financeState.notasFiscais().find(n => n.numero_nfse === fechamento.numero_nota_mei);

    const nota: NotaFiscal = notaExistente || {
      id: `nfse-${fechamento.id}`,
      id_empresa: empresa.id,
      id_parceiro: fechamento.id_parceiro,
      tipo_operacao: 'PARCEIRO_PARA_EMPRESA',
      numero_nfse: fechamento.numero_nota_mei || `${fechamento.ano_referencia}-${Math.floor(1000 + Math.random() * 9000)}`,
      serie: 'MEI',
      chave_acesso: `352608${(parceiro?.cnpj || '00000000000100').replace(/\D/g, '')}5600100000001`,
      data_emissao: fechamento.data_pagamento_efetuado || new Date().toISOString(),
      razao_social_prestador: parceiro?.razao_social || 'PARCEIRO MEI',
      cnpj_prestador: parceiro?.cnpj || '00.000.000/0001-00',
      razao_social_tomador: empresa.razao_social,
      cnpj_tomador: empresa.cnpj,
      discriminacao_servicos: `Serviços de embelezamento/estética executados por profissional-parceiro MEI nos termos do Art. 1-A da Lei Federal 13.352/2016. Competência ${fechamento.mes_referencia.toString().padStart(2, '0')}/${fechamento.ano_referencia}.`,
      valor_total: fechamento.valor_liquido_nota,
      valor_iss: 0,
      aliquota_iss: 0,
      status: 'AUTORIZADA',
      codigo_verificacao: `ADN-${Math.floor(10000 + Math.random() * 90000)}-SP`
    };

    const xml = this.gerarXmlNfseIndividualAbrasf(empresa, parceiro, fechamento, nota);
    const nomeArquivo = `NFSe_${fechamento.numero_nota_mei || 'Repasse'}_${(parceiro?.nome_fantasia || 'MEI').replace(/\s+/g, '_')}_${fechamento.mes_referencia}_${fechamento.ano_referencia}.xml`;
    this.fazerDownloadXml(xml, nomeArquivo);
  }

  /**
   * Constrói a estrutura XML de Lote RPS no padrão ABRASF 2.04
   */
  private gerarXmlLoteAbrasf(
    empresa: ReturnType<FinanceStateService['empresaAtiva']>,
    fechamentos: FechamentoMensal[],
    parceiros: ReturnType<FinanceStateService['parceiros']>,
    notas: NotaFiscal[],
    numeroLote: string,
    mesRef: number,
    anoRef: number
  ): string {
    const cnpjLimpoEmpresa = empresa.cnpj.replace(/\D/g, '');
    const dataHoraIso = new Date().toISOString();
    const competenciaFormatada = `${anoRef}-${mesRef.toString().padStart(2, '0')}-01`;

    let rpsItemsXml = '';

    fechamentos.forEach((fech, index) => {
      const parceiro = parceiros.find(p => p.id === fech.id_parceiro);
      const cnpjLimpoPrestador = (parceiro?.cnpj || '00000000000100').replace(/\D/g, '');
      const numeroRps = index + 1;
      const numeroNfse = fech.numero_nota_mei || `${anoRef}-${numeroRps.toString().padStart(4, '0')}`;
      const notaVinculada = notas.find(n => n.numero_nfse === fech.numero_nota_mei || n.id_parceiro === fech.id_parceiro);
      const dataEmissaoRps = notaVinculada?.data_emissao ? notaVinculada.data_emissao.substring(0, 10) : new Date().toISOString().substring(0, 10);
      const chaveAcesso = notaVinculada?.chave_acesso || `352608${cnpjLimpoPrestador}56001${numeroRps.toString().padStart(8, '0')}`;

      rpsItemsXml += `
      <Rps>
        <InfDeclaracaoPrestacaoServico Id="RPS${numeroRps}">
          <Rps>
            <IdentificacaoRps>
              <Numero>${numeroRps}</Numero>
              <Serie>MEI</Serie>
              <Tipo>1</Tipo>
            </IdentificacaoRps>
            <DataEmissao>${dataEmissaoRps}</DataEmissao>
            <Status>1</Status>
          </Rps>
          <Competencia>${competenciaFormatada}</Competencia>
          <Servico>
            <Valores>
              <ValorServicos>${fech.valor_liquido_nota.toFixed(2)}</ValorServicos>
              <ValorDeducoes>0.00</ValorDeducoes>
              <ValorPis>0.00</ValorPis>
              <ValorCofins>0.00</ValorCofins>
              <ValorInss>0.00</ValorInss>
              <ValorIr>0.00</ValorIr>
              <ValorCsll>0.00</ValorCsll>
              <OutrasRetencoes>0.00</OutrasRetencoes>
              <ValorIss>0.00</ValorIss>
              <Aliquota>0.0000</Aliquota>
              <DescontoIncondicionado>0.00</DescontoIncondicionado>
              <DescontoCondicionado>0.00</DescontoCondicionado>
            </Valores>
            <IssRetido>2</IssRetido>
            <ItemListaServico>06.01</ItemListaServico>
            <CodigoCnae>9602501</CodigoCnae>
            <CodigoTributacaoMunicipio>060100188</CodigoTributacaoMunicipio>
            <Discriminacao>Servicos de beleza e estetica profissional nos termos do Art. 1-A da Lei Federal 13.352/2016 (Salao-Parceiro). Prestador optante pelo SIMEI - Isencao de retencao na fonte. Competencia: ${mesRef.toString().padStart(2, '0')}/${anoRef}. Nota fiscal sob numero ${numeroNfse}. Producao apurada: R$ ${fech.valor_bruto_producao.toFixed(2)}. Cota salao: R$ ${fech.valor_cota_empresa.toFixed(2)}. Taxas rateadas: R$ ${fech.valor_taxas_cartao_descontadas.toFixed(2)}.</Discriminacao>
            <CodigoMunicipio>3550308</CodigoMunicipio>
            <ExigibilidadeISS>1</ExigibilidadeISS>
            <MunicipioIncidencia>3550308</MunicipioIncidencia>
          </Servico>
          <Prestador>
            <CpfCnpj>
              <Cnpj>${cnpjLimpoPrestador}</Cnpj>
            </CpfCnpj>
            <RazaoSocial>${this.escaparXml(parceiro?.razao_social || 'PROFISSIONAL PARCEIRO MEI')}</RazaoSocial>
            <NomeFantasia>${this.escaparXml(parceiro?.nome_fantasia || 'Parceiro')}</NomeFantasia>
            <InscricaoMunicipal>${parceiro?.cnpj ? '99' + cnpjLimpoPrestador.substring(0, 6) : 'ISENTO'}</InscricaoMunicipal>
            <OptanteSimplesNacional>1</OptanteSimplesNacional>
            <RegimeEspecialTributacao>6</RegimeEspecialTributacao>
          </Prestador>
          <Tomador>
            <IdentificacaoTomador>
              <CpfCnpj>
                <Cnpj>${cnpjLimpoEmpresa}</Cnpj>
              </CpfCnpj>
              <InscricaoMunicipal>${this.escaparXml(empresa.inscricao_municipal || 'ISENTO')}</InscricaoMunicipal>
            </IdentificacaoTomador>
            <RazaoSocial>${this.escaparXml(empresa.razao_social)}</RazaoSocial>
            <Endereco>
              <Endereco>${this.escaparXml(empresa.endereco)}</Endereco>
              <Numero>1280</Numero>
              <Complemento>Salao</Complemento>
              <Bairro>Jardins</Bairro>
              <CodigoMunicipio>3550308</CodigoMunicipio>
              <Uf>${empresa.uf}</Uf>
              <Cep>01414002</Cep>
            </Endereco>
            <Contato>
              <Email>financeiro@studioconcept.com.br</Email>
            </Contato>
          </Tomador>
          <InformacoesComplementares>
            <BaseLegal>Lei Federal 13.352/2016 - Art. 1-A e 1-B</BaseLegal>
            <ChaveAcesso>${chaveAcesso}</ChaveAcesso>
            <NumeroNfse>${numeroNfse}</NumeroNfse>
            <StatusLiquidacao>${fech.status === 'PAGO' ? 'LIQUIDADO_PIX' : 'PENDENTE_LIQUIDACAO'}</StatusLiquidacao>
          </InformacoesComplementares>
        </InfDeclaracaoPrestacaoServico>
      </Rps>`;
    });

    return `<?xml version="1.0" encoding="UTF-8"?>
<EnviarLoteRpsEnvio xmlns="http://www.abrasf.org.br/nfse.xsd">
  <LoteRps Id="${numeroLote}" versao="2.04">
    <NumeroLote>${numeroLote.replace(/\D/g, '') || '1'}</NumeroLote>
    <CpfCnpj>
      <Cnpj>${cnpjLimpoEmpresa}</Cnpj>
    </CpfCnpj>
    <InscricaoMunicipal>${this.escaparXml(empresa.inscricao_municipal || 'ISENTO')}</InscricaoMunicipal>
    <QuantidadeRps>${fechamentos.length}</QuantidadeRps>
    <DataEnvio>${dataHoraIso}</DataEnvio>
    <VersaoLayout>2.04</VersaoLayout>
    <SistemaEmissor>BeautyFinance ERP v2.4 (Lei 13.352/2016)</SistemaEmissor>
    <ListaRps>${rpsItemsXml}
    </ListaRps>
  </LoteRps>
</EnviarLoteRpsEnvio>`;
  }

  /**
   * Constrói o XML completo de integração contábil contendo todas as variáveis
   * de auditoria, conciliação e rateio tributário.
   */
  private gerarXmlIntegracaoContabilCompleto(
    empresa: ReturnType<FinanceStateService['empresaAtiva']>,
    fechamentos: FechamentoMensal[],
    parceiros: ReturnType<FinanceStateService['parceiros']>,
    notas: NotaFiscal[]
  ): string {
    const cnpjEmpresa = empresa.cnpj.replace(/\D/g, '');
    const dataHoraIso = new Date().toISOString();

    const totalProducao = fechamentos.reduce((acc, f) => acc + f.valor_bruto_producao, 0);
    const totalTaxas = fechamentos.reduce((acc, f) => acc + f.valor_taxas_cartao_descontadas, 0);
    const totalCotaSalao = fechamentos.reduce((acc, f) => acc + f.valor_cota_empresa, 0);
    const totalRepassesMei = fechamentos.reduce((acc, f) => acc + f.valor_liquido_nota, 0);
    const aliquotaSimples = (empresa.aliquota_efetiva_simples || 8.60) / 100;
    const economiaCalculada = (totalProducao * aliquotaSimples) - (totalCotaSalao * aliquotaSimples);

    let fechamentosXml = '';
    fechamentos.forEach(f => {
      const parceiro = parceiros.find(p => p.id === f.id_parceiro);
      const notaVinculada = notas.find(n => n.numero_nfse === f.numero_nota_mei);

      fechamentosXml += `
      <Fechamento Id="${f.id}">
        <Competencia>
          <Mes>${f.mes_referencia}</Mes>
          <Ano>${f.ano_referencia}</Ano>
        </Competencia>
        <ProfissionalParceiro>
          <Id>${f.id_parceiro}</Id>
          <RazaoSocial>${this.escaparXml(parceiro?.razao_social || 'PARCEIRO')}</RazaoSocial>
          <NomeFantasia>${this.escaparXml(parceiro?.nome_fantasia || 'Parceiro')}</NomeFantasia>
          <Cnpj>${parceiro?.cnpj || ''}</Cnpj>
          <ChavePix>${parceiro?.chave_pix_padrao || f.chave_pix_pagamento || ''}</ChavePix>
          <Especialidade>${this.escaparXml(parceiro?.especialidade || '')}</Especialidade>
          <PercentualParceiro>${f.percentual_aplicado_parceiro || 55}</PercentualParceiro>
          <PercentualSalao>${f.percentual_aplicado_empresa || 45}</PercentualSalao>
        </ProfissionalParceiro>
        <PartilhaValores>
          <FaturamentoBrutoProducao>${f.valor_bruto_producao.toFixed(2)}</FaturamentoBrutoProducao>
          <DeducaoTaxasCartao>${f.valor_taxas_cartao_descontadas.toFixed(2)}</DeducaoTaxasCartao>
          <DeducaoInsumos>${f.valor_insumos_descontados.toFixed(2)}</DeducaoInsumos>
          <CotaParteSalao>${f.valor_cota_empresa.toFixed(2)}</CotaParteSalao>
          <CotaParteRepasseMei>${f.valor_liquido_nota.toFixed(2)}</CotaParteRepasseMei>
          <ValorLiquidoRepassado>${f.valor_liquido_nota.toFixed(2)}</ValorLiquidoRepassado>
        </PartilhaValores>
        <DocumentoFiscal>
          <NumeroNfse>${f.numero_nota_mei || 'PENDENTE'}</NumeroNfse>
          <ChaveAcesso>${notaVinculada?.chave_acesso || ''}</ChaveAcesso>
          <StatusEmissao>${f.status}</StatusEmissao>
          <DataPagamento>${f.data_pagamento_efetuado || ''}</DataPagamento>
        </DocumentoFiscal>
      </Fechamento>`;
    });

    let notasFiscaisXml = '';
    notas.forEach(n => {
      notasFiscaisXml += `
      <NotaFiscal Id="${n.id}">
        <NumeroNfse>${n.numero_nfse}</NumeroNfse>
        <Serie>${n.serie}</Serie>
        <ChaveAcesso>${n.chave_acesso}</ChaveAcesso>
        <CodigoVerificacao>${n.codigo_verificacao || ''}</CodigoVerificacao>
        <DataEmissao>${n.data_emissao}</DataEmissao>
        <TipoOperacao>${n.tipo_operacao}</TipoOperacao>
        <Prestador>
          <Cnpj>${n.cnpj_prestador}</Cnpj>
          <RazaoSocial>${this.escaparXml(n.razao_social_prestador)}</RazaoSocial>
        </Prestador>
        <Tomador>
          <Cnpj>${n.cnpj_tomador}</Cnpj>
          <RazaoSocial>${this.escaparXml(n.razao_social_tomador)}</RazaoSocial>
        </Tomador>
        <Valores>
          <ValorTotal>${n.valor_total.toFixed(2)}</ValorTotal>
          <ValorIss>${n.valor_iss.toFixed(2)}</ValorIss>
          <AliquotaIss>${n.aliquota_iss.toFixed(2)}</AliquotaIss>
        </Valores>
        <Discriminacao>${this.escaparXml(n.discriminacao_servicos)}</Discriminacao>
      </NotaFiscal>`;
    });

    return `<?xml version="1.0" encoding="UTF-8"?>
<MovimentacaoContabilSalaoParceiro versao="1.0" xmlns="http://www.beautyfinance.com.br/schema/contabil/v1">
  <Cabecalho>
    <IdentificadorGeracao>BF-${Date.now()}</IdentificadorGeracao>
    <DataHoraGeracao>${dataHoraIso}</DataHoraGeracao>
    <BaseLegal>Lei Federal nº 13.352 de 27/10/2016 (Lei do Salão-Parceiro)</BaseLegal>
    <RegimeTributario>${this.escaparXml(empresa.regime_tributario)}</RegimeTributario>
    <AliquotaSimplesNacionalEfetiva>${empresa.aliquota_efetiva_simples}%</AliquotaSimplesNacionalEfetiva>
  </Cabecalho>
  <SalaoParceiro>
    <Cnpj>${cnpjEmpresa}</Cnpj>
    <RazaoSocial>${this.escaparXml(empresa.razao_social)}</RazaoSocial>
    <NomeFantasia>${this.escaparXml(empresa.nome_fantasia)}</NomeFantasia>
    <InscricaoMunicipal>${this.escaparXml(empresa.inscricao_municipal || '')}</InscricaoMunicipal>
  </SalaoParceiro>
  <ResumoPeriodo>
    <FaturamentoBrutoTotal>${totalProducao.toFixed(2)}</FaturamentoBrutoTotal>
    <TotalTaxasCartaoDeducoes>${totalTaxas.toFixed(2)}</TotalTaxasCartaoDeducoes>
    <BaseCalculoSimplesCotaSalao>${totalCotaSalao.toFixed(2)}</BaseCalculoSimplesCotaSalao>
    <TotalRepassesProfissionaisMei>${totalRepassesMei.toFixed(2)}</TotalRepassesProfissionaisMei>
    <EconomiaTributariaGerada>${economiaCalculada.toFixed(2)}</EconomiaTributariaGerada>
    <TotalProfissionaisAtivos>${parceiros.length}</TotalProfissionaisAtivos>
    <TotalNotasFiscais>${notas.length}</TotalNotasFiscais>
  </ResumoPeriodo>
  <ListaFechamentos>${fechamentosXml}
  </ListaFechamentos>
  <ListaNotasFiscais>${notasFiscaisXml}
  </ListaNotasFiscais>
</MovimentacaoContabilSalaoParceiro>`;
  }

  /**
   * Constrói XML individual ABRASF de NFS-e
   */
  private gerarXmlNfseIndividualAbrasf(
    empresa: ReturnType<FinanceStateService['empresaAtiva']>,
    parceiro: ReturnType<FinanceStateService['parceiros']>[0] | undefined,
    fechamento: FechamentoMensal,
    nota: NotaFiscal
  ): string {
    const cnpjPrestador = (parceiro?.cnpj || nota.cnpj_prestador).replace(/\D/g, '');
    const cnpjTomador = empresa.cnpj.replace(/\D/g, '');

    return `<?xml version="1.0" encoding="UTF-8"?>
<CompNfse xmlns="http://www.abrasf.org.br/nfse.xsd">
  <Nfse versao="2.04">
    <InfNfse Id="NFSe${nota.numero_nfse}">
      <Numero>${nota.numero_nfse}</Numero>
      <CodigoVerificacao>${nota.codigo_verificacao || 'ADN-89021-SP'}</CodigoVerificacao>
      <DataEmissao>${nota.data_emissao}</DataEmissao>
      <IdentificacaoPrestador>
        <CpfCnpj>
          <Cnpj>${cnpjPrestador}</Cnpj>
        </CpfCnpj>
        <InscricaoMunicipal>${parceiro?.cnpj ? '99' + cnpjPrestador.substring(0, 6) : 'ISENTO'}</InscricaoMunicipal>
      </IdentificacaoPrestador>
      <RazaoSocialPrestador>${this.escaparXml(parceiro?.razao_social || nota.razao_social_prestador)}</RazaoSocialPrestador>
      <NomeFantasia>${this.escaparXml(parceiro?.nome_fantasia || 'Parceiro MEI')}</NomeFantasia>
      <DeclaracaoPrestacaoServico>
        <IdentificacaoTomador>
          <CpfCnpj>
            <Cnpj>${cnpjTomador}</Cnpj>
          </CpfCnpj>
          <RazaoSocial>${this.escaparXml(empresa.razao_social)}</RazaoSocial>
          <InscricaoMunicipal>${this.escaparXml(empresa.inscricao_municipal || 'ISENTO')}</InscricaoMunicipal>
        </IdentificacaoTomador>
        <Servico>
          <Valores>
            <ValorServicos>${fechamento.valor_liquido_nota.toFixed(2)}</ValorServicos>
            <ValorDeducoes>0.00</ValorDeducoes>
            <ValorPis>0.00</ValorPis>
            <ValorCofins>0.00</ValorCofins>
            <ValorInss>0.00</ValorInss>
            <ValorIr>0.00</ValorIr>
            <ValorCsll>0.00</ValorCsll>
            <OutrasRetencoes>0.00</OutrasRetencoes>
            <ValorIss>0.00</ValorIss>
            <Aliquota>0.0000</Aliquota>
            <BaseCalculo>${fechamento.valor_liquido_nota.toFixed(2)}</BaseCalculo>
            <ValorLiquidoNfse>${fechamento.valor_liquido_nota.toFixed(2)}</ValorLiquidoNfse>
          </Valores>
          <ItemListaServico>06.01</ItemListaServico>
          <CodigoCnae>9602501</CodigoCnae>
          <Discriminacao>${this.escaparXml(nota.discriminacao_servicos)}</Discriminacao>
          <CodigoMunicipio>3550308</CodigoMunicipio>
        </Servico>
      </DeclaracaoPrestacaoServico>
    </InfNfse>
  </Nfse>
</CompNfse>`;
  }

  /**
   * Dispara o download nativo do arquivo XML no navegador
   */
  private fazerDownloadXml(conteudoXml: string, nomeArquivo: string): void {
    if (typeof window === 'undefined') return;

    const blob = new Blob([conteudoXml], { type: 'application/xml;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', nomeArquivo);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Escapa caracteres reservados para evitar erros de parser XML
   */
  private escaparXml(str: string): string {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
}
