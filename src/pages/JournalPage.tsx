import { motion } from 'framer-motion';
import { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { Transaction } from '../types';
import { generateJournal } from '../lib/accounting';
import { formatCurrency } from '../lib/utils';
import { Loader2 } from 'lucide-react';

interface JournalPageProps {
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

export const JournalPage = ({ transactions }: JournalPageProps) => {
    const journalEntries = useMemo(() => {
        return generateJournal(transactions);
    }, [transactions]);

    const [displayedCount, setDisplayedCount] = useState(ITEMS_PER_PAGE);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const observerTarget = useRef<HTMLDivElement>(null);

    const displayedEntries = journalEntries.slice(0, displayedCount);
    const hasMore = displayedCount < journalEntries.length;

    const loadMore = useCallback(() => {
        if (isLoadingMore || !hasMore) return;

        setIsLoadingMore(true);
        // Simulate loading delay for smooth UX
        setTimeout(() => {
            setDisplayedCount(prev => Math.min(prev + ITEMS_PER_PAGE, journalEntries.length));
            setIsLoadingMore(false);
        }, 300);
    }, [isLoadingMore, hasMore, journalEntries.length]);

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
                <h2 className="text-xl font-bold text-gray-900 uppercase tracking-wide">Jurnal Umum</h2>
                <p className="text-sm text-gray-500">Rekaman transaksi debit dan kredit</p>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-900 uppercase tracking-wide">Tanggal</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-900 uppercase tracking-wide">Keterangan / Akun</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-900 uppercase tracking-wide">Ref</th>
                                <th className="px-6 py-4 text-right text-xs font-bold text-gray-900 uppercase tracking-wide">Debit</th>
                                <th className="px-6 py-4 text-right text-xs font-bold text-gray-900 uppercase tracking-wide">Kredit</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {journalEntries.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-500">
                                        Belum ada jurnal tercatat
                                    </td>
                                </tr>
                            ) : (
                                <>
                                    {displayedEntries.map((entry) => (
                                        <motion.tr key={entry.id} variants={item} className="group hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 align-top text-sm font-medium text-gray-900 whitespace-nowrap">
                                                {new Date(entry.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                            </td>
                                            <td className="px-6 py-4 align-top">
                                                <div className="space-y-2">
                                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">{entry.description}</p>
                                                    {entry.lines.map((line, idx) => (
                                                        <div key={idx} className={`flex justify-between text-sm ${line.credit > 0 ? 'pl-8' : ''}`}>
                                                            <span className={`${line.credit > 0 ? 'text-gray-600' : 'text-gray-900 font-medium'}`}>
                                                                {line.accountName}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 align-top">
                                                <div className="space-y-2 mt-6">
                                                    {entry.lines.map((line, idx) => (
                                                        <div key={idx} className="text-sm text-gray-500 font-mono text-xs">
                                                            {line.accountId}
                                                        </div>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 align-top text-right">
                                                <div className="space-y-2 mt-6">
                                                    {entry.lines.map((line, idx) => (
                                                        <div key={idx} className="text-sm text-gray-900 font-mono">
                                                            {line.debit > 0 ? formatCurrency(line.debit) : '-'}
                                                        </div>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 align-top text-right">
                                                <div className="space-y-2 mt-6">
                                                    {entry.lines.map((line, idx) => (
                                                        <div key={idx} className="text-sm text-gray-900 font-mono">
                                                            {line.credit > 0 ? formatCurrency(line.credit) : '-'}
                                                        </div>
                                                    ))}
                                                </div>
                                            </td>
                                        </motion.tr>
                                    ))}
                                </>
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

                {!hasMore && journalEntries.length > ITEMS_PER_PAGE && (
                    <div className="p-4 text-center border-t border-gray-100">
                        <p className="text-xs text-gray-500">
                            Menampilkan semua {journalEntries.length} entri jurnal
                        </p>
                    </div>
                )}
            </div>
        </motion.div>
    );
};
