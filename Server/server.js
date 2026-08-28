/**
 * Twitch Extension Backend Service (EBS) Template
 * Standalone HTTPS Server with Automated SSL Key & Certificate Generation using node-forge
 * 
 * Run locally with:
 *   node Server/server.js
 * Or from Server directory:
 *   node server.js
 */

import express from 'express';
import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import forge from 'node-forge';
import dotenv from 'dotenv';

// Load environment variables if .env file exists
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables if .env file exists in Server/ or root directory
dotenv.config({ path: path.join(__dirname, '.env') });
dotenv.config({ path: path.join(__dirname, '../.env') });

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';
const TWITCH_EXTENSION_CLIENT_ID = process.env.TWITCH_EXTENSION_CLIENT_ID || process.env.TWITCH_CLIENT_ID || '';
const TWITCH_EXTENSION_SECRET = process.env.TWITCH_EXTENSION_SECRET || '';
const TWITCH_OWNER_ID = process.env.TWITCH_OWNER_ID || '12345678';

// Enable CORS for Twitch extension origins & local test rig + Chrome Private Network Access (PNA)
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Client-Id, X-Extension-Jwt, X-Requested-With, Accept, Access-Control-Request-Private-Network');
  
  // CRITICAL for Chrome PNA (Private Network Access) when public sites (twitch.tv) call local servers (localhost)
  res.setHeader('Access-Control-Allow-Private-Network', 'true');
  
  // Allow framing by Twitch extensions and local iframe rig
  res.removeHeader('X-Frame-Options');
  res.setHeader(
    'Content-Security-Policy',
    "frame-ancestors 'self' https://*.twitch.tv https://*.ext-twitch.tv http://localhost:* https://localhost:*;"
  );

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

app.use(express.json());

// -------------------------------------------------------------
// SSL Key & Certificate Management with node-forge
// -------------------------------------------------------------
const SSL_DIR = path.join(__dirname, 'ssl');
const KEY_PATH = process.env.SSL_KEY_PATH ? path.resolve(process.env.SSL_KEY_PATH) : path.join(SSL_DIR, 'server.key');
const CERT_PATH = process.env.SSL_CERT_PATH ? path.resolve(process.env.SSL_CERT_PATH) : path.join(SSL_DIR, 'server.cert');

function ensureSslCertificates() {
  const targetDir = path.dirname(KEY_PATH);
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const keyExists = fs.existsSync(KEY_PATH);
  const certExists = fs.existsSync(CERT_PATH);

  if (keyExists && certExists) {
    console.log('[EBS SSL] Existing SSL key and certificate found.');
    return {
      key: fs.readFileSync(KEY_PATH, 'utf8'),
      cert: fs.readFileSync(CERT_PATH, 'utf8'),
    };
  }

  console.log('[EBS SSL] Generating new self-signed SSL key & certificate using node-forge...');

  // Generate 2048-bit RSA keypair
  const keys = forge.pki.rsa.generateKeyPair(2048);
  const cert = forge.pki.createCertificate();

  cert.publicKey = keys.publicKey;
  cert.serialNumber = '01' + Date.now().toString(16);

  // Set validity (valid for 1 year)
  cert.validity.notBefore = new Date();
  cert.validity.notAfter = new Date();
  cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 1);

  // Subject and Issuer attributes
  const attrs = [
    { name: 'commonName', value: 'localhost' },
    { name: 'countryName', value: 'US' },
    { shortName: 'ST', value: 'California' },
    { name: 'localityName', value: 'San Francisco' },
    { name: 'organizationName', value: 'Twitch Extension EBS Local Dev' },
    { shortName: 'OU', value: 'Developer Rig' },
  ];

  cert.setSubject(attrs);
  cert.setIssuer(attrs);

  // Extensions including Subject Alternative Names (SAN) for localhost & 127.0.0.1
  cert.setExtensions([
    {
      name: 'basicConstraints',
      cA: true,
    },
    {
      name: 'keyUsage',
      keyCertSign: true,
      digitalSignature: true,
      nonRepudiation: true,
      keyEncipherment: true,
      dataEncipherment: true,
    },
    {
      name: 'extKeyUsage',
      serverAuth: true,
      clientAuth: true,
      codeSigning: true,
      emailProtection: true,
      timeStamping: true,
    },
    {
      name: 'subjectAltName',
      altNames: [
        { type: 2, value: 'localhost' },
        { type: 7, ip: '127.0.0.1' },
        { type: 7, ip: '::1' },
      ],
    },
  ]);

  // Self-sign certificate with SHA-256
  cert.sign(keys.privateKey, forge.md.sha256.create());

  // Convert to PEM format
  const pemKey = forge.pki.privateKeyToPem(keys.privateKey);
  const pemCert = forge.pki.certificateToPem(cert);

  // Save to disk
  fs.writeFileSync(KEY_PATH, pemKey, 'utf8');
  fs.writeFileSync(CERT_PATH, pemCert, 'utf8');

  console.log(`[EBS SSL] Generated SSL certificate at: ${CERT_PATH}`);
  console.log(`[EBS SSL] Generated SSL private key at: ${KEY_PATH}`);

  return { key: pemKey, cert: pemCert };
}

