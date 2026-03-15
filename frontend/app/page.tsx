'use client';

import Link from 'next/link';
import { useReadContract } from 'wagmi';
import { HUSHFUND_ABI, HUSHFUND_ADDRESS, type Campaign } from '@/lib/contract';
import { CampaignCard } from '@/components/CampaignCard';
import { ShieldIcon, LockIcon, ArrowRightIcon, ZapIcon } from '@/lib/icons';

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
    desc: 'Supporters encrypt their amount client-side with the fhEVM global key. The contract adds ciphertexts homomorphically.',
    active: true,
  },
  {
    num: '03',
    title: 'Reach Your Goal',
    desc: 'Campaign totals are always visible. When a Milestone target is hit, the creator can withdraw. Flexible campaigns allow anytime withdrawal.',
    active: false,
  },
];

export default function HomePage() {
  const { data: campaigns, isLoading } = useReadContract({
    address: HUSHFUND_ADDRESS,
    abi: HUSHFUND_ABI,
    functionName: 'getCampaigns',
    args: [1n, 6n],
  });

  const all = (campaigns as Campaign[] | undefined) || [];
  const list = all.filter((c) => c.active && !c.withdrawn).slice(0, 3);

  return (
    <>
      {/* ─── Hero ─────────────────────────────────────────── */}
      <section className="hero">
        <div className="container">
          <div className="hero-grid">
            {/* Left: Copy */}
            <div>
              <div className="hero-eyebrow fade-up fade-up-1">
                <ShieldIcon size={11} />
                Powered by Zama fhEVM
              </div>
              <h1 className="hero-title fade-up fade-up-2">
                Fundraise openly.<br />
                Donate <em>privately</em>.
              </h1>
              <p className="hero-sub fade-up fade-up-3">
                HushFund is a privacy-preserving crowdfunding protocol.
                Campaign totals are public. Individual donations are
                encrypted with on-chain FHE the contract never sees plaintext.
              </p>
              <div className="hero-actions fade-up fade-up-4">
                <Link href="/create" className="btn btn-primary btn-lg">
                  Start a campaign
                  <ArrowRightIcon size={14} />
                </Link>
                <Link href="/explore" className="btn btn-outline btn-lg">
                  Browse campaigns
                </Link>
              </div>

              {/* Trust strip */}
              <div className="fade-up fade-up-5" style={{
                display: 'flex',
                gap: '1.5rem',
                marginTop: '3rem',
                flexWrap: 'wrap',
              }}>
                {[
                  { label: 'FHE-encrypted', icon: <LockIcon size={12} /> },
                  { label: 'On-chain transparent', icon: <ZapIcon size={12} /> },
                  { label: 'Non-custodial', icon: <ShieldIcon size={12} /> },
                ].map(({ label, icon }) => (
                  <div key={label} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    color: 'var(--text-3)',
                    fontSize: '0.6875rem',
                    fontFamily: 'var(--mono)',
                    letterSpacing: '0.03em',
                    padding: '0.375rem 0.625rem',
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 4,
                  }}>
                    <span style={{ color: 'var(--accent)' }}>{icon}</span>
                    {label}
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Mock campaign card */}
            <div className="hero-visual fade-up fade-up-3">
              <div className="mock-card" style={{ boxShadow: '0 0 0 1px var(--border), 0 40px 100px rgba(0,0,0,0.5), 0 0 80px rgba(201,168,76,0.04)' }}>
                {/* Card header */}
                <div className="mock-card-header">
                  <div>
                    <div style={{ width: 130, height: 7, background: 'var(--surface-3)', borderRadius: 3, marginBottom: 6 }} />
                    <div style={{ width: 85, height: 5, background: 'var(--border)', borderRadius: 2 }} />
                  </div>
                  <span className="badge badge-gold" style={{ fontSize: '0.5625rem' }}>Milestone</span>
                </div>

                {/* Progress */}
                <div style={{ marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.6875rem', color: 'var(--text-3)', marginBottom: '0.5rem', fontFamily: 'var(--mono)' }}>
                    <span style={{ color: 'var(--accent)', fontWeight: 600 }}>2.41 ETH</span>
                    <span>goal: 3.5 ETH</span>
                  </div>
                  <div className="mock-progress-bar">
                    <div className="mock-progress-fill" />
                  </div>
                  <div style={{ fontSize: '0.5625rem', color: 'var(--text-3)', marginTop: '0.375rem', fontFamily: 'var(--mono)' }}>68% funded · 12 donors</div>
                </div>

                {/* Donor list */}
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '0.875rem' }}>
                  <div style={{ fontSize: '0.5625rem', color: 'var(--text-3)', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.75rem', fontFamily: 'var(--mono)' }}>
                    Recent Activity
                  </div>
                  {[
                    { pub: true, amount: '0.5 ETH' },
                    { pub: false, amount: null },
                    { pub: true, amount: '0.12 ETH' },
                    { pub: false, amount: null },
                  ].map((row, i) => (
                    <div key={i} className={`mock-donor-row ${!row.pub ? 'mock-lock-row' : ''}`}>
                      <div className="mock-avatar" style={{ background: row.pub ? 'var(--accent-lt)' : 'var(--surface-3)', border: row.pub ? '1px solid var(--accent-ring)' : '1px solid var(--border)' }} />
                      <div className="mock-name-line" style={{ maxWidth: 80 }} />
                      {row.pub
                        ? <span style={{ fontSize: '0.6875rem', color: 'var(--accent)', fontFamily: 'var(--mono)', fontWeight: 600 }}>{row.amount}</span>
                        : <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <LockIcon size={9} color="var(--accent)" />
                            <span style={{ fontSize: '0.5625rem', color: 'var(--text-3)', fontFamily: 'var(--mono)', letterSpacing: '0.05em' }}>encrypted</span>
                          </div>
                      }
                    </div>
                  ))}
                </div>
              </div>

              {/* Floating FHE label */}
              <div style={{
                position: 'absolute',
                bottom: -16,
                right: 20,
                background: 'var(--surface)',
                border: '1px solid var(--accent-ring)',
                borderRadius: 6,
                padding: '0.5rem 0.875rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.6875rem',
                color: 'var(--text-3)',
                fontFamily: 'var(--mono)',
                boxShadow: '0 4px 20px rgba(0,0,0,0.3), 0 0 20px rgba(201,168,76,0.06)',
              }}>
                <LockIcon size={11} color="var(--accent)" />
                <span style={{ color: 'var(--accent)' }}>FHE.add()</span> on-chain
              </div>

              {/* Decorative corner accent */}
              <div style={{
                position: 'absolute',
                top: -8,
                left: -8,
                width: 16,
                height: 16,
                borderLeft: '1px solid var(--accent-ring)',
                borderTop: '1px solid var(--accent-ring)',
                borderRadius: '2px 0 0 0',
                opacity: 0.5,
              }} />
            </div>
          </div>
        </div>
      </section>

      {/* ─── How It Works ─────────────────────────────────── */}
      <div className="section-divider" />
      <section className="section">
        <div className="container">
          <div className="section-header">
            <span className="section-tag">How it works</span>
            <h2>Three steps to <em>private</em> fundraising</h2>
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
      <div className="section-divider" />
      <section className="section">
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <span className="section-tag">Live campaigns</span>
              <h2>Fund what <em>matters</em></h2>
            </div>
            <Link href="/explore" className="btn btn-outline btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              View all <ArrowRightIcon size={12} />
            </Link>
          </div>

          {isLoading ? (
            <div className="campaign-grid">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="card">
                  <div className="shimmer" style={{ height: 180 }} />
                  <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div className="shimmer" style={{ height: 10, width: '55%' }} />
                    <div className="shimmer" style={{ height: 8, width: '90%' }} />
                    <div className="shimmer" style={{ height: 8, width: '70%' }} />
                    <div className="shimmer" style={{ height: 3, marginTop: 8 }} />
                  </div>
                </div>
              ))}
            </div>
          ) : list.length === 0 ? (
            <div className="empty-state">
              <LayersPlaceholder />
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
      <div className="section-divider" />
      <section className="section">
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '5rem', alignItems: 'start' }}>
            <div>
              <span className="section-tag">Privacy model</span>
              <h2>Transparency &amp; privacy, <em>balanced</em></h2>
              <p style={{ marginTop: '1.25rem', lineHeight: 1.85, fontSize: '0.9375rem', fontWeight: 300 }}>
                HushFund uses Zama&apos;s fhEVM to perform{' '}
                <code style={{ color: 'var(--accent)', background: 'var(--surface-2)', padding: '0.15rem 0.4rem', borderRadius: 3, fontSize: '0.8125rem', border: '1px solid var(--border)' }}>FHE.add()</code>{' '}
                on encrypted donation amounts directly on-chain. Donors choose their privacy level. The aggregate total is always public.
              </p>
              <div style={{ marginTop: '2rem' }}>
                <a href="https://docs.zama.ai/fhevm" target="_blank" rel="noopener noreferrer"
                  className="btn btn-outline btn-sm"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                  Read the fhEVM docs <ArrowRightIcon size={12} />
                </a>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
              {[
                { label: 'Campaign total raised', status: 'Public', desc: 'Anyone can verify how much a campaign has raised in aggregate.', dot: 'var(--green)' },
                { label: 'Individual donation amounts', status: 'Encrypted', desc: 'Private donations are encrypted via FHE. On the donor wall they appear as "Anonymous".', dot: 'var(--accent)' },
                { label: 'FHE computation', status: 'On-chain', desc: 'FHE.add() accumulates ciphertexts. The contract sees only encrypted values.', dot: 'var(--text-3)' },
              ].map(({ label, status, desc, dot }, i, arr) => (
                <div key={label} style={{
                  padding: '1.5rem 0',
                  borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none',
                  display: 'flex',
                  gap: '1rem',
                  alignItems: 'flex-start',
                }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: dot, flexShrink: 0, marginTop: 6, boxShadow: `0 0 8px ${dot === 'var(--green)' ? 'rgba(74,222,128,0.3)' : dot === 'var(--accent)' ? 'rgba(201,168,76,0.3)' : 'transparent'}` }} />
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.375rem', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text)' }}>{label}</span>
                      <span style={{ fontFamily: 'var(--mono)', fontSize: '0.5625rem', color: 'var(--text-3)', background: 'var(--surface-2)', border: '1px solid var(--border)', padding: '0.15rem 0.45rem', borderRadius: 2, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{status}</span>
                    </div>
                    <p style={{ fontSize: '0.8125rem', color: 'var(--text-3)', lineHeight: 1.7, fontWeight: 300 }}>{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── CTA ──────────────────────────────────────────── */}
      <div className="section-divider" />
      <section style={{ padding: '6rem 0', position: 'relative', overflow: 'hidden' }}>
        {/* CTA ambient glow */}
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 500, height: 500, background: 'radial-gradient(circle, rgba(201,168,76,0.04) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div className="container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '1.25rem', position: 'relative' }}>
          <h2>Ready to <em>launch</em>?</h2>
          <p style={{ maxWidth: 400, fontWeight: 300 }}>Create a privacy-preserving campaign in minutes. No custodians, no middlemen.</p>
          <Link href="/create" className="btn btn-primary btn-lg" style={{ marginTop: '0.5rem' }}>
            Create a campaign <ArrowRightIcon size={14} />
          </Link>
        </div>
      </section>
    </>
  );
}

function LayersPlaceholder() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--border-2)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 2 7 12 12 22 7 12 2" /><polyline points="2 17 12 22 22 17" /><polyline points="2 12 12 17 22 12" />
    </svg>
  );
}
