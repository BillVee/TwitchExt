/**
 * Twitch Extension Helper (Mock / Bridge)
 * Simulates Twitch's official `https://extension-files.twitch.tv/helper/v1/twitch-ext.min.js`
 * Automatically detects whether it's running inside the Dev Rig or against a live EBS.
 */
(function () {
  'use strict';

  // In-memory mock extension context & auth
  const listeners = {
    authorized: [],
    context: [],
    visibilityChanged: [],
    highlightChanged: [],
    positionChanged: [],
    configChanged: [],
    pubsub: new Map(),
  };

  let currentAuth = {
    channelId: '12345678',
    clientId: 'mock-twitch-client-id-xyz',
    token: 'mock.jwt.token.twitch_extension_payload',
    userId: '98765432',
    role: 'viewer',
    helixToken: 'mock_helix_token',
  };

  let currentContext = {
    theme: 'dark',
    mode: 'viewer',
    isFullScreen: false,
    arePlayerControlsVisible: true,
    displayResolution: '1920x1080',
    game: 'Just Chatting',
    language: 'en',
    bitrate: 6000,
    hlsLatencyBroadcaster: 1.8,
  };

  let currentConfig = {
    broadcaster: {
      version: '1.0.0',
      content: JSON.stringify({
        title: 'Community Interactive Hub',
        accentColor: '#9146FF',
        showOverlayBanner: true,
        welcomeMessage: 'Welcome to the stream! Click around to interact.',
        pollActive: true,
        pollQuestion: 'Which game should we play next?',
        pollOptions: ['Cyberpunk 2077', 'Valorant', 'Minecraft', 'Elden Ring'],
      }),
    },
    developer: null,
    global: null,
  };

  // Determine EBS URL based on current host
  const getEbsBaseUrl = () => {
    // If running in browser or iframe, default to relative /api/ebs
    return '/api/ebs';
  };

  const TwitchExt = {
    version: '1.0.0-mock-rig',
    environment: 'development',

    // --- Authentication & Initialization ---
    onAuthorized: function (callback) {
      if (typeof callback === 'function') {
        listeners.authorized.push(callback);
        // Invoke immediately with current mock auth
        setTimeout(() => callback(currentAuth), 10);
      }
    },

    onContext: function (callback) {
      if (typeof callback === 'function') {
        listeners.context.push(callback);
        // Invoke immediately with current context
        setTimeout(() => callback(currentContext, Object.keys(currentContext)), 10);
      }
    },

    onVisibilityChanged: function (callback) {
      if (typeof callback === 'function') {
        listeners.visibilityChanged.push(callback);
      }
    },

    onHighlightChanged: function (callback) {
      if (typeof callback === 'function') {
        listeners.highlightChanged.push(callback);
      }
    },

    onPositionChanged: function (callback) {
      if (typeof callback === 'function') {
        listeners.positionChanged.push(callback);
      }
    },

    // --- Configuration Service ---
    configuration: {
      broadcaster: currentConfig.broadcaster,
      developer: currentConfig.developer,
      global: currentConfig.global,
      onChanged: function (callback) {
        if (typeof callback === 'function') {
          listeners.configChanged.push(callback);
          setTimeout(() => callback(), 10);
        }
      },
      set: function (segment, version, content) {
        if (['broadcaster', 'developer', 'global'].includes(segment)) {
          currentConfig[segment] = { version, content };
          TwitchExt.configuration[segment] = currentConfig[segment];
          // Notify parent rig if inside iframe
          window.parent.postMessage({
            type: 'TWITCH_CONFIG_SET',
            segment,
            version,
            content,
          }, '*');
          // Dispatch local listeners
          listeners.configChanged.forEach(fn => {
            try { fn(); } catch (e) { console.error(e); }
          });
        }
      },
    },

    // --- PubSub Simulation ---
    listen: function (target, callback) {
      if (!listeners.pubsub.has(target)) {
        listeners.pubsub.set(target, []);
      }
      listeners.pubsub.get(target).push(callback);
    },

    unlisten: function (target, callback) {
      if (listeners.pubsub.has(target)) {
        const list = listeners.pubsub.get(target).filter(cb => cb !== callback);
        listeners.pubsub.set(target, list);
      }
    },

    send: function (target, contentType, message) {
      // Send message to EBS and notify other views
      const payload = typeof message === 'string' ? message : JSON.stringify(message);
      
      // Post to parent window to broadcast to peer iframes
      window.parent.postMessage({
        type: 'TWITCH_PUBSUB_SEND',
        target,
        contentType,
        message: payload,
      }, '*');

      // Also call EBS PubSub endpoint
      fetch(`${getEbsBaseUrl()}/pubsub/broadcast`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentAuth.token}`,
          'Client-Id': currentAuth.clientId,
        },
        body: JSON.stringify({
          target,
          contentType,
          message: payload,
          sender: window.location.pathname,
        }),
      }).catch(err => {
        console.warn('[TwitchExt Mock] EBS PubSub send error:', err);
      });
    },

    // --- Actions & Helpers ---
    actions: {
      requestIdShare: function () {
        console.log('[TwitchExt Mock] actions.requestIdShare invoked');
        window.parent.postMessage({ type: 'TWITCH_ACTION', action: 'requestIdShare' }, '*');
      },
      minimize: function () {
        console.log('[TwitchExt Mock] actions.minimize invoked');
      },
      onFollow: function (callback) {
        console.log('[TwitchExt Mock] actions.onFollow registered');
      },
    },

    bits: {
      getProducts: async function () {
        return [
          { sku: 'bits_hype_100', cost: { amount: 100, type: 'bits' }, displayName: 'Stream Fireworks', inDevelopment: true },
          { sku: 'bits_poll_boost_50', cost: { amount: 50, type: 'bits' }, displayName: 'Vote Booster x5', inDevelopment: true },
          { sku: 'bits_vip_badge_500', cost: { amount: 500, type: 'bits' }, displayName: 'Temporary Gold VIP', inDevelopment: true },
        ];
      },
      useBits: function (sku) {
        console.log('[TwitchExt Mock] bits.useBits called with SKU:', sku);
        window.parent.postMessage({ type: 'TWITCH_USE_BITS', sku }, '*');
      },
      showBitsBalance: function () {
        console.log('[TwitchExt Mock] bits.showBitsBalance invoked');
      },
      onTransactionComplete: function (callback) {
        console.log('[TwitchExt Mock] bits.onTransactionComplete registered');
      },
      onTransactionCancelled: function (callback) {
        console.log('[TwitchExt Mock] bits.onTransactionCancelled registered');
      },
    },

    // --- Custom EBS Helper to easily talk with server.js / server.ts ---
    ebs: {
      getBaseUrl: getEbsBaseUrl,
      
      ping: async function () {
        const start = performance.now();
        const res = await fetch(`${getEbsBaseUrl()}/ping`);
        const latency = Math.round(performance.now() - start);
        const data = await res.json();
        return { ...data, latencyMs: latency };
      },

      getConfig: async function () {
        const res = await fetch(`${getEbsBaseUrl()}/config`, {
          headers: {
            'Authorization': `Bearer ${currentAuth.token}`,
            'Client-Id': currentAuth.clientId,
          },
        });
        return await res.json();
      },

      saveConfig: async function (configData) {
        const res = await fetch(`${getEbsBaseUrl()}/config`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${currentAuth.token}`,
            'Client-Id': currentAuth.clientId,
          },
          body: JSON.stringify(configData),
        });
        return await res.json();
      },

      getState: async function () {
        const res = await fetch(`${getEbsBaseUrl()}/state`);
        return await res.json();
      },

      sendAction: async function (actionType, payload = {}) {
        const res = await fetch(`${getEbsBaseUrl()}/action`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${currentAuth.token}`,
            'Client-Id': currentAuth.clientId,
          },
          body: JSON.stringify({
            action: actionType,
            payload,
            sender: window.location.pathname,
          }),
        });
        return await res.json();
      },
    },
  };

  // Listen to messages from the parent test harness (Rig)
  window.addEventListener('message', function (event) {
    if (!event.data || typeof event.data !== 'object') return;
    const { type, data } = event.data;

    if (type === 'RIG_UPDATE_AUTH') {
      currentAuth = { ...currentAuth, ...data };
      listeners.authorized.forEach(fn => fn(currentAuth));
    } else if (type === 'RIG_UPDATE_CONTEXT') {
      currentContext = { ...currentContext, ...data };
      listeners.context.forEach(fn => fn(currentContext, Object.keys(data)));
    } else if (type === 'RIG_PUBSUB_RECEIVE') {
      const { target, contentType, message } = data;
      // Match exact target or wildcard broadcast
      ['broadcast', target, '*'].forEach(t => {
        if (listeners.pubsub.has(t)) {
          listeners.pubsub.get(t).forEach(fn => {
            try { fn(target, contentType, message); } catch (e) { console.error(e); }
          });
        }
      });
    } else if (type === 'RIG_UPDATE_CONFIG') {
      currentConfig.broadcaster = { version: data.version || '1.0.0', content: JSON.stringify(data.content || data) };
      TwitchExt.configuration.broadcaster = currentConfig.broadcaster;
      listeners.configChanged.forEach(fn => fn());
    }
  });

  // Expose to window
  window.Twitch = window.Twitch || {};
  window.Twitch.ext = TwitchExt;

  console.log('[TwitchExt Mock] Loaded Twitch Extension Helper Bridge.');
})();
