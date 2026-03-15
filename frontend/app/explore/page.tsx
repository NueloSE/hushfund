'use client';

import { useState, useMemo } from 'react';
import { useReadContract } from 'wagmi';
import { HUSHFUND_ABI, HUSHFUND_ADDRESS, type Campaign } from '@/lib/contract';
import { CampaignCard } from '@/components/CampaignCard';

const PER_PAGE = 6;

export default function ExplorePage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data: campaigns, isLoading } = useReadContract({
    address: HUSHFUND_ADDRESS,
    abi: HUSHFUND_ABI,
    functionName: 'getCampaigns',
    args: [1n, 100n],
  });

  const all = (campaigns as Campaign[] | undefined) || [];

  // Filter by search
  const filtered = useMemo(() => {
    if (!search.trim()) return all;
    const q = search.toLowerCase();
    return all.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        c.creator.toLowerCase().includes(q)
    );
  }, [all, search]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE);

  return (
    <div className="container section">
      <div className="section-header">
        <span className="section-tag">All Campaigns</span>
        <h1 style={{ marginBottom: '0.625rem' }}>Explore <em>Campaigns</em></h1>
        <p style={{ fontWeight: 300 }}>Discover fundraisers using privacy-preserving FHE technology.</p>
      </div>

      {/* Search bar */}
      <div style={{ marginBottom: '2rem', position: 'relative' }}>
        <div style={{
          position: 'absolute',
          left: '0.875rem',
          top: '50%',
          transform: 'translateY(-50%)',
          color: 'var(--text-3)',
          pointerEvents: 'none',
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </div>
        <input
          type="text"
          className="input"
          placeholder="Search by title, description, or creator address..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          style={{ paddingLeft: '2.5rem', height: 44 }}
        />
        {search && (
          <button
            type="button"
            onClick={() => { setSearch(''); setPage(1); }}
            style={{
              position: 'absolute',
              right: '0.75rem',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'var(--surface-3)',
              border: 'none',
              borderRadius: 4,
              width: 22,
              height: 22,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'var(--text-3)',
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>

      {/* Results count */}
      {search && (
        <div style={{ marginBottom: '1.25rem', fontSize: '0.75rem', color: 'var(--text-3)', fontFamily: 'var(--mono)', letterSpacing: '0.02em' }}>
          {filtered.length} result{filtered.length !== 1 ? 's' : ''} for &ldquo;{search}&rdquo;
        </div>
      )}

      {isLoading ? (
        <div className="campaign-grid">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card">
              <div className="shimmer" style={{ height: 180 }} />
              <div className="card-body">
                <div className="shimmer" style={{ height: 10, width: '55%', marginBottom: 10 }} />
                <div className="shimmer" style={{ height: 8, width: '90%', marginBottom: 20 }} />
                <div className="shimmer" style={{ height: 3 }} />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <h3>{search ? 'No matches found' : 'No campaigns yet'}</h3>
          <p style={{ marginTop: '0.375rem' }}>
            {search ? 'Try a different search term.' : 'Be the first to create a privacy-preserving campaign.'}
          </p>
        </div>
      ) : (
        <>
          <div className="campaign-grid">
            {paginated.map((c) => <CampaignCard key={String(c.id)} campaign={c} />)}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.375rem',
              marginTop: '2.5rem',
            }}>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={safePage === 1}
                style={{ padding: '0 0.625rem' }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPage(p)}
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 6,
                    border: p === safePage ? '1px solid var(--accent)' : '1px solid var(--border)',
                    background: p === safePage ? 'var(--accent-lt)' : 'transparent',
                    color: p === safePage ? 'var(--accent)' : 'var(--text-3)',
                    fontSize: '0.75rem',
                    fontFamily: 'var(--mono)',
                    fontWeight: p === safePage ? 600 : 400,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.15s',
                  }}
                >
                  {p}
                </button>
              ))}

              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={safePage === totalPages}
                style={{ padding: '0 0.625rem' }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
