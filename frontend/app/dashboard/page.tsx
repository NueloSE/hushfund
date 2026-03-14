'use client';

import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import Link from 'next/link';
import { HUSHFUND_ABI, HUSHFUND_ADDRESS, type Campaign } from '@/lib/contract';
import { formatETH, shortAddress } from '@/lib/utils';
import { StatCard } from '@/components/StatCard';
import { TrendingUpIcon, UsersIcon, ZapIcon, CheckCircleIcon, ArrowRightIcon } from '@/lib/icons';

export default function DashboardPage() {
  const { address, isConnected } = useAccount();
  const { data: allCampaigns, isLoading, refetch } = useReadContract({
    address: HUSHFUND_ADDRESS, abi: HUSHFUND_ABI,
    functionName: 'getCampaigns', args: [1n, 50n],
    query: { enabled: isConnected },
  });
  const { data: withdrawTx, writeContract: doWithdraw, isPending: withdrawing } = useWriteContract();
  const { isLoading: withdrawConfirming } = useWaitForTransactionReceipt({ hash: withdrawTx, query: { enabled: !!withdrawTx } });

  if (!isConnected) {
    return (
      <div className="container section">
        <div className="empty-state">
          <h3>Connect your wallet</h3>
          <p style={{ marginTop: '0.375rem' }}>Connect to view your creator dashboard.</p>
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

  return (
    <div className="container" style={{ padding: '2.5rem 1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <span className="section-tag">Dashboard</span>
          <h1 style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>Your campaigns</h1>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-3)' }}>
            Connected as{' '}
            <span style={{ fontFamily: 'var(--mono)', color: 'var(--text-2)' }}>{shortAddress(address!)}</span>
          </p>
        </div>
        <Link href="/create" className="btn btn-primary btn-sm">
          New campaign
        </Link>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.875rem', marginBottom: '2.5rem' }}>
        <StatCard label="Total raised" value={formatETH(totalRaised)} icon={<TrendingUpIcon size={14} />} accent />
        <StatCard label="Total donors" value={String(Number(totalDonors))} icon={<UsersIcon size={14} />} />
        <StatCard label="Active" value={String(activeCnt)} icon={<ZapIcon size={14} />} />
        <StatCard label="Completed" value={String(doneCnt)} icon={<CheckCircleIcon size={14} />} />
      </div>

      {/* Loading skeletons */}
      {isLoading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          {Array.from({ length: 3 }).map((_, i) => <div key={i} className="shimmer" style={{ height: 120, borderRadius: 10 }} />)}
        </div>
      )}

      {/* Empty */}
      {!isLoading && mine.length === 0 && (
        <div className="empty-state" style={{ padding: '4rem 2rem' }}>
          <h3>No campaigns yet</h3>
          <p style={{ marginTop: '0.375rem', marginBottom: '1.5rem' }}>Create your first private fundraiser.</p>
          <Link href="/create" className="btn btn-primary">Create campaign</Link>
        </div>
      )}

      {/* Campaign rows */}
      {!isLoading && mine.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {mine.map((c) => {
            const canWithdraw = !c.withdrawn && (c.mode === 1 || c.milestoneReached);
            const progress = c.mode === 0 && c.goalAmount > 0n
              ? Math.min(100, Math.round(Number(c.totalRaised * 100n / c.goalAmount)))
              : null;

            return (
              <div key={String(c.id)} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
                <div style={{ padding: '1rem 1.25rem', display: 'flex', gap: '1rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                      {c.withdrawn
                        ? <span className="badge badge-stone">Completed</span>
                        : c.milestoneReached
                          ? <span className="badge badge-green">Goal reached</span>
                          : c.active ? <span className="badge badge-violet">{c.mode === 0 ? 'Milestone' : 'Flexible'}</span>
                            : <span className="badge badge-stone">Closed</span>}
                    </div>
                    <h3 style={{ fontSize: '0.9375rem', marginBottom: '0.25rem' }}>{c.title}</h3>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-3)', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical' }}>
                      {c.description}
                    </p>
                  </div>

                  {/* Metrics */}
                  <div style={{ display: 'flex', gap: '1.5rem', flexShrink: 0 }}>
                    {[
                      { label: 'Raised', value: formatETH(c.totalRaised) },
                      { label: 'Goal', value: c.mode === 0 ? formatETH(c.goalAmount) : '—' },
                      { label: 'Donors', value: String(Number(c.donorCount)) },
                      { label: 'Progress', value: progress !== null ? `${progress}%` : '—' },
                    ].map(({ label, value }) => (
                      <div key={label}>
                        <div style={{ fontSize: '0.6rem', color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
                        <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text)', fontFamily: 'var(--mono)' }}>{value}</div>
                      </div>
                    ))}
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0, alignItems: 'center' }}>
                    {canWithdraw && (
                      <button type="button" className="btn btn-green btn-sm"
                        onClick={() => handleWithdraw(c.id)}
                        disabled={withdrawing || withdrawConfirming}>
                        {withdrawing || withdrawConfirming ? <><div className="spinner" style={{ width: 12, height: 12 }} /> …</> : 'Withdraw'}
                      </button>
                    )}
                    <Link href={`/campaign/${c.id}`} className="btn btn-outline btn-sm"
                      style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      View <ArrowRightIcon size={12} />
                    </Link>
                  </div>
                </div>

                {/* Progress bar strip */}
                {progress !== null && (
                  <div style={{ height: 3, background: 'var(--surface-3)' }}>
                    <div style={{ height: '100%', width: `${progress}%`, background: c.milestoneReached ? 'var(--green)' : 'var(--primary)', transition: 'width 1s ease' }} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
