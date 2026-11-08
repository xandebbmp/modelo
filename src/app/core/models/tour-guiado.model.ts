export interface PassoTour {
  id: string;
  titulo: string;
  subtitulo: string;
  descricao: string;
  categoria: string;
  icone: string;
  corIcone?: string;
  targetSelector: string;
  posicaoPreferida?: 'bottom' | 'top' | 'left' | 'right' | 'center';
  dicaPratica?: string;
  acaoTexto?: string;
}

export const PASSOS_TOUR_DASHBOARD: PassoTour[] = [
  {
    id: 'boas-vindas',
    titulo: 'Bem-vindo ao BeautyFinance',
    subtitulo: 'Hub de Inteligência Fiscal para Salões & Clínicas',
    descricao: 'Este painel foi desenvolvido especificamente para gerenciar o cumprimento rigoroso da Lei do Salão-Parceiro (Lei nº 13.352/2016) e otimizar os tributos do Simples Nacional (Anexo III). Vamos explorar as ferramentas fundamentais.',
    categoria: 'Visão Geral',
    icone: 'account_balance',
    corIcone: '#b66a3c',
    targetSelector: '#top-banner-dashboard',
    posicaoPreferida: 'bottom',
    dicaPratica: 'Você pode alternar entre Unidade Matriz e Filiais pelo menu lateral ou sincronizar métricas a qualquer momento.'
  },
  {
    id: 'painel-executivo',
    titulo: 'Painel Executivo Mensal',
    subtitulo: 'Status de Notas Emitidas, Valor Recebido e Pendências',
    descricao: 'Estes 3 cards oferecem o panorama instantâneo de faturamento, total de notas fiscais de serviço (NFS-e) autorizadas no ADN e eventuais pendências de conciliação fiscal.',
    categoria: 'Resumo Operacional',
    icone: 'dashboard_customize',
    corIcone: '#17324d',
    targetSelector: '#cards-resumo-dashboard-container',
    posicaoPreferida: 'bottom',
    dicaPratica: 'Clique em "Conciliar 1-Clique" para autorizar em lote todas as notas com fechamentos conferidos.'
  },
  {
    id: 'segregacao-cotas',
    titulo: 'Métricas de Segregação Fiscal',
    subtitulo: 'Produção Total vs. Cota do Salão vs. Repasse MEI',
    descricao: 'Aqui você visualiza a separação contábil obrigatória por lei: a Cota Retida pelo Salão (única base de cálculo para a apuração do DAS) e o Repasse Líquido aos Profissionais Parceiros MEI (isento de bitributação).',
    categoria: 'Conformidade Fiscal',
    icone: 'pie_chart',
    corIcone: '#367158',
    targetSelector: '#metricas-segregacao-container',
    posicaoPreferida: 'bottom',
    dicaPratica: 'A emissão de NFS-e individual por cada MEI garante a blindagem jurídica e a comprovação da dedução perante a Receita Federal.'
  },
  {
    id: 'grafico-tributario-d3',
    titulo: 'Comparativo Mensal de Impostos vs Faturamento (D3.js)',
    subtitulo: 'Curva de Margem Tributária Efetiva & Economia Fiscal',
    descricao: 'Gráfico interativo construído em D3.js para analisar a evolução da carga tributária real mês a mês. Alterne entre os modos Comparativo, Decomposição Legal e Economia Tributária, com suporte a exportação em SVG e CSV.',
    categoria: 'Inteligência Fiscal D3',
    icone: 'insights',
    corIcone: '#10b981',
    targetSelector: '#container-grafico-tributario-d3',
    posicaoPreferida: 'top',
    dicaPratica: 'Passe o mouse sobre as barras ou clique em um mês para auditar a decomposição detalhada de ISS, CPP, IRPJ, CSLL, PIS e COFINS.'
  },
  {
    id: 'resumo-financeiro',
    titulo: 'Evolução Mensal & Gráfico de Cotas',
    subtitulo: 'Acompanhamento Histórico e Proporções',
    descricao: 'Gráficos interativos mostram a evolução do faturamento bruto nos últimos 6 meses, detalhando visualmente o percentual retido pela empresa versus o volume transferido aos parceiros.',
    categoria: 'Inteligência Financeira',
    icone: 'bar_chart',
    corIcone: '#17324d',
    targetSelector: '#resumo-financeiro-container',
    posicaoPreferida: 'top',
    dicaPratica: 'Passe o cursor sobre as barras para ver a decomposição monetária exata e as alíquotas aplicadas em cada mês.'
  },
  {
    id: 'comparativo-mom',
    titulo: 'Comparativo MoM por Profissional',
    subtitulo: 'Desempenho Mês a Mês dos Parceiros MEI',
    descricao: 'Compare a produtividade de cada profissional em relação ao mês anterior (MoM), identificando tendências de crescimento, novos parceiros e distribuição da receita.',
    categoria: 'Performance & Gestão',
    icone: 'query_stats',
    corIcone: '#367158',
    targetSelector: '#comparativo-faturamento-mom-container',
    posicaoPreferida: 'top',
    dicaPratica: 'Alterne entre visualização por Barras Agrupadas, Variação Percentual ou Tabela de Ranking com 1 clique.'
  },
  {
    id: 'simulador-tributario',
    titulo: 'Simulador de Carga Tributária',
    subtitulo: 'Cálculo do DAS e Comprovação de Economia',
    descricao: 'Simule em tempo real o imposto a pagar no Simples Nacional (Anexo III) com base no seu RBT12. O simulador calcula automaticamente as 6 faixas, a alíquota efetiva e a economia gerada pela Lei 13.352.',
    categoria: 'Planejamento Tributário',
    icone: 'calculate',
    corIcone: '#b66a3c',
    targetSelector: '#simulador-carga-tributaria-container',
    posicaoPreferida: 'top',
    dicaPratica: 'Clique em "Sincronizar Dados Reais" para carregar automaticamente o faturamento bruto e percentual de repasse do fechamento ativo.'
  },
  {
    id: 'alertas-calendario',
    titulo: 'Alertas & Calendário Fiscal',
    subtitulo: 'Prazos de DAS, ISS e Fechamentos Pendentes',
    descricao: 'Mantenha o salão 100% em dia com os prazos tributários. O calendário destaca os dias de vencimento da guia do Simples, DAS-SIMEI e pagamentos aos parceiros, com alertas para notas não emitidas há mais de 48h.',
    categoria: 'Compliance & Prazos',
    icone: 'event_available',
    corIcone: '#9a6431',
    targetSelector: '#secao-alertas-calendario-container',
    posicaoPreferida: 'top',
    dicaPratica: 'Evite multas e juros monitorando a linha do tempo e marcando tarefas como concluídas.'
  },
  {
    id: 'simulador-mobile-mei',
    titulo: 'Simulador do App MEI em 1-Clique',
    subtitulo: 'Ambiente Interativo de Emissão pelo Celular',
    descricao: 'Abra o drawer lateral para experimentar a interface que o profissional parceiro utiliza no smartphone para conferir a produção, aprovar o fechamento e emitir sua nota fiscal eletrônica.',
    categoria: 'Experiência Mobile',
    icone: 'smartphone',
    corIcone: '#2d678d',
    targetSelector: '#btn-simular-mobile-dashboard',
    posicaoPreferida: 'left',
    dicaPratica: 'Esta funcionalidade permite treinar sua equipe e demonstrar a simplicidade da emissão em 1 clique.'
  },
  {
    id: 'relatorios-pdf',
    titulo: 'Relatórios Fiscais & Exportação PDF',
    subtitulo: 'Documentos Oficiais com Auditoria Digital',
    descricao: 'Exporte relatórios completos em formato PDF prontos para impressão ou envio por e-mail/WhatsApp, contendo extrato de produção, prestação de contas MEI e conciliação contábil.',
    categoria: 'Auditoria & Contabilidade',
    icone: 'picture_as_pdf',
    corIcone: '#b66a3c',
    targetSelector: '#btn-abrir-export-pdf-dashboard',
    posicaoPreferida: 'left',
    dicaPratica: 'Os relatórios contêm dados homologados da NFS-e Padrão Nacional (ADN) e memória de cálculo discriminada.'
  }
];
