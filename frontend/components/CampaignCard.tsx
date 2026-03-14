'use client';

import Link from 'next/link';
import { type Campaign } from '@/lib/contract';
import { formatETH, progressPercent, daysRemaining } from '@/lib/utils';
import { LockIcon } from '@/lib/icons';

interface CampaignCardProps {
  campaign: Campaign;
}

export function CampaignCard({ campaign }: CampaignCardProps) {
  const progress = campaign.mode === 0
    ? progressPercent(campaign.totalRaised, campaign.goalAmount)
    : null;
  const days = daysRemaining(campaign.deadline);
  const isGoalHit = campaign.milestoneReached;

  return (
    <Link href={`/campaign/${campaign.id}`} style={{ display: 'block' }}>
      <article className="card" style={{ cursor: 'pointer', height: '100%' }}>
        {/* Image */}
        {campaign.imageUrl ? (
          <img src={campaign.imageUrl} alt={campaign.title} className="campaign-img" />
        ) : (
          <div className="campaign-img-placeholder">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--border-2)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
            </svg>
          </div>
        )}

        <div className="card-body">
          {/* Status chips */}
          <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
            {isGoalHit
              ? <span className="badge badge-green">Goal reached</span>
              : campaign.active
                ? <span className="badge badge-violet">{campaign.mode === 0 ? 'Milestone' : 'Flexible'}</span>
                : <span className="badge badge-stone">Closed</span>
            }
            <span className="fhe-chip"><LockIcon size={9} /> FHE</span>
            {days !== Infinity && days > 0 && days < 30 && (
              <span className="badge badge-warn">{days}d left</span>
            )}
          </div>

          {/* Title */}
          <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, marginBottom: '0.375rem', lineHeight: 1.35,
            overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
            {campaign.title}
          </h3>

          <p style={{ fontSize: '0.8125rem', marginBottom: '0.875rem', color: 'var(--text-3)',
            overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
            {campaign.description}
          </p>

          {/* Progress bar (milestone only) */}
          {progress !== null && (
            <div style={{ marginBottom: '0.875rem' }}>
              <div className="progress-track">
                <div className={`progress-fill ${isGoalHit ? 'goal-hit' : ''}`} style={{ width: `${progress}%` }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.375rem', fontSize: '0.6875rem', color: 'var(--text-3)', fontFamily: 'var(--mono)' }}>
                <span>{progress}%</span>
                <span>{formatETH(campaign.goalAmount)} goal</span>
              </div>
            </div>
          )}

          {/* Footer stats */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', paddingTop: '0.75rem', borderTop: '1px solid var(--border)' }}>
            <div>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text)', fontFamily: 'var(--mono)', letterSpacing: '-0.02em' }}>
                {formatETH(campaign.totalRaised)}
              </div>
              <div style={{ fontSize: '0.6875rem', color: 'var(--text-3)', marginTop: '0.125rem' }}>raised</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text)', fontFamily: 'var(--mono)' }}>
                {Number(campaign.donorCount)}
              </div>
              <div style={{ fontSize: '0.6875rem', color: 'var(--text-3)', marginTop: '0.125rem' }}>donors</div>
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
}
