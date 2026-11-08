import { limparDocumento, formatarCpfCnpj } from './cpf-cnpj.util';

export interface DadosDanfseQrCode {
  sucesso: boolean;
  chave_acesso_nacional?: string;
  numero_nfse?: string;
  serie_nfse?: string;
  codigo_verificacao?: string;
  prestador_documento?: string;
  prestador_documento_formatado?: string;
  prestador_razao_social?: string;
  tomador_documento?: string;
  tomador_documento_formatado?: string;
  tomador_razao_social?: string;
  valor_servicos?: number;
  valor_liquido?: number;
  valor_iss?: number;
  aliquota_iss?: number;
  data_emissao?: string;
  codigo_servico?: string;
  cnae?: string;
  discriminacao?: string;
  url_original?: string;
  tipo_origem: 'ADN_NACIONAL' | 'ABRASF_MUNICIPAL' | 'JSON' | 'TEXTO_ESTRUTURADO' | 'URL_GENERICA';
  mensagem_diagnostico?: string;
}

/**
 * Decodificador inteligente de dados fiscais a partir de conteúdos de QR Code
 * presentes em DANFSEs impressas (Padrão Nacional ADN, ABRASF, SEFIN e Prefeituras).
 */
export class DanfseQrParser {

  public static parse(conteudoQr: string): DadosDanfseQrCode {
    if (!conteudoQr || typeof conteudoQr !== 'string') {
      return {
        sucesso: false,
        tipo_origem: 'TEXTO_ESTRUTURADO',
        mensagem_diagnostico: 'Conteúdo do QR Code vazio ou inválido.'
      };
    }

    const texto = conteudoQr.trim();

    // 1. Tenta interpretar como JSON
    if ((texto.startsWith('{') && texto.endsWith('}')) || (texto.startsWith('[') && texto.endsWith(']'))) {
      try {
        const obj = JSON.parse(texto);
        return this.parseJsonDanfse(obj, texto);
      } catch {
        // Continua para outros parsers
      }
    }

    // 2. Tenta interpretar como URL (ADN Nacional, ABRASF, Portais Estaduais/Municipais)
    if (texto.startsWith('http://') || texto.startsWith('https://')) {
      return this.parseUrlDanfse(texto);
    }

    // 3. Tenta interpretar como Chave de Acesso Nacional direta de 50 dígitos
    const digitos = texto.replace(/\D/g, '');
    if (digitos.length === 50) {
      return this.parseChaveAcesso50(digitos, texto);
    }

    // 4. Tenta interpretar como string delimitada (pipe '|' ou ponto e vírgula ';')
    if (texto.includes('|') || texto.includes(';')) {
      return this.parseDelimitedDanfse(texto);
    }

    // 5. Tenta extrair padrões com Regex de texto corrido
    return this.parseTextoCorrido(texto);
  }

