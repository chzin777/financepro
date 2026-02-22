import { Transaction, Bill, FinanceData } from './types';

/**
 * API client para comunicar com o banco de dados via API routes.
 * Substitui o localStorage por chamadas HTTP.
 */

// ============= BALANCE =============

export async function fetchBalance(): Promise<number> {
  const res = await fetch('/api/balance');
  if (!res.ok) throw new Error('Failed to fetch balance');
  const data = await res.json();
  return data.balance;
}

export async function updateBalance(balance: number): Promise<void> {
  const res = await fetch('/api/balance', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ balance }),
  });
  if (!res.ok) throw new Error('Failed to update balance');
}

// ============= TRANSACTIONS =============

export async function fetchTransactions(): Promise<Transaction[]> {
  const res = await fetch('/api/transactions');
  if (!res.ok) throw new Error('Failed to fetch transactions');
  const data = await res.json();
  return data.transactions;
}

export async function createTransaction(
  transaction: Omit<Transaction, 'id' | 'createdAt'>
): Promise<{ transaction: Transaction; balance: number }> {
  const id = Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
  const res = await fetch('/api/transactions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, ...transaction }),
  });
  if (!res.ok) throw new Error('Failed to create transaction');
  const data = await res.json();
  return {
    transaction: { id, ...transaction, createdAt: new Date().toISOString() },
    balance: data.balance,
  };
}

export async function deleteTransaction(id: string): Promise<{ balance: number }> {
  const res = await fetch(`/api/transactions?id=${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete transaction');
  const data = await res.json();
  return { balance: data.balance };
}

// ============= BILLS =============

export async function fetchBills(): Promise<Bill[]> {
  const res = await fetch('/api/bills');
  if (!res.ok) throw new Error('Failed to fetch bills');
  const data = await res.json();
  return data.bills;
}

export async function createBill(
  bill: Omit<Bill, 'id' | 'createdAt'>
): Promise<Bill> {
  const id = Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
  const res = await fetch('/api/bills', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, ...bill }),
  });
  if (!res.ok) throw new Error('Failed to create bill');
  return { id, ...bill, createdAt: new Date().toISOString() };
}

export async function deleteBill(id: string): Promise<void> {
  const res = await fetch(`/api/bills?id=${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete bill');
}

// ============= LOAD ALL =============

export async function loadAllData(): Promise<FinanceData> {
  const [balance, transactions, bills] = await Promise.all([
    fetchBalance(),
    fetchTransactions(),
    fetchBills(),
  ]);
  return { balance, transactions, bills };
}

// ============= UTILITIES (kept from old storage) =============

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