// -------------------------------------------------------------
// In-Memory EBS Extension State (Simulating DB / Redis)
// -------------------------------------------------------------
const serverStartTime = Date.now();

let ebsState = {
  config: {
    title: 'Community Interactive Hub',
    welcomeMessage: 'Welcome to the stream! Click around in panels to interact.',
    accentColor: '#9146FF',
    pollQuestion: 'Which game should we play next?',
    pollOptions: ['Cyberpunk 2077', 'Valorant', 'Minecraft', 'Elden Ring'],
  },
  poll: {
    question: 'Which game should we play next?',
    totalVotes: 8,
    options: [
      { text: 'Cyberpunk 2077', votes: 3 },
      { text: 'Valorant', votes: 2 },
      { text: 'Minecraft', votes: 2 },
      { text: 'Elden Ring', votes: 1 },
    ],
  },
  leaderboard: [
    { username: 'PixelChampion', score: 350 },
    { username: 'StreamGamer99', score: 220 },
    { username: 'NeonKnight', score: 140 },
    { username: 'TwitchNinja', score: 95 },
  ],
  stats: {
    totalPings: 0,
    totalActions: 0,
    totalBroadcasts: 0,
  },
};

// -------------------------------------------------------------
// EBS REST API Endpoints
// -------------------------------------------------------------

// 1. Health & Ping endpoint
app.get('/api/ebs/ping', (req, res) => {
  ebsState.stats.totalPings++;
  const uptimeSeconds = (Date.now() - serverStartTime) / 1000;
  res.json({
    status: 'online',
    serverTime: new Date().toISOString(),
    uptime: uptimeSeconds,
    protocol: req.protocol,
    environment: 'development-ebs',
    pingsReceived: ebsState.stats.totalPings,
  });
});

// 2. Extension State query
app.get('/api/ebs/state', (req, res) => {
  res.json(ebsState);
});

// 3. Broadcaster Configuration endpoints
app.get('/api/ebs/config', (req, res) => {
  res.json({
    status: 'ok',
    config: ebsState.config,
    clientId: TWITCH_EXTENSION_CLIENT_ID || undefined,
    channelId: TWITCH_OWNER_ID || req.headers['client-id'] || '12345678',
  });
});

app.post('/api/ebs/config', (req, res) => {
  const newConfig = req.body;
  if (!newConfig) {
    return res.status(400).json({ error: 'Missing configuration payload' });
  }

  ebsState.config = { ...ebsState.config, ...newConfig };

  // If poll question/options updated, update active poll structure
  if (newConfig.pollQuestion || newConfig.pollOptions) {
    const opts = Array.isArray(newConfig.pollOptions) ? newConfig.pollOptions : ebsState.config.pollOptions;
    ebsState.poll = {
      question: newConfig.pollQuestion || ebsState.poll.question,
      totalVotes: 0,
      options: opts.map((text) => ({ text, votes: 0 })),
    };
  }

  ebsState.stats.totalBroadcasts++;
  console.log('[EBS Config Updated]:', ebsState.config.title);

  res.json({
    status: 'ok',
    message: 'Configuration saved successfully',
    config: ebsState.config,
    poll: ebsState.poll,
  });
});

