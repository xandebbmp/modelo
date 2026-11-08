import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of, tap } from 'rxjs';
import { 
  ConfiguracaoPreprocessamento, 
  DadosExtraidosDocumento, 
  RegistroDigitalizacaoNota,
  StatusEtapaDigitalizacao 
} from '../models/digitalizacao-nota.model';

@Injectable({
  providedIn: 'root'
})
export class ScannerCameraService {
  private http = inject(HttpClient);

  // Estados Reativos do Scanner
  readonly modalAberto = signal<boolean>(false);
  readonly etapaAtual = signal<StatusEtapaDigitalizacao>('CAPTURA');
  
  readonly cameraAtiva = signal<boolean>(false);
  readonly carregandoCamera = signal<boolean>(false);
  readonly erroCamera = signal<string | null>(null);
  
  readonly streamAtivo = signal<MediaStream | null>(null);
  readonly facingMode = signal<'environment' | 'user'>('environment');
  readonly lanternaDisponivel = signal<boolean>(false);
  readonly lanternaAtiva = signal<boolean>(false);
  
  readonly imagemOriginal = signal<string | null>(null);
  readonly imagemProcessada = signal<string | null>(null);
  readonly processandoImagem = signal<boolean>(false);
  
  readonly dadosExtraidos = signal<DadosExtraidosDocumento | null>(null);
  readonly analisandoIA = signal<boolean>(false);
  readonly erroExtracao = signal<string | null>(null);
  
  readonly historicoDigitalizacoes = signal<RegistroDigitalizacaoNota[]>([]);

  // Configuração Padrão de Pré-processamento
  readonly configPreprocessamento = signal<ConfiguracaoPreprocessamento>({
    brilho: 12,
    contraste: 35,
    nitidez: 4,
    escalaCinza: true,
    binarizacao: false,
    limiarBinarizacao: 128,
    rotacao: 0,
    inverterCores: false,
    filtroReducaoRuido: true
  });

  /**
   * Abre o modal do scanner
   */
  abrirModalScanner() {
    this.etapaAtual.set('CAPTURA');
    this.erroCamera.set(null);
    this.erroExtracao.set(null);
    this.dadosExtraidos.set(null);
    this.imagemOriginal.set(null);
    this.imagemProcessada.set(null);
    this.modalAberto.set(true);
  }

  /**
   * Fecha o modal e para a câmera
   */
  fecharModalScanner() {
    this.pararCamera();
    this.modalAberto.set(false);
  }

  /**
   * Inicia o stream da câmera no elemento de vídeo
   */
  async iniciarCamera(videoElement: HTMLVideoElement): Promise<boolean> {
    this.carregandoCamera.set(true);
    this.erroCamera.set(null);

    // Se já houver stream ativo, para primeiro
    this.pararCamera();

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      this.erroCamera.set('A API de Câmera (getUserMedia) não é suportada neste navegador ou ambiente.');
      this.carregandoCamera.set(false);
      return false;
    }

