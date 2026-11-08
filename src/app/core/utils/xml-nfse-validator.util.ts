import { validarCNPJ, validarCPF } from './cpf-cnpj.util';

export interface XmlValidationError {
  campo: string;
  mensagem: string;
  codigo: string;
  critico: boolean;
}

export interface XmlValidationWarning {
  campo: string;
  mensagem: string;
  sugestao?: string;
}

export interface XmlNfseDadosExtraidos {
  padraoXml: 'ABRASF_V2' | 'ABRASF_V1' | 'PADRAO_NACIONAL_DPS' | 'DESCONHECIDO';
  tipoDocumento: 'RPS' | 'NFSE' | 'LOTE_RPS';
  numeroRps?: string;
  serieRps?: string;
  dataEmissao?: string;
  prestador: {
    cnpjCpf: string;
    inscricaoMunicipal?: string;
    razaoSocial?: string;
    optanteSimplesNacional?: boolean;
    regimeEspecialTributacao?: string;
  };
  tomador: {
    cnpjCpf: string;
    razaoSocialNome?: string;
    inscricaoMunicipal?: string;
    email?: string;
    telefone?: string;
    endereco?: {
      logradouro?: string;
      numero?: string;
      bairro?: string;
      codigoMunicipio?: string;
      uf?: string;
      cep?: string;
    };
  };
  servico: {
    itemListaServico?: string;
    codigoCnae?: string;
    codigoTributacaoMunicipio?: string;
    discriminacao?: string;
    codigoMunicipio?: string;
    exigibilidadeIss?: string;
  };
  valores: {
    valorServicos: number;
    valorDeducoes: number;
    valorPis: number;
    valorCofins: number;
    valorInss: number;
    valorIr: number;
    valorCsll: number;
    outrasRetencoes: number;
    valorIss: number;
    aliquota: number;
    descontoIncondicionado: number;
    descontoCondicionado: number;
    issRetido: boolean;
    baseCalculo: number;
    valorLiquidoNfse: number;
  };
  segregacaoSalaoParceiro?: {
    detectada: boolean;
    cotaParteParceiro?: number;
    cotaParteSalao?: number;
    cnpjProfissionalParceiro?: string;
  };
}

export interface XmlNfseValidationResult {
  valido: boolean;
  erros: XmlValidationError[];
  avisos: XmlValidationWarning[];
  dadosExtraidos?: XmlNfseDadosExtraidos;
  resumoConformidade: string;
}

/**
 * Utilitário completo para validação semântica e estrutural de arquivos XML de NFS-e (RPS/DPS/Lote)
 * antes da transmissão para o WebService municipal ou nacional.
 */
export class XmlNfseValidator {

