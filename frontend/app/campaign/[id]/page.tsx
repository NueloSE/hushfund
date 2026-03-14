'use client';

import { useState } from 'react';
import { useReadContract, useWriteContract, useAccount, useWaitForTransactionReceipt } from 'wagmi';
import { useParams } from 'next/navigation';
import { HUSHFUND_ABI, HUSHFUND_ADDRESS, type Campaign, type PublicDonation, type PrivateDonation } from '@/lib/contract';
import { formatETH, progressPercent, daysRemaining, shortAddress } from '@/lib/utils';
import { LockIcon, TrendingUpIcon, UsersIcon, CheckCircleIcon } from '@/lib/icons';
import { DonationModal } from '@/components/DonationModal';
import { DonorWall } from '@/components/DonorWall';
import { MilestoneConfetti } from '@/components/MilestoneConfetti';

export default function CampaignPage() {
  const params = useParams();
  const id = BigInt(params.id as string);
  const { address } = useAccount();
  const [showModal, setShowModal] = useState(false);

  const { data: campaign, isLoading, refetch } = useReadContract({
    address: HUSHFUND_ADDRESS, abi: HUSHFUND_ABI,
    functionName: 'getCampaign', args: [id],
  });
  const { data: publicDonations, refetch: refetchPub } = useReadContract({
    address: HUSHFUND_ADDRESS, abi: HUSHFUND_ABI,
    functionName: 'getPublicDonations', args: [id],
  });
  const { data: privateDonations, refetch: refetchPriv } = useReadContract({
    address: HUSHFUND_ADDRESS, abi: HUSHFUND_ABI,
    functionName: 'getPrivateDonations', args: [id],
  });

  const { data: withdrawTx, writeContract: doWithdraw, isPending: withdrawing } = useWriteContract();
  const { isLoading: withdrawConfirming } = useWaitForTransactionReceipt({ hash: withdrawTx, query: { enabled: !!withdrawTx } });

  if (isLoading) {
    return (
      <div className="container section">
        <div style={{ display: 'grid', gap: '1.25rem' }}>
          <div className="shimmer" style={{ height: 240, borderRadius: 12 }} />
          <div className="shimmer" style={{ height: 32, width: '45%' }} />
          <div className="shimmer" style={{ height: 80 }} />
        </div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="container section">
        <div className="empty-state">
          <h3>Campaign not found</h3>
          <p style={{ marginTop: '0.375rem' }}>This campaign doesn&apos;t exist.</p>
        </div>
      </div>
    );
  }

  const c = campaign as Campaign;
  const pub = (publicDonations as PublicDonation[] | undefined) || [];
  const priv = (privateDonations as PrivateDonation[] | undefined) || [];
  const progress = c.mode === 0 ? progressPercent(c.totalRaised, c.goalAmount) : null;
  const days = daysRemaining(c.deadline);
  const isCreator = address?.toLowerCase() === c.creator?.toLowerCase();
  const canWithdraw = isCreator && !c.withdrawn && (c.mode === 1 || c.milestoneReached);

  const handleSuccess = () => { setTimeout(() => { refetch(); refetchPub(); refetchPriv(); }, 2000); };

  return (
    <>
      {showModal && <DonationModal campaignId={c.id} onClose={() => setShowModal(false)} onSuccess={handleSuccess} />}

      <div className="container" style={{ padding: '2.5rem 1.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 320px', gap: '2.5rem', alignItems: 'start' }}>

          {/* ── Left column ─────────────────────────────── */}
          <div>
            {/* Image */}
            {c.imageUrl ? (
              <img src={c.imageUrl} alt={c.title} style={{ width: '100%', height: 240, objectFit: 'cover', borderRadius: 12, marginBottom: '1.75rem', border: '1px solid var(--border)' }} />
            ) : (
              <div style={{ width: '100%', height: 180, background: 'var(--surface-2)', borderRadius: 12, marginBottom: '1.75rem', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <TrendingUpIcon size={40} color="var(--border-2)" />
              </div>
            )}

            {/* Goal reached banner */}
            <MilestoneConfetti active={c.milestoneReached} />

            {/* Chips */}
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.875rem' }}>
              {c.milestoneReached
                ? <span className="badge badge-green"><CheckCircleIcon size={10} /> Goal reached</span>
                : c.active
                  ? <span className="badge badge-violet">{c.mode === 0 ? 'Milestone' : 'Flexible'}</span>
                  : <span className="badge badge-stone">Closed</span>}
              <span className="fhe-chip"><LockIcon size={9} /> FHE encrypted</span>
              {days !== Infinity && days > 0 && <span className="badge badge-warn">{days}d remaining</span>}
            </div>

            <h1 style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)', marginBottom: '0.625rem' }}>{c.title}</h1>
            <p style={{ fontSize: '0.8125rem', marginBottom: '1.5rem', color: 'var(--text-3)' }}>
              Created by{' '}
              <span style={{ fontFamily: 'var(--mono)', color: 'var(--text-2)' }}>{shortAddress(c.creator)}</span>
            </p>

            {/* Description */}
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '1.25rem', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.75rem', color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>About</h3>
              <p style={{ fontSize: '0.9rem', lineHeight: 1.8, color: 'var(--text-2)' }}>{c.description}</p>
            </div>

            {/* FHE explainer */}
            <div className="info-block violet" style={{ marginBottom: '1.5rem' }}>
              <div style={{ fontWeight: 600, color: 'var(--text)', marginBottom: '0.375rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <LockIcon size={12} color="var(--primary)" /> How privacy works on this campaign
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-3)' }}>
                Private donors encrypt their amount client-side using Zama&apos;s fhEVM global FHE public key. The contract uses{' '}
                <code>FHE.add()</code> to accumulate ciphertexts homomorphically — the on-chain code never sees the plaintext.
                Only the creator and the donor can decrypt via the Zama KMS gateway.
              </p>
            </div>

            {/* Donor wall */}
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
              <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h3 style={{ fontSize: '0.875rem', fontWeight: 600 }}>Donors</h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-3)', fontFamily: 'var(--mono)' }}>
                  {pub.length} public · {priv.length} anonymous
                </span>
              </div>
              <div style={{ padding: '0 1.25rem' }}>
                <DonorWall publicDonations={pub} privateDonations={priv} />
              </div>
            </div>
          </div>

          {/* ── Right column (sticky) ─────────────────── */}
          <div style={{ position: 'sticky', top: 72 }}>
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border-2)', borderRadius: 12, overflow: 'hidden' }}>

              {/* Raised amount */}
              <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border)' }}>
                <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text)', fontFamily: 'var(--mono)', letterSpacing: '-0.04em', lineHeight: 1 }}>
                  {formatETH(c.totalRaised)}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-3)', marginTop: '0.375rem' }}>
                  raised{c.mode === 0 ? ` · goal ${formatETH(c.goalAmount)}` : ''}
                </div>

                {/* Progress bar */}
                {progress !== null && (
                  <div style={{ marginTop: '1rem' }}>
                    <div className="progress-track">
                      <div className={`progress-fill ${c.milestoneReached ? 'goal-hit' : ''}`} style={{ width: `${progress}%` }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.6875rem', color: 'var(--text-3)', fontFamily: 'var(--mono)', marginTop: '0.375rem' }}>
                      <span>{progress}%</span>
                      <span>{Number(c.donorCount)} donors</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Stats mini grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: '1px solid var(--border)' }}>
                {[
                  { label: 'Total raised', value: formatETH(c.totalRaised) },
                  { label: 'Donors', value: String(Number(c.donorCount)) },
                  { label: 'Anonymous', value: String(priv.length) },
                  { label: 'Mode', value: c.mode === 0 ? 'Milestone' : 'Flexible' },
                ].map(({ label, value }, i) => (
                  <div key={label} style={{
                    padding: '0.875rem 1rem',
                    borderRight: i % 2 === 0 ? '1px solid var(--border)' : 'none',
                    borderBottom: i < 2 ? '1px solid var(--border)' : 'none',
                  }}>
                    <div style={{ fontSize: '0.6875rem', color: 'var(--text-3)', fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: '0.25rem' }}>{label}</div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text)', fontFamily: 'var(--mono)' }}>{value}</div>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                {c.active && !c.withdrawn ? (
                  <button type="button" className="btn btn-primary"
                    style={{ width: '100%', justifyContent: 'center', height: 42 }}
                    onClick={() => setShowModal(true)}>
                    Donate to this campaign
                  </button>
                ) : (
                  <div style={{ fontSize: '0.8125rem', color: 'var(--text-3)', textAlign: 'center', padding: '0.75rem', background: 'var(--surface-2)', borderRadius: 8 }}>
                    {c.withdrawn ? 'Campaign complete — funds withdrawn' : 'Campaign closed'}
                  </div>
                )}

                {canWithdraw && (
                  <button type="button" className="btn btn-green"
                    style={{ width: '100%', justifyContent: 'center', height: 42 }}
                    onClick={() => doWithdraw({ address: HUSHFUND_ADDRESS, abi: HUSHFUND_ABI, functionName: 'withdrawFunds', args: [c.id] })}
                    disabled={withdrawing || withdrawConfirming}>
                    {withdrawing || withdrawConfirming ? <><div className="spinner" /> Processing…</> : 'Withdraw funds'}
                  </button>
                )}

                <p style={{ fontSize: '0.6875rem', color: 'var(--text-3)', textAlign: 'center', lineHeight: 1.5 }}>
                  {c.mode === 0 ? 'Funds are released when the goal is reached.' : 'Flexible mode — creator can withdraw at any time.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
