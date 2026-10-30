import { GoogleGenAI } from '@google/genai';

export const handler = async (event: any) => {
  // Apenas aceita POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Método não permitido. Use POST.' }),
    };
  }

  try {
    const { prompt, context } = JSON.parse(event.body || '{}');

    if (!prompt) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'O prompt é obrigatório.' }),
      };
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return {
        statusCode: 503,
        body: JSON.stringify({
          error: 'Chave GEMINI_API_KEY não configurada no Netlify.',
          configured: false,
        }),
      };
    }

    const ai = new GoogleGenAI();

    const systemInstruction = `
Você é o Assistente Inteligente do aplicativo financeiro "Lucro no Volante", especializado em finanças para motoristas de aplicativo (Uber, 99 e particulares) no Brasil.
Seu tom é profissional, encorajador e baseado estritamente na realidade dos números.
1. Nunca invente dados que não existam no contexto recebido.
2. Seja transparente: diferencie fatos registrados, estimativas de consumo e recomendações.
3. Responda em Português do Brasil com valores em R$ e distâncias em km.
`;

    const userContent = `
Dados do Motorista e Histórico Financeiro:
${JSON.stringify(context, null, 2)}

Pergunta do Motorista:
${prompt}
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: [
        {
          role: 'user',
          parts: [{ text: `${systemInstruction}\n\n${userContent}` }],
        },
      ],
    });

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        reply: response.text || 'Sem resposta disponível.',
        configured: true,
      }),
    };
  } catch (error: any) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Erro ao processar com o modelo de IA no Netlify.',
        details: error?.message,
      }),
    };
  }
};
