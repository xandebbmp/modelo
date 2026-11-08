import { Injectable, inject } from '@angular/core';
import { FinanceStateService } from './finance-state.service';
import { NotaFiscal } from '../models/nota-fiscal.model';

export interface NfseExtraida {
  id_temp: string;
  nome_arquivo: string;
  tamanho_bytes: number;
  numero_nfse: string;
  serie: string;
  chave_acesso: string;
  codigo_verificacao: string;
  data_emissao: string;
  tipo_operacao: 'PARCEIRO_PARA_EMPRESA' | 'EMPRESA_PARA_CLIENTE';
  
  // Prestador
  cnpj_prestador: string;
  razao_social_prestador: string;
  im_prestador?: string;
  
  // Tomador
  cnpj_tomador: string;
  razao_social_tomador: string;
  im_tomador?: string;
  
  // Valores
  valor_total: number;
  valor_deducoes: number;
  base_calculo: number;
  aliquota_iss: number;
  valor_iss: number;
  valor_liquido: number;
  
  // Detalhamento e Regras Lei 13.352/2016
  discriminacao_servicos: string;
  status: 'AUTORIZADA' | 'PENDENTE' | 'REJEITADA';
  mes_competencia: number;
  ano_competencia: number;
  
  // Associação inteligente com parceiro
  id_parceiro?: string;
  nome_parceiro_vinculado?: string;
  percentual_repasse_aplicado?: number;
  cota_salao_calculada: number;
  repasse_mei_calculado: number;
  
  // Validação
  duplicada: boolean;
  status_validacao: 'VALIDA' | 'ALERTA' | 'DUPLICADA' | 'ERRO';
  avisos_validacao: string[];
  xml_conteudo_bruto: string;
}

@Injectable({
  providedIn: 'root'
})
export class XmlNfseParserService {
  private readonly financeState = inject(FinanceStateService);

  /**
   * Faz o parse de múltiplos arquivos XML enviados pelo usuário
   */
  async processarArquivosXml(arquivos: File[]): Promise<NfseExtraida[]> {
    const resultados: NfseExtraida[] = [];

    for (const file of arquivos) {
      if (!file.name.toLowerCase().endsWith('.xml')) {
        continue;
      }

      try {
        const textoXml = await file.text();
        const nfseExtraida = this.parseXmlString(textoXml, file.name, file.size);
        resultados.push(nfseExtraida);
      } catch (err) {
        console.error(`Erro ao processar arquivo XML ${file.name}:`, err);
        resultados.push({
          id_temp: `err-${Date.now()}-${Math.random()}`,
          nome_arquivo: file.name,
          tamanho_bytes: file.size,
          numero_nfse: 'DESCONHECIDO',
          serie: 'XML',
          chave_acesso: 'ERRO_PARSE_XML',
          codigo_verificacao: 'ERR',
          data_emissao: new Date().toISOString(),
          tipo_operacao: 'PARCEIRO_PARA_EMPRESA',
          cnpj_prestador: '00.000.000/0000-00',
          razao_social_prestador: 'Erro ao interpretar XML',
          cnpj_tomador: '00.000.000/0000-00',
          razao_social_tomador: 'Não identificado',
          valor_total: 0,
          valor_deducoes: 0,
          base_calculo: 0,
          aliquota_iss: 0,
          valor_iss: 0,
          valor_liquido: 0,
          discriminacao_servicos: 'Formato XML inválido ou corrompido.',
          status: 'REJEITADA',
          mes_competencia: new Date().getMonth() + 1,
          ano_competencia: new Date().getFullYear(),
          cota_salao_calculada: 0,
          repasse_mei_calculado: 0,
          duplicada: false,
          status_validacao: 'ERRO',
          avisos_validacao: ['Arquivo XML não segue estrutura padrão de NFS-e ou está corrompido.'],
          xml_conteudo_bruto: ''
        });
      }
    }

    return resultados;
  }

  /**
   * Interpreta o texto XML de NFS-e nos principais padrões brasileiros
   */
  parseXmlString(xmlString: string, nomeArquivo: string = 'nfse_importada.xml', tamanhoBytes: number = 0): NfseExtraida {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, 'text/xml');

    // Verifica erros de sintaxe no XML
    const parserError = xmlDoc.getElementsByTagName('parsererror');
    if (parserError.length > 0) {
      throw new Error('Falha na estrutura do arquivo XML.');
    }

