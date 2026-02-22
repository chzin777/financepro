'use client';

import { AlertTriangle } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning';
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  variant = 'danger',
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  const colors = variant === 'danger'
    ? { bg: 'bg-[var(--danger)]', soft: 'bg-[var(--danger-soft)]', text: 'text-[var(--danger)]' }
    : { bg: 'bg-[var(--warning)]', soft: 'bg-[var(--warning-soft)]', text: 'text-[var(--warning)]' };

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div
        className="modal-content max-w-sm"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex flex-col items-center text-center gap-4 py-2">
          <div className={`w-14 h-14 rounded-full ${colors.soft} flex items-center justify-center`}>
            <AlertTriangle size={28} className={colors.text} />
          </div>
          <div>
            <h3 className="text-lg font-bold mb-1">{title}</h3>
            <p className="text-sm text-[var(--foreground-muted)]">{message}</p>
          </div>
          <div className="flex gap-3 w-full mt-2">
            <button
              onClick={onCancel}
              className="flex-1 py-2.5 rounded-xl border border-[var(--border)] text-sm font-medium hover:bg-[var(--background-tertiary)] transition-colors"
            >
              {cancelLabel}
            </button>
            <button
              onClick={onConfirm}
              className={`flex-1 py-2.5 rounded-xl ${colors.bg} text-white text-sm font-semibold hover:opacity-90 transition-opacity`}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
