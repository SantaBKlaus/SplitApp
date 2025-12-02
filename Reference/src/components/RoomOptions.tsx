import { Plus, DoorOpen } from 'lucide-react';

interface RoomOptionsProps {
  userName: string;
  onCreateRoom: () => void;
  onJoinRoom: () => void;
}

export function RoomOptions({ userName, onCreateRoom, onJoinRoom }: RoomOptionsProps) {
  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="w-full max-w-6xl">
        {/* Header */}
        <div className="mb-16 space-y-4">
          <div className="inline-flex items-center gap-3 bg-white/5 backdrop-blur-sm border border-white/10 rounded-full px-5 py-2">
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
            <span className="text-white/60 tracking-wide">{userName}</span>
          </div>
          
          <h2 className="text-white/95">Choose your path</h2>
        </div>

        {/* Split layout - asymmetric */}
        <div className="grid lg:grid-cols-5 gap-8">
          {/* Create Room - Takes more space */}
          <button
            onClick={onCreateRoom}
            className="lg:col-span-3 group relative overflow-hidden bg-white/5 backdrop-blur-sm border border-white/10 hover:border-emerald-500/50 rounded-3xl p-12 transition-all duration-500 hover:bg-white/10"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-emerald-500/20 to-transparent rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            
            <div className="relative space-y-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 border border-white/20 rounded-2xl group-hover:border-emerald-500/50 transition-colors">
                <Plus className="w-8 h-8 text-white/60 group-hover:text-emerald-400 transition-colors" />
              </div>

              <div className="space-y-3">
                <h3 className="text-white text-left">Create Room</h3>
                <p className="text-white/40 text-left max-w-md">
                  Start a new session. Generate a unique code and invite others to join your bill split.
                </p>
              </div>

              <div className="flex gap-2">
                <div className="h-1 w-16 bg-white/10 rounded-full group-hover:bg-emerald-500/50 transition-colors"></div>
                <div className="h-1 w-8 bg-white/5 rounded-full"></div>
              </div>
            </div>
          </button>

          {/* Join Room - Takes less space */}
          <button
            onClick={onJoinRoom}
            className="lg:col-span-2 group relative overflow-hidden bg-white/5 backdrop-blur-sm border border-white/10 hover:border-violet-500/50 rounded-3xl p-12 transition-all duration-500 hover:bg-white/10"
          >
            <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-violet-500/20 to-transparent rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            
            <div className="relative space-y-8 h-full flex flex-col">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 border border-white/20 rounded-2xl group-hover:border-violet-500/50 transition-colors">
                <DoorOpen className="w-8 h-8 text-white/60 group-hover:text-violet-400 transition-colors" />
              </div>

              <div className="space-y-3 flex-1">
                <h3 className="text-white text-left">Join Room</h3>
                <p className="text-white/40 text-left">
                  Enter a room code to join an existing session.
                </p>
              </div>

              <div className="flex gap-2">
                <div className="h-1 w-12 bg-white/10 rounded-full group-hover:bg-violet-500/50 transition-colors"></div>
                <div className="h-1 w-6 bg-white/5 rounded-full"></div>
              </div>
            </div>
          </button>
        </div>

        {/* Bottom decorative line */}
        <div className="mt-24 relative h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
      </div>
    </div>
  );
}