    try {
      const constraints: MediaStreamConstraints = {
        audio: false,
        video: {
          facingMode: { ideal: this.facingMode() },
          width: { ideal: 1920, min: 640 },
          height: { ideal: 1080, min: 480 }
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      this.streamAtivo.set(stream);
      videoElement.srcObject = stream;
      await videoElement.play();

      this.cameraAtiva.set(true);
      this.carregandoCamera.set(false);

      // Verifica suporte a Lanterna (Torch) no track de vídeo
      const track = stream.getVideoTracks()[0];
      if (track) {
        const capabilities = (track.getCapabilities ? track.getCapabilities() : {}) as MediaTrackCapabilities & { torch?: boolean };
        this.lanternaDisponivel.set(!!capabilities?.torch);
      }

      return true;
    } catch (err: unknown) {
      console.warn('[Scanner Camera] Falha ao abrir câmera:', err);
      const errorObj = err as { name?: string };
      let msg = 'Não foi possível acessar a câmera do dispositivo.';
      if (errorObj?.name === 'NotAllowedError' || errorObj?.name === 'PermissionDeniedError') {
        msg = 'Permissão de acesso à câmera negada. Você pode carregar uma foto da galeria.';
      } else if (errorObj?.name === 'NotFoundError' || errorObj?.name === 'DevicesNotFoundError') {
        msg = 'Nenhuma câmera encontrada no dispositivo.';
      }
      this.erroCamera.set(msg);
      this.cameraAtiva.set(false);
      this.carregandoCamera.set(false);
      return false;
    }
  }

  /**
   * Para a captura de vídeo e libera hardware
   */
  pararCamera() {
    const stream = this.streamAtivo();
    if (stream) {
      stream.getTracks().forEach(track => {
        try {
          track.stop();
        } catch {
          // Ignore
        }
      });
      this.streamAtivo.set(null);
    }
    this.cameraAtiva.set(false);
    this.lanternaAtiva.set(false);
  }

  /**
   * Alterna entre câmera traseira e frontal
   */
  async alternarCamera(videoElement: HTMLVideoElement) {
    const novoModo = this.facingMode() === 'environment' ? 'user' : 'environment';
    this.facingMode.set(novoModo);
    await this.iniciarCamera(videoElement);
  }

  /**
   * Liga ou desliga a lanterna/flash do dispositivo
   */
  async alternarLanterna() {
    const stream = this.streamAtivo();
    if (!stream) return;

    const track = stream.getVideoTracks()[0];
    if (track && this.lanternaDisponivel()) {
      const novoEstado = !this.lanternaAtiva();
      try {
        const trackWithTorch = track as MediaStreamTrack & { applyConstraints(constraints?: MediaTrackConstraints & { advanced?: { torch?: boolean }[] }): Promise<void> };
        await trackWithTorch.applyConstraints({
          advanced: [{ torch: novoEstado }]
        });
        this.lanternaAtiva.set(novoEstado);
      } catch (err) {
        console.warn('Erro ao alternar lanterna:', err);
      }
    }
  }

  /**
   * Captura o frame atual do elemento de vídeo para um Canvas em alta resolução
   */
  async capturarFoto(videoElement: HTMLVideoElement): Promise<string | null> {
    if (!videoElement || videoElement.videoWidth === 0) {
      return null;
    }

    const canvas = document.createElement('canvas');
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
    const base64 = canvas.toDataURL('image/jpeg', 0.92);

    this.pararCamera();
    this.imagemOriginal.set(base64);
    
    // Executa pré-processamento inicial automático
    await this.aplicarPreprocessamento(base64, this.configPreprocessamento());
    this.etapaAtual.set('PREPROCESSAMENTO');

    return base64;
  }

  /**
   * Carrega foto a partir de arquivo do computador ou galeria móvel
   */
  async carregarArquivoImagem(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = e.target?.result as string;
        this.pararCamera();
        this.imagemOriginal.set(base64);
        
        await this.aplicarPreprocessamento(base64, this.configPreprocessamento());
        this.etapaAtual.set('PREPROCESSAMENTO');
        resolve(base64);
      };
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  }

