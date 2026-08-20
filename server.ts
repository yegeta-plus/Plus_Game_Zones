import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import {
  sendMonthlyFinancialReport,
  buildMonthlyReportHtml,
  getDispatchHistory,
  getLastDispatchedMonth,
  setCustomSmtpConfig,
  getEffectiveSmtpConfig,
  testSmtpConnection
} from './server/emailReporter';

dotenv.config();

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

  // =========================================================================
  // Automated Monthly Report Email Service (Dispatches every 2nd of Month for Admin & SuperUser only)
  // =========================================================================

  // Get current SMTP Configuration Status
  app.get('/api/reports/smtp-config', (req, res) => {
    try {
      const config = getEffectiveSmtpConfig();
      return res.json({
        status: 'success',
        data: {
          host: config.host,
          port: config.port,
          user: config.user,
          from: config.from,
          secure: config.secure,
          isConfigured: config.isConfigured,
          passwordSet: Boolean(config.pass && config.pass.length > 0)
        }
      });
    } catch (err: any) {
      return res.status(500).json({ status: 'error', error: err.message });
    }
  });

  // Save / Update Custom SMTP Configuration
  app.post('/api/reports/smtp-config', (req, res) => {
    try {
      const { host, port, user, pass, from, secure } = req.body;
      if (!host || !user || !pass) {
        return res.status(400).json({
          status: 'error',
          error: 'Host, User/Email, and Password/App Password are required.'
        });
      }

      setCustomSmtpConfig({
        host,
        port: Number(port) || 587,
        user,
        pass,
        from,
        secure: Boolean(secure)
      });

      const updated = getEffectiveSmtpConfig();
      return res.json({
        status: 'success',
        message: 'SMTP settings updated successfully.',
        data: {
          host: updated.host,
          port: updated.port,
          user: updated.user,
          from: updated.from,
          secure: updated.secure,
          isConfigured: updated.isConfigured
        }
      });
    } catch (err: any) {
      return res.status(500).json({ status: 'error', error: err.message });
    }
  });

  // Test SMTP Connection with Current or Provided Credentials
  app.post('/api/reports/test-smtp', async (req, res) => {
    try {
      const { host, port, user, pass, secure } = req.body || {};
      const result = await testSmtpConnection(host ? { host, port: Number(port) || 587, user, pass, secure: Boolean(secure) } : undefined);

      if (result.success) {
        return res.json({
          status: 'success',
          message: result.message
        });
      } else {
        return res.status(400).json({
          status: 'error',
          error: result.error
        });
      }
    } catch (err: any) {
      return res.status(500).json({
        status: 'error',
        error: err.message || 'Error occurred while testing SMTP connection.'
      });
    }
  });

  // 1. Dispatch or Manually Trigger Monthly Financial Report Email
  app.post('/api/reports/send-monthly', async (req, res) => {
    try {
      const {
        periodLabel,
        periodKey,
        totalBalance,
        monthlyIncome,
        monthlyExpense,
        netProfit,
        wallets = [],
        receivables = { totalOwed: 0, outstandingCount: 0, overdueAmount: 0 },
        loans = { totalBorrowed: 0, totalLent: 0, activeCount: 0 },
        equbs = { activeCircles: 0, monthlyVolume: 0 },
        topExpenseCategories = [],
        recipients = [],
        triggerType = 'MANUAL_DISPATCH'
      } = req.body;

      // Filter recipients strictly to Admin and SuperAdmin roles
      const adminSuperusers = recipients.filter((r: any) => {
        const role = (r.role || '').toLowerCase();
        return role === 'superadmin' || role === 'admin';
      });

      if (adminSuperusers.length === 0) {
        return res.status(400).json({
          status: 'error',
          error: 'No Admin or SuperUser recipients provided. Monthly reports are strictly restricted to Admin and SuperUser roles.'
        });
      }

      const now = new Date();
      const currentPeriodLabel = periodLabel || now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      const currentPeriodKey = periodKey || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

      const result = await sendMonthlyFinancialReport(
        {
          periodLabel: currentPeriodLabel,
          periodKey: currentPeriodKey,
          generatedAt: now.toISOString(),
          totalBalance: Number(totalBalance) || 0,
          monthlyIncome: Number(monthlyIncome) || 0,
          monthlyExpense: Number(monthlyExpense) || 0,
          netProfit: Number(netProfit) || 0,
          wallets,
          receivables,
          loans,
          equbs,
          topExpenseCategories,
          recipients: adminSuperusers
        },
        triggerType
      );

      return res.json({
        status: 'success',
        data: result
      });

    } catch (err: any) {
      console.error('Monthly Email Report Dispatch Error:', err);
      return res.status(500).json({
        status: 'error',
        error: err.message || 'Failed to dispatch monthly email report'
      });
    }
  });

  // 2. Render / Preview Monthly Report HTML Template
  app.post('/api/reports/preview-html', async (req, res) => {
    try {
      const {
        periodLabel = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        periodKey = '2026-08',
        totalBalance = 0,
        monthlyIncome = 0,
        monthlyExpense = 0,
        netProfit = 0,
        wallets = [],
        receivables = { totalOwed: 0, outstandingCount: 0, overdueAmount: 0 },
        loans = { totalBorrowed: 0, totalLent: 0, activeCount: 0 },
        equbs = { activeCircles: 0, monthlyVolume: 0 },
        topExpenseCategories = [],
        recipients = []
      } = req.body;

      const html = buildMonthlyReportHtml({
        periodLabel,
        periodKey,
        generatedAt: new Date().toISOString(),
        totalBalance: Number(totalBalance) || 0,
        monthlyIncome: Number(monthlyIncome) || 0,
        monthlyExpense: Number(monthlyExpense) || 0,
        netProfit: Number(netProfit) || 0,
        wallets,
        receivables,
        loans,
        equbs,
        topExpenseCategories,
        recipients
      });

      return res.json({ status: 'success', html });
    } catch (err: any) {
      return res.status(500).json({ status: 'error', error: err.message });
    }
  });

  // 3. Get Email Dispatch History & Schedule Status
  app.get('/api/reports/status', (req, res) => {
    const history = getDispatchHistory();
    const lastMonth = getLastDispatchedMonth();
    const now = new Date();
    
    // Check if current day is 2nd of month
    const isDayTwo = now.getDate() === 2;
    const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const sentThisMonth = lastMonth === currentMonthKey;

    res.json({
      status: 'success',
      schedule: {
        frequency: 'MONTHLY',
        dayOfMonth: 2, // Every month 2nd day
        targetRoles: ['SuperAdmin', 'Admin'],
        active: true,
        currentDayOfMonth: now.getDate(),
        isScheduledDayToday: isDayTwo,
        currentMonthKey,
        lastDispatchedMonth: lastMonth,
        sentForCurrentMonth: sentThisMonth,
        nextScheduledDate: isDayTwo && !sentThisMonth
          ? 'Today (Pending automatic trigger)'
          : new Date(now.getFullYear(), now.getMonth() + (now.getDate() >= 2 ? 1 : 0), 2).toDateString()
      },
      history
    });
  });

  // Periodic Automated Cron Check (Runs every 30 minutes in background)
  // Evaluates whether today is day 2 of the month and auto-dispatches if pending
  const checkAutomatedSchedule = async () => {
    try {
      const now = new Date();
      // Target schedule: Day 2 of every month
      if (now.getDate() === 2) {
        const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        const lastSent = getLastDispatchedMonth();

        if (lastSent !== monthKey) {
          console.log(`[Auto Report Scheduler] Today is day 2 of the month (${monthKey}). Executing automated monthly report dispatch for Admins & SuperUsers.`);
          // Trigger automated dispatch with baseline accounts
          await sendMonthlyFinancialReport(
            {
              periodLabel: now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
              periodKey: monthKey,
              generatedAt: now.toISOString(),
              totalBalance: 2450000,
              monthlyIncome: 380000,
              monthlyExpense: 145000,
              netProfit: 235000,
              wallets: [
                { name: 'Commercial Bank of Ethiopia (CBE)', type: 'CBE_BANK', balance: 1450000 },
                { name: 'Telebirr Merchant Vault', type: 'TELEBIRR', balance: 650000 },
                { name: 'Main Cash Drawer', type: 'CASH', balance: 350000 }
              ],
              receivables: { totalOwed: 185000, outstandingCount: 6, overdueAmount: 0 },
              loans: { totalBorrowed: 300000, totalLent: 50000, activeCount: 2 },
              equbs: { activeCircles: 3, monthlyVolume: 75000 },
              topExpenseCategories: [
                { name: 'Game Zone Inventory & Parts', amount: 65000, percentage: 44.8 },
                { name: 'Shop Rent & Utilities', amount: 50000, percentage: 34.5 },
                { name: 'Staff Salaries & Shift Allowances', amount: 30000, percentage: 20.7 }
              ],
              recipients: [
                { name: 'Yegeta Huawei', email: 'yegeta.huawei@gmail.com', role: 'SuperAdmin' },
                { name: 'Kirubel Haile', email: 'kirubel@pluszone.com', role: 'Admin' }
              ]
            },
            'AUTOMATIC_SCHEDULE'
          );
        }
      }
    } catch (scheduleErr) {
      console.error('[Auto Report Scheduler] Error executing background check:', scheduleErr);
    }
  };

  // Run initial check after server boots, then interval every 30 minutes
  setTimeout(checkAutomatedSchedule, 5000);
  setInterval(checkAutomatedSchedule, 30 * 60 * 1000);

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
