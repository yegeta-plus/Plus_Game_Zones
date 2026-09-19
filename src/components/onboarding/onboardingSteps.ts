import { NavTab } from '../../types';

export interface TourStep {
  id: string;
  targetSelector: string;
  tab: NavTab;
  subView?: string;
  title: string;
  description: string;
  placement?: 'top' | 'bottom' | 'auto';
  badge?: string;
}

/**
 * 8-Step PlusZone Business Spotlight Tour
 * Plain, non-technical copy tailored for Ethiopian business partners
 */
export const ONBOARDING_TOUR_STEPS: TourStep[] = [
  {
    id: 'dashboard-kpis',
    targetSelector: '[data-tour="dashboard-kpis"]',
    tab: 'dashboard',
    title: 'Business Overview & KPIs',
    description: 'See your real-time total net worth, today’s cash collections, and expenses across all business branches at a glance.',
    placement: 'bottom',
    badge: 'Overview'
  },
  {
    id: 'wallets-overview',
    targetSelector: '[data-tour="wallets-overview"]',
    tab: 'wallets',
    title: 'Multi-Wallet Vaults',
    description: 'Track exact balances for Cash, Telebirr, CBE Bank, and eBirr in separate vaults with zero calculation errors.',
    placement: 'bottom',
    badge: 'Vaults'
  },
  {
    id: 'quick-entry',
    targetSelector: '[data-tour="quick-entry"]',
    tab: 'dashboard',
    title: '1-Tap Fast Transaction Entry',
    description: 'Tap this quick-add button anytime to record customer sales, supplier payments, or shop expenses in seconds.',
    placement: 'top',
    badge: 'Fast Add'
  },
  {
    id: 'split-payments',
    targetSelector: '[data-tour="split-payments"]',
    tab: 'transactions',
    title: 'Split Multi-Source Payments',
    description: 'Pay bills using multiple accounts at once — like half in Cash and half via Telebirr — without manual math.',
    placement: 'bottom',
    badge: 'Split Pay'
  },
  {
    id: 'loans-receivables',
    targetSelector: '[data-tour="loans-receivables"]',
    tab: 'more',
    subView: 'RECEIVABLES',
    title: 'Customer Bale\'da & Debt',
    description: 'Never lose track of credit given to customers. Record partial repayments, track due dates, and monitor overdue tabs.',
    placement: 'bottom',
    badge: 'Bale\'da'
  },
  {
    id: 'equb-section',
    targetSelector: '[data-tour="equb-section"]',
    tab: 'equb',
    title: 'Equb Rotating Savings',
    description: 'Automate traditional Ethiopian Equb circles with member payment logs, winner payouts, and Pagumē holiday pauses.',
    placement: 'bottom',
    badge: 'Equb'
  },
  {
    id: 'partner-distributions',
    targetSelector: '[data-tour="partner-distributions"]',
    tab: 'more',
    subView: 'REPORTS',
    title: 'Partner Profit Distributions',
    description: 'Transparently calculate and divide monthly company profits among business partners based on agreed ownership shares.',
    placement: 'top',
    badge: 'Partners'
  },
  {
    id: 'financial-reports',
    targetSelector: '[data-tour="financial-reports"]',
    tab: 'more',
    subView: 'REPORTS',
    title: 'Financial Statements & Audit',
    description: 'Generate audited profit and loss statements, balance sheets, and tax-ready summaries with a single tap.',
    placement: 'bottom',
    badge: 'Reports'
  }
];

export const ONBOARDING_STORAGE_KEY = 'has_seen_onboarding';
