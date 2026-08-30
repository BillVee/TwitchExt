import React, { useState } from 'react';
import { 
  AlertOctagon, 
  ShieldAlert, 
  WifiOff, 
  RefreshCw, 
  ExternalLink, 
  Server, 
  Terminal, 
  ChevronDown, 
  ChevronUp, 
  HelpCircle,
  Copy,
  Check
} from 'lucide-react';
import { EbsNetworkError } from '../types';

interface EbsErrorBannerProps {
  error: EbsNetworkError;
  onRetry: () => void;
  onOpenServerModal: () => void;
}

export const EbsErrorBanner: React.FC<EbsErrorBannerProps> = ({
  error,
  onRetry,
  onOpenServerModal,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [copied, setCopied] = useState(false);
  const [retrying, setRetrying] = useState(false);

  const handleRetryClick = async () => {
    setRetrying(true);
    await onRetry();
    setTimeout(() => setRetrying(false), 500);
  };

  const copyCommand = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isCors = error.category === 'cors' || error.category === 'mixed_content';
  const isConnRefused = error.category === 'connection_refused';
  const isSsl = error.category === 'ssl_untrusted';

  const badgeBg = isCors 
    ? 'bg-amber-950/70 border-amber-500/50 text-amber-300' 
    : isConnRefused 
      ? 'bg-rose-950/70 border-rose-500/50 text-rose-300' 
      : isSsl 
        ? 'bg-purple-950/70 border-purple-500/50 text-purple-300'
        : 'bg-red-950/70 border-red-500/50 text-red-300';

  const accentColor = isCors 
    ? 'text-amber-400' 
    : isConnRefused 
      ? 'text-rose-400' 
      : isSsl 
        ? 'text-purple-400'
        : 'text-red-400';

  return (
    <section 
      id="ebs-network-error-banner"
      className="w-full bg-[#18181B] border-2 border-rose-600/40 rounded-lg overflow-hidden shadow-2xl transition-all"
    >
      {/* Alert Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-gradient-to-r from-rose-950/60 via-[#1C1215] to-[#18181B] border-b border-rose-900/30">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-rose-500/20 border border-rose-500/40 flex items-center justify-center shrink-0">
            {isCors ? (
              <ShieldAlert className="w-4 h-4 text-amber-400 animate-pulse" />
            ) : isConnRefused ? (
              <WifiOff className="w-4 h-4 text-rose-400 animate-pulse" />
            ) : (
              <AlertOctagon className="w-4 h-4 text-rose-400 animate-pulse" />
            )}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                EBS Connectivity Failed
              </h2>
              <span className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold uppercase tracking-wider border ${badgeBg}`}>
                {isCors 
                  ? 'CORS Policy Blocked' 
                  : isConnRefused 
                    ? 'Connection Refused (ERR_CONNECTION_REFUSED)' 
                    : isSsl 
                      ? 'Untrusted SSL Certificate' 
                      : 'Network Failure'}
              </span>
              <span className="text-[10px] font-mono text-[#ADADB8]">
                {error.timestamp}
              </span>
            </div>
            <p className="text-xs text-[#D0D0D7] mt-0.5">
              {error.message}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            id="btn-retry-ebs-ping"
            onClick={handleRetryClick}
            disabled={retrying}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-rose-600 hover:bg-rose-500 text-white font-medium text-xs shadow transition disabled:opacity-50"
            title="Retry EBS ping request"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${retrying ? 'animate-spin' : ''}`} />
            <span>{retrying ? 'Pinging...' : 'Retry Ping'}</span>
          </button>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 text-[#ADADB8] hover:text-[#EFEFF1] hover:bg-[#2D2D30] rounded transition"
            title={isExpanded ? 'Collapse error details' : 'Expand error details'}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Expanded Diagnostic & Troubleshooting Details */}
      {isExpanded && (
        <div className="p-4 space-y-4 bg-[#0E0E10]/95 text-xs">
          
          {/* Target Diagnostic Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-mono text-[11px]">
            <div className="bg-[#18181B] p-2.5 rounded border border-[#2D2D30]">
              <div className="text-[#ADADB8] text-[10px] uppercase tracking-wider mb-1">Target Endpoint</div>
              <div className="text-[#EFEFF1] font-semibold break-all">{error.targetUrl}</div>
            </div>
            <div className="bg-[#18181B] p-2.5 rounded border border-[#2D2D30]">
              <div className="text-[#ADADB8] text-[10px] uppercase tracking-wider mb-1">Error Classification</div>
              <div className={`font-semibold uppercase ${accentColor}`}>
                {error.category.replace('_', ' ')}
              </div>
            </div>
            <div className="bg-[#18181B] p-2.5 rounded border border-[#2D2D30]">
              <div className="text-[#ADADB8] text-[10px] uppercase tracking-wider mb-1">Client Origin</div>
              <div className="text-[#ADADB8] break-all">{typeof window !== 'undefined' ? window.location.origin : 'N/A'}</div>
            </div>
          </div>

          {/* Root Cause & Remediation Guide */}
          <div className="bg-[#18181B] border border-[#2D2D30] rounded-lg p-3.5 space-y-3">
            <div className="flex items-center gap-2 text-[#EFEFF1] font-semibold text-xs border-b border-[#2D2D30] pb-2">
              <HelpCircle className="w-4 h-4 text-[#9146FF]" />
              <span>Root Cause Diagnosis & How to Fix</span>
            </div>

            {isCors && (
              <div className="space-y-2 text-[#D0D0D7] text-xs">
                <p>
                  <strong className="text-amber-300">CORS (Cross-Origin Resource Sharing) Restriction Detected:</strong> The browser blocked the extension view from receiving responses from the Extension Backend Service (EBS) because the server did not return the required CORS headers.
                </p>
                <div className="bg-[#0E0E10] p-3 rounded border border-amber-900/40 space-y-1.5">
                  <div className="text-amber-400 font-bold font-mono text-[11px]">Required Server Headers in Express:</div>
                  <pre className="font-mono text-[11px] text-[#EFEFF1] overflow-x-auto p-2 bg-[#18181B] rounded">
{`app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, DELETE");
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});`}
                  </pre>
                </div>
              </div>
            )}

            {isConnRefused && (
              <div className="space-y-2 text-[#D0D0D7] text-xs">
                <p>
                  <strong className="text-rose-300">Connection Refused (ERR_CONNECTION_REFUSED):</strong> The browser could not reach any listening service at <code className="font-mono text-[#EFEFF1]">{error.targetUrl}</code>. The local Node.js EBS server is either not running or is listening on a different port.
                </p>
                <div className="bg-[#0E0E10] p-3 rounded border border-rose-900/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-rose-400 font-bold font-mono text-[11px]">Start Standalone EBS Server:</span>
                    <button
                      onClick={() => copyCommand('node ./Server/server.js')}
                      className="text-[10px] text-[#ADADB8] hover:text-[#EFEFF1] flex items-center gap-1 bg-[#1F1F23] px-2 py-0.5 rounded border border-[#2D2D30]"
                    >
                      {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                      {copied ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                  <pre className="font-mono text-[11px] text-green-400 p-2 bg-[#18181B] rounded">
                    node ./Server/server.js
                  </pre>
                  <p className="text-[11px] text-[#ADADB8]">
                    Ensure the EBS server prints: <code className="text-white">Twitch EBS HTTPS Server running on https://localhost:3000</code>
                  </p>
                </div>
              </div>
            )}

            {(!isCors && !isConnRefused) && (
              <div className="space-y-2 text-[#D0D0D7] text-xs">
                <p className="text-[#EFEFF1]">
                  {error.suggestion}
                </p>
              </div>
            )}

            {/* Quick Actions Bar */}
            <div className="pt-2 flex flex-wrap items-center gap-2.5">
              <a
                href={error.targetUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#1F1F23] hover:bg-[#2D2D30] text-[#EFEFF1] font-medium border border-[#2D2D30] hover:border-[#9146FF]/50 transition text-xs"
              >
                <ExternalLink className="w-3.5 h-3.5 text-[#9146FF]" />
                <span>Open {error.targetUrl} in Browser</span>
              </a>

              <button
                onClick={onOpenServerModal}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#1F1F23] hover:bg-[#2D2D30] text-[#EFEFF1] font-medium border border-[#2D2D30] hover:border-green-500/50 transition text-xs"
              >
                <Server className="w-3.5 h-3.5 text-green-400" />
                <span>View EBS SSL & Node-Forge Certificate Guide</span>
              </button>
            </div>

          </div>

        </div>
      )}
    </section>
  );
};
