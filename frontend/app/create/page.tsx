'use client';

import { useState } from 'react';
import { useWriteContract, useWaitForTransactionReceipt, useAccount } from 'wagmi';
import { useRouter } from 'next/navigation';
import { HUSHFUND_ABI, HUSHFUND_ADDRESS } from '@/lib/contract';
import { ethToWei } from '@/lib/utils';
import { AlertCircleIcon } from '@/lib/icons';
import { TxStatus } from '@/components/TxStatus';
import { ImageUpload } from '@/components/ImageUpload';

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

  const { data: txHash, writeContract, isPending, isError: txError } = useWriteContract();
  const { isLoading: confirming, isSuccess } = useWaitForTransactionReceipt({ hash: txHash, query: { enabled: !!txHash } });

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
      gas: 15000000n,
    });
  };

  if (!address) {
    return (
      <div className="container section">
        <div className="empty-state">
          <h3>Connect your wallet</h3>
          <p style={{ marginTop: '0.5rem' }}>You need a connected wallet to create a campaign.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '3.5rem 2rem', maxWidth: 620 }}>
      <div style={{ marginBottom: '2.5rem' }}>
        <span className="section-tag">Create campaign</span>
        <h1 style={{ fontSize: 'clamp(1.75rem, 3vw, 2.5rem)', marginBottom: '0.5rem' }}>New <em>campaign</em></h1>
        <p style={{ fontSize: '0.875rem', fontWeight: 300 }}>Launch a privacy-preserving fundraiser on-chain.</p>
      </div>

      {/* Step bar */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '2.5rem' }}>
        {STEPS.map((label, i) => {
          const stepNum = i + 1;
          const isActive = step === stepNum;
          const isDone = step > stepNum;
          const isFuture = step < stepNum;
          return (
            <div key={label} style={{ flex: 1 }}>
              {/* Progress bar */}
              <div style={{
                height: 4,
                borderRadius: 2,
                background: isDone || isActive ? 'var(--accent)' : 'var(--border)',
                marginBottom: '0.75rem',
                opacity: isFuture ? 0.2 : 1,
                transition: 'all 0.3s ease',
                boxShadow: isActive ? '0 0 8px rgba(201, 168, 76, 0.3)' : 'none',
              }} />
              {/* Label row with step number */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{
                  width: 22,
                  height: 22,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.625rem',
                  fontFamily: 'var(--mono)',
                  fontWeight: 600,
                  flexShrink: 0,
                  transition: 'all 0.3s ease',
                  background: isActive ? 'var(--accent)' : isDone ? 'var(--accent)' : 'var(--surface-3)',
                  color: isActive || isDone ? '#08080A' : 'var(--text-3)',
                  border: isActive ? '1px solid var(--accent)' : isDone ? '1px solid var(--accent)' : '1px solid var(--border)',
                }}>
                  {isDone ? '\u2713' : stepNum}
                </div>
                <span style={{
                  fontSize: '0.6875rem',
                  color: isActive ? 'var(--text)' : isDone ? 'var(--accent)' : 'var(--text-3)',
                  fontWeight: isActive ? 600 : 400,
                  fontFamily: 'var(--mono)',
                  letterSpacing: '0.03em',
                  textTransform: 'uppercase',
                  transition: 'all 0.3s ease',
                }}>{label}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)' }}>
          <h3 style={{ fontSize: '0.875rem', fontWeight: 500 }}>
            <span style={{ fontFamily: 'var(--mono)', color: 'var(--accent)', marginRight: '0.5rem', fontSize: '0.75rem' }}>0{step}</span>
            {STEPS[step - 1]}
          </h3>
        </div>
        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          {/* Step 1 */}
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
              <ImageUpload value={imageUrl} onChange={setImageUrl} />
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

          {/* Step 2 */}
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
                <label className="label">Deadline <span style={{ color: 'var(--text-3)', fontWeight: 300, textTransform: 'none', letterSpacing: 0 }}>(optional)</span></label>
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

          {/* Step 3 */}
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
                    padding: '0.875rem 0',
                    borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none',
                    fontSize: '0.875rem',
                    gap: '1rem',
                  }}>
                    <span style={{ color: 'var(--text-3)', fontFamily: 'var(--mono)', fontSize: '0.75rem', letterSpacing: '0.04em', textTransform: 'uppercase' }}>{label}</span>
                    <span style={{ color: 'var(--text)', fontWeight: 500, textAlign: 'right' }}>{value}</span>
                  </div>
                ))}
              </div>

              <div className="info-block" style={{ fontSize: '0.75rem', fontWeight: 300 }}>
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
                  {loading ? <><div className="spinner" /> {confirming ? 'Confirming...' : 'Sending...'}</> : 'Launch campaign'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <TxStatus
        isPending={isPending}
        isConfirming={confirming}
        isSuccess={isSuccess}
        isError={txError}
        pendingText="Launching campaign..."
        confirmingText="Confirming on-chain..."
        successText="Campaign created successfully!"
        errorText="Failed to create campaign."
        onSuccessDone={() => router.push('/dashboard')}
      />
    </div>
  );
}
