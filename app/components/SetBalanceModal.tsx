'use client';

import { useState } from 'react';
import { X, DollarSign } from 'lucide-react';

interface SetBalanceModalProps {
  isOpen: boolean;
  currentBalance: number;
  onClose: () => void;
  onSet: (balance: number) => void;
}

export default function SetBalanceModal({ isOpen, currentBalance, onClose, onSet }: SetBalanceModalProps) {
  const [balance, setBalance] = useState(currentBalance.toString());

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(balance);
    if (isNaN(val)) return;
    onSet(val);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">Definir Saldo</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-[var(--background-tertiary)] transition-colors"
          >
            <X size={20} className="text-[var(--foreground-muted)]" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm text-[var(--foreground-secondary)] mb-2">
              Saldo atual (R$)
            </label>
            <div className="relative">
              <DollarSign
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)]"
              />
              <input
                type="number"
                className="input-field pl-10"
                placeholder="0,00"
                step="0.01"
                value={balance}
                onChange={e => setBalance(e.target.value)}
                autoFocus
              />
            </div>
          </div>

          <button type="submit" className="btn-primary mt-2 py-3 text-base">
            Salvar Saldo
          </button>
        </form>
      </div>
    </div>
  );
}
