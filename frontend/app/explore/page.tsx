'use client';

import { useReadContract } from 'wagmi';
import { HUSHFUND_ABI, HUSHFUND_ADDRESS, type Campaign } from '@/lib/contract';
import { CampaignCard } from '@/components/CampaignCard';

export default function ExplorePage() {
  const { data: campaigns, isLoading, refetch } = useReadContract({
    address: HUSHFUND_ADDRESS,
    abi: HUSHFUND_ABI,
    functionName: 'getCampaigns',
    args: [1n, 50n],
  });

  const list = (campaigns as Campaign[] | undefined) || [];

  return (
    <div className="container section">
      <div className="section-header">
        <span className="section-tag">All Campaigns</span>
        <h1 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.75rem)', marginBottom: '0.5rem' }}>Explore Campaigns</h1>
        <p>Discover fundraisers using privacy-preserving FHE technology.</p>
      </div>

      {isLoading ? (
        <div className="campaign-grid">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card">
              <div className="shimmer" style={{ height: 180 }} />
              <div className="card-body">
                <div className="shimmer" style={{ height: 14, width: '55%', marginBottom: 10 }} />
                <div className="shimmer" style={{ height: 11, width: '90%', marginBottom: 20 }} />
                <div className="shimmer" style={{ height: 10 }} />
              </div>
            </div>
          ))}
        </div>
      ) : list.length === 0 ? (
        <div className="empty-state">
          <div className="icon">🌱</div>
          <h3>No campaigns yet</h3>
          <p>Be the first to create a privacy-preserving campaign.</p>
        </div>
      ) : (
        <div className="campaign-grid">
          {list.map((c) => <CampaignCard key={String(c.id)} campaign={c} />)}
        </div>
      )}
    </div>
  );
}
