'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { CATEGORIES, ExpenseCategory } from '../lib/types';
import { formatCurrency } from '../lib/storage';

interface MonthlyChartProps {
  data: { month: string; income: number; expenses: number }[];
}

export function MonthlyChart({ data }: MonthlyChartProps) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} barGap={4}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis
          dataKey="month"
          stroke="var(--foreground-muted)"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke="var(--foreground-muted)"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={v => `${(v / 1000).toFixed(0)}k`}
        />
        <Tooltip
          contentStyle={{
            background: 'var(--background-secondary)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            padding: '12px',
          }}
          labelStyle={{ color: 'var(--foreground)' }}
          formatter={(value: number | undefined) => [formatCurrency(value ?? 0)]}
        />
        <Bar
          dataKey="income"
          name="Receita"
          fill="var(--success)"
          radius={[6, 6, 0, 0]}
          maxBarSize={32}
        />
        <Bar
          dataKey="expenses"
          name="Gastos"
          fill="var(--danger)"
          radius={[6, 6, 0, 0]}
          maxBarSize={32}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

interface ForecastChartProps {
  data: {
    month: string;
    income: number;
    expenses: number;
    projectedBalance: number;
  }[];
}

export function ForecastChart({ data }: ForecastChartProps) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.3} />
            <stop offset="95%" stopColor="var(--accent)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis
          dataKey="month"
          stroke="var(--foreground-muted)"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke="var(--foreground-muted)"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={v => `${(v / 1000).toFixed(0)}k`}
        />
        <Tooltip
          contentStyle={{
            background: 'var(--background-secondary)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            padding: '12px',
          }}
          labelStyle={{ color: 'var(--foreground)' }}
          formatter={(value: number | undefined, name: string | undefined) => [
            formatCurrency(value ?? 0),
            name === 'projectedBalance' ? 'Saldo Projetado' : name === 'income' ? 'Receita' : 'Gastos',
          ]}
        />
        <Area
          type="monotone"
          dataKey="projectedBalance"
          stroke="var(--accent)"
          fill="url(#balanceGradient)"
          strokeWidth={2}
          name="projectedBalance"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

interface CategoryChartProps {
  data: { category: string; total: number; percentage: number }[];
}

export function CategoryChart({ data }: CategoryChartProps) {
  const chartData = data.slice(0, 6).map(d => ({
    name: CATEGORIES[d.category as ExpenseCategory]?.label || d.category,
    value: d.total,
    color: CATEGORIES[d.category as ExpenseCategory]?.color || '#94a3b8',
  }));

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-[200px] text-[var(--foreground-muted)] text-sm">
        Nenhum gasto registrado
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius={55}
          outerRadius={85}
          paddingAngle={3}
          dataKey="value"
          stroke="none"
        >
          {chartData.map((entry, index) => (
            <Cell key={index} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            background: 'var(--background-secondary)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            padding: '12px',
          }}
          formatter={(value: number | undefined) => [formatCurrency(value ?? 0)]}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
