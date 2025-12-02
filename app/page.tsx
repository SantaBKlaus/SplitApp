'use client';

import { useAuth } from '@/contexts/AuthContext';
import { createRoom, getRoomByCode, getUserRooms, Room } from '@/lib/firebase/firestore';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Plus, DoorOpen, History, Split, ArrowLeft, Clock, CheckCircle, Receipt, Sun, Moon } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/contexts/ThemeContext';

import { container, bauhausCard as itemVariants, bauhausBtn, modal } from '@/lib/animations';
import AuthCard from '@/components/AuthCard';

type ViewState = 'landing' | 'menu' | 'split' | 'history';

export default function HomePage() {
  const { user, signInWithGoogle, signInAsGuest, signOut, loading } = useAuth();
  const { theme } = useTheme();
  const router = useRouter();
  const [view, setView] = useState<ViewState>('landing');
  const [isCreating, setIsCreating] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [roomCode, setRoomCode] = useState(['', '', '', '', '', '', '', '']);
  const [joiningError, setJoiningError] = useState('');
  const [userRooms, setUserRooms] = useState<Room[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [roomName, setRoomName] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [currency, setCurrency] = useState('USD');


  // Detect currency from timezone
  useEffect(() => {
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (timeZone.includes('Calcutta') || timeZone.includes('Kolkata') || timeZone.includes('India')) {
      setCurrency('INR');
    } else if (timeZone.includes('Europe') && !timeZone.includes('London')) {
      setCurrency('EUR');
    } else if (timeZone.includes('London') || timeZone.includes('GB')) {
      setCurrency('GBP');
    } else if (timeZone.includes('Tokyo') || timeZone.includes('Japan')) {
      setCurrency('JPY');
    }
  }, []);

  // Set initial view based on user type
  useEffect(() => {
    if (!loading) {
      if (!user) {
        // If we are already in split view (guest flow), don't reset to landing
        setView(current => current === 'split' ? 'split' : 'landing');
      } else if (user.isAnonymous) {
        setView('split');
      } else {
        setView('menu');
      }
    }
  }, [user, loading]);

  // Fetch history when entering history view
  useEffect(() => {
    if (view === 'history' && user && !user.isAnonymous) {
      const fetchHistory = async () => {
        setLoadingHistory(true);
        try {
          const rooms = await getUserRooms(user.uid);
          setUserRooms(rooms);
        } catch (error) {
          console.error('Error fetching history:', error);
        } finally {
          setLoadingHistory(false);
        }
      };
      fetchHistory();
    }
  }, [view, user]);

  const generateRandomRoomName = () => {
    const adjectives = ['Cozy', 'Happy', 'Sunny', 'Golden', 'Silver', 'Royal', 'Peaceful', 'Elegant', 'Grand', 'Charming'];
    const nouns = ['Villa', 'Cottage', 'Manor', 'Lodge', 'Haven', 'Palace', 'Retreat', 'Estate', 'Hideaway', 'Sanctuary'];
    const randomAdj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
    return `${randomAdj} ${randomNoun}`;
  };

  const handleCreateRoom = async () => {
    if (!user) {
      await signInWithGoogle();
      return;
    }

    setIsCreating(true);
    try {
      const finalRoomName = roomName.trim() || generateRandomRoomName();
      const { roomId } = await createRoom(user.uid, user.displayName || 'Anonymous', finalRoomName, currency, user.photoURL || undefined);
      router.push(`/room/${roomId}`);
    } catch (error) {
      console.error('Failed to create room:', error);
      setIsCreating(false);
    }
  };

  const handleCodeChange = (index: number, value: string) => {
    if (value.length > 1) return;

    const newCode = [...roomCode];
    newCode[index] = value.toUpperCase();
    setRoomCode(newCode);
    setJoiningError('');

    // Auto-focus next input
    if (value && index < 7) {
      const nextInput = document.getElementById(`code-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !roomCode[index] && index > 0) {
      const prevInput = document.getElementById(`code-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handlePaste = (index: number, e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').toUpperCase().replace(/[^A-Z0-9]/g, '');

    if (pastedData.length === 8) {
      // If exactly 8 characters, fill all inputs
      const newCode = pastedData.split('');
      setRoomCode(newCode);
      setJoiningError('');
      // Focus the last input
      setTimeout(() => {
        document.getElementById('code-7')?.focus();
      }, 0);
    } else if (pastedData.length > 0) {
      // Fill from current position
      const newCode = [...roomCode];
      for (let i = 0; i < pastedData.length && index + i < 8; i++) {
        newCode[index + i] = pastedData[i];
      }
      setRoomCode(newCode);
      setJoiningError('');
      // Focus next empty or last filled input
      const nextIndex = Math.min(index + pastedData.length, 7);
      setTimeout(() => {
        document.getElementById(`code-${nextIndex}`)?.focus();
      }, 0);
    }
  };

  const handleJoinRoom = async (e: React.FormEvent) => {
    e.preventDefault();

    const code = roomCode.join('');
    if (code.length !== 8) return;

    try {
      const room = await getRoomByCode(code);

      if (!user) {
        // If not logged in, go to join page to enter name
        router.push(`/join/${room.id}`);
      } else {
        // If logged in, join the room first then navigate
        const { joinRoom } = await import('@/lib/firebase/firestore');
        await joinRoom(room.id, user.uid, user.displayName || 'Guest', user.isAnonymous, user.photoURL || undefined);
        router.push(`/room/${room.id}`);
      }
    } catch (error) {
      setJoiningError('Room not found. Check the code and try again.');
    }
  };

  const isCodeComplete = roomCode.every(char => char !== '');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-2xl font-bold text-foreground animate-pulse">LOADING...</div>
      </div>
    );
  }

  const renderLanding = () => (
    <motion.div
      variants={container}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="w-full max-w-7xl grid lg:grid-cols-2 grid-cols-1 gap-12 items-center"
    >
      {/* Left side - Brand */}
      <div className="space-y-8">
        <motion.div variants={itemVariants} className="space-y-6">
          <div className="inline-block bg-[var(--bauhaus-dark)] text-[var(--background)] px-4 py-2 rotate-[-2deg] shadow-[4px_4px_0px_0px_var(--border-color)]">
            <span className="font-bold tracking-wider">BULLSPLIT</span>
          </div>

          <div className="space-y-4">
            <h1 className="text-5xl lg:text-7xl font-black text-foreground leading-none tracking-tight">
              SPLIT
              <br />
              <span className="text-bauhaus-red">BILLS.</span>
            </h1>

            <p className="text-xl text-foreground/70 max-w-md font-medium">
              No spreadsheets. No calculators. No arguments.
            </p>
          </div>
        </motion.div>

        {/* Geometric decorations */}
        <motion.div
          variants={itemVariants}
          className="flex gap-4"
        >
          <div className="w-16 h-16 bg-bauhaus-red border-2 border-[var(--border-color)]"></div>
          <div className="w-16 h-16 bg-bauhaus-yellow border-2 border-[var(--border-color)]"></div>
          <div className="w-16 h-16 bg-bauhaus-blue border-2 border-[var(--border-color)]"></div>
        </motion.div>
      </div>

      {/* Right side - Actions */}
      <motion.div variants={itemVariants} className="space-y-4">
        <AuthCard
          onGoogleSignIn={async () => { await signInWithGoogle(); }}
          onGuestSignIn={async (name) => {
            await signInAsGuest(name);
            setView('split');
          }}
          loading={loading}
          guestBtnText="Continue as Guest"
          googleBtnText="Continue with Google"
        />
      </motion.div>
    </motion.div>
  );

  const renderMenu = () => (
    <motion.div
      variants={container}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="grid lg:grid-cols-2 grid-cols-1 gap-6 w-full max-w-4xl"
    >
      <motion.button
        variants={itemVariants}
        whileHover={{ x: -4, y: -4 }}
        whileTap={{ x: 0, y: 0 }}
        onClick={() => setView('split')}
        className="bg-bauhaus-blue hover:bg-bauhaus-blue/90 text-white border-2 border-[var(--border-color)] shadow-[4px_4px_0px_0px_var(--shadow-color)] hover:shadow-[6px_6px_0px_0px_var(--shadow-color)] p-10 transition-all text-left rounded-none"
      >
        <div className="space-y-6">
          <div className="w-14 h-14 bg-[var(--card-bg)] border-2 border-[var(--border-color)] flex items-center justify-center rounded-none">
            <Split className="w-7 h-7 text-foreground" />
          </div>
          <div>
            <h3 className="text-3xl font-black mb-2">SPLIT BILL</h3>
            <p className="text-white/80 text-sm">Create a new room or join using a code</p>
          </div>
        </div>
      </motion.button>

      <motion.button
        variants={itemVariants}
        whileHover={{ x: -4, y: -4 }}
        whileTap={{ x: 0, y: 0 }}
        onClick={() => setView('history')}
        className="bg-bauhaus-red hover:bg-bauhaus-red/90 text-white border-2 border-[var(--border-color)] shadow-[4px_4px_0px_0px_var(--shadow-color)] hover:shadow-[6px_6px_0px_0px_var(--shadow-color)] p-10 transition-all text-left rounded-none"
      >
        <div className="space-y-6">
          <div className="w-14 h-14 bg-[var(--card-bg)] border-2 border-[var(--border-color)] flex items-center justify-center rounded-none">
            <History className="w-7 h-7 text-foreground" />
          </div>
          <div>
            <h3 className="text-3xl font-black mb-2">HISTORY</h3>
            <p className="text-white/80 text-sm">View past rooms and active splits</p>
          </div>
        </div>
      </motion.button>
    </motion.div>
  );

  const renderSplit = () => (
    <motion.div
      variants={container}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="w-full max-w-6xl space-y-6"
    >
      <motion.button
        variants={itemVariants}
        onClick={() => setView(user && !user.isAnonymous ? 'menu' : 'landing')}
        className="flex items-center gap-2 text-foreground/60 hover:text-foreground font-bold transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        {user && !user.isAnonymous ? 'BACK TO MENU' : 'BACK TO HOME'}
      </motion.button>

      <div className="grid lg:grid-cols-5 grid-cols-1 gap-6">
        {/* Create Room - Only for authenticated users */}
        {user && !user.isAnonymous && (
          <motion.button
            variants={itemVariants}
            whileHover={{ x: -4, y: -4 }}
            whileTap={{ x: 0, y: 0 }}
            onClick={() => setShowCreateModal(true)}
            disabled={isCreating}
            className="lg:col-span-3 bg-bauhaus-yellow hover:bg-bauhaus-yellow/90 text-[#1D3557] border-2 border-[var(--border-color)] shadow-[4px_4px_0px_0px_var(--border-color)] hover:shadow-[6px_6px_0px_0px_var(--border-color)] p-10 transition-all disabled:opacity-50 text-left rounded-none"
          >
            <div className="space-y-6">
              <div className="w-14 h-14 bg-[var(--card-bg)] border-2 border-[var(--border-color)] flex items-center justify-center rounded-none">
                <Plus className="w-7 h-7 text-foreground" />
              </div>

              <div className="space-y-2">
                <h3 className="text-3xl font-black">CREATE ROOM</h3>
                <p className="text-[#1D3557]/70 text-sm font-medium max-w-md">
                  Start a new session and generate a unique code
                </p>
              </div>
            </div>
          </motion.button>
        )}

        {/* Join Room */}
        <motion.button
          variants={itemVariants}
          whileHover={{ x: -4, y: -4 }}
          whileTap={{ x: 0, y: 0 }}
          onClick={() => setShowJoinModal(true)}
          className={`bg-bauhaus-blue hover:bg-bauhaus-blue/90 text-white border-2 border-[var(--border-color)] shadow-[4px_4px_0px_0px_var(--shadow-color)] hover:shadow-[6px_6px_0px_0px_var(--shadow-color)] p-10 transition-all text-left rounded-none ${user && !user.isAnonymous ? 'lg:col-span-2' : 'lg:col-span-5'}`}
        >
          <div className="space-y-6 h-full flex flex-col">
            <div className="w-14 h-14 bg-[var(--card-bg)] border-2 border-[var(--border-color)] flex items-center justify-center rounded-none">
              <DoorOpen className="w-7 h-7 text-foreground" />
            </div>

            <div className="space-y-2 flex-1">
              <h3 className="text-3xl font-black">JOIN ROOM</h3>
              <p className="text-white/80 text-sm font-medium">
                Enter a room code to join
              </p>
            </div>
          </div>
        </motion.button>
      </div>
    </motion.div>
  );

  const renderHistory = () => {
    const activeRooms = userRooms.filter(r => r.status === 'active');
    const completedRooms = userRooms.filter(r => r.status !== 'active');

    return (
      <motion.div
        variants={container}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="w-full max-w-4xl space-y-8"
      >
        <motion.button
          variants={itemVariants}
          onClick={() => setView('menu')}
          className="flex items-center gap-2 text-foreground/60 hover:text-foreground font-bold transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          BACK TO MENU
        </motion.button>

        {loadingHistory ? (
          <div className="text-center text-foreground/40 py-12 font-bold animate-pulse">LOADING HISTORY...</div>
        ) : userRooms.length === 0 ? (
          <motion.div variants={itemVariants} className="text-center py-12 bg-[var(--card-bg)] border-2 border-[var(--border-color)] shadow-[4px_4px_0px_0px_var(--border-color)] rounded-none">
            <History className="w-12 h-12 text-foreground/20 mx-auto mb-4" />
            <h3 className="text-xl font-black text-foreground mb-2">EMPTY HISTORY</h3>
            <p className="text-foreground/60 font-medium">You haven&apos;t joined any rooms yet.</p>
          </motion.div>
        ) : (
          <div className="space-y-8">
            {/* Active Rooms */}
            {activeRooms.length > 0 && (
              <motion.div variants={itemVariants} className="space-y-4">
                <h3 className="text-lg font-black text-foreground uppercase tracking-wider flex items-center gap-2">
                  <Clock className="w-5 h-5" /> Active Rooms
                </h3>
                <div className="grid gap-4">
                  {activeRooms.map(room => (
                    <motion.button
                      key={room.id}
                      whileHover={{ x: -4, y: -4 }}
                      whileTap={{ x: 0, y: 0 }}
                      onClick={() => router.push(`/room/${room.id}`)}
                      className="w-full bg-[var(--card-bg)] border-2 border-[var(--border-color)] shadow-[4px_4px_0px_0px_var(--shadow-color)] hover:shadow-[6px_6px_0px_0px_var(--shadow-color)] p-6 transition-all text-left flex items-center justify-between group rounded-none"
                    >
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <span className="bg-bauhaus-blue text-white px-2 py-0.5 text-sm font-mono font-bold border-2 border-[var(--border-color)] rounded-none">{room.code}</span>
                          <span className="text-foreground/60 text-sm font-bold">
                            {room.createdAt ? formatDistanceToNow(room.createdAt.toDate(), { addSuffix: true }) : 'Just now'}
                          </span>
                        </div>
                        <div className="text-foreground font-bold text-lg mb-1">
                          {room.name || 'Untitled Room'}
                        </div>
                        <div className="text-foreground/60 text-sm font-medium">
                          {room.participants.length} participant{room.participants.length !== 1 ? 's' : ''}
                        </div>
                      </div>
                      <div className="w-10 h-10 bg-[var(--background)] border-2 border-[var(--border-color)] flex items-center justify-center group-hover:bg-bauhaus-yellow transition-colors rounded-none">
                        <ArrowLeft className="w-5 h-5 text-foreground rotate-180" />
                      </div>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Completed Rooms */}
            {completedRooms.length > 0 && (
              <motion.div variants={itemVariants} className="space-y-4">
                <h3 className="text-lg font-black text-foreground uppercase tracking-wider flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" /> Expired Rooms
                </h3>
                <div className="grid gap-4">
                  {completedRooms.map(room => (
                    <motion.button
                      key={room.id}
                      whileHover={{ x: -2, y: -2 }}
                      whileTap={{ x: 0, y: 0 }}
                      onClick={() => router.push(`/room/${room.id}`)}
                      className="w-full bg-[var(--card-bg)] border-2 border-[var(--border-color)] shadow-[2px_2px_0px_0px_var(--border-color)] hover:shadow-[4px_4px_0px_0px_var(--border-color)] p-6 transition-all text-left flex items-center justify-between group opacity-80 hover:opacity-100 rounded-none"
                    >
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <span className="bg-gray-200 dark:bg-gray-800 text-foreground px-2 py-0.5 text-sm font-mono font-bold border-2 border-[var(--border-color)] rounded-none">{room.code}</span>
                          <span className="text-foreground/60 text-sm font-bold">
                            {room.createdAt ? formatDistanceToNow(room.createdAt.toDate(), { addSuffix: true }) : 'Unknown date'}
                          </span>
                        </div>
                        <div className="text-foreground font-bold text-lg mb-1">
                          {room.name || 'Untitled Room'}
                        </div>
                        <div className="text-foreground/60 text-sm font-medium">
                          Completed • {room.participants.length} participants
                        </div>
                      </div>
                      <div className="w-10 h-10 bg-[var(--background)] border-2 border-[var(--border-color)] flex items-center justify-center group-hover:bg-gray-200 dark:group-hover:bg-gray-800 transition-colors rounded-none">
                        <ArrowLeft className="w-5 h-5 text-foreground rotate-180" />
                      </div>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        )}
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-background relative z-10">
      <div className="w-full flex flex-col items-center">
        {/* Header - Only show if not in landing view */}

        <AnimatePresence mode="wait">
          {view !== 'landing' && (
            <motion.div
              key="header"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-12 space-y-4 text-center"
            >
              {user && (
                <div className="flex items-center gap-3">
                  <div className="inline-flex items-center gap-3 bg-[var(--card-bg)] border-2 border-[var(--border-color)] px-4 py-2 rounded-none">
                    <div className="w-2 h-2 bg-bauhaus-red"></div>
                    <span className="text-foreground font-bold tracking-wide">{user.displayName}</span>
                  </div>
                  {!user.isAnonymous && (
                    <button
                      onClick={() => signOut()}
                      className="bg-bauhaus-red border-2 border-[var(--border-color)] text-white p-2 hover:bg-bauhaus-red/80 transition-all rounded-none"
                      title="Sign Out"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                    </button>
                  )}
                </div>
              )}

              <h2 className="text-5xl font-black text-foreground">
                {view === 'menu' ? 'CHOOSE YOUR PATH' :
                  view === 'history' ? 'YOUR HISTORY' : 'START SPLITTING'}
              </h2>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {view === 'landing' && <motion.div key="landing" className="w-full flex justify-center">{renderLanding()}</motion.div>}
          {view === 'menu' && <motion.div key="menu" className="w-full flex justify-center">{renderMenu()}</motion.div>}
          {view === 'split' && <motion.div key="split" className="w-full flex justify-center">{renderSplit()}</motion.div>}
          {view === 'history' && <motion.div key="history" className="w-full flex justify-center">{renderHistory()}</motion.div>}
        </AnimatePresence>
      </div>

      {/* Join Room Modal */}
      <AnimatePresence>
        {showJoinModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => setShowJoinModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-[95%] max-w-2xl bg-[var(--card-bg)] border-2 border-[var(--border-color)] p-8 shadow-[8px_8px_0px_0px_var(--shadow-color)] rounded-none"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="space-y-8">
                <div>
                  <h3 className="text-3xl font-black text-foreground mb-2 uppercase">Enter room code</h3>
                  <p className="text-foreground/60 font-medium">
                    Ask the room creator for the 8-character code and enter it below.
                  </p>
                </div>

                <form onSubmit={handleJoinRoom} className="space-y-6">
                  <div className="grid grid-cols-4 sm:flex gap-2 justify-center">
                    {roomCode.map((char, index) => (
                      <input
                        key={index}
                        id={`code-${index}`}
                        type="text"
                        value={char}
                        onChange={(e) => handleCodeChange(index, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(index, e)}
                        onPaste={(e) => handlePaste(index, e)}
                        maxLength={1}
                        className="w-full sm:w-12 h-14 bg-[var(--card-bg)] border-2 border-[var(--border-color)] focus:shadow-[4px_4px_0px_0px_var(--border-color)] text-center text-foreground text-2xl font-black outline-none transition-all uppercase rounded-none"
                        autoFocus={index === 0}
                      />
                    ))}
                  </div>

                  {/* Progress indicator */}
                  <div className="flex gap-1 justify-center">
                    {roomCode.map((char, index) => (
                      <div
                        key={index}
                        className={`h-1 w-6 transition-all duration-300 ${char ? 'bg-bauhaus-blue' : 'bg-[var(--border-color)]/10'
                          }`}
                      ></div>
                    ))}
                  </div>

                  {joiningError && (
                    <p className="text-bauhaus-red font-bold text-center text-sm">{joiningError}</p>
                  )}

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setShowJoinModal(false);
                        setRoomCode(['', '', '', '', '', '', '', '']);
                        setJoiningError('');
                      }}
                      className="flex-1 bg-[var(--card-bg)] hover:bg-black/5 dark:hover:bg-white/5 border-2 border-[var(--border-color)] px-6 py-3 text-foreground font-bold transition-all shadow-[2px_2px_0px_0px_var(--border-color)] hover:shadow-[4px_4px_0px_0px_var(--border-color)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none rounded-none"
                    >
                      CANCEL
                    </button>
                    <button
                      type="submit"
                      disabled={!isCodeComplete}
                      className="flex-1 bg-bauhaus-blue text-white border-2 border-[var(--border-color)] px-6 py-3 font-bold transition-all shadow-[2px_2px_0px_0px_var(--shadow-color)] hover:shadow-[4px_4px_0px_0px_var(--shadow-color)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:opacity-50 disabled:shadow-none disabled:translate-x-0 disabled:translate-y-0 rounded-none"
                    >
                      JOIN ROOM
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Room Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => {
              setShowCreateModal(false);
              setRoomName('');
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[var(--card-bg)] border-2 border-[var(--border-color)] p-8 w-[95%] max-w-md shadow-[8px_8px_0px_0px_var(--shadow-color)] rounded-none"
            >
              <h3 className="text-3xl font-black text-foreground mb-6 uppercase">Create New Room</h3>
              <div className="space-y-6">
                <div>
                  <label className="text-sm font-bold text-foreground uppercase mb-2 block">
                    Room Name (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Dinner at Joe's"
                    value={roomName}
                    onChange={(e) => setRoomName(e.target.value)}
                    className="bauhaus-input w-full"
                    maxLength={50}
                  />
                </div>

                <div>
                  <label className="text-sm font-bold text-foreground uppercase mb-2 block">
                    Currency
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {['USD', 'INR', 'EUR', 'GBP', 'JPY', 'CAD'].map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setCurrency(c)}
                        className={`p-3 border-2 font-bold text-sm transition-all rounded-none ${currency === c
                          ? 'bg-bauhaus-yellow border-[var(--border-color)] text-bauhaus-dark shadow-[2px_2px_0px_0px_var(--border-color)]'
                          : 'bg-[var(--card-bg)] border-[var(--border-color)] text-foreground/40 hover:bg-black/5 dark:hover:bg-white/5 hover:text-foreground'
                          }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
                <p className="text-xs text-foreground/60 mt-2 font-medium">Give your bill split a memorable name</p>
              </div>

              <div className="flex gap-3 mt-8">
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setRoomName('');
                  }}
                  className="flex-1 bg-[var(--card-bg)] hover:bg-black/5 dark:hover:bg-white/5 border-2 border-[var(--border-color)] px-6 py-3 text-foreground font-bold transition-all shadow-[2px_2px_0px_0px_var(--border-color)] hover:shadow-[4px_4px_0px_0px_var(--border-color)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none rounded-none"
                >
                  CANCEL
                </button>
                <button
                  onClick={() => {
                    handleCreateRoom();
                    setShowCreateModal(false);
                  }}
                  disabled={isCreating}
                  className="flex-1 bg-bauhaus-blue text-white border-2 border-[var(--border-color)] px-6 py-3 font-bold transition-all shadow-[2px_2px_0px_0px_var(--shadow-color)] hover:shadow-[4px_4px_0px_0px_var(--shadow-color)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:opacity-50 disabled:shadow-none disabled:translate-x-0 disabled:translate-y-0 rounded-none"
                >
                  {isCreating ? 'CREATING...' : 'CREATE'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>


    </div >
  );
}
