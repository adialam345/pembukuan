import { motion } from 'framer-motion';
import { useMemo, useState } from 'react';
import { formatCurrency } from '../lib/utils';
import { Transaction } from '../types';
import { generateJournal, generateLedger, CHART_OF_ACCOUNTS } from '../lib/accounting';

interface ReportsPageProps {
    transactions: Transaction[];
}

type ReportTab = 'profit-loss' | 'balance-sheet' | 'cash-flow' | 'capital-change' | 'sales';

const container = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
};

const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
};

export const ReportsPage = ({ transactions }: ReportsPageProps) => {
    const [activeTab, setActiveTab] = useState<ReportTab>('profit-loss');

    const { ledger, profitLossData, balanceSheetData, cashFlowData, capitalChangeData, salesData } = useMemo(() => {
        const journal = generateJournal(transactions);
        const ledgerList = generateLedger(journal);
        const ledgerMap = ledgerList.reduce((acc, curr) => ({ ...acc, [curr.code]: curr }), {} as Record<string, typeof ledgerList[0]>);

        // --- 1. Profit & Loss Data (Monthly) ---
        const months = [
            'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
            'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
        ];
        const currentYear = new Date().getFullYear();
        const plReports: Array<{
            month: string;
            income: number;
            expense: number;
            profit: number;
        }> = [];

        for (let i = 11; i >= 0; i--) {
            const monthIndex = (new Date().getMonth() - i + 12) % 12;
            const monthName = months[monthIndex];

            // Filter transactions for this month to calculate P&L
            // Note: In a full system, we would query the ledger by date.
            // For simplicity here, we re-aggregate from transactions or use ledger entries if we had date filtering there.
            // Using transactions is easier for monthly breakdown in this simple model.
            const monthTransactions = transactions.filter((t) => {
                const date = new Date(t.date);
                return date.getMonth() === monthIndex && date.getFullYear() === currentYear;
            });

            const income = monthTransactions
                .filter((t) => t.type === 'income')
                .reduce((sum, t) => sum + Number(t.amount), 0);

            const expense = monthTransactions
                .filter((t) => t.type === 'expense')
                .reduce((sum, t) => sum + Number(t.amount), 0);

            plReports.push({
                month: monthName,
                income,
                expense,
                profit: income - expense,
            });
        }

        // --- 2. Balance Sheet Data (Snapshot) ---
        const assets = {
            cash: ledgerMap['101']?.balance || 0,
            accountsReceivable: ledgerMap['102']?.balance || 0,
            total: (ledgerMap['101']?.balance || 0) + (ledgerMap['102']?.balance || 0)
        };

        const liabilities = {
            accountsPayable: ledgerMap['201']?.balance || 0, // Credit balance is positive in our ledger logic?
            // Wait, our ledger logic: Credit normal balance means Credit increases it.
            // If we used signed numbers (Debit +, Credit -), it would be different.
            // In accounting.ts:
            // if (CHART_OF_ACCOUNTS[account.code].normalBalance === 'Debit') account.balance += line.debit - line.credit;
            // else account.balance += line.credit - line.debit;
            // So balances are generally positive.
            total: ledgerMap['201']?.balance || 0
        };

        const equity = {
            // Net Income is Revenue - Expenses
            // In a real closing process, Revenue/Expense accounts are zeroed out to Retained Earnings.
            // Here, we calculate Net Income on the fly.
            retainedEarnings: (ledgerMap['401']?.balance || 0) - (ledgerMap['501']?.balance || 0),
            capital: ledgerMap['301']?.balance || 0,
            total: (ledgerMap['301']?.balance || 0) + ((ledgerMap['401']?.balance || 0) - (ledgerMap['501']?.balance || 0))
        };

        // --- 3. Cash Flow (Direct Method Simulation) ---
        // Cash In: Payments from Customers (Income + Paid)
        // Cash Out: Payments for Expenses (Expense + Paid)
        const cashIn = transactions
            .filter(t => t.type === 'income' && t.payment_status === 'paid')
            .reduce((sum, t) => sum + Number(t.amount), 0);

        const cashOut = transactions
            .filter(t => t.type === 'expense' && t.payment_status === 'paid')
            .reduce((sum, t) => sum + Number(t.amount), 0);

        // --- 4. Capital Change ---
        // Beginning Capital + Net Income - Drawings = Ending Capital
        // Assuming Beginning Capital = 0 for this simulation if not tracked
        const netIncome = (ledgerMap['401']?.balance || 0) - (ledgerMap['501']?.balance || 0);
        const beginningCapital = 0; // Or fetch from a 'Capital' transaction if we had one
        const drawings = 0; // Prive not implemented yet

        // --- 5. Sales Report ---
        // Just total revenue
        const totalSales = ledgerMap['401']?.balance || 0;


        return {
            ledger: ledgerMap,
            profitLossData: plReports.reverse(),
            balanceSheetData: { assets, liabilities, equity },
            cashFlowData: { cashIn, cashOut, netCash: cashIn - cashOut },
            capitalChangeData: { beginningCapital, netIncome, drawings, endingCapital: beginningCapital + netIncome - drawings },
            salesData: { totalSales }
        };
    }, [transactions]);

    return (
        <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="space-y-3 overflow-x-hidden max-w-full"
        >
            <div className="flex justify-between items-center overflow-x-auto pb-2">
                <motion.div variants={item} className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
                    {[
                        { id: 'profit-loss', label: 'Laba Rugi' },
                        { id: 'balance-sheet', label: 'Neraca' },
                        { id: 'cash-flow', label: 'Arus Kas' },
                        { id: 'capital-change', label: 'Perubahan Modal' },
                        { id: 'sales', label: 'Penjualan' },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as ReportTab)}
                            className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wide rounded transition-all duration-200 whitespace-nowrap ${activeTab === tab.id
                                ? 'bg-white text-gray-900 shadow-sm'
                                : 'text-gray-500 hover:text-gray-900'
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </motion.div>
            </div>

            {/* --- PROFIT & LOSS --- */}
            {activeTab === 'profit-loss' && (
                <motion.div
                    key="profit-loss"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-4 md:space-y-6"
                >
                    <div>
                        <h2 className="text-sm md:text-base font-bold text-gray-900 uppercase tracking-wide">Laporan Laba Rugi</h2>
                        <p className="text-xs md:text-sm text-gray-500">Tahun {new Date().getFullYear()}</p>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-900 uppercase tracking-wide">Bulan</th>
                                        <th className="px-6 py-4 text-right text-xs font-bold text-gray-900 uppercase tracking-wide">Pendapatan</th>
                                        <th className="px-6 py-4 text-right text-xs font-bold text-gray-900 uppercase tracking-wide">Beban</th>
                                        <th className="px-6 py-4 text-right text-xs font-bold text-gray-900 uppercase tracking-wide">Laba Bersih</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {profitLossData.map((report, index) => (
                                        <tr key={index} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 text-sm font-semibold text-gray-900">{report.month}</td>
                                            <td className="px-6 py-4 text-sm text-right text-gray-900 font-semibold whitespace-nowrap">
                                                {formatCurrency(report.income)}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-right text-gray-600 font-semibold whitespace-nowrap">
                                                {formatCurrency(report.expense)}
                                            </td>
                                            <td className={`px-6 py-4 text-sm text-right font-bold whitespace-nowrap ${report.profit >= 0 ? 'text-gray-900' : 'text-red-600'}`}>
                                                {formatCurrency(report.profit)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot className="bg-gray-900 border-t-2 border-gray-900">
                                    <tr>
                                        <td className="px-6 py-4 text-sm font-bold text-white uppercase tracking-wide">TOTAL</td>
                                        <td className="px-6 py-4 text-sm text-right font-bold text-white whitespace-nowrap">
                                            {formatCurrency(profitLossData.reduce((sum, r) => sum + r.income, 0))}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-right font-bold text-white whitespace-nowrap">
                                            {formatCurrency(profitLossData.reduce((sum, r) => sum + r.expense, 0))}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-right font-bold text-white whitespace-nowrap">
                                            {formatCurrency(profitLossData.reduce((sum, r) => sum + r.profit, 0))}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* --- BALANCE SHEET --- */}
            {activeTab === 'balance-sheet' && (
                <motion.div
                    key="balance-sheet"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-4 md:space-y-6"
                >
                    <div>
                        <h2 className="text-sm md:text-base font-bold text-gray-900 uppercase tracking-wide">Neraca Keuangan</h2>
                        <p className="text-xs md:text-sm text-gray-500">Per {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Assets */}
                        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Aset (Assets)</h3>
                            </div>
                            <div className="p-6 space-y-4">
                                <div className="flex justify-between items-center gap-4">
                                    <span className="text-sm text-gray-600 truncate">Kas & Bank</span>
                                    <span className="text-sm font-semibold text-gray-900 whitespace-nowrap">{formatCurrency(balanceSheetData.assets.cash)}</span>
                                </div>
                                <div className="flex justify-between items-center gap-4">
                                    <span className="text-sm text-gray-600 truncate">Piutang Usaha</span>
                                    <span className="text-sm font-semibold text-gray-900 whitespace-nowrap">{formatCurrency(balanceSheetData.assets.accountsReceivable)}</span>
                                </div>
                                <div className="pt-4 border-t border-gray-100 flex justify-between items-center gap-4">
                                    <span className="text-sm font-bold text-gray-900 uppercase truncate">Total Aset</span>
                                    <span className="text-sm font-bold text-gray-900 whitespace-nowrap">{formatCurrency(balanceSheetData.assets.total)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Liabilities & Equity */}
                        <div className="space-y-6">
                            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Kewajiban (Liabilities)</h3>
                                </div>
                                <div className="p-6 space-y-4">
                                    <div className="flex justify-between items-center gap-4">
                                        <span className="text-sm text-gray-600 truncate">Utang Usaha</span>
                                        <span className="text-sm font-semibold text-gray-900 whitespace-nowrap">{formatCurrency(balanceSheetData.liabilities.accountsPayable)}</span>
                                    </div>
                                    <div className="pt-4 border-t border-gray-100 flex justify-between items-center gap-4">
                                        <span className="text-sm font-bold text-gray-900 uppercase truncate">Total Kewajiban</span>
                                        <span className="text-sm font-bold text-gray-900 whitespace-nowrap">{formatCurrency(balanceSheetData.liabilities.total)}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Ekuitas (Equity)</h3>
                                </div>
                                <div className="p-6 space-y-4">
                                    <div className="flex justify-between items-center gap-4">
                                        <span className="text-sm text-gray-600 truncate">Modal Pemilik</span>
                                        <span className="text-sm font-semibold text-gray-900 whitespace-nowrap">{formatCurrency(balanceSheetData.equity.capital)}</span>
                                    </div>
                                    <div className="flex justify-between items-center gap-4">
                                        <span className="text-sm text-gray-600 truncate">Laba Ditahan (Tahun Berjalan)</span>
                                        <span className="text-sm font-semibold text-gray-900 whitespace-nowrap">{formatCurrency(balanceSheetData.equity.retainedEarnings)}</span>
                                    </div>
                                    <div className="pt-4 border-t border-gray-100 flex justify-between items-center gap-4">
                                        <span className="text-sm font-bold text-gray-900 uppercase truncate">Total Ekuitas</span>
                                        <span className="text-sm font-bold text-gray-900 whitespace-nowrap">{formatCurrency(balanceSheetData.equity.total)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-black text-white p-5 rounded-xl text-center shadow-lg">
                        <p className="text-sm font-bold uppercase tracking-wide">
                            Balance Check: {formatCurrency(balanceSheetData.assets.total)} = {formatCurrency(balanceSheetData.liabilities.total + balanceSheetData.equity.total)}
                        </p>
                    </div>
                </motion.div>
            )}

            {/* --- CASH FLOW --- */}
            {activeTab === 'cash-flow' && (
                <motion.div
                    key="cash-flow"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-6"
                >
                    <div>
                        <h2 className="text-sm md:text-base font-bold text-gray-900 uppercase tracking-wide">Laporan Arus Kas</h2>
                        <p className="text-xs md:text-sm text-gray-500">Metode Langsung (Simulasi)</p>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                        <div className="p-6 space-y-6">
                            <div>
                                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-4">Arus Kas dari Aktivitas Operasional</h3>
                                <div className="space-y-3 pl-4 border-l-2 border-gray-100">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-600">Penerimaan Kas dari Pelanggan</span>
                                        <span className="text-sm font-semibold text-gray-900">{formatCurrency(cashFlowData.cashIn)}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-600">Pembayaran Kas untuk Beban</span>
                                        <span className="text-sm font-semibold text-red-600">({formatCurrency(cashFlowData.cashOut)})</span>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-gray-200 flex justify-between items-center">
                                <span className="text-sm font-bold text-gray-900 uppercase">Kenaikan (Penurunan) Bersih Kas</span>
                                <span className={`text-lg font-bold ${cashFlowData.netCash >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                    {formatCurrency(cashFlowData.netCash)}
                                </span>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* --- CAPITAL CHANGE --- */}
            {activeTab === 'capital-change' && (
                <motion.div
                    key="capital-change"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-6"
                >
                    <div>
                        <h2 className="text-sm md:text-base font-bold text-gray-900 uppercase tracking-wide">Laporan Perubahan Modal</h2>
                        <p className="text-xs md:text-sm text-gray-500">Periode Berjalan</p>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                        <div className="p-6 space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">Modal Awal</span>
                                <span className="text-sm font-semibold text-gray-900">{formatCurrency(capitalChangeData.beginningCapital)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">Laba Bersih</span>
                                <span className="text-sm font-semibold text-emerald-600">{formatCurrency(capitalChangeData.netIncome)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">Prive (Penarikan)</span>
                                <span className="text-sm font-semibold text-red-600">({formatCurrency(capitalChangeData.drawings)})</span>
                            </div>
                            <div className="pt-4 border-t border-gray-200 flex justify-between items-center">
                                <span className="text-sm font-bold text-gray-900 uppercase">Modal Akhir</span>
                                <span className="text-lg font-bold text-gray-900">{formatCurrency(capitalChangeData.endingCapital)}</span>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* --- SALES REPORT --- */}
            {activeTab === 'sales' && (
                <motion.div
                    key="sales"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-6"
                >
                    <div>
                        <h2 className="text-sm md:text-base font-bold text-gray-900 uppercase tracking-wide">Laporan Penjualan</h2>
                        <p className="text-xs md:text-sm text-gray-500">Ringkasan Pendapatan</p>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                        <div className="p-6 flex justify-between items-center">
                            <div>
                                <p className="text-sm text-gray-600 mb-1">Total Penjualan Bersih</p>
                                <h3 className="text-3xl font-bold text-gray-900">{formatCurrency(salesData.totalSales)}</h3>
                            </div>
                            <div className="bg-emerald-50 p-4 rounded-full">
                                <span className="text-2xl">💰</span>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}

        </motion.div>
    );
};
