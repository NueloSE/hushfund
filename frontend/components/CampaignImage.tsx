'use client';

import { useState } from 'react';
import { CampaignPlaceholder } from '@/components/CampaignPlaceholder';

interface CampaignImageProps {
  src: string;
  title: string;
  height?: number;
  closed?: boolean;
  style?: React.CSSProperties;
}

export function CampaignImage({ src, title, height = 180, closed, style }: CampaignImageProps) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return <CampaignPlaceholder title={title} height={height} style={{ ...style, ...(closed ? { filter: 'grayscale(0.6)' } : {}) }} />;
  }

  return (
    <img
      src={src}
      alt={title}
      style={{ width: '100%', height, objectFit: 'cover', ...(closed ? { filter: 'grayscale(0.6)' } : {}), ...style }}
      className="campaign-img"
      onError={() => setFailed(true)}
    />
  );
}
