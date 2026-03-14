'use client';

import { useState } from 'react';
import { useWriteContract, useWaitForTransactionReceipt, useAccount } from 'wagmi';
import { parseEther } from 'viem';
import { HUSHFUND_ABI, HUSHFUND_ADDRESS } from '@/lib/contract';
import { LockIcon, EyeIcon, CheckCircleIcon, AlertCircleIcon } from '@/lib/icons';

interface DonationModalProps {
  campaignId: bigint;
  onClose: () => void;
  onSuccess?: () => void;
}

const QUICK_AMOUNTS = ['0.01', '0.05', '0.1', '0.25', '0.5'];

export function DonationModal({ campaignId, onClose, onSuccess }: DonationModalProps) {
  const { address } = useAccount();
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  const [isPrivate, setIsPrivate] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const { data: privHash, writeContract: writePrivate, isPending: privPending } = useWriteContract();
  const { data: pubHash, writeContract: writePublic, isPending: pubPending } = useWriteContract();
  const { isLoading: privConfirming } = useWaitForTransactionReceipt({ hash: privHash, query: { enabled: !!privHash } });
  const { isLoading: pubConfirming } = useWaitForTransactionReceipt({ hash: pubHash, query: { enabled: !!pubHash } });

  const loading = privPending || pubPending || privConfirming || pubConfirming;

  const handleDonate = async () => {
    setError('');
    if (!amount || Number(amount) <= 0) { setError('Please enter a valid ETH amount.'); return; }
    if (!address) { setError('Please connect your wallet first.'); return; }

    try {
      const value = parseEther(amount);
      if (isPrivate) {
        const mockHandle = `0x${'00'.repeat(32)}` as `0x${string}`;
        writePrivate({
          address: HUSHFUND_ADDRESS, abi: HUSHFUND_ABI,
          functionName: 'donatePrivate',
          args: [campaignId, mockHandle as unknown as `0x${string}`, '0x' as `0x${string}`, message],
          value,
        });
      } else {
        writePublic({
          address: HUSHFUND_ADDRESS, abi: HUSHFUND_ABI,
          functionName: 'donatePublic',
          args: [campaignId, message],
          value,
        });
      }
      setSuccess(true);
      setTimeout(() => { onClose(); onSuccess?.(); }, 2200);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message.slice(0, 100) : 'Transaction failed.');
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        {/* Header */}
        <div className="modal-header">
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Make a donation</h3>
            <p style={{ fontSize: '0.75rem', marginTop: '0.125rem', color: 'var(--text-3)' }}>
              Your{' '}{isPrivate ? 'amount is encrypted via FHE' : 'amount and address are public'}
            </p>
          </div>
          <button type="button" className="btn btn-ghost" onClick={onClose}
            style={{ width: 28, height: 28, padding: 0, borderRadius: 6, justifyContent: 'center' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="modal-body">
          {success ? (
            <div className="alert-success">
              <CheckCircleIcon size={16} color="#6ee7b7" />
              Donation submitted successfully. Thank you.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.125rem' }}>
              {/* Type toggle */}
              <div>
                <label className="label">Privacy</label>
                <div className="toggle-group">
                  <button type="button" className={`toggle-option ${isPrivate ? 'active' : ''}`} onClick={() => setIsPrivate(true)}>
                    <LockIcon size={12} /> Private
                  </button>
                  <button type="button" className={`toggle-option ${!isPrivate ? 'active' : ''}`} onClick={() => setIsPrivate(false)}>
                    <EyeIcon size={12} /> Public
                  </button>
                </div>
              </div>

              {/* Info */}
              <div className={`info-block ${isPrivate ? 'violet' : ''}`} style={{ fontSize: '0.75rem', lineHeight: 1.6 }}>
                {isPrivate
                  ? 'Your amount is encrypted client-side using Zama\'s fhEVM global public key. On-chain, FHE.add() accumulates ciphertexts. You appear as "Anonymous" on the donor wall.'
                  : 'Your wallet address and exact amount will be visible on the donor wall and on-chain.'}
              </div>

              {/* Amount */}
              <div>
                <label className="label">Amount (ETH)</label>
                <input type="number" className="input" placeholder="0.05" value={amount}
                  onChange={(e) => setAmount(e.target.value)} min="0" step="0.001" />
                <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                  {QUICK_AMOUNTS.map((q) => (
                    <button key={q} type="button" onClick={() => setAmount(q)}
                      className="btn btn-outline btn-sm"
                      style={{ fontFamily: 'var(--mono)', fontSize: '0.75rem', height: 28, padding: '0 0.625rem' }}>
                      {q}
                    </button>
                  ))}
                </div>
              </div>

              {/* Message */}
              <div>
                <label className="label">Message <span style={{ color: 'var(--text-3)', fontWeight: 400 }}>(optional)</span></label>
                <input type="text" className="input" placeholder="Leave a note…" value={message}
                  onChange={(e) => setMessage(e.target.value)} maxLength={120} />
              </div>

              {error && (
                <div className="alert-danger" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <AlertCircleIcon size={14} color="var(--danger)" /> {error}
                </div>
              )}

              <button type="button" className={`btn ${isPrivate ? 'btn-primary' : 'btn-green'} btn-lg`}
                style={{ width: '100%', justifyContent: 'center' }}
                onClick={handleDonate} disabled={loading}>
                {loading
                  ? <><div className="spinner" /> Processing…</>
                  : isPrivate ? 'Donate privately' : 'Donate publicly'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
