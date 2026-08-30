import React, { useRef, useState } from 'react';
import { AspectRatioPreset, VideoViewMode, ComponentDockPosition } from '../types';
import { 
  ExternalLink, 
  RefreshCw, 
  Layers, 
  Monitor, 
  LayoutTemplate, 
  ChevronDown, 
  ChevronUp, 
  Minimize2, 
  Maximize2,
  Sliders
} from 'lucide-react';

interface OverlayFrameProps {
  aspectRatio: AspectRatioPreset;
  streamBg: boolean;
  refreshKey: number;
  videoMode: VideoViewMode;
  onVideoModeChange: (mode: VideoViewMode) => void;
}

export const OverlayFrame: React.FC<OverlayFrameProps> = ({
  aspectRatio,
  streamBg,
  refreshKey,
  videoMode,
  onVideoModeChange,
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [dockPosition, setDockPosition] = useState<ComponentDockPosition>('right');
  const [isCollapsed, setIsCollapsed] = useState(false);

  const activeHtmlFile = videoMode === 'overlay' ? 'video_overlay.html' : 'video_component.html';
  const activeIframeSrc = `/${activeHtmlFile}`;

  const handleReload = () => {
    if (iframeRef.current) {
      iframeRef.current.src = `/${activeHtmlFile}?t=${Date.now()}`;
    }
  };

  // Determine container aspect ratio / height classes for the simulated Twitch video player
  const getAspectClass = () => {
    switch (aspectRatio) {
      case '16:9 (1080p)':
      case '16:9 (720p)':
        return 'aspect-video w-full max-h-[480px]';
      case '4:3 (Classic)':
        return 'aspect-[4/3] w-full max-w-2xl mx-auto max-h-[480px]';
      case '21:9 (Ultrawide)':
        return 'aspect-[21/9] w-full max-h-[440px]';
      case 'Fluid':
      default:
        return 'h-[380px] sm:h-[450px] w-full';
    }
  };

  // Determine positioning of the Component Extension over the simulated Twitch video canvas
  const getDockPositionClasses = () => {
    if (dockPosition === 'left') {
      return 'top-4 left-4 bottom-4 w-[340px] max-w-[85%]';
    }
    if (dockPosition === 'floating') {
      return 'top-10 right-10 w-[340px] max-w-[85%] max-h-[82%]';
    }
    // Default: 'right' dock
    return 'top-4 right-4 bottom-4 w-[340px] max-w-[85%]';
  };

  return (
    <section id="section-overlay-iframe" className="w-full bg-[#18181B] border border-[#2D2D30] rounded-lg overflow-hidden shadow-xl">
      
      {/* Frame Header Bar with View Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2 bg-[#18181B] border-b border-[#2D2D30] text-xs">
        
        {/* Left Side: Mode Switcher Tabs */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-[#0E0E10] p-0.5 rounded-lg border border-[#2D2D30]">
            <button
              id="btn-switch-overlay"
              onClick={() => onVideoModeChange('overlay')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition ${
                videoMode === 'overlay'
                  ? 'bg-[#9146FF] text-white shadow-sm'
                  : 'text-[#ADADB8] hover:text-[#EFEFF1]'
              }`}
              title="Switch to full-screen transparent Video Overlay Extension"
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>Video Overlay</span>
            </button>

            <button
              id="btn-switch-component"
              onClick={() => onVideoModeChange('component')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition ${
                videoMode === 'component'
                  ? 'bg-[#9146FF] text-white shadow-sm'
                  : 'text-[#ADADB8] hover:text-[#EFEFF1]'
              }`}
              title="Switch to docked interactive Video Component Extension"
            >
              <LayoutTemplate className="w-3.5 h-3.5" />
              <span>Video Component</span>
            </button>
          </div>

          {/* Active File Pill */}
          <span className="px-2 py-0.5 bg-black/60 rounded text-[10px] uppercase font-mono font-bold tracking-wider text-[#ADADB8] border border-white/10 hidden sm:inline">
            {activeHtmlFile}
          </span>
        </div>

        {/* Right Side: Component Controls, Aspect Ratio, Reload & External Link */}
        <div className="flex items-center gap-2">
          
          {/* Dock Position Selector (visible when Component mode is active) */}
          {videoMode === 'component' && (
            <div className="flex items-center gap-1 bg-[#1F1F23] px-2 py-0.5 rounded border border-[#2D2D30] text-[11px]">
              <Sliders className="w-3 h-3 text-[#9146FF]" />
              <span className="text-[#ADADB8] hidden md:inline">Dock:</span>
              <select
                id="select-component-dock"
                value={dockPosition}
                onChange={(e) => setDockPosition(e.target.value as ComponentDockPosition)}
                aria-label="Component Dock Position"
                className="bg-transparent text-[#EFEFF1] text-xs focus:outline-none cursor-pointer"
              >
                <option value="right" className="bg-[#18181B] text-[#EFEFF1]">Right Dock (Default)</option>
                <option value="left" className="bg-[#18181B] text-[#EFEFF1]">Left Dock</option>
                <option value="floating" className="bg-[#18181B] text-[#EFEFF1]">Floating Box</option>
              </select>
            </div>
          )}

          <span className="hidden sm:inline text-[11px] font-mono text-[#ADADB8] bg-[#1F1F23] px-2 py-0.5 rounded border border-[#2D2D30]">
            {aspectRatio}
          </span>

          <button
            onClick={handleReload}
            className="p-1 text-[#ADADB8] hover:text-[#EFEFF1] rounded hover:bg-[#1F1F23] transition"
            title={`Reload ${activeHtmlFile}`}
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <a
            href={activeIframeSrc}
            target="_blank"
            rel="noreferrer"
            className="p-1 text-[#ADADB8] hover:text-[#EFEFF1] rounded hover:bg-[#1F1F23] transition"
            title={`Open ${activeHtmlFile} in new tab`}
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Frame Container with simulated video stream background */}
      <div className="relative w-full flex items-center justify-center p-2.5 sm:p-3.5 bg-[#0E0E10]">
        <div className={`relative rounded-lg overflow-hidden border border-[#2D2D30] shadow-2xl transition-all duration-300 ${getAspectClass()}`}>
          
          {/* Stream Background Simulation (Twitch Video Player Canvas) */}
          {streamBg ? (
            <div className="absolute inset-0 bg-gradient-to-tr from-[#0E0E10] via-[#1f1633] to-[#141221] flex flex-col justify-between p-4 pointer-events-none select-none">
              <div className="flex items-center justify-between opacity-50">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-[10px] font-bold tracking-wider text-red-400 uppercase">LIVE 1080p 60fps</span>
                </div>
                <span className="text-[10px] font-mono text-[#ADADB8]">Twitch Broadcast Video Player</span>
              </div>
              <div className="text-center opacity-30">
                <div className="text-4xl sm:text-5xl font-black text-[#EFEFF1]/25 tracking-tight">GAMEPLAY BROADCAST</div>
                <div className="text-xs text-[#ADADB8] font-mono mt-1">
                  {videoMode === 'overlay' 
                    ? 'Transparent Video Overlay (video_overlay.html) spans entire player' 
                    : 'Docked Video Component (video_component.html) rendered over stream'}
                </div>
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

          {/* MODE 1: Video Overlay (video_overlay.html) - Full-bleed transparent layer */}
          {videoMode === 'overlay' && (
            <iframe
              id="iframe-overlay"
              key={`overlay-${refreshKey}`}
              ref={iframeRef}
              src="/video_overlay.html"
              title="Twitch Video Overlay View (video_overlay.html)"
              className="relative z-10 w-full h-full border-0 bg-transparent"
              allow="autoplay"
            />
          )}

          {/* MODE 2: Video Component (video_component.html) - Mimics Twitch.tv Component Extension dock */}
          {videoMode === 'component' && (
            <div className="absolute inset-0 z-10 pointer-events-none flex">
              
              {/* Collapsed Twitch Extension Edge Button (when minimized) */}
              {isCollapsed ? (
                <div className={`absolute pointer-events-auto transition-all ${
                  dockPosition === 'left' ? 'left-3 top-1/2 -translate-y-1/2' : 'right-3 top-1/2 -translate-y-1/2'
                }`}>
                  <button
                    onClick={() => setIsCollapsed(false)}
                    className="flex items-center gap-2 bg-[#18181B] hover:bg-[#1F1F23] border border-[#9146FF] text-[#EFEFF1] px-3 py-2 rounded-lg shadow-2xl transition hover:scale-105 group"
                    title="Click to expand Twitch Component Extension"
                  >
                    <div className="w-6 h-6 bg-[#9146FF] rounded flex items-center justify-center font-bold text-white text-xs shadow-sm">
                      T
                    </div>
                    <span className="text-xs font-semibold group-hover:text-white">Stream Companion</span>
                    <Maximize2 className="w-3.5 h-3.5 text-[#9146FF]" />
                  </button>
                </div>
              ) : (
                /* Expanded Twitch Component Extension Container */
                <div className={`absolute pointer-events-auto ${getDockPositionClasses()} transition-all flex flex-col`}>
                  
                  {/* Twitch Component Outer Mock Frame */}
                  <div className="w-full h-full bg-[#18181B]/95 backdrop-blur-md border border-[#2D2D30] rounded-xl shadow-2xl flex flex-col overflow-hidden">
                    
                    {/* Top Twitch Component Dock Bar */}
                    <div className="flex items-center justify-between px-3 py-1.5 bg-[#1F1F23] border-b border-[#2D2D30] text-xs select-none">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-[#9146FF] rounded flex items-center justify-center font-bold text-white text-[10px]">
                          T
                        </div>
                        <span className="font-bold text-[#EFEFF1] text-xs">Twitch Component Slot</span>
                        <span className="text-[9px] bg-black/40 text-[#ADADB8] px-1.5 py-0.5 rounded font-mono">
                          video_component.html
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setIsCollapsed(true)}
                          className="p-1 text-[#ADADB8] hover:text-[#EFEFF1] hover:bg-[#2D2D30] rounded transition"
                          title="Minimize Component Extension on Twitch Player"
                        >
                          <Minimize2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Component Iframe embedding video_component.html */}
                    <div className="flex-1 w-full h-full overflow-hidden">
                      <iframe
                        id="iframe-component"
                        key={`component-${refreshKey}`}
                        ref={iframeRef}
                        src="/video_component.html"
                        title="Twitch Video Component View (video_component.html)"
                        className="w-full h-full border-0 bg-transparent"
                        allow="autoplay"
                      />
                    </div>

                  </div>
                </div>
              )}

            </div>
          )}

        </div>
      </div>
    </section>
  );
};

