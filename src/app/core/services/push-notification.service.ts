import { Injectable, computed, signal } from '@angular/core';
import { 
  CategoriaNotificacaoPush, 
  LembreteFiscalPersonalizado,
  NotificacaoAgendadaPreview, 
  PreferenciasNotificacaoPush, 
  RegistroNotificacaoPush, 
  StatusPermissaoPush 
} from '../models/notificacao-push.model';
import { EventoVencimentoFiscal } from '../models/vencimento-fiscal.model';

const STORAGE_PREFS_KEY = 'beauty_finance_push_prefs_v1';
const STORAGE_HISTORY_KEY = 'beauty_finance_push_history_v1';
const STORAGE_ENVIOS_HOJE_KEY = 'beauty_finance_push_envios_hoje_v1';

@Injectable({
  providedIn: 'root'
})
export class PushNotificationService {
  /** Status da permissão de notificação no navegador */
  readonly permissaoStatus = signal<StatusPermissaoPush>(this.obterStatusPermissaoInicial());

  /** Controle de abertura da Central de Notificações Push */
  readonly modalAberto = signal<boolean>(false);

  /** Preferências de configuração do usuário */
  readonly preferencias = signal<PreferenciasNotificacaoPush>(this.carregarPreferencias());

  /** Histórico de notificações push enviadas */
  readonly historico = signal<RegistroNotificacaoPush[]>(this.carregarHistorico());

  /** Registro de envios diários para evitar notificações duplicadas do mesmo imposto no mesmo dia */
  private enviosHoje = signal<string[]>(this.carregarEnviosHoje());

  /** Service Worker Registration cache */
  private swRegistration: ServiceWorkerRegistration | null = null;
  private audioCtx: AudioContext | null = null;
  private timerVerificacaoId: ReturnType<typeof setInterval> | null = null;

  /** Total de notificações não lidas */
  readonly totalNaoLidas = computed(() => {
    return this.historico().filter(n => !n.lida).length;
  });

  /** Verifica se as notificações push estão plenamente ativas */
  readonly pushAtivoEFuncionando = computed(() => {
    return this.permissaoStatus() === 'granted' && this.preferencias().ativo;
  });

  constructor() {
    if (typeof window !== 'undefined') {
      this.inicializarServiceWorker();
      this.iniciarMonitoramentoSegundoPlano();
    }
  }

