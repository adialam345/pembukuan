import { motion, AnimatePresence } from 'framer-motion';
import { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { Transaction } from '../types';
import { generateJournal, generateLedger } from '../lib/accounting';
import { formatCurrency } from '../lib/utils';
import { Loader2 } from 'lucide-react';

interface LedgerPageProps {
    transactions: Transaction[];
}

const container = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.05
        }
    }
};

const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
};

const ITEMS_PER_PAGE = 20;

export const LedgerPage = ({ transactions }: LedgerPageProps) => {
    const ledgerAccounts = useMemo(() => {
        const journal = generateJournal(transactions);
        return generateLedger(journal);
    }, [transactions]);

    const [activeAccountCode, setActiveAccountCode] = useState<string>('');
    const [displayedCount, setDisplayedCount] = useState(ITEMS_PER_PAGE);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const observerTarget = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (ledgerAccounts.length > 0 && !activeAccountCode) {
            setActiveAccountCode(ledgerAccounts[0].code);
        }
    }, [ledgerAccounts, activeAccountCode]);

    // Reset displayed count when active account changes
    useEffect(() => {
        setDisplayedCount(ITEMS_PER_PAGE);
    }, [activeAccountCode]);

    const activeAccount = useMemo(() =>
        ledgerAccounts.find(acc => acc.code === activeAccountCode),
        [ledgerAccounts, activeAccountCode]
    );

    const displayedEntries = activeAccount ? activeAccount.entries.slice(0, displayedCount) : [];
    const hasMore = activeAccount ? displayedCount < activeAccount.entries.length : false;

    const loadMore = useCallback(() => {
        if (isLoadingMore || !hasMore || !activeAccount) return;

        setIsLoadingMore(true);
        // Simulate loading delay
        setTimeout(() => {
            setDisplayedCount(prev => Math.min(prev + ITEMS_PER_PAGE, activeAccount.entries.length));
            setIsLoadingMore(false);
        }, 300);
    }, [isLoadingMore, hasMore, activeAccount]);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
                    loadMore();
                }
            },
            { threshold: 0.1 }
        );

        const currentTarget = observerTarget.current;
        if (currentTarget) {
            observer.observe(currentTarget);
        }

        return () => {
            if (currentTarget) {
                observer.unobserve(currentTarget);
            }
        };
    }, [hasMore, isLoadingMore, loadMore]);

    return (
        <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="space-y-6"
        >
            <div>
                <h2 className="text-xl font-bold text-gray-900 uppercase tracking-wide">Buku Besar</h2>
                <p className="text-sm text-gray-500">Rincian saldo per akun</p>
            </div>

            {/* Account Tabs */}
            <div className="flex justify-between items-center overflow-x-auto pb-2">
                <motion.div variants={item} className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
                    {ledgerAccounts.map((account) => (
                        <button
                            key={account.code}
                            onClick={() => setActiveAccountCode(account.code)}
                            className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wide rounded transition-all duration-200 whitespace-nowrap ${activeAccountCode === account.code
                                    ? 'bg-white text-gray-900 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-900'
                                }`}
                        >
                            {account.name}
                        </button>
                    ))}
                </motion.div>
            </div>

            {/* Active Account Details */}
            <AnimatePresence mode="wait">
                {activeAccount && (
                    <motion.div
                        key={activeAccount.code}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ duration: 0.2 }}
                        className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm"
                    >
                        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                            <div>
                                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">{activeAccount.name}</h3>
                                <p className="text-xs text-gray-500 font-mono">{activeAccount.code}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-gray-500 uppercase tracking-wide">Saldo Akhir</p>
                                <p className={`text-lg font-bold ${activeAccount.balance < 0 ? 'text-red-600' : 'text-gray-900'}`}>
                                    {formatCurrency(activeAccount.balance)}
                                </p>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50/50 border-b border-gray-100">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wide">Tanggal</th>
                                        <th className="px-6 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wide">Keterangan</th>
                                        <th className="px-6 py-3 text-right text-[10px] font-bold text-gray-500 uppercase tracking-wide">Debit</th>
                                        <th className="px-6 py-3 text-right text-[10px] font-bold text-gray-500 uppercase tracking-wide">Kredit</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {activeAccount.entries.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-4 text-center text-xs text-gray-400 italic">
                                                Tidak ada transaksi
                                            </td>
                                        </tr>
                                    ) : (
                                        displayedEntries.map((entry, idx) => (
                                            <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-3 text-xs text-gray-900 whitespace-nowrap">
                                                    {new Date(entry.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                </td>
                                                <td className="px-6 py-3 text-xs text-gray-600">
                                                    {entry.description}
                                                </td>
                                                <td className="px-6 py-3 text-xs text-right text-gray-900 font-mono">
                                                    {entry.debit > 0 ? formatCurrency(entry.debit) : '-'}
                                                </td>
                                                <td className="px-6 py-3 text-xs text-right text-gray-900 font-mono">
                                                    {entry.credit > 0 ? formatCurrency(entry.credit) : '-'}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Infinite Scroll Trigger */}
                        {hasMore && (
                            <div ref={observerTarget} className="p-6 flex justify-center border-t border-gray-100">
                                {isLoadingMore && (
                                    <div className="flex items-center gap-2 text-gray-500">
                                        <Loader2 className="animate-spin" size={18} />
                                        <span className="text-sm">Memuat lebih banyak...</span>
                                    </div>
                                )}
                            </div>
                        )}

                        {!hasMore && activeAccount.entries.length > ITEMS_PER_PAGE && (
                            <div className="p-4 text-center border-t border-gray-100">
                                <p className="text-xs text-gray-500">
                                    Menampilkan semua {activeAccount.entries.length} transaksi
                                </p>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};
