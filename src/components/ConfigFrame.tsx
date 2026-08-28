import React, { useRef } from 'react';
import { ExternalLink, RefreshCw, Settings } from 'lucide-react';

interface ConfigFrameProps {
  refreshKey: number;
}

export const ConfigFrame: React.FC<ConfigFrameProps> = ({ refreshKey }) => {
  const configRef = useRef<HTMLIFrameElement>(null);

  const reloadConfig = () => {
    if (configRef.current) {
      configRef.current.src = `/config.html?t=${Date.now()}`;
    }
  };

  return (
    <section id="section-config-iframe" className="w-full bg-[#18181B] border border-[#2D2D30] rounded-lg overflow-hidden shadow-xl flex flex-col">
      
      {/* Frame Header Bar */}
      <div className="flex items-center justify-between px-3.5 py-2 bg-[#18181B] border-b border-[#2D2D30] text-xs">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-amber-400 shadow-sm" />
          <span className="font-semibold text-[#EFEFF1] flex items-center gap-1.5">
            <Settings className="w-3.5 h-3.5 text-amber-400" />
            Broadcaster Configuration
          </span>
          <span className="px-2 py-0.5 bg-black/60 rounded text-[10px] uppercase font-bold tracking-widest text-[#ADADB8] border border-white/10">
            config.html
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="hidden sm:inline text-[11px] font-mono text-[#ADADB8] bg-[#1F1F23] px-2 py-0.5 rounded border border-[#2D2D30]">
            Creator Dashboard View (Full Width)
          </span>
          <button
            onClick={reloadConfig}
            className="p-1 text-[#ADADB8] hover:text-[#EFEFF1] rounded hover:bg-[#1F1F23] transition"
            title="Reload config.html"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <a
            href="/config.html"
            target="_blank"
            rel="noreferrer"
            className="p-1 text-[#ADADB8] hover:text-[#EFEFF1] rounded hover:bg-[#1F1F23] transition"
            title="Open config.html in new tab"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* 4th Iframe Container (Full width) */}
      <div className="p-3 sm:p-4 bg-[#0E0E10]">
        <div className="w-full rounded-lg overflow-hidden border border-[#2D2D30] shadow-lg h-[480px] bg-[#18181B]">
          <iframe
            id="iframe-config"
            key={`config-${refreshKey}`}
            ref={configRef}
            src="/config.html"
            title="Twitch Extension Broadcaster Configuration (config.html)"
            className="w-full h-full border-0 bg-[#18181B]"
          />
        </div>
      </div>
    </section>
  );
};
