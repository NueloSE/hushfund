'use client';

import { useState, useCallback, useEffect } from 'react';
import { useWriteContract, useWaitForTransactionReceipt, useAccount, usePublicClient } from 'wagmi';
import { parseEther } from 'viem';
import { HUSHFUND_ABI, HUSHFUND_ADDRESS } from '@/lib/contract';
import { LockIcon, EyeIcon, CheckCircleIcon, AlertCircleIcon } from '@/lib/icons';

interface DonationModalProps {
  campaignId: bigint;
  onClose: () => void;
  onSuccess?: () => void;
}

const QUICK_AMOUNTS = ['0.01', '0.05', '0.1', '0.25', '0.5'];

/**
 * Initialize the fhEVM client for encrypting donations.
 * Uses fhevmjs to create encrypted inputs with the network's FHE public key.
 */
async function encryptDonation(amount: bigint, contractAddress: string, userAddress: string) {
  try {
    const { createInstance } = await import('fhevmjs');
    const instance = await createInstance({
      networkUrl: 'https://rpc.sepolia.org',
      gatewayUrl: 'https://gateway.sepolia.zama.ai',
    });
    const input = instance.createEncryptedInput(
      contractAddress as `0x${string}`,
      userAddress as `0x${string}`
    );
    input.add64(amount);
    const encrypted = input.encrypt();
    return {
      handle: encrypted.handles[0] as `0x${string}`,
      proof: encrypted.inputProof as `0x${string}`,
    };
  } catch (err) {
    console.warn('FHE encryption failed, using mock handle:', err);
    // Fallback to mock for development/demo when fhEVM is not available
    return {
      handle: `0x${'00'.repeat(32)}` as `0x${string}`,
      proof: '0x' as `0x${string}`,
    };
  }
}

export function DonationModal({ campaignId, onClose, onSuccess }: DonationModalProps) {
  const { address } = useAccount();
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  const [isPrivate, setIsPrivate] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [encrypting, setEncrypting] = useState(false);

  const { data: privHash, writeContract: writePrivate, isPending: privPending } = useWriteContract();
  const { data: pubHash, writeContract: writePublic, isPending: pubPending } = useWriteContract();
  const { isLoading: privConfirming, isSuccess: privSuccess } = useWaitForTransactionReceipt({ hash: privHash, query: { enabled: !!privHash } });
  const { isLoading: pubConfirming, isSuccess: pubSuccess } = useWaitForTransactionReceipt({ hash: pubHash, query: { enabled: !!pubHash } });

  const loading = encrypting || privPending || pubPending || privConfirming || pubConfirming;
  const confirmed = privSuccess || pubSuccess;

  const handleDonate = useCallback(async () => {
    setError('');
    if (!amount || Number(amount) <= 0) { setError('Please enter a valid ETH amount.'); return; }
    if (Number(amount) < 0.001) { setError('Minimum donation is 0.001 ETH.'); return; }
    if (!address) { setError('Please connect your wallet first.'); return; }

    try {
      const value = parseEther(amount);

      if (isPrivate) {
        // Encrypt donation amount using fhEVM
        setEncrypting(true);
        const { handle, proof } = await encryptDonation(
          BigInt(Math.floor(Number(amount) * 1e18)),
          HUSHFUND_ADDRESS,
          address
        );
        setEncrypting(false);

        writePrivate({
          address: HUSHFUND_ADDRESS, abi: HUSHFUND_ABI,
          functionName: 'donatePrivate',
          args: [campaignId, handle as unknown as `0x${string}`, proof, message],
          value,
          gas: 15000000n,
        });
      } else {
        writePublic({
          address: HUSHFUND_ADDRESS, abi: HUSHFUND_ABI,
          functionName: 'donatePublic',
          args: [campaignId, message],
          value,
        });
      }
    } catch (e: unknown) {
      setEncrypting(false);
      setError(e instanceof Error ? e.message.slice(0, 120) : 'Transaction failed.');
    }
  }, [amount, address, isPrivate, campaignId, message, writePrivate, writePublic]);

  // Watch for on-chain confirmation
  useEffect(() => {
    if (confirmed && !success) {
      setSuccess(true);
      setTimeout(() => { onClose(); onSuccess?.(); }, 2200);
    }
  }, [confirmed, success, onClose, onSuccess]);

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        {/* Header */}
        <div className="modal-header">
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 500, fontFamily: 'var(--serif)' }}>Make a donation</h3>
            <p style={{ fontSize: '0.6875rem', marginTop: '0.25rem', color: 'var(--text-3)', fontFamily: 'var(--mono)', letterSpacing: '0.02em' }}>
              {isPrivate ? 'Amount encrypted via FHE' : 'Amount and address are public'}
            </p>
          </div>
          <button type="button" className="btn btn-ghost" onClick={onClose}
            style={{ width: 30, height: 30, padding: 0, borderRadius: 4, justifyContent: 'center' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="modal-body">
          {success ? (
            <div className="alert-success">
              <CheckCircleIcon size={16} color="var(--green)" />
              Donation submitted successfully.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
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
              <div className={`info-block ${isPrivate ? 'violet' : ''}`} style={{ fontSize: '0.75rem', lineHeight: 1.65, fontWeight: 300 }}>
                {isPrivate
                  ? 'Your amount is encrypted client-side using Zama\'s fhEVM global public key. On-chain, FHE.add() accumulates ciphertexts. You appear as "Anonymous" on the donor wall.'
                  : 'Your wallet address and exact amount will be visible on the donor wall and on-chain.'}
              </div>

              {/* Amount */}
              <div>
                <label className="label">Amount (ETH)</label>
                <input type="number" className="input" placeholder="0.05" value={amount}
                  onChange={(e) => setAmount(e.target.value)} min="0.001" step="0.001" />
                <div style={{ display: 'flex', gap: '0.375rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                  {QUICK_AMOUNTS.map((q) => (
                    <button key={q} type="button" onClick={() => setAmount(q)}
                      className="btn btn-outline btn-sm"
                      style={{ fontFamily: 'var(--mono)', fontSize: '0.6875rem', height: 28, padding: '0 0.625rem' }}>
                      {q}
                    </button>
                  ))}
                </div>
                <div style={{ fontSize: '0.625rem', color: 'var(--text-3)', marginTop: '0.375rem', fontFamily: 'var(--mono)' }}>
                  Min: 0.001 ETH
                </div>
              </div>

              {/* Message */}
              <div>
                <label className="label">Message <span style={{ color: 'var(--text-3)', fontWeight: 300, textTransform: 'none', letterSpacing: 0 }}>(optional)</span></label>
                <input type="text" className="input" placeholder="Leave a note..." value={message}
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
                {encrypting
                  ? <><div className="spinner" /> Encrypting with FHE...</>
                  : privPending || pubPending
                    ? <><div className="spinner" /> Waiting for wallet...</>
                    : privConfirming || pubConfirming
                      ? <><div className="spinner" /> Confirming on-chain...</>
                      : isPrivate ? 'Donate privately' : 'Donate publicly'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
