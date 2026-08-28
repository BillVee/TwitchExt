# Twitch Extension Backend Service (EBS) & Asset Server

This directory contains the standalone Node.js **Extension Backend Service (EBS)** for testing, developing, and deploying Twitch Extensions.

## Features

- **Automated SSL Certificate & Key Generation**: Uses `node-forge` to automatically generate 2048-bit RSA self-signed certificates with SAN (Subject Alternative Name) for `localhost` and `127.0.0.1`. Checks for `server.key` and `server.cert` in `./ssl` on startup and generates them if missing.
- **HTTPS on localhost:3000**: Complies with Twitch Extension requirement that local assets and EBS endpoints be served over HTTPS.
- **REST Endpoints**:
  - `GET /api/ebs/ping` - Health, uptime, and latency test.
  - `GET /api/ebs/state` - Current global extension state (poll data, leaderboard, broadcaster config).
  - `GET /api/ebs/config` & `POST /api/ebs/config` - Broadcaster settings storage.
  - `POST /api/ebs/action` - Interaction handler (Poll votes, bits cheers, broadcast triggers).
  - `POST /api/ebs/pubsub/broadcast` - Broadcast simulation to connected extension views.
  - `GET /api/ebs/stats` - Server metrics and event counters.
- **Static Asset Serving**: Serves `overlay.html`, `panel.html`, `panel2.html`, `config.html`, and `twitch-ext.js`.

## Setup & Running Locally

1. Install dependencies in root:
   ```bash
   npm install
   ```

2. Configure `.env`:
   ```bash
   cp .env.example .env
   ```
   Add your Twitch Extension Client ID and Secret (from Twitch Developer Console).

3. Start the HTTPS EBS Server:
   ```bash
   node Server/server.js
   ```

4. Open in browser:
   - HTTPS EBS & Views: `https://localhost:3000`
   - Overlay view: `https://localhost:3000/overlay.html`
   - Panel 1 view: `https://localhost:3000/panel.html`
   - Panel 2 view: `https://localhost:3000/panel2.html`
   - Broadcaster Config: `https://localhost:3000/config.html`

*Note on Self-Signed Certificates:* Because `node-forge` creates a self-signed developer certificate, your browser will show a standard certificate warning on the first visit. Click **"Advanced" -> "Proceed to localhost (unsafe)"** to accept the local dev cert.
