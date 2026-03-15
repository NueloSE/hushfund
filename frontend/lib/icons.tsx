// ─── HushFund SVG Icon Library ─────────────────────────────────────────────
// Clean, minimal SVG icons

import React from 'react';

type IconProps = {
  size?: number;
  className?: string;
  color?: string;
};

const icon = (path: React.ReactNode, viewBox = '0 0 24 24') =>
  function Icon({ size = 16, className = '', color = 'currentColor' }: IconProps) {
    return (
      <svg
        width={size}
        height={size}
        viewBox={viewBox}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        aria-hidden="true"
      >
        {path}
      </svg>
    );
  };

export const LockIcon = icon(
  <><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></>
);

export const EyeIcon = icon(
  <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></>
);

export const EyeOffIcon = icon(
  <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></>
);

export const ShieldIcon = icon(
  <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></>
);

export const TrendingUpIcon = icon(
  <><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></>
);

export const UsersIcon = icon(
  <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></>
);

export const ArrowRightIcon = icon(
  <><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></>
);

export const CheckIcon = icon(
  <><polyline points="20 6 9 17 4 12" /></>
);

export const PlusIcon = icon(
  <><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></>
);

export const ZapIcon = icon(
  <><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></>
);

export const LayersIcon = icon(
  <><polygon points="12 2 2 7 12 12 22 7 12 2" /><polyline points="2 17 12 22 22 17" /><polyline points="2 12 12 17 22 12" /></>
);

export const TargetIcon = icon(
  <><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></>
);

export const GridIcon = icon(
  <><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></>
);

export const LogOutIcon = icon(
  <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></>
);

export const ExternalLinkIcon = icon(
  <><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></>
);

export const AlertCircleIcon = icon(
  <><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></>
);

export const CheckCircleIcon = icon(
  <><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></>
);

export const CoinsIcon = icon(
  <><circle cx="8" cy="8" r="6" /><path d="M18.09 10.37A6 6 0 1 1 10.34 18" /><path d="M7 6h1v4" /><path d="m16.71 13.88.7.71-2.82 2.82" /></>
);

export const LogoIcon = ({ size = 24 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
    <rect width="32" height="32" rx="6" fill="rgba(201, 168, 76, 0.1)" stroke="rgba(201, 168, 76, 0.2)" strokeWidth="1" />
    <path d="M9 11h14" stroke="#C9A84C" strokeWidth="2" strokeLinecap="round" />
    <path d="M9 16h14" stroke="#C9A84C" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
    <path d="M9 21h8" stroke="#C9A84C" strokeWidth="2" strokeLinecap="round" opacity="0.3" />
    <circle cx="23" cy="21" r="2.5" fill="#4ADE80" opacity="0.8" />
  </svg>
);
