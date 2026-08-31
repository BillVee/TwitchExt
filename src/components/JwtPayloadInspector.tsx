import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Key, 
  Check, 
  Copy, 
  ExternalLink, 
  Clock, 
  Shield, 
  User, 
  Tv, 
  Radio, 
  AlertTriangle, 
  CheckCircle2, 
  RefreshCw, 
  ChevronDown, 
  ChevronUp, 
  Code2, 
  Sparkles,
  Layers,
  X,
  FileJson,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { RigAuth } from '../types';
import { decodeTwitchJwt, generateTwitchJwt } from '../utils/jwt';

interface JwtPayloadInspectorProps {
  auth: RigAuth;
  setAuth: React.Dispatch<React.SetStateAction<RigAuth>>;
}

export const JwtPayloadInspector: React.FC<JwtPayloadInspectorProps> = ({ auth, setAuth }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'decoded' | 'raw' | 'edit'>('decoded');
  const [isExpandedModal, setIsExpandedModal] = useState(false);
  const [customTokenInput, setCustomTokenInput] = useState(auth.token || '');
  const [lastSyncTime, setLastSyncTime] = useState<string>(new Date().toLocaleTimeString());

  const containerRef = useRef<HTMLDivElement>(null);

  // Parse JWT token from current auth state
  const decoded = useMemo(() => {
    return decodeTwitchJwt(auth.token);
  }, [auth.token]);

  // Keep custom token input synced when auth.token changes externally
  useEffect(() => {
    setCustomTokenInput(auth.token || '');
    setLastSyncTime(new Date().toLocaleTimeString());
  }, [auth.token]);

  // Handle clicking outside to close popover if not expanded into modal
  useEffect(() => {
    if (!isOpen || isExpandedModal) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, isExpandedModal]);

  const copyToClipboard = (text: string, sectionId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(sectionId);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const handleRoleQuickChange = (newRole: 'broadcaster' | 'moderator' | 'viewer' | 'external') => {
    const newToken = generateTwitchJwt({
      channelId: auth.channelId || '12345678',
      userId: auth.userId || '98765432',
      role: newRole,
    });

    setAuth((prev) => ({
      ...prev,
      role: newRole,
      token: newToken,
    }));
  };

  const handleApplyCustomToken = () => {
    const trimmed = customTokenInput.trim();
    if (!trimmed) return;

    const parsed = decodeTwitchJwt(trimmed);
    if (parsed.valid && parsed.payload) {
      setAuth((prev) => ({
        ...prev,
        token: trimmed,
        channelId: parsed.payload?.channel_id || prev.channelId,
        userId: parsed.payload?.user_id || prev.userId,
        role: (parsed.payload?.role as any) || prev.role,
      }));
      setActiveTab('decoded');
    } else {
      // Still set the token so user can debug invalid signatures/tokens
      setAuth((prev) => ({
        ...prev,
        token: trimmed,
      }));
    }
  };

  const handleRegenerateFreshToken = () => {
    const freshToken = generateTwitchJwt({
      channelId: auth.channelId || '12345678',
      userId: auth.userId || '98765432',
      role: auth.role || 'broadcaster',
      expiresInSec: 3600 * 24, // 24 hours
    });

    setAuth((prev) => ({
      ...prev,
      token: freshToken,
    }));
  };

  const getRoleBadgeStyle = (role?: string) => {
    switch (role) {
      case 'broadcaster':
        return 'bg-purple-950/80 text-purple-300 border-purple-500/50';
      case 'moderator':
        return 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50';
      case 'viewer':
        return 'bg-blue-950/80 text-blue-300 border-blue-500/50';
      case 'external':
        return 'bg-amber-950/80 text-amber-300 border-amber-500/50';
      default:
        return 'bg-zinc-800 text-zinc-300 border-zinc-700';
    }
  };

  return (
    <div ref={containerRef} className="relative inline-block">
      
      {/* Header Trigger Button */}
      <button
        id="btn-jwt-inspector-toggle"
        onClick={() => setIsOpen(!isOpen)}
        className={`px-2.5 py-1 rounded text-xs font-medium border transition flex items-center gap-1.5 ${
          isOpen
            ? 'bg-[#9146FF] border-[#9146FF] text-white shadow-sm'
            : decoded.valid
              ? 'bg-[#1F1F23] border-[#2D2D30] text-[#EFEFF1] hover:border-[#9146FF]/60'
              : 'bg-rose-950/50 border-rose-500/50 text-rose-200 hover:border-rose-400'
        }`}
        title="View decoded JWT token payload (channel_id, user_id, role) passed to extensions"
      >
        <Key className={`w-3.5 h-3.5 ${isOpen ? 'text-white' : decoded.valid ? 'text-[#9146FF]' : 'text-rose-400'}`} />
        
        <span className="font-mono text-[11px] font-semibold hidden md:inline">
          JWT Auth
        </span>

        {/* Role Pill */}
        <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono uppercase tracking-wider font-bold border ${getRoleBadgeStyle(auth.role)}`}>
          {auth.role || 'viewer'}
        </span>

        {/* Valid / Error Dot Indicator */}
        <span className={`w-1.5 h-1.5 rounded-full ${
          !decoded.valid 
            ? 'bg-rose-400 animate-ping' 
            : decoded.isExpired 
              ? 'bg-amber-400' 
              : 'bg-emerald-400'
        }`} />

        {isOpen ? (
          <ChevronUp className="w-3 h-3 text-[#ADADB8]" />
        ) : (
          <ChevronDown className="w-3 h-3 text-[#ADADB8]" />
        )}
      </button>

      {/* Popover / Modal Body */}
      {isOpen && (
        <div
          id="jwt-inspector-popover"
          className={`${
            isExpandedModal
              ? 'fixed inset-4 sm:inset-10 z-[100] max-w-4xl mx-auto flex flex-col bg-[#18181B] border border-[#3A3A3D] rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95'
              : 'absolute right-0 mt-2 w-[340px] sm:w-[460px] md:w-[540px] z-50 bg-[#18181B] border border-[#2D2D30] rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]'
          }`}
        >
          {/* Header Bar */}
          <div className="flex items-center justify-between px-4 py-3 bg-[#1F1F23] border-b border-[#2D2D30] shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-[#9146FF]/20 border border-[#9146FF]/40 flex items-center justify-center text-[#9146FF]">
                <Key className="w-3.5 h-3.5" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-semibold text-[#EFEFF1] flex items-center gap-2">
                  Twitch JWT Auth Inspector
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-black/40 text-emerald-400 border border-emerald-500/30">
                    Live Synced
                  </span>
                </h3>
                <p className="text-[10px] text-[#ADADB8]">
                  Token payload passed to all 4 extension iframe views via onAuthorized
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsExpandedModal(!isExpandedModal)}
                className="p-1 rounded hover:bg-[#2D2D30] text-[#ADADB8] hover:text-[#EFEFF1] transition"
                title={isExpandedModal ? 'Collapse view' : 'Expand full screen'}
              >
                {isExpandedModal ? (
                  <Minimize2 className="w-4 h-4" />
                ) : (
                  <Maximize2 className="w-4 h-4" />
                )}
              </button>
              <button
                onClick={() => {
                  setIsOpen(false);
                  setIsExpandedModal(false);
                }}
                className="p-1 rounded hover:bg-[#2D2D30] text-[#ADADB8] hover:text-[#EFEFF1] transition"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center justify-between border-b border-[#2D2D30] bg-[#141416] px-3 text-xs">
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab('decoded')}
                className={`py-2 px-2.5 border-b-2 font-medium transition flex items-center gap-1.5 ${
                  activeTab === 'decoded'
                    ? 'border-[#9146FF] text-[#EFEFF1]'
                    : 'border-transparent text-[#ADADB8] hover:text-[#EFEFF1]'
                }`}
              >
                <Layers className="w-3.5 h-3.5 text-[#9146FF]" />
                Decoded Payload
              </button>
              <button
                onClick={() => setActiveTab('raw')}
                className={`py-2 px-2.5 border-b-2 font-medium transition flex items-center gap-1.5 ${
                  activeTab === 'raw'
                    ? 'border-[#9146FF] text-[#EFEFF1]'
                    : 'border-transparent text-[#ADADB8] hover:text-[#EFEFF1]'
                }`}
              >
                <Code2 className="w-3.5 h-3.5 text-cyan-400" />
                Raw JWT Token
              </button>
              <button
                onClick={() => setActiveTab('edit')}
                className={`py-2 px-2.5 border-b-2 font-medium transition flex items-center gap-1.5 ${
                  activeTab === 'edit'
                    ? 'border-[#9146FF] text-[#EFEFF1]'
                    : 'border-transparent text-[#ADADB8] hover:text-[#EFEFF1]'
                }`}
              >
                <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
                Custom Token / Roles
              </button>
            </div>

            {/* Quick Refresh Button */}
            <button
              onClick={handleRegenerateFreshToken}
              className="text-[11px] font-mono text-[#ADADB8] hover:text-[#EFEFF1] flex items-center gap-1 px-2 py-1 rounded hover:bg-[#1F1F23] transition"
              title="Regenerate signed mock JWT with fresh +24h expiration"
            >
              <RefreshCw className="w-3 h-3 text-[#9146FF]" />
              <span className="hidden sm:inline">Refresh Token</span>
            </button>
          </div>

          {/* Tab Content Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
            
            {/* Decoded Claims Tab */}
            {activeTab === 'decoded' && (
              <div className="space-y-4">
                
                {/* Status Bar */}
                <div className={`p-2.5 rounded-lg border flex items-center justify-between gap-3 ${
                  decoded.valid
                    ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
                    : 'bg-rose-950/40 border-rose-500/50 text-rose-200'
                }`}>
                  <div className="flex items-center gap-2">
                    {decoded.valid ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                    )}
                    <div>
                      <div className="font-semibold text-xs text-white">
                        {decoded.valid ? 'Valid Twitch JWT Structure' : 'JWT Decode Warning'}
                      </div>
                      <div className="text-[10px] opacity-80 font-mono">
                        {decoded.valid
                          ? `Algorithm: ${decoded.header?.alg || 'HS256'} • Format: Base64URL • Synced: ${lastSyncTime}`
                          : decoded.error || 'Invalid token structure'}
                      </div>
                    </div>
                  </div>

                  {decoded.formattedExpiry && (
                    <div className="text-right shrink-0">
                      <div className="text-[10px] text-[#ADADB8]">Expires</div>
                      <div className={`text-[11px] font-mono font-medium ${decoded.isExpired ? 'text-rose-400' : 'text-emerald-300'}`}>
                        {decoded.isExpired ? 'EXPIRED' : `${Math.round((decoded.expiresInSec || 0) / 60)} min`}
                      </div>
                    </div>
                  )}
                </div>

                {/* Primary Claims Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  
                  {/* Channel ID */}
                  <div className="p-3 bg-[#1F1F23] rounded-lg border border-[#2D2D30] space-y-1">
                    <div className="flex items-center justify-between text-[#ADADB8] text-[11px]">
                      <span className="flex items-center gap-1.5">
                        <Tv className="w-3.5 h-3.5 text-[#9146FF]" />
                        channel_id
                      </span>
                      <span className="text-[9px] uppercase tracking-wider text-[#71717A]">Broadcaster ID</span>
                    </div>
                    <div className="font-mono text-sm font-bold text-white flex items-center justify-between">
                      <span>{decoded.payload?.channel_id || auth.channelId || '--'}</span>
                      <button
                        onClick={() => copyToClipboard(decoded.payload?.channel_id || auth.channelId || '', 'channel_id')}
                        className="text-[#ADADB8] hover:text-white p-1"
                        title="Copy channel_id"
                      >
                        {copiedSection === 'channel_id' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                  </div>

                  {/* User ID */}
                  <div className="p-3 bg-[#1F1F23] rounded-lg border border-[#2D2D30] space-y-1">
                    <div className="flex items-center justify-between text-[#ADADB8] text-[11px]">
                      <span className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-blue-400" />
                        user_id
                      </span>
                      <span className="text-[9px] uppercase tracking-wider text-[#71717A]">Twitch Viewer</span>
                    </div>
                    <div className="font-mono text-sm font-bold text-white flex items-center justify-between">
                      <span>{decoded.payload?.user_id || auth.userId || '--'}</span>
                      <button
                        onClick={() => copyToClipboard(decoded.payload?.user_id || auth.userId || '', 'user_id')}
                        className="text-[#ADADB8] hover:text-white p-1"
                        title="Copy user_id"
                      >
                        {copiedSection === 'user_id' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                  </div>

                  {/* Role */}
                  <div className="p-3 bg-[#1F1F23] rounded-lg border border-[#2D2D30] space-y-1">
                    <div className="flex items-center justify-between text-[#ADADB8] text-[11px]">
                      <span className="flex items-center gap-1.5">
                        <Shield className="w-3.5 h-3.5 text-emerald-400" />
                        role
                      </span>
                      <span className="text-[9px] uppercase tracking-wider text-[#71717A]">Viewer Context</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className={`px-2 py-0.5 rounded text-xs font-mono font-bold uppercase border ${getRoleBadgeStyle(decoded.payload?.role || auth.role)}`}>
                        {decoded.payload?.role || auth.role || 'viewer'}
                      </span>
                      <span className="text-[10px] text-[#ADADB8]">
                        {auth.role === 'broadcaster' ? 'Full Control' : 'Standard Access'}
                      </span>
                    </div>
                  </div>

                  {/* Opaque User ID */}
                  <div className="p-3 bg-[#1F1F23] rounded-lg border border-[#2D2D30] space-y-1">
                    <div className="flex items-center justify-between text-[#ADADB8] text-[11px]">
                      <span className="flex items-center gap-1.5">
                        <Key className="w-3.5 h-3.5 text-amber-400" />
                        opaque_user_id
                      </span>
                      <span className="text-[9px] uppercase tracking-wider text-[#71717A]">Extension ID</span>
                    </div>
                    <div className="font-mono text-xs font-semibold text-white flex items-center justify-between">
                      <span>{decoded.payload?.opaque_user_id || `U${auth.userId}`}</span>
                      <button
                        onClick={() => copyToClipboard(decoded.payload?.opaque_user_id || `U${auth.userId}`, 'opaque_user_id')}
                        className="text-[#ADADB8] hover:text-white p-1"
                        title="Copy opaque_user_id"
                      >
                        {copiedSection === 'opaque_user_id' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                  </div>

                  {/* PubSub Permissions */}
                  <div className="p-3 bg-[#1F1F23] rounded-lg border border-[#2D2D30] space-y-1 sm:col-span-2">
                    <div className="flex items-center justify-between text-[#ADADB8] text-[11px]">
                      <span className="flex items-center gap-1.5">
                        <Radio className="w-3.5 h-3.5 text-[#9146FF]" />
                        pubsub_perms
                      </span>
                      <span className="text-[9px] uppercase tracking-wider text-[#71717A]">Twitch PubSub Channel</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px]">
                      <div>
                        <span className="text-[#ADADB8]">Listen: </span>
                        <span className="font-mono text-white bg-black/40 px-1.5 py-0.5 rounded border border-[#2D2D30]">
                          {decoded.payload?.pubsub_perms?.listen?.join(', ') || 'broadcast, global'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[#ADADB8]">Send: </span>
                        <span className="font-mono text-white bg-black/40 px-1.5 py-0.5 rounded border border-[#2D2D30]">
                          {decoded.payload?.pubsub_perms?.send?.length ? decoded.payload.pubsub_perms.send.join(', ') : 'none (broadcaster only)'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* JSON Tree View */}
                <div className="bg-[#141416] p-3 rounded-lg border border-[#2D2D30] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-[#EFEFF1] flex items-center gap-1.5">
                      <FileJson className="w-3.5 h-3.5 text-[#9146FF]" />
                      Full Decoded JSON Object
                    </span>
                    <button
                      onClick={() => copyToClipboard(JSON.stringify(decoded.payload || auth, null, 2), 'json_payload')}
                      className="text-[10px] text-[#ADADB8] hover:text-white flex items-center gap-1 px-2 py-0.5 rounded bg-[#1F1F23] border border-[#2D2D30] transition"
                    >
                      {copiedSection === 'json_payload' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>Copy JSON</span>
                    </button>
                  </div>
                  <pre className="p-2.5 rounded bg-[#0E0E10] border border-[#2D2D30] text-[11px] font-mono text-emerald-300 overflow-x-auto max-h-44 scrollbar-thin">
                    {JSON.stringify(
                      {
                        header: decoded.header || { alg: 'HS256', typ: 'JWT' },
                        payload: decoded.payload || auth,
                      },
                      null,
                      2
                    )}
                  </pre>
                </div>

                {/* Extension Bridge Verification Info */}
                <div className="bg-[#1F1F23]/60 p-3 rounded-lg border border-[#2D2D30] text-[11px] text-[#ADADB8] space-y-1.5">
                  <div className="font-semibold text-white flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#9146FF]" />
                    Extension onAuthorized Integration
                  </div>
                  <p>
                    When an iframe loads or role changes, this JWT is delivered to <code className="text-white font-mono">window.Twitch.ext.onAuthorized((auth) =&gt; ...)</code> and passed in the HTTP header:
                  </p>
                  <code className="block bg-[#0E0E10] text-[#EFEFF1] p-1.5 rounded border border-[#2D2D30] font-mono text-[10px] break-all">
                    Authorization: Bearer {auth.token.slice(0, 35)}...
                  </code>
                </div>
              </div>
            )}

            {/* Raw JWT Token View Tab */}
            {activeTab === 'raw' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-[#ADADB8] text-[11px]">
                    Standard Twitch base64url-encoded JWT with 3 color-coded segments:
                  </p>
                  <button
                    onClick={() => copyToClipboard(auth.token, 'raw_token')}
                    className="text-[11px] text-[#ADADB8] hover:text-white flex items-center gap-1 px-2.5 py-1 rounded bg-[#1F1F23] border border-[#2D2D30] transition"
                  >
                    {copiedSection === 'raw_token' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>Copy Full Token</span>
                  </button>
                </div>

                {/* Color Coded JWT Breakdown */}
                <div className="p-3 bg-[#0E0E10] rounded-lg border border-[#2D2D30] font-mono text-xs break-all leading-relaxed space-y-2">
                  <div>
                    <span className="text-rose-400 font-bold" title="JWT Header (Algorithm & Token Type)">
                      {decoded.rawHeader || 'header'}
                    </span>
                    <span className="text-white font-bold">.</span>
                    <span className="text-purple-400 font-bold" title="JWT Payload (channel_id, user_id, role, exp)">
                      {decoded.rawPayload || 'payload'}
                    </span>
                    <span className="text-white font-bold">.</span>
                    <span className="text-cyan-400 font-bold" title="HMAC-SHA256 Signature">
                      {decoded.rawSignature || 'signature'}
                    </span>
                  </div>
                </div>

                {/* Segment Color Key */}
                <div className="grid grid-cols-3 gap-2 text-[10px] font-mono">
                  <div className="p-2 rounded bg-rose-950/30 border border-rose-500/30 text-rose-300">
                    <span className="font-bold block text-rose-200">1. Header (Red)</span>
                    Algorithm & Type (HS256)
                  </div>
                  <div className="p-2 rounded bg-purple-950/30 border border-purple-500/30 text-purple-300">
                    <span className="font-bold block text-purple-200">2. Payload (Purple)</span>
                    Claims & User Identity
                  </div>
                  <div className="p-2 rounded bg-cyan-950/30 border border-cyan-500/30 text-cyan-300">
                    <span className="font-bold block text-cyan-200">3. Signature (Cyan)</span>
                    HMAC-SHA256 Secret
                  </div>
                </div>

                {/* EBS Verification Code Snippet */}
                <div className="bg-[#141416] p-3 rounded-lg border border-[#2D2D30] space-y-2">
                  <div className="text-[11px] font-semibold text-white">
                    EBS Backend Verification Pattern (Node.js Express)
                  </div>
                  <pre className="p-2 rounded bg-[#0E0E10] text-[10px] font-mono text-[#ADADB8] overflow-x-auto">
{`const jwt = require('jsonwebtoken');
const secret = Buffer.from(process.env.TWITCH_EXTENSION_SECRET, 'base64');

// In your Express route handler:
const token = req.headers.authorization.split(' ')[1];
const payload = jwt.verify(token, secret, { algorithms: ['HS256'] });
console.log('Authorized channel:', payload.channel_id, 'Role:', payload.role);`}
                  </pre>
                </div>
              </div>
            )}

            {/* Custom Token & Quick Role Switcher Tab */}
            {activeTab === 'edit' && (
              <div className="space-y-4">
                
                {/* Quick Role Generator */}
                <div className="bg-[#1F1F23] p-3.5 rounded-lg border border-[#2D2D30] space-y-2.5">
                  <label className="text-xs font-semibold text-white block">
                    Quick Role Simulator & Token Generator
                  </label>
                  <p className="text-[11px] text-[#ADADB8]">
                    Click a role below to generate a new valid signed JWT and immediately test how your extension views react to different permission tiers:
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {(['broadcaster', 'moderator', 'viewer', 'external'] as const).map((role) => (
                      <button
                        key={role}
                        onClick={() => handleRoleQuickChange(role)}
                        className={`px-2.5 py-1.5 rounded text-xs font-mono font-semibold border transition capitalize flex items-center justify-center gap-1.5 ${
                          auth.role === role
                            ? 'bg-[#9146FF] border-[#9146FF] text-white shadow'
                            : 'bg-[#141416] border-[#2D2D30] text-[#ADADB8] hover:text-white hover:border-[#3A3A3D]'
                        }`}
                      >
                        {auth.role === role && <Check className="w-3 h-3" />}
                        {role}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Paste Custom Developer Console Token */}
                <div className="bg-[#1F1F23] p-3.5 rounded-lg border border-[#2D2D30] space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-white">
                      Paste Custom Twitch Extension JWT
                    </label>
                    <span className="text-[10px] text-[#ADADB8]">e.g. from Developer Console</span>
                  </div>
                  
                  <textarea
                    value={customTokenInput}
                    onChange={(e) => setCustomTokenInput(e.target.value)}
                    placeholder="Paste a JWT string (header.payload.signature)..."
                    rows={4}
                    className="w-full bg-[#0E0E10] border border-[#2D2D30] rounded p-2.5 text-xs font-mono text-[#EFEFF1] focus:outline-none focus:border-[#9146FF] transition"
                  />

                  <div className="flex items-center justify-between pt-1">
                    <button
                      onClick={handleRegenerateFreshToken}
                      className="px-3 py-1.5 rounded bg-[#141416] border border-[#2D2D30] text-xs text-[#ADADB8] hover:text-white transition"
                    >
                      Reset to Default Mock
                    </button>
                    
                    <button
                      onClick={handleApplyCustomToken}
                      className="px-4 py-1.5 rounded bg-[#9146FF] hover:bg-[#772CE8] text-white text-xs font-medium transition shadow flex items-center gap-1.5"
                    >
                      <Check className="w-3.5 h-3.5" />
                      Apply & Broadcast to Iframes
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* Footer Quick Bar */}
          <div className="px-4 py-2.5 bg-[#141416] border-t border-[#2D2D30] flex items-center justify-between text-[11px] text-[#ADADB8] shrink-0">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Auth State: <strong className="text-white">{auth.role}</strong> ({auth.userId})</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-xs text-[#ADADB8] hover:text-white px-2 py-0.5 rounded hover:bg-[#1F1F23] transition"
            >
              Done
            </button>
          </div>

        </div>
      )}
    </div>
  );
};
