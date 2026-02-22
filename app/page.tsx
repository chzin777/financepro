'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Wallet,
  Plus,
  TrendingUp,
  TrendingDown,
  Receipt,
  CalendarClock,
  BarChart3,
  Trash2,
  Settings,
  ChevronRight,
  ArrowUpCircle,
  ArrowDownCircle,
  Clock,
  RefreshCw,
  LayoutDashboard,
  Loader2,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Circle,
  Search,
  Pencil,
  Filter,
  X,
} from 'lucide-react';
import { FinanceData, Transaction, Bill, CATEGORIES, ExpenseCategory, MONTHS } from './lib/types';
import {
  loadAllData,
  createTransaction,
  deleteTransaction,
  editTransaction,
  createBill,
  deleteBill,
  editBill,
  updateBalance,
  payBill,
  unpayBill,
  formatCurrency,
  formatDate,
  formatDateShort,
} from './lib/api';
import {
  generateForecast,
  getExpensesByCategory,
  getMonthSummary,
  getLast6MonthsData,
  getUpcomingSalaryDates,
  getBillsForMonth,
} from './lib/finance';
import AddTransactionModal from './components/AddTransactionModal';
import AddBillModal from './components/AddBillModal';
import SetBalanceModal from './components/SetBalanceModal';
import ConfirmModal from './components/ConfirmModal';
import EditTransactionModal from './components/EditTransactionModal';
import EditBillModal from './components/EditBillModal';
import { MonthlyChart, ForecastChart, CategoryChart } from './components/Charts';

type Tab = 'dashboard' | 'transactions' | 'bills' | 'forecast';

