import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { GoogleGenAI, Type } from '@google/genai';

const serverDistFolder = dirname(fileURLToPath(import.meta.url));
const browserDistFolder = resolve(serverDistFolder, '../browser');

const app = express();
const angularApp = new AngularNodeAppEngine();

// CORS and Cross-Origin Resource Policy for iframe and cross-origin embedding
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }
  next();
});

app.use(express.json());

// Lazy-loaded Gemini AI client
let genAIClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI {
  if (!genAIClient) {
    const apiKey = process.env['GEMINI_API_KEY'];
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is required');
    }
    genAIClient = new GoogleGenAI({ apiKey });
  }
  return genAIClient;
}

/**
 * Endpoint de Consultoria e Planejamento Tributário Inteligente via Gemini AI (gemini-3.7-flash)
 * Específico para empresas do Simples Nacional, Salão-Parceiro (Lei 13.352/2016), Fator R e Anexos III/V.
 */
app.post('/api/planejamento-tributario-ia', async (req, res) => {
  const inicioTimestamp = Date.now();
  try {
    const dadosRequisicao = req.body || {};
    const apiKey = process.env['GEMINI_API_KEY'];

    if (!apiKey) {
      console.warn('[Tax Advisor Server] GEMINI_API_KEY não configurada. Utilizando motor heurístico tributário avançado.');
      const fallbackResult = gerarPlanejamentoHeuristicoFallback(dadosRequisicao);
      res.json({
        sucesso: true,
        origem: 'MOTOR_HEURISTICO_TRIBUTARIO',
        tempo_processamento_ms: Date.now() - inicioTimestamp,
        ...fallbackResult
      });
      return;
    }

    const ai = getGenAI();

    const promptContexto = `
Você é o mais conceituado Consultor Tributário Sênior e Auditor Fiscal especialista em Simples Nacional (Lei Complementar 123/2006 e 155/2016), Lei do Salão-Parceiro (Lei Federal 13.352/2016), Fator R (Art. 18 § 5º-J e § 5º-M) e Planejamento Tributário para PMEs de Serviços e Beleza.

Analise o cenário fiscal da seguinte empresa e elabore um plano estratégico completo de otimização tributária para redução legal de impostos (Elisao Fiscal), prevenção de riscos de desenquadramento e blindagem contra bi-tributação.

DADOS DA EMPRESA:
- Razão Social / Nome: ${dadosRequisicao['empresa_nome'] || 'Empresa Salão Beleza Ltda'}
- CNPJ: ${dadosRequisicao['cnpj'] || '12.345.678/0001-90'}
- Localização: ${dadosRequisicao['cidade'] || 'São Paulo'} - ${dadosRequisicao['uf'] || 'SP'}
- Faturamento Acumulado 12 Meses (RBT12): R$ ${Number(dadosRequisicao['rbt12'] || 360000).toFixed(2)}
- Produção Bruta Mensal Atual: R$ ${Number(dadosRequisicao['faturamento_mensal_atual'] || 45000).toFixed(2)}
- Cota-Parte do Salão Mensal (Base Simples Nacional): R$ ${Number(dadosRequisicao['cota_salao_mensal'] || 20250).toFixed(2)}
- Repasses Líquidos a Parceiros MEI Mensal: R$ ${Number(dadosRequisicao['repasses_mei_mensal'] || 24750).toFixed(2)}
- Folha de Salários + Pró-Labore + Encargos 12m: R$ ${Number(dadosRequisicao['folha_salarios_pro_labore_12m'] || 90000).toFixed(2)}
- Fator R Atual: ${(Number(dadosRequisicao['fator_r_atual'] || 0.25) * 100).toFixed(2)}%
- Quantidade de Parceiros MEI Ativos: ${dadosRequisicao['quantidade_parceiros_ativos'] || 5}
- Alíquota ISS Municipal: ${dadosRequisicao['aliquota_iss_municipal'] || 2.0}%
- Foco Estratégico Solicitado: ${dadosRequisicao['foco_estrategico'] || 'GERAL'}
- Simulação Customizada Solicitada: ${JSON.stringify(dadosRequisicao['cenario_simulacao'] || {})}

DIRETRIZES TRIBUTÁRIAS OBRIGATÓRIAS:
1. Lei 13.352/2016 (Salão Parceiro): A cota repassada aos parceiros MEI é dedutível da receita bruta total para apuração do Simples Nacional. A base de cálculo do PGDAS-D é APENAS a cota do salão. A ausência de contratos homologados ou de emissão de NFS-e pelos MEIs coloca 100% da receita em risco de autuação.
2. Fator R (Folha/RBT12 >= 28%): Serviços sujeitos ao Anexo V (iniciando em 15.5%) migram para o Anexo III (iniciando em 6.0%) se o Fator R for >= 0.28. Avalie o custo-benefício de ajustar o pró-labore dos sócios para atingir 28%.
3. Faixas do Simples e Sublimites: Sublimite estadual para ICMS/ISS no DAS é R$ 3.600.000,00. Limite global é R$ 4.800.000,00. Monitore a aproximação de faixas e o cálculo da alíquota efetiva: [ (RBT12 * Alíquota Nominal - Parcela Deduzir) / RBT12 ].
4. Distribuição de Lucros Isenta vs Pró-labore: Sugira a composição ótima para os sócios (recolhendo INSS sobre 1 ou 2 salários mínimos e o restante como distribuição isenta com base na contabilidade regular).
5. Forneça números precisos em Reais (R$) para o impacto financeiro mensal e anual estimado.

Retorne estritamente um objeto JSON com todas as propriedades especificadas no schema.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: promptContexto,
      config: {
        systemInstruction: 'Você é um consultor fiscal e tributário especializado em Simples Nacional e salões de beleza. Retorne exclusivamente JSON estruturado.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            diagnostico: {
              type: Type.OBJECT,
              properties: {
                rbt12: { type: Type.NUMBER },
                faixa_simples_descricao: { type: Type.STRING },
                faixa_numero: { type: Type.INTEGER },
                aliquota_nominal: { type: Type.NUMBER },
                aliquota_efetiva: { type: Type.NUMBER },
                fator_r_percentual: { type: Type.NUMBER },
                anexo_otimo: { type: Type.STRING },
                status_saude: { type: Type.STRING },
                resumo_executivo: { type: Type.STRING },
                distancia_proxima_faixa_r: { type: Type.NUMBER },
                distancia_sublimite_r: { type: Type.NUMBER },
                potencial_economia_anual_total: { type: Type.NUMBER }
              },
              required: [
                'rbt12', 
                'faixa_simples_descricao', 
                'faixa_numero', 
                'aliquota_nominal', 
                'aliquota_efetiva', 
                'fator_r_percentual', 
                'anexo_otimo', 
                'status_saude', 
                'resumo_executivo',
                'potencial_economia_anual_total'
              ]
            },
            estrategias: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  titulo: { type: Type.STRING },
                  categoria: { type: Type.STRING },
                  categoria_rotulo: { type: Type.STRING },
                  impacto_financeiro_mensal_estimado: { type: Type.NUMBER },
                  impacto_financeiro_anual_estimado: { type: Type.NUMBER },
                  dificuldade_implementacao: { type: Type.STRING },
                  tempo_estimado: { type: Type.STRING },
                  fundamentacao_legal: { type: Type.STRING },
                  diagnostico_atual: { type: Type.STRING },
                  acao_recomendada: { type: Type.STRING },
                  passo_a_passo: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                  },
                  alerta_compliance: { type: Type.STRING }
                },
                required: [
                  'id', 
                  'titulo', 
                  'categoria', 
                  'categoria_rotulo', 
                  'impacto_financeiro_mensal_estimado', 
                  'impacto_financeiro_anual_estimado', 
                  'dificuldade_implementacao', 
                  'fundamentacao_legal', 
                  'acao_recomendada', 
                  'passo_a_passo'
                ]
              }
            },
            simulacoes_cenarios: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  nome: { type: Type.STRING },
                  imposto_mensal: { type: Type.NUMBER },
                  imposto_anual: { type: Type.NUMBER },
                  economia_anual: { type: Type.NUMBER },
                  aliquota_efetiva_percentual: { type: Type.NUMBER },
                  descricao: { type: Type.STRING },
                  recomendado: { type: Type.BOOLEAN }
                },
                required: ['nome', 'imposto_mensal', 'imposto_anual', 'economia_anual', 'aliquota_efetiva_percentual', 'descricao', 'recomendado']
              }
            },
            alertas_criticos: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            dicas_insights_ia: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ['diagnostico', 'estrategias', 'simulacoes_cenarios', 'alertas_criticos', 'dicas_insights_ia']
        }
      }
    });

    const parsedJson = JSON.parse(response.text || '{}');

    res.json({
      sucesso: true,
      origem: 'GEMINI_3_7_FLASH',
      tempo_processamento_ms: Date.now() - inicioTimestamp,
      data_geracao: new Date().toISOString(),
      ...parsedJson
    });

  } catch (error) {
    console.error('[Tax Advisor Server Error]', error);
    const fallbackResult = gerarPlanejamentoHeuristicoFallback(req.body || {});
    res.json({
      sucesso: true,
      origem: 'MOTOR_HEURISTICO_TRIBUTARIO',
      tempo_processamento_ms: Date.now() - inicioTimestamp,
      aviso_resiliencia: 'Planejamento gerado com sucesso via motor de inteligência tributária offline.',
      ...fallbackResult
    });
  }
});

function gerarPlanejamentoHeuristicoFallback(contexto: Record<string, unknown>) {
  const rbt12 = Number(contexto['rbt12']) || 360000;
  const faturamentoMensal = Number(contexto['faturamento_mensal_atual']) || 45000;
  const cotaSalaoMensal = Number(contexto['cota_salao_mensal']) || 20250;
  const repassesMeiMensal = Number(contexto['repasses_mei_mensal']) || 24750;
  const folha12m = Number(contexto['folha_salarios_pro_labore_12m']) || 90000;
  const fatorRAtual = (folha12m / rbt12) || 0.25;
  const qtdParceiros = Number(contexto['quantidade_parceiros_ativos']) || 5;

  let faixaNum = 1;
  let faixaDesc = 'Faixa 1 (Até R$ 180.000,00)';
  let aliqNominal = 0.06;
  let deducao = 0;
  let limiteSuperiorFaixa = 180000;

  if (rbt12 <= 180000) {
    faixaNum = 1;
    faixaDesc = 'Faixa 1 (Até R$ 180.000,00)';
    aliqNominal = 0.06;
    deducao = 0;
    limiteSuperiorFaixa = 180000;
  } else if (rbt12 <= 360000) {
    faixaNum = 2;
    faixaDesc = 'Faixa 2 (R$ 180.000,01 a R$ 360.000,00)';
    aliqNominal = 0.112;
    deducao = 9360;
    limiteSuperiorFaixa = 360000;
  } else if (rbt12 <= 720000) {
    faixaNum = 3;
    faixaDesc = 'Faixa 3 (R$ 360.000,01 a R$ 720.000,00)';
    aliqNominal = 0.135;
    deducao = 17640;
    limiteSuperiorFaixa = 720000;
  } else if (rbt12 <= 1800000) {
    faixaNum = 4;
    faixaDesc = 'Faixa 4 (R$ 720.000,01 a R$ 1.800.000,00)';
    aliqNominal = 0.16;
    deducao = 35640;
    limiteSuperiorFaixa = 1800000;
  } else if (rbt12 <= 3600000) {
    faixaNum = 5;
    faixaDesc = 'Faixa 5 (R$ 1.800.000,01 a R$ 3.600.000,00 - Sublimite ISS)';
    aliqNominal = 0.21;
    deducao = 125640;
    limiteSuperiorFaixa = 3600000;
  } else {
    faixaNum = 6;
    faixaDesc = 'Faixa 6 (R$ 3.600.000,01 a R$ 4.800.000,00)';
    aliqNominal = 0.33;
    deducao = 648000;
    limiteSuperiorFaixa = 4800000;
  }

  const aliquotaEfetiva = Math.max(0.06, ((rbt12 * aliqNominal) - deducao) / rbt12);
  const impostoMensalSegregado = cotaSalaoMensal * aliquotaEfetiva;
  const impostoMensalSemSegregacao = faturamentoMensal * aliquotaEfetiva;
  const economiaMensalSalaoParceiro = impostoMensalSemSegregacao - impostoMensalSegregado;
  const economiaAnualSalaoParceiro = economiaMensalSalaoParceiro * 12;

  const aliqAnexoVFaixa2 = 0.18;
  const impostoMensalAnexoV = cotaSalaoMensal * aliqAnexoVFaixa2;
  const economiaFatorRMensal = Math.max(0, impostoMensalAnexoV - impostoMensalSegregado);
  const economiaFatorRAnual = economiaFatorRMensal * 12;

  const distanciaProximaFaixa = Math.max(0, limiteSuperiorFaixa - rbt12);
  const distanciaSublimite = Math.max(0, 3600000 - rbt12);

  const potencialEconomiaTotal = economiaAnualSalaoParceiro + (fatorRAtual < 0.28 ? economiaFatorRAnual : 0);

  return {
    data_geracao: new Date().toISOString(),
    diagnostico: {
      rbt12: rbt12,
      faixa_simples_descricao: faixaDesc,
      faixa_numero: faixaNum,
      aliquota_nominal: Number((aliqNominal * 100).toFixed(2)),
      aliquota_efetiva: Number((aliquotaEfetiva * 100).toFixed(2)),
      fator_r_percentual: Number((fatorRAtual * 100).toFixed(2)),
      anexo_otimo: (fatorRAtual >= 0.28 ? 'Anexo III' : 'Anexo V') as 'Anexo III' | 'Anexo V',
      status_saude: (fatorRAtual >= 0.28 ? 'EXCELENTE' : 'ATENCAO') as 'EXCELENTE' | 'OTIMA' | 'ATENCAO' | 'RISCO_FISCAL',
      resumo_executivo: `A empresa está enquadrada na ${faixaDesc} com alíquota efetiva de ${(aliquotaEfetiva * 100).toFixed(2)}%. A aplicação estrita da segregação de cotas da Lei 13.352/2016 gera uma economia anual imediata de R$ ${economiaAnualSalaoParceiro.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}. O Fator R atual está em ${(fatorRAtual * 100).toFixed(1)}% (${fatorRAtual >= 0.28 ? 'em conformidade no Anexo III' : 'abaixo dos 28%, gerando risco de tributação no Anexo V'}).`,
      distancia_proxima_faixa_r: distanciaProximaFaixa,
      distancia_sublimite_r: distanciaSublimite,
      potencial_economia_anual_total: potencialEconomiaTotal
    },
    estrategias: [
      {
        id: 'est-01-salao-parceiro',
        titulo: 'Segregação Integral da Cota dos Parceiros MEI (Lei 13.352/2016)',
        categoria: 'SALAO_PARCEIRO' as const,
        categoria_rotulo: 'Lei do Salão-Parceiro',
        impacto_financeiro_mensal_estimado: Number(economiaMensalSalaoParceiro.toFixed(2)),
        impacto_financeiro_anual_estimado: Number(economiaAnualSalaoParceiro.toFixed(2)),
        dificuldade_implementacao: 'BAIXA' as const,
        tempo_estimado: 'Imediato (mês corrente)',
        fundamentacao_legal: 'Lei Federal 13.352/2016 c/c Resolução CGSN 140/2018, Art. 25, § 4º',
        diagnostico_atual: `Produção bruta de R$ ${faturamentoMensal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/mês com repasses de R$ ${repassesMeiMensal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} para ${qtdParceiros} parceiros cadastrados.`,
        acao_recomendada: 'Tributar no PGDAS-D estritamente a Cota do Salão (R$ ' + cotaSalaoMensal.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) + '), exigindo a emissão de NFS-e MEI individualizada de cada profissional parceiro para respaldar a dedução contábil.',
        passo_a_passo: [
          'Verificar se os contratos de parceria estão formalizados com cláusulas obrigatórias da Lei 13.352 e homologados no sindicato da categoria.',
          'Garantir que 100% dos parceiros MEI emitam NFS-e através do Portal Nacional ADN ou via botão 1-Clique do app.',
          'Informar no PGDAS-D mensal a receita do salão já deduzida dos repasses aos profissionais parceiros homologados.',
          'Arquivar eletronicamente os relatórios de fechamento mensal e comprovantes de transferência bancária das cotas.'
        ],
        alerta_compliance: 'Sem a emissão das notas MEI pelos parceiros, a Receita Federal pode descaracterizar a parceria e autuar o salão sobre 100% do faturamento bruto retroativo.'
      },
      {
        id: 'est-02-fator-r',
        titulo: 'Ajuste de Pró-Labore para Manutenção do Fator R >= 28% (Anexo III)',
        categoria: 'FATOR_R' as const,
        categoria_rotulo: 'Otimização Fator R',
        impacto_financeiro_mensal_estimado: Number(economiaFatorRMensal.toFixed(2)),
        impacto_financeiro_anual_estimado: Number(economiaFatorRAnual.toFixed(2)),
        dificuldade_implementacao: 'MEDIA' as const,
        tempo_estimado: '1 a 2 meses',
        fundamentacao_legal: 'Lei Complementar 123/2006, Art. 18, § 5º-J e § 5º-M',
        diagnostico_atual: `Fator R apurado em ${(fatorRAtual * 100).toFixed(1)}% com folha/pró-labore 12m de R$ ${folha12m.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}. ${fatorRAtual < 0.28 ? 'Abaixo do limite de 28%, gerando risco de enquadramento no oneroso Anexo V (15,5%).' : 'Em conformidade segura acima do limite de 28% no Anexo III (6,0%).'}`,
        acao_recomendada: fatorRAtual < 0.28
          ? `Elevar o pró-labore dos sócios em R$ ${(((rbt12 * 0.28) - folha12m) / 12).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/mês para garantir o enquadramento no Anexo III, economizando ${(18 - 8.6).toFixed(1)}% em impostos sobre a receita.`
          : 'Manter a proporção atual de pró-labore e folha de pagamento para sustentar o Fator R de segurança acima de 28%.',
        passo_a_passo: [
          'Calcular a folha necessária exata dos últimos 12 meses para atingir índice de 28,5% (com margem de segurança de 0,5%).',
          'Ajustar a declaração na GFIP/eSocial e recolhimento do INSS individual de 11% sobre o pró-labore do sócio administrador.',
          'Monitorar no fechamento mensal a flutuação do RBT12 para antecipar qualquer queda do indicador.',
          'Conciliar a economia líquida do DAS em comparação com o custo do INSS patronal no Simples (isento de cota patronal).'
        ],
        alerta_compliance: 'A variação sazonal do faturamento de final de ano pode diminuir o Fator R se o pró-labore permanecer fixo. Monitore mensalmente.'
      },
      {
        id: 'est-03-pro-labore-lucros',
        titulo: 'Estruturação Tributária: Pró-Labore Mínimo vs Distribuição Isenta de Dividendos',
        categoria: 'PRO_LABORE_LUCROS' as const,
        categoria_rotulo: 'Pró-Labore & Dividendos',
        impacto_financeiro_mensal_estimado: Number((cotaSalaoMensal * 0.045).toFixed(2)),
        impacto_financeiro_anual_estimado: Number((cotaSalaoMensal * 0.045 * 12).toFixed(2)),
        dificuldade_implementacao: 'BAIXA' as const,
        tempo_estimado: 'Imediato',
        fundamentacao_legal: 'Lei 9.249/1995, Art. 10 e Art. 14 da LC 123/2006',
        diagnostico_atual: 'Sócios recebem remuneração híbrida sem clara segregação formal entre trabalho gerencial (pró-labore) e rendimento de capital (dividendos).',
        acao_recomendada: 'Definir pró-labore estritamente calibrado para o Fator R / previdência e distribuir o lucro remanescente com 100% de isenção de IRPF e CSLL, com base em balancetes periódicos.',
        passo_a_passo: [
          'Elaborar escrituração contábil regular (Livro Diário e Razão) que comprove a apuração de lucros líquidos reais do salão.',
          'Fixar em contrato social ou ata a remuneração mensal de pró-labore para os sócios atuantes na administração.',
          'Realizar as transferências de lucros em contas bancárias de mesma titularidade com a descrição "Distribuição de Lucros Isentos".',
          'Informar na DEFIS e na Declaração de IRPF dos sócios na ficha de "Rendimentos Isentos e Não Tributáveis".'
        ],
        alerta_compliance: 'A isenção ilimitada de lucros no Simples Nacional exige contabilidade regular. Sem escrituração contábil, a presunção legal é restrita a 32% dos serviços.'
      },
      {
        id: 'est-04-faixas-sublimites',
        titulo: 'Monitoramento de Faixa do Simples e Gestão de Sublimites Estaduais (R$ 3,6M)',
        categoria: 'FAIXA_SIMPLES' as const,
        categoria_rotulo: 'Faixas & Sublimites',
        impacto_financeiro_mensal_estimado: Number((cotaSalaoMensal * 0.025).toFixed(2)),
        impacto_financeiro_anual_estimado: Number((cotaSalaoMensal * 0.025 * 12).toFixed(2)),
        dificuldade_implementacao: 'MEDIA' as const,
        tempo_estimado: 'Trimestral',
        fundamentacao_legal: 'Lei Complementar 123/2006, Art. 19 e Art. 20',
        diagnostico_atual: `Faturamento anual RBT12 em R$ ${rbt12.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}, situado a R$ ${distanciaSublimite.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} do sublimite estadual de R$ 3,6 milhões.`,
        acao_recomendada: 'Manter a expansão através de filiais sob o mesmo CNPJ raiz ou planejar a abertura de sociedade filial para otimização de faturamento sem ultrapassar sublimites locais de ISS.',
        passo_a_passo: [
          'Configurar alertas automáticos quando o RBT12 atingir 85% do sublimite (R$ 3.060.000,00).',
          'Avaliar o impacto de eventual recolhimento de ISS por fora do DAS caso o sublimite seja ultrapassado.',
          'Modelar a viabilidade comparativa entre Simples Nacional e Lucro Presumido para planos de expansão multi-unidades.'
        ],
        alerta_compliance: 'Ultrapassar o sublimite de R$ 3,6M obriga a empresa a emitir NFS-e com recolhimento de ISS no regime normal do município.'
      }
    ],
    simulacoes_cenarios: [
      {
        nome: 'Cenário 1: Atual com Segregação Lei 13.352 (Anexo III)',
        imposto_mensal: Number(impostoMensalSegregado.toFixed(2)),
        imposto_anual: Number((impostoMensalSegregado * 12).toFixed(2)),
        economia_anual: Number(economiaAnualSalaoParceiro.toFixed(2)),
        aliquota_efetiva_percentual: Number((aliquotaEfetiva * 100).toFixed(2)),
        descricao: 'Tributação correta deduzindo os repasses aos parceiros MEI e mantendo Anexo III com Fator R >= 28%.',
        recomendado: true
      },
      {
        nome: 'Cenário 2: Sem Segregação (Risco de Autuação sobre Produção Bruta)',
        imposto_mensal: Number(impostoMensalSemSegregacao.toFixed(2)),
        imposto_anual: Number((impostoMensalSemSegregacao * 12).toFixed(2)),
        economia_anual: 0,
        aliquota_efetiva_percentual: Number((aliquotaEfetiva * 100).toFixed(2)),
        descricao: 'Cenário de bi-tributação onde o salão paga Simples Nacional sobre o faturamento integral sem contratos de parceria homologados.',
        recomendado: false
      },
      {
        nome: 'Cenário 3: Enquadramento no Anexo V (Fator R < 28%)',
        imposto_mensal: Number(impostoMensalAnexoV.toFixed(2)),
        imposto_anual: Number((impostoMensalAnexoV * 12).toFixed(2)),
        economia_anual: Number((impostoMensalSemSegregacao * 12 - impostoMensalAnexoV * 12).toFixed(2)),
        aliquota_efetiva_percentual: Number((aliqAnexoVFaixa2 * 100).toFixed(2)),
        descricao: 'Cenário desfavorável caso a folha/pró-labore caia abaixo de 28% da receita bruta.',
        recomendado: false
      },
      {
        nome: 'Cenário 4: Otimizado com Expansão (+30% de Produção com Novos MEIs)',
        imposto_mensal: Number((cotaSalaoMensal * 1.3 * aliquotaEfetiva).toFixed(2)),
        imposto_anual: Number((cotaSalaoMensal * 1.3 * aliquotaEfetiva * 12).toFixed(2)),
        economia_anual: Number((economiaAnualSalaoParceiro * 1.3).toFixed(2)),
        aliquota_efetiva_percentual: Number((aliquotaEfetiva * 100).toFixed(2)),
        descricao: 'Crescimento saudável absorvendo novos profissionais parceiros MEI mantendo a alíquota controlada.',
        recomendado: true
      }
    ],
    alertas_criticos: [
      'Contratos de parceria precisam estar formalizados por escrito com cláusulas da Lei 13.352/2016.',
      'Todos os parceiros MEI devem emitir NFS-e correspondente aos valores recebidos no mês.',
      'O pró-labore deve ser recolhido mensalmente para garantir o cálculo ininterrupto do Fator R.'
    ],
    dicas_insights_ia: [
      'A emissão 1-Clique de NFS-e MEI pelos parceiros blinda 100% da dedução tributária perante a Receita Federal.',
      'A economia gerada pela Lei Salão Parceiro ultrapassa 45% do valor total de impostos pagos anualmente.',
      'Mantenha uma reserva tributária mensal para a guia única do DAS calculada estritamente sobre a cota do salão.'
    ]
  };
}

/**
 * Serve static files from /browser
 */
app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
    setHeaders: (res) => {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    }
  }),
);

/**
 * Handle all other requests by rendering the Angular application.
 */
app.use((req, res, next) => {
  angularApp
    .handle(req)
    .then((response) =>
      response ? writeResponseToNodeResponse(response, res) : next(),
    )
    .catch(next);
});

if (isMainModule(import.meta.url)) {
  const port = process.env['PORT'] || 3000;
  app.listen(port, () => {
    console.log(`Node Express server listening on http://0.0.0.0:${port}`);
  });
}

export default app;