    // Funções auxiliares para leitura tolerante de tags (independente de namespace ou maiúsculas/minúsculas)
    const getTagValue = (tagNames: string[]): string => {
      for (const tag of tagNames) {
        const elements = xmlDoc.getElementsByTagName(tag);
        if (elements.length > 0 && elements[0].textContent) {
          const val = elements[0].textContent.trim();
          if (val) return val;
        }
      }
      return '';
    };

    const getNumberValue = (tagNames: string[]): number => {
      const raw = getTagValue(tagNames);
      if (!raw) return 0;
      // Normaliza vírgulas e pontos
      const clean = raw.replace(/\s/g, '').replace(',', '.');
      const num = parseFloat(clean);
      return isNaN(num) ? 0 : num;
    };

    // 1. Extração do Número e Série
    let numeroNfse = getTagValue(['Numero', 'NumeroNfse', 'NumeroNFe', 'nNFSe', 'nDPS', 'NumeroDocumento']);
    if (!numeroNfse) {
      // Tenta regex como fallback
      const matchNum = xmlString.match(/<(?:\w+:)?(?:Numero|NumeroNfse|NumeroNFe|nNFSe)>([^<]+)<\//i);
      numeroNfse = matchNum ? matchNum[1].trim() : `${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    }

    let serie = getTagValue(['Serie', 'SerieNfse', 'SerieNFe', 'sDPS', 'SerieDocumento']) || 'MEI';

    // 2. Chave de Acesso e Código de Verificação
    let codigoVerificacao = getTagValue(['CodigoVerificacao', 'CodVerificacao', 'CodigoAutenticidade', 'cVerif']) || 
      `ADN-${Math.floor(10000 + Math.random() * 90000)}-SP`;

    let chaveAcesso = getTagValue(['ChaveAcesso', 'ChaveNFe', 'chNFSe', 'Id', 'id']);
    if (chaveAcesso.startsWith('NFe') || chaveAcesso.startsWith('NFSe')) {
      chaveAcesso = chaveAcesso.replace(/^(NFe|NFSe)/i, '');
    }
    if (!chaveAcesso || chaveAcesso.length < 10) {
      chaveAcesso = `352608${Math.floor(10000000000000 + Math.random() * 90000000000000)}56001${numeroNfse.padStart(8, '0')}`;
    }

    // 3. Data e Hora de Emissão
    let dataEmissaoStr = getTagValue(['DataEmissao', 'DataEmissaoNFe', 'dhEmi', 'dEmi', 'DataGeracao', 'DataHoraEmissao']);
    let dataEmissao = new Date().toISOString();
    if (dataEmissaoStr) {
      const parsedDate = new Date(dataEmissaoStr);
      if (!isNaN(parsedDate.getTime())) {
        dataEmissao = parsedDate.toISOString();
      }
    }

    // 4. Dados do Prestador
    let cnpjPrestador = getTagValue(['CnpjPrestador', 'Cnpj', 'CNPJ', 'CPFCNPJPrestador', 'CNPJPrestador', 'CNPJ_Prestador']);
    if (!cnpjPrestador) {
      // Busca no bloco <Prestador> ou <PrestadorServico> ou <emit>
      const prestadorNode = xmlDoc.getElementsByTagName('PrestadorServico')[0] || 
                            xmlDoc.getElementsByTagName('Prestador')[0] || 
                            xmlDoc.getElementsByTagName('emit')[0] ||
                            xmlDoc.getElementsByTagName('IdentificacaoPrestador')[0];
      if (prestadorNode) {
        const cnpjEl = prestadorNode.getElementsByTagName('Cnpj')[0] || 
                       prestadorNode.getElementsByTagName('CNPJ')[0] ||
                       prestadorNode.getElementsByTagName('CPF')[0];
        if (cnpjEl && cnpjEl.textContent) cnpjPrestador = cnpjEl.textContent.trim();
      }
    }
    cnpjPrestador = this.formatarCnpjCpf(cnpjPrestador);

    let razaoSocialPrestador = getTagValue(['RazaoSocialPrestador', 'RazaoSocial', 'NomeRazaoSocial', 'xNome', 'NomeFantasia', 'NomePrestador']);
    if (!razaoSocialPrestador) {
      const prestadorNode = xmlDoc.getElementsByTagName('PrestadorServico')[0] || 
                            xmlDoc.getElementsByTagName('Prestador')[0] || 
                            xmlDoc.getElementsByTagName('emit')[0];
      if (prestadorNode) {
        const nomeEl = prestadorNode.getElementsByTagName('RazaoSocial')[0] || 
                       prestadorNode.getElementsByTagName('xNome')[0];
        if (nomeEl && nomeEl.textContent) razaoSocialPrestador = nomeEl.textContent.trim();
      }
    }
    if (!razaoSocialPrestador) razaoSocialPrestador = 'PRESTADOR DE SERVIÇOS NÃO IDENTIFICADO';

    const imPrestador = getTagValue(['InscricaoMunicipal', 'InscricaoMunicipalPrestador', 'IMPrestador', 'IM']);

    // 5. Dados do Tomador
    let cnpjTomador = getTagValue(['CnpjTomador', 'CpfTomador', 'CPFCNPJTomador', 'CNPJTomador']);
    if (!cnpjTomador) {
      const tomadorNode = xmlDoc.getElementsByTagName('TomadorServico')[0] || 
                          xmlDoc.getElementsByTagName('Tomador')[0] || 
                          xmlDoc.getElementsByTagName('toma')[0] ||
                          xmlDoc.getElementsByTagName('IdentificacaoTomador')[0];
      if (tomadorNode) {
        const cnpjEl = tomadorNode.getElementsByTagName('Cnpj')[0] || 
                       tomadorNode.getElementsByTagName('CNPJ')[0] || 
                       tomadorNode.getElementsByTagName('Cpf')[0] ||
                       tomadorNode.getElementsByTagName('CPF')[0];
        if (cnpjEl && cnpjEl.textContent) cnpjTomador = cnpjEl.textContent.trim();
      }
    }
    cnpjTomador = this.formatarCnpjCpf(cnpjTomador);

    let razaoSocialTomador = getTagValue(['RazaoSocialTomador', 'NomeTomador', 'RazaoSocialTomadorServico']);
    if (!razaoSocialTomador) {
      const tomadorNode = xmlDoc.getElementsByTagName('TomadorServico')[0] || 
                          xmlDoc.getElementsByTagName('Tomador')[0] || 
                          xmlDoc.getElementsByTagName('toma')[0];
      if (tomadorNode) {
        const nomeEl = tomadorNode.getElementsByTagName('RazaoSocial')[0] || 
                       tomadorNode.getElementsByTagName('xNome')[0];
        if (nomeEl && nomeEl.textContent) razaoSocialTomador = nomeEl.textContent.trim();
      }
    }
    if (!razaoSocialTomador) razaoSocialTomador = 'STUDIO CONCEPT BEAUTY & ESTETICA LTDA';

    const imTomador = getTagValue(['InscricaoMunicipalTomador']);

    // 6. Valores Monetários
    let valorTotal = getNumberValue(['ValorServicos', 'ValorTotal', 'vServ', 'vNFSe', 'vLiq', 'ValorLiquidoNfse']);
    const valorDeducoes = getNumberValue(['ValorDeducoes', 'vDed', 'Deducoes']);
    const valorIss = getNumberValue(['ValorIss', 'vISS', 'IssRetido']);
    let aliquotaIss = getNumberValue(['Aliquota', 'AliquotaIss', 'pAliq', 'AliquotaServico']);
    if (aliquotaIss > 1 && aliquotaIss <= 100) {
      // Ex: 2.0 ou 5.0
    } else if (aliquotaIss > 0 && aliquotaIss <= 1) {
      aliquotaIss = aliquotaIss * 100;
    }
    const baseCalculo = getNumberValue(['BaseCalculo', 'vBC', 'BaseCalculoIss']) || Math.max(0, valorTotal - valorDeducoes);
    const valorLiquido = getNumberValue(['ValorLiquidoNfse', 'vLiq']) || valorTotal;

    // 7. Discriminação dos Serviços
    let discriminacao = getTagValue(['Discriminacao', 'DiscriminacaoServico', 'xServ', 'Descricao', 'ItemListaServico', 'DiscriminacaoDosServicos']);
    if (!discriminacao) {
      discriminacao = 'Prestação de serviços de embelezamento/estética nos termos da Lei 13.352/2016 (Salão-Parceiro).';
    }

    // 8. Competência
    const dataObj = new Date(dataEmissao);
    const mesCompetencia = !isNaN(dataObj.getTime()) ? dataObj.getMonth() + 1 : new Date().getMonth() + 1;
    const anoCompetencia = !isNaN(dataObj.getTime()) ? dataObj.getFullYear() : new Date().getFullYear();

    // 9. Identificação do Tipo de Operação e Parceiro MEI
    const empresaAtual = this.financeState.empresaAtiva();
    const cnpjEmpresaLimpo = empresaAtual.cnpj.replace(/\D/g, '');
    const cnpjPrestadorLimpo = cnpjPrestador.replace(/\D/g, '');
    const cnpjTomadorLimpo = cnpjTomador.replace(/\D/g, '');

    let tipoOperacao: 'PARCEIRO_PARA_EMPRESA' | 'EMPRESA_PARA_CLIENTE' = 'PARCEIRO_PARA_EMPRESA';
    if (cnpjPrestadorLimpo === cnpjEmpresaLimpo) {
      tipoOperacao = 'EMPRESA_PARA_CLIENTE';
    } else {
      tipoOperacao = 'PARCEIRO_PARA_EMPRESA';
    }

    // Localizar parceiro cadastrado no sistema
    const parceiros = this.financeState.parceiros();
    const parceiroEncontrado = parceiros.find(p => {
      const pCnpj = p.cnpj.replace(/\D/g, '');
      const pCpf = p.cpf.replace(/\D/g, '');
      return (pCnpj && (pCnpj === cnpjPrestadorLimpo || pCnpj === cnpjTomadorLimpo)) ||
             (pCpf && (pCpf === cnpjPrestadorLimpo || pCpf === cnpjTomadorLimpo)) ||
             p.razao_social.toLowerCase() === razaoSocialPrestador.toLowerCase();
    });

    let percentualRepasse = parceiroEncontrado ? parceiroEncontrado.percentual_padrao_parceiro : 55;
    let cotaSalaoCalculada = 0;
    let repasseMeiCalculado = 0;

    if (tipoOperacao === 'PARCEIRO_PARA_EMPRESA') {
      // Quando a nota vem do MEI para o Salão, o valor da nota geralmente é o repasse líquido
      repasseMeiCalculado = valorTotal;
      const pctSal = (100 - percentualRepasse) / (percentualRepasse || 55);
      cotaSalaoCalculada = valorTotal * pctSal;
    } else {
      // Quando a nota foi emitida pelo salão para o cliente
      repasseMeiCalculado = valorTotal * (percentualRepasse / 100);
      cotaSalaoCalculada = valorTotal - repasseMeiCalculado;
    }

    // 10. Validação de Duplicidade no Estado Atual
    const notasExistentes = this.financeState.notasFiscais();
    const duplicada = notasExistentes.some(n => 
      n.numero_nfse === numeroNfse || 
      (n.chave_acesso && n.chave_acesso === chaveAcesso)
    );

    const avisos: string[] = [];
    let statusValidacao: 'VALIDA' | 'ALERTA' | 'DUPLICADA' | 'ERRO' = 'VALIDA';

    if (duplicada) {
      statusValidacao = 'DUPLICADA';
      avisos.push(`NFS-e Nº ${numeroNfse} já existe no banco de dados do sistema.`);
    }

    if (!parceiroEncontrado && tipoOperacao === 'PARCEIRO_PARA_EMPRESA') {
      statusValidacao = statusValidacao === 'VALIDA' ? 'ALERTA' : statusValidacao;
      avisos.push(`Prestador MEI (${razaoSocialPrestador}) ainda não possui cadastro formal no salão. O sistema criará o vínculo automaticamente.`);
    }

    if (valorTotal <= 0) {
      statusValidacao = 'ERRO';
      avisos.push('Valor total dos serviços está zerado no XML.');
    }

    return {
      id_temp: `import-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      nome_arquivo: nomeArquivo,
      tamanho_bytes: tamanhoBytes,
      numero_nfse: numeroNfse,
      serie,
      chave_acesso: chaveAcesso,
      codigo_verificacao: codigoVerificacao,
      data_emissao: dataEmissao,
      tipo_operacao: tipoOperacao,
      cnpj_prestador: cnpjPrestador,
      razao_social_prestador: razaoSocialPrestador,
      im_prestador: imPrestador,
      cnpj_tomador: cnpjTomador,
      razao_social_tomador: razaoSocialTomador,
      im_tomador: imTomador,
      valor_total: valorTotal,
      valor_deducoes: valorDeducoes,
      base_calculo: baseCalculo,
      aliquota_iss: aliquotaIss,
      valor_iss: valorIss,
      valor_liquido: valorLiquido,
      discriminacao_servicos: discriminacao,
      status: 'AUTORIZADA',
      mes_competencia: mesCompetencia,
      ano_competencia: anoCompetencia,
      id_parceiro: parceiroEncontrado?.id,
      nome_parceiro_vinculado: parceiroEncontrado?.nome_fantasia || parceiroEncontrado?.razao_social,
      percentual_repasse_aplicado: percentualRepasse,
      cota_salao_calculada: cotaSalaoCalculada,
      repasse_mei_calculado: repasseMeiCalculado,
      duplicada,
      status_validacao: statusValidacao,
      avisos_validacao: avisos,
      xml_conteudo_bruto: xmlString
    };
  }

