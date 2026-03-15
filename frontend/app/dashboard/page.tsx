'use client';

import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import Link from 'next/link';
import { HUSHFUND_ABI, HUSHFUND_ADDRESS, type Campaign } from '@/lib/contract';
import { formatETH, shortAddress } from '@/lib/utils';
import { StatCard } from '@/components/StatCard';
import { TrendingUpIcon, UsersIcon, ZapIcon, CheckCircleIcon, ArrowRightIcon } from '@/lib/icons';
import { TxStatus } from '@/components/TxStatus';

export default function DashboardPage() {
  const { address, isConnected } = useAccount();
  const { data: allCampaigns, isLoading, refetch } = useReadContract({
    address: HUSHFUND_ADDRESS, abi: HUSHFUND_ABI,
    functionName: 'getCampaigns', args: [1n, 50n],
    query: { enabled: isConnected },
  });
  const { data: withdrawTx, writeContract: doWithdraw, isPending: withdrawing, isError: withdrawErr } = useWriteContract();
  const { isLoading: withdrawConfirming, isSuccess: withdrawSuccess } = useWaitForTransactionReceipt({ hash: withdrawTx, query: { enabled: !!withdrawTx } });

  const { data: closeTx, writeContract: doClose, isPending: closing, isError: closeErr } = useWriteContract();
  const { isLoading: closeConfirming, isSuccess: closeSuccess } = useWaitForTransactionReceipt({ hash: closeTx, query: { enabled: !!closeTx } });

  if (!isConnected) {
    return (
      <div className="container section">
        <div className="empty-state">
          <h3>Connect your wallet</h3>
          <p style={{ marginTop: '0.5rem' }}>Connect to view your creator dashboard.</p>
        </div>
      </div>
    );
  }

  const all = (allCampaigns as Campaign[] | undefined) || [];
  const mine = all.filter((c) => c.creator?.toLowerCase() === address?.toLowerCase());

  const totalRaised = mine.reduce((s, c) => s + c.totalRaised, 0n);
  const totalDonors = mine.reduce((s, c) => s + c.donorCount, 0n);
  const activeCnt = mine.filter((c) => c.active && !c.withdrawn).length;
  const doneCnt = mine.filter((c) => c.withdrawn).length;

  const handleWithdraw = (id: bigint) => {
    doWithdraw({ address: HUSHFUND_ADDRESS, abi: HUSHFUND_ABI, functionName: 'withdrawFunds', args: [id] });
    setTimeout(() => refetch(), 3000);
  };

  const handleClose = (id: bigint) => {
    doClose({ address: HUSHFUND_ADDRESS, abi: HUSHFUND_ABI, functionName: 'closeCampaign', args: [id] });
    setTimeout(() => refetch(), 3000);
  };

  return (
    <div className="container" style={{ padding: '3rem 2rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '3rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <span className="section-tag">Dashboard</span>
          <h1 style={{ fontSize: 'clamp(1.75rem, 3vw, 2.5rem)', marginBottom: '0.375rem' }}>Your <em>campaigns</em></h1>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-3)', fontFamily: 'var(--mono)', letterSpacing: '0.02em' }}>
            Connected as{' '}
            <span style={{ color: 'var(--text-2)' }}>{shortAddress(address!)}</span>
          </p>
        </div>
        <Link href="/create" className="btn btn-primary btn-sm">
          New campaign
        </Link>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: '0.875rem', marginBottom: '3rem' }}>
        <StatCard label="Total raised" value={formatETH(totalRaised)} icon={<TrendingUpIcon size={14} />} accent />
        <StatCard label="Total donors" value={String(Number(totalDonors))} icon={<UsersIcon size={14} />} />
        <StatCard label="Active" value={String(activeCnt)} icon={<ZapIcon size={14} />} />
        <StatCard label="Completed" value={String(doneCnt)} icon={<CheckCircleIcon size={14} />} />
      </div>

      {/* Loading skeletons */}
      {isLoading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          {Array.from({ length: 3 }).map((_, i) => <div key={i} className="shimmer" style={{ height: 120, borderRadius: 8 }} />)}
        </div>
      )}

      {/* Empty */}
      {!isLoading && mine.length === 0 && (
        <div className="empty-state" style={{ padding: '5rem 2rem' }}>
          <h3>No campaigns yet</h3>
          <p style={{ marginTop: '0.5rem', marginBottom: '1.5rem' }}>Create your first private fundraiser.</p>
          <Link href="/create" className="btn btn-primary">Create campaign</Link>
        </div>
      )}

      {/* Campaign rows */}
      {!isLoading && mine.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {mine.map((c) => {
            const canWithdraw = !c.withdrawn && (c.mode === 1 || c.milestoneReached);
            const canClose = c.active && !c.withdrawn;
            const progress = c.mode === 0 && c.goalAmount > 0n
              ? Math.min(100, Math.round(Number(c.totalRaised * 100n / c.goalAmount)))
              : null;

            const isClosed = !c.active || c.withdrawn;

            return (
              <div key={String(c.id)} style={{
                background: isClosed ? 'var(--surface)' : 'var(--surface)',
                border: `1px solid ${c.withdrawn ? 'rgba(74,222,128,0.15)' : isClosed ? 'var(--border)' : 'var(--border)'}`,
                borderRadius: 8,
                overflow: 'hidden',
                opacity: isClosed ? 0.7 : 1,
                transition: 'opacity 0.2s',
                position: 'relative',
              }}>
                {/* Status ribbon for closed/completed */}
                {isClosed && (
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    padding: '0.3rem 0.75rem',
                    borderBottomLeftRadius: 6,
                    background: c.withdrawn
                      ? 'rgba(74,222,128,0.15)'
                      : 'rgba(107,101,96,0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                    zIndex: 2,
                  }}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={c.withdrawn ? 'var(--green)' : 'var(--text-3)'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      {c.withdrawn
                        ? <><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></>
                        : <><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></>
                      }
                    </svg>
                    <span style={{
                      fontSize: '0.5625rem',
                      fontWeight: 600,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      fontFamily: 'var(--mono)',
                      color: c.withdrawn ? 'var(--green)' : 'var(--text-3)',
                    }}>
                      {c.withdrawn ? 'Completed' : 'Closed'}
                    </span>
                  </div>
                )}

                <div style={{ padding: '1.25rem 1.5rem', display: 'flex', gap: '1.25rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ display: 'flex', gap: '0.375rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                      {c.withdrawn
                        ? <span className="badge badge-green">Funds withdrawn</span>
                        : c.milestoneReached
                          ? <span className="badge badge-green">Goal reached</span>
                          : c.active ? <span className="badge badge-gold">{c.mode === 0 ? 'Milestone' : 'Flexible'}</span>
                            : <span className="badge badge-stone">Closed</span>}
                    </div>
                    <h3 style={{ fontSize: '0.9375rem', fontWeight: 500, marginBottom: '0.25rem', letterSpacing: '-0.01em' }}>{c.title}</h3>
                    <p style={{ fontSize: '0.8125rem', color: 'var(--text-3)', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', fontWeight: 300 }}>
                      {c.description}
                    </p>
                  </div>

                  {/* Metrics */}
                  <div style={{ display: 'flex', gap: '1.75rem', flexShrink: 0 }}>
                    {[
                      { label: 'Raised', value: formatETH(c.totalRaised) },
                      { label: 'Goal', value: c.mode === 0 ? formatETH(c.goalAmount) : '—' },
                      { label: 'Donors', value: String(Number(c.donorCount)) },
                      { label: 'Progress', value: progress !== null ? `${progress}%` : '—' },
                    ].map(({ label, value }) => (
                      <div key={label}>
                        <div style={{ fontSize: '0.5625rem', color: 'var(--text-3)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--mono)' }}>{label}</div>
                        <div style={{ fontSize: '0.875rem', fontWeight: 400, color: 'var(--text)', fontFamily: 'var(--serif)' }}>{value}</div>
                      </div>
                    ))}
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0, alignItems: 'center' }}>
                    {canWithdraw && (
                      <button type="button" className="btn btn-green btn-sm"
                        onClick={() => handleWithdraw(c.id)}
                        disabled={withdrawing || withdrawConfirming}>
                        {withdrawing || withdrawConfirming ? <><div className="spinner" style={{ width: 12, height: 12 }} /> ...</> : 'Withdraw'}
                      </button>
                    )}
                    {canClose && (
                      <button type="button" className="btn btn-outline btn-sm"
                        style={{ borderColor: 'rgba(232,116,97,0.25)', color: 'var(--danger)' }}
                        onClick={() => handleClose(c.id)}
                        disabled={closing || closeConfirming}>
                        {closing || closeConfirming ? '...' : 'Close'}
                      </button>
                    )}
                    <Link href={`/campaign/${c.id}`} className="btn btn-outline btn-sm"
                      style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      View <ArrowRightIcon size={11} />
                    </Link>
                  </div>
                </div>

                {/* Progress bar strip */}
                {progress !== null && (
                  <div style={{ height: 2, background: 'var(--surface-3)' }}>
                    <div style={{ height: '100%', width: `${progress}%`, background: c.milestoneReached || c.withdrawn ? 'var(--green)' : isClosed ? 'var(--text-3)' : 'var(--accent)', transition: 'width 1s ease' }} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <TxStatus
        isPending={withdrawing}
        isConfirming={withdrawConfirming}
        isSuccess={withdrawSuccess}
        isError={withdrawErr}
        pendingText="Withdrawing funds..."
        confirmingText="Confirming withdrawal..."
        successText="Funds withdrawn!"
        errorText="Withdrawal failed."
        onSuccessDone={() => refetch()}
      />
      <TxStatus
        isPending={closing}
        isConfirming={closeConfirming}
        isSuccess={closeSuccess}
        isError={closeErr}
        pendingText="Closing campaign..."
        confirmingText="Confirming on-chain..."
        successText="Campaign closed!"
        errorText="Failed to close campaign."
        onSuccessDone={() => refetch()}
      />
    </div>
  );
}
