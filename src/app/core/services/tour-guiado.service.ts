import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';

export interface PassoTour {
  id: string;
  titulo: string;
  subtitulo: string;
  descricao: string;
  rotaAlvo?: string;
  seletorElemento?: string;
  posicao?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  icone: string;
  badge?: string;
  dicaLegal?: string;
  acaoTexto?: string;
}

@Injectable({
  providedIn: 'root'
})
export class TourGuiadoService {
  private readonly router = inject(Router);

  private readonly STORAGE_KEY = 'beautyfinance_tour_concluido_v1';

  // Passos do tour com foco em:
  // 1. Apresentação Geral & Check-list de Primeiros Passos
  // 2. Parâmetros Fiscais (Alíquota Efetiva do Simples, Fator R e Sócios QSA)
  // 3. Onde configurar os profissionais MEI (validação CNPJ, contrato, taxas e chave PIX)
  // 4. Onde lançar ou importar comandas e apurar o rateio
  // 5. Como emitir o primeiro comprovante oficial de repasse (PDF e Prestação de Contas)
  // 6. Painel de Fechamentos e conformidade fiscal
  readonly passos: PassoTour[] = [
    {
      id: 'boas-vindas',
      titulo: 'Bem-vindo ao BeautyFinance!',
      subtitulo: 'Gestão Completa sob a Lei do Salão-Parceiro (Lei 13.352/2016)',
      descricao: 'Este tour guiado vai mostrar os principais passos para você configurar sua empresa, acompanhar o Check-list de Primeiros Passos, cadastrar profissionais MEI e apurar rateios.',
      icone: 'waving_hand',
      badge: 'Início Rápido',
      posicao: 'center',
      dicaLegal: 'A Lei do Salão-Parceiro permite tributar no Simples Nacional apenas a cota retida pelo salão, desde que os repasses e contratos estejam documentados.',
      rotaAlvo: '/dashboard'
    },
    {
      id: 'checklist-primeiros-passos',
      titulo: '1. Check-list de Primeiros Passos Fiscais',
      subtitulo: 'Alíquota Efetiva, Quadro Societário (Sócios) e Certificado A1',
      descricao: 'Na Dashboard, o painel de Primeiros Passos indica quais parâmetros tributários ainda estão pendentes de preenchimento (ex: alíquota efetiva apurada do Simples, sócios administradores e inscrição municipal).',
      icone: 'checklist',
      badge: 'Etapa 1 (Configurações Fiscais)',
      rotaAlvo: '/dashboard',
      seletorElemento: '#card-checklist-primeiros-passos',
      posicao: 'bottom',
      dicaLegal: 'Manter a alíquota efetiva e o Fator R atualizados garante que o cálculo da economia tributária reflita exatamente o imposto apurado no PGDAS-D.',
      acaoTexto: 'Ver Check-list na Dashboard'
    },
    {
      id: 'config-profissionais-mei',
      titulo: '2. Configuração dos Profissionais MEI',
      subtitulo: 'Cadastros, Contratos Homologados e Chaves PIX',
      descricao: 'Aqui você cadastra seus cabeleireiros, manicures, maquiadores e barbeiros como MEI parceiros. O sistema valida automaticamente o CNPJ na Receita Federal via algoritmo Módulo 11.',
      icone: 'groups',
      badge: 'Etapa 2',
      rotaAlvo: '/parceiros',
      seletorElemento: '#btn-consultar-cnpj-parceiros',
      posicao: 'bottom',
      dicaLegal: 'Defina a cota contratual de cada parceiro (ex: 60% MEI / 40% Salão), percentuais de absorção de taxas de cartão e a chave PIX para pagamentos.',
      acaoTexto: 'Ir para Cadastro de MEIs'
    },
    {
      id: 'novo-parceiro-modal',
      titulo: '3. Parâmetros de Partilha & Taxas de Cartão',
      subtitulo: 'Blindagem contra Bitributação',
      descricao: 'No cadastro do MEI, você estabelece as regras de desconto: rateio de taxas de maquininha de cartão por operadora e ressarcimento de insumos/produtos.',
      icone: 'percent',
      badge: 'Etapa 3',
      rotaAlvo: '/parceiros',
      seletorElemento: '#parceiros-page',
      posicao: 'center',
      dicaLegal: 'A dedução formal das taxas operacionais evita bitributação e protege o estabelecimento de passivos trabalhistas.'
    },
    {
      id: 'apuracao-repasses',
      titulo: '4. Relatório e Rateio de Repasses',
      subtitulo: 'Lançamento de Comandas e Apuração em Tempo Real',
      descricao: 'Nesta tela você acompanha a produção bruta de cada profissional, as taxas de cartão deduzidas por comanda e o valor líquido exato a ser transferido.',
      icone: 'payments',
      badge: 'Etapa 4',
      rotaAlvo: '/relatorio-repasse',
      seletorElemento: '#btn-nova-venda-repasse',
      posicao: 'bottom',
      dicaLegal: 'Adicione comandas de atendimentos ou importe dados para ver o cálculo automático de cotas Salão vs Parceiro.'
    },
    {
      id: 'emissao-comprovante-pdf',
      titulo: '5. Como Emitir o Comprovante de Repasse',
      subtitulo: 'Geração do Documento Oficial A4 com Assinaturas',
      descricao: 'Para emitir o comprovante, clique no botão "Demonstrativo" ou "Baixar PDF" no card do profissional. O sistema gera um documento A4 completo com demonstrativo de serviços, taxas, PIX e termos da Lei 13.352.',
      icone: 'picture_as_pdf',
      badge: 'Etapa 5 (Principal)',
      rotaAlvo: '/relatorio-repasse',
      seletorElemento: '#btn-demonstrativo-0',
      posicao: 'top',
      dicaLegal: 'O comprovante gerado serve como recibo formal para a contabilidade e base para a emissão da NFS-e pelo MEI parceiro.',
      acaoTexto: 'Ver Demonstração de Repasse'
    },
    {
      id: 'fechamento-liquidacao',
      titulo: '6. Fechamentos Mensais & Liquidação PIX',
      subtitulo: 'Controle de NFS-e Recebidas e Pagamentos',
      descricao: 'No menu Fechamentos & Cotas, você confere o status de cada repasse, valida a NFS-e enviada pelo parceiro e confirma a liquidação via PIX com geração de protocolo.',
      icone: 'calculate',
      badge: 'Etapa 6',
      rotaAlvo: '/fechamentos',
      seletorElemento: '#fechamentos-page',
      posicao: 'center',
      dicaLegal: 'Você pode reabrir este tour a qualquer momento pelo botão de ajuda no cabeçalho ou nas configurações.'
    }
  ];