  private obterStatusPermissaoInicial(): StatusPermissaoPush {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'unsupported';
    }
    return Notification.permission as StatusPermissaoPush;
  }

  private carregarPreferencias(): PreferenciasNotificacaoPush {
    const lembretesPadrao: LembreteFiscalPersonalizado[] = [
      {
        id: 'lembrete-das-simples',
        titulo: 'Vencimento Guia DAS Simples Nacional',
        descricao: 'Apuração e pagamento da guia unificada do Simples Nacional da cota salão.',
        categoria: 'IMPOSTO_FEDERAL',
        diaDoMes: 20,
        diasAntecedencia: [5, 2, 0],
        recorrencia: 'MENSAL',
        ativo: true,
        valorEstimado: 1842.30,
        destinatarioOuOrgao: 'Receita Federal / PGDAS-D',
        criadoEm: '2026-08-01'
      },
      {
        id: 'lembrete-iss-municipal',
        titulo: 'Vencimento do ISSQN Próprio e Retido',
        descricao: 'Liquidação da guia de ISSQN de serviços de beleza na SEFIN Municipal.',
        categoria: 'IMPOSTO_MUNICIPAL',
        diaDoMes: 10,
        diasAntecedencia: [3, 1, 0],
        recorrencia: 'MENSAL',
        ativo: true,
        valorEstimado: 164.50,
        destinatarioOuOrgao: 'SEFIN Municipal',
        criadoEm: '2026-08-01'
      },
      {
        id: 'lembrete-efd-reinf',
        titulo: 'Transmissão EFD-Reinf / DCTFWeb (Lei 13.352)',
        descricao: 'Escrituração digital dos repasses a profissionais parceiros MEI.',
        categoria: 'OBRIGACAO_ACESSORIA',
        diaDoMes: 15,
        diasAntecedencia: [5, 1, 0],
        recorrencia: 'MENSAL',
        ativo: true,
        destinatarioOuOrgao: 'Sped / Receita Federal',
        criadoEm: '2026-08-01'
      },
      {
        id: 'lembrete-das-mei-parceiros',
        titulo: 'Checagem de Quitação do DAS-MEI pelos Parceiros',
        descricao: 'Conferência preventiva para resguardo da responsabilidade tributária solidária.',
        categoria: 'DAS_MEI_PARCEIROS',
        diaDoMes: 22,
        diasAntecedencia: [3, 0],
        recorrencia: 'MENSAL',
        ativo: true,
        destinatarioOuOrgao: 'Profissionais MEI',
        criadoEm: '2026-08-01'
      },
      {
        id: 'lembrete-fechamento-quinzena',
        titulo: 'Fechamento de Quinzena e Emissão 1-Clique',
        descricao: 'Revisão dos rateios de atendimento e liberação dos extratos para os parceiros.',
        categoria: 'FECHAMENTO_RATEIO',
        diaDoMes: 15,
        diasAntecedencia: [2, 0],
        recorrencia: 'QUINZENAL',
        ativo: true,
        destinatarioOuOrgao: 'Administração do Salão',
        criadoEm: '2026-08-01'
      }
    ];

    const padrao: PreferenciasNotificacaoPush = {
      ativo: true,
      canalWebPush: true,
      canalInApp: true,
      notificarDasSimples: true,
      notificarIssMunicipal: true,
      notificarEfdReinf: true,
      notificarDasMeiParceiros: true,
      notificarNfsePendentes48h: true,
      notificarFaturasClientes: true,
      notificarTetoMei80Porcento: true,
      notificarFechamentosRateio: true,
      diasAntecedencia: [5, 3, 1, 0],
      alertarVencidosDiariamente: true,
      horarioChecagem: '08:30',
      tocarSom: true,
      somTipo: 'CHIME_CORPORATIVO',
      lembretesPersonalizados: lembretesPadrao
    };

    if (typeof window === 'undefined') return padrao;

    try {
      const salvo = localStorage.getItem(STORAGE_PREFS_KEY);
      if (salvo) {
        const parsed = JSON.parse(salvo);
        return { 
          ...padrao, 
          ...parsed,
          lembretesPersonalizados: parsed.lembretesPersonalizados && parsed.lembretesPersonalizados.length > 0
            ? parsed.lembretesPersonalizados 
            : lembretesPadrao
        };
      }
    } catch (e) {
      console.warn('Erro ao carregar preferências de push:', e);
    }
    return padrao;
  }

  private carregarHistorico(): RegistroNotificacaoPush[] {
    if (typeof window === 'undefined') return [];

    try {
      const salvo = localStorage.getItem(STORAGE_HISTORY_KEY);
      if (salvo) {
        return JSON.parse(salvo);
      }
    } catch (e) {
      console.warn('Erro ao carregar histórico de push:', e);
    }

    // Histórico inicial de demonstração
    const dataRef = new Date('2026-08-24T12:00:00Z');
    return [
      {
        id: 'push-hist-1',
        idEventoOrigem: 'imposto-das-07-2026',
        titulo: 'Vencimento Hoje: DAS Simples Nacional (07/2026)',
        mensagem: 'A guia unificada do Simples Nacional (R$ 1.842,30) venceu em 20/08/2026. Lembrete de conciliação fiscal.',
        categoria: 'IMPOSTO_FEDERAL',
        severidade: 'CRITICO',
        timestamp: new Date(dataRef.getTime() - 4 * 86400000).toISOString(),
        dataVencimento: '2026-08-20',
        valor: 1842.30,
        orgao: 'Receita Federal / PGDAS-D',
        lida: true,
        aberta: true,
        canal: 'WEB_PUSH',
        tag: 'das-simples-07-2026'
      },
      {
        id: 'push-hist-2',
        idEventoOrigem: 'alerta-proc-101',
        titulo: 'Alerta Fiscal: NFS-e pendente há mais de 48h',
        mensagem: 'O documento fiscal para Camila Andrade (R$ 1.250,00) está em processamento há mais de 48h na SEFIN.',
        categoria: 'NFSE_PENDENTE_48H',
        severidade: 'ATENCAO',
        timestamp: new Date(dataRef.getTime() - 1 * 86400000).toISOString(),
        valor: 1250.00,
        orgao: 'SEFIN Municipal',
        lida: false,
        aberta: false,
        canal: 'WEB_PUSH',
        tag: 'nfse-pend-101'
      },
      {
        id: 'push-hist-3',
        idEventoOrigem: 'obrigacao-reinf-08-2026',
        titulo: 'Prévia: EFD-Reinf / DCTFWeb em 20 dias',
        mensagem: 'Transmissão da escrituração fiscal de repasses MEI da Lei 13.352 vence em 15/09/2026.',
        categoria: 'OBRIGACAO_ACESSORIA',
        severidade: 'INFO',
        timestamp: new Date(dataRef.getTime() - 2 * 3600000).toISOString(),
        dataVencimento: '2026-09-15',
        orgao: 'Sped / Receita Federal',
        lida: false,
        aberta: false,
        canal: 'WEB_PUSH',
        tag: 'reinf-08-2026'
      }
    ];
  }

  private carregarEnviosHoje(): string[] {
    if (typeof window === 'undefined') return [];
    try {
      const hoje = new Date().toISOString().substring(0, 10);
      const salvo = localStorage.getItem(`${STORAGE_ENVIOS_HOJE_KEY}_${hoje}`);
      return salvo ? JSON.parse(salvo) : [];
    } catch {
      return [];
    }
  }

  private salvarEnviosHoje(chave: string) {
    if (typeof window === 'undefined') return;
    try {
      const hoje = new Date().toISOString().substring(0, 10);
      const lista = [...this.enviosHoje(), chave];
      this.enviosHoje.set(lista);
      localStorage.setItem(`${STORAGE_ENVIOS_HOJE_KEY}_${hoje}`, JSON.stringify(lista));
    } catch (e) {
      console.warn('Erro ao salvar envios de hoje:', e);
    }
  }

  private salvarPreferencias(prefs: PreferenciasNotificacaoPush) {
    this.preferencias.set(prefs);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_PREFS_KEY, JSON.stringify(prefs));
      } catch (e) {
        console.warn('Erro ao salvar preferências no localStorage:', e);
      }
    }
  }

  private salvarHistorico(hist: RegistroNotificacaoPush[]) {
    this.historico.set(hist);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_HISTORY_KEY, JSON.stringify(hist));
      } catch (e) {
        console.warn('Erro ao salvar histórico no localStorage:', e);
      }
    }
  }

  /**
   * Inicializa e registra o Service Worker para suporte a Web Push nativo
   */
  private async inicializarServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        const reg = await navigator.serviceWorker.register('/sw-notifications.js', { scope: '/' });
        this.swRegistration = reg;
      } catch (err) {
        console.warn('Service Worker não pôde ser registrado (comportamento normal em preview/iframe):', err);
      }
    }
  }

  /**
   * Solicita permissão explícita ao usuário para exibir notificações nativas
   */
  async solicitarPermissao(): Promise<boolean> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      this.permissaoStatus.set('unsupported');
      return false;
    }

    try {
      const resultado = await Notification.requestPermission();
      this.permissaoStatus.set(resultado as StatusPermissaoPush);

      if (resultado === 'granted') {
        // Envia notificação de confirmação e boas-vindas
        await this.dispararNotificacaoPush({
          titulo: 'Notificações Fiscais Ativadas',
          mensagem: 'O BeautyFinance alertará você sobre os vencimentos do DAS, ISS e prazos da Lei do Salão-Parceiro, mesmo com o navegador minimizado.',
          categoria: 'SISTEMA_GERAL',
          severidade: 'INFO',
          tag: 'boas-vindas-push'
        });
        return true;
      }
      return false;
    } catch (e) {
      console.warn('Erro ao solicitar permissão de notificações:', e);
      return false;
    }
  }

  /**
   * Dispara uma notificação nativa do sistema operacional (Web Notification)
   */
  async dispararNotificacaoPush(dados: {
    titulo: string;
    mensagem: string;
    categoria: CategoriaNotificacaoPush;
    severidade?: 'INFO' | 'ATENCAO' | 'CRITICO' | 'URGENTE';
    idEventoOrigem?: string;
    dataVencimento?: string;
    valor?: number;
    orgao?: string;
    tag?: string;
    acaoUrl?: string;
    acaoTexto?: string;
  }): Promise<boolean> {
    const prefs = this.preferencias();
    if (!prefs.ativo) return false;

    const severidade = dados.severidade || 'INFO';
    const tag = dados.tag || `alerta-fiscal-${Date.now()}`;

    // Toca som suave configurado
    if (prefs.tocarSom) {
      this.tocarAlertaSonoro(prefs.somTipo);
    }

    // Registra no histórico
    const novoRegistro: RegistroNotificacaoPush = {
      id: `push-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      idEventoOrigem: dados.idEventoOrigem,
      titulo: dados.titulo,
      mensagem: dados.mensagem,
      categoria: dados.categoria,
      severidade,
      timestamp: new Date().toISOString(),
      dataVencimento: dados.dataVencimento,
      valor: dados.valor,
      orgao: dados.orgao,
      lida: false,
      aberta: false,
      canal: (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') ? 'WEB_PUSH' : 'IN_APP',
      acaoUrl: dados.acaoUrl || '/dashboard',
      acaoTexto: dados.acaoTexto || 'Ver no Painel',
      tag
    };

    this.salvarHistorico([novoRegistro, ...this.historico().slice(0, 49)]);

    // Se tiver permissão no navegador, dispara o Web Notification nativo
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        const opcoes: NotificationOptions = {
          body: dados.mensagem,
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          tag,
          requireInteraction: severidade === 'CRITICO' || severidade === 'URGENTE',
          data: { url: dados.acaoUrl || '/dashboard' }
        };

        if (this.swRegistration && 'showNotification' in this.swRegistration) {
          await this.swRegistration.showNotification(dados.titulo, opcoes);
        } else {
          const notif = new Notification(dados.titulo, opcoes);
          notif.onclick = () => {
            window.focus();
            notif.close();
          };
        }
        return true;
      } catch (err) {
        console.warn('Erro ao disparar Web Notification nativo:', err);
      }
    }

    return false;
  }

  /**
   * Monitoramento contínuo em segundo plano (Visibility API + Interval)
   */
  private iniciarMonitoramentoSegundoPlano() {
    if (typeof window === 'undefined') return;

    // Checagem periódica a cada 60 segundos
    this.timerVerificacaoId = setInterval(() => {
      this.executarChecagemSegundoPlano();
    }, 60000);

    // Quando o usuário volta à aba ou minimiza/maximiza
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        this.verificarStatusPermissaoAtualizado();
      }
    });
  }

  private verificarStatusPermissaoAtualizado() {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      this.permissaoStatus.set(Notification.permission as StatusPermissaoPush);
    }
  }

  /**
   * Executa a checagem automática dos vencimentos fiscais e dispara pushes pertinentes
   */
  processarPrazosVencimentos(eventos: EventoVencimentoFiscal[]) {
    const prefs = this.preferencias();
    if (!prefs.ativo) return;

    const hojeStr = new Date().toISOString().substring(0, 10);

    eventos.forEach(evento => {
      // Ignora eventos já concluídos ou pagos
      if (evento.pagoOuTransmitido || evento.status === 'CONCLUIDO' || evento.status === 'PAGO') {
        return;
      }

      // Validação de categoria habilitada
      const categoriaHabilitada = this.verificarCategoriaHabilitada(evento.categoria, prefs);
      if (!categoriaHabilitada) return;

      const dias = evento.diasParaVencer;
      const chaveEnvio = `${evento.id}_dia_${dias}_${hojeStr}`;

      // Já notificou este gatilho hoje?
      if (this.enviosHoje().includes(chaveEnvio)) {
        return;
      }

      let deveNotificar = false;
      let severidade: 'INFO' | 'ATENCAO' | 'CRITICO' | 'URGENTE' = 'INFO';
      let titulo = '';
      let mensagem = '';

      if (dias < 0 && prefs.alertarVencidosDiariamente) {
        // Vencido
        deveNotificar = true;
        severidade = 'CRITICO';
        titulo = `⚠️ IMPOSTO VENCIDO: ${evento.titulo}`;
        mensagem = `A guia de recolhimento (${evento.orgaoOuDestino}) de R$ ${(evento.valor || 0).toFixed(2)} venceu há ${Math.abs(dias)} dia(s). Regularize para evitar multas.`;
      } else if (dias === 0 && prefs.diasAntecedencia.includes(0)) {
        // Vence Hoje
        deveNotificar = true;
        severidade = 'URGENTE';
        titulo = `🔴 VENCE HOJE: ${evento.titulo}`;
        mensagem = `O prazo limite para pagamento/transmissão é hoje (${evento.data_vencimento.split('-').reverse().join('/')}). Valor: R$ ${(evento.valor || 0).toFixed(2)}.`;
      } else if (dias === 1 && prefs.diasAntecedencia.includes(1)) {
        // Vence Amanhã
        deveNotificar = true;
        severidade = 'ATENCAO';
        titulo = `⏰ Vence Amanhã: ${evento.titulo}`;
        mensagem = `Lembrete fiscal: ${evento.titulo} tem vencimento previsto para amanhã (${evento.data_vencimento.split('-').reverse().join('/')}).`;
      } else if (dias > 1 && prefs.diasAntecedencia.includes(dias)) {
        // Antecedência configurada (ex: 3 ou 5 dias)
        deveNotificar = true;
        severidade = 'INFO';
        titulo = `📅 Lembrete Fiscal (${dias} dias): ${evento.titulo}`;
        mensagem = `${evento.titulo} vencerá em ${dias} dias (${evento.data_vencimento.split('-').reverse().join('/')}). Valor previsto: R$ ${(evento.valor || 0).toFixed(2)}.`;
      }

      if (deveNotificar) {
        this.salvarEnviosHoje(chaveEnvio);
        this.dispararNotificacaoPush({
          titulo,
          mensagem,
          categoria: this.mapearCategoriaFiscalParaPush(evento.categoria),
          severidade,
          idEventoOrigem: evento.id,
          dataVencimento: evento.data_vencimento,
          valor: evento.valor,
          orgao: evento.orgaoOuDestino,
          tag: `venc-${evento.id}-${dias}`
        });
      }
    });
  }

  private verificarCategoriaHabilitada(cat: string, prefs: PreferenciasNotificacaoPush): boolean {
    switch (cat) {
      case 'IMPOSTO_FEDERAL':
        return prefs.notificarDasSimples || prefs.notificarDasMeiParceiros;
      case 'IMPOSTO_MUNICIPAL':
        return prefs.notificarIssMunicipal;
      case 'OBRIGACAO_ACESSORIA':
        return prefs.notificarEfdReinf;
      case 'PRAZO_ENVIO_NFSE':
        return prefs.notificarNfsePendentes48h;
      case 'FATURA_CLIENTE':
        return prefs.notificarFaturasClientes;
      default:
        return true;
    }
  }

  private mapearCategoriaFiscalParaPush(cat: string): CategoriaNotificacaoPush {
    switch (cat) {
      case 'IMPOSTO_FEDERAL':
        return 'IMPOSTO_FEDERAL';
      case 'IMPOSTO_MUNICIPAL':
        return 'IMPOSTO_MUNICIPAL';
      case 'OBRIGACAO_ACESSORIA':
        return 'OBRIGACAO_ACESSORIA';
      case 'PRAZO_ENVIO_NFSE':
        return 'NFSE_PENDENTE_48H';
      case 'FATURA_CLIENTE':
        return 'FATURA_CLIENTE';
      default:
        return 'SISTEMA_GERAL';
    }
  }

  private executarChecagemSegundoPlano() {
    // A checagem real utiliza os eventos do FinanceStateService quando acionado
  }

  /**
   * Gera a lista de notificações previstas para os próximos dias com base nos eventos atuais e lembretes personalizados
   */
  obterNotificacoesAgendadas(eventos: EventoVencimentoFiscal[]): NotificacaoAgendadaPreview[] {
    const prefs = this.preferencias();
    const previews: NotificacaoAgendadaPreview[] = [];

    // 1. Processa eventos de obrigações fiscais do sistema
    eventos.forEach(ev => {
      if (ev.pagoOuTransmitido || ev.status === 'CONCLUIDO' || ev.status === 'PAGO') return;

      const catHabilitada = this.verificarCategoriaHabilitada(ev.categoria, prefs);
      if (!catHabilitada) return;

      prefs.diasAntecedencia.forEach(antecedencia => {
        if (ev.diasParaVencer >= antecedencia) {
          const diasAteDisparo = ev.diasParaVencer - antecedencia;
          const dataDisparo = new Date();
          dataDisparo.setDate(dataDisparo.getDate() + diasAteDisparo);

          previews.push({
            id: `sched-${ev.id}-${antecedencia}`,
            titulo: antecedencia === 0 ? `Vencimento Hoje: ${ev.titulo}` : `${antecedencia} dia(s) antes: ${ev.titulo}`,
            categoria: this.mapearCategoriaFiscalParaPush(ev.categoria),
            dataPrevisaoEnvio: dataDisparo.toISOString().substring(0, 10),
            dataVencimentoImposto: ev.data_vencimento,
            diasRestantes: diasAteDisparo,
            valor: ev.valor,
            motivoGatilho: antecedencia === 0 ? 'No dia do vencimento' : `${antecedencia} dias antes do vencimento`,
            severidade: ev.diasParaVencer <= 1 ? 'CRITICO' : ev.diasParaVencer <= 3 ? 'ATENCAO' : 'INFO',
            personalizado: false
          });
        }
      });
    });

    // 2. Processa Lembretes Personalizados do Usuário
    const hoje = new Date('2026-08-24T12:00:00Z');
    const diaAtual = hoje.getDate();
    const mesAtual = hoje.getMonth();
    const anoAtual = hoje.getFullYear();

    (prefs.lembretesPersonalizados || []).forEach(lembrete => {
      if (!lembrete.ativo) return;

      let dataAlvo: Date;
      if (lembrete.diaDoMes) {
        // Se o dia do mês já passou no mês corrente, projeta para o próximo mês
        if (lembrete.diaDoMes < diaAtual) {
          dataAlvo = new Date(anoAtual, mesAtual + 1, lembrete.diaDoMes);
        } else {
          dataAlvo = new Date(anoAtual, mesAtual, lembrete.diaDoMes);
        }
      } else if (lembrete.dataEspecifica) {
        dataAlvo = new Date(lembrete.dataEspecifica + 'T12:00:00Z');
      } else {
        return;
      }

      const diffMs = dataAlvo.getTime() - hoje.getTime();
      const diasParaVencer = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      if (diasParaVencer < 0) return;

      const antecedencias = lembrete.diasAntecedencia && lembrete.diasAntecedencia.length > 0 
        ? lembrete.diasAntecedencia 
        : prefs.diasAntecedencia;

      antecedencias.forEach(antecedencia => {
        if (diasParaVencer >= antecedencia) {
          const diasAteDisparo = diasParaVencer - antecedencia;
          const dataDisparo = new Date(hoje);
          dataDisparo.setDate(dataDisparo.getDate() + diasAteDisparo);

          previews.push({
            id: `sched-custom-${lembrete.id}-${antecedencia}`,
            titulo: antecedencia === 0 ? `Lembrete Hoje: ${lembrete.titulo}` : `${antecedencia}d antes: ${lembrete.titulo}`,
            categoria: lembrete.categoria,
            dataPrevisaoEnvio: dataDisparo.toISOString().substring(0, 10),
            dataVencimentoImposto: dataAlvo.toISOString().substring(0, 10),
            diasRestantes: diasAteDisparo,
            valor: lembrete.valorEstimado,
            motivoGatilho: antecedencia === 0 ? 'No dia programado' : `${antecedencia} dias antes do prazo`,
            severidade: diasParaVencer <= 1 ? 'URGENTE' : diasParaVencer <= 3 ? 'ATENCAO' : 'INFO',
            personalizado: true
          });
        }
      });
    });

    return previews.sort((a, b) => a.diasRestantes - b.diasRestantes);
  }

  /**
   * Dispara um teste imediato de Notificação Push
   */
  async testarNotificacaoPush(tipoSimulado: 'DAS' | 'ISS' | 'REINF' | 'NFSE_48H' = 'DAS'): Promise<boolean> {
    const simulacoes = {
      DAS: {
        titulo: '🔔 Teste Push: DAS Simples Nacional (Comp. 08/2026)',
        mensagem: 'Lembrete automático: A cota retida da empresa gerou R$ 1.842,30 de DAS com vencimento em 21/09/2026.',
        categoria: 'IMPOSTO_FEDERAL' as CategoriaNotificacaoPush,
        severidade: 'ATENCAO' as const,
        valor: 1842.30,
        orgao: 'Receita Federal / PGDAS-D'
      },
      ISS: {
        titulo: '🔔 Teste Push: ISSQN Municipal SEFIN',
        mensagem: 'A guia de recolhimento de ISS municipal (R$ 164,50) vencerá em 10/09/2026.',
        categoria: 'IMPOSTO_MUNICIPAL' as CategoriaNotificacaoPush,
        severidade: 'INFO' as const,
        valor: 164.50,
        orgao: 'SEFIN Municipal'
      },
      REINF: {
        titulo: '🔔 Teste Push: EFD-Reinf / DCTFWeb Lei 13.352',
        mensagem: 'Transmissão da escrituração digital de repasses MEI agendada para 15/09/2026.',
        categoria: 'OBRIGACAO_ACESSORIA' as CategoriaNotificacaoPush,
        severidade: 'INFO' as const,
        orgao: 'Sped / Receita Federal'
      },
      NFSE_48H: {
        titulo: '⚠️ Teste Push: RPS Pendente de Conversão > 48h',
        mensagem: 'RPS #884 aguardando transmissão para a SEFIN há 52 horas.',
        categoria: 'NFSE_PENDENTE_48H' as CategoriaNotificacaoPush,
        severidade: 'CRITICO' as const,
        valor: 920.00,
        orgao: 'SEFIN Municipal'
      }
    };

    const sim = simulacoes[tipoSimulado] || simulacoes.DAS;
    return await this.dispararNotificacaoPush(sim);
  }

  /**
   * Sintetizador de áudio Web Audio API para tocar alertas sonoros harmônicos e elegantes
   */
  tocarAlertaSonoro(tipo: 'CHIME_CORPORATIVO' | 'SUTIL' | 'SUAVE' | 'ALERTA_CRITICO' = 'CHIME_CORPORATIVO') {
    if (typeof window === 'undefined') return;

    try {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtxClass) return;

      if (!this.audioCtx || this.audioCtx.state === 'closed') {
        this.audioCtx = new AudioCtxClass();
      }

      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

      const now = this.audioCtx.currentTime;

      if (tipo === 'CHIME_CORPORATIVO') {
        // Acorde triplo harmonioso D5 -> F#5 -> A5
        const notas = [587.33, 739.99, 880.00];
        notas.forEach((freq, i) => {
          const osc = this.audioCtx!.createOscillator();
          const gain = this.audioCtx!.createGain();

          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + i * 0.08);

          gain.gain.setValueAtTime(0.001, now + i * 0.08);
          gain.gain.exponentialRampToValueAtTime(0.12, now + i * 0.08 + 0.03);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.08 + 0.45);

          osc.connect(gain);
          gain.connect(this.audioCtx!.destination);

          osc.start(now + i * 0.08);
          osc.stop(now + i * 0.08 + 0.46);
        });
      } else if (tipo === 'SUTIL') {
        // Ping discreto
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, now);

        gain.gain.setValueAtTime(0.001, now);
        gain.gain.exponentialRampToValueAtTime(0.08, now + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);

        osc.connect(gain);
        gain.connect(this.audioCtx.destination);

        osc.start(now);
        osc.stop(now + 0.26);
      } else if (tipo === 'SUAVE') {
        // Arpeggio ascendente
        const freqs = [523.25, 659.25, 783.99, 1046.50];
        freqs.forEach((freq, idx) => {
          const osc = this.audioCtx!.createOscillator();
          const gain = this.audioCtx!.createGain();

          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now + idx * 0.06);

          gain.gain.setValueAtTime(0.001, now + idx * 0.06);
          gain.gain.exponentialRampToValueAtTime(0.09, now + idx * 0.06 + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.06 + 0.35);

          osc.connect(gain);
          gain.connect(this.audioCtx!.destination);

          osc.start(now + idx * 0.06);
          osc.stop(now + idx * 0.06 + 0.36);
        });
      } else if (tipo === 'ALERTA_CRITICO') {
        // Alerta de urgência (dois pulsos marcantes)
        [0, 0.18].forEach(offset => {
          const osc = this.audioCtx!.createOscillator();
          const gain = this.audioCtx!.createGain();

          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(740, now + offset);

          gain.gain.setValueAtTime(0.001, now + offset);
          gain.gain.exponentialRampToValueAtTime(0.14, now + offset + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + offset + 0.14);

          osc.connect(gain);
          gain.connect(this.audioCtx!.destination);

          osc.start(now + offset);
          osc.stop(now + offset + 0.15);
        });
      }
    } catch (e) {
      console.warn('Áudio não inicializado:', e);
    }
  }

  // Gerenciamento do Histórico de Notificações
  marcarComoLida(id: string) {
    const atualizado = this.historico().map(n => n.id === id ? { ...n, lida: true } : n);
    this.salvarHistorico(atualizado);
  }

  marcarTodasComoLidas() {
    const atualizado = this.historico().map(n => ({ ...n, lida: true }));
    this.salvarHistorico(atualizado);
  }

  removerNotificacao(id: string) {
    const atualizado = this.historico().filter(n => n.id !== id);
    this.salvarHistorico(atualizado);
  }

  limparHistorico() {
    this.salvarHistorico([]);
  }

  // Atualização de Preferências
  atualizarPreferencias(novas: Partial<PreferenciasNotificacaoPush>) {
    const atual = this.preferencias();
    const mesclado = { ...atual, ...novas };
    this.salvarPreferencias(mesclado);
  }

  alternarAntecedencia(dias: number) {
    const atual = this.preferencias().diasAntecedencia;
    const existe = atual.includes(dias);
    const novoArray = existe ? atual.filter(d => d !== dias) : [...atual, dias].sort((a, b) => b - a);
    this.atualizarPreferencias({ diasAntecedencia: novoArray });
  }

  adicionarDiaAntecedencia(dia: number) {
    if (dia < 0 || dia > 60) return;
    const atual = this.preferencias().diasAntecedencia;
    if (!atual.includes(dia)) {
      const novoArray = [...atual, dia].sort((a, b) => b - a);
      this.atualizarPreferencias({ diasAntecedencia: novoArray });
    }
  }

  removerDiaAntecedencia(dia: number) {
    const atual = this.preferencias().diasAntecedencia;
    const novoArray = atual.filter(d => d !== dia);
    this.atualizarPreferencias({ diasAntecedencia: novoArray });
  }

  alternarAtivo() {
    const atual = this.preferencias().ativo;
    this.atualizarPreferencias({ ativo: !atual });
  }

  // --- Gerenciamento de Lembretes Fiscais Personalizados ---

  adicionarLembretePersonalizado(novo: Omit<LembreteFiscalPersonalizado, 'id' | 'criadoEm'>): LembreteFiscalPersonalizado {
    const id = 'lembrete-custom-' + Date.now();
    const lembreteCompleto: LembreteFiscalPersonalizado = {
      ...novo,
      id,
      criadoEm: new Date().toISOString().substring(0, 10)
    };

    const atuais = this.preferencias().lembretesPersonalizados || [];
    this.atualizarPreferencias({
      lembretesPersonalizados: [lembreteCompleto, ...atuais]
    });

    return lembreteCompleto;
  }

  atualizarLembretePersonalizado(id: string, dados: Partial<LembreteFiscalPersonalizado>) {
    const atuais = this.preferencias().lembretesPersonalizados || [];
    const atualizados = atuais.map(item => item.id === id ? { ...item, ...dados } : item);
    this.atualizarPreferencias({
      lembretesPersonalizados: atualizados
    });
  }

  removerLembretePersonalizado(id: string) {
    const atuais = this.preferencias().lembretesPersonalizados || [];
    const filtrados = atuais.filter(item => item.id !== id);
    this.atualizarPreferencias({
      lembretesPersonalizados: filtrados
    });
  }

  alternarStatusLembretePersonalizado(id: string) {
    const atuais = this.preferencias().lembretesPersonalizados || [];
    const atualizados = atuais.map(item => item.id === id ? { ...item, ativo: !item.ativo } : item);
    this.atualizarPreferencias({
      lembretesPersonalizados: atualizados
    });
  }

  restaurarPadroesFiscais() {
    const padrao = this.carregarPreferencias();
    this.salvarPreferencias({
      ...padrao,
      ativo: true,
      canalWebPush: true,
      canalInApp: true,
      notificarDasSimples: true,
      notificarIssMunicipal: true,
      notificarEfdReinf: true,
      notificarDasMeiParceiros: true,
      notificarNfsePendentes48h: true,
      notificarFaturasClientes: true,
      notificarTetoMei80Porcento: true,
      notificarFechamentosRateio: true,
      diasAntecedencia: [5, 3, 1, 0],
      alertarVencidosDiariamente: true,
      horarioChecagem: '08:30',
      tocarSom: true,
      somTipo: 'CHIME_CORPORATIVO'
    });
  }
}
