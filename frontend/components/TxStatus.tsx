'use client';

import { useEffect, useState } from 'react';
import { CheckCircleIcon, AlertCircleIcon } from '@/lib/icons';

interface TxStatusProps {
  isPending: boolean;
  isConfirming: boolean;
  isSuccess: boolean;
  isError: boolean;
  pendingText?: string;
  confirmingText?: string;
  successText?: string;
  errorText?: string;
  onSuccessDone?: () => void;
}

export function TxStatus({
  isPending,
  isConfirming,
  isSuccess,
  isError,
  pendingText = 'Waiting for wallet approval...',
  confirmingText = 'Confirming on-chain...',
  successText = 'Transaction confirmed!',
  errorText = 'Transaction failed.',
  onSuccessDone,
}: TxStatusProps) {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const active = isPending || isConfirming || isSuccess || isError;

  useEffect(() => {
    if (active && !dismissed) setVisible(true);
  }, [active, dismissed]);

  useEffect(() => {
    if (isSuccess) {
      const t = setTimeout(() => {
        setVisible(false);
        setDismissed(true);
        onSuccessDone?.();
      }, 2500);
      return () => clearTimeout(t);
    }
  }, [isSuccess, onSuccessDone]);

  useEffect(() => {
    if (isError) {
      const t = setTimeout(() => {
        setVisible(false);
        setDismissed(true);
      }, 4000);
      return () => clearTimeout(t);
    }
  }, [isError]);

  if (!visible) return null;

  let bg = 'var(--surface)';
  let border = 'var(--border-2)';
  let icon = null;
  let text = '';

  if (isPending) {
    text = pendingText;
    icon = <div className="spinner" style={{ width: 16, height: 16, borderTopColor: 'var(--accent)' }} />;
  } else if (isConfirming) {
    text = confirmingText;
    bg = 'var(--surface)';
    icon = <div className="spinner" style={{ width: 16, height: 16, borderTopColor: 'var(--accent)' }} />;
  } else if (isSuccess) {
    text = successText;
    bg = 'var(--green-lt)';
    border = 'var(--green-ring)';
    icon = <CheckCircleIcon size={16} color="var(--green)" />;
  } else if (isError) {
    text = errorText;
    bg = 'var(--danger-lt)';
    border = 'rgba(232,116,97,0.2)';
    icon = <AlertCircleIcon size={16} color="var(--danger)" />;
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: 24,
      right: 24,
      zIndex: 300,
      background: bg,
      border: `1px solid ${border}`,
      borderRadius: 8,
      padding: '0.875rem 1.25rem',
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
      minWidth: 280,
      maxWidth: 400,
      boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
      animation: 'modal-in 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
    }}>
      {icon}
      <div>
        <div style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text)' }}>{text}</div>
        {(isPending || isConfirming) && (
          <div style={{ fontSize: '0.6875rem', color: 'var(--text-3)', marginTop: '0.125rem', fontFamily: 'var(--mono)' }}>
            {isPending ? 'Check your wallet' : 'Waiting for block...'}
          </div>
        )}
      </div>
    </div>
  );
}
