import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Health endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', service: 'PlusZone Finance ERP Server' });
  });

  // Gemini AI Assistant Endpoint
  app.post('/api/ai-assistant', async (req, res) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      const { message, ledgerSummary, history } = req.body;

      if (!message) {
        return res.status(400).json({ error: 'Message prompt is required' });
      }

      if (!apiKey) {
        // Fallback intelligent response if no API key is provided
        return res.json({
          reply: `[Offline AI Mode] Based on your current PlusZone Ethiopian ERP ledger summary:\n` +
                 `• Business Balance: ${ledgerSummary?.totalBalance || 'ETB 0'}\n` +
                 `• Cashflow Health: ${ledgerSummary?.healthScore || '92% (Optimal)'}\n` +
                 `• Key Advice: Ensure Telebirr and CBE merchant transfers match daily z-reports. Equb contributions are on schedule.`
        });
      }

      const ai = new GoogleGenAI({ apiKey });
      const promptText = `
You are the AI Finance Assistant for "PlusZone Finance ERP", a mobile-first Ethiopian partner-owned fintech ERP.
You assist Ethiopian partner-owners with business finance, Telebirr/CBE transactions, Equb savings circles, cashflow forecasting, tax guidance, and expense management.

Current Business Ledger Snapshot:
- Total Balance: ${ledgerSummary?.totalBalance || 'Unknown'}
- Monthly Income: ${ledgerSummary?.monthlyIncome || 'Unknown'}
- Monthly Expense: ${ledgerSummary?.monthlyExpense || 'Unknown'}
- Net Profit: ${ledgerSummary?.monthlyProfit || 'Unknown'}
- Active Equbs: ${ledgerSummary?.activeEqubs || '0'}
- Active Loans: ${ledgerSummary?.activeLoans || '0'}
- Health Score: ${ledgerSummary?.healthScore || '90%'}

User Prompt: "${message}"

Give a concise, highly professional, actionable response. Format with clear bullet points where appropriate. Mention Ethiopian business concepts (ETB, Telebirr, CBE, Equb) if relevant.
`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: promptText,
      });

      const reply = response.text || 'Unable to generate response.';
      return res.json({ reply });

    } catch (err: any) {
      console.error('AI Assistant Error:', err);
      return res.status(500).json({ error: err.message || 'Failed to communicate with AI Assistant' });
    }
  });

  // Vite middleware or production static build
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`PlusZone ERP Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
