import { NextRequest, NextResponse } from 'next/server';
import { Octokit } from '@octokit/rest';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

export const maxDuration = 60;

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
const GITHUB_OWNER = 'Castro336488';
const GITHUB_REPO = 'Castro';
const GITHUB_FILE = 'castro-api/blobs.json';

const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
  },
});

async function getBlobs() {
  try {
    const { data } = await octokit.repos.getContent({
      owner: GITHUB_OWNER,
      repo: GITHUB_REPO,
      path: GITHUB_FILE,
    });
    const content = Buffer.from((data as any).content, 'base64').toString('utf8');
    return { blobs: JSON.parse(content).blobs, sha: (data as any).sha };
  } catch (err) {
    return { blobs: [], sha: null };
  }
}

async function saveBlobs(blobs: any[], sha: string | null) {
  const content = Buffer.from(JSON.stringify({ blobs }, null, 2)).toString('base64');
  await octokit.repos.createOrUpdateFileContents({
    owner: GITHUB_OWNER,
    repo: GITHUB_REPO,
    path: GITHUB_FILE,
    message: 'update blobs',
    content,
    sha: sha || undefined,
  });
}

export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const name = searchParams.get('name') || '';
    const owner = searchParams.get('owner') || '';
    const txHash = searchParams.get('txHash') || '';
    const blobName = `media/${Date.now()}-${name.replace(/\s+/g, '-')}`;

    // Get file data
    const arrayBuffer = await req.arrayBuffer();
    const fileData = new Uint8Array(arrayBuffer);

    // Upload to Cloudflare R2
    await r2.send(new PutObjectCommand({
      Bucket: 'castro-videos',
      Key: blobName,
      Body: fileData,
      ContentType: req.headers.get('content-type') || 'application/octet-stream',
    }));

    console.log('Uploaded to R2:', blobName);

    // Save metadata to GitHub
    const { blobs, sha } = await getBlobs();
    blobs.push({ name, blobName, owner, txHash, uploadedAt: new Date().toISOString() });
    await saveBlobs(blobs, sha);

    return NextResponse.json({ success: true, blobName });
  } catch (err: any) {
    console.error('Upload error:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
