'use client';

import { useEffect, useRef } from 'react';

export function MilestoneConfetti({ active }: { active: boolean }) {
  const fired = useRef(false);

  useEffect(() => {
    if (!active || fired.current) return;
    fired.current = true;
    import('canvas-confetti').then(({ default: confetti }) => {
      const colors = ['#7C3AED', '#10B981', '#c4b5fd', '#6ee7b7', '#FAFAFA'];
      confetti({ particleCount: 100, spread: 76, origin: { x: 0.5, y: 0.6 }, colors });
      setTimeout(() => {
        confetti({ particleCount: 50, angle: 60,  spread: 50, origin: { x: 0 }, colors });
        confetti({ particleCount: 50, angle: 120, spread: 50, origin: { x: 1 }, colors });
      }, 300);
    });
  }, [active]);

  if (!active) return null;

  return (
    <div className="milestone-banner">
      <h3>Goal reached</h3>
      <p>This campaign has hit its funding milestone. The creator may now withdraw.</p>
    </div>
  );
}
