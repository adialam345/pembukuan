import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, Search, Filter } from 'lucide-react';
import { formatCurrency } from '../lib/utils';
import { Transaction } from '../types';

interface TransactionsPageProps {
    transactions: Transaction[];
    loading: boolean;
    setShowAddTransaction: (show: boolean) => void;
    handleDeleteTransaction: (id: string) => void;
    handleMarkAsPaid: (id: string) => void;
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

export const TransactionsPage = ({
    transactions,
    loading,
    setShowAddTransaction,
    handleDeleteTransaction,
    handleMarkAsPaid,
}: TransactionsPageProps) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
    const [filterStatus, setFilterStatus] = useState<'all' | 'paid' | 'unpaid'>('all');
    const [filterMonth, setFilterMonth] = useState<string>('all');

    const filteredTransactions = transactions.filter((t) => {
        const matchesSearch = t.description.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesType = filterType === 'all' || t.type === filterType;
        const matchesStatus = filterStatus === 'all' || t.payment_status === filterStatus;

        let matchesMonth = true;
        if (filterMonth !== 'all') {
            const date = new Date(t.date);
            matchesMonth = date.getMonth() === parseInt(filterMonth);
        }

        return matchesSearch && matchesType && matchesStatus && matchesMonth;
    });

    return (
        <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="space-y-3"
        >
            <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Transaksi</h2>
                <button
                    onClick={() => setShowAddTransaction(true)}
                    className="flex items-center gap-1 bg-black text-white px-3 py-1.5 rounded text-xs font-semibold uppercase tracking-wide"
                >
                    <Plus size={14} strokeWidth={3} />
                    Tambah
                </button>
            </div>

            {/* Search and Filters */}
            <div className="bg-white p-4 md:p-6 rounded-xl border border-gray-200 space-y-4 md:space-y-6">
                <div className="relative">
                    <Search className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Cari transaksi..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 md:pl-12 pr-4 py-2.5 md:py-3 text-xs md:text-sm border border-gray-300 rounded-xl focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-colors"
                    />
                </div>

                <div className="flex flex-col md:flex-row gap-4">
                    {/* Month Filter */}
                    <div className="relative md:w-48">
                        <select
                            value={filterMonth}
                            onChange={(e) => setFilterMonth(e.target.value)}
                            className="w-full appearance-none bg-gray-50 pl-4 pr-10 py-2.5 md:py-3 text-xs md:text-sm font-medium rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-200 border border-gray-200"
                        >
                            <option value="all">Semua Bulan</option>
                            {Array.from({ length: 12 }, (_, i) => {
                                const date = new Date(new Date().getFullYear(), i, 1);
                                return (
                                    <option key={i} value={i.toString()}>
                                        {date.toLocaleDateString('id-ID', { month: 'long' })}
                                    </option>
                                );
                            })}
                        </select>
                        <Filter className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" size={14} />
                    </div>

                    {/* Type Filter */}
                    <div className="flex bg-gray-100 p-1.5 rounded-xl">
                        {(['all', 'income', 'expense'] as const).map((type) => (
                            <button
                                key={type}
                                onClick={() => setFilterType(type)}
                                className={`relative px-4 py-2 text-xs md:text-sm font-medium rounded-lg transition-colors ${filterType === type ? 'text-gray-900' : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                {filterType === type && (
                                    <motion.div
                                        layoutId="filterType"
                                        className="absolute inset-0 bg-white rounded-lg shadow-sm"
                                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                    />
                                )}
                                <span className="relative z-10">
                                    {type === 'all' ? 'Semua' : type === 'income' ? 'Pemasukan' : 'Pengeluaran'}
                                </span>
                            </button>
                        ))}
                    </div>

                    {/* Status Filter */}
                    <div className="flex bg-gray-100 p-1.5 rounded-xl">
                        {(['all', 'paid', 'unpaid'] as const).map((status) => (
                            <button
                                key={status}
                                onClick={() => setFilterStatus(status)}
                                className={`relative px-4 py-2 text-xs md:text-sm font-medium rounded-lg transition-colors ${filterStatus === status ? 'text-gray-900' : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                {filterStatus === status && (
                                    <motion.div
                                        layoutId="filterStatus"
                                        className="absolute inset-0 bg-white rounded-lg shadow-sm"
                                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                    />
                                )}
                                <span className="relative z-10">
                                    {status === 'all' ? 'Semua' : status === 'paid' ? 'Lunas' : 'Belum Lunas'}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
                {loading ? (
                    <p className="text-gray-500 text-center py-12 text-sm">Memuat...</p>
                ) : filteredTransactions.length === 0 ? (
                    <p className="text-gray-500 text-center py-12 text-sm">
                        {transactions.length === 0 ? 'Belum ada transaksi' : 'Tidak ada transaksi yang cocok'}
                    </p>
                ) : (
                    filteredTransactions.map((transaction) => (
                        <motion.div variants={item} key={transaction.id} className="p-4 md:p-6 hover:bg-gray-50 transition-colors">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between md:justify-start gap-4 mb-2 md:mb-1">
                                        <p className="font-bold text-sm md:text-base text-gray-900">{transaction.description}</p>
                                        <button onClick={() => handleDeleteTransaction(transaction.id)} className="md:hidden text-gray-400 hover:text-gray-900">
                                            <Trash2 size={16} strokeWidth={2} />
                                        </button>
                                    </div>
                                    <p className="text-xs md:text-sm text-gray-500">
                                        {new Date(transaction.date).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                    </p>
                                </div>

                                <div className="flex items-center justify-between md:justify-end gap-4 md:gap-8">
                                    <div className="flex items-center gap-2">
                                        <span className={`text-xs md:text-sm px-2.5 py-1 rounded-lg font-medium border ${transaction.type === 'income'
                                                ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                                : 'bg-rose-50 text-rose-700 border-rose-100'
                                            }`}>
                                            {transaction.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}
                                        </span>
                                        <span className={`text-xs md:text-sm px-2.5 py-1 rounded-lg font-medium ${transaction.payment_status === 'paid'
                                                ? 'bg-gray-100 text-gray-700 border border-gray-200'
                                                : 'bg-gray-900 text-white'
                                            }`}>
                                            {transaction.payment_status === 'paid' ? 'Lunas' : 'Belum Lunas'}
                                        </span>
                                        {transaction.payment_status === 'unpaid' && (
                                            <button
                                                onClick={() => handleMarkAsPaid(transaction.id)}
                                                className="text-xs md:text-sm px-3 py-1 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors shadow-sm"
                                            >
                                                Lunasi
                                            </button>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-6">
                                        <p className={`text-sm md:text-base font-bold ${transaction.type === 'income' ? 'text-emerald-600' : 'text-rose-600'
                                            }`}>
                                            {transaction.type === 'income' ? '+' : '-'}{formatCurrency(Number(transaction.amount))}
                                        </p>
                                        <button onClick={() => handleDeleteTransaction(transaction.id)} className="hidden md:block text-gray-400 hover:text-red-500 transition-colors">
                                            <Trash2 size={18} strokeWidth={2} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>
        </motion.div>
    );
};
