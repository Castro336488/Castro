const express = require('express');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const app = express();
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');
  next();
});

const BLOBS_FILE = './blobs.json';
const SHELBY = 'npx --yes @shelby-protocol/cli';

const shelbyConfigDir = path.join(os.homedir(), '.shelby');
const shelbyConfigFile = path.join(shelbyConfigDir, 'config.yaml');
const shelbyLockFile = path.join(shelbyConfigDir, 'download.lock');

if (!fs.existsSync(shelbyConfigDir)) {
  fs.mkdirSync(shelbyConfigDir, { recursive: true });
}
if (fs.existsSync(shelbyLockFile)) {
  fs.unlinkSync(shelbyLockFile);
}

const yaml = `contexts:
  shelbynet:
    aptos_network:
      name: shelbynet
      fullnode: https://api.shelbynet.shelby.xyz/v1
      faucet: https://faucet.shelbynet.shelby.xyz
    shelby_network:
      rpc_endpoint: https://api.shelbynet.shelby.xyz/shelby
accounts:
  castro:
    private_key: ed25519-priv-0xa6ee059ffe64773a657afe5b96ced246a4f470946bc7261e3712b248bc2d79c0
    address: "0x74fd992bae661b9bf6ea4d52de5a9b5547a1fc4b137858cf1d3987e96b66b2b2"
default_context: shelbynet
default_account: castro
`;

fs.writeFileSync(shelbyConfigFile, yaml);
try {
  execSync(`chmod 600 ${shelbyConfigFile}`);
} catch (err) {
  console.log('Could not set permissions:', err.message);
}

if (!fs.existsSync(BLOBS_FILE)) {
  fs.writeFileSync(BLOBS_FILE, JSON.stringify({ blobs: [] }));
}

app.get('/blobs', (req, res) => {
  const data = JSON.parse(fs.readFileSync(BLOBS_FILE));
  res.json(data);
});

app.post('/upload', express.raw({ type: '*/*', limit: '500mb' }), (req, res) => {
  try {
    const { name, owner, txHash } = req.query;
    const safeName = name.replace(/\s+/g, '-');
    console.log('Uploading:', safeName, 'Owner:', owner);
    const blobName = `media/${Date.now()}-${safeName}`;
    const tmpFile = `/tmp/${Date.now()}-${safeName}`;
    fs.writeFileSync(tmpFile, req.body);
    const result = execSync(`${SHELBY} upload "${tmpFile}" "${blobName}" -e "2026-12-31"`, { encoding: 'utf8', timeout: 300000 });
    console.log('Shelby result:', result);
    fs.unlinkSync(tmpFile);
    const data = JSON.parse(fs.readFileSync(BLOBS_FILE));
    data.blobs.push({ name, blobName, owner, txHash, uploadedAt: new Date().toISOString() });
    fs.writeFileSync(BLOBS_FILE, JSON.stringify(data));
    res.json({ success: true, blobName });
  } catch (err) {
    console.error('Upload error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get('/download', (req, res) => {
  try {
    if (fs.existsSync(shelbyLockFile)) {
      fs.unlinkSync(shelbyLockFile);
    }
    const { blobName } = req.query;
    const tmpFile = `/tmp/${Date.now()}-download`;
    console.log('Downloading:', blobName);
    execSync(`${SHELBY} download "${blobName}" "${tmpFile}" --allow-concurrent`, { encoding: 'utf8', timeout: 300000 });

    // Detect content type from file extension
    const ext = blobName.split('.').pop().toLowerCase();
    const contentTypes = {
      mp4: 'video/mp4', mov: 'video/quicktime', avi: 'video/x-msvideo',
      webm: 'video/webm', mkv: 'video/x-matroska',
      jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png',
      gif: 'image/gif', webp: 'image/webp',
      pdf: 'application/pdf', txt: 'text/plain'
    };
    const contentType = contentTypes[ext] || 'application/octet-stream';

    res.setHeader('Content-Type', contentType);
    const stream = fs.createReadStream(tmpFile);
    stream.pipe(res);
    stream.on('end', () => { try { fs.unlinkSync(tmpFile); } catch(e) {} });
    stream.on('error', () => { try { fs.unlinkSync(tmpFile); } catch(e) {} });
  } catch (err) {
    console.error('Download error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get('/', (req, res) => {
  res.json({ status: 'Castro API is running!' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Castro API running on port ${PORT}`);
});
