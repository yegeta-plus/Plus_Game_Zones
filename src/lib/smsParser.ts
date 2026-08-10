import { TransactionType } from '../types';

export interface ParsedBankMessage {
  refCode: string;
  amount: number;
  type: TransactionType;
  senderOrCounterparty: string;
  targetAccount?: string;
  standingBalance?: number;
  provider: 'CBE' | 'TELEBIRR' | 'EBIRR' | 'AWASH' | 'DASHEN' | 'BOA' | 'OTHER';
  suggestedCategory: string;
  dateStr?: string;
  rawText: string;
}

export function parseBankMessage(rawText: string): ParsedBankMessage | null {
  if (!rawText || !rawText.trim()) return null;

  const text = rawText.trim();
  const lower = text.toLowerCase();

  // 1. Identify Provider
  let provider: ParsedBankMessage['provider'] = 'OTHER';
  if (lower.includes('cbe') || lower.includes('commercial bank') || lower.includes('1000') || lower.includes('mbreciept.cbe')) {
    provider = 'CBE';
  } else if (lower.includes('telebirr') || lower.includes('e-money account balance')) {
    provider = 'TELEBIRR';
  } else if (lower.includes('ebirr') || lower.includes('coopay') || lower.includes('ethio relecom')) {
    provider = 'EBIRR';
  } else if (lower.includes('awash')) {
    provider = 'AWASH';
  } else if (lower.includes('dashen') || lower.includes('amole')) {
    provider = 'DASHEN';
  } else if (lower.includes('abyssinia') || lower.includes('boa')) {
    provider = 'BOA';
  }

  // 2. Identify Type (Income vs Expense)
  let type: TransactionType = 'INCOME';
  if (
    lower.includes('debited') ||
    lower.includes('paid') ||
    lower.includes('sent') ||
    lower.includes('payment to') ||
    lower.includes('debit') ||
    lower.includes('transfer to')
  ) {
    type = 'EXPENSE';
  } else if (
    lower.includes('credited') ||
    lower.includes('received') ||
    lower.includes('credit') ||
    lower.includes('deposited')
  ) {
    type = 'INCOME';
  }

  // 3. Extract Amount (ETB or BIRR or numbers, e.g. ETB 225.00, ETB 70.00, ETB140)
  let amount = 0;
  const amountMatch =
    text.match(/(?:received|credited|paid|debited)\s+(?:etb|birr)?\s*([0-9,]+(?:\.\d{1,2})?)/i) ||
    text.match(/(?:etb|birr|ብር)\s*([0-9,]+(?:\.\d{1,2})?)\s*(?:received|credited|from|paid|debited)?/i) ||
    text.match(/([0-9,]+\.\d{2})\s*(?:etb|birr)/i);

  if (amountMatch && amountMatch[1]) {
    amount = parseFloat(amountMatch[1].replace(/,/g, '')) || 0;
  }

  // 4. Extract Reference Code
  let refCode = '';
  const refMatch =
    text.match(/(?:transaction number is|transaction id|txnref|ref:|ref|id:)\s*([a-z0-9\-_]+)/i) ||
    text.match(/cbe\.com\.et\/([a-z0-9\-_]+)/i) ||
    text.match(/\b(FT\d+|EB\d+|AW\d+|DS\d+|BA\d+|TX\d+|DH[A-Z0-9]+|8[A-Z0-9]{8,11})\b/i);

  if (refMatch && refMatch[1]) {
    refCode = refMatch[1].trim().toUpperCase();
  } else {
    refCode = `AUTO-${Date.now().toString().slice(-6)}`;
  }

  // 5. Extract Counterparty / Sender
  let senderOrCounterparty = 'Unknown Party';
  const counterpartyMatch =
    text.match(/(?:from|by)\s+(?:account\s+[0-9*]+\s*\(([^)]+)\)|([A-Za-z0-9\s*()+.]+?)(?=\s+to|\s+on|\s+ref|\s+date|\.|,|$))/i) ||
    text.match(/(?:paid|sent|transfer|debit)\s+to\s+([A-Za-z0-9\s*()+.]+?)(?=\s+on|\s+ref|\s+date|\.|,|$)/i);

  if (counterpartyMatch) {
    const rawParty = counterpartyMatch[1] || counterpartyMatch[2] || '';
    if (rawParty.trim()) {
      senderOrCounterparty = rawParty.trim();
    }
  }

  if (senderOrCounterparty === 'Unknown Party') {
    if (provider === 'CBE') senderOrCounterparty = type === 'INCOME' ? 'CBE Account Transfer' : 'CBE Payment';
    else if (provider === 'TELEBIRR') senderOrCounterparty = type === 'INCOME' ? 'Telebirr P2P User' : 'Telebirr Merchant';
    else if (provider === 'EBIRR') senderOrCounterparty = type === 'INCOME' ? 'eBirr / COOPay User' : 'eBirr Merchant';
  }

  // 6. Extract Target Account if available
  let targetAccount: string | undefined = undefined;
  const targetAccMatch = text.match(/to\s+your\s+account\s+([0-9*]+)/i);
  if (targetAccMatch && targetAccMatch[1]) {
    targetAccount = targetAccMatch[1];
  }

  // 7. Extract Standing / New Balance (Supports format like ETB3,044.57, ETB 2,553,75 with comma decimal, ETB280.09)
  let standingBalance: number | undefined = undefined;
  const balMatch =
    text.match(/(?:current balance|new A\/C balance|available balance|current E-Money Account balance)(?:\s+is|\s+:)?\s*(?:etb|birr)?\s*([0-9,]+(?:[.,]\d{1,2})?)/i) ||
    text.match(/(?:bal|balance)\s*(?:is|:)?\s*(?:etb|birr)?\s*([0-9,]+(?:[.,]\d{1,2})?)/i);

  if (balMatch && balMatch[1]) {
    let cleanBalStr = balMatch[1].trim();
    // Check if format is like 2,553,75 where last comma is decimal
    if (cleanBalStr.match(/^\d{1,3}(?:,\d{3})*,\d{2}$/)) {
      const lastCommaIdx = cleanBalStr.lastIndexOf(',');
      cleanBalStr = cleanBalStr.substring(0, lastCommaIdx).replace(/,/g, '') + '.' + cleanBalStr.substring(lastCommaIdx + 1);
    } else {
      cleanBalStr = cleanBalStr.replace(/,/g, '');
    }
    standingBalance = parseFloat(cleanBalStr) || undefined;
  }

  // 8. Auto-Categorize
  let suggestedCategory = type === 'INCOME' ? 'Sales Revenue' : 'Operational Expenses';
  const textLower = text.toLowerCase();
  if (textLower.includes('merchant') || textLower.includes('store') || textLower.includes('shop')) {
    suggestedCategory = type === 'EXPENSE' ? 'Merchant Supplies' : 'Store Sales';
  } else if (textLower.includes('telecom') || textLower.includes('airtime') || textLower.includes('bill')) {
    suggestedCategory = 'Utilities & Bills';
  } else if (textLower.includes('salary') || textLower.includes('payroll')) {
    suggestedCategory = type === 'EXPENSE' ? 'Payroll / Salary' : 'Salary Income';
  } else if (textLower.includes('equb')) {
    suggestedCategory = 'Equb Contribution';
  } else if (textLower.includes('loan') || textLower.includes('repay')) {
    suggestedCategory = 'Loan Payment';
  }

  return {
    refCode,
    amount,
    type,
    senderOrCounterparty,
    targetAccount,
    standingBalance,
    provider,
    suggestedCategory,
    rawText: text
  };
}
