import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Try Pinata first
    const jwt = process.env.PINATA_JWT;
    if (jwt) {
      const pinataForm = new FormData();
      pinataForm.append('file', file);
      pinataForm.append('pinataOptions', JSON.stringify({ cidVersion: 1 }));
      pinataForm.append('pinataMetadata', JSON.stringify({ name: file.name || 'campaign-image' }));

      const res = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
        method: 'POST',
        headers: { Authorization: `Bearer ${jwt}` },
        body: pinataForm,
      });

      if (res.ok) {
        const data = await res.json();
        return NextResponse.json({ url: `https://gateway.pinata.cloud/ipfs/${data.IpfsHash}` });
      }
      // If Pinata fails, fall through to imgbb
    }

    // Fallback: upload to imgbb (free, no auth needed for < 32MB)
    const arrayBuffer = await file.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');

    const imgbbForm = new FormData();
    imgbbForm.append('image', base64);

    const imgbbRes = await fetch('https://api.imgbb.com/1/upload?key=a]c4f58f7b3e844b3a0e7e3c0d5f1a2b3', {
      method: 'POST',
      body: imgbbForm,
    });

    if (imgbbRes.ok) {
      const data = await imgbbRes.json();
      if (data?.data?.url) {
        return NextResponse.json({ url: data.data.url });
      }
    }

    // Final fallback: return as base64 data URL
    const mimeType = file.type || 'image/png';
    const dataUrl = `data:${mimeType};base64,${base64}`;
    return NextResponse.json({ url: dataUrl });
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Upload failed' }, { status: 500 });
  }
}
