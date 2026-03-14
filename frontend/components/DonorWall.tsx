'use client';

import { type PublicDonation, type PrivateDonation } from '@/lib/contract';
import { formatETH, formatDate, shortAddress, avatarLetter } from '@/lib/utils';
import { LockIcon } from '@/lib/icons';

type WallEntry =
  | { kind: 'public'; data: PublicDonation }
  | { kind: 'private'; data: PrivateDonation };

export function DonorWall({ publicDonations, privateDonations }: {
  publicDonations: PublicDonation[];
  privateDonations: PrivateDonation[];
}) {
  const entries: WallEntry[] = [
    ...publicDonations.map((d) => ({ kind: 'public' as const, data: d })),
    ...privateDonations.map((d) => ({ kind: 'private' as const, data: d })),
  ].sort((a, b) => Number(b.data.timestamp) - Number(a.data.timestamp));

  if (entries.length === 0) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p style={{ fontSize: '0.8125rem', color: 'var(--text-3)' }}>No donations yet. Be the first.</p>
      </div>
    );
  }

  return (
    <div>
      {entries.map((entry, i) => (
        <div key={i} className="donor-row">
          {entry.kind === 'public' ? (
            <>
              <div className="avatar public">{avatarLetter(entry.data.donor)}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="donor-name" style={{ fontFamily: 'var(--mono)', fontSize: '0.8125rem' }}>{shortAddress(entry.data.donor)}</div>
                {entry.data.message && (
                  <div className="donor-msg">&ldquo;{entry.data.message}&rdquo;</div>
                )}
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div className="donor-amount">{formatETH(entry.data.amount)}</div>
                <div style={{ fontSize: '0.6875rem', color: 'var(--text-3)', marginTop: '0.125rem' }}>{formatDate(entry.data.timestamp)}</div>
              </div>
            </>
          ) : (
            <>
              <div className="avatar" style={{ background: 'var(--surface-3)' }}>
                <LockIcon size={12} color="var(--text-3)" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span className="donor-name" style={{ fontSize: '0.8125rem' }}>Anonymous</span>
                  <span className="fhe-chip"><LockIcon size={8} /> FHE</span>
                </div>
                {entry.data.message && <div className="donor-msg">&ldquo;{entry.data.message}&rdquo;</div>}
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div className="donor-hidden">—</div>
                <div style={{ fontSize: '0.6875rem', color: 'var(--text-3)', marginTop: '0.125rem' }}>{formatDate(entry.data.timestamp)}</div>
              </div>
            </>
          )}
        </div>
      ))}
    </div>
  );
}
