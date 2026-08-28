import React, { useRef } from 'react';
import { ExternalLink, RefreshCw, Smartphone, LayoutGrid } from 'lucide-react';

interface PanelFramesProps {
  refreshKey: number;
}

export const PanelFrames: React.FC<PanelFramesProps> = ({ refreshKey }) => {
  const panel1Ref = useRef<HTMLIFrameElement>(null);
  const panel2Ref = useRef<HTMLIFrameElement>(null);

  const reloadPanel1 = () => {
    if (panel1Ref.current) {
      panel1Ref.current.src = `/panel.html?t=${Date.now()}`;
    }
  };

  const reloadPanel2 = () => {
    if (panel2Ref.current) {
      panel2Ref.current.src = `/panel2.html?t=${Date.now()}`;
    }
  };

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
            <span className="text-[10px] font-mono text-[#ADADB8] hidden sm:inline">320px Twitch Standard</span>
            <button
              onClick={reloadPanel1}
              className="p-1 text-[#ADADB8] hover:text-[#EFEFF1] rounded hover:bg-[#1F1F23] transition"
              title="Reload Panel 1"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
            <a
              href="/panel.html"
              target="_blank"
              rel="noreferrer"
              className="p-1 text-[#ADADB8] hover:text-[#EFEFF1] rounded hover:bg-[#1F1F23] transition"
              title="Open panel.html in new tab"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Panel 1 Iframe Container */}
        <div className="p-3 sm:p-4 flex-1 flex justify-center bg-[#0E0E10]">
          <div className="w-full max-w-[420px] rounded-lg overflow-hidden border border-[#2D2D30] shadow-lg h-[460px] bg-[#18181B]">
            <iframe
              id="iframe-panel1"
              key={`panel1-${refreshKey}`}
              ref={panel1Ref}
              src="/panel.html"
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
            <span className="text-[10px] font-mono text-[#ADADB8] hidden sm:inline">Bits & Rewards</span>
            <button
              onClick={reloadPanel2}
              className="p-1 text-[#ADADB8] hover:text-[#EFEFF1] rounded hover:bg-[#1F1F23] transition"
              title="Reload Panel 2"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
            <a
              href="/panel2.html"
              target="_blank"
              rel="noreferrer"
              className="p-1 text-[#ADADB8] hover:text-[#EFEFF1] rounded hover:bg-[#1F1F23] transition"
              title="Open panel2.html in new tab"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Panel 2 Iframe Container */}
        <div className="p-3 sm:p-4 flex-1 flex justify-center bg-[#0E0E10]">
          <div className="w-full max-w-[420px] rounded-lg overflow-hidden border border-[#2D2D30] shadow-lg h-[460px] bg-[#18181B]">
            <iframe
              id="iframe-panel2"
              key={`panel2-${refreshKey}`}
              ref={panel2Ref}
              src="/panel2.html"
              title="Twitch Extension Panel 2 (panel2.html)"
              className="w-full h-full border-0 bg-[#18181B]"
            />
          </div>
        </div>
      </div>

    </section>
  );
};
