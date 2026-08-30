import React, { useRef, useState, useEffect } from 'react';
import { ExternalLink, RefreshCw, Smartphone, LayoutGrid, Sliders } from 'lucide-react';

interface PanelFramesProps {
  refreshKey: number;
}

function parseInitialHeight(val: any, fallback = 460): number {
  if (!val) return fallback;
  const num = parseInt(String(val), 10);
  if (isNaN(num)) return fallback;
  return Math.max(100, Math.min(500, num));
}

export const PanelFrames: React.FC<PanelFramesProps> = ({ refreshKey }) => {
  const panel1Ref = useRef<HTMLIFrameElement>(null);
  const panel2Ref = useRef<HTMLIFrameElement>(null);

  // Initial height from environment variable or default
  const envHeight1 = parseInitialHeight(
    (import.meta as any).env?.VITE_PANEL1_HEIGHT || (import.meta as any).env?.VITE_PANEL_HEIGHT,
    460
  );
  const envHeight2 = parseInitialHeight(
    (import.meta as any).env?.VITE_PANEL2_HEIGHT || (import.meta as any).env?.VITE_PANEL_HEIGHT,
    460
  );

  const [panel1Height, setPanel1Height] = useState<number>(envHeight1);
  const [panel2Height, setPanel2Height] = useState<number>(envHeight2);
  const [showControls1, setShowControls1] = useState<boolean>(false);
  const [showControls2, setShowControls2] = useState<boolean>(false);

  // Sync with EBS config if available
  useEffect(() => {
    fetch('/api/ebs/config')
      .then((r) => r.json())
      .then((data) => {
        if (data) {
          if (data.panel1Height) setPanel1Height(parseInitialHeight(data.panel1Height, 460));
          if (data.panel2Height) setPanel2Height(parseInitialHeight(data.panel2Height, 460));
        }
      })
      .catch(() => {});
  }, [refreshKey]);

  const reloadPanel1 = () => {
    if (panel1Ref.current) {
      panel1Ref.current.src = `/panel.html?height=${panel1Height}&t=${Date.now()}`;
    }
  };

  const reloadPanel2 = () => {
    if (panel2Ref.current) {
      panel2Ref.current.src = `/panel2.html?height=${panel2Height}&t=${Date.now()}`;
    }
  };

  const setHeight1 = (h: number) => {
    const clamped = Math.max(100, Math.min(500, h));
    setPanel1Height(clamped);
    if (panel1Ref.current) {
      panel1Ref.current.src = `/panel.html?height=${clamped}&t=${Date.now()}`;
    }
  };

  const setHeight2 = (h: number) => {
    const clamped = Math.max(100, Math.min(500, h));
    setPanel2Height(clamped);
    if (panel2Ref.current) {
      panel2Ref.current.src = `/panel2.html?height=${clamped}&t=${Date.now()}`;
    }
  };

  const quickHeights = [100, 300, 400, 500];

  return (
    <section id="section-panels" className="w-full grid grid-cols-1 md:grid-cols-2 gap-4">
      
      {/* 2nd Iframe: panel.html (Left side under the overlay) */}
      <div id="container-panel1" className="bg-[#18181B] border border-[#2D2D30] rounded-lg overflow-hidden shadow-xl flex flex-col">
        
        {/* Panel 1 Header */}
        <div className="flex items-center justify-between px-3.5 py-2 bg-[#18181B] border-b border-[#2D2D30] text-xs">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#9146FF] shadow-sm" />
            <span className="font-semibold text-[#EFEFF1] flex items-center gap-1.5">
              <LayoutGrid className="w-3.5 h-3.5 text-[#9146FF]" />
              Panel View 1
            </span>
            <span className="px-2 py-0.5 bg-black/60 rounded text-[10px] uppercase font-bold tracking-widest text-[#ADADB8] border border-white/10">
              panel.html
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setShowControls1(!showControls1)}
              className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono border transition ${
                showControls1
                  ? 'bg-[#9146FF]/20 text-[#9146FF] border-[#9146FF]/40'
                  : 'bg-[#1F1F23] text-[#ADADB8] hover:text-[#EFEFF1] border-[#2D2D30]'
              }`}
              title="Toggle Height Controls (100 - 500px)"
            >
              <Sliders className="w-2.5 h-2.5" />
              <span>{panel1Height}px</span>
            </button>
            <button
              onClick={reloadPanel1}
              className="p-1 text-[#ADADB8] hover:text-[#EFEFF1] rounded hover:bg-[#1F1F23] transition"
              title="Reload Panel 1"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
            <a
              href={`/panel.html?height=${panel1Height}`}
              target="_blank"
              rel="noreferrer"
              className="p-1 text-[#ADADB8] hover:text-[#EFEFF1] rounded hover:bg-[#1F1F23] transition"
              title="Open panel.html in new tab"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Panel 1 Height Controls Bar (Collapsible) */}
        {showControls1 && (
          <div className="px-3.5 py-2 bg-[#0E0E10] border-b border-[#2D2D30] flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-[#ADADB8] font-mono">Twitch Height (100-500px):</span>
              <div className="flex items-center gap-1">
                {quickHeights.map((h) => (
                  <button
                    key={h}
                    onClick={() => setHeight1(h)}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-mono transition ${
                      panel1Height === h
                        ? 'bg-[#9146FF] text-white font-bold'
                        : 'bg-[#1F1F23] hover:bg-[#2D2D30] text-[#ADADB8]'
                    }`}
                  >
                    {h}px
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="100"
                max="500"
                step="10"
                value={panel1Height}
                onChange={(e) => setHeight1(Number(e.target.value))}
                className="w-24 accent-[#9146FF] cursor-pointer"
              />
              <span className="text-[10px] font-mono text-[#EFEFF1] w-10 text-right">{panel1Height}px</span>
            </div>
          </div>
        )}

        {/* Panel 1 Iframe Container */}
        <div className="p-3 sm:p-4 flex-1 flex justify-center bg-[#0E0E10]">
          <div
            className="w-full max-w-[420px] rounded-lg overflow-hidden border border-[#2D2D30] shadow-lg bg-[#18181B] transition-all duration-200"
            style={{ height: `${panel1Height}px` }}
          >
            <iframe
              id="iframe-panel1"
              key={`panel1-${refreshKey}-${panel1Height}`}
              ref={panel1Ref}
              src={`/panel.html?height=${panel1Height}`}
              title="Twitch Extension Panel 1 (panel.html)"
              className="w-full h-full border-0 bg-[#18181B]"
            />
          </div>
        </div>
      </div>

      {/* 3rd Iframe: panel2.html (Right side of panel 1) */}
      <div id="container-panel2" className="bg-[#18181B] border border-[#2D2D30] rounded-lg overflow-hidden shadow-xl flex flex-col">
        
        {/* Panel 2 Header */}
        <div className="flex items-center justify-between px-3.5 py-2 bg-[#18181B] border-b border-[#2D2D30] text-xs">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-indigo-500 shadow-sm" />
            <span className="font-semibold text-[#EFEFF1] flex items-center gap-1.5">
              <Smartphone className="w-3.5 h-3.5 text-indigo-400" />
              Panel View 2
            </span>
            <span className="px-2 py-0.5 bg-black/60 rounded text-[10px] uppercase font-bold tracking-widest text-[#ADADB8] border border-white/10">
              panel2.html
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setShowControls2(!showControls2)}
              className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono border transition ${
                showControls2
                  ? 'bg-indigo-600/20 text-indigo-400 border-indigo-500/40'
                  : 'bg-[#1F1F23] text-[#ADADB8] hover:text-[#EFEFF1] border-[#2D2D30]'
              }`}
              title="Toggle Height Controls (100 - 500px)"
            >
              <Sliders className="w-2.5 h-2.5" />
              <span>{panel2Height}px</span>
            </button>
            <button
              onClick={reloadPanel2}
              className="p-1 text-[#ADADB8] hover:text-[#EFEFF1] rounded hover:bg-[#1F1F23] transition"
              title="Reload Panel 2"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
            <a
              href={`/panel2.html?height=${panel2Height}`}
              target="_blank"
              rel="noreferrer"
              className="p-1 text-[#ADADB8] hover:text-[#EFEFF1] rounded hover:bg-[#1F1F23] transition"
              title="Open panel2.html in new tab"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Panel 2 Height Controls Bar (Collapsible) */}
        {showControls2 && (
          <div className="px-3.5 py-2 bg-[#0E0E10] border-b border-[#2D2D30] flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-[#ADADB8] font-mono">Twitch Height (100-500px):</span>
              <div className="flex items-center gap-1">
                {quickHeights.map((h) => (
                  <button
                    key={h}
                    onClick={() => setHeight2(h)}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-mono transition ${
                      panel2Height === h
                        ? 'bg-indigo-600 text-white font-bold'
                        : 'bg-[#1F1F23] hover:bg-[#2D2D30] text-[#ADADB8]'
                    }`}
                  >
                    {h}px
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="100"
                max="500"
                step="10"
                value={panel2Height}
                onChange={(e) => setHeight2(Number(e.target.value))}
                className="w-24 accent-indigo-500 cursor-pointer"
              />
              <span className="text-[10px] font-mono text-[#EFEFF1] w-10 text-right">{panel2Height}px</span>
            </div>
          </div>
        )}

        {/* Panel 2 Iframe Container */}
        <div className="p-3 sm:p-4 flex-1 flex justify-center bg-[#0E0E10]">
          <div
            className="w-full max-w-[420px] rounded-lg overflow-hidden border border-[#2D2D30] shadow-lg bg-[#18181B] transition-all duration-200"
            style={{ height: `${panel2Height}px` }}
          >
            <iframe
              id="iframe-panel2"
              key={`panel2-${refreshKey}-${panel2Height}`}
              ref={panel2Ref}
              src={`/panel2.html?height=${panel2Height}`}
              title="Twitch Extension Panel 2 (panel2.html)"
              className="w-full h-full border-0 bg-[#18181B]"
            />
          </div>
        </div>
      </div>

    </section>
  );
};
