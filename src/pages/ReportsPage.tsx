import { motion } from 'framer-motion';
import { useMemo, useState } from 'react';
import { formatCurrency } from '../lib/utils';
import { Transaction } from '../types';

interface ReportsPageProps {
    transactions: Transaction[];
}

type ReportTab = 'profit-loss' | 'balance-sheet';

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

    const profitLossData = useMemo(() => {
        const months = [
            'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
            'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
        ];

        const currentYear = new Date().getFullYear();
        const reports: Array<{
            month: string;
            income: number;
            expense: number;
            profit: number;
        }> = [];

        for (let i = 11; i >= 0; i--) {
            const monthIndex = (new Date().getMonth() - i + 12) % 12;
            const monthName = months[monthIndex];

            const monthTransactions = transactions.filter((t) => {
                const date = new Date(t.date);
                return date.getMonth() === monthIndex &&
                    date.getFullYear() === currentYear;
            });

            const income = monthTransactions
                .filter((t) => t.type === 'income')
                .reduce((sum, t) => sum + Number(t.amount), 0);

            const expense = monthTransactions
                .filter((t) => t.type === 'expense')
                .reduce((sum, t) => sum + Number(t.amount), 0);

            reports.push({
                month: monthName,
                income,
                expense,
                profit: income - expense,
            });
        }

        return reports.reverse();
    }, [transactions]);

    const balanceSheetData = useMemo(() => {
        // Assets
        const cash = transactions
            .filter(t => t.payment_status === 'paid')
            .reduce((sum, t) => sum + (t.type === 'income' ? Number(t.amount) : -Number(t.amount)), 0);

        const accountsReceivable = transactions
            .filter(t => t.type === 'income' && t.payment_status === 'unpaid')
            .reduce((sum, t) => sum + Number(t.amount), 0);

        const totalAssets = cash + accountsReceivable;

        // Liabilities
        const accountsPayable = transactions
            .filter(t => t.type === 'expense' && t.payment_status === 'unpaid')
            .reduce((sum, t) => sum + Number(t.amount), 0);

        const totalLiabilities = accountsPayable;

        // Equity
        // Equity = Assets - Liabilities
        const equity = totalAssets - totalLiabilities;

        return {
            assets: {
                cash,
                accountsReceivable,
                total: totalAssets
            },
            liabilities: {
                accountsPayable,
                total: totalLiabilities
            },
            equity: {
                retainedEarnings: equity,
                total: equity
            }
        };
    }, [transactions]);

    return (
        <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="space-y-3 overflow-x-hidden max-w-full"
        >
            <div className="flex justify-between items-center">
                <motion.div variants={item} className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
                    <button
                        onClick={() => setActiveTab('profit-loss')}
                        className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wide rounded transition-all duration-200 ${activeTab === 'profit-loss'
                            ? 'bg-white text-gray-900 shadow-sm'
                            : 'text-gray-500 hover:text-gray-900'
                            }`}
                    >
                        Laba Rugi
                    </button>
                    <button
                        onClick={() => setActiveTab('balance-sheet')}
                        className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wide rounded transition-all duration-200 ${activeTab === 'balance-sheet'
                            ? 'bg-white text-gray-900 shadow-sm'
                            : 'text-gray-500 hover:text-gray-900'
                            }`}
                    >
                        Neraca
                    </button>
                </motion.div>
            </div>

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
                                        <th className="px-2 md:px-6 py-2 md:py-4 text-left text-[10px] md:text-sm font-bold text-gray-900 uppercase tracking-wide">Bulan</th>
                                        <th className="px-2 md:px-6 py-2 md:py-4 text-right text-[10px] md:text-sm font-bold text-gray-900 uppercase tracking-wide">
                                            <span className="hidden md:inline">Pendapatan</span>
                                            <span className="md:hidden">Masuk</span>
                                        </th>
                                        <th className="px-2 md:px-6 py-2 md:py-4 text-right text-[10px] md:text-sm font-bold text-gray-900 uppercase tracking-wide">
                                            <span className="hidden md:inline">Beban</span>
                                            <span className="md:hidden">Keluar</span>
                                        </th>
                                        <th className="px-2 md:px-6 py-2 md:py-4 text-right text-[10px] md:text-sm font-bold text-gray-900 uppercase tracking-wide">
                                            <span className="hidden md:inline">Laba Bersih</span>
                                            <span className="md:hidden">Laba</span>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {profitLossData.map((report, index) => (
                                        <tr key={index} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-2 md:px-6 py-2 md:py-4 text-[10px] md:text-sm font-semibold text-gray-900">{report.month}</td>
                                            <td className="px-2 md:px-6 py-2 md:py-4 text-[10px] md:text-sm text-right text-gray-900 font-semibold whitespace-nowrap">
                                                {formatCurrency(report.income)}
                                            </td>
                                            <td className="px-2 md:px-6 py-2 md:py-4 text-[10px] md:text-sm text-right text-gray-600 font-semibold whitespace-nowrap">
                                                {formatCurrency(report.expense)}
                                            </td>
                                            <td className={`px-2 md:px-6 py-2 md:py-4 text-[10px] md:text-sm text-right font-bold whitespace-nowrap ${report.profit >= 0 ? 'text-gray-900' : 'text-red-600'}`}>
                                                {formatCurrency(report.profit)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot className="bg-gray-900 border-t-2 border-gray-900">
                                    <tr>
                                        <td className="px-2 md:px-6 py-2 md:py-4 text-[10px] md:text-sm font-bold text-white uppercase tracking-wide">TOTAL</td>
                                        <td className="px-2 md:px-6 py-2 md:py-4 text-[10px] md:text-sm text-right font-bold text-white whitespace-nowrap">
                                            {formatCurrency(profitLossData.reduce((sum, r) => sum + r.income, 0))}
                                        </td>
                                        <td className="px-2 md:px-6 py-2 md:py-4 text-[10px] md:text-sm text-right font-bold text-white whitespace-nowrap">
                                            {formatCurrency(profitLossData.reduce((sum, r) => sum + r.expense, 0))}
                                        </td>
                                        <td className="px-2 md:px-6 py-2 md:py-4 text-[10px] md:text-sm text-right font-bold text-white whitespace-nowrap">
                                            {formatCurrency(profitLossData.reduce((sum, r) => sum + r.profit, 0))}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>
                </motion.div>
            )}

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

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                        {/* Assets */}
                        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                            <div className="bg-gray-50 px-4 md:px-6 py-3 md:py-4 border-b border-gray-200">
                                <h3 className="text-xs md:text-sm font-bold text-gray-900 uppercase tracking-wide">Aset (Assets)</h3>
                            </div>
                            <div className="p-4 md:p-6 space-y-3 md:space-y-4">
                                <div className="flex justify-between items-center gap-4">
                                    <span className="text-xs md:text-sm text-gray-600 truncate">Kas & Bank</span>
                                    <span className="text-xs md:text-sm font-semibold text-gray-900 whitespace-nowrap">{formatCurrency(balanceSheetData.assets.cash)}</span>
                                </div>
                                <div className="flex justify-between items-center gap-4">
                                    <span className="text-xs md:text-sm text-gray-600 truncate">Piutang Usaha</span>
                                    <span className="text-xs md:text-sm font-semibold text-gray-900 whitespace-nowrap">{formatCurrency(balanceSheetData.assets.accountsReceivable)}</span>
                                </div>
                                <div className="pt-3 md:pt-4 border-t border-gray-100 flex justify-between items-center gap-4">
                                    <span className="text-xs md:text-sm font-bold text-gray-900 uppercase truncate">Total Aset</span>
                                    <span className="text-xs md:text-sm font-bold text-gray-900 whitespace-nowrap">{formatCurrency(balanceSheetData.assets.total)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Liabilities & Equity */}
                        <div className="space-y-4 md:space-y-6">
                            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                                <div className="bg-gray-50 px-4 md:px-6 py-3 md:py-4 border-b border-gray-200">
                                    <h3 className="text-xs md:text-sm font-bold text-gray-900 uppercase tracking-wide">Kewajiban (Liabilities)</h3>
                                </div>
                                <div className="p-4 md:p-6 space-y-3 md:space-y-4">
                                    <div className="flex justify-between items-center gap-4">
                                        <span className="text-xs md:text-sm text-gray-600 truncate">Utang Usaha</span>
                                        <span className="text-xs md:text-sm font-semibold text-gray-900 whitespace-nowrap">{formatCurrency(balanceSheetData.liabilities.accountsPayable)}</span>
                                    </div>
                                    <div className="pt-3 md:pt-4 border-t border-gray-100 flex justify-between items-center gap-4">
                                        <span className="text-xs md:text-sm font-bold text-gray-900 uppercase truncate">Total Kewajiban</span>
                                        <span className="text-xs md:text-sm font-bold text-gray-900 whitespace-nowrap">{formatCurrency(balanceSheetData.liabilities.total)}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                                <div className="bg-gray-50 px-4 md:px-6 py-3 md:py-4 border-b border-gray-200">
                                    <h3 className="text-xs md:text-sm font-bold text-gray-900 uppercase tracking-wide">Ekuitas (Equity)</h3>
                                </div>
                                <div className="p-4 md:p-6 space-y-3 md:space-y-4">
                                    <div className="flex justify-between items-center gap-4">
                                        <span className="text-xs md:text-sm text-gray-600 truncate">Laba Ditahan</span>
                                        <span className="text-xs md:text-sm font-semibold text-gray-900 whitespace-nowrap">{formatCurrency(balanceSheetData.equity.retainedEarnings)}</span>
                                    </div>
                                    <div className="pt-3 md:pt-4 border-t border-gray-100 flex justify-between items-center gap-4">
                                        <span className="text-xs md:text-sm font-bold text-gray-900 uppercase truncate">Total Ekuitas</span>
                                        <span className="text-xs md:text-sm font-bold text-gray-900 whitespace-nowrap">{formatCurrency(balanceSheetData.equity.total)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-black text-white p-4 md:p-5 rounded-xl text-center shadow-lg">
                        <p className="text-xs md:text-sm font-bold uppercase tracking-wide">
                            Balance Check: {formatCurrency(balanceSheetData.assets.total)} = {formatCurrency(balanceSheetData.liabilities.total + balanceSheetData.equity.total)}
                        </p>
                    </div>
                </motion.div>
            )}
        </motion.div>
    );
};
