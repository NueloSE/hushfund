'use client';

/**
 * Generates a unique visual placeholder from a string (campaign title).
 * Uses the title's character codes to create deterministic but unique
 * gradient colors and positions — every campaign gets its own look.
 */
function hashStr(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

const PALETTES = [
  ['#1a1a2e', '#16213e', '#0f3460', '#e94560'],
  ['#0d1b2a', '#1b263b', '#415a77', '#778da9'],
  ['#10002b', '#240046', '#3c096c', '#5a189a'],
  ['#1b1b1b', '#2d2d2d', '#3a3a3a', '#c9a84c'],
  ['#0a0a0a', '#1a1a2e', '#162447', '#1f4068'],
  ['#0b0c10', '#1f2833', '#2c3e50', '#45a29e'],
  ['#121212', '#1e1e1e', '#2d2d2d', '#bb86fc'],
  ['#0d1117', '#161b22', '#21262d', '#58a6ff'],
];

interface PlaceholderProps {
  title: string;
  height?: number;
  style?: React.CSSProperties;
}

export function CampaignPlaceholder({ title, height = 180, style }: PlaceholderProps) {
  const h = hashStr(title || 'campaign');
  const palette = PALETTES[h % PALETTES.length];
  const angle = (h % 360);
  const secondAngle = ((h * 7) % 360);

  // Get initials (first letter of first two words)
  const words = (title || 'C').trim().split(/\s+/);
  const initials = words.length >= 2
    ? (words[0][0] + words[1][0]).toUpperCase()
    : words[0].slice(0, 2).toUpperCase();

  // Circle positions derived from hash
  const cx1 = 20 + (h % 30);
  const cy1 = 20 + ((h * 3) % 30);
  const cx2 = 50 + ((h * 5) % 30);
  const cy2 = 50 + ((h * 7) % 30);

  return (
    <div style={{
      width: '100%',
      height,
      position: 'relative',
      overflow: 'hidden',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      ...style,
    }}>
      {/* Base gradient */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: `linear-gradient(${angle}deg, ${palette[0]} 0%, ${palette[1]} 40%, ${palette[2]} 100%)`,
      }} />

      {/* Accent orb 1 */}
      <div style={{
        position: 'absolute',
        width: '60%',
        height: '60%',
        left: `${cx1}%`,
        top: `${cy1}%`,
        transform: 'translate(-50%, -50%)',
        background: `radial-gradient(circle, ${palette[3]}22 0%, transparent 70%)`,
        borderRadius: '50%',
      }} />

      {/* Accent orb 2 */}
      <div style={{
        position: 'absolute',
        width: '40%',
        height: '40%',
        left: `${cx2}%`,
        top: `${cy2}%`,
        transform: 'translate(-50%, -50%)',
        background: `radial-gradient(circle, ${palette[3]}18 0%, transparent 70%)`,
        borderRadius: '50%',
      }} />

      {/* Subtle grid pattern */}
      <div style={{
        position: 'absolute',
        inset: 0,
        opacity: 0.04,
        backgroundImage: `linear-gradient(${palette[3]} 1px, transparent 1px), linear-gradient(90deg, ${palette[3]} 1px, transparent 1px)`,
        backgroundSize: '24px 24px',
      }} />

      {/* Initials */}
      <div style={{
        position: 'relative',
        zIndex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0.5rem',
      }}>
        <div style={{
          width: 52,
          height: 52,
          borderRadius: '50%',
          border: `1px solid ${palette[3]}33`,
          background: `${palette[3]}11`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.125rem',
          fontFamily: 'var(--serif)',
          fontWeight: 400,
          color: `${palette[3]}cc`,
          letterSpacing: '0.05em',
        }}>
          {initials}
        </div>
      </div>

      {/* Bottom fade */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '40%',
        background: `linear-gradient(to top, ${palette[0]} 0%, transparent 100%)`,
        opacity: 0.5,
      }} />
    </div>
  );
}