export default function Home() {
  const [data, setData] = useState<FinanceData>({ balance: 0, transactions: [], bills: [], billPayments: [] });
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [showAddBill, setShowAddBill] = useState(false);
  const [showSetBalance, setShowSetBalance] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Filter & search state for transactions
  const [txSearch, setTxSearch] = useState('');
  const [txFilterType, setTxFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [txFilterCategory, setTxFilterCategory] = useState<string>('all');
  const [txFilterMonth, setTxFilterMonth] = useState<number>(-1); // -1 = all
  const [showTxFilters, setShowTxFilters] = useState(false);

  // Confirm delete state
  const [confirmDelete, setConfirmDelete] = useState<{ type: 'transaction' | 'bill'; id: string; name: string } | null>(null);

  // Edit modals state
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [editingBill, setEditingBill] = useState<Bill | null>(null);

  // Load data from API on mount
  useEffect(() => {
    loadAllData()
      .then(setData)
      .catch(err => console.error('Failed to load data:', err))
      .finally(() => setLoading(false));
  }, []);

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const monthSummary = useMemo(
    () => getMonthSummary(data.transactions, currentYear, currentMonth),
    [data.transactions, currentYear, currentMonth]
  );

  const expensesByCategory = useMemo(
    () => getExpensesByCategory(data.transactions, currentYear, currentMonth),
    [data.transactions, currentYear, currentMonth]
  );

  const forecast = useMemo(
    () => generateForecast(data.bills, data.balance, 6),
    [data.bills, data.balance]
  );

  const last6Months = useMemo(
    () => getLast6MonthsData(data.transactions),
    [data.transactions]
  );

  const upcomingSalaryDates = useMemo(
    () => getUpcomingSalaryDates(6),
    []
  );

  const currentMonthBills = useMemo(
    () => getBillsForMonth(data.bills, currentYear, currentMonth),
    [data.bills, currentYear, currentMonth]
  );

  const totalBillsThisMonth = currentMonthBills.reduce((sum, b) => sum + b.amount, 0);

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    return data.transactions.filter(tx => {
      // Search filter
      if (txSearch && !tx.description.toLowerCase().includes(txSearch.toLowerCase())) return false;
      // Type filter
      if (txFilterType !== 'all' && tx.type !== txFilterType) return false;
      // Category filter
      if (txFilterCategory !== 'all' && tx.category !== txFilterCategory) return false;
      // Month filter
      if (txFilterMonth !== -1) {
        const txDate = new Date(tx.date);
        if (txDate.getMonth() !== txFilterMonth) return false;
      }
      return true;
    });
  }, [data.transactions, txSearch, txFilterType, txFilterCategory, txFilterMonth]);

  const activeFilterCount = [
    txFilterType !== 'all',
    txFilterCategory !== 'all',
    txFilterMonth !== -1,
  ].filter(Boolean).length;

  const { overdueBills, upcomingBills } = useMemo(() => {
    const today = new Date();
    const todayDay = today.getDate();
    const activeBills = data.bills.filter(b => b.active);
    const paidBillIds = new Set(data.billPayments.map(p => p.billId));

    const overdue = activeBills.filter(b => {
      // Bill is overdue if dueDay already passed this month and NOT paid
      return b.dueDay < todayDay && !paidBillIds.has(b.id);
    });

    const upcoming = activeBills.filter(b => {
      // Bill is upcoming if dueDay is today or within the next 5 days and NOT paid
      const diff = b.dueDay - todayDay;
      return diff >= 0 && diff <= 5 && !paidBillIds.has(b.id);
    });

    return { overdueBills: overdue, upcomingBills: upcoming };
  }, [data.bills, data.billPayments]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3">
        <Loader2 size={32} className="text-[var(--accent)] animate-spin" />
        <p className="text-sm text-[var(--foreground-muted)]">Carregando dados...</p>
      </div>
    );
  }

  const handleAddTransaction = async (txData: {
    description: string;
    amount: number;
    type: 'income' | 'expense';
    category: string;
    date: string;
  }) => {
    setSaving(true);
    try {
      const result = await createTransaction(txData);
      setData(prev => ({
        ...prev,
        balance: result.balance,
        transactions: [result.transaction, ...prev.transactions],
      }));
    } catch (err) {
      console.error('Failed to add transaction:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveTransaction = async (id: string) => {
    setSaving(true);
    try {
      const result = await deleteTransaction(id);
      setData(prev => ({
        ...prev,
        balance: result.balance,
        transactions: prev.transactions.filter(t => t.id !== id),
      }));
    } catch (err) {
      console.error('Failed to remove transaction:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleAddBill = async (billData: {
    name: string;
    amount: number;
    category: string;
    type: 'fixed' | 'temporary';
    dueDay: number;
    totalInstallments?: number;
    currentInstallment?: number;
    startDate: string;
    active: boolean;
  }) => {
    setSaving(true);
    try {
      const newBill = await createBill(billData);
      setData(prev => ({
        ...prev,
        bills: [...prev.bills, newBill],
      }));
    } catch (err) {
      console.error('Failed to add bill:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveBill = async (id: string) => {
    setSaving(true);
    try {
      await deleteBill(id);
      setData(prev => ({
        ...prev,
        bills: prev.bills.filter(b => b.id !== id),
      }));
    } catch (err) {
      console.error('Failed to remove bill:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleSetBalance = async (balance: number) => {
    setSaving(true);
    try {
      await updateBalance(balance);
      setData(prev => ({ ...prev, balance }));
    } catch (err) {
      console.error('Failed to set balance:', err);
    } finally {
      setSaving(false);
    }
  };

  const handlePayBill = async (billId: string) => {
    setSaving(true);
    try {
      const result = await payBill(billId, currentMonth, currentYear);
      setData(prev => ({
        ...prev,
        balance: result.balance,
        billPayments: [...prev.billPayments, result.payment],
      }));
    } catch (err) {
      console.error('Failed to pay bill:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleUnpayBill = async (billId: string) => {
    setSaving(true);
    try {
      const result = await unpayBill(billId, currentMonth, currentYear);
      setData(prev => ({
        ...prev,
        balance: result.balance,
        billPayments: prev.billPayments.filter(
          p => !(p.billId === billId && p.month === currentMonth && p.year === currentYear)
        ),
      }));
    } catch (err) {
      console.error('Failed to unpay bill:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleEditTransaction = async (
    id: string,
    updates: { description: string; amount: number; type: 'income' | 'expense'; category: string; date: string }
  ) => {
    setSaving(true);
    try {
      const result = await editTransaction(id, updates);
      setData(prev => ({
        ...prev,
        balance: result.balance,
        transactions: prev.transactions.map(t =>
          t.id === id ? { ...t, ...updates } : t
        ),
      }));
    } catch (err) {
      console.error('Failed to edit transaction:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleEditBill = async (
    id: string,
    updates: { name: string; amount: number; category: string; type: 'fixed' | 'temporary'; dueDay: number; totalInstallments?: number; currentInstallment?: number }
  ) => {
    setSaving(true);
    try {
      await editBill(id, updates);
      setData(prev => ({
        ...prev,
        bills: prev.bills.map(b =>
          b.id === id ? { ...b, ...updates } : b
        ),
      }));
    } catch (err) {
      console.error('Failed to edit bill:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!confirmDelete) return;
    if (confirmDelete.type === 'transaction') {
      await handleRemoveTransaction(confirmDelete.id);
    } else {
      await handleRemoveBill(confirmDelete.id);
    }
    setConfirmDelete(null);
  };

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Início', icon: <LayoutDashboard size={20} /> },
    { id: 'transactions', label: 'Transações', icon: <Receipt size={20} /> },
    { id: 'bills', label: 'Contas', icon: <CalendarClock size={20} /> },
    { id: 'forecast', label: 'Previsão', icon: <BarChart3 size={20} /> },
  ];

  return (
    <div className="min-h-screen pb-24 lg:pb-8">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-[var(--background)]/80 backdrop-blur-xl border-b border-[var(--border)]">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--gradient-start)] to-[var(--gradient-end)] flex items-center justify-center">
              <Wallet size={18} className="text-white" />
            </div>
            <h1 className="text-lg font-bold hidden sm:block">FinancePro</h1>
          </div>

          {/* Desktop Tabs */}
          <nav className="hidden lg:flex items-center gap-1 bg-[var(--background-secondary)] p-1 rounded-xl">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === tab.id ? 'tab-active' : 'tab-inactive'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            {/* Always-visible balance */}
            <button
              onClick={() => setShowSetBalance(true)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[var(--background-secondary)] hover:bg-[var(--background-tertiary)] border border-[var(--border)] transition-all group"
              title="Clique para ajustar saldo"
            >
              <div className={`w-2 h-2 rounded-full ${data.balance >= 0 ? 'bg-[var(--success)]' : 'bg-[var(--danger)]'}`} />
              <span className={`text-sm font-bold number-display ${data.balance >= 0 ? 'text-[var(--success)]' : 'text-[var(--danger)]'}`}>
                {formatCurrency(data.balance)}
              </span>
              <Settings size={14} className="text-[var(--foreground-muted)] opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>

            <button
              onClick={() => setShowAddTransaction(true)}
              className="btn-primary flex items-center gap-2"
            >
              <Plus size={18} />
              <span className="hidden sm:inline">Nova Transação</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="animate-fade-in space-y-6">
            {/* Balance Card */}
            <div className="glass-card gradient-border p-6 sm:p-8">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-sm text-[var(--foreground-muted)] mb-1">Saldo Atual</p>
                  <h2 className="text-3xl sm:text-4xl font-bold number-display">
                    <span className={data.balance >= 0 ? 'gradient-text' : 'text-[var(--danger)]'}>
                      {formatCurrency(data.balance)}
                    </span>
                  </h2>
                </div>
                <button
                  onClick={() => setShowSetBalance(true)}
                  className="p-2 rounded-xl hover:bg-[var(--background-tertiary)] transition-colors"
                  title="Ajustar saldo"
                >
                  <Settings size={18} className="text-[var(--foreground-muted)]" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:gap-4 mt-6">
                <div className="bg-[var(--success-soft)] rounded-xl p-3 sm:p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <ArrowUpCircle size={16} className="text-[var(--success)]" />
                    <span className="text-xs text-[var(--foreground-muted)]">Receitas do mês</span>
                  </div>
                  <p className="text-lg sm:text-xl font-bold text-[var(--success)] number-display">
                    {formatCurrency(monthSummary.totalIncome)}
                  </p>
                </div>
                <div className="bg-[var(--danger-soft)] rounded-xl p-3 sm:p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <ArrowDownCircle size={16} className="text-[var(--danger)]" />
                    <span className="text-xs text-[var(--foreground-muted)]">Gastos do mês</span>
                  </div>
                  <p className="text-lg sm:text-xl font-bold text-[var(--danger)] number-display">
                    {formatCurrency(monthSummary.totalExpenses)}
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Info Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Próximo salário */}
              <div className="glass-card p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-[var(--success-soft)] flex items-center justify-center">
                    <TrendingUp size={20} className="text-[var(--success)]" />
                  </div>
                  <div>
                    <p className="text-xs text-[var(--foreground-muted)]">Próx. Salário</p>
                    <p className="font-bold text-[var(--success)] number-display">R$ 3.000</p>
                  </div>
                </div>
                <p className="text-xs text-[var(--foreground-muted)]">
                  {upcomingSalaryDates.slice(0, 2).map(d => d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })).join(' e ')}
                </p>
              </div>

              {/* Contas do mês */}
              <div className="glass-card p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-[var(--warning-soft)] flex items-center justify-center">
                    <Receipt size={20} className="text-[var(--warning)]" />
                  </div>
                  <div>
                    <p className="text-xs text-[var(--foreground-muted)]">Contas do mês</p>
                    <p className="font-bold text-[var(--warning)] number-display">{formatCurrency(totalBillsThisMonth)}</p>
                  </div>
                </div>
                <p className="text-xs text-[var(--foreground-muted)]">
                  {currentMonthBills.length} conta{currentMonthBills.length !== 1 ? 's' : ''} ativa{currentMonthBills.length !== 1 ? 's' : ''}
                </p>
              </div>

              {/* Balanço */}
              <div className="glass-card p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    monthSummary.net >= 0 ? 'bg-[var(--success-soft)]' : 'bg-[var(--danger-soft)]'
                  }`}>
                    {monthSummary.net >= 0 ? (
                      <TrendingUp size={20} className="text-[var(--success)]" />
                    ) : (
                      <TrendingDown size={20} className="text-[var(--danger)]" />
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-[var(--foreground-muted)]">Balanço do mês</p>
                    <p className={`font-bold number-display ${monthSummary.net >= 0 ? 'text-[var(--success)]' : 'text-[var(--danger)]'}`}>
                      {formatCurrency(monthSummary.net)}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-[var(--foreground-muted)]">
                  {MONTHS[currentMonth]} {currentYear}
                </p>
              </div>
            </div>

            {/* Bills Alerts */}
            {(overdueBills.length > 0 || upcomingBills.length > 0) && (
              <div className="space-y-4">
                {/* Overdue Bills */}
                {overdueBills.length > 0 && (
                  <div className="glass-card border border-[var(--danger)]/30 overflow-hidden">
                    <div className="flex items-center gap-3 px-5 py-3 bg-[var(--danger-soft)] border-b border-[var(--danger)]/20">
                      <AlertTriangle size={18} className="text-[var(--danger)]" />
                      <h3 className="text-sm font-semibold text-[var(--danger)]">
                        Contas Vencidas ({overdueBills.length})
                      </h3>
                    </div>
                    <div className="divide-y divide-[var(--border)]">
                      {overdueBills.map(bill => {
                        const cat = CATEGORIES[bill.category as ExpenseCategory];
                        const daysOverdue = new Date().getDate() - bill.dueDay;
                        return (
                          <div key={bill.id} className="flex items-center gap-3 px-5 py-3 hover:bg-[var(--background-tertiary)] transition-colors">
                            <div
                              className="w-9 h-9 rounded-lg flex items-center justify-center text-base flex-shrink-0"
                              style={{ backgroundColor: cat?.bgColor || 'var(--background-tertiary)' }}
                            >
                              {cat?.icon || '📋'}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{bill.name}</p>
                              <p className="text-xs text-[var(--danger)]">
                                Venceu dia {bill.dueDay} • {daysOverdue} dia{daysOverdue !== 1 ? 's' : ''} atrás
                                {bill.type === 'temporary' && bill.totalInstallments
                                  ? ` • ${bill.currentInstallment}/${bill.totalInstallments}`
                                  : ''}
                              </p>
                            </div>
                            <p className="text-sm font-bold text-[var(--danger)] number-display flex-shrink-0">
                              {formatCurrency(bill.amount)}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Upcoming Bills */}
                {upcomingBills.length > 0 && (
                  <div className="glass-card border border-[var(--warning)]/30 overflow-hidden">
                    <div className="flex items-center gap-3 px-5 py-3 bg-[var(--warning-soft)] border-b border-[var(--warning)]/20">
                      <AlertCircle size={18} className="text-[var(--warning)]" />
                      <h3 className="text-sm font-semibold text-[var(--warning)]">
                        Contas Próximas do Vencimento ({upcomingBills.length})
                      </h3>
                    </div>
                    <div className="divide-y divide-[var(--border)]">
                      {upcomingBills.map(bill => {
                        const cat = CATEGORIES[bill.category as ExpenseCategory];
                        const daysUntil = bill.dueDay - new Date().getDate();
                        return (
                          <div key={bill.id} className="flex items-center gap-3 px-5 py-3 hover:bg-[var(--background-tertiary)] transition-colors">
                            <div
                              className="w-9 h-9 rounded-lg flex items-center justify-center text-base flex-shrink-0"
                              style={{ backgroundColor: cat?.bgColor || 'var(--background-tertiary)' }}
                            >
                              {cat?.icon || '📋'}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{bill.name}</p>
                              <p className="text-xs text-[var(--warning)]">
                                {daysUntil === 0 ? 'Vence hoje!' : `Vence em ${daysUntil} dia${daysUntil !== 1 ? 's' : ''} (dia ${bill.dueDay})`}
                                {bill.type === 'temporary' && bill.totalInstallments
                                  ? ` • ${bill.currentInstallment}/${bill.totalInstallments}`
                                  : ''}
                              </p>
                            </div>
                            <p className="text-sm font-bold text-[var(--warning)] number-display flex-shrink-0">
                              {formatCurrency(bill.amount)}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Monthly Chart */}
              <div className="glass-card p-5">
                <h3 className="text-base font-semibold mb-4 flex items-center gap-2">
                  <BarChart3 size={18} className="text-[var(--accent)]" />
                  Últimos 6 meses
                </h3>
                <MonthlyChart data={last6Months} />
              </div>

              {/* Category Chart */}
              <div className="glass-card p-5">
                <h3 className="text-base font-semibold mb-4 flex items-center gap-2">
                  <Receipt size={18} className="text-[var(--accent)]" />
                  Gastos por Categoria
                </h3>
                <CategoryChart data={expensesByCategory} />
                <div className="grid grid-cols-2 gap-2 mt-4">
                  {expensesByCategory.slice(0, 6).map(item => {
                    const cat = CATEGORIES[item.category as ExpenseCategory];
                    return (
                      <div key={item.category} className="flex items-center gap-2 text-xs">
                        <div
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: cat?.color || '#94a3b8' }}
                        />
                        <span className="text-[var(--foreground-secondary)] truncate">{cat?.label || item.category}</span>
                        <span className="text-[var(--foreground-muted)] ml-auto number-display">
                          {item.percentage.toFixed(0)}%
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Recent Transactions */}
            <div className="glass-card p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold flex items-center gap-2">
                  <Clock size={18} className="text-[var(--accent)]" />
                  Transações Recentes
                </h3>
                <button
                  onClick={() => setActiveTab('transactions')}
                  className="text-xs text-[var(--accent)] hover:text-[var(--accent-hover)] flex items-center gap-1 transition-colors"
                >
                  Ver todas <ChevronRight size={14} />
                </button>
              </div>

              {data.transactions.length === 0 ? (
                <div className="text-center py-8 text-[var(--foreground-muted)]">
                  <Receipt size={40} className="mx-auto mb-3 opacity-30" />
                  <p className="text-sm">Nenhuma transação registrada</p>
                  <button
                    onClick={() => setShowAddTransaction(true)}
                    className="btn-primary mt-4 text-sm"
                  >
                    Adicionar primeira transação
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {data.transactions.slice(0, 5).map(tx => {
                    const cat = CATEGORIES[tx.category as ExpenseCategory];
                    return (
                      <div
                        key={tx.id}
                        className="flex items-center gap-3 p-3 rounded-xl hover:bg-[var(--background-tertiary)] transition-colors group"
                      >
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                          style={{ backgroundColor: cat?.bgColor || 'var(--background-tertiary)' }}
                        >
                          {cat?.icon || '📋'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{tx.description}</p>
                          <p className="text-xs text-[var(--foreground-muted)]">
                            {cat?.label || tx.category} • {formatDateShort(tx.date)}
                          </p>
                        </div>
                        <p className={`text-sm font-bold number-display flex-shrink-0 ${
                          tx.type === 'income' ? 'text-[var(--success)]' : 'text-[var(--danger)]'
                        }`}>
                          {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Transactions Tab */}
        {activeTab === 'transactions' && (
          <div className="animate-fade-in space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">Transações</h2>
              <button onClick={() => setShowAddTransaction(true)} className="btn-primary flex items-center gap-2">
                <Plus size={16} />
                Nova
              </button>
            </div>

            {/* Search & Filters */}
            <div className="space-y-3">
              {/* Search bar */}
              <div className="relative">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)]" />
                <input
                  type="text"
                  className="input-field pl-10 pr-4"
                  placeholder="Buscar por descrição..."
                  value={txSearch}
                  onChange={e => setTxSearch(e.target.value)}
                />
                {txSearch && (
                  <button
                    onClick={() => setTxSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)] hover:text-[var(--foreground-secondary)]"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>

              {/* Filter toggle */}
              <button
                onClick={() => setShowTxFilters(!showTxFilters)}
                className={`flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-xl transition-all ${
                  activeFilterCount > 0 || showTxFilters
                    ? 'bg-[var(--accent-soft)] text-[var(--accent)]'
                    : 'text-[var(--foreground-muted)] hover:bg-[var(--background-tertiary)]'
                }`}
              >
                <Filter size={16} />
                Filtros
                {activeFilterCount > 0 && (
                  <span className="w-5 h-5 rounded-full bg-[var(--accent)] text-white text-[10px] flex items-center justify-center font-bold">
                    {activeFilterCount}
                  </span>
                )}
              </button>

              {/* Filter options */}
              {showTxFilters && (
                <div className="glass-card p-4 space-y-3 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Filtrar por</span>
                    {activeFilterCount > 0 && (
                      <button
                        onClick={() => { setTxFilterType('all'); setTxFilterCategory('all'); setTxFilterMonth(-1); }}
                        className="text-xs text-[var(--accent)] hover:underline"
                      >
                        Limpar filtros
                      </button>
                    )}
                  </div>

                  {/* Type filter */}
                  <div>
                    <label className="block text-xs text-[var(--foreground-muted)] mb-1.5">Tipo</label>
                    <div className="flex gap-2">
                      {[
                        { value: 'all' as const, label: 'Todos' },
                        { value: 'expense' as const, label: 'Gastos' },
                        { value: 'income' as const, label: 'Receitas' },
                      ].map(opt => (
                        <button
                          key={opt.value}
                          onClick={() => setTxFilterType(opt.value)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                            txFilterType === opt.value
                              ? 'bg-[var(--accent)] text-white'
                              : 'bg-[var(--background-tertiary)] text-[var(--foreground-muted)] hover:bg-[var(--border)]'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Month filter */}
                  <div>
                    <label className="block text-xs text-[var(--foreground-muted)] mb-1.5">Mês</label>
                    <select
                      value={txFilterMonth}
                      onChange={e => setTxFilterMonth(parseInt(e.target.value))}
                      className="input-field text-sm py-2"
                    >
                      <option value={-1}>Todos os meses</option>
                      {MONTHS.map((m, i) => (
                        <option key={i} value={i}>{m}</option>
                      ))}
                    </select>
                  </div>

                  {/* Category filter */}
                  <div>
                    <label className="block text-xs text-[var(--foreground-muted)] mb-1.5">Categoria</label>
                    <select
                      value={txFilterCategory}
                      onChange={e => setTxFilterCategory(e.target.value)}
                      className="input-field text-sm py-2"
                    >
                      <option value="all">Todas as categorias</option>
                      {(Object.entries(CATEGORIES) as [ExpenseCategory, typeof CATEGORIES[ExpenseCategory]][]).map(
                        ([key, cat]) => (
                          <option key={key} value={key}>{cat.icon} {cat.label}</option>
                        )
                      )}
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Results count */}
            {(txSearch || activeFilterCount > 0) && (
              <p className="text-xs text-[var(--foreground-muted)]">
                {filteredTransactions.length} transação{filteredTransactions.length !== 1 ? 'ões' : ''} encontrada{filteredTransactions.length !== 1 ? 's' : ''}
              </p>
            )}

            {data.transactions.length === 0 ? (
              <div className="glass-card p-12 text-center">
                <Receipt size={48} className="mx-auto mb-4 text-[var(--foreground-muted)] opacity-30" />
                <h3 className="text-lg font-semibold mb-2">Nenhuma transação</h3>
                <p className="text-sm text-[var(--foreground-muted)] mb-6">
                  Comece adicionando seus gastos e receitas
                </p>
                <button onClick={() => setShowAddTransaction(true)} className="btn-primary">
                  Adicionar transação
                </button>
              </div>
            ) : filteredTransactions.length === 0 ? (
              <div className="glass-card p-8 text-center">
                <Search size={40} className="mx-auto mb-3 text-[var(--foreground-muted)] opacity-30" />
                <p className="text-sm text-[var(--foreground-muted)]">Nenhuma transação encontrada com esses filtros</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredTransactions.map((tx, idx) => {
                  const cat = CATEGORIES[tx.category as ExpenseCategory];
                  return (
                    <div
                      key={tx.id}
                      className="glass-card p-4 flex items-center gap-3 animate-fade-in group"
                      style={{ animationDelay: `${idx * 0.03}s` }}
                    >
                      <div
                        className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                        style={{ backgroundColor: cat?.bgColor || 'var(--background-tertiary)' }}
                      >
                        {cat?.icon || '📋'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{tx.description}</p>
                        <p className="text-xs text-[var(--foreground-muted)]">
                          {cat?.label || tx.category} • {formatDate(tx.date)}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <p className={`font-bold number-display ${
                          tx.type === 'income' ? 'text-[var(--success)]' : 'text-[var(--danger)]'
                        }`}>
                          {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                        </p>
                        <button
                          onClick={() => setEditingTransaction(tx)}
                          className="p-2 rounded-lg hover:bg-[var(--accent-soft)] text-[var(--foreground-muted)] hover:text-[var(--accent)] transition-all sm:opacity-0 sm:group-hover:opacity-100"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => setConfirmDelete({ type: 'transaction', id: tx.id, name: tx.description })}
                          className="p-2 rounded-lg hover:bg-[var(--danger-soft)] text-[var(--foreground-muted)] hover:text-[var(--danger)] transition-all sm:opacity-0 sm:group-hover:opacity-100"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Bills Tab */}
        {activeTab === 'bills' && (
          <div className="animate-fade-in space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">Contas</h2>
              <button onClick={() => setShowAddBill(true)} className="btn-primary flex items-center gap-2">
                <Plus size={16} />
                Nova Conta
              </button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-3 gap-3">
              <div className="glass-card p-4">
                <div className="flex items-center gap-2 mb-2">
                  <RefreshCw size={16} className="text-[var(--accent)]" />
                  <span className="text-xs text-[var(--foreground-muted)]">Fixas</span>
                </div>
                <p className="text-lg font-bold number-display">
                  {formatCurrency(
                    data.bills.filter(b => b.type === 'fixed' && b.active).reduce((s, b) => s + b.amount, 0)
                  )}
                </p>
                <p className="text-xs text-[var(--foreground-muted)] mt-1">
                  {data.bills.filter(b => b.type === 'fixed' && b.active).length} conta(s)
                </p>
              </div>
              <div className="glass-card p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock size={16} className="text-[var(--warning)]" />
                  <span className="text-xs text-[var(--foreground-muted)]">Temporárias</span>
                </div>
                <p className="text-lg font-bold number-display">
                  {formatCurrency(
                    data.bills.filter(b => b.type === 'temporary' && b.active).reduce((s, b) => s + b.amount, 0)
                  )}
                </p>
                <p className="text-xs text-[var(--foreground-muted)] mt-1">
                  {data.bills.filter(b => b.type === 'temporary' && b.active).length} conta(s)
                </p>
              </div>
              <div className="glass-card p-4 gradient-border">
                <div className="flex items-center gap-2 mb-2">
                  <Wallet size={16} className="text-[var(--foreground-secondary)]" />
                  <span className="text-xs text-[var(--foreground-muted)]">Total</span>
                </div>
                <p className="text-lg font-bold number-display gradient-text">
                  {formatCurrency(
                    data.bills.filter(b => b.active).reduce((s, b) => s + b.amount, 0)
                  )}
                </p>
                <p className="text-xs text-[var(--foreground-muted)] mt-1">
                  {data.bills.filter(b => b.active).length} conta(s)
                </p>
              </div>
            </div>

            {data.bills.length === 0 ? (
              <div className="glass-card p-12 text-center">
                <CalendarClock size={48} className="mx-auto mb-4 text-[var(--foreground-muted)] opacity-30" />
                <h3 className="text-lg font-semibold mb-2">Nenhuma conta cadastrada</h3>
                <p className="text-sm text-[var(--foreground-muted)] mb-6">
                  Adicione suas contas fixas e financiamentos
                </p>
                <button onClick={() => setShowAddBill(true)} className="btn-primary">
                  Adicionar conta
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {data.bills.map((bill, idx) => {
                  const cat = CATEGORIES[bill.category as ExpenseCategory];
                  const isPaid = data.billPayments.some(
                    p => p.billId === bill.id && p.month === currentMonth && p.year === currentYear
                  );
                  return (
                    <div
                      key={bill.id}
                      className={`glass-card p-4 animate-fade-in transition-all ${isPaid ? 'opacity-60' : ''}`}
                      style={{ animationDelay: `${idx * 0.03}s` }}
                    >
                      <div className="flex items-center gap-3">
                        {/* Pay/Unpay toggle */}
                        <button
                          onClick={() => isPaid ? handleUnpayBill(bill.id) : handlePayBill(bill.id)}
                          disabled={saving}
                          className={`flex-shrink-0 transition-all ${
                            isPaid
                              ? 'text-[var(--success)] hover:opacity-70'
                              : 'text-[var(--foreground-muted)] hover:text-[var(--success)]'
                          }`}
                          title={isPaid ? 'Desmarcar como paga' : 'Marcar como paga'}
                        >
                          {isPaid ? <CheckCircle2 size={24} /> : <Circle size={24} />}
                        </button>
                        <div
                          className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                          style={{ backgroundColor: cat?.bgColor || 'var(--background-tertiary)' }}
                        >
                          {cat?.icon || '📋'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className={`font-medium truncate ${isPaid ? 'line-through text-[var(--foreground-muted)]' : ''}`}>{bill.name}</p>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${
                              bill.type === 'fixed'
                                ? 'bg-[var(--accent-soft)] text-[var(--accent)]'
                                : 'bg-[var(--warning-soft)] text-[var(--warning)]'
                            }`}>
                              {bill.type === 'fixed' ? 'Fixa' : 'Temporária'}
                            </span>
                            {isPaid && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full font-medium flex-shrink-0 bg-[var(--success-soft)] text-[var(--success)]">
                                Paga ✓
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-[var(--foreground-muted)]">
                            Vence dia {bill.dueDay} • {cat?.label || bill.category}
                            {bill.type === 'temporary' && bill.totalInstallments && (
                              <> • {bill.currentInstallment || 1}/{bill.totalInstallments}x</>
                            )}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <p className={`font-bold number-display ${isPaid ? 'text-[var(--success)]' : 'text-[var(--danger)]'}`}>
                            {formatCurrency(bill.amount)}
                          </p>
                          <button
                            onClick={() => setEditingBill(bill)}
                            className="p-2 rounded-lg hover:bg-[var(--accent-soft)] text-[var(--foreground-muted)] hover:text-[var(--accent)] transition-all"
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            onClick={() => setConfirmDelete({ type: 'bill', id: bill.id, name: bill.name })}
                            className="p-2 rounded-lg hover:bg-[var(--danger-soft)] text-[var(--foreground-muted)] hover:text-[var(--danger)] transition-all"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Forecast Tab */}
        {activeTab === 'forecast' && (
          <div className="animate-fade-in space-y-6">
            <h2 className="text-xl font-bold">Previsão Financeira</h2>

            {/* Forecast Chart */}
            <div className="glass-card p-5">
              <h3 className="text-base font-semibold mb-4 flex items-center gap-2">
                <TrendingUp size={18} className="text-[var(--accent)]" />
                Saldo Projetado
              </h3>
              <ForecastChart data={forecast} />
            </div>

            {/* Forecast Table */}
            <div className="glass-card p-5">
              <h3 className="text-base font-semibold mb-4 flex items-center gap-2">
                <CalendarClock size={18} className="text-[var(--accent)]" />
                Detalhamento Mensal
              </h3>
              <div className="space-y-3">
                {forecast.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-[var(--background-tertiary)] animate-fade-in"
                    style={{ animationDelay: `${idx * 0.05}s` }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold">
                        {MONTHS[item.monthIndex]} {item.year}
                      </h4>
                      <span className={`text-sm font-bold number-display ${
                        item.projectedBalance >= 0 ? 'text-[var(--success)]' : 'text-[var(--danger)]'
                      }`}>
                        {formatCurrency(item.projectedBalance)}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div>
                        <p className="text-xs text-[var(--foreground-muted)] mb-1">Receita</p>
                        <p className="text-sm font-semibold text-[var(--success)] number-display">
                          {formatCurrency(item.income)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-[var(--foreground-muted)] mb-1">Gastos</p>
                        <p className="text-sm font-semibold text-[var(--danger)] number-display">
                          {formatCurrency(item.expenses)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-[var(--foreground-muted)] mb-1">Líquido</p>
                        <p className={`text-sm font-semibold number-display ${
                          item.net >= 0 ? 'text-[var(--success)]' : 'text-[var(--danger)]'
                        }`}>
                          {formatCurrency(item.net)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Salary Schedule */}
            <div className="glass-card p-5">
              <h3 className="text-base font-semibold mb-4 flex items-center gap-2">
                <Wallet size={18} className="text-[var(--success)]" />
                Próximos Salários
              </h3>
              <div className="space-y-2">
                {upcomingSalaryDates.map((salaryDate, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-3 rounded-xl bg-[var(--background-tertiary)]"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-[var(--success-soft)] flex items-center justify-center">
                          <Wallet size={16} className="text-[var(--success)]" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">Salário</p>
                          <p className="text-xs text-[var(--foreground-muted)]">
                            {salaryDate.toLocaleDateString('pt-BR', {
                              weekday: 'short',
                              day: '2-digit',
                              month: 'long',
                            })}
                          </p>
                        </div>
                      </div>
                      <p className="font-bold text-[var(--success)] number-display">+R$ 3.000</p>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="mobile-nav lg:hidden">
        <div className="flex items-center justify-around">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all ${
                activeTab === tab.id
                  ? 'text-[var(--accent)]'
                  : 'text-[var(--foreground-muted)]'
              }`}
            >
              {tab.icon}
              <span className="text-[10px] font-medium">{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* Modals */}
      <AddTransactionModal
        isOpen={showAddTransaction}
        onClose={() => setShowAddTransaction(false)}
        onAdd={handleAddTransaction}
      />
      <AddBillModal
        isOpen={showAddBill}
        onClose={() => setShowAddBill(false)}
        onAdd={handleAddBill}
      />
      <SetBalanceModal
        isOpen={showSetBalance}
        currentBalance={data.balance}
        onClose={() => setShowSetBalance(false)}
        onSet={handleSetBalance}
      />
      <EditTransactionModal
        isOpen={!!editingTransaction}
        transaction={editingTransaction}
        onClose={() => setEditingTransaction(null)}
        onSave={handleEditTransaction}
      />
      <EditBillModal
        isOpen={!!editingBill}
        bill={editingBill}
        onClose={() => setEditingBill(null)}
        onSave={handleEditBill}
      />
      <ConfirmModal
        isOpen={!!confirmDelete}
        title="Excluir permanentemente?"
        message={confirmDelete ? `Tem certeza que deseja excluir "${confirmDelete.name}"? Essa ação não pode ser desfeita.` : ''}
        confirmLabel="Excluir"
        cancelLabel="Cancelar"
        variant="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
}
