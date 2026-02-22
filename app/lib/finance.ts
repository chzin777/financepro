import {
  isWeekend,
  previousFriday,
  startOfMonth,
  endOfMonth,
  eachMonthOfInterval,
  addMonths,
  format,
  isBefore,
  isAfter,
  isEqual,
  startOfDay,
  setDate as setDayOfMonth,
} from 'date-fns';
import { Bill, Transaction } from './types';

/**
 * Calcula a data de pagamento do salário considerando fins de semana.
 * Se o dia cai em fim de semana, paga na sexta anterior.
 */
export function getSalaryDate(year: number, month: number, day: number): Date {
  // month is 0-indexed
  const date = new Date(year, month, day);
  if (isWeekend(date)) {
    return previousFriday(date);
  }
  return date;
}

/**
 * Retorna as duas datas de pagamento do salário para um dado mês.
 */
export function getSalaryDatesForMonth(year: number, month: number): Date[] {
  return [
    getSalaryDate(year, month, 1),
    getSalaryDate(year, month, 15),
  ];
}

/**
 * Retorna as próximas N datas de pagamento de salário a partir de hoje.
 * Filtra apenas datas futuras (hoje ou depois).
 */
export function getUpcomingSalaryDates(count: number = 6): Date[] {
  const today = startOfDay(new Date());
  const upcoming: Date[] = [];
  let year = today.getFullYear();
  let month = today.getMonth();

  // Procura nos próximos 12 meses para garantir que achamos datas suficientes
  for (let i = 0; i < 12 && upcoming.length < count; i++) {
    const m = (month + i) % 12;
    const y = year + Math.floor((month + i) / 12);
    const dates = getSalaryDatesForMonth(y, m);

    for (const d of dates) {
      if ((isAfter(d, today) || isEqual(startOfDay(d), today)) && upcoming.length < count) {
        // Evita duplicatas (dia 1 pode cair no mês anterior)
        if (!upcoming.some(existing => isEqual(startOfDay(existing), startOfDay(d)))) {
          upcoming.push(d);
        }
      }
    }
  }

  return upcoming.sort((a, b) => a.getTime() - b.getTime());
}

/**
 * Calcula o total de salário recebido em um mês.
 * Um pagamento pode cair no mês anterior se dia 1 é fim de semana.
 */
export function getSalaryForMonth(year: number, month: number): { dates: Date[]; total: number } {
  const salaryDates: Date[] = [];
  const monthStart = startOfMonth(new Date(year, month, 1));
  const monthEnd = endOfMonth(new Date(year, month, 1));

  // Check salary for this month day 1 and day 15
  const [day1, day15] = getSalaryDatesForMonth(year, month);

  // Day 1 payment might fall in previous month
  if (day1 >= monthStart && day1 <= monthEnd) {
    salaryDates.push(day1);
  }

  if (day15 >= monthStart && day15 <= monthEnd) {
    salaryDates.push(day15);
  }

  // Also check if next month's day 1 falls in this month
  const nextMonth = month === 11 ? 0 : month + 1;
  const nextYear = month === 11 ? year + 1 : year;
  const nextDay1 = getSalaryDate(nextYear, nextMonth, 1);
  if (nextDay1 >= monthStart && nextDay1 <= monthEnd) {
    salaryDates.push(nextDay1);
  }

  return {
    dates: salaryDates,
    total: salaryDates.length * 3000,
  };
}

/**
 * Calcula o total de contas para um mês específico.
 */
