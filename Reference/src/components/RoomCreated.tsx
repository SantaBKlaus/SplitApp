import { Copy, Check } from 'lucide-react';
import { useState } from 'react';

interface RoomCreatedProps {
  roomCode: string;
  onBack: () => void;
}

export function RoomCreated({ roomCode, onBack }: RoomCreatedProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="w-full max-w-4xl">
        <div className="space-y-16">
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="inline-flex items-center gap-3 bg-emerald-500/10 backdrop-blur-sm border border-emerald-500/20 rounded-full px-5 py-2 mb-4">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
              <span className="text-emerald-400 tracking-wide">Room Active</span>
            </div>
            
            <h2 className="text-white/95">Your room is ready</h2>
            <p className="text-white/40">Share the code below with others to invite them</p>
          </div>

          {/* Code display - Feature focus */}
          <div className="relative">
            {/* Background glow */}
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 via-violet-500/20 to-emerald-500/20 blur-3xl"></div>
            
            <div className="relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-12">
              <div className="text-center space-y-8">
                <div className="space-y-2">
                  <div className="text-white/40 tracking-widest">ROOM CODE</div>
                  <div className="text-white tracking-[0.5em]">{roomCode}</div>
                </div>

                <button
                  onClick={handleCopy}
                  className="group inline-flex items-center gap-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-full px-6 py-3 transition-all"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span className="text-emerald-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-white/60 group-hover:text-white transition-colors" />
                      <span className="text-white/60 group-hover:text-white transition-colors">Copy Code</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-center">
            <button
              onClick={onBack}
              className="group relative inline-flex items-center gap-3 bg-white/5 backdrop-blur-sm border border-white/10 hover:border-white/20 rounded-full px-8 py-4 transition-all duration-300"
            >
              <span className="text-white">Continue</span>
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/0 to-violet-500/0 group-hover:from-emerald-500/10 group-hover:to-violet-500/10 rounded-full transition-all duration-300"></div>
            </button>
          </div>

          {/* Decorative bottom line */}
          <div className="relative h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
        </div>
      </div>
    </div>
  );
}