  /**
   * Valida uma string contendo XML de NFS-e e retorna diagnóstico detalhado.
   */
  public static validar(xmlConteudo: string): XmlNfseValidationResult {
    const erros: XmlValidationError[] = [];
    const avisos: XmlValidationWarning[] = [];

    if (!xmlConteudo || xmlConteudo.trim().length === 0) {
      return {
        valido: false,
        erros: [{
          campo: 'Arquivo XML',
          mensagem: 'O arquivo XML está vazio ou não pôde ser lido.',
          codigo: 'XML_VAZIO',
          critico: true
        }],
        avisos: [],
        resumoConformidade: 'Falha crítica: Conteúdo XML nulo ou vazio.'
      };
    }

    // 1. Verificação sintática básica do XML
    let xmlDoc: Document;
    try {
      if (typeof DOMParser !== 'undefined') {
        const parser = new DOMParser();
        xmlDoc = parser.parseFromString(xmlConteudo, 'application/xml');
        const parserError = xmlDoc.querySelector('parsererror');
        if (parserError) {
          return {
            valido: false,
            erros: [{
              campo: 'Sintaxe XML',
              mensagem: `Erro de sintaxe XML: ${parserError.textContent?.slice(0, 200)}`,
              codigo: 'SINTAXE_XML_INVALIDA',
              critico: true
            }],
            avisos: [],
            resumoConformidade: 'Falha de sintaxe: O arquivo não é um XML bem-formado.'
          };
        }
      } else {
        // Fallback caso executado em ambiente sem DOMParser
        return this.validarPorRegex(xmlConteudo);
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      return {
        valido: false,
        erros: [{
          campo: 'Parser XML',
          mensagem: `Não foi possível analisar o XML: ${msg}`,
          codigo: 'ERRO_PARSER',
          critico: true
        }],
        avisos: [],
        resumoConformidade: 'Falha de leitura do arquivo XML.'
      };
    }

    // 2. Identificação do Padrão e Tag Raiz
    const rootTag = xmlDoc.documentElement.nodeName;
    let padrao: 'ABRASF_V2' | 'ABRASF_V1' | 'PADRAO_NACIONAL_DPS' | 'DESCONHECIDO' = 'DESCONHECIDO';
    let tipoDoc: 'RPS' | 'NFSE' | 'LOTE_RPS' = 'RPS';

    if (rootTag.includes('DPS') || rootTag.includes('dps') || xmlDoc.querySelector('infDPS, InfDPS')) {
      padrao = 'PADRAO_NACIONAL_DPS';
      tipoDoc = 'RPS';
    } else if (rootTag.includes('CompNfse') || xmlDoc.querySelector('CompNfse, CompNFSe, TcCompNfse')) {
      padrao = 'ABRASF_V2';
      tipoDoc = 'NFSE';
    } else if (rootTag.includes('EnviarLoteRpsEnvio') || rootTag.includes('LoteRps')) {
      padrao = 'ABRASF_V2';
      tipoDoc = 'LOTE_RPS';
    } else if (xmlDoc.querySelector('Rps, InfRps, tcDeclaracaoPrestacaoServico, DeclaracaoPrestacaoServico')) {
      padrao = 'ABRASF_V2';
      tipoDoc = 'RPS';
    } else {
      avisos.push({
        campo: 'Raiz do Documento',
        mensagem: `Tag raiz '${rootTag}' não corresponde exatamente ao padrão canônico ABRASF v2.04 ou DPS Nacional.`,
        sugestao: 'Certifique-se de que a tag raiz seja <EnviarLoteRpsEnvio>, <GerarNfseEnvio> ou <DPS>.'
      });
    }

    // 3. Extração e Validação do Prestador
    const cnpjPrestador = this.obterTextoTag(xmlDoc, ['Prestador > CpfCnpj > Cnpj', 'Prestador > Cnpj', 'prest > CNPJ', 'emit > CNPJ', 'CnpjPrestador', 'Cnpj']);
    const imPrestador = this.obterTextoTag(xmlDoc, ['Prestador > InscricaoMunicipal', 'prest > IM', 'InscricaoMunicipalPrestador', 'InscricaoMunicipal']);
    const optanteSN = this.obterTextoTag(xmlDoc, ['OptanteSimplesNacional', 'optSN', 'optanteSimplesNacional']);
    const razaoSocialPrestador = this.obterTextoTag(xmlDoc, ['Prestador > RazaoSocial', 'RazaoSocialPrestador', 'prest > xNome']);

    if (!cnpjPrestador) {
      erros.push({
        campo: 'Prestador - CNPJ/CPF',
        mensagem: 'CNPJ do Prestador de Serviços não foi informado na tag <Prestador>.',
        codigo: 'PRESTADOR_CNPJ_AUSENTE',
        critico: true
      });
    } else {
      const cnpjLimpo = cnpjPrestador.replace(/\D/g, '');
      if (!validarCNPJ(cnpjLimpo) && !validarCPF(cnpjLimpo)) {
        erros.push({
          campo: 'Prestador - CNPJ/CPF',
          mensagem: `CNPJ/CPF do Prestador '${cnpjPrestador}' é matematicamente inválido.`,
          codigo: 'PRESTADOR_CNPJ_INVALIDO',
          critico: true
        });
      }
    }

    if (!imPrestador && padrao !== 'PADRAO_NACIONAL_DPS') {
      avisos.push({
        campo: 'Prestador - Inscrição Municipal',
        mensagem: 'Inscrição Municipal do Prestador não informada. A maioria das prefeituras exige este campo.',
        sugestao: 'Informe a tag <InscricaoMunicipal> do emissor.'
      });
    }

    if (!optanteSN) {
      avisos.push({
        campo: 'Prestador - Simples Nacional',
        mensagem: 'Indicador <OptanteSimplesNacional> não informado (1=Sim, 2=Não).',
        sugestao: 'Defina 1 para optante do Simples Nacional ou 2 para não optante.'
      });
    }

    // 4. Extração e Validação do Tomador
    const cpfCnpjTomador = this.obterTextoTag(xmlDoc, [
      'Tomador > IdentificacaoTomador > CpfCnpj > Cpf',
      'Tomador > IdentificacaoTomador > CpfCnpj > Cnpj',
      'TomadorServico > IdentificacaoTomador > CpfCnpj > Cpf',
      'TomadorServico > IdentificacaoTomador > CpfCnpj > Cnpj',
      'Tomador > CpfCnpj > Cpf',
      'Tomador > CpfCnpj > Cnpj',
      'toma > CPF',
      'toma > CNPJ',
      'CpfCnpjTomador',
      'CpfTomador',
      'CnpjTomador'
    ]);
    const razaoSocialTomador = this.obterTextoTag(xmlDoc, ['Tomador > RazaoSocial', 'TomadorServico > RazaoSocial', 'toma > xNome', 'RazaoSocialTomador']);
    const emailTomador = this.obterTextoTag(xmlDoc, ['Tomador > Contato > Email', 'toma > enderTomador > email', 'EmailTomador', 'Email']);
    const codMunTomador = this.obterTextoTag(xmlDoc, ['Tomador > Endereco > CodigoMunicipio', 'toma > enderTomador > cMun', 'CodigoMunicipioTomador']);
    const ufTomador = this.obterTextoTag(xmlDoc, ['Tomador > Endereco > Uf', 'toma > enderTomador > UF', 'UfTomador']);
    const cepTomador = this.obterTextoTag(xmlDoc, ['Tomador > Endereco > Cep', 'toma > enderTomador > CEP', 'CepTomador']);

    if (!razaoSocialTomador || razaoSocialTomador.trim().length < 2) {
      erros.push({
        campo: 'Tomador - Razão Social / Nome',
        mensagem: 'Razão Social ou Nome do Tomador não informado ou muito curto.',
        codigo: 'TOMADOR_NOME_AUSENTE',
        critico: true
      });
    }

    if (cpfCnpjTomador) {
      const docTomadorLimpo = cpfCnpjTomador.replace(/\D/g, '');
      if (docTomadorLimpo.length === 11) {
        if (!validarCPF(docTomadorLimpo)) {
          erros.push({
            campo: 'Tomador - CPF',
            mensagem: `CPF do Tomador '${cpfCnpjTomador}' possui dígitos verificadores inválidos.`,
            codigo: 'TOMADOR_CPF_INVALIDO',
            critico: true
          });
        }
      } else if (docTomadorLimpo.length === 14) {
        if (!validarCNPJ(docTomadorLimpo)) {
          erros.push({
            campo: 'Tomador - CNPJ',
            mensagem: `CNPJ do Tomador '${cpfCnpjTomador}' é inválido.`,
            codigo: 'TOMADOR_CNPJ_INVALIDO',
            critico: true
          });
        }
      } else if (docTomadorLimpo.length > 0) {
        erros.push({
          campo: 'Tomador - Documento',
          mensagem: `Documento do Tomador possui tamanho incompatível (${docTomadorLimpo.length} dígitos).`,
          codigo: 'TOMADOR_DOC_TAMANHO_INVALIDO',
          critico: true
        });
      }
    } else {
      avisos.push({
        campo: 'Tomador - CPF/CNPJ',
        mensagem: 'NFS-e sem documento do Tomador (Consumidor Não Identificado).',
        sugestao: 'Válido para serviços rápidos a pessoa física, mas algumas prefeituras exigem CPF para dedução de ISS.'
      });
    }

    if (emailTomador && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTomador)) {
      avisos.push({
        campo: 'Tomador - E-mail',
        mensagem: `E-mail '${emailTomador}' está em formato inválido e não receberá o DANFSe.`,
        sugestao: 'Corrija para o formato nome@dominio.com.br.'
      });
    }

    if (codMunTomador && codMunTomador.replace(/\D/g, '').length !== 7) {
      avisos.push({
        campo: 'Tomador - Código Município IBGE',
        mensagem: `Código de município do tomador '${codMunTomador}' deve ter 7 dígitos IBGE.`,
        sugestao: 'Utilize o código oficial IBGE do município (ex: 3550308 para São Paulo).'
      });
    }

    // 5. Extração e Validação do Serviço
    const itemListaServico = this.obterTextoTag(xmlDoc, ['ItemListaServico', 'itemListaServico', 'cTribNac', 'ItemServico']);
    const codCnae = this.obterTextoTag(xmlDoc, ['CodigoCnae', 'CNAE', 'cnae']);
    const codTribMunicipio = this.obterTextoTag(xmlDoc, ['CodigoTributacaoMunicipio', 'cTribMun']);
    const discriminacao = this.obterTextoTag(xmlDoc, ['Discriminacao', 'discriminacao', 'xDescServ', 'DiscriminacaoServico']);
    const codMunPrestacao = this.obterTextoTag(xmlDoc, ['CodigoMunicipio', 'cLocPrestacao', 'CodigoMunicipioPrestacao', 'cMun']);

    if (!itemListaServico) {
      erros.push({
        campo: 'Serviço - Item LC 116/2003',
        mensagem: 'Tag <ItemListaServico> obrigatória conforme Lei Complementar 116/2003.',
        codigo: 'SERVICO_ITEM_LC116_AUSENTE',
        critico: true
      });
    } else {
      // Itens comuns de beleza: 06.01, 06.02, 14.01
      const itemFmt = itemListaServico.replace(/\D/g, '');
      if (itemFmt.length < 3) {
        avisos.push({
          campo: 'Serviço - Formato Item LC 116',
          mensagem: `Item da lista '${itemListaServico}' pode requerer formato canônico (ex: 06.01 ou 6.01).`,
          sugestao: 'Verifique o padrão aceito pelo seu município.'
        });
      }
    }

    if (!discriminacao || discriminacao.trim().length < 5) {
      erros.push({
        campo: 'Serviço - Discriminação',
        mensagem: 'Discriminação dos serviços prestados ausente ou com menos de 5 caracteres.',
        codigo: 'SERVICO_DISCRIMINACAO_CURTA',
        critico: true
      });
    }

    // 6. Extração e Validação dos Valores e Alíquotas
    const strValorServicos = this.obterTextoTag(xmlDoc, ['ValorServicos', 'vServ', 'valorServicos', 'ValorTotal']);
    const strValorDeducoes = this.obterTextoTag(xmlDoc, ['ValorDeducoes', 'vDed', 'valorDeducoes']);
    const strValorPis = this.obterTextoTag(xmlDoc, ['ValorPis', 'vPIS', 'valorPis']);
    const strValorCofins = this.obterTextoTag(xmlDoc, ['ValorCofins', 'vCOFINS', 'valorCofins']);
    const strValorInss = this.obterTextoTag(xmlDoc, ['ValorInss', 'vINSS', 'valorInss']);
    const strValorIr = this.obterTextoTag(xmlDoc, ['ValorIr', 'vIR', 'valorIr']);
    const strValorCsll = this.obterTextoTag(xmlDoc, ['ValorCsll', 'vCSLL', 'valorCsll']);
    const strValorIss = this.obterTextoTag(xmlDoc, ['ValorIss', 'vISS', 'valorIss']);
    const strAliquota = this.obterTextoTag(xmlDoc, ['Aliquota', 'pAliq', 'aliquota']);
    const strIssRetido = this.obterTextoTag(xmlDoc, ['IssRetido', 'issRetido', 'tpRetISS']);
    const strBaseCalculo = this.obterTextoTag(xmlDoc, ['BaseCalculo', 'vBC', 'baseCalculo']);
    const strValorLiquido = this.obterTextoTag(xmlDoc, ['ValorLiquidoNfse', 'vLiq', 'valorLiquido']);

    const valorServicos = parseFloat(strValorServicos?.replace(',', '.') || '0');
    const valorDeducoes = parseFloat(strValorDeducoes?.replace(',', '.') || '0');
    const valorIss = parseFloat(strValorIss?.replace(',', '.') || '0');
    const aliquota = parseFloat(strAliquota?.replace(',', '.') || '0');
    const issRetido = strIssRetido === '1' || strIssRetido?.toLowerCase() === 'true' || strIssRetido?.toLowerCase() === 'sim';
    const baseCalculo = parseFloat(strBaseCalculo?.replace(',', '.') || String(Math.max(0, valorServicos - valorDeducoes)));
    const valorLiquido = parseFloat(strValorLiquido?.replace(',', '.') || String(valorServicos));

    if (valorServicos <= 0 || isNaN(valorServicos)) {
      erros.push({
        campo: 'Valores - Valor dos Serviços',
        mensagem: 'O <ValorServicos> deve ser maior que zero.',
        codigo: 'VALOR_SERVICOS_ZERADO',
        critico: true
      });
    }

    if (aliquota > 0) {
      // Normaliza se veio em porcentagem (ex: 5.0 ou 0.05)
      const aliquotaPercentual = aliquota <= 0.10 ? aliquota * 100 : aliquota;
      if (aliquotaPercentual < 2.0 && optanteSN !== '1') {
        avisos.push({
          campo: 'Valores - Alíquota ISS',
          mensagem: `Alíquota de ISS (${aliquotaPercentual.toFixed(2)}%) inferior ao piso constitucional de 2,00% (LC 116/2003 art. 8º-A).`,
          sugestao: 'Válido apenas se a empresa for optante do Simples Nacional ou houver regime especial.'
        });
      }
      if (aliquotaPercentual > 5.0) {
        erros.push({
          campo: 'Valores - Alíquota ISS',
          mensagem: `Alíquota de ISS (${aliquotaPercentual.toFixed(2)}%) excede o teto constitucional de 5,00% (LC 116/2003 art. 8º).`,
          codigo: 'ALIQUOTA_ISS_ACIMA_TETO',
          critico: true
        });
      }
    }

    // 7. Detecção de Segregação Lei do Salão-Parceiro (Lei 13.352/2016)
    let segregacaoDetectada = false;
    let cotaParteParceiro = 0;
    let cotaParteSalao = 0;

    if (discriminacao) {
      const discUpper = discriminacao.toUpperCase();
      if (discUpper.includes('LEI 13.352') || discUpper.includes('SALAO-PARCEIRO') || discUpper.includes('SALÃO-PARCEIRO') || discUpper.includes('COTA-PARTE')) {
        segregacaoDetectada = true;
        // Tenta extrair valores descritos
        const matchCota = discriminacao.match(/cota[^\d]*(\d+[.,]\d{2})/i);
        if (matchCota) {
          cotaParteParceiro = parseFloat(matchCota[1].replace(',', '.'));
          cotaParteSalao = Math.max(0, valorServicos - cotaParteParceiro);
        }
      }
    }

    const dadosExtraidos: XmlNfseDadosExtraidos = {
      padraoXml: padrao,
      tipoDocumento: tipoDoc,
      numeroRps: this.obterTextoTag(xmlDoc, ['NumeroRps', 'IdentificacaoRps > Numero', 'nDPS', 'Numero']),
      serieRps: this.obterTextoTag(xmlDoc, ['SerieRps', 'IdentificacaoRps > Serie', 'serieDPS', 'Serie']),
      dataEmissao: this.obterTextoTag(xmlDoc, ['DataEmissao', 'dhEmi', 'DataEmissaoRps']),
      prestador: {
        cnpjCpf: cnpjPrestador || '',
        inscricaoMunicipal: imPrestador,
        razaoSocial: razaoSocialPrestador,
        optanteSimplesNacional: optanteSN === '1',
        regimeEspecialTributacao: this.obterTextoTag(xmlDoc, ['RegimeEspecialTributacao', 'regEspTrib'])
      },
      tomador: {
        cnpjCpf: cpfCnpjTomador || '',
        razaoSocialNome: razaoSocialTomador,
        inscricaoMunicipal: this.obterTextoTag(xmlDoc, ['Tomador > InscricaoMunicipal', 'InscricaoMunicipalTomador']),
        email: emailTomador,
        telefone: this.obterTextoTag(xmlDoc, ['Tomador > Contato > Telefone', 'Telefone']),
        endereco: {
          logradouro: this.obterTextoTag(xmlDoc, ['Tomador > Endereco > Logradouro', 'toma > enderTomador > xLgr', 'Endereco']),
          numero: this.obterTextoTag(xmlDoc, ['Tomador > Endereco > Numero', 'toma > enderTomador > nro', 'Numero']),
          bairro: this.obterTextoTag(xmlDoc, ['Tomador > Endereco > Bairro', 'toma > enderTomador > xBairro', 'Bairro']),
          codigoMunicipio: codMunTomador,
          uf: ufTomador,
          cep: cepTomador
        }
      },
      servico: {
        itemListaServico,
        codigoCnae: codCnae,
        codigoTributacaoMunicipio: codTribMunicipio,
        discriminacao,
        codigoMunicipio: codMunPrestacao,
        exigibilidadeIss: this.obterTextoTag(xmlDoc, ['ExigibilidadeISS', 'exigISS'])
      },
      valores: {
        valorServicos,
        valorDeducoes,
        valorPis: parseFloat(strValorPis?.replace(',', '.') || '0'),
        valorCofins: parseFloat(strValorCofins?.replace(',', '.') || '0'),
        valorInss: parseFloat(strValorInss?.replace(',', '.') || '0'),
        valorIr: parseFloat(strValorIr?.replace(',', '.') || '0'),
        valorCsll: parseFloat(strValorCsll?.replace(',', '.') || '0'),
        outrasRetencoes: 0,
        valorIss,
        aliquota,
        descontoIncondicionado: 0,
        descontoCondicionado: 0,
        issRetido,
        baseCalculo,
        valorLiquidoNfse: valorLiquido
      },
      segregacaoSalaoParceiro: segregacaoDetectada ? {
        detectada: true,
        cotaParteParceiro,
        cotaParteSalao
      } : undefined
    };

    const valido = erros.length === 0;
    let resumo = '';
    if (valido && avisos.length === 0) {
      resumo = 'Estrutura XML 100% conforme às normas ABRASF e legislação municipal vigente.';
    } else if (valido && avisos.length > 0) {
      resumo = `XML válido para envio com ${avisos.length} aviso(s) de boas práticas fiscais.`;
    } else {
      resumo = `XML com ${erros.length} erro(s) crítico(s) que causarão rejeição na Prefeitura.`;
    }

    return {
      valido,
      erros,
      avisos,
      dadosExtraidos,
      resumoConformidade: resumo
    };
  }

