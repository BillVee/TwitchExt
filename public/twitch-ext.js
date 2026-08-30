/**
 * Twitch Extension Helper (Mock / Bridge & EBS Client)
 * Compatible with Twitch's official `https://extension-files.twitch.tv/helper/v1/twitch-ext.min.js`
 * Automatically provides EBS communication helpers and dev rig bridging.
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
    role: 'broadcaster',
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

  // Determine EBS URL based on current host and query parameters
  const getEbsBaseUrl = () => {
    try {
      const params = new URLSearchParams(window.location.search);
      const custom = params.get('ebs') || params.get('ebsUrl') || params.get('backend');
      if (custom) return custom.replace(/\/$/, '');
      const port = params.get('ebsPort') || params.get('port');
      if (port) {
        return `${window.location.protocol}//${window.location.hostname}:${port}/api/ebs`;
      }
      if (typeof window.TWITCH_EBS_URL === 'string') {
        return window.TWITCH_EBS_URL.replace(/\/$/, '');
      }
      if (typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem('TWITCH_EBS_URL');
        if (stored) return stored.replace(/\/$/, '');
      }
    } catch (e) {}
    return '/api/ebs';
  };

  // EBS API Client
  const ebsClient = {
    getBaseUrl: getEbsBaseUrl,
    
    ping: async function () {
      const start = performance.now();
      const res = await fetch(`${getEbsBaseUrl()}/ping`);
      const latency = Math.round(performance.now() - start);
      if (!res.ok) {
        throw new Error(`EBS Ping failed: HTTP ${res.status}`);
      }
      const data = await res.json();
      return { ...data, latencyMs: latency, uptime: data.uptime || data.uptimeSeconds || 0 };
    },

    getConfig: async function () {
      const res = await fetch(`${getEbsBaseUrl()}/config`, {
        headers: {
          'Authorization': `Bearer ${currentAuth.token}`,
          'Client-Id': currentAuth.clientId,
        },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    },

    fetchConfig: async function () {
      return this.getConfig();
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
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    },

    getState: async function () {
      const res = await fetch(`${getEbsBaseUrl()}/state`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
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
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    },
  };

  const TwitchExtMock = {
    version: '1.0.0-mock-rig',
    environment: 'development',

    // --- Authentication & Initialization ---
    onAuthorized: function (callback) {
      if (typeof callback === 'function') {
        listeners.authorized.push(callback);
        setTimeout(() => {
          try { callback(currentAuth); } catch (e) { console.error(e); }
        }, 10);
      }
    },

    onContext: function (callback) {
      if (typeof callback === 'function') {
        listeners.context.push(callback);
        setTimeout(() => {
          try { callback(currentContext, Object.keys(currentContext)); } catch (e) { console.error(e); }
        }, 10);
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
          setTimeout(() => {
            try { callback(); } catch (e) { console.error(e); }
          }, 10);
        }
      },
      set: function (segment, version, content) {
        if (['broadcaster', 'developer', 'global'].includes(segment)) {
          currentConfig[segment] = { version, content };
          if (window.Twitch && window.Twitch.ext && window.Twitch.ext.configuration) {
            window.Twitch.ext.configuration[segment] = currentConfig[segment];
          }
          window.parent.postMessage({
            type: 'TWITCH_CONFIG_SET',
            segment,
            version,
            content,
          }, '*');
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
      const payload = typeof message === 'string' ? message : JSON.stringify(message);
      
      window.parent.postMessage({
        type: 'TWITCH_PUBSUB_SEND',
        target,
        contentType,
        message: payload,
      }, '*');

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

    actions: {
      requestIdShare: function () {
        window.parent.postMessage({ type: 'TWITCH_ACTION', action: 'requestIdShare' }, '*');
      },
      minimize: function () {
        console.log('[TwitchExt Mock] actions.minimize invoked');
      },
      onFollow: function () {
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
        window.parent.postMessage({ type: 'TWITCH_USE_BITS', sku }, '*');
      },
      showBitsBalance: function () {
        console.log('[TwitchExt Mock] bits.showBitsBalance invoked');
      },
      onTransactionComplete: function () {},
      onTransactionCancelled: function () {},
    },

    ebs: ebsClient,
  };

  // Listen to messages from the parent test harness (Rig)
  window.addEventListener('message', function (event) {
    if (!event.data || typeof event.data !== 'object') return;
    const { type, data } = event.data;

    if (type === 'RIG_UPDATE_AUTH') {
      currentAuth = { ...currentAuth, ...data };
      listeners.authorized.forEach(fn => {
        try { fn(currentAuth); } catch (e) { console.error(e); }
      });
    } else if (type === 'RIG_UPDATE_CONTEXT') {
      currentContext = { ...currentContext, ...data };
      listeners.context.forEach(fn => {
        try { fn(currentContext, Object.keys(data)); } catch (e) { console.error(e); }
      });
    } else if (type === 'RIG_PUBSUB_RECEIVE') {
      const { target, contentType, message } = data;
      ['broadcast', target, '*'].forEach(t => {
        if (listeners.pubsub.has(t)) {
          listeners.pubsub.get(t).forEach(fn => {
            try { fn(target, contentType, message); } catch (e) { console.error(e); }
          });
        }
      });
    } else if (type === 'RIG_UPDATE_CONFIG') {
      currentConfig.broadcaster = { version: data.version || '1.0.0', content: JSON.stringify(data.content || data) };
      if (window.Twitch && window.Twitch.ext && window.Twitch.ext.configuration) {
        window.Twitch.ext.configuration.broadcaster = currentConfig.broadcaster;
      }
      listeners.configChanged.forEach(fn => {
        try { fn(); } catch (e) { console.error(e); }
      });
    }
  });

  // Attach to window.Twitch
  window.Twitch = window.Twitch || {};
  
  if (!window.Twitch.ext) {
    window.Twitch.ext = TwitchExtMock;
    console.log('[TwitchExt Bridge] Initialized standalone Twitch Extension Helper Mock.');
  } else {
    // If official Twitch ext helper already initialized, augment it with EBS and Rig support
    const officialExt = window.Twitch.ext;
    
    // Always provide EBS helper
    officialExt.ebs = ebsClient;

    // Wrap onAuthorized to ensure local callbacks fire in dev mode / test rig
    const origOnAuthorized = officialExt.onAuthorized?.bind(officialExt);
    officialExt.onAuthorized = function (callback) {
      if (typeof callback === 'function') {
        listeners.authorized.push(callback);
        if (origOnAuthorized) {
          try { origOnAuthorized(callback); } catch (e) {}
        }
        // Also trigger with mock auth in case outside live Twitch iframe
        setTimeout(() => {
          try { callback(currentAuth); } catch (e) { console.error(e); }
        }, 10);
      }
    };

    // Ensure configuration onChanged & broadcaster object exist
    if (!officialExt.configuration) {
      officialExt.configuration = TwitchExtMock.configuration;
    } else {
      if (!officialExt.configuration.broadcaster) {
        officialExt.configuration.broadcaster = currentConfig.broadcaster;
      }
      const origOnChanged = officialExt.configuration.onChanged?.bind(officialExt.configuration);
      officialExt.configuration.onChanged = function (callback) {
        if (typeof callback === 'function') {
          listeners.configChanged.push(callback);
          if (origOnChanged) {
            try { origOnChanged(callback); } catch (e) {}
          }
          setTimeout(() => {
            try { callback(); } catch (e) { console.error(e); }
          }, 10);
        }
      };
    }

    // Ensure listen & send fallback
    const origListen = officialExt.listen?.bind(officialExt);
    officialExt.listen = function (target, callback) {
      if (origListen) {
        try { origListen(target, callback); } catch (e) {}
      }
      TwitchExtMock.listen(target, callback);
    };

    const origSend = officialExt.send?.bind(officialExt);
    officialExt.send = function (target, contentType, message) {
      if (origSend) {
        try { origSend(target, contentType, message); } catch (e) {}
      }
      TwitchExtMock.send(target, contentType, message);
    };

    // Ensure actions & bits exist
    if (!officialExt.actions) officialExt.actions = TwitchExtMock.actions;
    if (!officialExt.bits) officialExt.bits = TwitchExtMock.bits;

    console.log('[TwitchExt Bridge] Augmented official Twitch Extension Helper with EBS & Dev Rig hooks.');
  }

  // Also expose EBS helper directly on window for direct access if desired
  window.EBS = ebsClient;
})();

