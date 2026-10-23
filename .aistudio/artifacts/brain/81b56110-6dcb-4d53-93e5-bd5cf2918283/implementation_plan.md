# Implementation Plan: Robust SMS Transaction Alert Parser (Telebirr & CBE)

## 1. Confirmed Scope & Problem Analysis
- **Problem Statement:** The SMS payment alert parser for Telebirr and CBE wallets fails to extract fields (amount, FT reference code, standing balance, counterparty) or throws parsing errors.
- **Root Causes Identified:**
  1. **Regex Fragility in `TelebirrIntegrationModal.tsx` & `ShegerPayVerificationModal.tsx`:**
     - Amount regex fails on Amharic scripts (`ብር`, `በብር`, `የተላለፈ ብር`), formatted numbers with commas (e.g. `1,035.00`), or prefixes without spaces.
     - Ref ID parser misses CBE `FT...` codes, Telebirr alphanumeric receipt numbers (`DB...`, `1000...`, `CI...`), or transactions labeled without colon separators (e.g., `Txn FT2409...`, `የመለያ ቁጥር: FT...`).
     - Direction detection fails to handle Amharic verbs (`ገቢ ተደርጓል`, `ተቀብለዋል` for Money In; `ወጪ ተደርጓል`, `ተላልፏል`, `ተከፍሏል` for Money Out / Transfer).
     - Standing balance extraction does not recognize `ቀሪ ሂሳብ` or `Current Balance:` variants.
  2. **Client-Server Disconnect:** `ShegerPayVerificationModal.tsx` tries to POST to `/api/v1/incoming-sms` which fails when in frontend preview, causing unhandled network errors instead of performing local parsing.

---

## 2. Technical Architecture & Parsing Strategy

```
  +-----------------------------------------------------------------------+
  |                   User Pastes SMS Alert / Message                     |
  +-----------------------------------+-----------------------------------+
                                      |
                                      v
  +-----------------------------------------------------------------------+
  |              Unified Robust SMS Parser (src/lib/smsParser.ts)         |
  |  - Auto-detects Provider: Telebirr / CBE / eBirr / Awash / Dashen    |
  |  - Normalizes text & cleans invisible characters / diacritics         |
  |  - Multilingual support: English + Amharic (ፊደል) scripts               |
  |  - Extractors:                                                        |
  |    * Amount & Currency (ETB, Birr, ብር, በብር)                           |
  |    * Reference / Transaction Code (FT..., DB..., 1000..., etc.)      |
  |    * Direction (Money In / Money Out / Transfer / Bill)               |
  |    * Sender / Recipient / Counterparty Name & Phone                   |
  |    * Date & Timestamp                                                 |
  |    * Current / Standing Balance & Account Suffix                      |
  +-----------------------------------+-----------------------------------+
                                      |
                                      v
  +-----------------------------------------------------------------------+
  |             Telebirr / CBE Integration Modal Live Preview             |
  |  - Live syntax highlighting of extracted tokens                       |
  |  - Editable input fields for immediate user adjustment if needed      |
  |  - One-click quick-paste sample templates for English & Amharic       |
  |  - Direct sync into App State (Wallets, Ledger & Shift Calculations)  |
  +-----------------------------------------------------------------------+
```

---

## 3. Supported Real-World SMS Formats
1. **Telebirr - Money In (English):**
   `"You have received ETB 1,035.00 from 251911****** John Doe on 18/10/2026 10:36:12. Your current balance is ETB 4,520.00. Transaction ID: 100028919283."`
2. **Telebirr - Money In (Amharic):**
   `"ከ 251911****** 1,035.00 ብር ገቢ ተደርጎልዎታል። የአሁን ቀሪ ሂሳብዎ 4,520.00 ብር ነው። የመለያ ቁጥር: 100028919283."`
3. **Telebirr - Money Out / Payment (English):**
   `"You have transferred ETB 200.00 to 251922****** Jane Doe. Fee is ETB 0.00. Current balance: ETB 4,320.00. Txn ID: DB98219482."`
4. **CBE - Credit Alert (English):**
   `"Dear Customer, your CBE account 1000****123 has been credited with ETB 190.00 on 18/10/2026 10:36 PM by Mobile Banking. Ref: FT2629239821. Available Balance: ETB 8,450.25."`
5. **CBE - Credit Alert (Amharic):**
   `"ውድ ደንበኛ፣ የሂሳብ ቁጥርዎ 1000****123 በ FT2629239821 በ 190.00 ብር ገቢ ተደርጓል። ቀሪ ሂሳብዎ 8,450.25 ብር ነው።"`
6. **CBE - Debit Alert (English & Amharic):**
   `"Dear Customer, your CBE account has been debited with ETB 500.00. Ref: FT2629910022. Available balance: ETB 7,950.25."`
7. **eBirr / Private Banks:**
   `"You have received 75.00 ETB from Abebe. Ref No: EB8492048."`

---

## 4. Step-by-Step Implementation Steps

### Phase 1: Create Dedicated `src/lib/smsParser.ts`
- Implement clean tokenizer and extractor functions with strict multi-pattern fallbacks:
  - `detectProvider(text: string): 'telebirr' | 'cbe' | 'ebirr' | 'awash' | 'unknown'`
  - `extractAmount(text: string): { amount: number; raw: string } | null`
  - `extractReference(text: string, provider: string): string | null`
  - `extractDirection(text: string): 'in' | 'out' | 'transfer'`
  - `extractCounterparty(text: string): string | null`
  - `extractBalance(text: string): number | null`
  - `extractDateTime(text: string): { date?: string; time?: string } | null`
  - Main parser `parseBankSms(text: string): ParsedSmsTransaction`
- Include high-fidelity sample test cases for immediate self-testing and edge-case handling.

### Phase 2: Update `TelebirrIntegrationModal.tsx`
- Replace inline weak regexes with `parseBankSms(smsText)`.
- Add interactive preview card showing:
  - Extracted Provider badge (Telebirr, CBE, eBirr)
  - Direction badge (Money In vs Money Out)
  - Editable form fields (Amount, Ref Number, Sender/Recipient, Wallet, Date/Time) so user can edit if bank SMS is non-standard.
  - One-click sample test buttons ("Test Telebirr SMS", "Test CBE SMS", "Test Amharic Alert") for instant verification in the UI.
  - One-click **"Record Transaction into Ledger"** button that immediately adds it to the active ledger with proper wallet association.

### Phase 3: Enhance `ShegerPayVerificationModal.tsx`
- Ensure offline client-side SMS parsing fallback so it never fails even if backend API route is unreachable.
- Standardize verification badges and reference matching against existing transactions.

### Phase 4: Verification & Quality Assurance
- Run full compilation (`compile_applet`) and ESLint (`lint_applet`).
- Verify English and Amharic sample SMS alerts parse amount, reference ID, and balance with 100% precision.
- Verify shift status widget restrictions remain intact (only on Dashboard view).

---

## 5. Review & Proceed
Please review this implementation plan. When you are ready, click **Proceed** or approve the plan to begin implementation.
