'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { getRoom, joinRoom } from '@/lib/firebase/firestore';
import { DoorOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { bauhausBtn, bauhausCard } from '@/lib/animations';
import AuthCard from '@/components/AuthCard';

export default function JoinRoomPage() {
    const params = useParams();
    const router = useRouter();
    const { user, signInWithGoogle, signInAsGuest, loading: authLoading } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [roomExists, setRoomExists] = useState<boolean | null>(null);
    const [room, setRoom] = useState<any>(null);
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
                    <AuthCard
                        onGoogleSignIn={handleGoogleSignIn}
                        onGuestSignIn={async (name) => {
                            if (!name.trim()) return;
                            try {
                                setIsLoading(true);
                                const user = await signInAsGuest(name);
                                if (user) {
                                    await joinRoom(roomId, user.uid, name, true, user.photoURL || undefined);
                                    router.push(`/room/${roomId}`);
                                }
                            } catch (error) {
                                console.error(error);
                                setIsLoading(false);
                            }
                        }}
                        loading={isLoading}
                        guestBtnText="Continue as Guest"
                        googleBtnText="Continue with Google"
                    />
                </div>
            </motion.div>
        </div>
    );
}
