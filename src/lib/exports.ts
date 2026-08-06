import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import XLSX from 'xlsx-js-style';
import { ERPState, Transaction } from '../types';
import { calculateTotalBusinessBalance, calculateMonthlyStats, formatETB } from './store';

interface ExportOptions {
  state: ERPState;
  transactions?: Transaction[];
  dateRangeLabel?: string;
  reportTitle?: string;
}

/**
 * Helper to get wallet name by ID
 */
const getWalletName = (walletId: string, state: ERPState): string => {
  const w = state.wallets.find(item => item.id === walletId);
  return w ? w.name : walletId;
};

/**
 * 1. Generate Clean Professional PDF Financial Statement
 */
export const generatePDFReport = ({
  state,
  transactions = state.transactions,
  dateRangeLabel = 'All Time',
  reportTitle = 'Executive Financial Statement & Transaction Ledger'
}: ExportOptions) => {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  const totalBalance = calculateTotalBusinessBalance(state.wallets, state.transactions, state.transfers);
  const { income, expense, profit } = calculateMonthlyStats(transactions);
  const totalAssetsValue = state.assets.reduce((sum, a) => sum + a.currentValue, 0);
  const totalLoansOutstanding = state.loans.reduce((sum, l) => sum + l.outstandingBalance, 0);
  const netWorth = totalBalance + totalAssetsValue - totalLoansOutstanding;

  // Header Title
  doc.setFillColor(19, 25, 38); // Dark Navy #131926
  doc.rect(0, 0, 297, 24, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('PLUSZONE FINANCE ERP', 14, 11);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 212, 170); // Accent turquoise #00D4AA
  doc.text(reportTitle.toUpperCase(), 14, 18);

  doc.setFontSize(9);
  doc.setTextColor(200, 210, 225);
  doc.text(`Generated: ${new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`, 220, 11);
  doc.text(`User: ${state.currentUser?.name || 'Admin'} | Branch: ${state.currentUser?.branch || 'Main'}`, 220, 18);

  // Financial KPI Cards Banner
  doc.setFillColor(245, 247, 250);
  doc.roundedRect(14, 28, 269, 22, 2, 2, 'F');
  doc.setDrawColor(220, 225, 235);
  doc.roundedRect(14, 28, 269, 22, 2, 2, 'D');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 115, 130);

  // KPI 1: Net Revenue
  doc.text('GROSS REVENUE', 20, 34);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(16, 124, 65); // Green
  doc.text(formatETB(income), 20, 42);

  // KPI 2: Expenses
  doc.setFontSize(8);
  doc.setTextColor(100, 115, 130);
  doc.text('OPERATING EXPENSES', 80, 34);
  doc.setFontSize(11);
  doc.setTextColor(197, 34, 31); // Red
  doc.text(formatETB(expense), 80, 42);

  // KPI 3: Net Profit
  doc.setFontSize(8);
  doc.setTextColor(100, 115, 130);
  doc.text('NET MARGIN', 140, 34);
  doc.setFontSize(11);
  doc.setTextColor(16, 124, 65);
  doc.text(formatETB(profit), 140, 42);

  // KPI 4: Liquid Cash
  doc.setFontSize(8);
  doc.setTextColor(100, 115, 130);
  doc.text('LIQUID WALLET CASH', 195, 34);
  doc.setFontSize(11);
  doc.setTextColor(15, 98, 254); // Blue
  doc.text(formatETB(totalBalance), 195, 42);

  // KPI 5: Net Worth
  doc.setFontSize(8);
  doc.setTextColor(100, 115, 130);
  doc.text('BUSINESS NET WORTH', 245, 34);
  doc.setFontSize(11);
  doc.setTextColor(19, 25, 38);
  doc.text(formatETB(netWorth), 245, 42);

  // Table Data Preparation
  const tableData = transactions.map((t, index) => [
    (index + 1).toString(),
    new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
    t.type,
    t.category,
    t.description.length > 35 ? t.description.slice(0, 35) + '...' : t.description,
    getWalletName(t.walletId, state),
    t.branch || 'Main',
    formatETB(t.amount),
    t.creatorName || 'System', // Who made that transaction
    t.reversed ? 'REVERSED' : 'ACTIVE'
  ]);

  autoTable(doc, {
    startY: 54,
    head: [['#', 'Date', 'Type', 'Category', 'Description', 'Wallet Account', 'Branch', 'Amount (ETB)', 'Who Made Transaction', 'Status']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [19, 25, 38],
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'left'
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [30, 40, 55]
    },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 22 },
      2: { cellWidth: 18, fontStyle: 'bold' },
      3: { cellWidth: 28 },
      4: { cellWidth: 55 },
      5: { cellWidth: 32 },
      6: { cellWidth: 20 },
      7: { cellWidth: 30, fontStyle: 'bold', halign: 'right' },
      8: { cellWidth: 36, fontStyle: 'bold' }, // Who made transaction column
      9: { cellWidth: 18, halign: 'center' }
    },
    didParseCell: (data) => {
      if (data.section === 'body') {
        const typeCell = data.row.cells[2]?.text[0];
        const statusCell = data.row.cells[9]?.text[0];

        if (statusCell === 'REVERSED') {
          data.cell.styles.textColor = [150, 150, 150];
        } else if (typeCell === 'INCOME') {
          if (data.column.index === 2 || data.column.index === 7) {
            data.cell.styles.textColor = [16, 124, 65];
          }
        } else if (typeCell === 'EXPENSE') {
          if (data.column.index === 2 || data.column.index === 7) {
            data.cell.styles.textColor = [197, 34, 31];
          }
        }

        // Highlight "Who Made Transaction" column
        if (data.column.index === 8) {
          data.cell.styles.textColor = [30, 50, 100];
        }
      }
    },
    margin: { left: 14, right: 14 }
  });

  doc.save(`PlusZone_Financial_Statement_${new Date().toISOString().slice(0, 10)}.pdf`);
};

