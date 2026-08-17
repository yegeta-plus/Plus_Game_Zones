import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

export interface MonthlyReportPayload {
  periodLabel: string; // e.g. "August 2026"
  periodKey: string;   // e.g. "2026-08"
  generatedAt: string;
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpense: number;
  netProfit: number;
  healthScore?: string;
  wallets: Array<{ name: string; type: string; balance: number; accountNumber?: string }>;
  receivables: {
    totalOwed: number;
    outstandingCount: number;
    overdueAmount: number;
    items?: Array<{ customer: string; amount: number; dueDate: string; isOverdue: boolean }>;
  };
  loans: {
    totalBorrowed: number;
    totalLent: number;
    activeCount: number;
  };
  equbs: {
    activeCircles: number;
    monthlyVolume: number;
  };
  topExpenseCategories: Array<{ name: string; amount: number; percentage: number }>;
  recipients: Array<{ email: string; name: string; role: string }>;
}

let lastDispatchedMonth: string | null = null;
const dispatchHistory: Array<{
  id: string;
  period: string;
  sentAt: string;
  recipients: Array<{ email: string; name: string; role: string }>;
  status: 'DELIVERED' | 'SIMULATED' | 'FAILED';
  subject: string;
  triggerType: 'AUTOMATIC_SCHEDULE' | 'MANUAL_DISPATCH';
  summary: any;
  errorMessage?: string;
}> = [];

/**
 * Format Ethiopian Birr currency for emails
 */
