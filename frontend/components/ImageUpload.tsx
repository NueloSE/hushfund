'use client';

import { useState, useRef, useCallback } from 'react';

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
}

async function uploadImage(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) throw new Error('Upload failed');
  const data = await res.json();
  if (!data.url) throw new Error('No URL returned');
  return data.url;
}

export function ImageUpload({ value, onChange }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState('');
  const [mode, setMode] = useState<'upload' | 'url'>('upload');
  const [preview, setPreview] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be under 5MB.');
      return;
    }

    setError('');

    // Show local preview immediately
    const localUrl = URL.createObjectURL(file);
    setPreview(localUrl);

    try {
      setUploading(true);
      const url = await uploadImage(file);
      onChange(url);
      setPreview('');
    } catch {
      setError('Upload failed. Try pasting a URL instead.');
      setPreview('');
    } finally {
      setUploading(false);
    }
  }, [onChange]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const displayUrl = preview || value;

  return (
    <div>
      <label className="label">
        Cover image <span style={{ color: 'var(--text-3)', fontWeight: 300, textTransform: 'none', letterSpacing: 0 }}>(optional)</span>
      </label>

      {/* Mode toggle */}
      <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '0.625rem' }}>
        <button
          type="button"
          onClick={() => setMode('upload')}
          style={{
            padding: '0.3rem 0.625rem',
            fontSize: '0.6875rem',
            fontFamily: 'var(--mono)',
            letterSpacing: '0.03em',
            background: mode === 'upload' ? 'var(--surface-3)' : 'transparent',
            border: `1px solid ${mode === 'upload' ? 'var(--border-2)' : 'var(--border)'}`,
            borderRadius: 4,
            color: mode === 'upload' ? 'var(--text)' : 'var(--text-3)',
            cursor: 'pointer',
            transition: 'all 0.15s',
          }}
        >
          Upload file
        </button>
        <button
          type="button"
          onClick={() => setMode('url')}
          style={{
            padding: '0.3rem 0.625rem',
            fontSize: '0.6875rem',
            fontFamily: 'var(--mono)',
            letterSpacing: '0.03em',
            background: mode === 'url' ? 'var(--surface-3)' : 'transparent',
            border: `1px solid ${mode === 'url' ? 'var(--border-2)' : 'var(--border)'}`,
            borderRadius: 4,
            color: mode === 'url' ? 'var(--text)' : 'var(--text-3)',
            cursor: 'pointer',
            transition: 'all 0.15s',
          }}
        >
          Paste URL
        </button>
      </div>

      {mode === 'upload' ? (
        <>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
          />
          <div
            onClick={() => fileRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            style={{
              border: `1px dashed ${dragOver ? 'var(--accent)' : 'var(--border-2)'}`,
              borderRadius: 8,
              padding: displayUrl ? '0' : '2rem',
              textAlign: 'center',
              cursor: 'pointer',
              background: dragOver ? 'var(--accent-lt)' : 'var(--surface-2)',
              transition: 'all 0.2s',
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            {uploading ? (
              <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                <div className="spinner" style={{ width: 20, height: 20, borderTopColor: 'var(--accent)' }} />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-3)', fontFamily: 'var(--mono)' }}>Uploading to IPFS...</span>
              </div>
            ) : displayUrl ? (
              <div style={{ position: 'relative' }}>
                <img src={displayUrl} alt="" style={{ width: '100%', height: 160, objectFit: 'cover', display: 'block' }} />
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'rgba(0,0,0,0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: 0,
                  transition: 'opacity 0.15s',
                }}
                  onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                  onMouseLeave={(e) => (e.currentTarget.style.opacity = '0')}
                >
                  <span style={{ fontSize: '0.75rem', color: 'white', fontFamily: 'var(--mono)', background: 'rgba(0,0,0,0.5)', padding: '0.375rem 0.75rem', borderRadius: 4 }}>
                    Click to replace
                  </span>
                </div>
                {/* Remove button */}
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onChange(''); setPreview(''); }}
                  style={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    width: 24,
                    height: 24,
                    borderRadius: 4,
                    background: 'rgba(0,0,0,0.6)',
                    border: 'none',
                    color: 'white',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                <div>
                  <span style={{ fontSize: '0.8125rem', color: 'var(--text-2)', fontWeight: 500 }}>
                    Drop an image here or click to browse
                  </span>
                  <div style={{ fontSize: '0.625rem', color: 'var(--text-3)', marginTop: '0.25rem', fontFamily: 'var(--mono)' }}>
                    PNG, JPG, GIF, WEBP — max 5MB
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      ) : (
        <>
          <input
            type="url"
            className="input"
            placeholder="https://..."
            value={value}
            onChange={(e) => onChange(e.target.value)}
          />
          {value && (
            <div style={{ marginTop: '0.5rem', position: 'relative', borderRadius: 6, overflow: 'hidden', border: '1px solid var(--border)' }}>
              <img
                src={value}
                alt=""
                style={{ width: '100%', height: 140, objectFit: 'cover', display: 'block' }}
                onError={(e) => (e.currentTarget.style.display = 'none')}
              />
            </div>
          )}
        </>
      )}

      {error && (
        <div style={{ fontSize: '0.6875rem', color: 'var(--danger)', marginTop: '0.375rem' }}>{error}</div>
      )}
    </div>
  );
}