export function getBillsForMonth(
  bills: Bill[],
  year: number,
  month: number
): { bill: Bill; amount: number; dueDate: Date }[] {
  const result: { bill: Bill; amount: number; dueDate: Date }[] = [];
  const monthStart = startOfMonth(new Date(year, month, 1));
  const monthEnd = endOfMonth(new Date(year, month, 1));

  for (const bill of bills) {
    if (!bill.active) continue;

    const billStart = new Date(bill.startDate);

    // Verifica se a conta já começou
    if (isAfter(startOfMonth(billStart), monthEnd)) continue;

    // Se é temporária, verifica se ainda está dentro do período
    if (bill.type === 'temporary' && bill.totalInstallments && bill.currentInstallment !== undefined) {
      const monthsDiff = (year - billStart.getFullYear()) * 12 + (month - billStart.getMonth());
      const installmentNumber = bill.currentInstallment + monthsDiff;
      if (installmentNumber > bill.totalInstallments) continue;
    }

    // Calcula o dia de vencimento (ajusta para meses com menos dias)
    const lastDayOfMonth = monthEnd.getDate();
    const dueDay = Math.min(bill.dueDay, lastDayOfMonth);
    const dueDate = new Date(year, month, dueDay);

    result.push({
      bill,
      amount: bill.amount,
      dueDate,
    });
  }

  return result;
}

/**
 * Gera previsão para os próximos N meses.
 */
export function generateForecast(
  bills: Bill[],
  currentBalance: number,
  months: number = 3
): {
  month: string;
  year: number;
  monthIndex: number;
  income: number;
  expenses: number;
  net: number;
  projectedBalance: number;
}[] {
  const now = new Date();
  const forecast: {
    month: string;
    year: number;
    monthIndex: number;
    income: number;
    expenses: number;
    net: number;
    projectedBalance: number;
  }[] = [];

  let runningBalance = currentBalance;

  for (let i = 1; i <= months; i++) {
    const futureDate = addMonths(now, i);
    const y = futureDate.getFullYear();
    const m = futureDate.getMonth();

    const salary = getSalaryForMonth(y, m);
    const monthBills = getBillsForMonth(bills, y, m);
    const totalExpenses = monthBills.reduce((sum, b) => sum + b.amount, 0);
    const net = salary.total - totalExpenses;
    runningBalance += net;

    forecast.push({
      month: format(futureDate, 'MMM'),
      year: y,
      monthIndex: m,
      income: salary.total,
      expenses: totalExpenses,
      net,
      projectedBalance: runningBalance,
    });
  }

  return forecast;
}

/**
 * Agrupa transações por categoria e calcula totais.
 */
export function getExpensesByCategory(
  transactions: Transaction[],
  year?: number,
  month?: number
): { category: string; total: number; percentage: number }[] {
  let filtered = transactions.filter(t => t.type === 'expense');

  if (year !== undefined && month !== undefined) {
    filtered = filtered.filter(t => {
      const d = new Date(t.date);
      return d.getFullYear() === year && d.getMonth() === month;
    });
  }

  const totals: Record<string, number> = {};
  filtered.forEach(t => {
    totals[t.category] = (totals[t.category] || 0) + t.amount;
  });

  const grandTotal = Object.values(totals).reduce((a, b) => a + b, 0);

  return Object.entries(totals)
    .map(([category, total]) => ({
      category,
      total,
      percentage: grandTotal > 0 ? (total / grandTotal) * 100 : 0,
    }))
    .sort((a, b) => b.total - a.total);
}

/**
 * Calcula totais do mês atual.
 */
export function getMonthSummary(
  transactions: Transaction[],
  year: number,
  month: number
): { totalIncome: number; totalExpenses: number; net: number } {
  const monthTransactions = transactions.filter(t => {
    const d = new Date(t.date);
    return d.getFullYear() === year && d.getMonth() === month;
  });

  const totalIncome = monthTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = monthTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  return {
    totalIncome,
    totalExpenses,
    net: totalIncome - totalExpenses,
  };
}

/**
 * Retorna os dados dos últimos 6 meses para o gráfico.
 */
export function getLast6MonthsData(transactions: Transaction[]): {
  month: string;
  income: number;
  expenses: number;
}[] {
  const now = new Date();
  const result: { month: string; income: number; expenses: number }[] = [];

  for (let i = 5; i >= 0; i--) {
    const d = addMonths(now, -i);
    const y = d.getFullYear();
    const m = d.getMonth();
    const summary = getMonthSummary(transactions, y, m);

    result.push({
      month: format(d, 'MMM'),
      income: summary.totalIncome,
      expenses: summary.totalExpenses,
    });
  }

  return result;
}
