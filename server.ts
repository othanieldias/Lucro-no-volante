import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

function resolvePort(): number {
  const portIdx = process.argv.indexOf('--port');
  if (portIdx !== -1 && process.argv[portIdx + 1]) {
    return Number(process.argv[portIdx + 1]);
  }
  for (const arg of process.argv) {
    if (arg.startsWith('--port=')) {
      return Number(arg.split('=')[1]);
    }
  }
  // No ambiente de desenvolvimento do AI Studio, o dev server deve escutar na porta 3000
  if (process.env.NODE_ENV !== 'production') {
    return 3000;
  }
  return Number(process.env.PORT) || 3000;
}

const PORT = resolvePort();

app.use(express.json());

// Endpoint do Assistente de IA para Motoristas
app.post('/api/assistant', async (req, res) => {
  try {
    const { prompt, context } = req.body;

    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'O prompt é obrigatório.' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(503).json({
        error: 'Chave GEMINI_API_KEY não configurada no ambiente do servidor.',
        configured: false,
      });
    }

    // Inicializa SDK oficial do Google GenAI com User-Agent recomendado
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const systemInstruction = `
Você é o Assistente Inteligente do aplicativo financeiro "Lucro no Volante", especializado em finanças para motoristas de aplicativo (Uber, 99 e particulares) no Brasil.

Seu tom é profissional, direto, encorajador e baseado estritamente na realidade matemática dos números.
Regras fundamentais:
1. Nunca invente dados que não existam no contexto recebido.
2. Seja transparente: diferencie claramente fatos registrados (dados reais informados), estimativas (como consumo teórico em km/l) e recomendações.
3. Quando houver poucos turnos ou horas não informadas, aponte a limitação com gentileza e oriente o preenchimento.
4. Nunca prometa ganhos garantidos ou irreais.
5. Responda em Português do Brasil com valores formatados em Reais (R$) e medidas em quilômetros (km).
6. Priorize respostas concisas e com sugestões práticas e acionáveis.
`;

    const userContent = `
Dados do Motorista e Histórico Financeiro:
${JSON.stringify(context, null, 2)}

Pergunta do Motorista:
${prompt}
`;

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Tempo limite excedido na resposta da IA')), 5000)
    );

    const generatePromise = ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `${systemInstruction}\n\n${userContent}`,
    });

    const response = (await Promise.race([generatePromise, timeoutPromise])) as any;

    const reply = response.text || 'Não consegui formular uma resposta no momento.';
    return res.json({ reply, configured: true });
  } catch (error: any) {
    console.warn('Assistente IA:', error?.message);
    return res.status(500).json({
      error: 'Falha ao processar solicitação com o modelo de IA.',
      details: error?.message,
    });
  }
});

// Inicialização do servidor com suporte a Vite em desenvolvimento e static em produção
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Lucro no Volante 3.0 server rodando na porta ${PORT}`);
  });
}

startServer();
