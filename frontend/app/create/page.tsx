'use client';

import { useState } from 'react';
import { useWriteContract, useWaitForTransactionReceipt, useAccount } from 'wagmi';
import { useRouter } from 'next/navigation';
import { HUSHFUND_ABI, HUSHFUND_ADDRESS } from '@/lib/contract';
import { ethToWei } from '@/lib/utils';
import { CheckCircleIcon, AlertCircleIcon } from '@/lib/icons';

type Mode = 'MILESTONE' | 'FLEXIBLE';

const STEPS = ['Campaign info', 'Configuration', 'Review & launch'] as const;

export default function CreatePage() {
  const { address } = useAccount();
  const router = useRouter();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [mode, setMode] = useState<Mode>('MILESTONE');
  const [goalAmount, setGoalAmount] = useState('');
  const [deadline, setDeadline] = useState('');
  const [error, setError] = useState('');

  const { data: txHash, writeContract, isPending } = useWriteContract();
  const { isLoading: confirming, isSuccess } = useWaitForTransactionReceipt({ hash: txHash, query: { enabled: !!txHash } });

  if (isSuccess) router.push('/dashboard');

  const loading = isPending || confirming;

  const validate = () => {
    if (!title.trim()) return 'Campaign title is required.';
    if (!description.trim()) return 'Campaign description is required.';
    if (mode === 'MILESTONE' && (!goalAmount || Number(goalAmount) <= 0)) return 'A goal amount is required for Milestone campaigns.';
    return '';
  };

  const handleLaunch = () => {
    const err = validate();
    if (err) { setError(err); return; }
    setError('');
    const goalWei = mode === 'MILESTONE' ? ethToWei(goalAmount) : 0n;
    const deadlineTs = deadline ? BigInt(Math.floor(new Date(deadline).getTime() / 1000)) : 0n;
    writeContract({
      address: HUSHFUND_ADDRESS, abi: HUSHFUND_ABI,
      functionName: 'createCampaign',
      args: [title, description, imageUrl, goalWei, mode === 'MILESTONE' ? 0 : 1, deadlineTs],
    });
  };

  if (!address) {
    return (
      <div className="container section">
        <div className="empty-state">
          <h3>Connect your wallet</h3>
          <p style={{ marginTop: '0.375rem' }}>You need a connected wallet to create a campaign.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '3rem 1.5rem', maxWidth: 620 }}>
      <div style={{ marginBottom: '2rem' }}>
        <span className="section-tag">Create campaign</span>
        <h1 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>New campaign</h1>
        <p style={{ fontSize: '0.875rem' }}>Launch a privacy-preserving fundraiser on-chain.</p>
      </div>

      {/* Step bar */}
      <div style={{ display: 'flex', gap: '0.375rem', marginBottom: '2rem' }}>
        {STEPS.map((label, i) => (
          <div key={label} style={{ flex: 1 }}>
            <div style={{ height: 3, borderRadius: 2, background: step > i + 1 ? 'var(--primary)' : step === i + 1 ? 'var(--primary)' : 'var(--border)', marginBottom: '0.375rem', opacity: step < i + 1 ? 0.3 : 1 }} />
            <span style={{ fontSize: '0.6875rem', color: step === i + 1 ? 'var(--text-2)' : 'var(--text-3)', fontWeight: step === i + 1 ? 600 : 400 }}>{label}</span>
          </div>
        ))}
      </div>

      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)' }}>
          <h3 style={{ fontSize: '0.9375rem' }}>Step {step} — {STEPS[step - 1]}</h3>
        </div>
        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.125rem' }}>

          {/* ── Step 1 ─────────────────────────────── */}
          {step === 1 && (
            <>
              <div>
                <label className="label">Campaign title *</label>
                <input type="text" className="input" placeholder="E.g. Open Source Climate Model" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={80} />
              </div>
              <div>
                <label className="label">Description *</label>
                <textarea className="input" placeholder="What are you building and why does it matter?" value={description} onChange={(e) => setDescription(e.target.value)} rows={4} maxLength={1000} />
              </div>
              <div>
                <label className="label">Cover image URL <span style={{ color: 'var(--text-3)', fontWeight: 400 }}>(optional)</span></label>
                <input type="url" className="input" placeholder="https://…" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} />
              </div>
              {imageUrl && (
                <img src={imageUrl} alt="" style={{ width: '100%', height: 140, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--border)' }}
                  onError={(e) => (e.currentTarget.style.display = 'none')} />
              )}
              {error && <div className="alert-danger">{error}</div>}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.25rem' }}>
                <button type="button" className="btn btn-primary"
                  onClick={() => {
                    if (!title.trim() || !description.trim()) { setError('Title and description are required.'); return; }
                    setError(''); setStep(2);
                  }}>
                  Continue
                </button>
              </div>
            </>
          )}

          {/* ── Step 2 ─────────────────────────────── */}
          {step === 2 && (
            <>
              <div>
                <label className="label">Campaign mode *</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.625rem' }}>
                  {([
                    { key: 'MILESTONE' as Mode, title: 'Milestone', desc: 'Funds locked until goal is reached' },
                    { key: 'FLEXIBLE' as Mode, title: 'Flexible', desc: 'Creator can withdraw at any time' },
                  ]).map(({ key, title, desc }) => (
                    <button key={key} type="button" className={`mode-card ${mode === key ? 'selected' : ''}`} onClick={() => setMode(key)}>
                      <div className="mode-card-title">{title}</div>
                      <div className="mode-card-desc">{desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {mode === 'MILESTONE' && (
                <div>
                  <label className="label">Funding goal (ETH) *</label>
                  <input type="number" className="input" placeholder="1.5" value={goalAmount} onChange={(e) => setGoalAmount(e.target.value)} min="0" step="0.01" />
                </div>
              )}

              <div>
                <label className="label">Deadline <span style={{ color: 'var(--text-3)', fontWeight: 400 }}>(optional)</span></label>
                <input type="date" className="input" value={deadline} onChange={(e) => setDeadline(e.target.value)} min={new Date().toISOString().split('T')[0]} />
              </div>

              {error && <div className="alert-danger">{error}</div>}
              <div style={{ display: 'flex', gap: '0.625rem', marginTop: '0.25rem' }}>
                <button type="button" className="btn btn-outline" onClick={() => { setError(''); setStep(1); }}>Back</button>
                <button type="button" className="btn btn-primary"
                  onClick={() => {
                    const err = validate();
                    if (err) { setError(err); return; }
                    setError(''); setStep(3);
                  }}>
                  Review
                </button>
              </div>
            </>
          )}

          {/* ── Step 3 ─────────────────────────────── */}
          {step === 3 && (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                {[
                  { label: 'Title', value: title },
                  { label: 'Mode', value: mode === 'MILESTONE' ? 'Milestone' : 'Flexible' },
                  { label: 'Goal', value: mode === 'MILESTONE' ? `${goalAmount} ETH` : 'None' },
                  { label: 'Deadline', value: deadline || 'None set' },
                ].map(({ label, value }, i, arr) => (
                  <div key={label} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '0.75rem 0',
                    borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none',
                    fontSize: '0.875rem',
                    gap: '1rem',
                  }}>
                    <span style={{ color: 'var(--text-3)' }}>{label}</span>
                    <span style={{ color: 'var(--text)', fontWeight: 500, textAlign: 'right' }}>{value}</span>
                  </div>
                ))}
              </div>

              <div className="info-block" style={{ fontSize: '0.75rem' }}>
                Campaign metadata is stored on-chain. Donors will be able to contribute privately (FHE-encrypted) or publicly.
              </div>

              {error && (
                <div className="alert-danger" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <AlertCircleIcon size={14} color="var(--danger)" /> {error}
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.625rem' }}>
                <button type="button" className="btn btn-outline" onClick={() => setStep(2)}>Back</button>
                <button type="button" className="btn btn-primary"
                  style={{ flex: 1, justifyContent: 'center' }}
                  onClick={handleLaunch} disabled={loading}>
                  {loading ? <><div className="spinner" /> {confirming ? 'Confirming…' : 'Sending…'}</> : 'Launch campaign'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
