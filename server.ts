/**
 * AI Studio Dev & Runtime Server
 * Implements EBS REST APIs, Twitch Extension simulation, and Vite Middleware
 */

import express from 'express';
import path from 'path';
import cors from 'cors';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;
const serverStartTime = Date.now();

// Middleware
app.use(cors());
app.use(express.json());

// In-Memory EBS State for test environment
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

// 1. Health & Ping
app.get('/api/ebs/ping', (req, res) => {
  ebsState.stats.totalPings++;
  const uptimeSeconds = (Date.now() - serverStartTime) / 1000;
  res.json({
    status: 'online',
    serverTime: new Date().toISOString(),
    uptime: uptimeSeconds,
    protocol: req.protocol,
    environment: 'ai-studio-rig',
    pingsReceived: ebsState.stats.totalPings,
  });
});

// 2. Extension State
app.get('/api/ebs/state', (req, res) => {
  res.json(ebsState);
});

// 3. Broadcaster Config
app.get('/api/ebs/config', (req, res) => {
  res.json({
    status: 'ok',
    config: ebsState.config,
    channelId: req.headers['client-id'] || '12345678',
  });
});

app.post('/api/ebs/config', (req, res) => {
  const newConfig = req.body;
  if (!newConfig) {
    return res.status(400).json({ error: 'Missing configuration payload' });
  }

  ebsState.config = { ...ebsState.config, ...newConfig };

  if (newConfig.pollQuestion || newConfig.pollOptions) {
    const opts = Array.isArray(newConfig.pollOptions) ? newConfig.pollOptions : ebsState.config.pollOptions;
    ebsState.poll = {
      question: newConfig.pollQuestion || ebsState.poll.question,
      totalVotes: 0,
      options: opts.map((text: string) => ({ text, votes: 0 })),
    };
  }

  ebsState.stats.totalBroadcasts++;
  res.json({
    status: 'ok',
    message: 'Configuration saved successfully in EBS',
    config: ebsState.config,
    poll: ebsState.poll,
  });
});

// 4. Interactive Actions
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
        options: options.map((text: string) => ({ text, votes: 0 })),
      };
      return res.json({ status: 'ok', poll: ebsState.poll });
    }

    case 'HYPE_ALERT':
    case 'BROADCASTER_ALERT':
      return res.json({ status: 'ok', message: 'Alert registered in EBS' });

    default:
      return res.json({ status: 'ok', message: 'Action processed', ebsState });
  }
});

// 5. PubSub Broadcast
app.post('/api/ebs/pubsub/broadcast', (req, res) => {
  const { target, contentType, message } = req.body;
  ebsState.stats.totalBroadcasts++;
  res.json({
    status: 'broadcast_delivered',
    target: target || 'broadcast',
    timestamp: new Date().toISOString(),
  });
});

// 6. Stats endpoint
app.get('/api/ebs/stats', (req, res) => {
  res.json({
    ...ebsState.stats,
    uptimeSeconds: (Date.now() - serverStartTime) / 1000,
    serverMode: 'HTTP EBS Simulator',
  });
});

// -------------------------------------------------------------
// Vite Middleware / Static Serving
// -------------------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[EBS Server] Running on http://localhost:${PORT}`);
  });
}

startServer();
