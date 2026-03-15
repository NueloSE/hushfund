'use client';

import { type Campaign } from '@/lib/contract';
import { formatETH, progressPercent, daysRemaining } from '@/lib/utils';
import { LockIcon } from '@/lib/icons';
import { CampaignPlaceholder } from '@/components/CampaignPlaceholder';
import { CampaignImage } from '@/components/CampaignImage';

interface CampaignCardProps {
  campaign: Campaign;
}

export function CampaignCard({ campaign }: CampaignCardProps) {
  const progress = campaign.mode === 0
    ? progressPercent(campaign.totalRaised, campaign.goalAmount)
    : null;
  const days = daysRemaining(campaign.deadline);
  const isGoalHit = campaign.milestoneReached;
  const isClosed = !campaign.active || campaign.withdrawn;
  const href = `/campaign/${String(campaign.id)}`;

  return (
    <a href={href} style={{ display: 'block', cursor: 'pointer', textDecoration: 'none', color: 'inherit' }}>
      <article className="card" style={{
        height: '100%',
        position: 'relative',
        opacity: isClosed ? 0.55 : 1,
        transition: 'opacity 0.2s',
      }}>
        {/* Closed overlay banner */}
        {isClosed && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 2,
            background: campaign.withdrawn
              ? 'linear-gradient(135deg, rgba(74,222,128,0.9) 0%, rgba(58,208,110,0.9) 100%)'
              : 'linear-gradient(135deg, rgba(107,101,96,0.9) 0%, rgba(59,56,53,0.9) 100%)',
            padding: '0.5rem 1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.4rem',
          }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={campaign.withdrawn ? '#052e16' : '#E8E4DD'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {campaign.withdrawn
                ? <><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></>
                : <><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></>
              }
            </svg>
            <span style={{
              fontSize: '0.625rem',
              fontWeight: 700,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              fontFamily: 'var(--mono)',
              color: campaign.withdrawn ? '#052e16' : '#E8E4DD',
            }}>
              {campaign.withdrawn ? 'Completed' : 'Closed'}
            </span>
          </div>
        )}

        {/* Image */}
        {campaign.imageUrl ? (
          <CampaignImage src={campaign.imageUrl} title={campaign.title} height={180} closed={isClosed} />
        ) : (
          <CampaignPlaceholder title={campaign.title} style={isClosed ? { filter: 'grayscale(0.6)' } : {}} />
        )}

        <div className="card-body">
          {/* Status chips */}
          <div style={{ display: 'flex', gap: '0.375rem', marginBottom: '0.875rem', flexWrap: 'wrap', alignItems: 'center' }}>
            {isGoalHit
              ? <span className="badge badge-green">Goal reached</span>
              : campaign.active
                ? <span className="badge badge-gold">{campaign.mode === 0 ? 'Milestone' : 'Flexible'}</span>
                : <span className="badge badge-stone">Closed</span>
            }
            <span className="fhe-chip"><LockIcon size={8} /> FHE</span>
            {days !== Infinity && days > 0 && days < 30 && campaign.active && (
              <span className="badge badge-warn">{days}d left</span>
            )}
          </div>

          {/* Title */}
          <h3 style={{
            fontSize: '0.9375rem',
            fontWeight: 500,
            marginBottom: '0.375rem',
            lineHeight: 1.35,
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            letterSpacing: '-0.01em',
          }}>
            {campaign.title}
          </h3>

          <p style={{
            fontSize: '0.8125rem',
            marginBottom: '1rem',
            color: 'var(--text-3)',
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            fontWeight: 300,
            lineHeight: 1.6,
          }}>
            {campaign.description}
          </p>

          {/* Progress bar (milestone only) */}
          {progress !== null && (
            <div style={{ marginBottom: '1rem' }}>
              <div className="progress-track">
                <div className={`progress-fill ${isGoalHit ? 'goal-hit' : ''}`} style={{ width: `${progress}%` }} />
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginTop: '0.375rem',
                fontSize: '0.625rem',
                color: 'var(--text-3)',
                fontFamily: 'var(--mono)',
                letterSpacing: '0.02em',
              }}>
                <span>{progress}%</span>
                <span>{formatETH(campaign.goalAmount)} goal</span>
              </div>
            </div>
          )}

          {/* Footer stats */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            paddingTop: '0.875rem',
            borderTop: '1px solid var(--border)',
          }}>
            <div>
              <div style={{
                fontSize: '1.125rem',
                fontWeight: 400,
                color: 'var(--text)',
                fontFamily: 'var(--serif)',
                letterSpacing: '-0.02em',
              }}>
                {formatETH(campaign.totalRaised)}
              </div>
              <div style={{ fontSize: '0.625rem', color: 'var(--text-3)', marginTop: '0.125rem', fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>raised</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{
                fontSize: '1rem',
                fontWeight: 400,
                color: 'var(--text)',
                fontFamily: 'var(--serif)',
              }}>
                {Number(campaign.donorCount)}
              </div>
              <div style={{ fontSize: '0.625rem', color: 'var(--text-3)', marginTop: '0.125rem', fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>donors</div>
            </div>
          </div>
        </div>
      </article>
    </a>
  );
}