  /**
   * Motor de Pré-Processamento de Imagem em HTML5 Canvas (Filtros de Contraste, Nitidez, Binarização e Rotação)
   */
  async aplicarPreprocessamento(
    base64Original: string, 
    config: ConfiguracaoPreprocessamento
  ): Promise<string> {
    this.processandoImagem.set(true);

    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        
        if (!ctx) {
          this.imagemProcessada.set(base64Original);
          this.processandoImagem.set(false);
          resolve(base64Original);
          return;
        }

        const rot = config.rotacao % 360;
        if (rot === 90 || rot === 270) {
          canvas.width = img.height;
          canvas.height = img.width;
        } else {
          canvas.width = img.width;
          canvas.height = img.height;
        }

        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate((rot * Math.PI) / 180);
        ctx.drawImage(img, -img.width / 2, -img.height / 2);
        ctx.restore();

        // Manipulação direta de pixels (ImageData)
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imgData.data;
        const len = data.length;

        // Fator de contraste: 
        const contrastFactor = (259 * (config.contraste + 255)) / (255 * (259 - config.contraste));
        const brightness = config.brilho;
        const binarizar = config.binarizacao;
        const limiar = config.limiarBinarizacao;
        const grayscale = config.escalaCinza;
        const invert = config.inverterCores;

        for (let i = 0; i < len; i += 4) {
          let r = data[i];
          let g = data[i + 1];
          let b = data[i + 2];

          // 1. Escala de cinza (Luminância perceptiva padrão ITU-R BT.601)
          if (grayscale || binarizar) {
            const gray = 0.299 * r + 0.587 * g + 0.114 * b;
            r = gray;
            g = gray;
            b = gray;
          }

          // 2. Ajuste de Contraste e Brilho
          r = contrastFactor * (r - 128) + 128 + brightness;
          g = contrastFactor * (g - 128) + 128 + brightness;
          b = contrastFactor * (b - 128) + 128 + brightness;

          // 3. Binarização de alto contraste (ideal para recibos térmicos desbotados)
          if (binarizar) {
            const val = (r + g + b) / 3 >= limiar ? 255 : 0;
            r = val;
            g = val;
            b = val;
          }

          // 4. Inversão de cores
          if (invert) {
            r = 255 - r;
            g = 255 - g;
            b = 255 - b;
          }

          // Clamping entre 0 e 255
          data[i] = Math.max(0, Math.min(255, r));
          data[i + 1] = Math.max(0, Math.min(255, g));
          data[i + 2] = Math.max(0, Math.min(255, b));
        }

        ctx.putImageData(imgData, 0, 0);

        // 5. Filtro de Nitidez / Convolução (Sharpening Laplacian) se nitidez > 0
        if (config.nitidez > 0) {
          this.aplicarFiltroNitidez(ctx, canvas.width, canvas.height, config.nitidez);
        }

        const resultadoBase64 = canvas.toDataURL('image/jpeg', 0.90);
        this.imagemProcessada.set(resultadoBase64);
        this.processandoImagem.set(false);
        resolve(resultadoBase64);
      };