// 4. Extension Action Handler (Votes, Bits, Alerts)
app.post('/api/ebs/action', (req, res) => {
  const { action, payload, sender } = req.body;
  ebsState.stats.totalActions++;

  console.log(`[EBS Action] ${action} from ${sender || 'client'}:`, payload);

  switch (action) {
    case 'VOTE': {
      const idx = payload?.optionIndex ?? 0;
      if (ebsState.poll.options[idx]) {
        ebsState.poll.options[idx].votes += 1;
        ebsState.poll.totalVotes += 1;
      }
      return res.json({ status: 'ok', poll: ebsState.poll });
    }

    case 'POLL_BOOST': {
      const boost = payload?.boostVotes || 5;
      if (ebsState.poll.options.length > 0) {
        ebsState.poll.options[0].votes += boost;
        ebsState.poll.totalVotes += boost;
      }
      return res.json({ status: 'ok', poll: ebsState.poll });
    }

    case 'BITS_CHEER': {
      const user = payload?.user || 'AnonymousSupporter';
      const amount = payload?.amount || 100;
      const existing = ebsState.leaderboard.find((u) => u.username === user);
      if (existing) {
        existing.score += amount;
      } else {
        ebsState.leaderboard.push({ username: user, score: amount });
      }
      ebsState.leaderboard.sort((a, b) => b.score - a.score);
      return res.json({ status: 'ok', leaderboard: ebsState.leaderboard });
    }

    case 'RESET_POLL_VOTES': {
      const question = payload?.question || ebsState.poll.question;
      const options = payload?.options || ebsState.poll.options.map(o => o.text);
      ebsState.poll = {
        question,
        totalVotes: 0,
        options: options.map(text => ({ text, votes: 0 })),
      };
      return res.json({ status: 'ok', poll: ebsState.poll });
    }

    case 'HYPE_ALERT':
    case 'BROADCASTER_ALERT':
      return res.json({ status: 'ok', message: 'Alert registered and broadcasted' });

    default:
      return res.json({ status: 'ok', message: 'Action processed', ebsState });
  }
});

// 5. PubSub Broadcast Endpoint (Simulating Twitch PubSub API from EBS)
app.post('/api/ebs/pubsub/broadcast', (req, res) => {
  const { target, contentType, message } = req.body;
  ebsState.stats.totalBroadcasts++;
  console.log(`[EBS PubSub Broadcast] Target: ${target || 'all'}, Content:`, message);

  // In production, this would call Twitch Helix PubSub API:
  // POST https://api.twitch.tv/helix/extensions/pubsub
  res.json({
    status: 'broadcast_delivered',
    target: target || 'broadcast',
    timestamp: new Date().toISOString(),
  });
});

// 6. Diagnostics and Stats
app.get('/api/ebs/stats', (req, res) => {
  res.json({
    ...ebsState.stats,
    uptimeSeconds: (Date.now() - serverStartTime) / 1000,
    serverMode: 'HTTPS with node-forge SSL',
  });
});

// -------------------------------------------------------------
// Static Asset Serving for Extension HTML Files
// -------------------------------------------------------------
const publicDir = path.resolve(__dirname, '../public');
const distDir = path.resolve(__dirname, '../dist');

if (fs.existsSync(publicDir)) {
  app.use(express.static(publicDir));
}
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir));
}

// Fallback route
app.get('*', (req, res) => {
  const overlayPath = path.join(publicDir, 'overlay.html');
  if (fs.existsSync(overlayPath)) {
    res.sendFile(overlayPath);
  } else {
    res.send('Twitch Extension EBS Running on HTTPS');
  }
});

// -------------------------------------------------------------
// Start HTTPS Server
// -------------------------------------------------------------
try {
  const sslCerts = ensureSslCertificates();
  const httpsServer = https.createServer(
    {
      key: sslCerts.key,
      cert: sslCerts.cert,
    },
    app
  );

  httpsServer.listen(PORT, HOST, () => {
    console.log('====================================================');
    console.log(`🚀 Twitch Extension EBS HTTPS Server running!`);
    console.log(`🔒 URL: https://localhost:${PORT}`);
    console.log(`📁 Assets served from: ${publicDir}`);
    console.log(`🔑 SSL Key: ${KEY_PATH}`);
    console.log(`📜 SSL Cert: ${CERT_PATH}`);
    console.log('====================================================');
  });
} catch (err) {
  console.error('[EBS Server Error] Failed to start HTTPS server:', err);
}
