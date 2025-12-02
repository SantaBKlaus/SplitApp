'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { getRoom, joinRoom } from '@/lib/firebase/firestore';
import { DoorOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { bauhausBtn, bauhausCard } from '@/lib/animations';

export default function JoinRoomPage() {
    const params = useParams();
    const router = useRouter();
    const { user, signInWithGoogle, signInAsGuest, loading: authLoading } = useAuth();
    const [guestName, setGuestName] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [roomExists, setRoomExists] = useState<boolean | null>(null);
    const [room, setRoom] = useState<any>(null);
    const [showGuestInput, setShowGuestInput] = useState(false);
    const roomId = params.roomId as string;

    useEffect(() => {
        const checkRoom = async () => {
            try {
                const roomData = await getRoom(roomId);
                setRoom(roomData);
                setRoomExists(true);
            } catch (error) {
                setRoomExists(false);
            }
        };
        checkRoom();
    }, [roomId]);

    const handleGoogleSignIn = async () => {
        try {
            setIsLoading(true);
            await signInWithGoogle();
        } catch (error) {
            console.error(error);
            setIsLoading(false);
        }
    };

    const handleJoinAsGuest = async () => {
        if (!guestName.trim()) return;
        try {
            setIsLoading(true);
            const user = await signInAsGuest(guestName);
            if (user) {
                await joinRoom(roomId, user.uid, guestName, true, user.photoURL || undefined);
                router.push(`/room/${roomId}`);
            }
        } catch (error) {
            console.error(error);
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const join = async () => {
            if (user && roomExists && !authLoading && !isLoading) {
                try {
                    // If user is already authenticated, try to join them to the room
                    // We use their existing display name or 'Guest'
                    await joinRoom(roomId, user.uid, user.displayName || 'Guest', user.isAnonymous, user.photoURL || undefined);
                    router.push(`/room/${roomId}`);
                } catch (e) {
                    console.error("Failed to join room", e);
                }
            }
        };
        join();
    }, [user, roomExists, roomId, router, authLoading, isLoading]);

    const getRoomDisplayName = () => {
        if (room?.name) return room.name;
        const synonyms = ['Bill', 'Tab', 'Check', 'Receipt', 'Split', 'Tally'];
        return synonyms[Math.floor(Math.random() * synonyms.length)];
    };

    if (roomExists === null || authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="animate-pulse text-foreground font-bold text-xl tracking-widest">LOADING...</div>
            </div>
        );
    }

    if (roomExists === false) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background p-4">
                <motion.div
                    variants={bauhausCard}
                    initial="hidden"
                    animate="visible"
                    className="bauhaus-card p-8 text-center max-w-md w-full bg-[var(--card-bg)] border-2 border-[var(--border-color)] shadow-[8px_8px_0px_0px_var(--shadow-color)] rounded-none"
                >
                    <h1 className="text-3xl font-black text-foreground mb-2 uppercase">Room Not Found</h1>
                    <p className="text-foreground/60 font-medium">The room does not exist or has expired.</p>
                    <motion.button
                        variants={bauhausBtn}
                        whileHover="hover"
                        whileTap="tap"
                        onClick={() => router.push('/')}
                        className="mt-6 bg-bauhaus-yellow text-bauhaus-dark border-2 border-[var(--border-color)] font-bold py-3 px-6 shadow-[4px_4px_0px_0px_var(--shadow-color)] rounded-none"
                    >
                        GO HOME
                    </motion.button>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4 relative z-10">
            <motion.div
                variants={bauhausCard}
                initial="hidden"
                animate="visible"
                className="w-[95%] max-w-md bauhaus-card p-6 sm:p-8 space-y-8 bg-[var(--card-bg)] border-2 border-[var(--border-color)] shadow-[8px_8px_0px_0px_var(--shadow-color)] rounded-none"
            >
                <div className="text-center space-y-4">
                    <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 45 }}
                        transition={{ type: "spring", stiffness: 260, damping: 20 }}
                        className="w-20 h-20 bg-bauhaus-yellow border-2 border-[var(--border-color)] mx-auto flex items-center justify-center shadow-[4px_4px_0px_0px_var(--shadow-color)] rounded-none"
                    >
                        <DoorOpen className="w-10 h-10 text-bauhaus-dark -rotate-45" />
                    </motion.div>
                    <div>
                        <h1 className="text-4xl font-black text-foreground tracking-tight uppercase mb-1">
                            JOIN {getRoomDisplayName().toUpperCase()}
                        </h1>
                        <p className="text-foreground/60 font-bold">Enter your details to start splitting</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <motion.button
                        variants={bauhausBtn}
                        whileHover="hover"
                        whileTap="tap"
                        onClick={handleGoogleSignIn}
                        disabled={isLoading}
                        className="w-full bg-[var(--card-bg)] border-2 border-[var(--border-color)] p-4 shadow-[4px_4px_0px_0px_var(--shadow-color)] hover:shadow-[6px_6px_0px_0px_var(--shadow-color)] disabled:opacity-50 transition-all group rounded-none"
                    >
                        <div className="flex items-center justify-center gap-3">
                            <div className="w-6 h-6 flex items-center justify-center shrink-0">
                                <svg className="w-full h-full" viewBox="0 0 24 24">
                                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                </svg>
                            </div>
                            <span className="font-bold text-foreground group-hover:text-bauhaus-blue transition-colors">Continue with Google</span>
                        </div>
                    </motion.button>

                    <div className="relative py-2">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t-2 border-[var(--border-color)]"></div>
                        </div>
                        <div className="relative flex justify-center">
                            <span className="px-4 text-foreground font-black bg-[var(--card-bg)] border-2 border-[var(--border-color)] text-xs tracking-widest rounded-none">OR</span>
                        </div>
                    </div>

                    <AnimatePresence mode="wait">
                        {!showGuestInput ? (
                            <motion.button
                                key="guest-btn"
                                variants={bauhausBtn}
                                whileHover="hover"
                                whileTap="tap"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                onClick={() => setShowGuestInput(true)}
                                className="w-full bg-bauhaus-blue text-white border-2 border-[var(--border-color)] shadow-[4px_4px_0px_0px_var(--shadow-color)] hover:shadow-[6px_6px_0px_0px_var(--shadow-color)] font-bold py-4 transition-all uppercase tracking-wider rounded-none"
                            >
                                Continue as Guest
                            </motion.button>
                        ) : (
                            <motion.div
                                key="guest-input"
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="space-y-3"
                            >
                                <input
                                    type="text"
                                    placeholder="ENTER YOUR NAME"
                                    value={guestName}
                                    onChange={(e) => setGuestName(e.target.value)}
                                    className="bauhaus-input w-full text-center font-bold uppercase placeholder:normal-case"
                                    autoFocus
                                />
                                <motion.button
                                    variants={bauhausBtn}
                                    whileHover="hover"
                                    whileTap="tap"
                                    onClick={handleJoinAsGuest}
                                    disabled={!guestName.trim() || isLoading}
                                    className="w-full bg-[var(--bauhaus-dark)] text-[var(--background)] border-2 border-[var(--border-color)] font-bold py-4 shadow-[4px_4px_0px_0px_var(--shadow-color)] hover:shadow-[6px_6px_0px_0px_var(--shadow-color)] disabled:opacity-50 uppercase tracking-widest rounded-none"
                                >
                                    {isLoading ? 'JOINING...' : 'JOIN ROOM'}
                                </motion.button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </div>
    );
}