  /**
   * Converte uma NFS-e extraída em registro de NotaFiscal definitivo para o FinanceStateService
   */
  converterParaNotaFiscal(item: NfseExtraida): NotaFiscal {
    return {
      id: `nfse-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      id_empresa: this.financeState.empresaAtiva().id,
      id_parceiro: item.id_parceiro,
      tipo_operacao: item.tipo_operacao,
      numero_nfse: item.numero_nfse,
      serie: item.serie || 'MEI',
      chave_acesso: item.chave_acesso,
      data_emissao: item.data_emissao,
      razao_social_prestador: item.razao_social_prestador,
      cnpj_prestador: item.cnpj_prestador,
      razao_social_tomador: item.razao_social_tomador,
      cnpj_tomador: item.cnpj_tomador,
      discriminacao_servicos: item.discriminacao_servicos,
      valor_total: item.valor_total,
      valor_iss: item.valor_iss,
      aliquota_iss: item.aliquota_iss,
      status: 'AUTORIZADA',
      codigo_verificacao: item.codigo_verificacao,
      protocolo_prefeitura: `PROT-XML-${Date.now().toString().slice(-6)}`
    };
  }

  /**
   * Executa a importação em lote no FinanceStateService
   */
  importarNotasNoSistema(notas: NfseExtraida[], criarParceirosNovos: boolean = true): { importadas: number; totalValor: number } {
    let count = 0;
    let somaValor = 0;
    const novasNotasFiscais: NotaFiscal[] = [];

    for (const item of notas) {
      if (item.status_validacao === 'ERRO') continue;

      let parceiroId = item.id_parceiro;

      // Auto-cadastrar parceiro caso solicitado e ainda não exista
      if (!parceiroId && item.tipo_operacao === 'PARCEIRO_PARA_EMPRESA' && criarParceirosNovos) {
        const novoId = `parc-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        this.financeState.adicionarParceiro({
          id_empresa: this.financeState.empresaAtiva().id,
          cnpj: item.cnpj_prestador,
          cpf: '000.000.000-00',
          razao_social: item.razao_social_prestador,
          nome_fantasia: item.razao_social_prestador.split(' ')[0] + ' (Parceiro MEI)',
          email: 'contato@parceiro.com.br',
          telefone: '(11) 99999-0000',
          especialidade: 'Cabeleireiro(a)',
          percentual_padrao_empresa: 45,
          percentual_padrao_parceiro: 55,
          status_contrato: 'HOMOLOGADO_SINDICATO',
          status_mei: 'ATIVO_REGULAR',
          faturamento_anual_acumulado: item.valor_total,
          teto_anual_mei: 81000.00,
          chave_pix_padrao: item.cnpj_prestador,
          tipo_chave_pix: 'CNPJ',
          data_inicio_parceria: new Date().toISOString().split('T')[0],
          foto_avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&h=120&q=80'
        });
        parceiroId = novoId;
      }

      const notaParaSalvar = this.converterParaNotaFiscal({ ...item, id_parceiro: parceiroId });
      novasNotasFiscais.push(notaParaSalvar);
      count++;
      somaValor += item.valor_total;
    }

