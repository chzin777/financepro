'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Transaction, ExpenseCategory, CATEGORIES } from '../lib/types';

interface EditTransactionModalProps {
  isOpen: boolean;
  transaction: Transaction | null;
  onClose: () => void;
  onSave: (id: string, data: {
    description: string;
    amount: number;
    type: 'income' | 'expense';
    category: string;
    date: string;
  }) => void;
}

export default function EditTransactionModal({ isOpen, transaction, onClose, onSave }: EditTransactionModalProps) {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [category, setCategory] = useState<string>('outros');
  const [date, setDate] = useState('');

  useEffect(() => {
    if (transaction) {
      setDescription(transaction.description);
      setAmount(String(transaction.amount));
      setType(transaction.type);
      setCategory(transaction.category);
      setDate(new Date(transaction.date).toISOString().split('T')[0]);
    }
  }, [transaction]);

  if (!isOpen || !transaction) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !amount || parseFloat(amount) <= 0) return;

    onSave(transaction.id, {
      description,
      amount: parseFloat(amount),
      type,
      category,
      date: new Date(date + 'T12:00:00').toISOString(),
    });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">Editar Transação</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-[var(--background-tertiary)] transition-colors"
          >
            <X size={20} className="text-[var(--foreground-muted)]" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Type toggle */}
          <div className="flex gap-2 p-1 bg-[var(--background-tertiary)] rounded-xl">
            <button
              type="button"
              onClick={() => setType('expense')}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                type === 'expense'
                  ? 'bg-[var(--danger)] text-white shadow-lg'
                  : 'text-[var(--foreground-muted)] hover:text-[var(--foreground-secondary)]'
              }`}
            >
              Gasto
            </button>
            <button
              type="button"
              onClick={() => setType('income')}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                type === 'income'
                  ? 'bg-[var(--success)] text-white shadow-lg'
                  : 'text-[var(--foreground-muted)] hover:text-[var(--foreground-secondary)]'
              }`}
            >
              Receita
            </button>
          </div>

          <div>
            <label className="block text-sm text-[var(--foreground-secondary)] mb-2">Descrição</label>
            <input
              type="text"
              className="input-field"
              placeholder="Ex: Almoço, Uber, Netflix..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm text-[var(--foreground-secondary)] mb-2">Valor (R$)</label>
            <input
              type="number"
              className="input-field"
              placeholder="0,00"
              min="0.01"
              step="0.01"
              value={amount}
              onChange={e => setAmount(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm text-[var(--foreground-secondary)] mb-2">Categoria</label>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {(Object.entries(CATEGORIES) as [ExpenseCategory, typeof CATEGORIES[ExpenseCategory]][]).map(
                ([key, cat]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setCategory(key)}
                    className={`flex flex-col items-center gap-1 p-2.5 rounded-xl text-xs transition-all ${
                      category === key
                        ? 'ring-2 ring-[var(--accent)] bg-[var(--accent-soft)]'
                        : 'bg-[var(--background-tertiary)] hover:bg-[var(--border)]'
                    }`}
                  >
                    <span className="text-lg">{cat.icon}</span>
                    <span className="text-[var(--foreground-secondary)] truncate w-full text-center">
                      {cat.label}
                    </span>
                  </button>
                )
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm text-[var(--foreground-secondary)] mb-2">Data</label>
            <input
              type="date"
              className="input-field"
              value={date}
              onChange={e => setDate(e.target.value)}
            />
          </div>

          <button type="submit" className="btn-primary mt-2 py-3 text-base">
            Salvar Alterações
          </button>
        </form>
      </div>
    </div>
  );
}
