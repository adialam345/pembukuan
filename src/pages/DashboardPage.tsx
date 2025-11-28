import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, DollarSign, AlertCircle, ArrowUpRight, ArrowDownRight, Wallet } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { formatCurrency } from '../lib/utils';
import { Transaction } from '../types';

interface DashboardPageProps {
    currentMonthStats: { income: number; expenses: number; profit: number };
    stats: { unpaid: number };
    monthlyData: any[];
    loading: boolean;
    transactions: Transaction[];
}

// Optimized animations for better performance
const container = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.03,
            delayChildren: 0
        }
    }
};

const item = {
    hidden: { opacity: 0, y: 8 },
    show: { opacity: 1, y: 0 }
};

const ITEMS_PER_PAGE = 5;


export const DashboardPage = ({
    currentMonthStats,
    stats,
    monthlyData,
    loading,
    transactions,
}: DashboardPageProps) => {
    const [displayedCount, setDisplayedCount] = useState(ITEMS_PER_PAGE);
    const observerTarget = useRef<HTMLDivElement>(null);

    const displayedTransactions = transactions.slice(0, displayedCount);
    const hasMore = displayedCount < transactions.length;

    // Load more items smoothly without loading indicator
    const loadMore = useCallback(() => {
        if (!hasMore) return;
        setDisplayedCount(prev => Math.min(prev + ITEMS_PER_PAGE, transactions.length));
    }, [hasMore, transactions.length]);

    // Intersection Observer for infinite scroll
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMore) {
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
    }, [hasMore, loadMore]);

    return (
        <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="space-y-6"
        >
            {/* Hero Stats Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Main Profit Card */}
                <motion.div variants={item} className="md:col-span-3 relative overflow-hidden rounded-2xl bg-zinc-900 text-white shadow-xl">
                    {/* Background Gradients & Patterns */}
                    <div className="absolute top-0 right-0 -mt-10 -mr-10 h-64 w-64 rounded-full bg-gradient-to-br from-emerald-500/20 to-teal-500/0 blur-3xl" />
                    <div className="absolute bottom-0 left-0 -mb-10 -ml-10 h-64 w-64 rounded-full bg-gradient-to-tr from-blue-500/20 to-purple-500/0 blur-3xl" />

                    <div className="relative z-10 p-6 md:p-10">
                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="p-2 bg-zinc-800 rounded-lg">
                                        <Wallet size={18} className="text-emerald-400" />
                                    </div>
                                    <p className="text-zinc-400 text-sm font-medium uppercase tracking-wider">Total Profit Bulan Ini</p>
                                </div>
                                <h2 className="text-4xl md:text-6xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-zinc-400">
                                    {formatCurrency(currentMonthStats.profit)}
                                </h2>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full md:w-auto">
                                <div className="flex items-center gap-4 bg-zinc-800/50 border border-zinc-700/50 px-5 py-4 rounded-xl backdrop-blur-sm hover:bg-zinc-800 transition-colors">
                                    <div className="bg-emerald-500/10 p-2.5 rounded-full shrink-0">
                                        <ArrowUpRight size={20} className="text-emerald-400" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-xs text-zinc-400 font-medium uppercase">Pemasukan</p>
                                        <p className="text-base md:text-lg font-bold text-emerald-400 truncate">{formatCurrency(currentMonthStats.income)}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 bg-zinc-800/50 border border-zinc-700/50 px-5 py-4 rounded-xl backdrop-blur-sm hover:bg-zinc-800 transition-colors">
                                    <div className="bg-rose-500/10 p-2.5 rounded-full shrink-0">
                                        <ArrowDownRight size={20} className="text-rose-400" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-xs text-zinc-400 font-medium uppercase">Pengeluaran</p>
                                        <p className="text-base md:text-lg font-bold text-rose-400 truncate">{formatCurrency(currentMonthStats.expenses)}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Secondary Stats */}
                <motion.div variants={item} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-gray-500 text-xs md:text-sm font-bold uppercase tracking-wide">Piutang (Unpaid)</p>
                            <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mt-2">{formatCurrency(stats.unpaid)}</h3>
                        </div>
                        <div className="bg-orange-50 p-3 rounded-xl">
                            <AlertCircle className="text-orange-600" size={24} />
                        </div>
                    </div>
                    <div className="mt-4 text-sm text-gray-500">
                        Menunggu pembayaran
                    </div>
                </motion.div>

                <motion.div variants={item} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-gray-500 text-xs md:text-sm font-bold uppercase tracking-wide">Margin Profit</p>
                            <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mt-2">
                                {currentMonthStats.income > 0
                                    ? `${((currentMonthStats.profit / currentMonthStats.income) * 100).toFixed(1)}%`
                                    : '0%'}
                            </h3>
                        </div>
                        <div className="bg-blue-50 p-3 rounded-xl">
                            <TrendingUp className="text-blue-600" size={24} />
                        </div>
                    </div>
                    <div className="mt-4 text-sm text-gray-500">
                        Dari total pemasukan
                    </div>
                </motion.div>

                <motion.div variants={item} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-gray-500 text-xs md:text-sm font-bold uppercase tracking-wide">Transaksi</p>
                            <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mt-2">
                                {transactions.length}
                            </h3>
                        </div>
                        <div className="bg-purple-50 p-3 rounded-xl">
                            <DollarSign className="text-purple-600" size={24} />
                        </div>
                    </div>
                    <div className="mt-4 text-sm text-gray-500">
                        Total transaksi tercatat
                    </div>
                </motion.div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <motion.div variants={item} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="mb-6">
                        <h3 className="text-lg font-bold text-gray-900">Arus Kas</h3>
                        <p className="text-sm text-gray-500">Perbandingan Pemasukan & Pengeluaran</p>
                    </div>
                    <div className="h-[250px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={monthlyData}>
                                <defs>
                                    <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#EF4444" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} dy={10} />
                                <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} dx={-10} tickFormatter={(value) => `${value / 1000}k`} />
                                <Tooltip
                                    formatter={(value) => formatCurrency(Number(value))}
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Area type="monotone" dataKey="Pemasukan" stroke="#10B981" strokeWidth={2} fillOpacity={1} fill="url(#colorIncome)" />
                                <Area type="monotone" dataKey="Pengeluaran" stroke="#EF4444" strokeWidth={2} fillOpacity={1} fill="url(#colorExpense)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                <motion.div variants={item} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="mb-6">
                        <h3 className="text-lg font-bold text-gray-900">Tren Profit</h3>
                        <p className="text-sm text-gray-500">Kinerja profit bulanan</p>
                    </div>
                    <div className="h-[250px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={monthlyData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} dy={10} />
                                <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} dx={-10} tickFormatter={(value) => `${value / 1000}k`} />
                                <Tooltip
                                    formatter={(value) => formatCurrency(Number(value))}
                                    cursor={{ fill: '#f9fafb' }}
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Bar dataKey="Profit" fill="#18181b" radius={[4, 4, 0, 0]} barSize={30} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>
            </div>

            {/* Recent Transactions with Infinite Scroll */}
            <motion.div variants={item} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">Transaksi Terbaru</h3>
                        <p className="text-sm text-gray-500">
                            {displayedCount < transactions.length
                                ? `Menampilkan ${displayedCount} dari ${transactions.length} transaksi`
                                : `${transactions.length} transaksi`
                            }
                        </p>
                    </div>
                </div>
                <div className="divide-y divide-gray-50">
                    {loading ? (
                        <p className="text-gray-500 text-center py-10 text-sm">Memuat data...</p>
                    ) : transactions.length === 0 ? (
                        <p className="text-gray-500 text-center py-10 text-sm">Belum ada transaksi</p>
                    ) : (
                        <>
                            {displayedTransactions.map((transaction) => (
                                <div key={transaction.id} className="p-4 hover:bg-gray-50 transition-colors flex items-center justify-between group">
                                    <div className="flex items-center gap-4">
                                        <div className={`p-3 rounded-full ${transaction.type === 'income' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                                            }`}>
                                            {transaction.type === 'income' ? <ArrowUpRight size={18} /> : <ArrowDownRight size={18} />}
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm text-gray-900 group-hover:text-black transition-colors">{transaction.description}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-xs text-gray-500">
                                                    {new Date(transaction.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                                                </span>
                                                {transaction.payment_status === 'unpaid' && (
                                                    <span className="text-[10px] px-1.5 py-0.5 bg-orange-100 text-orange-700 rounded-full font-medium">
                                                        Unpaid
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className={`text-sm font-bold ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                                            }`}>
                                            {transaction.type === 'income' ? '+' : '-'}{formatCurrency(Number(transaction.amount))}
                                        </p>
                                    </div>
                                </div>
                            ))}

                            {/* Invisible trigger for infinite scroll - smooth without loading indicator */}
                            {hasMore && <div ref={observerTarget} className="h-1" />}
                        </>
                    )}
                </div>
            </motion.div>
        </motion.div>
    );
};