    if (novasNotasFiscais.length > 0) {
      this.financeState.notasFiscais.update(atuais => [...novasNotasFiscais, ...atuais]);
    }

    return {
      importadas: count,
      totalValor: somaValor
    };
  }

  /**
   * Helper para formatar CPF/CNPJ de acordo com a quantidade de dígitos
   */
  private formatarCnpjCpf(valor: string): string {
    if (!valor) return '00.000.000/0001-00';
    const nums = valor.replace(/\D/g, '');
    if (nums.length === 14) {
      return nums.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    } else if (nums.length === 11) {
      return nums.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }
    return valor;
  }

  /**
   * Fornece exemplos de XML de NFS-e padrão para teste rápido
   */
  obterModelosExemploXml(): { nome: string; descricao: string; conteudo: string }[] {
    return [
      {
        nome: 'NFS-e Juliana Paes (Hairstylist MEI)',
        descricao: 'NFS-e de repasse emitida por Juliana Paes MEI contra o Salão Concept (Lei 13.352/2016)',
        conteudo: `<?xml version="1.0" encoding="UTF-8"?>
<CompNfse xmlns="http://www.abrasf.org.br/nfse.xsd">
  <Nfse versao="2.02">
    <InfNfse Id="NFSe20260012">
      <Numero>2026-0012</Numero>
      <CodigoVerificacao>ADN-99821-SP</CodigoVerificacao>
      <DataEmissao>2026-08-15T14:30:00</DataEmissao>
      <IdentificacaoPrestador>
        <CpfCnpj>
          <Cnpj>38112904000112</Cnpj>
        </CpfCnpj>
        <InscricaoMunicipal>48910023</InscricaoMunicipal>
      </IdentificacaoPrestador>
      <RazaoSocialPrestador>JULIANA PAES BEAUTY &amp; HAIR MEI</RazaoSocialPrestador>
      <NomeFantasia>Juliana Paes Hairstylist</NomeFantasia>
      <DeclaracaoPrestacaoServico>
        <IdentificacaoTomador>
          <CpfCnpj>
            <Cnpj>24981332000145</Cnpj>
          </CpfCnpj>
          <RazaoSocial>STUDIO CONCEPT BEAUTY &amp; ESTETICA LTDA</RazaoSocial>
          <InscricaoMunicipal>58912041</InscricaoMunicipal>
        </IdentificacaoTomador>
        <Servico>
          <Valores>
            <ValorServicos>9680.00</ValorServicos>
            <ValorDeducoes>0.00</ValorDeducoes>
            <ValorIss>0.00</ValorIss>
            <Aliquota>0.00</Aliquota>
            <BaseCalculo>9680.00</BaseCalculo>
            <ValorLiquidoNfse>9680.00</ValorLiquidoNfse>
          </Valores>
          <ItemListaServico>06.01</ItemListaServico>
          <CodigoCnae>9602501</CodigoCnae>
          <Discriminacao>Serviços de cabeleireiro e corte executados por profissional-parceiro MEI nos termos do Art. 1-A da Lei Federal 13.352/2016. Competência 08/2026. Optante do SIMEI / Isenção de retenção de ISS na fonte.</Discriminacao>
          <MunicipioPrestacaoServico>3550308</MunicipioPrestacaoServico>
        </Servico>
      </DeclaracaoPrestacaoServico>
    </InfNfse>
  </Nfse>
</CompNfse>`
      },
      {
        nome: 'NFS-e Marcos Silva (Barbearia MEI)',
        descricao: 'NFS-e Padrão Nacional SEFAZ emitida por Marcos Silva Barbeiro MEI',
        conteudo: `<?xml version="1.0" encoding="UTF-8"?>
<NFSe xmlns="http://www.sped.fazenda.gov.br/nfse">
  <infNFSe Id="35260841220890000133560010000000451234567890">
    <nNFSe>2026-0045</nNFSe>
    <cVerif>ADN-44210-SP</cVerif>
    <dhEmi>2026-08-20T10:15:00-03:00</dhEmi>
    <emit>
      <CNPJ>41220890000133</CNPJ>
      <xNome>MARCOS SILVA BARBEARIA &amp; VISAGISMO MEI</xNome>
      <IM>3981120</IM>
      <CRT>4</CRT>
    </emit>
    <toma>
      <CNPJ>24981332000145</CNPJ>
      <xNome>STUDIO CONCEPT BEAUTY &amp; ESTETICA LTDA</xNome>
    </toma>
    <serv>
      <vServ>6240.00</vServ>
      <vDed>0.00</vDed>
      <vISS>0.00</vISS>
      <pAliq>0.00</pAliq>
      <xServ>Serviços de barbearia, design de barba e visagismo prestados na condição de parceiro MEI Lei 13.352/2016 ref. quinzena de Agosto/2026.</xServ>
    </serv>
  </infNFSe>
</NFSe>`
      },
      {
        nome: 'NFS-e Novo Profissional (Eduardo Castro Estética MEI)',
        descricao: 'NFS-e de novo parceiro não cadastrado previamente (testa auto-cadastro inteligente)',
        conteudo: `<?xml version="1.0" encoding="UTF-8"?>
<PedidoConsultaNFe xmlns="http://www.prefeitura.sp.gov.br/nfe">
  <NotaFiscalSP>
    <ChaveNFe>
      <InscricaoPrestador>7991204</InscricaoPrestador>
      <NumeroNFe>2026-0118</NumeroNFe>
      <CodigoVerificacao>ADN-88192-SP</CodigoVerificacao>
    </ChaveNFe>
    <DataEmissaoNFe>2026-08-22T16:00:00</DataEmissaoNFe>
    <CPFCNPJPrestador>
      <CNPJ>53991204000199</CNPJ>
    </CPFCNPJPrestador>
    <RazaoSocialPrestador>EDUARDO CASTRO TERAPIAS CAPILARES &amp; TRICOLOGIA MEI</RazaoSocialPrestador>
    <CPFCNPJTomador>
      <CNPJ>24981332000145</CNPJ>
    </CPFCNPJTomador>
    <RazaoSocialTomador>STUDIO CONCEPT BEAUTY &amp; ESTETICA LTDA</RazaoSocialTomador>
    <ValorServicos>4850.00</ValorServicos>
    <ValorDeducoes>0.00</ValorDeducoes>
    <ValorIss>0.00</ValorIss>
    <AliquotaServicos>0.00</AliquotaServicos>
    <Discriminacao>Tratamentos capilares especializados e tricologia estética. Serviços nos termos da Lei 13.352/2016 do Salão Parceiro.</Discriminacao>
  </NotaFiscalSP>
</PedidoConsultaNFe>`
      },
      {
        nome: 'NFS-e Faturamento Salão -> Cliente Final',
        descricao: 'NFS-e com dedução da cota de terceiros emitida pelo salão para cliente',
        conteudo: `<?xml version="1.0" encoding="UTF-8"?>
<CompNfse xmlns="http://www.abrasf.org.br/nfse.xsd">
  <Nfse versao="2.02">
    <InfNfse Id="NFSe20260901">
      <Numero>2026-0901</Numero>
      <CodigoVerificacao>ADN-33019-SP</CodigoVerificacao>
      <DataEmissao>2026-08-25T17:45:00</DataEmissao>
      <IdentificacaoPrestador>
        <CpfCnpj>
          <Cnpj>24981332000145</Cnpj>
        </CpfCnpj>
        <InscricaoMunicipal>58912041</InscricaoMunicipal>
      </IdentificacaoPrestador>
      <RazaoSocialPrestador>STUDIO CONCEPT BEAUTY &amp; ESTETICA LTDA</RazaoSocialPrestador>
      <DeclaracaoPrestacaoServico>
        <IdentificacaoTomador>
          <CpfCnpj>
            <Cpf>39811455209</Cpf>
          </CpfCnpj>
          <RazaoSocial>MARIANA VASCONCELLOS PINTO</RazaoSocial>
        </IdentificacaoTomador>
        <Servico>
          <Valores>
            <ValorServicos>1850.00</ValorServicos>
            <ValorDeducoes>1017.50</ValorDeducoes>
            <BaseCalculo>832.50</BaseCalculo>
            <Aliquota>2.00</Aliquota>
            <ValorIss>16.65</ValorIss>
            <ValorLiquidoNfse>1850.00</ValorLiquidoNfse>
          </Valores>
          <ItemListaServico>06.01</ItemListaServico>
          <Discriminacao>Serviços de beleza e estética. Cota do salão-parceiro calculada nos termos da Lei Federal 13.352/2016 com dedução dos repasses aos profissionais MEI.</Discriminacao>
        </Servico>
      </DeclaracaoPrestacaoServico>
    </InfNfse>
  </Nfse>
</CompNfse>`
      }
    ];
  }
}