// Style Definitions for XLSX Export
const STYLES = {
  bannerTitle: {
    font: { name: 'Calibri', sz: 14, bold: true, color: { rgb: 'FFFFFF' } },
    fill: { fgColor: { rgb: '131926' } },
    alignment: { horizontal: 'left', vertical: 'center' }
  },
  bannerSubtitle: {
    font: { name: 'Calibri', sz: 10, bold: true, color: { rgb: '00D4AA' } },
    fill: { fgColor: { rgb: '1E2D40' } },
    alignment: { horizontal: 'left', vertical: 'center' }
  },
  sectionHeader: {
    font: { name: 'Calibri', sz: 11, bold: true, color: { rgb: 'FFFFFF' } },
    fill: { fgColor: { rgb: '1E2D40' } },
    alignment: { horizontal: 'left', vertical: 'center' }
  },
  tableHeaderNavy: {
    font: { name: 'Calibri', sz: 11, bold: true, color: { rgb: 'FFFFFF' } },
    fill: { fgColor: { rgb: '131926' } },
    alignment: { horizontal: 'center', vertical: 'center' },
    border: {
      top: { style: 'thin', color: { rgb: '334155' } },
      bottom: { style: 'medium', color: { rgb: '334155' } }
    }
  },
  tableHeaderCreator: {
    font: { name: 'Calibri', sz: 11, bold: true, color: { rgb: 'FFFFFF' } },
    fill: { fgColor: { rgb: '1E3A8A' } }, // Deep Blue / Indigo for "Who Made Transaction"
    alignment: { horizontal: 'center', vertical: 'center' },
    border: {
      top: { style: 'thin', color: { rgb: '1E3A8A' } },
      bottom: { style: 'medium', color: { rgb: '1E3A8A' } }
    }
  },
  tableHeaderGreen: {
    font: { name: 'Calibri', sz: 11, bold: true, color: { rgb: 'FFFFFF' } },
    fill: { fgColor: { rgb: '166534' } },
    alignment: { horizontal: 'center', vertical: 'center' }
  },
  tableHeaderRed: {
    font: { name: 'Calibri', sz: 11, bold: true, color: { rgb: 'FFFFFF' } },
    fill: { fgColor: { rgb: '991B1B' } },
    alignment: { horizontal: 'center', vertical: 'center' }
  },
  tableHeaderTeal: {
    font: { name: 'Calibri', sz: 11, bold: true, color: { rgb: 'FFFFFF' } },
    fill: { fgColor: { rgb: '0F766E' } },
    alignment: { horizontal: 'center', vertical: 'center' }
  },
  tableHeaderIndigo: {
    font: { name: 'Calibri', sz: 11, bold: true, color: { rgb: 'FFFFFF' } },
    fill: { fgColor: { rgb: '3730A3' } },
    alignment: { horizontal: 'center', vertical: 'center' }
  },
  cellIncome: {
    fill: { fgColor: { rgb: 'E6F4EA' } },
    font: { name: 'Calibri', sz: 10, color: { rgb: '137333' }, bold: true }
  },
  cellExpense: {
    fill: { fgColor: { rgb: 'FCE8E6' } },
    font: { name: 'Calibri', sz: 10, color: { rgb: 'C5221F' }, bold: true }
  },
  cellReversed: {
    fill: { fgColor: { rgb: 'F1F5F9' } },
    font: { name: 'Calibri', sz: 10, color: { rgb: '94A3B8' }, strike: true }
  },
  cellCreator: {
    fill: { fgColor: { rgb: 'DBEAFE' } },
    font: { name: 'Calibri', sz: 10, bold: true, color: { rgb: '1E40AF' } },
    alignment: { horizontal: 'left', vertical: 'center' }
  },
  totalRow: {
    font: { name: 'Calibri', sz: 11, bold: true, color: { rgb: '0F172A' } },
    fill: { fgColor: { rgb: 'F8FAFC' } },
    border: {
      top: { style: 'thin', color: { rgb: '0F172A' } },
      bottom: { style: 'double', color: { rgb: '0F172A' } }
    }
  }
};

