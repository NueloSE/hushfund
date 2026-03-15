'use client';

import { useParams } from 'next/navigation';

export default function TestPage() {
  const params = useParams();
  const id = params.id as string;

  return (
    <div style={{ padding: '4rem 2rem', color: 'white' }}>
      <h1>Test Route Works!</h1>
      <p>ID from URL: <strong>{id}</strong></p>
      <p>Type: {typeof id}</p>
      <p>BigInt: {String(BigInt(id))}</p>
      <a href="/explore" style={{ color: 'var(--accent)', marginTop: '1rem', display: 'inline-block' }}>Back to explore</a>
    </div>
  );
}
