'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Bill, ExpenseCategory, CATEGORIES } from '../lib/types';

interface EditBillModalProps {
  isOpen: boolean;
  bill: Bill | null;
  onClose: () => void;
  onSave: (id: string, data: {
    name: string;
    amount: number;
    category: string;
    type: 'fixed' | 'temporary';
    dueDay: number;
    totalInstallments?: number;
    currentInstallment?: number;
  }) => void;
}

export default function EditBillModal({ isOpen, bill, onClose, onSave }: EditBillModalProps) {
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<string>('outros');
  const [type, setType] = useState<'fixed' | 'temporary'>('fixed');
  const [dueDay, setDueDay] = useState('');
  const [totalInstallments, setTotalInstallments] = useState('');
  const [currentInstallment, setCurrentInstallment] = useState('1');

  useEffect(() => {
    if (bill) {
      setName(bill.name);
      setAmount(String(bill.amount));
      setCategory(bill.category);
      setType(bill.type);
      setDueDay(String(bill.dueDay));
      setTotalInstallments(bill.totalInstallments ? String(bill.totalInstallments) : '');
      setCurrentInstallment(bill.currentInstallment ? String(bill.currentInstallment) : '1');
    }
  }, [bill]);

  if (!isOpen || !bill) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !amount || !dueDay) return;

    onSave(bill.id, {
      name,
      amount: parseFloat(amount),
      category,
      type,
      dueDay: parseInt(dueDay),
      ...(type === 'temporary'
        ? {
            totalInstallments: parseInt(totalInstallments) || undefined,
            currentInstallment: parseInt(currentInstallment) || 1,
          }
        : {}),
    });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">Editar Conta</h2>
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
              onClick={() => setType('fixed')}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                type === 'fixed'
                  ? 'bg-[var(--accent)] text-white shadow-lg'
                  : 'text-[var(--foreground-muted)] hover:text-[var(--foreground-secondary)]'
              }`}
            >
              🔄 Fixa
            </button>
            <button
              type="button"
              onClick={() => setType('temporary')}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                type === 'temporary'
                  ? 'bg-[var(--warning)] text-white shadow-lg'
                  : 'text-[var(--foreground-muted)] hover:text-[var(--foreground-secondary)]'
              }`}
            >
              ⏳ Temporária
            </button>
          </div>

          <div>
            <label className="block text-sm text-[var(--foreground-secondary)] mb-2">Nome da conta</label>
            <input
              type="text"
              className="input-field"
              placeholder="Ex: Netflix, Financiamento do carro..."
              value={name}
              onChange={e => setName(e.target.value)}
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
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
              <label className="block text-sm text-[var(--foreground-secondary)] mb-2">Dia vencimento</label>
              <input
                type="number"
                className="input-field"
                placeholder="1-31"
                min="1"
                max="31"
                value={dueDay}
                onChange={e => setDueDay(e.target.value)}
              />
            </div>
          </div>

          {type === 'temporary' && (
            <div className="grid grid-cols-2 gap-3 animate-fade-in">
              <div>
                <label className="block text-sm text-[var(--foreground-secondary)] mb-2">
                  Total de parcelas
                </label>
                <input
                  type="number"
                  className="input-field"
                  placeholder="Ex: 40"
                  min="1"
                  value={totalInstallments}
                  onChange={e => setTotalInstallments(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm text-[var(--foreground-secondary)] mb-2">
                  Parcela atual
                </label>
                <input
                  type="number"
                  className="input-field"
                  placeholder="Ex: 1"
                  min="1"
                  value={currentInstallment}
                  onChange={e => setCurrentInstallment(e.target.value)}
                />
              </div>
            </div>
          )}

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

          <button type="submit" className="btn-primary mt-2 py-3 text-base">
            Salvar Alterações
          </button>
        </form>
      </div>
    </div>
  );
}