/**
 * Helper to apply styling to a worksheet generated by XLSX.utils.aoa_to_sheet or json_to_sheet
 */
const formatWorksheet = (
  ws: any,
  {
    headerRowIdx,
    headerStyle = STYLES.tableHeaderNavy,
    creatorColIdx = -1,
    colWidths = []
  }: {
    headerRowIdx: number;
    headerStyle?: any;
    creatorColIdx?: number;
    colWidths?: number[];
  }
) => {
  if (!ws || !ws['!ref']) return;

  const range = XLSX.utils.decode_range(ws['!ref']);

  for (let R = range.s.r; R <= range.e.r; ++R) {
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const cellRef = XLSX.utils.encode_cell({ r: R, c: C });
      if (!ws[cellRef]) continue;

      // Banner Row 0
      if (R === 0) {
        ws[cellRef].s = STYLES.bannerTitle;
      }
      // Subtitle Row 1
      else if (R === 1) {
        ws[cellRef].s = STYLES.bannerSubtitle;
      }
      // Table Header Row
      else if (R === headerRowIdx) {
        if (C === creatorColIdx) {
          ws[cellRef].s = STYLES.tableHeaderCreator;
        } else {
          ws[cellRef].s = headerStyle;
        }
      }
      // Data Rows below Header
      else if (R > headerRowIdx) {
        // Creator column highlight
        if (C === creatorColIdx) {
          ws[cellRef].s = STYLES.cellCreator;
        } else {
          // Alignment for numbers / dates
          const val = ws[cellRef].v;
          if (typeof val === 'number') {
            ws[cellRef].s = {
              alignment: { horizontal: 'right' },
              font: { name: 'Calibri', sz: 10 }
            };
          }
        }
      }
    }
  }

  if (colWidths.length > 0) {
    ws['!cols'] = colWidths.map(w => ({ wch: w }));
  }
};

/**
 * 2. Generate Comprehensive Multi-Tab Banking & Financial Reporting Excel Workbook (.xlsx) with Professional Styling
 */
