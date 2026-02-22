export interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  date: string; // ISO string
  createdAt: string;
}

export interface Bill {
  id: string;
  name: string;
  amount: number;
  category: string;
  type: 'fixed' | 'temporary';
  dueDay: number; // dia do mês (1-31)
  totalInstallments?: number; // para contas temporárias
  currentInstallment?: number; // parcela atual
  startDate: string; // ISO string
  active: boolean;
  createdAt: string;
}

export interface FinanceData {
  balance: number;
  transactions: Transaction[];
  bills: Bill[];
}

export type ExpenseCategory =
  | 'alimentacao'
  | 'transporte'
  | 'moradia'
  | 'saude'
  | 'educacao'
  | 'lazer'
  | 'compras'
  | 'investimento'
  | 'financiamento'
  | 'assinatura'
  | 'outros';

export interface CategoryInfo {
  label: string;
  icon: string;
  color: string;
  bgColor: string;
}

export const CATEGORIES: Record<ExpenseCategory, CategoryInfo> = {
  alimentacao: { label: 'Alimentação', icon: '🍔', color: '#ff6b6b', bgColor: 'rgba(255, 107, 107, 0.12)' },
  transporte: { label: 'Transporte', icon: '🚗', color: '#4fc3f7', bgColor: 'rgba(79, 195, 247, 0.12)' },
  moradia: { label: 'Moradia', icon: '🏠', color: '#ffa726', bgColor: 'rgba(255, 167, 38, 0.12)' },
  saude: { label: 'Saúde', icon: '💊', color: '#00d68f', bgColor: 'rgba(0, 214, 143, 0.12)' },
  educacao: { label: 'Educação', icon: '📚', color: '#6c5ce7', bgColor: 'rgba(108, 92, 231, 0.12)' },
  lazer: { label: 'Lazer', icon: '🎮', color: '#a855f7', bgColor: 'rgba(168, 85, 247, 0.12)' },
  compras: { label: 'Compras', icon: '🛒', color: '#f472b6', bgColor: 'rgba(244, 114, 182, 0.12)' },
  investimento: { label: 'Investimento', icon: '📈', color: '#34d399', bgColor: 'rgba(52, 211, 153, 0.12)' },
  financiamento: { label: 'Financiamento', icon: '🏦', color: '#fbbf24', bgColor: 'rgba(251, 191, 36, 0.12)' },
  assinatura: { label: 'Assinatura', icon: '📱', color: '#818cf8', bgColor: 'rgba(129, 140, 248, 0.12)' },
  outros: { label: 'Outros', icon: '📋', color: '#94a3b8', bgColor: 'rgba(148, 163, 184, 0.12)' },
};

export const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];