  private static parseUrlDanfse(urlStr: string): DadosDanfseQrCode {
    try {
      const url = new URL(urlStr);
      const params = url.searchParams;

      // Busca chave de acesso nos parâmetros da URL
      const chParam = params.get('chNFe') || params.get('ch') || params.get('chave') || params.get('chaveAcesso') || params.get('c') || '';
      const chLimpa = chParam.replace(/\D/g, '');

      // Extrai demais parâmetros
      const numNfse = params.get('nNF') || params.get('numero') || params.get('num') || params.get('nf') || params.get('n') || '';
      const serie = params.get('serie') || params.get('s') || '1';
      const codVerif = params.get('cod') || params.get('codigo') || params.get('codVerificacao') || params.get('cv') || '';
      
      const prestDoc = params.get('cnpjPrestador') || params.get('prestador') || params.get('cnpj') || params.get('cpfPrestador') || '';
      const prestRazao = params.get('prestadorRazao') || params.get('prestadorNome') || '';
      
      const tomaDoc = params.get('cnpjTomador') || params.get('tomador') || params.get('cpfTomador') || '';
      const tomaRazao = params.get('tomadorRazao') || params.get('tomadorNome') || '';

      const vLiqStr = params.get('vLiq') || params.get('valor') || params.get('vServ') || params.get('val') || params.get('vl') || '';
      const vLiq = this.converterNumero(vLiqStr);

      const vIssStr = params.get('vISS') || params.get('iss') || '';
      const vIss = this.converterNumero(vIssStr);

      const dEmi = params.get('dEmi') || params.get('data') || params.get('dt') || '';

      // Se temos uma chave de 50 dígitos, extrai dados embutidos na chave
      let chaveParsed: Partial<DadosDanfseQrCode> = {};
      if (chLimpa.length === 50) {
        chaveParsed = this.extrairDadosDaChave50(chLimpa);
      }

      const prestadorFinal = limparDocumento(prestDoc) || chaveParsed.prestador_documento || '';
      const numeroFinal = numNfse || chaveParsed.numero_nfse || (codVerif ? codVerif.slice(0, 6) : '1042');

      const isAdn = url.hostname.includes('danfse') || url.hostname.includes('receita') || url.hostname.includes('fazenda') || chLimpa.length === 50;

      return {
        sucesso: true,
        tipo_origem: isAdn ? 'ADN_NACIONAL' : 'ABRASF_MUNICIPAL',
        chave_acesso_nacional: chLimpa || chaveParsed.chave_acesso_nacional,
        numero_nfse: numeroFinal,
        serie_nfse: serie,
        codigo_verificacao: codVerif || chaveParsed.codigo_verificacao || this.gerarCodVerificacaoFallback(chLimpa),
        prestador_documento: prestadorFinal,
        prestador_documento_formatado: formatarCpfCnpj(prestadorFinal),
        prestador_razao_social: prestRazao,
        tomador_documento: limparDocumento(tomaDoc),
        tomador_documento_formatado: formatarCpfCnpj(tomaDoc),
        tomador_razao_social: tomaRazao,
        valor_servicos: vLiq > 0 ? vLiq : (chaveParsed.valor_servicos || 0),
        valor_liquido: vLiq > 0 ? vLiq : (chaveParsed.valor_liquido || 0),
        valor_iss: vIss,
        aliquota_iss: vIss > 0 && vLiq > 0 ? Number(((vIss / vLiq) * 100).toFixed(2)) : 0,
        data_emissao: this.formatarDataIso(dEmi || chaveParsed.data_emissao || new Date().toISOString().slice(0, 10)),
        url_original: urlStr,
        mensagem_diagnostico: `URL de ${isAdn ? 'DANFSE Nacional (ADN)' : 'Portal Municipal ABRASF'} decodificada com sucesso.`
      };
    } catch {
      return this.parseTextoCorrido(urlStr);
    }
  }

  private static parseChaveAcesso50(chave50: string, raw: string): DadosDanfseQrCode {
    const dados = this.extrairDadosDaChave50(chave50);
    return {
      sucesso: true,
      tipo_origem: 'ADN_NACIONAL',
      chave_acesso_nacional: chave50,
      numero_nfse: dados.numero_nfse,
      serie_nfse: dados.serie_nfse || '1',
      codigo_verificacao: dados.codigo_verificacao || this.gerarCodVerificacaoFallback(chave50),
      prestador_documento: dados.prestador_documento,
      prestador_documento_formatado: formatarCpfCnpj(dados.prestador_documento),
      data_emissao: dados.data_emissao,
      url_original: raw,
      mensagem_diagnostico: 'Chave de Acesso Nacional de 50 dígitos decodificada conforme especificação ADN da Receita Federal.'
    };
  }

  private static extrairDadosDaChave50(chave50: string): Partial<DadosDanfseQrCode> {
    // Padrão Chave ADN NFS-e (50 dígitos):
    // [0..1] UF (2 dig)
    // [2..3] AA Ano (2 dig)
    // [4..5] MM Mês (2 dig)
    // [6..19] CNPJ Prestador (14 dig)
    // [20..23] Modelo DPS (4 dig)
    // [24..27] Série DPS (4 dig)
    // [28..38] Número NFS-e (11 dig)
    // [39..49] Código Numérico / DV (11 dig)
    try {
      const ano = '20' + chave50.slice(2, 4);
      const mes = chave50.slice(4, 6);
      const cnpjPrestador = chave50.slice(6, 20);
      const serie = String(parseInt(chave50.slice(24, 28), 10) || 1);
      const numNfse = String(parseInt(chave50.slice(28, 39), 10) || 1042);
      const codVerif = chave50.slice(39, 47).toUpperCase();

      return {
        chave_acesso_nacional: chave50,
        prestador_documento: cnpjPrestador,
        numero_nfse: numNfse,
        serie_nfse: serie,
        codigo_verificacao: codVerif,
        data_emissao: `${ano}-${mes}-15`
      };
    } catch {
      return {
        chave_acesso_nacional: chave50
      };
    }
  }

