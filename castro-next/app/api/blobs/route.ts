import { NextResponse } from 'next/server';
import { Octokit } from '@octokit/rest';

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
const GITHUB_OWNER = 'Castro336488';
const GITHUB_REPO = 'Castro';
const GITHUB_FILE = 'castro-api/blobs.json';

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

export async function GET() {
  const { blobs } = await getBlobs();
  return NextResponse.json({ blobs });
}
