'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { useReadContract, useWriteContract, useAccount, useWaitForTransactionReceipt } from 'wagmi';
import { HUSHFUND_ABI, HUSHFUND_ADDRESS, type Campaign, type PublicDonation, type PrivateDonation } from '@/lib/contract';
import { formatETH, progressPercent, daysRemaining, shortAddress } from '@/lib/utils';
import { LockIcon, TrendingUpIcon, CheckCircleIcon, AlertCircleIcon } from '@/lib/icons';
import { DonationModal } from '@/components/DonationModal';
import { DonorWall } from '@/components/DonorWall';
import { MilestoneConfetti } from '@/components/MilestoneConfetti';
import { TxStatus } from '@/components/TxStatus';
import { CampaignPlaceholder } from '@/components/CampaignPlaceholder';
import { CampaignImage } from '@/components/CampaignImage';

export default function CampaignPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const params = useParams();
  const rawId = params.id as string;
  const { address } = useAccount();
  const [showModal, setShowModal] = useState(false);

  const id = useMemo(() => {
    try { return BigInt(rawId); }
    catch { return 0n; }
  }, [rawId]);

  const enabled = mounted && id > 0n;

  const { data: campaign, isLoading, isError, refetch } = useReadContract({
    address: HUSHFUND_ADDRESS, abi: HUSHFUND_ABI,
    functionName: 'getCampaign', args: [id],
    query: { enabled },
  });
  const { data: publicDonations, refetch: refetchPub } = useReadContract({
    address: HUSHFUND_ADDRESS, abi: HUSHFUND_ABI,
    functionName: 'getPublicDonations', args: [id],
    query: { enabled },
  });
  const { data: privateDonations, refetch: refetchPriv } = useReadContract({
    address: HUSHFUND_ADDRESS, abi: HUSHFUND_ABI,
    functionName: 'getPrivateDonations', args: [id],
    query: { enabled },
  });

  const { data: withdrawHash, writeContract: doWithdraw, isPending: withdrawing, isError: withdrawError } = useWriteContract();
  const { isLoading: withdrawConfirming, isSuccess: withdrawSuccess } = useWaitForTransactionReceipt({ hash: withdrawHash, query: { enabled: !!withdrawHash } });

  if (!mounted || isLoading) {
    return (
      <div className="container section">
        <div style={{ display: 'grid', gap: '1.25rem' }}>
          <div className="shimmer" style={{ height: 240, borderRadius: 8 }} />
          <div className="shimmer" style={{ height: 32, width: '45%' }} />
          <div className="shimmer" style={{ height: 80 }} />
        </div>
      </div>
    );
  }

  if (id === 0n) {
    return (
      <div className="container section">
        <div className="empty-state">
          <h3>Invalid campaign ID</h3>
        </div>
      </div>
    );
  }

  if (isError || !campaign) {
    return (
      <div className="container section">
        <div className="empty-state">
          <h3>Campaign not found</h3>
          <p style={{ marginTop: '0.5rem' }}>This campaign doesn&apos;t exist or the contract is unreachable.</p>
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
  const isExpired = c.deadline > 0n && BigInt(Math.floor(Date.now() / 1000)) > c.deadline;

  const handleSuccess = () => { setTimeout(() => { refetch(); refetchPub(); refetchPriv(); }, 2000); };

  return (
    <>
      {showModal && <DonationModal campaignId={c.id} onClose={() => setShowModal(false)} onSuccess={handleSuccess} />}

      <div className="container" style={{ padding: '3rem 2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 320px', gap: '3rem', alignItems: 'start' }}>
          {/* Left column */}
          <div>
            {c.imageUrl ? (
              <CampaignImage src={c.imageUrl} title={c.title} height={260} style={{ borderRadius: 8, marginBottom: '2rem', border: '1px solid var(--border)' }} />
            ) : (
              <CampaignPlaceholder title={c.title} height={260} style={{ borderRadius: 8, marginBottom: '2rem', border: '1px solid var(--border)' }} />
            )}

            <MilestoneConfetti active={c.milestoneReached} />

            {isExpired && !c.milestoneReached && !c.withdrawn && c.mode === 0 && (
              <div style={{ background: 'var(--danger-lt)', border: '1px solid rgba(232,116,97,0.18)', borderRadius: 8, padding: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                <AlertCircleIcon size={18} color="var(--danger)" />
                <div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--danger)', marginBottom: '0.25rem' }}>Campaign expired</div>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--text-3)', fontWeight: 300, lineHeight: 1.6 }}>This milestone campaign did not reach its goal before the deadline.</p>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
              {c.milestoneReached
                ? <span className="badge badge-green"><CheckCircleIcon size={10} /> Goal reached</span>
                : c.active
                  ? <span className="badge badge-gold">{c.mode === 0 ? 'Milestone' : 'Flexible'}</span>
                  : <span className="badge badge-stone">Closed</span>}
              <span className="fhe-chip"><LockIcon size={8} /> FHE encrypted</span>
              {isExpired && !c.milestoneReached && <span className="badge badge-warn" style={{ background: 'var(--danger-lt)', color: 'var(--danger)', borderColor: 'rgba(232,116,97,0.18)' }}>Expired</span>}
              {!isExpired && days !== Infinity && days > 0 && <span className="badge badge-warn">{days}d remaining</span>}
            </div>

            <h1 style={{ fontSize: 'clamp(1.75rem, 3vw, 2.5rem)', marginBottom: '0.75rem' }}>{c.title}</h1>
            <p style={{ fontSize: '0.75rem', marginBottom: '2rem', color: 'var(--text-3)', fontFamily: 'var(--mono)', letterSpacing: '0.02em' }}>
              Created by <span style={{ color: 'var(--text-2)' }}>{shortAddress(c.creator)}</span>
            </p>

            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '1.5rem', marginBottom: '1.75rem' }}>
              <h3 style={{ fontSize: '0.6875rem', fontWeight: 600, marginBottom: '0.875rem', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'var(--mono)' }}>About</h3>
              <p style={{ fontSize: '0.9375rem', lineHeight: 1.85, color: 'var(--text-2)', fontWeight: 300 }}>{c.description}</p>
            </div>

            <div className="info-block violet" style={{ marginBottom: '1.75rem' }}>
              <div style={{ fontWeight: 500, color: 'var(--text)', marginBottom: '0.5rem', fontSize: '0.8125rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <LockIcon size={12} color="var(--accent)" /> How privacy works
              </div>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-3)', fontWeight: 300, lineHeight: 1.7 }}>
                Private donors encrypt their amount client-side using Zama&apos;s fhEVM global FHE public key. The contract uses{' '}
                <code style={{ color: 'var(--accent)', fontSize: '0.75rem' }}>FHE.add()</code> to accumulate ciphertexts homomorphically — the on-chain code never sees the plaintext.
              </p>
            </div>

            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
              <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h3 style={{ fontSize: '0.6875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'var(--mono)', color: 'var(--text-3)' }}>Donors</h3>
                <span style={{ fontSize: '0.625rem', color: 'var(--text-3)', fontFamily: 'var(--mono)', letterSpacing: '0.02em' }}>
                  {pub.length} public / {priv.length} anonymous
                </span>
              </div>
              <div style={{ padding: '0 1.5rem' }}>
                <DonorWall publicDonations={pub} privateDonations={priv} />
              </div>
            </div>
          </div>

          {/* Right column (sticky) */}
          <div style={{ position: 'sticky', top: 76 }}>
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border-2)', borderRadius: 8, overflow: 'hidden' }}>
              <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)' }}>
                <div style={{ fontSize: '2.25rem', fontWeight: 400, color: 'var(--text)', fontFamily: 'var(--serif)', letterSpacing: '-0.03em', lineHeight: 1 }}>
                  {formatETH(c.totalRaised)}
                </div>
                <div style={{ fontSize: '0.6875rem', color: 'var(--text-3)', marginTop: '0.5rem', fontFamily: 'var(--mono)', letterSpacing: '0.03em' }}>
                  raised{c.mode === 0 ? ` / goal ${formatETH(c.goalAmount)}` : ''}
                </div>
                {progress !== null && (
                  <div style={{ marginTop: '1.25rem' }}>
                    <div className="progress-track">
                      <div className={`progress-fill ${c.milestoneReached ? 'goal-hit' : ''}`} style={{ width: `${progress}%` }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.625rem', color: 'var(--text-3)', fontFamily: 'var(--mono)', marginTop: '0.375rem', letterSpacing: '0.02em' }}>
                      <span>{progress}%</span>
                      <span>{Number(c.donorCount)} donors</span>
                    </div>
                  </div>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: '1px solid var(--border)' }}>
                {[
                  { label: 'Total raised', value: formatETH(c.totalRaised) },
                  { label: 'Donors', value: String(Number(c.donorCount)) },
                  { label: 'Anonymous', value: String(priv.length) },
                  { label: 'Mode', value: c.mode === 0 ? 'Milestone' : 'Flexible' },
                ].map(({ label, value }, i) => (
                  <div key={label} style={{ padding: '1rem', borderRight: i % 2 === 0 ? '1px solid var(--border)' : 'none', borderBottom: i < 2 ? '1px solid var(--border)' : 'none' }}>
                    <div style={{ fontSize: '0.5625rem', color: 'var(--text-3)', fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.375rem', fontFamily: 'var(--mono)' }}>{label}</div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 400, color: 'var(--text)', fontFamily: 'var(--serif)' }}>{value}</div>
                  </div>
                ))}
              </div>

              <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                {c.active && !c.withdrawn && c.milestoneReached ? (
                  <>
                    <div style={{
                      background: 'rgba(74,222,128,0.06)',
                      border: '1px solid rgba(74,222,128,0.12)',
                      borderRadius: 6,
                      padding: '0.75rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      marginBottom: '0.25rem',
                    }}>
                      <CheckCircleIcon size={14} color="var(--green)" />
                      <div>
                        <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--green)' }}>Goal reached</div>
                        <div style={{ fontSize: '0.625rem', color: 'var(--text-3)', fontFamily: 'var(--mono)', marginTop: '0.125rem' }}>
                          You can still donate until funds are withdrawn
                        </div>
                      </div>
                    </div>
                    <button type="button" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', height: 44 }} onClick={() => setShowModal(true)}>
                      Donate to this campaign
                    </button>
                  </>
                ) : c.active && !c.withdrawn ? (
                  <button type="button" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', height: 44 }} onClick={() => setShowModal(true)}>
                    Donate to this campaign
                  </button>
                ) : c.withdrawn ? (
                  <div style={{
                    background: 'rgba(74,222,128,0.06)',
                    border: '1px solid rgba(74,222,128,0.15)',
                    borderRadius: 8,
                    padding: '1.25rem',
                    textAlign: 'center',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.375rem' }}>
                      <CheckCircleIcon size={16} color="var(--green)" />
                      <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--green)', fontFamily: 'var(--serif)' }}>Campaign Complete</span>
                    </div>
                    <p style={{ fontSize: '0.6875rem', color: 'var(--text-3)', fontFamily: 'var(--mono)', letterSpacing: '0.02em' }}>
                      Funds have been withdrawn by the creator.
                    </p>
                  </div>
                ) : (
                  <div style={{
                    background: 'var(--surface-2)',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    padding: '1.25rem',
                    textAlign: 'center',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.375rem' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
                      </svg>
                      <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-2)' }}>Campaign Closed</span>
                    </div>
                    <p style={{ fontSize: '0.6875rem', color: 'var(--text-3)', fontFamily: 'var(--mono)', letterSpacing: '0.02em' }}>
                      This campaign is no longer accepting donations.
                    </p>
                  </div>
                )}

                {canWithdraw && (
                  <button type="button" className="btn btn-green" style={{ width: '100%', justifyContent: 'center', height: 44 }}
                    onClick={() => doWithdraw({ address: HUSHFUND_ADDRESS, abi: HUSHFUND_ABI, functionName: 'withdrawFunds', args: [c.id] })}
                    disabled={withdrawing}>
                    {withdrawing ? <><div className="spinner" /> Processing...</> : 'Withdraw funds'}
                  </button>
                )}

                <p style={{ fontSize: '0.625rem', color: 'var(--text-3)', textAlign: 'center', lineHeight: 1.6, fontFamily: 'var(--mono)', letterSpacing: '0.02em' }}>
                  {c.mode === 0 ? 'Funds released when goal is reached.' : 'Flexible — creator can withdraw anytime.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <TxStatus
        isPending={withdrawing}
        isConfirming={withdrawConfirming}
        isSuccess={withdrawSuccess}
        isError={withdrawError}
        pendingText="Withdrawing funds..."
        confirmingText="Confirming withdrawal..."
        successText="Funds withdrawn successfully!"
        errorText="Withdrawal failed."
        onSuccessDone={() => refetch()}
      />
    </>
  );
}
