import React, { useRef } from 'react';
import { AspectRatioPreset } from '../types';
import { ExternalLink, RefreshCw, Layers, Monitor } from 'lucide-react';

interface OverlayFrameProps {
  aspectRatio: AspectRatioPreset;
  streamBg: boolean;
  refreshKey: number;
}

export const OverlayFrame: React.FC<OverlayFrameProps> = ({
  aspectRatio,
  streamBg,
  refreshKey,
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const handleReload = () => {
    if (iframeRef.current) {
      iframeRef.current.src = `/overlay.html?t=${Date.now()}`;
    }
  };

  // Determine container aspect ratio / height classes
  const getAspectClass = () => {
    switch (aspectRatio) {
      case '16:9 (1080p)':
      case '16:9 (720p)':
        return 'aspect-video w-full max-h-[460px]';
      case '4:3 (Classic)':
        return 'aspect-[4/3] w-full max-w-2xl mx-auto max-h-[460px]';
      case '21:9 (Ultrawide)':
        return 'aspect-[21/9] w-full max-h-[420px]';
      case 'Fluid':
      default:
        return 'h-[360px] sm:h-[420px] w-full';
    }
  };

  return (
    <section id="section-overlay-iframe" className="w-full bg-[#18181B] border border-[#2D2D30] rounded-lg overflow-hidden shadow-xl">
      
      {/* Frame Header Bar */}
      <div className="flex items-center justify-between px-3.5 py-2 bg-[#18181B] border-b border-[#2D2D30] text-xs">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500 shadow-sm" />
          <span className="font-semibold text-[#EFEFF1] flex items-center gap-1.5">
            <Monitor className="w-3.5 h-3.5 text-[#9146FF]" />
            Overlay View
          </span>
          <span className="px-2 py-0.5 bg-black/60 rounded text-[10px] uppercase font-bold tracking-widest text-[#ADADB8] border border-white/10">
            overlay.html
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="hidden sm:inline text-[11px] font-mono text-[#ADADB8] bg-[#1F1F23] px-2 py-0.5 rounded border border-[#2D2D30]">
            {aspectRatio}
          </span>
          <button
            onClick={handleReload}
            className="p-1 text-[#ADADB8] hover:text-[#EFEFF1] rounded hover:bg-[#1F1F23] transition"
            title="Reload Overlay Iframe"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <a
            href="/overlay.html"
            target="_blank"
            rel="noreferrer"
            className="p-1 text-[#ADADB8] hover:text-[#EFEFF1] rounded hover:bg-[#1F1F23] transition"
            title="Open overlay.html in new tab"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Frame Container with simulated video stream background */}
      <div className="relative w-full flex items-center justify-center p-2.5 sm:p-3.5 bg-[#0E0E10]">
        <div className={`relative rounded-lg overflow-hidden border border-[#2D2D30] shadow-2xl transition-all duration-300 ${getAspectClass()}`}>
          
          {/* Stream Background Simulation */}
          {streamBg ? (
            <div className="absolute inset-0 bg-gradient-to-tr from-[#0E0E10] via-[#1f1633] to-[#141221] flex flex-col justify-between p-4 pointer-events-none select-none">
              <div className="flex items-center justify-between opacity-50">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-[10px] font-bold tracking-wider text-red-400 uppercase">LIVE 1080p 60fps</span>
                </div>
                <span className="text-[10px] font-mono text-[#ADADB8]">Twitch Broadcast Simulation</span>
              </div>
              <div className="text-center opacity-30">
                <div className="text-4xl sm:text-5xl font-black text-[#EFEFF1]/25 tracking-tight">GAMEPLAY CANVAS</div>
                <div className="text-xs text-[#ADADB8] font-mono mt-1">Live broadcast stream layer rendered beneath overlay</div>
              </div>
              <div className="flex items-center justify-between text-[10px] text-[#ADADB8] opacity-50 font-mono">
                <span>Bitrate: 6,000 kbps</span>
                <span>HLS Latency: 1.8s</span>
              </div>
            </div>
          ) : (
            <div className="absolute inset-0 bg-[#0E0E10] flex items-center justify-center pointer-events-none">
              <div className="text-center opacity-25">
                <Layers className="w-9 h-9 mx-auto text-[#9146FF] mb-1" />
                <span className="text-xs font-mono text-[#ADADB8]">Stream Video Canvas (Dark Mode)</span>
              </div>
            </div>
          )}

          {/* Actual 1st Iframe (overlay.html) */}
          <iframe
            id="iframe-overlay"
            key={`overlay-${refreshKey}`}
            ref={iframeRef}
            src="/overlay.html"
            title="Twitch Video Overlay View (overlay.html)"
            className="relative z-10 w-full h-full border-0 bg-transparent"
            allow="autoplay"
          />
        </div>
      </div>
    </section>
  );
};