  /**
   * Validação leve alternativa por Expressões Regulares caso o parser nativo não esteja disponível.
   */
  private static validarPorRegex(xml: string): XmlNfseValidationResult {
    const erros: XmlValidationError[] = [];
    const avisos: XmlValidationWarning[] = [];

    const hasCnpj = /<Cnpj>([^<]+)<\/Cnpj>/i.test(xml) || /<CNPJ>([^<]+)<\/CNPJ>/i.test(xml);
    const hasValor = /<ValorServicos>([^<]+)<\/ValorServicos>/i.test(xml) || /<vServ>([^<]+)<\/vServ>/i.test(xml);
    const hasItem = /<ItemListaServico>([^<]+)<\/ItemListaServico>/i.test(xml);

    if (!hasCnpj) {
      erros.push({
        campo: 'Prestador',
        mensagem: 'CNPJ do prestador não localizado nas tags XML.',
        codigo: 'CNPJ_NAO_ENCONTRADO',
        critico: true
      });
    }

    if (!hasValor) {
      erros.push({
        campo: 'Valores',
        mensagem: 'Valor dos serviços não localizado nas tags XML.',
        codigo: 'VALOR_NAO_ENCONTRADO',
        critico: true
      });
    }

    if (!hasItem) {
      avisos.push({
        campo: 'Serviço',
        mensagem: 'Tag ItemListaServico recomendada para evitar rejeição tributária.'
      });
    }

    return {
      valido: erros.length === 0,
      erros,
      avisos,
      resumoConformidade: erros.length === 0 ? 'XML validado via expressões regulares.' : 'Erros detectados no XML.'
    };
  }

  /**
   * Extrai o valor de texto da primeira tag encontrada na lista de seletores fornecida.
   */
  private static obterTextoTag(doc: Document, selectors: string[]): string | undefined {
    for (const selector of selectors) {
      try {
        const el = doc.querySelector(selector);
        if (el && el.textContent) {
          const text = el.textContent.trim();
          if (text) return text;
        }
      } catch {
        // Seletor complexo não suportado pelo querySelector simples, tenta busca por tagName
        const tagName = selector.split('>').pop()?.trim();
        if (tagName) {
          const elements = doc.getElementsByTagName(tagName);
          if (elements.length > 0 && elements[0].textContent) {
            const text = elements[0].textContent.trim();
            if (text) return text;
          }
        }
      }
    }
    return undefined;
  }
}
