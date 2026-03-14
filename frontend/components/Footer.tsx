'use client';

import Link from 'next/link';
import { ExternalLinkIcon } from '@/lib/icons';

export function Footer() {
  return (
    <footer style={{
      borderTop: '1px solid var(--border)',
      padding: '1.5rem',
      marginTop: 'auto',
    }}>
      <div style={{
        maxWidth: 1120,
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.02em' }}>HushFund</span>
          <span style={{ color: 'var(--border-2)', fontSize: '0.75rem' }}>·</span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>Built for the Zama Developer Program</span>
        </div>
        <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
          <a href="https://docs.zama.ai/fhevm" target="_blank" rel="noopener noreferrer"
            className="footer-link" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            fhEVM docs <ExternalLinkIcon size={11} />
          </a>
          <a href="https://www.zama.ai/developer-hub" target="_blank" rel="noopener noreferrer"
            className="footer-link" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            Zama Dev Hub <ExternalLinkIcon size={11} />
          </a>
        </div>
      </div>
    </footer>
  );
}
