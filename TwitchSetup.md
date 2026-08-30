# Complete Twitch Extension Setup & Developer Guide

This guide provides an end-to-end walkthrough for designing, building, configuring, and deploying Twitch Extensions across all supported form factors (**Panel**, **Video Overlay**, **Video Component**, and **Mobile**), as well as implementing a secure **Extension Backend Service (EBS)**.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Twitch Developer Console Setup](#2-twitch-developer-console-setup)
3. [Extension Types Deep-Dive](#3-extension-types-deep-dive)
   - [Panel Extension](#panel-extension-panelhtml-panel2html)
   - [Video Overlay Extension](#video-overlay-extension-video_overlayhtml)
   - [Video Component Extension](#video-component-extension-video_componenthtml)
   - [Mobile Extension](#mobile-extension-ios--android)
   - [Broadcaster Configuration Views](#broadcaster-configuration-views-confightml)
4. [Extension Backend Service (EBS)](#4-extension-backend-service-ebs)
   - [What is an EBS & Why is it Required?](#what-is-an-ebs--why-is-it-required)
   - [Core EBS Capabilities](#core-ebs-capabilities)
   - [JWT Authentication & Verification](#jwt-authentication--verification)
   - [Twitch PubSub Broadcasting](#twitch-pubsub-broadcasting)
   - [Twitch Bits In-Extension Transactions](#twitch-bits-in-extension-transactions)
   - [Local HTTPS & SSL Setup (`node-forge`)](#local-https--ssl-setup-node-forge)
   - [CORS Configuration](#cors-configuration)
5. [Testing & Rig Verification](#5-testing--rig-verification)
6. [Submission & Release Workflow](#6-submission--release-workflow)

---

## 1. Architecture Overview

A Twitch Extension consists of two main pillars:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                             Twitch Web / Mobile App                         │
│                                                                             │
│  ┌───────────────────────┐   ┌───────────────────────┐   ┌───────────────┐  │
│  │   Video Overlay /     │   │     Panel View        │   │ Mobile View   │  │
│  │   Video Component     │   │   (Below Stream)      │   │  (iOS/Android)│  │
│  └───────────┬───────────┘   └───────────┬───────────┘   └───────┬───────┘  │
│              │                           │                       │          │
│              └───────────────────┬───────┴───────────────────────┘          │
│                                  │ window.Twitch.ext                        │
│                                  ▼                                          │
│                      Twitch Extension Helper API                            │
│                       (Auth Tokens, Context, PubSub)                        │
└──────────────────────────────────┬──────────────────────────────────────────┘
                                   │
                ┌──────────────────┴──────────────────┐
                │                                     │
                ▼ (HTTP/REST / WebSocket)             ▼ (Twitch PubSub)
 ┌──────────────────────────────┐       ┌──────────────────────────────┐
 │ Extension Backend (EBS)      │       │ Twitch Helix API & PubSub    │
 │ - Validates JWT Tokens       │◀─────▶│ - Send Extension PubSub      │
 │ - Database & Game State      │       │ - Verify Bits Transactions   │
 │ - Signed Broadcaster Actions │       │ - Fetch Channel / User Info  │
 └──────────────────────────────┘       └──────────────────────────────┘
```

1. **Frontend Extension Client**: Static web bundle (`HTML`, `CSS`, `JS`, images) running in a sandboxed iframe inside Twitch.
2. **Extension Backend Service (EBS)**: A secure, server-authoritative backend managed by you that interacts with the frontend and Twitch APIs using your Extension Secret.

---

## 2. Twitch Developer Console Setup

### Step 1: Create an Extension Profile
1. Log into the [Twitch Developer Console](https://dev.twitch.tv/console/extensions).
2. Click **Create Extension**.
3. Choose a descriptive name (e.g., `Stream Companion Interactive`).
4. Select the primary Extension Type (you can enable multiple views in the next step).

### Step 2: Obtain Credentials
Under the **Extension Settings** / **General** tab:
* **Client ID**: The public identifier for your extension.
* **Extension Secret**: A base64-encoded HMAC key used to sign and verify JWT tokens. **NEVER expose this in client-side code.**
* **Owner ID**: The Twitch user ID of the extension creator.

### Step 3: Configure Asset Paths
In **Asset Hosting / Version Settings**, set your viewer file endpoints:

| View Type | Local Testing URL | Hosted CDN Path |
| :--- | :--- | :--- |
| **Video - Full Overlay** | `https://localhost:3000/video_overlay.html` | `video_overlay.html` |
| **Video - Component** | `https://localhost:3000/video_component.html` | `video_component.html` |
| **Panel** | `https://localhost:3000/panel.html` | `panel.html` |
| **Mobile** | `https://localhost:3000/panel.html` | `panel.html` |
| **Config** | `https://localhost:3000/config.html` | `config.html` |
| **Live Config** | `https://localhost:3000/config.html` | `config.html` |

---

## 3. Extension Types Deep-Dive

Twitch allows an extension to support one or more of the following display slots:

---

### Panel Extension (`panel.html`, `panel2.html`)

**Placement**: Displayed beneath the live broadcast player in the channel’s information section alongside Twitch panels.

* **Dimensions**:
  * **Width**: Fixed at **318px**.
  * **Height**: Configurable from **100px to 500px** (set in Twitch Developer Console).
* **Key Characteristics**:
  * Persistent — visible even when the streamer is offline.
  * Ideal for asynchronous viewer interaction, leaderboards, stats, polls, social links, and donation goals.
* **Twitch Configuration**:
  * Set **Viewer Path** to `panel.html`.
  * Specify **Panel Height** in pixels (e.g., `500`).
* **Implementation Checklist**:
  ```html
  <!-- Include Twitch Extension Helper -->
  <script src="https://extension-files.twitch.tv/helper/v1/twitch-ext.min.js"></script>
  ```
  ```javascript
  window.Twitch.ext.onAuthorized((auth) => {
    console.log('Panel Authorized:', auth.channelId, auth.userId);
  });
  ```

---

### Video Overlay Extension (`video_overlay.html`)

**Placement**: Rendered directly over the entire video canvas (100% width and 100% height) on top of the live video stream.

* **Dimensions**:
  * **Width & Height**: Dynamically matches the viewer's player aspect ratio (e.g., 16:9, 1080p, 720p, 4:3).
* **Key Characteristics**:
  * Only one Video Overlay extension can be active on a channel at a time.
  * Default body background must be transparent (`background: transparent;`).
  * Only interactive UI elements should capture pointer events (`pointer-events: auto`); passive video areas should allow clicks through to Twitch controls (`pointer-events: none`).
  * Supports hiding/showing based on mouse hover or minimize controls.
* **Best Use Cases**:
  * Real-time game HUD stats (e.g., live health bars, inventory, minimap markers).
  * Interactive click-to-play mini-games (e.g., soundboards, target clicking).
  * Live alert animations and on-screen fireworks triggered by Bits cheers.
* **Code Best Practice for Transparency & Pointer Events**:
  ```css
  html, body {
    margin: 0;
    padding: 0;
    width: 100%;
    height: 100%;
    background: transparent;
    overflow: hidden;
    pointer-events: none; /* Allow clicks through to video */
  }

  .interactive-widget {
    pointer-events: auto; /* Re-enable clicks on interactive buttons */
  }
  ```

---

### Video Component Extension (`video_component.html`)

**Placement**: Rendered as a bounded, dockable window directly on the video player (occupying a sub-region rather than the entire video screen).

* **Dimensions & Behavior**:
  * Configurable aspect ratio and bounding box (e.g., docked on the right side or bottom-left).
  * Multiple Video Component extensions can be active simultaneously (up to 2).
  * Viewers can minimize, expand, or reposition the component dock.
* **Best Use Cases**:
  * Stream Companion widgets (e.g., live deck tracker in card games, live poll voting dock, stream schedule).
  * Interactive Bits cheering stations that don't obscure central gameplay.
* **Twitch Configuration**:
  * Set **Viewer Path** to `video_component.html`.
  * Set target aspect ratio and sizing bounds.
* **Handling Minimize / Expand States**:
  ```javascript
  window.Twitch.ext.onContext((context, delta) => {
    if (delta.includes('displayResolution')) {
      console.log('Player size changed:', context.displayResolution);
    }
  });
  ```

---

### Mobile Extension (iOS & Android)

**Placement**: Runs inside the native Twitch Mobile App (iOS and Android) when viewers watch on phones or tablets.

* **Display Formats**:
  * **Mobile Panel**: Displays as a tab beneath the mobile video player.
  * **Mobile Video Overlay**: Overlays the mobile video feed when the viewer taps the extension icon.
* **Mobile-Specific Guidelines**:
  1. **Touch Targets**: All buttons, inputs, and interactive icons must be at least **44px × 44px** for touch accessibility.
  2. **Viewport Meta Tag**:
     ```html
     <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
     ```
  3. **No Popups / `window.open`**: The Twitch mobile webview restricts external tab openings. Use Twitch Helper methods (e.g., `window.Twitch.ext.actions.openTwitchLink`) if opening Twitch channel pages.
  4. **Low Bandwidth & Cellular Latency**: Mobile viewers frequently experience jitter. Keep payload sizes small (<150KB initial load) and handle network timeouts gracefully.

---

### Broadcaster Configuration Views (`config.html`)

Twitch provides dedicated configuration views for streamers:
1. **Broadcaster Config (`config.html`)**:
   - Accessed via the streamer's **Extension Manager Dashboard**.
   - Used for setting up API keys, selecting theme colors, configuring poll questions, and linking third-party accounts.
2. **Live Dashboard Component (`live_config.html`)**:
   - Streamer's quick control panel accessible directly in the Twitch Live Streamer Dashboard during broadcasts.

---

## 4. Extension Backend Service (EBS)

### What is an EBS & Why is it Required?

The frontend extension runs in untrusted viewer browsers. An **Extension Backend Service (EBS)** is an external, server-authoritative web server that:
1. **Protects Secrets**: Your Twitch Extension Secret and third-party API credentials stay hidden on your server.
2. **Prevents Tampering**: Prevents malicious viewers from sending fabricated votes, modifying leaderboards, or faking Bits cheers.
3. **Coordinates Real-Time State**: Keeps all extension clients synchronized via Twitch PubSub.

---

### Core EBS Capabilities

| Capability | Description | Twitch API / Technology |
| :--- | :--- | :--- |
| **Viewer Authentication** | Decodes and verifies the viewer's JWT payload sent in the `Authorization` header. | `jsonwebtoken` (HMAC SHA-256 with base64 secret) |
| **PubSub Broadcasting** | Broadcasts live game updates, poll results, or alerts to all watching extension instances. | `POST https://api.twitch.tv/helix/extensions/pubsub` |
| **Bits Entitlements** | Verifies Bits transactions server-side before awarding digital items. | Twitch Bits JWT Transaction Webhooks / Helix |
| **Configuration Storage** | Saves streamer preferences and persistent database state. | Helix Configuration Service or custom PostgreSQL/MongoDB |

---

### JWT Authentication & Verification

When an extension view loads, `window.Twitch.ext.onAuthorized` delivers a JSON Web Token (JWT). The frontend must attach this token as a Bearer token when making requests to your EBS:

#### Frontend Request:
```javascript
window.Twitch.ext.onAuthorized((auth) => {
  fetch('https://your-ebs.com/api/ebs/action', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${auth.token}`,
      'Client-Id': auth.clientId,
    },
    body: JSON.stringify({ action: 'cast_vote', optionId: 1 }),
  });
});
```

#### EBS Backend Verification (Node.js / Express):
```javascript
const express = require('express');
const jwt = require('jsonwebtoken');

const app = express();
app.use(express.json());

// Decode the Base64 Twitch Extension Secret
const EXT_SECRET = Buffer.from(process.env.TWITCH_EXTENSION_SECRET, 'base64');

// Middleware to verify Twitch Extension JWT
function verifyTwitchJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or malformed Authorization header' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = jwt.verify(token, EXT_SECRET, { algorithms: ['HS256'] });
    req.twitchAuth = payload; // Contains channel_id, user_id, role ('broadcaster' | 'viewer')
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid JWT signature or expired token', details: err.message });
  }
}

app.post('/api/ebs/action', verifyTwitchJWT, (req, res) => {
  const { channel_id, user_id, role } = req.twitchAuth;
  const { action, optionId } = req.body;

  console.log(`Action from user ${user_id} on channel ${channel_id} (Role: ${role}):`, action);
  res.json({ success: true, message: 'Action processed successfully' });
});
```

---

### Twitch PubSub Broadcasting

To push messages from your EBS to all extension viewers without running your own WebSocket cluster, use the **Twitch Extension PubSub API**:

```javascript
const axios = require('axios');
const jwt = require('jsonwebtoken');

async function sendPubSubMessage(channelId, messagePayload) {
  const EXT_SECRET = Buffer.from(process.env.TWITCH_EXTENSION_SECRET, 'base64');
  const CLIENT_ID = process.env.TWITCH_EXTENSION_CLIENT_ID;
  const OWNER_ID = process.env.TWITCH_OWNER_ID;

  // Create a server-signed JWT with pubsub permissions
  const serverJwt = jwt.sign(
    {
      exp: Math.floor(Date.now() / 1000) + 60, // 1 minute expiration
      user_id: OWNER_ID,
      role: 'external',
      channel_id: channelId,
      pubsub_perms: {
        send: ['broadcast'],
      },
    },
    EXT_SECRET,
    { algorithm: 'HS256' }
  );

  const response = await axios.post(
    'https://api.twitch.tv/helix/extensions/pubsub',
    {
      target: ['broadcast'],
      broadcaster_id: channelId,
      is_global_broadcast: false,
      message: JSON.stringify(messagePayload),
    },
    {
      headers: {
        'Client-Id': CLIENT_ID,
        'Authorization': `Bearer ${serverJwt}`,
        'Content-Type': 'application/json',
      },
    }
  );

  return response.data;
}
```

#### Listening to PubSub in Frontend:
```javascript
window.Twitch.ext.listen('broadcast', (target, contentType, message) => {
  const data = JSON.parse(message);
  console.log('Received live broadcast event:', data);
});
```

---

### Twitch Bits In-Extension Transactions

1. **Configure Bits Products** in the Twitch Developer Console (Product SKU, Name, Amount in Bits).
2. **Client-Side Trigger**:
   ```javascript
   window.Twitch.ext.bits.useBits('fireworks_100');
   ```
3. **Transaction Complete Callback**:
   ```javascript
   window.Twitch.ext.bits.onTransactionComplete((transaction) => {
     // Send transaction.transactionReceipt JWT to EBS for server-side validation
     fetch('/api/ebs/bits/verify', {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({ receipt: transaction.transactionReceipt }),
     });
   });
   ```

---

### Local HTTPS & SSL Setup (`node-forge`)

Twitch strictly requires **HTTPS** for all Extension assets and EBS endpoints, even when testing locally on `localhost`.

To generate self-signed certificates dynamically in Node.js without needing external OpenSSL binaries:

```javascript
const forge = require('node-forge');
const fs = require('fs');
const https = require('https');

function getOrGenerateSSLCert() {
  const pki = forge.pki;
  const keys = pki.rsa.generateKeyPair(2048);
  const cert = pki.createCertificate();

  cert.publicKey = keys.publicKey;
  cert.serialNumber = '01' + Date.now().toString(16);
  cert.validity.notBefore = new Date();
  cert.validity.notAfter = new Date();
  cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 1);

  const attrs = [{ name: 'commonName', value: 'localhost' }];
  cert.setSubject(attrs);
  cert.setIssuer(attrs);

  cert.setExtensions([
    { name: 'basicConstraints', cA: true },
    {
      name: 'subjectAltName',
      altNames: [
        { type: 2, value: 'localhost' },
        { type: 7, ip: '127.0.0.1' },
        { type: 7, ip: '::1' },
      ],
    },
  ]);

  cert.sign(keys.privateKey, forge.md.sha256.create());

  return {
    key: pki.privateKeyToPem(keys.privateKey),
    cert: pki.certificateToPem(cert),
  };
}

// Start HTTPS Server
const { key, cert } = getOrGenerateSSLCert();
const server = https.createServer({ key, cert }, app);
server.listen(3000, '0.0.0.0', () => {
  console.log('Twitch EBS running on https://localhost:3000');
});
```

> **Local Certificate Trust**: When testing `https://localhost:3000` for the first time, open `https://localhost:3000` directly in a browser tab and click **Advanced -> Proceed to localhost (unsafe)** to accept the self-signed certificate.

---

### CORS Configuration

Because Twitch Extension iframes execute from Twitch's hosted domain (`https://*.ext-twitch.tv`), your EBS must return proper Cross-Origin headers:

```javascript
app.use((req, res, next) => {
  // Allow requests from Twitch extension CDN domains and localhost
  res.header('Access-Control-Allow-Origin', '*');
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization, Client-Id'
  );
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');

  // Handle preflight OPTIONS requests immediately
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});
```

---

## 5. Testing & Rig Verification

### Using the Twitch Developer Rig & Local Test Harness
1. **Run Dev Server / EBS**:
   ```bash
   node ./Server/server.js
   # Or npm run dev
   ```
2. **Verify All 4 Slots**:
   - **Video Overlay**: Check transparency and responsive scaling (`16:9`, `4:3`).
   - **Video Component**: Test minimize/expand docking states.
   - **Panel 1 & Panel 2**: Check Twitch fixed width (318px) and height bounding (100px - 500px).
   - **Broadcaster Config**: Ensure settings changes persist to EBS.
3. **Simulate Twitch Context**:
   - Toggle theme (`dark` / `light`).
   - Toggle channel broadcaster permissions (`viewer` vs `broadcaster`).

---

## 6. Submission & Release Workflow

### Step 1: Hosted Testing
1. Package your frontend directory (`public/` or `dist/`) into a `.zip` file containing `video_overlay.html`, `video_component.html`, `panel.html`, `config.html`, and `twitch-ext.js`.
2. In the Twitch Developer Console, upload the zip under **Files** -> **Upload Extension Assets**.
3. Move status to **Hosted Test**. Add whitelist Twitch channel usernames to test live on actual Twitch streams.

### Step 2: Security & Review Checklist
* [ ] No hardcoded secrets, API tokens, or `TWITCH_EXTENSION_SECRET` in frontend bundle.
* [ ] All asset links use HTTPS or relative paths.
* [ ] Video Overlay background is fully transparent (`background: transparent;`).
* [ ] Extension bundle size is under 20 MB.
* [ ] All EBS endpoints use valid SSL certificates and enforce JWT verification.
* [ ] Clear installation instructions provided for Twitch Reviewers.

### Step 3: Submit for Review
Click **Submit for Review**. Twitch review typically takes 1–3 business days. Once approved, click **Release Version** to make the extension publicly discoverable in the Twitch Extension Store.