      img.src = base64Original;
    });
  }

  /**
   * Convolução 3x3 de Nitidez (Laplacian High-Pass) para destacar texto impresso
   */
  private aplicarFiltroNitidez(ctx: CanvasRenderingContext2D, w: number, h: number, intensidade: number) {
    const srcData = ctx.getImageData(0, 0, w, h);
    const dstData = ctx.createImageData(w, h);
    const src = srcData.data;
    const dst = dstData.data;

    // Matriz de nitidez ajustada pela intensidade
    const center = 1 + 4 * (intensidade * 0.25);
    const side = -(intensidade * 0.25);
    const kernel = [
      0, side, 0,
      side, center, side,
      0, side, 0
    ];

    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const dstOff = (y * w + x) * 4;
        let r = 0, g = 0, b = 0;

        for (let cy = 0; cy < 3; cy++) {
          for (let cx = 0; cx < 3; cx++) {
            const scy = y + cy - 1;
            const scx = x + cx - 1;
            const srcOff = (scy * w + scx) * 4;
            const wt = kernel[cy * 3 + cx];

            r += src[srcOff] * wt;
            g += src[srcOff + 1] * wt;
            b += src[srcOff + 2] * wt;
          }
        }

        dst[dstOff] = Math.max(0, Math.min(255, r));
        dst[dstOff + 1] = Math.max(0, Math.min(255, g));
        dst[dstOff + 2] = Math.max(0, Math.min(255, b));
        dst[dstOff + 3] = src[dstOff + 3]; // Alpha intacto
      }
    }

    ctx.putImageData(dstData, 0, 0);
  }

  /**
   * Aplica presets rápidos de pré-processamento
   */
  aplicarPreset(preset: 'TERMICOPAPEL' | 'PADRAO_A4' | 'POUCA_LUZ' | 'ALTO_CONTRASTE' | 'ORIGINAL') {
    const atual = { ...this.configPreprocessamento() };
    
    switch (preset) {
      case 'TERMICOPAPEL':
        atual.brilho = 20;
        atual.contraste = 60;
        atual.nitidez = 6;
        atual.escalaCinza = true;
        atual.binarizacao = true;
        atual.limiarBinarizacao = 140;
        break;
      case 'PADRAO_A4':
        atual.brilho = 10;
        atual.contraste = 30;
        atual.nitidez = 4;
        atual.escalaCinza = true;
        atual.binarizacao = false;
        break;
      case 'POUCA_LUZ':
        atual.brilho = 40;
        atual.contraste = 45;
        atual.nitidez = 5;
        atual.escalaCinza = true;
        atual.binarizacao = false;
        break;
      case 'ALTO_CONTRASTE':
        atual.brilho = 5;
        atual.contraste = 75;
        atual.nitidez = 7;
        atual.escalaCinza = true;
        atual.binarizacao = false;
        break;
      case 'ORIGINAL':
        atual.brilho = 0;
        atual.contraste = 0;
        atual.nitidez = 0;
        atual.escalaCinza = false;
        atual.binarizacao = false;
        atual.inverterCores = false;
        atual.rotacao = 0;
        break;
    }

    this.configPreprocessamento.set(atual);
    const orig = this.imagemOriginal();
    if (orig) {
      this.aplicarPreprocessamento(orig, atual);
    }
  }

  /**
   * Envia a imagem pré-processada para a API Gemini (ou fallback) e extrai os dados estruturados
   */
  extrairDadosDocumento(contextoEmpresa?: Record<string, unknown>): Observable<DadosExtraidosDocumento> {
    this.analisandoIA.set(true);
    this.erroExtracao.set(null);
    this.etapaAtual.set('ANALISE_IA');

    const imagemParaEnviar = this.imagemProcessada() || this.imagemOriginal();

    if (!imagemParaEnviar) {
      const erroMsg = 'Nenhuma imagem foi capturada para extração.';
      this.erroExtracao.set(erroMsg);
      this.analisandoIA.set(false);
      this.etapaAtual.set('ERRO');
      throw new Error(erroMsg);
    }

    return this.http.post<{ sucesso: boolean; dados?: DadosExtraidosDocumento; erro?: string }>('/api/scan-document', {
      imagemBase64: imagemParaEnviar,
      contextoEmpresa: contextoEmpresa || {},
      configPreprocessamento: this.configPreprocessamento()
    }).pipe(
      map(res => {
        if (!res.sucesso || !res.dados) {
          throw new Error(res.erro || 'Falha ao analisar documento fiscal.');
        }
        return res.dados;
      }),
      tap(dados => {
        this.dadosExtraidos.set(dados);
        this.analisandoIA.set(false);
        this.etapaAtual.set('REVISAO');
      }),
      catchError(err => {
        console.error('Erro na extração IA:', err);
        const erroDesc = err?.error?.erro || err?.message || 'Erro de comunicação ao extrair dados da nota.';
        this.erroExtracao.set(erroDesc);
        this.analisandoIA.set(false);
        this.etapaAtual.set('ERRO');
        return of(this.obterAmostraDemo('NFSE'));
      })
    );
  }

  /**
   * Fornece amostras realistas de documentos fiscais para testes rápidos
   */
  carregarAmostraDemo(tipo: 'NFSE' | 'CUPOM_FISCAL_SAT' | 'RECIBO_MEI') {
    const amostra = this.obterAmostraDemo(tipo);
    this.dadosExtraidos.set(amostra);
    this.imagemOriginal.set(this.gerarImagemMockSvg());
    this.imagemProcessada.set(this.imagemOriginal());
    this.etapaAtual.set('REVISAO');
  }

  private obterAmostraDemo(tipo: 'NFSE' | 'CUPOM_FISCAL_SAT' | 'RECIBO_MEI'): DadosExtraidosDocumento {
    const hoje = new Date().toISOString().split('T')[0];
    
    if (tipo === 'CUPOM_FISCAL_SAT') {
      return {
        tipo_documento: 'CUPOM_FISCAL_SAT',
        numero_documento: '048291',
        serie: '001',
        data_emissao: hoje,
        chave_acesso: '35260812345678000190650010000482911000482914',
        codigo_verificacao: 'CFE-8842',
        emitente: {
          razao_social: 'DISTRIBUIDORA DE COSMETICOS BELEZA PURA LTDA',
          nome_fantasia: 'Cosméticos Pro Beleza',
          cnpj_cpf: '19.823.411/0001-52',
          inscricao_estadual: '112.449.001.114',
          cidade: 'São Paulo',
          uf: 'SP',
          endereco: 'Rua da Consolação, 2400'
        },
        tomador: {
          razao_social: 'BEAUTY & CO SALAO DE BELEZA LTDA',
          cnpj_cpf: '12.345.678/0001-90',
          cidade: 'São Paulo',
          uf: 'SP'
        },
        itens: [
          {
            item_numero: 1,
            descricao: 'Kit Shampoo Reconstrutor & Máscara Hidratante 1L Profissional',
            quantidade: 4,
            unidade: 'UN',
            valor_unitario: 145.00,
            valor_total: 580.00,
            codigo_servico_ou_ncm: '3305.10.00'
          },
          {
            item_numero: 2,
            descricao: 'Tinta Colorimetria Louro Claro 60g Tubo',
            quantidade: 10,
            unidade: 'UN',
            valor_unitario: 32.50,
            valor_total: 325.00,
            codigo_servico_ou_ncm: '3305.90.00'
          }
        ],
        valores: {
          valor_bruto: 905.00,
          valor_desconto: 35.00,
          valor_liquido: 870.00,
          base_calculo_iss: 0,
          aliquota_iss: 0,
          valor_iss: 0,
          iss_retido: false,
          inss: 0,
          irrf: 0,
          pis: 5.65,
          cofins: 26.10,
          csll: 0,
          outras_retencoes: 0
        },
        discriminacao_servicos: 'Venda de Insumos Profissionais para Salão de Beleza e Estética. NFC-e Autorizada.',
        categoria_sugerida: 'INSUMO_SALAO',
        observacoes_fiscais: 'Documento fiscal de mercadoria (NFC-e mod 65).',
        confianca_geral_percentual: 98,
        alertas_inconsistencias: [],
        enquadramento_lei_salao_parceiro: false,
        mensagem_conformidade: 'Insumos de consumo direto no salão aptos para dedução contábil de despesas operacionais.'
      };
    } else if (tipo === 'RECIBO_MEI') {
      return {
        tipo_documento: 'RECIBO_MEI',
        numero_documento: 'REC-2026/08',
        serie: 'MEI',
        data_emissao: hoje,
        codigo_verificacao: 'MEI-8921',
        emitente: {
          razao_social: 'CAMILA ROCHA MEI - SERVIÇOS DE MANICURE',
          nome_fantasia: 'Camila Nails Design',
          cnpj_cpf: '51.482.901/0001-33',
          inscricao_municipal: 'ISENTO',
          cidade: 'São Paulo',
          uf: 'SP',
          endereco: 'Alameda Santos, 980'
        },
        tomador: {
          razao_social: 'BEAUTY & CO SALAO DE BELEZA LTDA',
          cnpj_cpf: '12.345.678/0001-90',
          cidade: 'São Paulo',
          uf: 'SP'
        },
        itens: [
          {
            item_numero: 1,
            descricao: 'Repasse Quinquenal Cota-Parte Parceria Manicure e Esmaltação em Gel',
            quantidade: 1,
            unidade: 'SV',
            valor_unitario: 2180.00,
            valor_total: 2180.00,
            codigo_servico_ou_ncm: '06.02'
          }
        ],
        valores: {
          valor_bruto: 2180.00,
          valor_desconto: 0,
          valor_liquido: 2180.00,
          base_calculo_iss: 2180.00,
          aliquota_iss: 0, // MEI recolhe em guia única DAS-MEI
          valor_iss: 0,
          iss_retido: false,
          inss: 0,
          irrf: 0,
          pis: 0,
          cofins: 0,
          csll: 0,
          outras_retencoes: 0
        },
        discriminacao_servicos: 'Honorários de Profissional Parceira Manicure referente ao período conforme Lei Salão Parceiro 13.352/2016.',
        categoria_sugerida: 'SERVICO_PARCEIRO_MEI',
        observacoes_fiscais: 'Prestadora enquadrada no regime MEI. Tributação recolhida via DAS-MEI Fixo.',
        confianca_geral_percentual: 95,
        alertas_inconsistencias: [],
        enquadramento_lei_salao_parceiro: true,
        mensagem_conformidade: 'Atende 100% aos critérios de cota-parte da Lei Salão Parceiro.'
      };
    }

    // Padrão: NFS-e de Serviços
    return {
      tipo_documento: 'NFSE',
      numero_documento: '2026/001428',
      serie: 'E',
      data_emissao: hoje,
      codigo_verificacao: '7FB9-2A1C',
      numero_rps_dps: 'DPS-8910',
      emitente: {
        razao_social: 'JULIANA SILVA MEI - SERVIÇOS DE CABELEIREIRA',
        nome_fantasia: 'Studio Juliana Hair',
        cnpj_cpf: '48.912.304/0001-77',
        inscricao_municipal: '8.412.990-2',
        cidade: 'São Paulo',
        uf: 'SP',
        endereco: 'Rua Oscar Freire, 1200 - Cerqueira César'
      },
      tomador: {
        razao_social: 'BEAUTY & CO SALAO DE BELEZA LTDA',
        cnpj_cpf: '12.345.678/0001-90',
        endereco: 'Av. Paulista, 1000, Bela Vista, São Paulo/SP',
        cidade: 'São Paulo',
        uf: 'SP'
      },
      itens: [
        {
          item_numero: 1,
          descricao: 'Serviços Especializados de Cabeleireira, Mechas e Visagismo - Quinzena Parceria',
          quantidade: 1,
          unidade: 'UN',
          valor_unitario: 3850.00,
          valor_total: 3850.00,
          codigo_servico_ou_ncm: '06.01'
        }
      ],
      valores: {
        valor_bruto: 3850.00,
        valor_desconto: 0,
        valor_liquido: 3850.00,
        base_calculo_iss: 3850.00,
        aliquota_iss: 2.00,
        valor_iss: 77.00,
        iss_retido: false,
        inss: 0,
        irrf: 0,
        pis: 0,
        cofins: 0,
        csll: 0,
        outras_retencoes: 0
      },
      discriminacao_servicos: 'Serviços de Cabeleireira Especialista executados nas dependências do Salão Parceiro conforme Lei Federal 13.352/2016 e Contrato de Parceria Homologado. Repasse da Cota-Parte referente aos atendimentos do período.',
      categoria_sugerida: 'SERVICO_PARCEIRO_MEI',
      observacoes_fiscais: 'Documento emitido sob regime Simples Nacional (MEI - Microempreendedor Individual).',
      confianca_geral_percentual: 97,
      alertas_inconsistencias: [],
      enquadramento_lei_salao_parceiro: true,
      mensagem_conformidade: 'Documento em total conformidade com os requisitos da Lei Salão Parceiro nº 13.352/2016.'
    };
  }

  private gerarImagemMockSvg(): string {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="850" viewBox="0 0 600 850">
      <rect width="600" height="850" fill="#ffffff" stroke="#cbd5e1" stroke-width="4"/>
      <rect x="20" y="20" width="560" height="100" fill="#f8fafc" stroke="#e2e8f0" rx="6"/>
      <text x="40" y="55" font-family="monospace" font-weight="bold" font-size="18" fill="#17324d">PREFEITURA DO MUNICÍPIO DE SÃO PAULO</text>
      <text x="40" y="80" font-family="monospace" font-size="13" fill="#64748b">NOTA FISCAL DE SERVIÇOS ELETRÔNICA - NFS-e</text>
      <text x="40" y="105" font-family="monospace" font-weight="bold" font-size="14" fill="#b66a3c">Nº 2026/001428 • SÉRIE E • CÓD: 7FB9-2A1C</text>

      <rect x="20" y="135" width="560" height="120" fill="#ffffff" stroke="#e2e8f0" rx="4"/>
      <text x="35" y="160" font-family="sans-serif" font-weight="bold" font-size="12" fill="#334155">PRESTADOR DE SERVIÇOS (MEI):</text>
      <text x="35" y="180" font-family="sans-serif" font-size="12" fill="#0f172a">JULIANA SILVA MEI - SERVIÇOS DE CABELEIREIRA</text>
      <text x="35" y="200" font-family="monospace" font-size="12" fill="#64748b">CNPJ: 48.912.304/0001-77 • IM: 8.412.990-2</text>
      <text x="35" y="220" font-family="sans-serif" font-size="11" fill="#64748b">Rua Oscar Freire, 1200 - São Paulo/SP</text>

      <rect x="20" y="270" width="560" height="100" fill="#ffffff" stroke="#e2e8f0" rx="4"/>
      <text x="35" y="295" font-family="sans-serif" font-weight="bold" font-size="12" fill="#334155">TOMADOR DE SERVIÇOS (SALÃO-PARCEIRO):</text>
      <text x="35" y="315" font-family="sans-serif" font-size="12" fill="#0f172a">BEAUTY &amp; CO SALAO DE BELEZA LTDA</text>
      <text x="35" y="335" font-family="monospace" font-size="12" fill="#64748b">CNPJ: 12.345.678/0001-90</text>

      <rect x="20" y="385" width="560" height="230" fill="#ffffff" stroke="#e2e8f0" rx="4"/>
      <text x="35" y="410" font-family="sans-serif" font-weight="bold" font-size="12" fill="#334155">DISCRIMINAÇÃO DOS SERVIÇOS PRESTADOS:</text>
      <text x="35" y="440" font-family="sans-serif" font-size="11" fill="#334155">Serviços Especializados de Cabelo, Mechas e Visagismo</text>
      <text x="35" y="460" font-family="sans-serif" font-size="11" fill="#334155">executados em conformidade com a Lei Salão Parceiro nº 13.352/2016.</text>
      <text x="35" y="480" font-family="sans-serif" font-size="11" fill="#334155">Repasse de cota-parte de atendimentos quinzenais.</text>
      <text x="35" y="530" font-family="monospace" font-size="12" fill="#0f172a">CÓDIGO DE SERVIÇO: 06.01 - Cabeleireiros, Barbeiros, Estética</text>
      
      <rect x="20" y="630" width="560" height="180" fill="#f8fafc" stroke="#cbd5e1" rx="6"/>
      <text x="40" y="660" font-family="sans-serif" font-weight="bold" font-size="13" fill="#17324d">VALOR TOTAL DOS SERVIÇOS = R$ 3.850,00</text>
      <text x="40" y="690" font-family="sans-serif" font-size="11" fill="#64748b">Base de Cálculo: R$ 3.850,00 | Alíquota ISS: 2,00% | ISS Devido: R$ 77,00</text>
      <text x="40" y="715" font-family="sans-serif" font-size="11" fill="#64748b">Retenções Federais (PIS/COFINS/CSLL/IRRF/INSS): Isento / MEI</text>
      <text x="40" y="750" font-family="sans-serif" font-weight="bold" font-size="15" fill="#367158">VALOR LÍQUIDO A RECEBER = R$ 3.850,00</text>
    </svg>`;

    return 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)));
  }
}
