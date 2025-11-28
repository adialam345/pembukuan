import { useState, useEffect, useMemo } from 'react';
import { AnimatePresence } from 'framer-motion';
import { PageTransition } from './components/PageTransition';
import {
  Home,
  Receipt,
  Briefcase,
  FileText,
} from 'lucide-react';

import { supabase } from './lib/supabase';
import { Service, Transaction, NavPage } from './types';
import { Modal } from './components/Modal';
import { DashboardPage } from './pages/DashboardPage';
import { TransactionsPage } from './pages/TransactionsPage';
import { ServicesPage } from './pages/ServicesPage';
import { ReportsPage } from './pages/ReportsPage';
import { JournalPage } from './pages/JournalPage';
import { LedgerPage } from './pages/LedgerPage';

function App() {
  const [currentPage, setCurrentPage] = useState<NavPage>('dashboard');
  const [services, setServices] = useState<Service[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [showAddService, setShowAddService] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const [newTransaction, setNewTransaction] = useState({
    date: new Date().toISOString().split('T')[0],
    description: '',
    amount: '',
    type: 'income' as 'income' | 'expense',
    payment_status: 'paid' as 'paid' | 'unpaid',
  });

  const [newService, setNewService] = useState({
    name: '',
    price: '',
  });

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [servicesResult, transactionsResult] = await Promise.all([
        supabase.from('services').select('*').order('created_at', { ascending: false }),
        supabase.from('transactions').select('*').order('date', { ascending: false }),
      ]);

      if (servicesResult.data) setServices(servicesResult.data);
      if (transactionsResult.data) setTransactions(transactionsResult.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const stats = useMemo(() => {
    const income = transactions
      .filter((t) => t.type === 'income' && t.payment_status === 'paid')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const expenses = transactions
      .filter((t) => t.type === 'expense' && t.payment_status === 'paid')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const unpaid = transactions
      .filter((t) => t.type === 'income' && t.payment_status === 'unpaid')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const profit = income - expenses;

    return { income, expenses, profit, unpaid };
  }, [transactions]);

  const monthlyData = useMemo(() => {
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
      'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
    ];

    const currentYear = new Date().getFullYear();
    const monthlyStats: Record<string, { income: number; expense: number }> = {};

    months.forEach((_, index) => {
      monthlyStats[index] = { income: 0, expense: 0 };
    });

    transactions.forEach((t) => {
      const date = new Date(t.date);
      if (date.getFullYear() === currentYear && t.payment_status === 'paid') {
        const month = date.getMonth();
        if (t.type === 'income') {
          monthlyStats[month].income += Number(t.amount);
        } else {
          monthlyStats[month].expense += Number(t.amount);
        }
      }
    });

    return months.map((month, index) => ({
      name: month,
      Pemasukan: monthlyStats[index].income,
      Pengeluaran: monthlyStats[index].expense,
      Profit: monthlyStats[index].income - monthlyStats[index].expense,
    }));
  }, [transactions]);

  const currentMonthStats = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const monthTransactions = transactions.filter((t) => {
      const date = new Date(t.date);
      return date.getMonth() === currentMonth &&
        date.getFullYear() === currentYear &&
        t.payment_status === 'paid';
    });

    const income = monthTransactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const expenses = monthTransactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    return { income, expenses, profit: income - expenses };
  }, [transactions]);

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Adding transaction:', newTransaction);
    try {
      const { data, error } = await supabase.from('transactions').insert([
        {
          date: newTransaction.date,
          description: newTransaction.description,
          amount: parseFloat(newTransaction.amount),
          type: newTransaction.type,
          payment_status: newTransaction.payment_status,
        },
      ]).select();

      console.log('Insert result:', { data, error });

      if (error) {
        console.error('Supabase error:', error);
        alert('Error menambahkan transaksi: ' + error.message);
      } else {
        console.log('Transaction added successfully:', data);
        setShowAddTransaction(false);
        setNewTransaction({
          date: new Date().toISOString().split('T')[0],
          description: '',
          amount: '',
          type: 'income',
          payment_status: 'paid',
        });
        await fetchData();
      }
    } catch (error) {
      console.error('Error adding transaction:', error);
      alert('Error: ' + (error as Error).message);
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    // Optimistic update
    const previousTransactions = [...transactions];
    setTransactions((prev) => prev.filter((t) => t.id !== id));

    try {
      const { error } = await supabase.from('transactions').delete().eq('id', id);
      if (error) {
        // Revert on error
        console.error('Error deleting transaction:', error);
        setTransactions(previousTransactions);
        fetchData();
      }
    } catch (error) {
      console.error('Error deleting transaction:', error);
      setTransactions(previousTransactions);
      fetchData();
    }
  };

  const handleAddService = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from('services').insert([
        {
          name: newService.name,
          price: parseFloat(newService.price),
        },
      ]);

      if (!error) {
        setShowAddService(false);
        setNewService({ name: '', price: '' });
        fetchData();
      }
    } catch (error) {
      console.error('Error adding service:', error);
    }
  };

  const handleDeleteService = async (id: string) => {
    // Optimistic update
    const previousServices = [...services];
    setServices((prev) => prev.filter((s) => s.id !== id));

    try {
      const { error } = await supabase.from('services').delete().eq('id', id);
      if (error) {
        // Revert on error
        console.error('Error deleting service:', error);
        setServices(previousServices);
        fetchData();
      }
    } catch (error) {
      console.error('Error deleting service:', error);
      setServices(previousServices);
      fetchData();
    }
  };

  const useServiceForTransaction = (service: Service) => {
    setNewTransaction({
      ...newTransaction,
      description: service.name,
      amount: service.price.toString(),
    });
    setShowAddService(false);
    setShowAddTransaction(true);
  };

  const handleMarkAsPaid = async (id: string) => {
    // Optimistic update to prevent layout shift/scroll reset
    setTransactions((prev) =>
      prev.map((t) => (t.id === id ? { ...t, payment_status: 'paid' } : t))
    );

    try {
      const { error } = await supabase
        .from('transactions')
        .update({ payment_status: 'paid' })
        .eq('id', id);

      if (error) {
        // Revert on error by refetching
        console.error('Error updating transaction:', error);
        fetchData();
      }
    } catch (error) {
      console.error('Error updating transaction:', error);
      fetchData();
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="flex">
        {!isMobile && (
          <aside className="w-64 bg-white h-screen sticky top-0 border-r border-gray-200 flex flex-col">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="bg-black p-2 rounded-lg">
                  <Receipt className="text-white" size={20} strokeWidth={2.5} />
                </div>
                <div>
                  <h1 className="text-base font-bold text-gray-900 uppercase tracking-wide">Pembukuan</h1>
                  <p className="text-xs text-gray-500 font-medium">Jasa Service</p>
                </div>
              </div>
            </div>

            <nav className="p-4 space-y-1 flex-1">
              {[
                { page: 'dashboard', icon: Home, label: 'Dashboard' },
                { page: 'transactions', icon: Receipt, label: 'Transaksi' },
                { page: 'journal', icon: FileText, label: 'Jurnal Umum' },
                { page: 'ledger', icon: Briefcase, label: 'Buku Besar' },
                { page: 'services', icon: Briefcase, label: 'Layanan' },
                { page: 'reports', icon: FileText, label: 'Laporan' },
              ].map(({ page, icon: Icon, label }) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page as NavPage)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold uppercase tracking-wide transition-all duration-200 ${currentPage === page
                    ? 'bg-black text-white shadow-lg shadow-gray-200'
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                >
                  <Icon size={18} strokeWidth={2.5} />
                  <span>{label}</span>
                </button>
              ))}
            </nav>

            <div className="p-4 border-t border-gray-200">
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs text-gray-500 text-center font-medium">
                  &copy; {new Date().getFullYear()} Service Bookkeeping
                </p>
              </div>
            </div>
          </aside>
        )}

        <main className={`flex-1 min-w-0 bg-gray-50/50 ${isMobile ? 'pb-14' : ''}`}>
          {isMobile && (
            <header className="bg-white sticky top-0 z-50 border-b border-gray-200">
              <div className="px-3 py-2.5">
                <div className="flex items-center gap-2">
                  <div className="bg-black p-1.5 rounded">
                    <Receipt className="text-white" size={14} strokeWidth={2.5} />
                  </div>
                  <h1 className="text-xs font-bold text-gray-900 uppercase tracking-wide">Pembukuan Jasa</h1>
                </div>
              </div>
            </header>
          )}

          <div className="p-4 md:p-8 max-w-7xl mx-auto">
            <AnimatePresence mode="wait">
              {currentPage === 'dashboard' && (
                <PageTransition key="dashboard">
                  <DashboardPage
                    currentMonthStats={currentMonthStats}
                    stats={stats}
                    monthlyData={monthlyData}
                    loading={loading}
                    transactions={transactions}
                  />
                </PageTransition>
              )}
              {currentPage === 'transactions' && (
                <PageTransition key="transactions">
                  <TransactionsPage
                    transactions={transactions}
                    loading={loading}
                    setShowAddTransaction={setShowAddTransaction}
                    handleDeleteTransaction={handleDeleteTransaction}
                    handleMarkAsPaid={handleMarkAsPaid}
                  />
                </PageTransition>
              )}
              {currentPage === 'services' && (
                <PageTransition key="services">
                  <ServicesPage
                    services={services}
                    loading={loading}
                    setShowAddService={setShowAddService}
                    handleDeleteService={handleDeleteService}
                    useServiceForTransaction={useServiceForTransaction}
                  />
                </PageTransition>
              )}
              {currentPage === 'reports' && (
                <PageTransition key="reports">
                  <ReportsPage transactions={transactions} />
                </PageTransition>
              )}
              {currentPage === 'journal' && (
                <PageTransition key="journal">
                  <JournalPage transactions={transactions} />
                </PageTransition>
              )}
              {currentPage === 'ledger' && (
                <PageTransition key="ledger">
                  <LedgerPage transactions={transactions} />
                </PageTransition>
              )}
            </AnimatePresence>
          </div>
        </main>
      </div>

      {isMobile && (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40">
          <div className="flex items-center justify-around px-1">
            {[
              { page: 'dashboard', icon: Home, label: 'Home' },
              { page: 'transactions', icon: Receipt, label: 'Transaksi' },
              { page: 'journal', icon: FileText, label: 'Jurnal' },
              { page: 'ledger', icon: Briefcase, label: 'Buku Besar' },
              { page: 'services', icon: Briefcase, label: 'Layanan' },
              { page: 'reports', icon: FileText, label: 'Laporan' },
            ].map(({ page, icon: Icon, label }) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page as NavPage)}
                className={`flex-1 flex flex-col items-center gap-0.5 py-2 transition-colors ${currentPage === page ? 'text-gray-900' : 'text-gray-400'
                  }`}
              >
                <Icon size={18} strokeWidth={currentPage === page ? 2.5 : 2} />
                <span className="text-xs font-semibold">{label}</span>
              </button>
            ))}
          </div>
        </nav>
      )}

      <Modal show={showAddTransaction} onClose={() => setShowAddTransaction(false)} title="Tambah Transaksi" isMobile={isMobile}>
        <form onSubmit={handleAddTransaction} className="space-y-2.5">
          <div>
            <label className="block text-xs font-bold text-gray-900 mb-1 uppercase tracking-wide">Tanggal</label>
            <input
              type="date"
              value={newTransaction.date}
              onChange={(e) => setNewTransaction({ ...newTransaction, date: e.target.value })}
              className="w-full px-2.5 py-2 text-xs border border-gray-300 rounded focus:outline-none focus:border-gray-900"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-900 mb-1 uppercase tracking-wide">Deskripsi</label>
            <input
              type="text"
              value={newTransaction.description}
              onChange={(e) => setNewTransaction({ ...newTransaction, description: e.target.value })}
              className="w-full px-2.5 py-2 text-xs border border-gray-300 rounded focus:outline-none focus:border-gray-900"
              placeholder="Jasa Service AC"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-900 mb-1 uppercase tracking-wide">Nominal</label>
            <input
              type="number"
              value={newTransaction.amount}
              onChange={(e) => setNewTransaction({ ...newTransaction, amount: e.target.value })}
              className="w-full px-2.5 py-2 text-xs border border-gray-300 rounded focus:outline-none focus:border-gray-900"
              placeholder="100000"
              min="0"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-900 mb-1 uppercase tracking-wide">Tipe</label>
            <select
              value={newTransaction.type}
              onChange={(e) => setNewTransaction({ ...newTransaction, type: e.target.value as 'income' | 'expense' })}
              className="w-full px-2.5 py-2 text-xs border border-gray-300 rounded focus:outline-none focus:border-gray-900"
            >
              <option value="income">Pemasukan</option>
              <option value="expense">Pengeluaran</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-900 mb-1 uppercase tracking-wide">Status</label>
            <select
              value={newTransaction.payment_status}
              onChange={(e) => setNewTransaction({ ...newTransaction, payment_status: e.target.value as 'paid' | 'unpaid' })}
              className="w-full px-2.5 py-2 text-xs border border-gray-300 rounded focus:outline-none focus:border-gray-900"
            >
              <option value="paid">Lunas</option>
              <option value="unpaid">Belum Lunas</option>
            </select>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowAddTransaction(false)}
              className="flex-1 px-2.5 py-2 text-xs font-semibold border border-gray-300 text-gray-700 rounded uppercase tracking-wide"
            >
              Batal
            </button>
            <button type="submit" className="flex-1 px-2.5 py-2 text-xs font-semibold bg-black text-white rounded uppercase tracking-wide">
              Simpan
            </button>
          </div>
        </form>
      </Modal>

      <Modal show={showAddService} onClose={() => setShowAddService(false)} title="Tambah Layanan" isMobile={isMobile}>
        <form onSubmit={handleAddService} className="space-y-2.5">
          <div>
            <label className="block text-xs font-bold text-gray-900 mb-1 uppercase tracking-wide">Nama Layanan</label>
            <input
              type="text"
              value={newService.name}
              onChange={(e) => setNewService({ ...newService, name: e.target.value })}
              className="w-full px-2.5 py-2 text-xs border border-gray-300 rounded focus:outline-none focus:border-gray-900"
              placeholder="Service AC Standar"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-900 mb-1 uppercase tracking-wide">Harga</label>
            <input
              type="number"
              value={newService.price}
              onChange={(e) => setNewService({ ...newService, price: e.target.value })}
              className="w-full px-2.5 py-2 text-xs border border-gray-300 rounded focus:outline-none focus:border-gray-900"
              placeholder="150000"
              min="0"
              required
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowAddService(false)}
              className="flex-1 px-2.5 py-2 text-xs font-semibold border border-gray-300 text-gray-700 rounded uppercase tracking-wide"
            >
              Batal
            </button>
            <button type="submit" className="flex-1 px-2.5 py-2 text-xs font-semibold bg-black text-white rounded uppercase tracking-wide">
              Simpan
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
}

export default App;
