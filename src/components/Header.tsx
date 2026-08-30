import React from 'react';
import { 
  Tv, 
  RefreshCw, 
  Server, 
  ShieldCheck, 
  Layers, 
  Radio,
  AlertTriangle,
  WifiOff
} from 'lucide-react';
import { AspectRatioPreset, RigAuth, RigContext, EbsNetworkError } from '../types';

interface HeaderProps {
  auth: RigAuth;
  setAuth: React.Dispatch<React.SetStateAction<RigAuth>>;
  context: RigContext;
  setContext: React.Dispatch<React.SetStateAction<RigContext>>;
  aspectRatio: AspectRatioPreset;
  setAspectRatio: (ar: AspectRatioPreset) => void;
  streamBg: boolean;
  setStreamBg: (bg: boolean) => void;
  ebsOnline: boolean | null;
  ebsLatency: number | null;
  ebsError: EbsNetworkError | null;
  onRefreshAll: () => void;
  onOpenServerModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  auth,
  setAuth,
  aspectRatio,
  setAspectRatio,
  streamBg,
  setStreamBg,
  ebsOnline,
  ebsLatency,
  ebsError,
  onRefreshAll,
  onOpenServerModal,
}) => {
  return (
    <header id="rig-header" className="flex items-center justify-between px-4 sm:px-6 h-14 bg-[#18181B] border-b border-[#2D2D30] shrink-0 sticky top-0 z-50">
      
      {/* Brand & EBS Server Indicator */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-[#9146FF] rounded flex items-center justify-center font-bold text-white shadow-sm text-sm">
            T
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-semibold tracking-tight text-[#EFEFF1]">
                Twitch Extension Sandbox
              </h1>
              <span className="text-[10px] font-mono text-[#ADADB8] opacity-75 hidden sm:inline">
                v1.0.0-beta
              </span>
            </div>
            <p className="text-[10px] text-[#ADADB8] hidden md:block">
              Responsive 4-Iframe Rig &bull; node-forge SSL EBS
            </p>
          </div>
        </div>

        {/* EBS Status Pill */}
        <div 
          id="ebs-status-badge"
          onClick={onOpenServerModal}
          className={`cursor-pointer hidden sm:flex items-center gap-2 px-3 py-1 rounded-full border transition ${
            ebsOnline === null
              ? 'bg-[#1F1F23] border-[#2D2D30]'
              : ebsOnline
                ? 'bg-emerald-950/40 border-emerald-500/40 hover:border-emerald-400'
                : 'bg-rose-950/50 border-rose-500/60 hover:border-rose-400'
          }`}
          title={
            ebsError
              ? `${ebsError.title}: ${ebsError.message}\nClick for SSL & Server Guide`
              : 'Click to view EBS Server & HTTPS node-forge setup'
          }
        >
          <div className={`w-2 h-2 rounded-full ${
            ebsOnline === null 
              ? 'bg-amber-400 animate-pulse' 
              : ebsOnline 
                ? 'bg-emerald-400 animate-pulse' 
                : 'bg-rose-500 animate-ping'
          }`} />
          <span className={`text-xs font-mono font-medium ${
            ebsOnline ? 'text-emerald-300' : ebsOnline === false ? 'text-rose-300' : 'text-[#ADADB8]'
          }`}>
            {ebsOnline 
              ? `EBS: Online (${ebsLatency}ms)` 
              : ebsError 
                ? `EBS: ${ebsError.category === 'cors' ? 'CORS Blocked' : 'Connection Refused'}`
                : 'EBS: Offline'}
          </span>
          {ebsError && (
            <AlertTriangle className="w-3 h-3 text-rose-400" />
          )}
        </div>
      </div>

      {/* Rig Controls & Presets */}
      <div className="flex items-center gap-2">
        
        {/* Aspect Ratio Selector for Overlay */}
        <div className="flex items-center gap-1.5 bg-[#1F1F23] px-2.5 py-1 rounded border border-[#2D2D30] text-xs">
          <Layers className="w-3.5 h-3.5 text-[#ADADB8]" />
          <span className="text-[#ADADB8] text-[11px] hidden lg:inline">Aspect:</span>
          <select
            id="select-aspect-ratio"
            value={aspectRatio}
            onChange={(e) => setAspectRatio(e.target.value as AspectRatioPreset)}
            aria-label="Select Overlay Aspect Ratio"
            className="bg-transparent text-[#EFEFF1] text-xs focus:outline-none cursor-pointer"
          >
            <option value="16:9 (1080p)" className="bg-[#18181B] text-[#EFEFF1]">16:9 (1080p Standard)</option>
            <option value="16:9 (720p)" className="bg-[#18181B] text-[#EFEFF1]">16:9 (720p Stream)</option>
            <option value="4:3 (Classic)" className="bg-[#18181B] text-[#EFEFF1]">4:3 (Classic)</option>
            <option value="21:9 (Ultrawide)" className="bg-[#18181B] text-[#EFEFF1]">21:9 (Ultrawide)</option>
            <option value="Fluid" className="bg-[#18181B] text-[#EFEFF1]">Fluid Responsive</option>
          </select>
        </div>

        {/* Viewer Role Simulator */}
        <div className="flex items-center gap-1.5 bg-[#1F1F23] px-2.5 py-1 rounded border border-[#2D2D30] text-xs">
          <ShieldCheck className="w-3.5 h-3.5 text-[#9146FF]" />
          <span className="text-[#ADADB8] text-[11px] hidden xl:inline">Role:</span>
          <select
            id="select-mock-role"
            value={auth.role}
            onChange={(e) => setAuth(prev => ({ ...prev, role: e.target.value as any }))}
            aria-label="Select Mock Viewer Role"
            className="bg-transparent text-[#EFEFF1] text-xs focus:outline-none cursor-pointer"
          >
            <option value="broadcaster" className="bg-[#18181B] text-[#EFEFF1]">Broadcaster</option>
            <option value="moderator" className="bg-[#18181B] text-[#EFEFF1]">Moderator</option>
            <option value="viewer" className="bg-[#18181B] text-[#EFEFF1]">Viewer</option>
            <option value="external" className="bg-[#18181B] text-[#EFEFF1]">External</option>
          </select>
        </div>

        {/* Stream Video Wallpaper Toggle */}
        <button
          id="btn-toggle-stream-bg"
          onClick={() => setStreamBg(!streamBg)}
          className={`px-2.5 py-1 rounded text-xs font-medium border transition flex items-center gap-1.5 ${
            streamBg 
              ? 'bg-[#9146FF]/20 border-[#9146FF] text-[#EFEFF1]' 
              : 'bg-[#1F1F23] border-[#2D2D30] text-[#ADADB8] hover:text-[#EFEFF1]'
          }`}
          title="Toggle simulated live gameplay stream background on overlay"
        >
          <Radio className="w-3.5 h-3.5 text-[#9146FF]" />
          <span className="hidden sm:inline">Stream BG</span>
        </button>

        {/* Standalone EBS & Setup Documentation Modal */}
        <button
          id="btn-open-server-info"
          onClick={onOpenServerModal}
          className="px-2.5 py-1 rounded text-xs font-medium bg-[#1F1F23] border border-[#2D2D30] text-[#ADADB8] hover:text-[#EFEFF1] hover:border-[#9146FF]/50 transition flex items-center gap-1.5"
          title="View Server/server.js code and local HTTPS setup"
        >
          <Server className="w-3.5 h-3.5 text-green-400" />
          <span className="hidden md:inline">EBS SSL Info</span>
        </button>

        {/* Refresh All Frames */}
        <button
          id="btn-refresh-all"
          onClick={onRefreshAll}
          className="p-1.5 rounded bg-[#1F1F23] border border-[#2D2D30] text-[#ADADB8] hover:text-[#EFEFF1] hover:bg-[#2D2D30] transition"
          title="Reload all 4 iframes"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

    </header>
  );
};
