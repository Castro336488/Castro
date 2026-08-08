const express = require('express');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { Octokit } = require('@octokit/rest');

const app = express();
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');
  next();
});

const SHELBY_API_KEY = process.env.SHELBY_API_KEY;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_OWNER = 'Castro336488';
const GITHUB_REPO = 'Castro';
const GITHUB_FILE = 'castro-api/blobs.json';

const octokit = new Octokit({ auth: GITHUB_TOKEN });

async function getBlobs() {
  try {
    const { data } = await octokit.repos.getContent({
      owner: GITHUB_OWNER,
      repo: GITHUB_REPO,
      path: GITHUB_FILE,
    });
    const content = Buffer.from(data.content, 'base64').toString('utf8');
    return { blobs: JSON.parse(content).blobs, sha: data.sha };
  } catch (err) {
    return { blobs: [], sha: null };
  }
}

async function saveBlobs(blobs, sha) {
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

app.get('/blobs', async (req, res) => {
  const { blobs } = await getBlobs();
  res.json({ blobs });
});

app.post('/upload', express.raw({ type: '*/*', limit: '500mb' }), async (req, res) => {
  try {
    const { name, owner, txHash, blobName: clientBlobName } = req.query;
    const safeName = name.replace(/\s+/g, '-');
    const blobName = clientBlobName || `media/${Date.now()}-${safeName}`;
    const tmpFile = `/tmp/${Date.now()}-${safeName}`;

    fs.writeFileSync(tmpFile, req.body);
    console.log('Uploading to Shelby:', blobName);

    // Upload to Shelby using SDK
    const { ShelbyClient } = await import('@shelby-protocol/sdk/node');
    const { Network, Account, Ed25519PrivateKey } = await import('@aptos-labs/ts-sdk');

    const shelbyClient = new ShelbyClient({
      network: Network.SHELBYNET,
      apiKey: SHELBY_API_KEY,
      rpc: { apiKey: SHELBY_API_KEY },
    });

    const privateKey = new Ed25519PrivateKey(process.env.SHELBY_PRIVATE_KEY);
    const account = Account.fromPrivateKey({ privateKey });

    const fileBuffer = fs.readFileSync(tmpFile);
    const blobData = new Uint8Array(fileBuffer);

    await shelbyClient.batchUpload({
      blobs: [{ blobName, blobData }],
      signer: account,
      expirationMicros: Date.now() * 1000 + 604800000000,
    });

    fs.unlinkSync(tmpFile);
    console.log('Uploaded to Shelby successfully!');

    const { blobs, sha } = await getBlobs();
    blobs.push({ name, blobName, owner, txHash, uploadedAt: new Date().toISOString() });
    await saveBlobs(blobs, sha);

    res.json({ success: true, blobName });
  } catch (err) {
    console.error('Upload error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get('/download', async (req, res) => {
  try {
    const { blobName } = req.query;
    console.log('Downloading from Shelby:', blobName);

    const { ShelbyClient } = await import('@shelby-protocol/sdk/node');
    const { Network } = await import('@aptos-labs/ts-sdk');

    const shelbyClient = new ShelbyClient({
      network: Network.SHELBYNET,
      apiKey: SHELBY_API_KEY,
      rpc: { apiKey: SHELBY_API_KEY },
    });

    const data = await shelbyClient.download({ blobName });

    const ext = blobName.split('.').pop().toLowerCase();
    const contentTypes = {
      mp4: 'video/mp4', mov: 'video/quicktime', avi: 'video/x-msvideo',
      webm: 'video/webm', mkv: 'video/x-matroska',
      jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png',
      gif: 'image/gif', webp: 'image/webp',
      pdf: 'application/pdf', txt: 'text/plain'
    };
    res.setHeader('Content-Type', contentTypes[ext] || 'application/octet-stream');
    res.send(Buffer.from(data));
  } catch (err) {
    console.error('Download error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get('/', (req, res) => {
  res.json({ status: 'Castro API running on Shelbynet!' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Castro API running on port ${PORT}`));
