import { Receipt } from 'lucide-react';

interface LandingPageProps {
  onGoogleLogin: () => void;
  onGuestClick: () => void;
}

export function LandingPage({ onGoogleLogin, onGuestClick }: LandingPageProps) {
  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="w-full max-w-7xl grid lg:grid-cols-2 gap-16 items-center">
        {/* Left side - Brand */}
        <div className="space-y-12">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-3 bg-white/5 backdrop-blur-sm border border-white/10 rounded-full px-5 py-2">
              <Receipt className="w-4 h-4 text-emerald-400" />
              <span className="text-white/60 tracking-wide">SplitMate</span>
            </div>
            
            <div className="space-y-4">
              <h1 className="text-white/95 leading-tight tracking-tight">
                Split bills.
                <br />
                <span className="text-white/40">Skip the math.</span>
              </h1>
              
              <p className="text-white/50 max-w-md">
                Simple, fast bill splitting for groups. No spreadsheets, no calculators, no arguments.
              </p>
            </div>
          </div>

          {/* Decorative element */}
          <div className="relative w-64 h-64 hidden lg:block">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 to-violet-500/20 rounded-full blur-3xl"></div>
            <div className="absolute top-12 left-12 w-40 h-40 border border-white/10 rounded-full"></div>
            <div className="absolute top-20 left-20 w-24 h-24 bg-emerald-500/10 rounded-full"></div>
          </div>
        </div>

        {/* Right side - Actions */}
        <div className="space-y-6">
          <button
            onClick={onGoogleLogin}
            className="w-full group relative overflow-hidden bg-white/5 backdrop-blur-sm border border-white/10 hover:border-white/20 rounded-2xl p-6 transition-all duration-300 hover:bg-white/10"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shrink-0">
                <svg className="w-6 h-6" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
              </div>
              <div className="text-left flex-1">
                <div className="text-white">Continue with Google</div>
                <div className="text-white/40 text-sm">Sync across devices</div>
              </div>
            </div>
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="px-4 bg-neutral-950 text-white/40">or</span>
            </div>
          </div>

          <button
            onClick={onGuestClick}
            className="w-full group relative overflow-hidden border border-white/20 hover:border-emerald-500/50 rounded-2xl p-6 transition-all duration-300"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/0 to-violet-500/0 group-hover:from-emerald-500/10 group-hover:to-violet-500/10 transition-all duration-300"></div>
            <div className="relative">
              <div className="text-white mb-1">Continue as Guest</div>
              <div className="text-white/40 text-sm">Quick access, no account needed</div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