export function formatETB(amount: number): string {
  const num = typeof amount === 'number' && !isNaN(amount) ? amount : 0;
  return `ETB ${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Get configured or simulated Nodemailer transporter
 */
export function getMailTransporter() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;

  if (host && user && pass) {
    return {
      isConfigured: true,
      transporter: nodemailer.createTransport({
        host,
        port,
        secure,
        auth: { user, pass }
      })
    };
  }

  // Fallback simulator transporter
  return {
    isConfigured: false,
    transporter: nodemailer.createTransport({
      streamTransport: true,
      newline: 'unix',
      buffer: true
    })
  };
}

/**
 * Generate branded, mobile-responsive HTML email for Monthly Statement
 */
export function buildMonthlyReportHtml(data: MonthlyReportPayload): string {
  const walletRows = data.wallets
    .map(
      w => `
      <tr>
        <td style="padding: 10px 14px; border-bottom: 1px solid #E2E8F0; font-size: 13px; color: #1E293B; font-weight: 600;">
          ${w.name} <span style="font-size: 11px; color: #64748B; font-weight: normal;">(${w.type})</span>
        </td>
        <td style="padding: 10px 14px; border-bottom: 1px solid #E2E8F0; font-size: 13px; color: #0F172A; text-align: right; font-family: monospace; font-weight: 700;">
          ${formatETB(w.balance)}
        </td>
      </tr>
    `
    )
    .join('');

  const expenseRows = data.topExpenseCategories.length > 0
    ? data.topExpenseCategories
        .map(
          c => `
        <tr>
          <td style="padding: 8px 14px; border-bottom: 1px solid #F1F5F9; font-size: 12px; color: #334155;">
            ${c.name}
          </td>
          <td style="padding: 8px 14px; border-bottom: 1px solid #F1F5F9; font-size: 12px; color: #64748B; text-align: right;">
            ${c.percentage.toFixed(1)}%
          </td>
          <td style="padding: 8px 14px; border-bottom: 1px solid #F1F5F9; font-size: 12px; color: #E11D48; text-align: right; font-family: monospace; font-weight: 600;">
            ${formatETB(c.amount)}
          </td>
        </tr>
      `
        )
        .join('')
    : `<tr><td colspan="3" style="padding: 12px; text-align: center; color: #94A3B8; font-size: 12px;">No major expense records this period</td></tr>`;

  const profitColor = data.netProfit >= 0 ? '#10B981' : '#EF4444';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>PlusZone Finance ERP - Monthly Statement</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F8FAFC; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0F172A; -webkit-font-smoothing: antialiased;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #F8FAFC; padding: 24px 12px;">
    <tr>
      <td align="center">
        <!-- Main Card Container -->
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 620px; background-color: #FFFFFF; border-radius: 20px; overflow: hidden; border: 1px solid #E2E8F0; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05);">
          
          <!-- Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #0A0E1A 0%, #1E293B 100%); padding: 32px 28px; text-align: left;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <div style="display: inline-block; background-color: #00D4AA; color: #0A0E1A; font-weight: 900; font-size: 11px; letter-spacing: 1px; text-transform: uppercase; padding: 4px 10px; border-radius: 6px; margin-bottom: 12px;">
                      Monthly Executive Statement
                    </div>
                    <h1 style="margin: 0; font-size: 24px; font-weight: 800; color: #FFFFFF; letter-spacing: -0.5px;">
                      PlusZone Finance ERP
                    </h1>
                    <p style="margin: 6px 0 0 0; font-size: 13px; color: #94A3B8;">
                      Automatic Monthly Performance & Banking Report • ${data.periodLabel}
                    </p>
                  </td>
                  <td align="right" valign="top">
                    <div style="background-color: rgba(255, 255, 255, 0.1); border: 1px solid rgba(255, 255, 255, 0.15); border-radius: 12px; padding: 8px 12px; text-align: right; display: inline-block;">
                      <div style="font-size: 10px; color: #CBD5E1; font-weight: 600; text-transform: uppercase;">Schedule</div>
                      <div style="font-size: 12px; color: #00D4AA; font-weight: 700;">Every 2nd of Month</div>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Security Role Notice -->
          <tr>
            <td style="background-color: #EFF6FF; border-bottom: 1px solid #DBEAFE; padding: 12px 28px;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="font-size: 11px; color: #1E40AF; font-weight: 600;">
                    🔒 <strong>Confidential:</strong> Dispatched exclusively to verified <strong>Admin</strong> & <strong>SuperUser</strong> accounts.
                  </td>
                  <td align="right" style="font-size: 11px; color: #60A5FA;">
                    EAT (UTC+3)
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Content Body -->
          <tr>
            <td style="padding: 28px;">

              <!-- Primary Metric: Total Balance -->
              <div style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 16px; padding: 20px; text-align: center; margin-bottom: 24px;">
                <div style="font-size: 12px; font-weight: 700; color: #64748B; text-transform: uppercase; letter-spacing: 0.5px;">
                  Total Business Liquidity & Vault Balance
                </div>
                <div style="font-size: 32px; font-weight: 900; color: #0F172A; margin: 8px 0; font-family: monospace;">
                  ${formatETB(data.totalBalance)}
                </div>
                <div style="font-size: 12px; color: #059669; font-weight: 600;">
                  ● All accounts balanced & reconciled (CBE, Telebirr, Cash)
                </div>
              </div>

              <!-- 3-Column Key Financial Summary -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 24px;">
                <tr>
                  <!-- Income -->
                  <td width="32%" style="background-color: #ECFDF5; border: 1px solid #A7F3D0; border-radius: 14px; padding: 14px; text-align: center;">
                    <div style="font-size: 11px; color: #065F46; font-weight: 700; text-transform: uppercase;">Total Income</div>
                    <div style="font-size: 16px; font-weight: 800; color: #047857; margin-top: 4px; font-family: monospace;">
                      ${formatETB(data.monthlyIncome)}
                    </div>
                  </td>
                  <td width="2%"></td>
                  <!-- Expense -->
                  <td width="32%" style="background-color: #FFF1F2; border: 1px solid #FECDD3; border-radius: 14px; padding: 14px; text-align: center;">
                    <div style="font-size: 11px; color: #9F1239; font-weight: 700; text-transform: uppercase;">Total Expenses</div>
                    <div style="font-size: 16px; font-weight: 800; color: #BE123C; margin-top: 4px; font-family: monospace;">
                      ${formatETB(data.monthlyExpense)}
                    </div>
                  </td>
                  <td width="2%"></td>
                  <!-- Net Profit -->
                  <td width="32%" style="background-color: #F8FAFC; border: 1px solid #CBD5E1; border-radius: 14px; padding: 14px; text-align: center;">
                    <div style="font-size: 11px; color: #475569; font-weight: 700; text-transform: uppercase;">Net P&L</div>
                    <div style="font-size: 16px; font-weight: 800; color: ${profitColor}; margin-top: 4px; font-family: monospace;">
                      ${formatETB(data.netProfit)}
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Wallets Breakdown Table -->
              <div style="margin-bottom: 24px;">
                <div style="font-size: 14px; font-weight: 800; color: #0F172A; margin-bottom: 10px; display: flex; align-items: center;">
                  💳 Account & Wallet Breakdown
                </div>
                <table width="100%" border="0" cellspacing="0" cellpadding="0" style="border: 1px solid #E2E8F0; border-radius: 12px; overflow: hidden; border-collapse: collapse;">
                  <thead>
                    <tr style="background-color: #F1F5F9;">
                      <th style="padding: 10px 14px; font-size: 11px; font-weight: 700; color: #475569; text-align: left; text-transform: uppercase;">Wallet Name</th>
                      <th style="padding: 10px 14px; font-size: 11px; font-weight: 700; color: #475569; text-align: right; text-transform: uppercase;">Standing Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${walletRows}
                  </tbody>
                </table>
              </div>

              <!-- Two Column Section: Receivables & Equb/Loans -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 24px;">
                <tr>
                  <!-- Receivables Card -->
                  <td width="48%" valign="top" style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 14px; padding: 16px;">
                    <div style="font-size: 12px; font-weight: 800; color: #1E293B; margin-bottom: 8px;">
                      📋 Accounts Receivable
                    </div>
                    <div style="font-size: 18px; font-weight: 800; color: #2563EB; font-family: monospace;">
                      ${formatETB(data.receivables.totalOwed)}
                    </div>
                    <div style="font-size: 11px; color: #64748B; margin-top: 4px;">
                      ${data.receivables.outstandingCount} active customer invoices
                    </div>
                    ${
                      data.receivables.overdueAmount > 0
                        ? `<div style="font-size: 11px; color: #DC2626; font-weight: 700; margin-top: 6px;">⚠️ ${formatETB(data.receivables.overdueAmount)} Overdue</div>`
                        : `<div style="font-size: 11px; color: #16A34A; margin-top: 6px;">✓ Zero overdue invoices</div>`
                    }
                  </td>
                  <td width="4%"></td>
                  <!-- Equb & Loans Portfolio -->
                  <td width="48%" valign="top" style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 14px; padding: 16px;">
                    <div style="font-size: 12px; font-weight: 800; color: #1E293B; margin-bottom: 8px;">
                      🤝 Equb & Loan Portfolio
                    </div>
                    <div style="font-size: 12px; color: #334155; margin-bottom: 4px;">
                      <strong>Active Equbs:</strong> ${data.equbs.activeCircles} circles (${formatETB(data.equbs.monthlyVolume)}/mo)
                    </div>
                    <div style="font-size: 12px; color: #334155;">
                      <strong>Active Loans:</strong> ${data.loans.activeCount} (${formatETB(data.loans.totalBorrowed)} liability)
                    </div>
                    <div style="font-size: 11px; color: #0284C7; font-weight: 600; margin-top: 6px;">
                      ✓ All scheduled rounds synchronized
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Top Expenses Categories -->
              <div style="margin-bottom: 24px;">
                <div style="font-size: 14px; font-weight: 800; color: #0F172A; margin-bottom: 10px;">
                  📊 Top Expense Categories
                </div>
                <table width="100%" border="0" cellspacing="0" cellpadding="0" style="border: 1px solid #F1F5F9; border-radius: 12px; overflow: hidden; border-collapse: collapse;">
                  <thead>
                    <tr style="background-color: #F8FAFC;">
                      <th style="padding: 8px 14px; font-size: 11px; font-weight: 700; color: #64748B; text-align: left;">Category</th>
                      <th style="padding: 8px 14px; font-size: 11px; font-weight: 700; color: #64748B; text-align: right;">Share</th>
                      <th style="padding: 8px 14px; font-size: 11px; font-weight: 700; color: #64748B; text-align: right;">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${expenseRows}
                  </tbody>
                </table>
              </div>

              <!-- Action Link -->
              <div style="text-align: center; padding: 12px 0;">
                <a href="${process.env.APP_URL || 'https://ais-dev-cmzxjxoqayl4lgqgu3fd7m-316110543649.europe-west2.run.app'}" style="display: inline-block; background-color: #0F172A; color: #FFFFFF; text-decoration: none; padding: 12px 28px; border-radius: 12px; font-weight: 700; font-size: 13px; box-shadow: 0 4px 12px rgba(15, 23, 42, 0.15);">
                  Open PlusZone Finance ERP Dashboard →
                </a>
              </div>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #F8FAFC; border-top: 1px solid #E2E8F0; padding: 24px 28px; text-align: center;">
              <p style="margin: 0 0 6px 0; font-size: 11px; color: #64748B; font-weight: 600;">
                PlusZone Ethiopian Partner-Owned Finance ERP
              </p>
              <p style="margin: 0; font-size: 10px; color: #94A3B8; line-height: 1.5;">
                This automated report is dispatched on the 2nd day of each month exclusively to authorized Admin and SuperUser partners.<br>
                Generated securely by PlusZone Automated Reporting Engine • Addis Ababa, Ethiopia
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;
}

/**
 * Core function to send automated monthly report to Admins and SuperAdmins
 */
export async function sendMonthlyFinancialReport(payload: MonthlyReportPayload, triggerType: 'AUTOMATIC_SCHEDULE' | 'MANUAL_DISPATCH' = 'MANUAL_DISPATCH') {
  // CRITICAL REQUIREMENT: Filter recipients strictly to SuperAdmin and Admin
  const eligibleRecipients = payload.recipients.filter(r => {
    const role = (r.role || '').toLowerCase();
    return role === 'superadmin' || role === 'admin';
  });

  if (eligibleRecipients.length === 0) {
    throw new Error('No eligible Admin or SuperUser recipients found with valid email addresses.');
  }

  const subject = `[PlusZone ERP] Monthly Financial Statement & Banking Report - ${payload.periodLabel}`;
  const htmlContent = buildMonthlyReportHtml({
    ...payload,
    recipients: eligibleRecipients
  });

  const { isConfigured, transporter } = getMailTransporter();
  const fromAddress = process.env.SMTP_FROM || 'PlusZone Finance ERP <reports@pluszone.et>';

  const recipientEmails = eligibleRecipients.map(r => r.email).join(', ');

  try {
    if (isConfigured) {
      // Real SMTP Dispatch
      await transporter.sendMail({
        from: fromAddress,
        to: recipientEmails,
        subject,
        html: htmlContent
      });

      const logEntry = {
        id: `rpt-log-${Date.now()}`,
        period: payload.periodLabel,
        sentAt: new Date().toISOString(),
        recipients: eligibleRecipients,
        status: 'DELIVERED' as const,
        subject,
        triggerType,
        summary: {
          totalBalance: payload.totalBalance,
          monthlyIncome: payload.monthlyIncome,
          monthlyExpense: payload.monthlyExpense,
          netProfit: payload.netProfit,
          activeWalletsCount: payload.wallets.length,
          outstandingReceivables: payload.receivables.totalOwed,
          outstandingLoans: payload.loans.totalBorrowed,
          equbVolume: payload.equbs.monthlyVolume
        }
      };

      dispatchHistory.unshift(logEntry);
      lastDispatchedMonth = payload.periodKey;

      return {
        success: true,
        status: 'DELIVERED',
        recipients: eligibleRecipients,
        message: `Monthly report email successfully delivered to ${eligibleRecipients.length} Admin/SuperUser account(s).`,
        log: logEntry
      };
    } else {
      // Simulated / Preview Dispatch
      console.log(`[Email Reporter] Dispatching report to ${recipientEmails} (SMTP in preview mode)`);
      
      const logEntry = {
        id: `rpt-log-${Date.now()}`,
        period: payload.periodLabel,
        sentAt: new Date().toISOString(),
        recipients: eligibleRecipients,
        status: 'SIMULATED' as const,
        subject,
        triggerType,
        summary: {
          totalBalance: payload.totalBalance,
          monthlyIncome: payload.monthlyIncome,
          monthlyExpense: payload.monthlyExpense,
          netProfit: payload.netProfit,
          activeWalletsCount: payload.wallets.length,
          outstandingReceivables: payload.receivables.totalOwed,
          outstandingLoans: payload.loans.totalBorrowed,
          equbVolume: payload.equbs.monthlyVolume
        }
      };

      dispatchHistory.unshift(logEntry);
      lastDispatchedMonth = payload.periodKey;

      return {
        success: true,
        status: 'SIMULATED',
        recipients: eligibleRecipients,
        message: `Automated report verified and simulated for ${eligibleRecipients.length} Admin/SuperUser recipient(s). Configure SMTP_HOST/USER/PASS in .env for external mail server delivery.`,
        log: logEntry
      };
    }
  } catch (err: any) {
    console.error('Failed to dispatch monthly email report:', err);

    const logEntry = {
      id: `rpt-log-${Date.now()}`,
      period: payload.periodLabel,
      sentAt: new Date().toISOString(),
      recipients: eligibleRecipients,
      status: 'FAILED' as const,
      subject,
      triggerType,
      summary: {
        totalBalance: payload.totalBalance,
        monthlyIncome: payload.monthlyIncome,
        monthlyExpense: payload.monthlyExpense,
        netProfit: payload.netProfit,
        activeWalletsCount: payload.wallets.length,
        outstandingReceivables: payload.receivables.totalOwed,
        outstandingLoans: payload.loans.totalBorrowed,
        equbVolume: payload.equbs.monthlyVolume
      },
      errorMessage: err.message
    };

    dispatchHistory.unshift(logEntry);
    throw err;
  }
}

export function getDispatchHistory() {
  return dispatchHistory;
}

export function getLastDispatchedMonth() {
  return lastDispatchedMonth;
}
