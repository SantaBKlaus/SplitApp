import { useState } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';

interface JoinRoomFormProps {
  onJoin: (code: string) => void;
  onBack: () => void;
}

export function JoinRoomForm({ onJoin, onBack }: JoinRoomFormProps) {
  const [code, setCode] = useState(['', '', '', '', '', '']);

  const handleChange = (index: number, value: string) => {
    if (value.length > 1) return;
    
    const newCode = [...code];
    newCode[index] = value.toUpperCase();
    setCode(newCode);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`code-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      const prevInput = document.getElementById(`code-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const fullCode = code.join('');
    if (fullCode.length === 6) {
      onJoin(fullCode);
    }
  };

  const isComplete = code.every(char => char !== '');

  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="w-full max-w-4xl">
        {/* Back button */}
        <button
          onClick={onBack}
          className="mb-12 inline-flex items-center gap-2 text-white/40 hover:text-white/60 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left side - Info */}
          <div className="space-y-8">
            <div className="space-y-4">
              <h2 className="text-white/95">Enter room code</h2>
              <p className="text-white/40">
                Ask the room creator for the 6-character code and enter it below to join the session.
              </p>
            </div>

            {/* Decorative element */}
            <div className="relative w-48 h-48 hidden lg:block">
              <div className="absolute inset-0 bg-gradient-to-br from-violet-500/20 to-transparent rounded-full blur-3xl"></div>
              <div className="absolute top-8 left-8 w-32 h-32 border border-white/10 rounded-full"></div>
              <div className="absolute top-16 left-16 w-16 h-16 bg-violet-500/10 rounded-full"></div>
            </div>
          </div>

          {/* Right side - Code input */}
          <div className="space-y-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="flex gap-3 justify-center">
                {code.map((char, index) => (
                  <input
                    key={index}
                    id={`code-${index}`}
                    type="text"
                    value={char}
                    onChange={(e) => handleChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    maxLength={1}
                    className="w-14 h-16 bg-white/5 backdrop-blur-sm border border-white/20 focus:border-violet-500/50 rounded-xl text-center text-white outline-none transition-all"
                    autoFocus={index === 0}
                  />
                ))}
              </div>

              {/* Progress indicator */}
              <div className="flex gap-1.5 justify-center">
                {code.map((char, index) => (
                  <div
                    key={index}
                    className={`h-1 w-8 rounded-full transition-all duration-300 ${
                      char ? 'bg-violet-500' : 'bg-white/10'
                    }`}
                  ></div>
                ))}
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={!isComplete}
                  className="group relative inline-flex items-center gap-3 bg-white/5 backdrop-blur-sm border border-white/10 hover:border-violet-500/50 rounded-full px-8 py-4 transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:border-white/10"
                >
                  <span className="text-white">Join Room</span>
                  <ArrowRight className="w-4 h-4 text-white/60 group-hover:text-violet-400 group-hover:translate-x-1 transition-all" />
                  <div className="absolute inset-0 bg-gradient-to-r from-violet-500/0 to-violet-500/0 group-hover:from-violet-500/10 group-hover:to-violet-500/10 rounded-full transition-all duration-300"></div>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