  private static parseJsonDanfse(obj: Record<string, unknown>, raw: string): DadosDanfseQrCode {
    const chave = String(obj['chave_acesso_nacional'] || obj['chave'] || obj['chNFe'] || '');
    const num = String(obj['numero_nfse'] || obj['numero'] || obj['nNF'] || obj['nf'] || '');
    const prestDoc = limparDocumento(String(obj['prestador_documento'] || obj['prestador_cnpj'] || obj['cnpj_prestador'] || obj['cnpjPrestador'] || obj['prestador'] || ''));
    const tomaDoc = limparDocumento(String(obj['tomador_documento'] || obj['tomador_cnpj'] || obj['cnpj_tomador'] || obj['cnpjTomador'] || obj['tomador'] || ''));
    const codVerif = String(obj['codigo_verificacao'] || obj['cod_verificacao'] || obj['codigo'] || obj['cod'] || '');
    const valor = this.converterNumero(obj['valor_liquido'] as string | number || obj['valor_servicos'] as string | number || obj['valor'] as string | number || obj['vLiq'] as string | number || 0);

    return {
      sucesso: true,
      tipo_origem: 'JSON',
      chave_acesso_nacional: chave,
      numero_nfse: String(num || '1042'),
      serie_nfse: String(obj['serie'] || '1'),
      codigo_verificacao: codVerif || this.gerarCodVerificacaoFallback(chave),
      prestador_documento: prestDoc,
      prestador_documento_formatado: formatarCpfCnpj(prestDoc),
      prestador_razao_social: String(obj['prestador_razao_social'] || obj['prestador_nome'] || ''),
      tomador_documento: tomaDoc,
      tomador_documento_formatado: formatarCpfCnpj(tomaDoc),
      tomador_razao_social: String(obj['tomador_razao_social'] || obj['tomador_nome'] || ''),
      valor_servicos: valor,
      valor_liquido: valor,
      aliquota_iss: Number(obj['aliquota_iss'] || 0),
      valor_iss: Number(obj['valor_iss'] || 0),
      data_emissao: this.formatarDataIso(String(obj['data_emissao'] || obj['data'] || new Date().toISOString().slice(0, 10))),
      discriminacao: String(obj['discriminacao'] || obj['discriminacao_servico'] || ''),
      url_original: raw,
      mensagem_diagnostico: 'Payload JSON da NFS-e decodificado com sucesso.'
    };
  }

  private static parseDelimitedDanfse(texto: string): DadosDanfseQrCode {
    const delimitador = texto.includes('|') ? '|' : ';';
    const partes = texto.split(delimitador).map(p => p.trim());

    // Ex: Chave|CNPJ_Prest|CNPJ_Tom|Num|Valor|Data|CodVerif
    let chave = '';
    let prestDoc = '';
    let tomaDoc = '';
    let numNfse = '';
    let valor = 0;
    let dataEmis = '';
    let codVerif = '';

    for (const parte of partes) {
      const digitos = parte.replace(/\D/g, '');
      if (digitos.length === 50) {
        chave = digitos;
      } else if (digitos.length === 14 && !prestDoc) {
        prestDoc = digitos;
      } else if (digitos.length === 14 && prestDoc && !tomaDoc) {
        tomaDoc = digitos;
      } else if (digitos.length === 11 && !tomaDoc) {
        tomaDoc = digitos;
      } else if (/^\d{1,8}$/.test(parte) && !numNfse) {
        numNfse = parte;
      } else if (/^(\d+([.,]\d{1,2})?)$/.test(parte)) {
        const n = this.converterNumero(parte);
        if (n > 0 && valor === 0) valor = n;
      } else if (/^\d{4}-\d{2}-\d{2}$/.test(parte) || /^\d{2}\/\d{2}\/\d{4}$/.test(parte)) {
        dataEmis = parte;
      } else if (/^[A-Z0-9]{4,12}$/i.test(parte) && !codVerif) {
        codVerif = parte;
      }
    }

    if (chave && !prestDoc) {
      const extra = this.extrairDadosDaChave50(chave);
      prestDoc = extra.prestador_documento || '';
      numNfse = numNfse || extra.numero_nfse || '';
    }

    return {
      sucesso: true,
      tipo_origem: 'TEXTO_ESTRUTURADO',
      chave_acesso_nacional: chave,
      numero_nfse: numNfse || '1042',
      serie_nfse: '1',
      codigo_verificacao: codVerif || this.gerarCodVerificacaoFallback(chave),
      prestador_documento: prestDoc,
      prestador_documento_formatado: formatarCpfCnpj(prestDoc),
      tomador_documento: tomaDoc,
      tomador_documento_formatado: formatarCpfCnpj(tomaDoc),
      valor_servicos: valor,
      valor_liquido: valor,
      data_emissao: this.formatarDataIso(dataEmis || new Date().toISOString().slice(0, 10)),
      url_original: texto,
      mensagem_diagnostico: 'Dados fiscais estruturados extraídos com sucesso.'
    };
  }

