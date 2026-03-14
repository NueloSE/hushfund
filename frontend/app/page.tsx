'use client';

import Link from 'next/link';
import { useReadContract } from 'wagmi';
import { HUSHFUND_ABI, HUSHFUND_ADDRESS, type Campaign } from '@/lib/contract';
import { CampaignCard } from '@/components/CampaignCard';
import { ShieldIcon, TrendingUpIcon, LayersIcon, LockIcon, ArrowRightIcon, ZapIcon } from '@/lib/icons';

const STEPS = [
  {
    num: '01',
    title: 'Create a Campaign',
    desc: 'Set a goal, choose Milestone or Flexible mode, and publish. Campaign metadata is always transparent on-chain.',
    active: false,
  },
  {
    num: '02',
    title: 'Donors Contribute Privately',
    desc: 'Supporters encrypt their amount client-side with the fhEVM global key. The contract adds ciphertexts homomorphically — plaintext never revealed.',
    active: true,
  },
  {
    num: '03',
    title: 'Reach Your Goal',
    desc: 'Campaign totals are always visible. When a Milestone target is hit, the creator can withdraw. Flexible campaigns allow anytime withdrawal.',
    active: false,
  },
];

const PRIVACY_ROWS = [
  {
    label: 'Campaign total raised',
    status: 'Public',
    icon: <TrendingUpIcon size={15} />,
    desc: 'Anyone can verify how much a campaign has raised in aggregate.',
    dot: 'var(--green)',
  },
  {
    label: 'Individual donation amounts',
    status: 'Encrypted',
    icon: <LockIcon size={15} />,
    desc: 'Private donations are encrypted via FHE. On the donor wall they appear as "Anonymous".',
    dot: 'var(--primary)',
  },
  {
    label: 'FHE computation',
    status: 'On-chain',
    icon: <ZapIcon size={15} />,
    desc: 'FHE.add() accumulates ciphertexts. The contract sees only encrypted values.',
    dot: 'var(--text-3)',
  },
];

