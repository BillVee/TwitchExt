import React, { useState, useEffect } from 'react';
import { X, Server, ShieldCheck, Terminal, Copy, Check, Play, FileCode, CheckCircle2 } from 'lucide-react';

interface ServerGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ServerGuideModal: React.FC<ServerGuideModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'guide' | 'api' | 'code' | 'env'>('guide');
  const [copied, setCopied] = useState<string | null>(null);
  const [apiResult, setApiResult] = useState<any>(null);
  const [apiLoading, setApiLoading] = useState(false);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const testApi = async (endpoint: string) => {
    setApiLoading(true);
    try {
      const start = performance.now();
      const res = await fetch(endpoint);
      const data = await res.json();
      const duration = Math.round(performance.now() - start);
      setApiResult({ status: res.status, ok: res.ok, duration, data, endpoint });
    } catch (e: any) {
      setApiResult({ status: 'Error', ok: false, error: e.message, endpoint });
    } finally {
      setApiLoading(false);
    }
  };

  const envContent = `# Server Network Configuration
PORT=3000
HOST=0.0.0.0
NODE_ENV=development

# SSL / HTTPS Configuration (true = HTTPS with node-forge SSL, false = standard HTTP)
USE_SSL=true

# Twitch Extension Panel Dimensions (Twitch specification allows 100px to 500px height)
PANEL_HEIGHT=500
PANEL1_HEIGHT=500
PANEL2_HEIGHT=500

# Twitch Extension Credentials (dev.twitch.tv/console/extensions)
TWITCH_EXTENSION_CLIENT_ID=your_twitch_extension_client_id_here
TWITCH_EXTENSION_SECRET=your_base64_extension_secret_here
TWITCH_OWNER_ID=your_twitch_broadcaster_user_id_here

# Optional Custom SSL paths (If omitted and USE_SSL=true, node-forge generates them automatically)
# SSL_KEY_PATH=./ssl/server.key
# SSL_CERT_PATH=./ssl/server.cert`;

  const nodeForgeSnippet = `// Server/server.js - SSL Generation with node-forge
const keys = forge.pki.rsa.generateKeyPair(2048);
const cert = forge.pki.createCertificate();
cert.publicKey = keys.publicKey;
cert.serialNumber = '01' + Date.now().toString(16);
cert.validity.notBefore = new Date();
cert.validity.notAfter = new Date();
cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 1);

cert.setExtensions([
  { name: 'basicConstraints', cA: true },
  {
    name: 'subjectAltName',
    altNames: [
      { type: 2, value: 'localhost' },
      { type: 7, ip: '127.0.0.1' },
      { type: 7, ip: '::1' }
    ]
  }
]);

cert.sign(keys.privateKey, forge.md.sha256.create());
fs.writeFileSync('Server/ssl/server.key', forge.pki.privateKeyToPem(keys.privateKey));
fs.writeFileSync('Server/ssl/server.cert', forge.pki.certificateToPem(cert));`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#18181B] border border-[#2D2D30] rounded-xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#2D2D30] bg-[#18181B]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-[#9146FF]/20 border border-[#9146FF]/40 flex items-center justify-center text-[#9146FF]">
              <Server className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-semibold text-sm sm:text-base text-[#EFEFF1]">Twitch EBS & node-forge HTTPS Guide</h2>
              <p className="text-[11px] text-[#ADADB8]">Standalone Server/server.js and local SSL certificate setup</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded text-[#ADADB8] hover:text-[#EFEFF1] hover:bg-[#1F1F23] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Tabs */}
        <div className="flex border-b border-[#2D2D30] bg-[#18181B] px-5 gap-4 text-xs font-medium">
          <button
            onClick={() => setActiveTab('guide')}
            className={`py-3 border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'guide' ? 'border-[#9146FF] text-[#EFEFF1] font-semibold' : 'border-transparent text-[#ADADB8] hover:text-[#EFEFF1]'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Overview & HTTPS Setup
          </button>
          <button
            onClick={() => setActiveTab('api')}
            className={`py-3 border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'api' ? 'border-[#9146FF] text-[#EFEFF1] font-semibold' : 'border-transparent text-[#ADADB8] hover:text-[#EFEFF1]'
            }`}
          >
            <Play className="w-3.5 h-3.5" />
            Live EBS API Tester
          </button>
          <button
            onClick={() => setActiveTab('env')}
            className={`py-3 border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'env' ? 'border-[#9146FF] text-[#EFEFF1] font-semibold' : 'border-transparent text-[#ADADB8] hover:text-[#EFEFF1]'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            .env Configuration
          </button>
          <button
            onClick={() => setActiveTab('code')}
            className={`py-3 border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'code' ? 'border-[#9146FF] text-[#EFEFF1] font-semibold' : 'border-transparent text-[#ADADB8] hover:text-[#EFEFF1]'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            node-forge SSL Code
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1 text-xs text-[#EFEFF1] bg-[#0E0E10]">
          
          {activeTab === 'guide' && (
            <div className="space-y-4">
              <div className="bg-[#18181B] p-4 rounded-lg border border-[#2D2D30] space-y-2">
                <h3 className="font-semibold text-sm text-[#EFEFF1] flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-green-500" />
                  Why Twitch Extensions Require HTTPS & node-forge
                </h3>
                <p className="leading-relaxed text-[#ADADB8]">
                  Twitch's Developer Platform strictly enforces that all Extension frontend asset URLs and Extension Backend Service (EBS) endpoints use valid <strong className="text-[#EFEFF1]">HTTPS (SSL/TLS)</strong> even in local development on <code className="text-[#9146FF] font-mono bg-[#0E0E10] px-1 py-0.5 rounded border border-[#2D2D30]">localhost:3000</code>.
                </p>
                <p className="leading-relaxed text-[#ADADB8]">
                  The <code className="text-[#9146FF] font-mono bg-[#0E0E10] px-1 py-0.5 rounded border border-[#2D2D30]">Server/server.js</code> file integrates <strong className="text-[#EFEFF1]">node-forge</strong> to automatically check on startup whether <code className="font-mono text-[#EFEFF1]">Server/ssl/server.key</code> and <code className="font-mono text-[#EFEFF1]">Server/ssl/server.cert</code> exist. If missing, it generates a full 2048-bit RSA keypair and self-signed certificate with SAN entries for <code className="font-mono text-[#EFEFF1]">localhost</code> and <code className="font-mono text-[#EFEFF1]">127.0.0.1</code> automatically without needing external CLI tools like OpenSSL!
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="bg-[#18181B] p-3.5 rounded-lg border border-[#2D2D30] space-y-2">
                  <span className="font-semibold text-[#EFEFF1] flex items-center gap-1.5">
                    <span>1.</span> Run EBS Locally on HTTPS
                  </span>
                  <div className="bg-[#0E0E10] p-2.5 rounded border border-[#2D2D30] font-mono text-[11px] text-[#9146FF] flex items-center justify-between">
                    <code>node Server/server.js</code>
                    <button
                      onClick={() => copyToClipboard('node Server/server.js', 'run-cmd')}
                      className="text-[#ADADB8] hover:text-[#EFEFF1]"
                    >
                      {copied === 'run-cmd' ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <p className="text-[11px] text-[#ADADB8]">
                    Launches the HTTPS server on <code className="text-[#EFEFF1]">https://localhost:3000</code> and serves all 4 views.
                  </p>
                </div>

                <div className="bg-[#18181B] p-3.5 rounded-lg border border-[#2D2D30] space-y-2">
                  <span className="font-semibold text-[#EFEFF1] flex items-center gap-1.5">
                    <span>2.</span> Twitch Developer Console URLs
                  </span>
                  <ul className="text-[11px] space-y-1 text-[#ADADB8] font-mono">
                    <li>Video Overlay: <span className="text-[#EFEFF1]">https://localhost:3000/video_overlay.html</span></li>
                    <li>Video Component: <span className="text-[#EFEFF1]">https://localhost:3000/video_component.html</span></li>
                    <li>Panel 1: <span className="text-[#EFEFF1]">https://localhost:3000/panel.html</span></li>
                    <li>Panel 2: <span className="text-[#EFEFF1]">https://localhost:3000/panel2.html</span></li>
                    <li>Broadcaster Config: <span className="text-[#EFEFF1]">https://localhost:3000/config.html</span></li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'api' && (
            <div className="space-y-3">
              <p className="text-[#ADADB8]">
                Click any of the EBS endpoints below to test the active communication in real time:
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  onClick={() => testApi('/api/ebs/ping')}
                  className="p-2.5 bg-[#18181B] hover:bg-[#1F1F23] border border-[#2D2D30] rounded-lg text-left transition"
                >
                  <div className="font-mono text-[#9146FF] font-bold">GET /ping</div>
                  <div className="text-[10px] text-[#ADADB8]">Server Health & Ping</div>
                </button>
                <button
                  onClick={() => testApi('/api/ebs/state')}
                  className="p-2.5 bg-[#18181B] hover:bg-[#1F1F23] border border-[#2D2D30] rounded-lg text-left transition"
                >
                  <div className="font-mono text-[#9146FF] font-bold">GET /state</div>
                  <div className="text-[10px] text-[#ADADB8]">Poll & Leaderboard</div>
                </button>
                <button
                  onClick={() => testApi('/api/ebs/config')}
                  className="p-2.5 bg-[#18181B] hover:bg-[#1F1F23] border border-[#2D2D30] rounded-lg text-left transition"
                >
                  <div className="font-mono text-[#9146FF] font-bold">GET /config</div>
                  <div className="text-[10px] text-[#ADADB8]">Broadcaster Settings</div>
                </button>
                <button
                  onClick={() => testApi('/api/ebs/stats')}
                  className="p-2.5 bg-[#18181B] hover:bg-[#1F1F23] border border-[#2D2D30] rounded-lg text-left transition"
                >
                  <div className="font-mono text-[#9146FF] font-bold">GET /stats</div>
                  <div className="text-[10px] text-[#ADADB8]">Telemetry & Counters</div>
                </button>
              </div>

              {apiResult && (
                <div className="bg-[#18181B] p-3 rounded-lg border border-[#2D2D30] font-mono space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-[#9146FF] font-bold">{apiResult.endpoint}</span>
                    <span className="text-green-500 font-bold">{apiResult.duration}ms (Status: {apiResult.status})</span>
                  </div>
                  <pre className="text-[11px] text-[#EFEFF1] overflow-x-auto max-h-48 p-2 bg-[#0E0E10] border border-[#2D2D30] rounded">
                    {JSON.stringify(apiResult.data || apiResult.error, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}

          {activeTab === 'env' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-[#EFEFF1]">Local .env Configuration</span>
                <button
                  onClick={() => copyToClipboard(envContent, 'env-copy')}
                  className="flex items-center gap-1 text-[#9146FF] hover:text-[#9146FF]/80"
                >
                  {copied === 'env-copy' ? <CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied === 'env-copy' ? 'Copied' : 'Copy .env'}</span>
                </button>
              </div>
              <pre className="p-3 bg-[#18181B] border border-[#2D2D30] rounded-lg font-mono text-[11px] text-[#EFEFF1] overflow-x-auto">
                {envContent}
              </pre>
            </div>
          )}

          {activeTab === 'code' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-[#EFEFF1]">Automated node-forge SSL Generator</span>
                <button
                  onClick={() => copyToClipboard(nodeForgeSnippet, 'code-copy')}
                  className="flex items-center gap-1 text-[#9146FF] hover:text-[#9146FF]/80"
                >
                  {copied === 'code-copy' ? <CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied === 'code-copy' ? 'Copied' : 'Copy Snippet'}</span>
                </button>
              </div>
              <pre className="p-3 bg-[#18181B] border border-[#2D2D30] rounded-lg font-mono text-[11px] text-[#9146FF] overflow-x-auto">
                {nodeForgeSnippet}
              </pre>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end px-5 py-3 border-t border-[#2D2D30] bg-[#18181B]">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded bg-[#1F1F23] hover:bg-[#2D2D30] text-[#EFEFF1] font-medium text-xs border border-[#2D2D30] transition"
          >
            Close Guide
          </button>
        </div>

      </div>
    </div>
  );
};
