'use client';

interface StatCardProps {
  label: string;
  value: string;
  sub?: string;
  icon?: React.ReactNode;
  accent?: boolean;
}

export function StatCard({ label, value, sub, icon, accent }: StatCardProps) {
  return (
    <div className="stat-card" style={accent ? { borderColor: 'rgba(16,185,129,0.2)', background: 'rgba(16,185,129,0.03)' } : {}}>
      {icon && <div style={{ color: 'var(--text-3)', marginBottom: '0.375rem' }}>{icon}</div>}
      <div className="stat-label">{label}</div>
      <div className="stat-value" style={accent ? { color: 'var(--green)' } : {}}>{value}</div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  );
}