export default function HomePage() {
  const { data: campaigns, isLoading } = useReadContract({
    address: HUSHFUND_ADDRESS,
    abi: HUSHFUND_ABI,
    functionName: 'getCampaigns',
    args: [1n, 6n],
  });

  const list = (campaigns as Campaign[] | undefined) || [];

  return (
    <>
      {/* ─── Hero ─────────────────────────────────────────── */}
      <section className="hero">
        <div className="container">
          <div className="hero-grid">
            {/* Left: Copy */}
            <div>
              <div className="hero-eyebrow">
                <ShieldIcon size={12} />
                Zama fhEVM · Fully Homomorphic Encryption
              </div>
              <h1 className="hero-title">
                Fundraise openly.<br />Donate <em>privately</em>.
              </h1>
              <p className="hero-sub">
                HushFund is a privacy-preserving crowdfunding platform.
                Campaign totals are public. Individual donation amounts are
                protected by on-chain FHE — the contract never sees the plaintext.
              </p>
              <div className="hero-actions">
                <Link href="/create" className="btn btn-primary btn-lg">
                  Start a campaign
                  <ArrowRightIcon size={15} />
                </Link>
                <Link href="/explore" className="btn btn-outline btn-lg">
                  Browse campaigns
                </Link>
              </div>

              {/* Trust strip */}
              <div style={{ display: 'flex', gap: '1.5rem', marginTop: '2.5rem', flexWrap: 'wrap' }}>
                {[
                  { label: 'FHE-encrypted donations', icon: <LockIcon size={13} /> },
                  { label: 'On-chain transparency', icon: <TrendingUpIcon size={13} /> },
                  { label: 'Non-custodial', icon: <ShieldIcon size={13} /> },
                ].map(({ label, icon }) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-3)', fontSize: '0.8125rem' }}>
                    <span style={{ color: 'var(--text-3)' }}>{icon}</span>
                    {label}
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Mock campaign card */}
            <div className="hero-visual">
              <div className="mock-card" style={{ boxShadow: '0 0 0 1px var(--border-2), 0 40px 80px rgba(0,0,0,0.5)' }}>
                {/* Card header */}
                <div className="mock-card-header">
                  <div>
                    <div style={{ width: 120, height: 7, background: 'var(--surface-3)', borderRadius: 3, marginBottom: 6 }} />
                    <div style={{ width: 80, height: 5, background: 'var(--border)', borderRadius: 3 }} />
                  </div>
                  <span className="badge badge-violet" style={{ fontSize: '0.625rem' }}>Milestone</span>
                </div>

                {/* Progress */}
                <div style={{ marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.6875rem', color: 'var(--text-3)', marginBottom: '0.5rem', fontFamily: 'var(--mono)' }}>
                    <span style={{ color: 'var(--text)', fontWeight: 600 }}>2.41 ETH raised</span>
                    <span>goal: 3.5 ETH</span>
                  </div>
                  <div className="mock-progress-bar">
                    <div className="mock-progress-fill" />
                  </div>
                  <div style={{ fontSize: '0.625rem', color: 'var(--text-3)', marginTop: '0.375rem', fontFamily: 'var(--mono)' }}>68% · 12 donors</div>
                </div>

                {/* Donor list */}
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '0.875rem' }}>
                  <div style={{ fontSize: '0.625rem', color: 'var(--text-3)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
                    Recent Activity
                  </div>
                  {[
                    { pub: true, amount: '0.5 ETH' },
                    { pub: false, amount: null },
                    { pub: true, amount: '0.12 ETH' },
                    { pub: false, amount: null },
                  ].map((row, i) => (
                    <div key={i} className={`mock-donor-row ${!row.pub ? 'mock-lock-row' : ''}`}>
                      <div className="mock-avatar" style={{ background: row.pub ? 'var(--primary-lt)' : 'var(--surface-3)' }} />
                      <div className="mock-name-line" style={{ maxWidth: 80 }} />
                      {row.pub
                        ? <div className="mock-amount"><span style={{ fontSize: '0.6875rem', color: 'var(--green)', fontFamily: 'var(--mono)', fontWeight: 600 }}>{row.amount}</span></div>
                        : <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <LockIcon size={9} color="var(--primary)" />
                            <span style={{ fontSize: '0.625rem', color: 'var(--text-3)', fontFamily: 'var(--mono)' }}>encrypted</span>
                          </div>
                      }
                    </div>
                  ))}
                </div>
              </div>

              {/* Floating FHE label */}
              <div style={{
                position: 'absolute',
                bottom: -18,
                right: 24,
                background: 'var(--surface-2)',
                border: '1px solid var(--primary-ring)',
                borderRadius: 8,
                padding: '0.5rem 0.875rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.75rem',
                color: 'var(--text-2)',
              }}>
                <LockIcon size={12} color="var(--primary)" />
                <span style={{ fontFamily: 'var(--mono)', color: 'var(--primary)' }}>FHE.add()</span> on-chain
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── How It Works ─────────────────────────────────── */}
      <section className="section" style={{ borderTop: '1px solid var(--border)' }}>
        <div className="container">
          <div className="section-header">
            <span className="section-tag">How it works</span>
            <h2>Three steps to private fundraising</h2>
            <p>Homomorphic encryption means the contract accumulates totals without ever seeing individual amounts.</p>
          </div>
          <div className="steps-grid">
            {STEPS.map((step) => (
              <div key={step.num} className="step-item">
                <div className={`step-num ${step.active ? 'active' : ''}`}>{step.num}</div>
                <h3>{step.title}</h3>
                <p>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Live Campaigns ───────────────────────────────── */}
      <section className="section" style={{ borderTop: '1px solid var(--border)' }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <span className="section-tag">Live campaigns</span>
              <h2 style={{ marginBottom: 0 }}>Fund what matters</h2>
            </div>
            <Link href="/explore" className="btn btn-outline btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              View all <ArrowRightIcon size={13} />
            </Link>
          </div>

          {isLoading ? (
            <div className="campaign-grid">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="card">
                  <div className="shimmer" style={{ height: 160 }} />
                  <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div className="shimmer" style={{ height: 12, width: '55%' }} />
                    <div className="shimmer" style={{ height: 10, width: '90%' }} />
                    <div className="shimmer" style={{ height: 10, width: '70%' }} />
                    <div className="shimmer" style={{ height: 4, marginTop: 6 }} />
                    <div className="shimmer" style={{ height: 18, width: '40%', marginTop: 4 }} />
                  </div>
                </div>
              ))}
            </div>
          ) : list.length === 0 ? (
            <div className="empty-state">
              <LayersIcon size={40} />
              <h3>No campaigns yet</h3>
              <p style={{ marginBottom: '1.5rem', marginTop: '0.5rem' }}>Deploy the contract and create the first one.</p>
              <Link href="/create" className="btn btn-primary">Create campaign</Link>
            </div>
          ) : (
            <div className="campaign-grid">
              {list.map((c) => <CampaignCard key={String(c.id)} campaign={c} />)}
            </div>
          )}
        </div>
      </section>

      {/* ─── Privacy Model ────────────────────────────────── */}
      <section className="section" style={{ borderTop: '1px solid var(--border)' }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '4rem', alignItems: 'start' }}>
            <div>
              <span className="section-tag">Privacy model</span>
              <h2>Transparency and privacy, balanced</h2>
              <p style={{ marginTop: '1rem', lineHeight: 1.85, fontSize: '0.9375rem' }}>
                HushFund uses Zama&apos;s fhEVM to perform <span style={{ fontFamily: 'var(--mono)', color: 'var(--text)', background: 'var(--surface-2)', padding: '0 0.3rem', borderRadius: 3 }}>FHE.add()</span> on encrypted donation amounts directly on-chain. Donors choose their privacy. The aggregate total is always public.
              </p>
              <div style={{ marginTop: '2rem' }}>
                <a href="https://docs.zama.ai/fhevm" target="_blank" rel="noopener noreferrer"
                  className="btn btn-outline btn-sm"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                  Read the fhEVM docs <ArrowRightIcon size={13} />
                </a>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
              {PRIVACY_ROWS.map(({ label, status, icon, desc, dot }, i) => (
                <div key={label} style={{
                  padding: '1.25rem 0',
                  borderBottom: i < PRIVACY_ROWS.length - 1 ? '1px solid var(--border)' : 'none',
                  display: 'flex',
                  gap: '1rem',
                  alignItems: 'flex-start',
                }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: dot, flexShrink: 0, marginTop: 6 }} />
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.375rem', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text)' }}>{label}</span>
                      <span style={{ fontFamily: 'var(--mono)', fontSize: '0.6875rem', color: 'var(--text-3)', background: 'var(--surface-2)', border: '1px solid var(--border)', padding: '0.1rem 0.4rem', borderRadius: 3 }}>{status}</span>
                    </div>
                    <p style={{ fontSize: '0.8125rem', color: 'var(--text-3)', lineHeight: 1.65 }}>{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── CTA ──────────────────────────────────────────── */}
      <section style={{ borderTop: '1px solid var(--border)', padding: '4rem 0' }}>
        <div className="container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '1.25rem' }}>
          <h2>Ready to launch?</h2>
          <p style={{ maxWidth: 420 }}>Create a privacy-preserving campaign in minutes. No custodians, no middlemen.</p>
          <Link href="/create" className="btn btn-primary btn-lg">
            Create a campaign <ArrowRightIcon size={15} />
          </Link>
        </div>
      </section>
    </>
  );
}
