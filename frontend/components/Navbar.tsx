'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useBalance, useChainId } from 'wagmi';
import { sepolia } from 'wagmi/chains';
import { LogoIcon } from '@/lib/icons';

const links = [
  { href: '/explore', label: 'Explore' },
  { href: '/create', label: 'Create' },
  { href: '/dashboard', label: 'Dashboard' },
];

function formatBal(value?: bigint, decimals?: number): string {
  if (value === undefined || decimals === undefined) return '0';
  const num = Number(value) / 10 ** decimals;
  if (isNaN(num)) return '0';
  return num.toFixed(4).replace(/\.?0+$/, '');
}

export function Navbar() {
  const pathname = usePathname();
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { data: balData } = useBalance({ address, query: { enabled: isConnected } });

  const isCorrectChain = chainId === sepolia.id;

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link href="/" className="navbar-logo">
          <LogoIcon size={24} />
          HushFund
        </Link>

        <div className="navbar-sep" />

        <div className="navbar-links">
          {links.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`navbar-link ${pathname === href ? 'active' : ''}`}
            >
              {label}
            </Link>
          ))}
        </div>

        {/* Network + Balance display */}
        {isConnected && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginRight: '0.75rem' }}>
            {/* Chain indicator */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.35rem 0.625rem',
              background: isCorrectChain ? 'var(--surface-2)' : 'var(--danger-lt)',
              border: `1px solid ${isCorrectChain ? 'var(--border)' : 'rgba(232,116,97,0.2)'}`,
              borderRadius: 6,
              fontSize: '0.6875rem',
              fontFamily: 'var(--mono)',
              letterSpacing: '0.02em',
            }}>
              <div style={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                background: isCorrectChain ? 'var(--green)' : 'var(--danger)',
                boxShadow: isCorrectChain ? '0 0 6px rgba(74,222,128,0.4)' : '0 0 6px rgba(232,116,97,0.4)',
              }} />
              <span style={{ color: isCorrectChain ? 'var(--text-2)' : 'var(--danger)' }}>
                {isCorrectChain ? 'Sepolia' : 'Wrong Network'}
              </span>
            </div>

            {/* Balance */}
            {balData && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.35rem 0.625rem',
                background: 'var(--surface-2)',
                border: '1px solid var(--border)',
                borderRadius: 6,
                fontSize: '0.6875rem',
                fontFamily: 'var(--mono)',
                letterSpacing: '0.01em',
              }}>
                <span style={{ color: 'var(--accent)', fontWeight: 600 }}>
                  {formatBal(balData.value, balData.decimals)}
                </span>
                <span style={{ color: 'var(--text-3)' }}>{balData.symbol}</span>
              </div>
            )}
          </div>
        )}

        <ConnectButton
          accountStatus="address"
          chainStatus="none"
          showBalance={false}
          label="Connect Wallet"
        />
      </div>
    </nav>
  );
}
