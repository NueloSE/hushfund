'use client';

import { ExternalLinkIcon } from '@/lib/icons';

export function Footer() {
  return (
    <footer style={{
      borderTop: '1px solid var(--border)',
      padding: '2rem 0',
      marginTop: 'auto',
    }}>
      <div style={{
        maxWidth: 1100,
        margin: '0 auto',
        padding: '0 2rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
          <span style={{
            fontFamily: 'var(--serif)',
            fontSize: '0.9375rem',
            color: 'var(--text)',
            letterSpacing: '-0.01em',
          }}>
            HushFund
          </span>
          <span style={{ color: 'var(--border-2)', fontSize: '0.75rem' }}>/</span>
          <span style={{ fontSize: '0.6875rem', color: 'var(--text-3)', fontFamily: 'var(--mono)', letterSpacing: '0.02em' }}>
            Built for the Zama Developer Program
          </span>
        </div>
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
          <a href="https://docs.zama.ai/fhevm" target="_blank" rel="noopener noreferrer"
            className="footer-link" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            fhEVM docs <ExternalLinkIcon size={10} />
          </a>
          <a href="https://www.zama.ai/developer-hub" target="_blank" rel="noopener noreferrer"
            className="footer-link" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            Zama Dev Hub <ExternalLinkIcon size={10} />
          </a>
        </div>
      </div>
    </footer>
  );
}
