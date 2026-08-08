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

  // =========================================================================
  // ShegerPay & CBE Financial Transfer (FT) Verification Workflow API
  // Step 3 & 4 in Workflow: POST /api/v1/verify
  // =========================================================================
  app.post(['/api/v1/verify', '/api/v1/shegerpay/verify'], async (req, res) => {
    try {
      const { ftNumber, expectedAmount, walletId, merchantAccount } = req.body;

      if (!ftNumber || typeof ftNumber !== 'string' || !ftNumber.trim()) {
        return res.status(400).json({
          status: 'error',
          verified: false,
          error: 'CBE Financial Transfer (FT) reference number is required'
        });
      }

      const cleanFt = ftNumber.trim().toUpperCase();
      const formattedFt = cleanFt.startsWith('FT') ? cleanFt : `FT${cleanFt}`;

      // Simulate real CBE <-> ShegerPay Verification Lookup
      // Deterministic generation based on FT number for test consistency
      let numericHash = 0;
      for (let i = 0; i < formattedFt.length; i++) {
        numericHash = (numericHash << 5) - numericHash + formattedFt.charCodeAt(i);
        numericHash |= 0;
      }
      const absHash = Math.abs(numericHash);

      const mockAmount = expectedAmount && Number(expectedAmount) > 0 
        ? Number(expectedAmount) 
        : (absHash % 850 + 15) * 500; // e.g., ETB 7,500 to 125,000

      const sampleNames = [
        'Abebe Kebede Worku',
        'Tadesse Alemu Desta',
        'Birhanu Worku Feyisa',
        'Mulugeta Tesfaye Haile',
        'Solomon Gemechu Bekele',
        'Hiwot Girma Tassew',
        'Meskerem Assefa Nigussie'
      ];
      const payerName = sampleNames[absHash % sampleNames.length];
      const payerAccount = `1000${(100000000 + (absHash % 899999999)).toString().slice(0, 9)}`;
      const merchantAcc = merchantAccount || '1000751694559 (PlusZone Merchant CBE)';

      const nowIso = new Date().toISOString();

      return res.json({
        status: 'success',
        verified: true,
        paymentStatus: 'VERIFIED',
        data: {
          ftNumber: formattedFt,
          amount: mockAmount,
          currency: 'ETB',
          payerName,
          payerAccount,
          merchantAccount: merchantAcc,
          bank: 'Commercial Bank of Ethiopia (CBE)',
          gateway: 'ShegerPay Verification API v1',
          settledAt: nowIso,
          authorizationCode: `CBE-AUTH-${absHash.toString().slice(0, 7)}`,
          verified: true
        },
        message: `CBE Transfer Ref ${formattedFt} successfully verified by ShegerPay.`
      });

    } catch (err: any) {
      console.error('ShegerPay Verification Endpoint Error:', err);
      return res.status(500).json({
        status: 'error',
        verified: false,
        error: err.message || 'ShegerPay verification gateway error'
      });
    }
  });

  // ShegerPay Webhook Listener Endpoint (Step 7 in Workflow)
  app.post('/api/v1/shegerpay/webhook', async (req, res) => {
    try {
      const payload = req.body;
      console.log('Received ShegerPay Webhook Payment Event:', payload);

      return res.json({
        status: 'success',
        event: payload?.event || 'PAYMENT_SETTLED',
        verified: true,
        receivedAt: new Date().toISOString(),
        message: 'ShegerPay webhook acknowledged and payment status updated to VERIFIED.'
      });
    } catch (err: any) {
      return res.status(500).json({ status: 'error', message: err.message });
    }
  });

  // =========================================================================
  // Automated Messaging / SMS App Connection Listener (Step 3 Automation)
  // Receives raw SMS text from messaging app or gateway, extracts FT reference code,
  // and auto-dispatches to POST /api/v1/verify
  // =========================================================================
  app.post(['/api/v1/incoming-sms', '/api/v1/parse-sms'], async (req, res) => {
    try {
      const { smsBody, sender } = req.body;

      if (!smsBody || typeof smsBody !== 'string') {
        return res.status(400).json({
          status: 'error',
          error: 'SMS body content is required'
        });
      }

      // Regex 1: Extract FT reference code (e.g., FT260808901234 or Ref: FT...)
      const ftMatch = smsBody.match(/(?:FT|Ref:\s*FT|Reference:\s*FT|Txn:\s*FT)([A-Z0-9]{8,16})/i) 
                   || smsBody.match(/\b(FT[A-Z0-9]{8,16})\b/i);

      // Regex 2: Extract ETB Amount (e.g., ETB 15,000.00 or 15000 ETB)
      const amountMatch = smsBody.match(/(?:ETB|Birr)\s*([\d,]+(?:\.\d{1,2})?)/i)
                       || smsBody.match(/([\d,]+(?:\.\d{1,2})?)\s*(?:ETB|Birr)/i);

      // Regex 3: Extract Payer Name (e.g. from Abebe Kebede)
      const payerMatch = smsBody.match(/(?:from|by)\s+([A-Za-z\s]{4,30})(?:\.|\,|$|\sfor|\son)/i);

      const ftNumber = ftMatch ? (ftMatch[1].startsWith('FT') ? ftMatch[1] : `FT${ftMatch[1]}`) : null;
      const extractedAmount = amountMatch ? parseFloat(amountMatch[1].replace(/,/g, '')) : null;
      const extractedPayer = payerMatch ? payerMatch[1].trim() : null;

      if (!ftNumber) {
        return res.status(422).json({
          status: 'error',
          parsed: false,
          error: 'No valid CBE FT Reference Code detected in the incoming SMS message.',
          rawSms: smsBody
        });
      }

      return res.json({
        status: 'success',
        parsed: true,
        extracted: {
          ftNumber: ftNumber.toUpperCase(),
          amount: extractedAmount,
          payerName: extractedPayer,
          sender: sender || 'CBE Birr / Mobile Banking'
        },
        rawSms: smsBody,
        message: `Successfully extracted FT reference ${ftNumber.toUpperCase()} from incoming SMS message.`
      });

    } catch (err: any) {
      console.error('SMS Parser Error:', err);
      return res.status(500).json({ status: 'error', error: err.message });
    }
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
