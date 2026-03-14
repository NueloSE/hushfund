'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { LogoIcon } from '@/lib/icons';

const links = [
  { href: '/explore', label: 'Explore' },
  { href: '/create', label: 'Create' },
  { href: '/dashboard', label: 'Dashboard' },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link href="/" className="navbar-logo">
          <LogoIcon size={22} />
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

        <ConnectButton
          accountStatus="avatar"
          chainStatus="none"
          showBalance={false}
          label="Connect"
        />
      </div>
    </nav>
  );
}
