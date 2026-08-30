/**
 * Twitch Extension Developer Rig & EBS Test Harness
 * 
 * Layout Structure:
 * - 1st iframe: video_overlay.html (Default) or video_component.html (Switchable Video Overlay / Component View)
 * - 2nd iframe: panel.html (Left side under the overlay)
 * - 3rd iframe: panel2.html (Right side of the 2nd iframe)
 * - 4th iframe: config.html (Bottom of the other 3, taking full width of page)
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { OverlayFrame } from './components/OverlayFrame';
import { PanelFrames } from './components/PanelFrames';
import { ConfigFrame } from './components/ConfigFrame';
import { ServerGuideModal } from './components/ServerGuideModal';
import { EbsErrorBanner } from './components/EbsErrorBanner';
import { AspectRatioPreset, RigAuth, RigContext, VideoViewMode, EbsNetworkError } from './types';
import { Radio, Activity, CheckCircle2, Shield, Sparkles, LayoutTemplate, Monitor } from 'lucide-react';

export default function App() {
  const [aspectRatio, setAspectRatio] = useState<AspectRatioPreset>('16:9 (1080p)');
  const [streamBg, setStreamBg] = useState(true);
  const [refreshKey, setRefreshKey] = useState(Date.now());
  const [isServerModalOpen, setIsServerModalOpen] = useState(false);

  // Default to video_overlay.html, with support for URL query parameter (?view=component or ?view=overlay)
  const [videoMode, setVideoMode] = useState<VideoViewMode>(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const viewParam = params.get('view') || params.get('mode') || params.get('extension');
      if (viewParam === 'component' || viewParam === 'video_component' || viewParam === 'video_component.html') {
        return 'component';
      }
    } catch (e) {}
    return 'overlay';
  });

  // EBS Server Communication Status & Network Error Tracking
  const [ebsOnline, setEbsOnline] = useState<boolean | null>(null);
  const [ebsLatency, setEbsLatency] = useState<number | null>(null);
  const [ebsError, setEbsError] = useState<EbsNetworkError | null>(null);

  // Twitch Mock Context & Auth State
  const [auth, setAuth] = useState<RigAuth>({
    channelId: '12345678',
    clientId: 'mock-twitch-client-id-xyz',
    token: 'mock.jwt.token.twitch_extension_payload',
    userId: '98765432',
    role: 'broadcaster',
    helixToken: 'mock_helix_token',
  });

  const [context, setContext] = useState<RigContext>({
    theme: 'dark',
    mode: 'viewer',
    isFullScreen: false,
    arePlayerControlsVisible: true,
    displayResolution: '1920x1080',
    game: 'Just Chatting',
    language: 'en',
    bitrate: 6000,
    hlsLatencyBroadcaster: 1.8,
  });

  // Check EBS server connectivity and capture granular network error diagnostics
  const checkEbsHealth = useCallback(async () => {
    const targetEndpoint = '/api/ebs/ping';
    const targetUrl = typeof window !== 'undefined' 
      ? new URL(targetEndpoint, window.location.href).href 
      : targetEndpoint;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    try {
      const start = performance.now();
      const res = await fetch(targetEndpoint, {
        signal: controller.signal,
        headers: { 'Accept': 'application/json' },
      });
      clearTimeout(timeoutId);
      const latency = Math.round(performance.now() - start);

      if (res.ok) {
        setEbsOnline(true);
        setEbsLatency(latency);
        setEbsError(null);
      } else {
        setEbsOnline(false);
        setEbsLatency(null);

        const isCors = res.status === 403 || res.status === 401;
        setEbsError({
          category: isCors ? 'cors' : 'http_error',
          title: isCors ? 'CORS / Access Forbidden' : `HTTP Error ${res.status}`,
          message: `EBS endpoint returned status ${res.status} (${res.statusText || 'Error Response'}).`,
          statusCode: res.status,
          statusText: res.statusText,
          targetUrl,
          timestamp: new Date().toLocaleTimeString(),
          suggestion: isCors
            ? 'The EBS server rejected the request. Ensure CORS headers (Access-Control-Allow-Origin: *) and valid JWT authorization headers are configured in ./Server/server.js.'
            : `The server responded with an error status code (${res.status}). Verify your EBS route handlers.`,
        });
      }
    } catch (err: any) {
      clearTimeout(timeoutId);
      setEbsOnline(false);
      setEbsLatency(null);

      const isAbort = err.name === 'AbortError';
      const rawMsg = err?.message || String(err);
      const isTypeError = err.name === 'TypeError' || rawMsg.toLowerCase().includes('failed to fetch') || rawMsg.toLowerCase().includes('networkerror');

      if (isAbort) {
        setEbsError({
          category: 'timeout',
          title: 'EBS Ping Timed Out',
          message: 'The EBS health check request exceeded the 5-second timeout limit without receiving a response.',
          targetUrl,
          timestamp: new Date().toLocaleTimeString(),
          suggestion: 'Check if the backend process is hanging or if a firewall is silently dropping packets.',
        });
      } else if (isTypeError) {
        // Distinguish CORS vs Connection Refused vs Mixed Content
        const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
        const isTargetHttp = targetUrl.startsWith('http://');

        if (isHttps && isTargetHttp) {
          setEbsError({
            category: 'mixed_content',
            title: 'Mixed Content / Insecure HTTP Blocked',
            message: `Browser blocked fetching insecure HTTP endpoint (${targetUrl}) from secure HTTPS origin (${window.location.origin}).`,
            targetUrl,
            timestamp: new Date().toLocaleTimeString(),
            suggestion: 'Use relative proxy path /api/ebs or configure SSL certificate using node-forge in ./Server/server.js.',
          });
        } else {
          // Standard browser network error (connection refused, server down, or missing CORS headers)
          setEbsError({
            category: 'connection_refused',
            title: 'Connection Refused / EBS Offline',
            message: `Failed to connect to EBS at ${targetUrl}. The server may not be running, or CORS headers blocked the response (TypeError: ${rawMsg}).`,
            details: `Underlying browser exception: ${err.name} - ${rawMsg}`,
            targetUrl,
            timestamp: new Date().toLocaleTimeString(),
            suggestion: '1) Verify the EBS backend is running: run "node ./Server/server.js" in your terminal. 2) Ensure Express has "Access-Control-Allow-Origin: *" enabled. 3) If testing local self-signed HTTPS (https://localhost:3000), open the URL in a browser tab to accept the certificate.',
          });
        }
      } else {
        setEbsError({
          category: 'unknown_network',
          title: 'Network Communication Error',
          message: `Could not ping EBS: ${rawMsg}`,
          details: String(err),
          targetUrl,
          timestamp: new Date().toLocaleTimeString(),
          suggestion: 'Check browser console and server terminal logs for additional diagnostic details.',
        });
      }
    }
  }, []);

  useEffect(() => {
    checkEbsHealth();
    const interval = setInterval(checkEbsHealth, 8000);
    return () => clearInterval(interval);
  }, [checkEbsHealth]);

  // Handle postMessage communication bridge between all 4 iframes
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (!event.data || typeof event.data !== 'object') return;
      const { type } = event.data;

      // Broadcast PubSub message from one iframe to all other peer iframes
      if (type === 'TWITCH_PUBSUB_SEND') {
        const { target, contentType, message } = event.data;
        const frames = document.querySelectorAll('iframe');
        frames.forEach((frame) => {
          if (frame.contentWindow && frame.contentWindow !== event.source) {
            frame.contentWindow.postMessage(
              {
                type: 'RIG_PUBSUB_RECEIVE',
                data: { target, contentType, message },
              },
              '*'
            );
          }
        });
      } else if (type === 'TWITCH_CONFIG_SET') {
        const { segment, version, content } = event.data;
        const frames = document.querySelectorAll('iframe');
        frames.forEach((frame) => {
          if (frame.contentWindow && frame.contentWindow !== event.source) {
            frame.contentWindow.postMessage(
              {
                type: 'RIG_UPDATE_CONFIG',
                data: { segment, version, content },
              },
              '*'
            );
          }
        });
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Broadcast Auth & Context changes to all 4 iframes
  useEffect(() => {
    const frames = document.querySelectorAll('iframe');
    frames.forEach((frame) => {
      if (frame.contentWindow) {
        frame.contentWindow.postMessage({ type: 'RIG_UPDATE_AUTH', data: auth }, '*');
      }
    });
  }, [auth]);

  useEffect(() => {
    const frames = document.querySelectorAll('iframe');
    frames.forEach((frame) => {
      if (frame.contentWindow) {
        frame.contentWindow.postMessage({ type: 'RIG_UPDATE_CONTEXT', data: context }, '*');
      }
    });
  }, [context]);

  const handleRefreshAll = () => {
    setRefreshKey(Date.now());
    checkEbsHealth();
  };

  return (
    <div className="min-h-screen bg-[#0E0E10] text-[#EFEFF1] flex flex-col font-sans selection:bg-[#9146FF] selection:text-white">
      
      {/* Top Header & Developer Rig Controls */}
      <Header
        auth={auth}
        setAuth={setAuth}
        context={context}
        setContext={setContext}
        aspectRatio={aspectRatio}
        setAspectRatio={setAspectRatio}
        streamBg={streamBg}
        setStreamBg={setStreamBg}
        ebsOnline={ebsOnline}
        ebsLatency={ebsLatency}
        ebsError={ebsError}
        onRefreshAll={handleRefreshAll}
        onOpenServerModal={() => setIsServerModalOpen(true)}
      />

      {/* Main Responsive Workspace */}
      <main id="rig-main-workspace" className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-5 space-y-4">
        
        {/* EBS Connectivity Failure & CORS / Connection-Refused Diagnostic Banner */}
        {ebsError && (
          <EbsErrorBanner
            error={ebsError}
            onRetry={checkEbsHealth}
            onOpenServerModal={() => setIsServerModalOpen(true)}
          />
        )}

        {/* Quick Info & Rig Status Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-[#18181B] border border-[#2D2D30] rounded-lg px-4 py-2.5 text-xs">
          <div className="flex items-center gap-2 text-[#ADADB8]">
            <Radio className="w-4 h-4 text-[#9146FF] animate-pulse" />
            <span>
              Twitch Rig Active for Channel <strong className="text-[#EFEFF1] font-mono">12345678</strong>
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-[11px] text-[#ADADB8]">
            <button 
              onClick={() => setVideoMode(videoMode === 'overlay' ? 'component' : 'overlay')}
              className="flex items-center gap-1.5 hover:text-[#EFEFF1] transition"
              title="Click to toggle Video Overlay / Video Component"
            >
              <span className={`w-2 h-2 rounded-full ${videoMode === 'overlay' ? 'bg-green-500' : 'bg-[#9146FF]'}`} />
              <span className="font-medium">
                {videoMode === 'overlay' ? 'Overlay: video_overlay.html' : 'Component: video_component.html'}
              </span>
            </button>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#9146FF]" />
              <span>Panel 1 (Left)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-indigo-400" />
              <span>Panel 2 (Right)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span>Config (Bottom Full Width)</span>
            </div>
          </div>
        </div>

        {/* 1st Iframe: video_overlay.html (Default) or video_component.html */}
        <OverlayFrame
          aspectRatio={aspectRatio}
          streamBg={streamBg}
          refreshKey={refreshKey}
          videoMode={videoMode}
          onVideoModeChange={setVideoMode}
        />

        {/* 2nd & 3rd Iframes: Panel.html (Left) and Panel2.html (Right) */}
        <PanelFrames
          refreshKey={refreshKey}
          ebsOnline={ebsOnline}
          ebsError={ebsError}
        />

        {/* 4th Iframe: Config.html (Bottom of other 3, Full Width) */}
        <ConfigFrame
          refreshKey={refreshKey}
        />

      </main>

      {/* Footer matching Design */}
      <footer className="h-8 bg-[#18181B] border-t border-[#2D2D30] flex items-center px-4 sm:px-6 justify-between shrink-0 text-[10px] text-[#ADADB8] font-mono">
        <div className="flex gap-4 items-center">
          <span>Root: <strong className="text-[#EFEFF1]">/TwitchProject</strong></span>
          <span className="hidden sm:inline">Server: <strong className="text-[#EFEFF1]">./Server/server.js</strong></span>
        </div>
        <div className="flex gap-3 items-center">
          <span className="text-green-500 font-bold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block animate-pulse"></span>
            SSL READY
          </span>
          <div className="h-3 w-px bg-[#2D2D30]"></div>
          <span className="hidden sm:inline">Responsive Engine: Active</span>
        </div>
      </footer>

      {/* Documentation & Local HTTPS Setup Modal */}
      <ServerGuideModal
        isOpen={isServerModalOpen}
        onClose={() => setIsServerModalOpen(false)}
      />

    </div>
  );
}