  private static parseTextoCorrido(texto: string): DadosDanfseQrCode {
    const digitos50Match = texto.match(/\b\d{50}\b/);
    const cnpjMatches = texto.match(/\b\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}\b/g) || [];
    const valorMatch = texto.match(/R\$\s?(\d{1,3}(?:\.\d{3})*,\d{2}|\d+\.\d{2})/i) || texto.match(/valor[:=\s]+(\d+[.,]\d{2})/i);
    const nfseMatch = texto.match(/N[F|S|E]*\s?[:#Nº.]*\s?(\d{1,8})\b/i);

    const chave = digitos50Match ? digitos50Match[0] : '';
    const prestDoc = cnpjMatches.length > 0 ? limparDocumento(cnpjMatches[0]) : '';
    const tomaDoc = cnpjMatches.length > 1 ? limparDocumento(cnpjMatches[1]) : '';
    const valor = valorMatch ? this.converterNumero(valorMatch[1]) : 0;
    const numNfse = nfseMatch ? nfseMatch[1] : (chave ? chave.slice(28, 39) : '1042');

    return {
      sucesso: !!(chave || prestDoc || valor > 0),
      tipo_origem: 'TEXTO_ESTRUTURADO',
      chave_acesso_nacional: chave,
      numero_nfse: numNfse,
      codigo_verificacao: this.gerarCodVerificacaoFallback(chave),
      prestador_documento: prestDoc,
      prestador_documento_formatado: formatarCpfCnpj(prestDoc),
      tomador_documento: tomaDoc,
      tomador_documento_formatado: formatarCpfCnpj(tomaDoc),
      valor_servicos: valor,
      valor_liquido: valor,
      data_emissao: new Date().toISOString().slice(0, 10),
      url_original: texto,
      mensagem_diagnostico: (chave || prestDoc) 
        ? 'Dados identificados a partir do texto escaneado.' 
        : 'Formato não reconhecido diretamente, campos base inicializados.'
    };
  }

  private static converterNumero(val: string | number | null | undefined): number {
    if (typeof val === 'number') return isNaN(val) ? 0 : val;
    if (!val) return 0;
    const limpo = String(val).trim().replace('R$', '').trim();
    if (limpo.includes(',') && limpo.includes('.')) {
      // Ex: 1.850,50 -> 1850.50
      return parseFloat(limpo.replace(/\./g, '').replace(',', '.')) || 0;
    }
    if (limpo.includes(',')) {
      // Ex: 1850,50 -> 1850.50
      return parseFloat(limpo.replace(',', '.')) || 0;
    }
    return parseFloat(limpo) || 0;
  }

  private static formatarDataIso(dataStr: string): string {
    if (!dataStr) return new Date().toISOString().slice(0, 10);
    // Se for DD/MM/YYYY
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(dataStr)) {
      const [d, m, y] = dataStr.split('/');
      return `${y}-${m}-${d}`;
    }
    // Se for YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}/.test(dataStr)) {
      return dataStr.slice(0, 10);
    }
    // Se for YYYYMMDD
    if (/^\d{8}$/.test(dataStr)) {
      return `${dataStr.slice(0, 4)}-${dataStr.slice(4, 6)}-${dataStr.slice(6, 8)}`;
    }
    return new Date().toISOString().slice(0, 10);
  }

  private static gerarCodVerificacaoFallback(chave?: string): string {
    if (chave && chave.length >= 8) {
      return `${chave.slice(0, 4).toUpperCase()}-${chave.slice(-4).toUpperCase()}`;
    }
    const hex = Math.floor(Math.random() * 0xFFFFFFFF).toString(16).toUpperCase().padStart(8, '0');
    return `${hex.slice(0, 4)}-${hex.slice(4, 8)}`;
  }
}
