import { useState } from 'react';
import { ArrowRight } from 'lucide-react';

interface GuestNameInputProps {
  onSubmit: (name: string) => void;
}

export function GuestNameInput({ onSubmit }: GuestNameInputProps) {
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSubmit(name.trim());
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="w-full max-w-2xl">
        {/* Decorative top bar */}
        <div className="mb-12 flex items-center gap-4">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
          <div className="text-white/40 tracking-widest">GUEST</div>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
        </div>

        <div className="space-y-12">
          <div className="space-y-4">
            <h2 className="text-white/95 text-center">What should we call you?</h2>
            <p className="text-white/40 text-center">Choose a name others will see</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="relative">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                className="w-full bg-transparent border-b-2 border-white/20 focus:border-emerald-500/50 outline-none py-4 text-center text-white placeholder:text-white/30 transition-colors"
                autoFocus
                maxLength={30}
              />
              <div className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-emerald-500 to-violet-500 transition-all duration-300" style={{ width: `${(name.length / 30) * 100}%` }}></div>
            </div>

            <div className="flex justify-center">
              <button
                type="submit"
                disabled={!name.trim()}
                className="group relative inline-flex items-center gap-3 bg-white/5 backdrop-blur-sm border border-white/10 hover:border-emerald-500/50 rounded-full px-8 py-4 transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:border-white/10"
              >
                <span className="text-white">Continue</span>
                <ArrowRight className="w-4 h-4 text-white/60 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/0 to-violet-500/0 group-hover:from-emerald-500/10 group-hover:to-violet-500/10 rounded-full transition-all duration-300"></div>
              </button>
            </div>
          </form>
        </div>

        {/* Decorative bottom element */}
        <div className="mt-24 relative h-32">
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-64 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
        </div>
      </div>
    </div>
  );
}
