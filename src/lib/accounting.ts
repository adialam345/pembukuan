import { Transaction } from '../types';

// --- 1. Chart of Accounts ---
export type AccountType = 'Asset' | 'Liability' | 'Equity' | 'Revenue' | 'Expense';

export interface Account {
    code: string;
    name: string;
    type: AccountType;
    normalBalance: 'Debit' | 'Credit';
}

export const CHART_OF_ACCOUNTS: Record<string, Account> = {
    // Assets
    '101': { code: '101', name: 'Kas & Bank', type: 'Asset', normalBalance: 'Debit' },
    '102': { code: '102', name: 'Piutang Usaha', type: 'Asset', normalBalance: 'Debit' },

    // Liabilities
    '201': { code: '201', name: 'Utang Usaha', type: 'Liability', normalBalance: 'Credit' },

    // Equity
    '301': { code: '301', name: 'Modal Pemilik', type: 'Equity', normalBalance: 'Credit' },
    '302': { code: '302', name: 'Laba Ditahan', type: 'Equity', normalBalance: 'Credit' },
    '303': { code: '303', name: 'Prive', type: 'Equity', normalBalance: 'Debit' }, // Not used in simple model yet

    // Revenue
    '401': { code: '401', name: 'Pendapatan Jasa', type: 'Revenue', normalBalance: 'Credit' },

    // Expenses
    '501': { code: '501', name: 'Beban Operasional', type: 'Expense', normalBalance: 'Debit' },
};

// --- 2. Journal Entries ---
export interface JournalEntryLine {
    accountId: string;
    accountName: string;
    debit: number;
    credit: number;
}

export interface JournalEntry {
    id: string;
    date: string;
    description: string;
    lines: JournalEntryLine[];
}

export const generateJournal = (transactions: Transaction[]): JournalEntry[] => {
    return transactions.map((t) => {
        const lines: JournalEntryLine[] = [];
        const amount = Number(t.amount);

        if (t.type === 'income') {
            // Revenue is always Credited
            lines.push({
                accountId: '401',
                accountName: CHART_OF_ACCOUNTS['401'].name,
                debit: 0,
                credit: amount,
            });

            if (t.payment_status === 'paid') {
                // Cash Sale: Debit Cash
                lines.push({
                    accountId: '101',
                    accountName: CHART_OF_ACCOUNTS['101'].name,
                    debit: amount,
                    credit: 0,
                });
            } else {
                // Credit Sale: Debit AR
                lines.push({
                    accountId: '102',
                    accountName: CHART_OF_ACCOUNTS['102'].name,
                    debit: amount,
                    credit: 0,
                });
            }
        } else if (t.type === 'expense') {
            // Expense is always Debited
            lines.push({
                accountId: '501',
                accountName: CHART_OF_ACCOUNTS['501'].name,
                debit: amount,
                credit: 0,
            });

            if (t.payment_status === 'paid') {
                // Cash Expense: Credit Cash
                lines.push({
                    accountId: '101',
                    accountName: CHART_OF_ACCOUNTS['101'].name,
                    debit: 0,
                    credit: amount,
                });
            } else {
                // Accrued Expense: Credit AP
                lines.push({
                    accountId: '201',
                    accountName: CHART_OF_ACCOUNTS['201'].name,
                    debit: 0,
                    credit: amount,
                });
            }
        }

        return {
            id: t.id,
            date: t.date,
            description: t.description,
            lines,
        };
    });
};

// --- 3. General Ledger ---
export interface LedgerAccount {
    code: string;
    name: string;
    type: AccountType;
    balance: number;
    entries: {
        date: string;
        description: string;
        debit: number;
        credit: number;
    }[];
}

export const generateLedger = (journal: JournalEntry[]): LedgerAccount[] => {
    const ledger: Record<string, LedgerAccount> = {};

    // Initialize all accounts
    Object.values(CHART_OF_ACCOUNTS).forEach((acc) => {
        ledger[acc.code] = {
            code: acc.code,
            name: acc.name,
            type: acc.type,
            balance: 0,
            entries: [],
        };
    });

    // Process journal entries
    journal.forEach((entry) => {
        entry.lines.forEach((line) => {
            const account = ledger[line.accountId];
            if (account) {
                account.entries.push({
                    date: entry.date,
                    description: entry.description,
                    debit: line.debit,
                    credit: line.credit,
                });

                // Update running balance based on normal balance
                if (CHART_OF_ACCOUNTS[account.code].normalBalance === 'Debit') {
                    account.balance += line.debit - line.credit;
                } else {
                    account.balance += line.credit - line.debit;
                }
            }
        });
    });

    return Object.values(ledger);
};