  readonly tourAtivo = signal<boolean>(false);
  readonly passoAtualIndex = signal<number>(0);

  readonly totalPassos = computed(() => this.passos.length);
  readonly passoAtual = computed(() => this.passos[this.passoAtualIndex()] || this.passos[0]);

  constructor() {
    this.verificarInicioAutomatico();
  }

  private verificarInicioAutomatico(): void {
    if (typeof window === 'undefined') return;
    try {
      const tourJaVisto = localStorage.getItem(this.STORAGE_KEY);
      if (!tourJaVisto) {
        // Inicia automaticamente para novos usuários com um pequeno delay suave
        setTimeout(() => {
          this.iniciarTour();
        }, 1200);
      }
    } catch {
      // Ignora erro de storage
    }
  }

  iniciarTour(): void {
    this.passoAtualIndex.set(0);
    this.tourAtivo.set(true);
    this.navegarParaPasso(0);
  }

  avancarPasso(): void {
    const proximo = this.passoAtualIndex() + 1;
    if (proximo < this.passos.length) {
      this.passoAtualIndex.set(proximo);
      this.navegarParaPasso(proximo);
    } else {
      this.concluirTour();
    }
  }

  voltarPasso(): void {
    const anterior = this.passoAtualIndex() - 1;
    if (anterior >= 0) {
      this.passoAtualIndex.set(anterior);
      this.navegarParaPasso(anterior);
    }
  }

  irParaPasso(index: number): void {
    if (index >= 0 && index < this.passos.length) {
      this.passoAtualIndex.set(index);
      this.navegarParaPasso(index);
    }
  }

  concluirTour(): void {
    this.tourAtivo.set(false);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(this.STORAGE_KEY, 'true');
      } catch {
        // Ignora
      }
    }
  }

  reiniciarTour(): void {
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(this.STORAGE_KEY);
      } catch {
        // Ignora
      }
    }
    this.iniciarTour();
  }

  private navegarParaPasso(index: number): void {
    const passo = this.passos[index];
    if (passo && passo.rotaAlvo) {
      this.router.navigateByUrl(passo.rotaAlvo);
    }
  }
}