export const generateExcelReport = ({
  state,
  transactions = state.transactions,
  dateRangeLabel = 'All Time',
  reportTitle = 'Executive Banking & Financial Reporting Package'
}: ExportOptions) => {
  const wb = XLSX.utils.book_new();

  const totalBalance = calculateTotalBusinessBalance(state.wallets, state.transactions, state.transfers);
  const { income, expense, profit } = calculateMonthlyStats(transactions);
  const totalAssetsValue = state.assets.reduce((sum, a) => sum + a.currentValue, 0);
  const totalLoansOutstanding = state.loans.reduce((sum, l) => sum + l.outstandingBalance, 0);
  const netWorth = totalBalance + totalAssetsValue - totalLoansOutstanding;

  // ------------------- TAB 1: BANKING EXECUTIVE SUMMARY -------------------
  const summaryAOA: any[][] = [
    ['PLUSZONE FINANCE ERP — AUDITED BANKING & FINANCIAL STATEMENT'],
    ['Report Title', reportTitle, `Period: ${dateRangeLabel}`, `Generated: ${new Date().toLocaleString()}`, `By: ${state.currentUser?.name || 'Admin'}`],
    [],
    ['EXECUTIVE FINANCIAL METRICS', 'AMOUNT (ETB)', 'STATUS / REMARK'],
    ['Total Gross Revenue (Income)', income, 'Total Cash Inflow'],
    ['Total Operating Expenses', expense, 'Total Cash Outflow'],
    ['Net Profit Margin', profit, profit >= 0 ? 'Surplus / Profit' : 'Deficit / Loss'],
    ['Total Liquid Cash Balance', totalBalance, 'Available Across All Accounts'],
    ['Fixed Assets Valuation', totalAssetsValue, 'Equipment & Holdings'],
    ['Outstanding Liabilities / Loans', totalLoansOutstanding, 'Debt Obligations'],
    ['Total Business Net Worth', netWorth, 'Equity Valuation'],
    [],
    ['BANK & WALLET ACCOUNTS SUMMARY', 'TYPE', 'OPENING BAL (ETB)', 'TOTAL IN (ETB)', 'TOTAL OUT (ETB)', 'CURRENT BALANCE (ETB)'],
    ...state.wallets.map(w => {
      const currentBal = w.openingBalance + w.totalIn - w.totalOut;
      return [w.name, w.type, w.openingBalance, w.totalIn, w.totalOut, currentBal];
    }),
    [],
    ['CATEGORY PERFORMANCE SUMMARY', 'TYPE', 'RECORD COUNT', 'TOTAL AMOUNT (ETB)']
  ];

  // Group transactions by category
  const categoryMap: Record<string, { type: string; count: number; total: number }> = {};
  transactions.forEach(t => {
    if (t.reversed) return;
    if (!categoryMap[t.category]) {
      categoryMap[t.category] = { type: t.type, count: 0, total: 0 };
    }
    categoryMap[t.category].count += 1;
    categoryMap[t.category].total += t.amount;
  });

  Object.entries(categoryMap).forEach(([cat, data]) => {
    summaryAOA.push([cat, data.type, data.count, data.total]);
  });

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryAOA);
  formatWorksheet(wsSummary, {
    headerRowIdx: 3,
    headerStyle: STYLES.sectionHeader,
    colWidths: [38, 24, 22, 22, 22, 24]
  });

  XLSX.utils.book_append_sheet(wb, wsSummary, 'Banking Summary');

  // ------------------- TAB 2: ALL TRANSACTIONS LEDGER -------------------
  const allLedgerAOA: any[][] = [
    ['PLUSZONE FINANCE ERP — ALL TRANSACTIONS AUDIT LEDGER'],
    [`Report Title: ${reportTitle}`, `Scope: ${dateRangeLabel}`, `Generated: ${new Date().toLocaleString()}`, `By: ${state.currentUser?.name || 'Admin'} (${state.currentUser?.branch || 'Main'})`],
    [],
    ['#', 'Transaction ID', 'Date & Time', 'Type', 'Category', 'Description', 'Wallet / Bank Account', 'Amount (ETB)', 'Who Made Transaction', 'Creator ID', 'Branch', 'Notes / Reference', 'Status'],
    ...transactions.map((t, i) => [
      i + 1,
      t.id,
      new Date(t.date).toLocaleString(),
      t.type,
      t.category,
      t.description,
      getWalletName(t.walletId, state),
      t.amount,
      t.creatorName || 'System', // Prominently highlighted "Who Made Transaction"
      t.creatorId || '-',
      t.branch || 'Main',
      t.notes || t.refType || '-',
      t.reversed ? 'Reversed' : 'Active'
    ])
  ];

  const wsAllLedger = XLSX.utils.aoa_to_sheet(allLedgerAOA);

  formatWorksheet(wsAllLedger, {
    headerRowIdx: 3,
    headerStyle: STYLES.tableHeaderNavy,
    creatorColIdx: 8, // Column index 8 is "Who Made Transaction"
    colWidths: [6, 16, 22, 12, 22, 36, 26, 18, 28, 15, 14, 22, 12]
  });

  // Colorize Income vs Expense vs Reversed rows in All Ledger
  const rangeLedger = XLSX.utils.decode_range(wsAllLedger['!ref'] || 'A1:A1');
  for (let R = 4; R <= rangeLedger.e.r; ++R) {
    const typeCellRef = XLSX.utils.encode_cell({ r: R, c: 3 });
    const statusCellRef = XLSX.utils.encode_cell({ r: R, c: 12 });
    const typeVal = wsAllLedger[typeCellRef]?.v;
    const statusVal = wsAllLedger[statusCellRef]?.v;

    let rowStyle = null;
    if (statusVal === 'Reversed') {
      rowStyle = STYLES.cellReversed;
    } else if (typeVal === 'INCOME') {
      rowStyle = STYLES.cellIncome;
    } else if (typeVal === 'EXPENSE') {
      rowStyle = STYLES.cellExpense;
    }

    if (rowStyle) {
      for (let C = 0; C <= rangeLedger.e.c; ++C) {
        if (C === 8) continue; // Keep creator column styling
        const cellRef = XLSX.utils.encode_cell({ r: R, c: C });
        if (wsAllLedger[cellRef]) {
          wsAllLedger[cellRef].s = { ...rowStyle, alignment: C === 7 ? { horizontal: 'right' } : undefined };
        }
      }
    }
  }

  XLSX.utils.book_append_sheet(wb, wsAllLedger, 'All Transactions');

  // ------------------- TAB 3: INCOME STATEMENT -------------------
  const incomeTransactions = transactions.filter(t => t.type === 'INCOME');
  const incomeAOA: any[][] = [
    ['PLUSZONE FINANCE ERP — GROSS INCOME & REVENUE LEDGER'],
    [`Total Income: ${formatETB(income)}`, `Records: ${incomeTransactions.length}`, `Generated: ${new Date().toLocaleString()}`],
    [],
    ['#', 'Date & Time', 'Category', 'Description', 'Deposit Bank / Wallet', 'Amount (ETB)', 'Who Made Transaction', 'Branch', 'Status'],
    ...incomeTransactions.map((t, i) => [
      i + 1,
      new Date(t.date).toLocaleString(),
      t.category,
      t.description,
      getWalletName(t.walletId, state),
      t.amount,
      t.creatorName || 'System',
      t.branch || 'Main',
      t.reversed ? 'Reversed' : 'Active'
    ])
  ];

  const wsIncome = XLSX.utils.aoa_to_sheet(incomeAOA);
  formatWorksheet(wsIncome, {
    headerRowIdx: 3,
    headerStyle: STYLES.tableHeaderGreen,
    creatorColIdx: 6,
    colWidths: [6, 22, 22, 36, 26, 18, 28, 14, 12]
  });

  XLSX.utils.book_append_sheet(wb, wsIncome, 'Income Statement');

  // ------------------- TAB 4: EXPENSE STATEMENT -------------------
  const expenseTransactions = transactions.filter(t => t.type === 'EXPENSE');
  const expenseAOA: any[][] = [
    ['PLUSZONE FINANCE ERP — OPERATING EXPENSES LEDGER'],
    [`Total Expenses: ${formatETB(expense)}`, `Records: ${expenseTransactions.length}`, `Generated: ${new Date().toLocaleString()}`],
    [],
    ['#', 'Date & Time', 'Category', 'Description', 'Source Bank / Wallet', 'Amount (ETB)', 'Who Made Transaction', 'Branch', 'Status'],
    ...expenseTransactions.map((t, i) => [
      i + 1,
      new Date(t.date).toLocaleString(),
      t.category,
      t.description,
      getWalletName(t.walletId, state),
      t.amount,
      t.creatorName || 'System',
      t.branch || 'Main',
      t.reversed ? 'Reversed' : 'Active'
    ])
  ];

  const wsExpense = XLSX.utils.aoa_to_sheet(expenseAOA);
  formatWorksheet(wsExpense, {
    headerRowIdx: 3,
    headerStyle: STYLES.tableHeaderRed,
    creatorColIdx: 6,
    colWidths: [6, 22, 22, 36, 26, 18, 28, 14, 12]
  });

  XLSX.utils.book_append_sheet(wb, wsExpense, 'Expense Statement');

  // ------------------- TAB 5: BANK ACCOUNTS CASH FLOW -------------------
  const walletAOA: any[][] = [
    ['PLUSZONE FINANCE ERP — BANK ACCOUNTS & LIQUID CASH FLOW'],
    [`Total Cash Available: ${formatETB(totalBalance)}`, `Accounts Count: ${state.wallets.length}`],
    [],
    ['#', 'Bank / Wallet Name', 'Account Type', 'Opening Balance (ETB)', 'Total Inflow (ETB)', 'Total Outflow (ETB)', 'Net Cash Movement (ETB)', 'Current Balance (ETB)', 'Transactions Count'],
    ...state.wallets.map((w, i) => {
      const wTxs = transactions.filter(t => t.walletId === w.id && !t.reversed);
      const incSum = wTxs.filter(t => t.type === 'INCOME').reduce((s, t) => s + t.amount, 0);
      const expSum = wTxs.filter(t => t.type === 'EXPENSE').reduce((s, t) => s + t.amount, 0);
      const endingBal = w.openingBalance + incSum - expSum;

      return [
        i + 1,
        w.name,
        w.type,
        w.openingBalance,
        incSum,
        expSum,
        incSum - expSum,
        endingBal,
        wTxs.length
      ];
    })
  ];

  const wsWallets = XLSX.utils.aoa_to_sheet(walletAOA);
  formatWorksheet(wsWallets, {
    headerRowIdx: 3,
    headerStyle: STYLES.tableHeaderTeal,
    colWidths: [6, 30, 16, 22, 22, 22, 24, 22, 16]
  });

  XLSX.utils.book_append_sheet(wb, wsWallets, 'Bank Accounts');

  // ------------------- TAB 6: USER AUDIT & CREATOR SUMMARY -------------------
  const creatorMap: Record<string, { name: string; role: string; branch: string; incTotal: number; expTotal: number; count: number }> = {};

  transactions.forEach(t => {
    if (t.reversed) return;
    const name = t.creatorName || 'System';
    if (!creatorMap[name]) {
      const userObj = state.users.find(u => u.name === name);
      creatorMap[name] = {
        name,
        role: userObj?.role || 'Staff',
        branch: t.branch || 'Main',
        incTotal: 0,
        expTotal: 0,
        count: 0
      };
    }

    creatorMap[name].count += 1;
    if (t.type === 'INCOME') {
      creatorMap[name].incTotal += t.amount;
    } else {
      creatorMap[name].expTotal += t.amount;
    }
  });

  const userAOA: any[][] = [
    ['PLUSZONE FINANCE ERP — USER CREATOR AUDIT TRAIL'],
    [`Total Users Active: ${Object.keys(creatorMap).length}`, `Generated: ${new Date().toLocaleString()}`],
    [],
    ['#', 'Who Made Transaction', 'System Role', 'Branch', 'Income Posted (ETB)', 'Expenses Posted (ETB)', 'Total Volume Handled (ETB)', 'Total Entries Created'],
    ...Object.values(creatorMap).map((u, i) => [
      i + 1,
      u.name,
      u.role,
      u.branch,
      u.incTotal,
      u.expTotal,
      u.incTotal + u.expTotal,
      u.count
    ])
  ];

  const wsUserAudit = XLSX.utils.aoa_to_sheet(userAOA);
  formatWorksheet(wsUserAudit, {
    headerRowIdx: 3,
    headerStyle: STYLES.tableHeaderIndigo,
    creatorColIdx: 1, // Highlight user column
    colWidths: [6, 28, 16, 16, 22, 22, 26, 20]
  });

  XLSX.utils.book_append_sheet(wb, wsUserAudit, 'User Audit Trail');

  // Export Complete Multi-Tab Excel Workbook
  XLSX.writeFile(wb, `PlusZone_Financial_Statement_${new Date().toISOString().slice(0, 10)}.xlsx`);
};

/**
 * 3. Print Layout Helper
 */
export const printFinancialStatement = () => {
  window.print();
};
