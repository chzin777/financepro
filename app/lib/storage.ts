import { FinanceData, Transaction, Bill } from './types';

const STORAGE_KEY = 'finance-dashboard-data';

const defaultData: FinanceData = {
  balance: 0,
  transactions: [],
  bills: [],
  billPayments: [],
};

export function loadData(): FinanceData {
  if (typeof window === 'undefined') return defaultData;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultData;
    return JSON.parse(raw) as FinanceData;
  } catch {
    return defaultData;
  }
}

export function saveData(data: FinanceData): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
}

export function addTransaction(
  data: FinanceData,
  transaction: Omit<Transaction, 'id' | 'createdAt'>
): FinanceData {
  const newTransaction: Transaction = {
    ...transaction,
    id: generateId(),
    createdAt: new Date().toISOString(),
  };

  const balanceChange = transaction.type === 'income' ? transaction.amount : -transaction.amount;

  return {
    ...data,
    balance: data.balance + balanceChange,
    transactions: [newTransaction, ...data.transactions],
  };
}

export function removeTransaction(data: FinanceData, id: string): FinanceData {
  const tx = data.transactions.find(t => t.id === id);
  if (!tx) return data;

  const balanceChange = tx.type === 'income' ? -tx.amount : tx.amount;

  return {
    ...data,
    balance: data.balance + balanceChange,
    transactions: data.transactions.filter(t => t.id !== id),
  };
}

export function addBill(
  data: FinanceData,
  bill: Omit<Bill, 'id' | 'createdAt'>
): FinanceData {
  const newBill: Bill = {
    ...bill,
    id: generateId(),
    createdAt: new Date().toISOString(),
  };

  return {
    ...data,
    bills: [...data.bills, newBill],
  };
}

export function removeBill(data: FinanceData, id: string): FinanceData {
  return {
    ...data,
    bills: data.bills.filter(b => b.id !== id),
  };
}

export function updateBill(data: FinanceData, id: string, updates: Partial<Bill>): FinanceData {
  return {
    ...data,
    bills: data.bills.map(b => b.id === id ? { ...b, ...updates } : b),
  };
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

export function formatDateShort(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
  }).format(date);
}
