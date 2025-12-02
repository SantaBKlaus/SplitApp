'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Receipt } from 'lucide-react';

export default function LoginPage() {
    const { user, signInWithGoogle } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (user) {
            router.push('/');
        }
    }, [user, router]);

    const handleGuestClick = () => {
        router.push('/');
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-8 bg-background relative z-10">
            <div className="w-full max-w-7xl grid lg:grid-cols-2 gap-16 items-center">
                {/* Left side - Brand */}
                <div className="space-y-12">
                    <div className="space-y-6">
                        <div className="inline-flex items-center gap-3 bg-[var(--card-bg)] border-2 border-[var(--border-color)] rounded-none px-5 py-2 shadow-[4px_4px_0px_0px_var(--shadow-color)]">
                            <Receipt className="w-4 h-4 text-foreground" />
                            <span className="text-foreground font-bold tracking-wide">BullSplit</span>
                        </div>

                        <div className="space-y-4">
                            <h1 className="text-6xl font-black text-foreground leading-tight tracking-tight">
                                Split bills.
                                <br />
                                <span className="text-bauhaus-red">Skip the math.</span>
                            </h1>

                            <p className="text-lg text-foreground/70 max-w-md font-medium">
                                Simple, fast bill splitting for groups. No spreadsheets, no calculators, no arguments.
                            </p>
                        </div>
                    </div>

                    {/* Decorative element */}
                    <div className="relative w-64 h-64 hidden lg:block">
                        <div className="absolute top-0 left-0 w-32 h-32 bg-bauhaus-yellow border-2 border-[var(--border-color)] rounded-none"></div>
                        <div className="absolute top-12 left-12 w-32 h-32 bg-bauhaus-blue border-2 border-[var(--border-color)]"></div>
                        <div className="absolute top-24 left-24 w-32 h-32 bg-bauhaus-red border-2 border-[var(--border-color)] rounded-none"></div>
                    </div>
                </div>

                {/* Right side - Actions */}
                <div className="space-y-6">
                    <button
                        onClick={signInWithGoogle}
                        className="w-full group relative overflow-hidden bg-[var(--card-bg)] border-2 border-[var(--border-color)] hover:shadow-[6px_6px_0px_0px_var(--shadow-color)] rounded-none p-6 transition-all duration-300 shadow-[4px_4px_0px_0px_var(--shadow-color)]"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-[var(--card-bg)] border-2 border-[var(--border-color)] rounded-none flex items-center justify-center shrink-0">
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
                                <div className="text-foreground font-bold">Continue with Google</div>
                                <div className="text-foreground/60 text-sm">Sync across devices</div>
                            </div>
                        </div>
                    </button>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t-2 border-[var(--border-color)]"></div>
                        </div>
                        <div className="relative flex justify-center">
                            <span className="px-4 bg-background text-foreground font-bold">or</span>
                        </div>
                    </div>

                    <button
                        onClick={handleGuestClick}
                        className="w-full group relative overflow-hidden bg-bauhaus-yellow border-2 border-[var(--border-color)] hover:shadow-[6px_6px_0px_0px_var(--shadow-color)] rounded-none p-6 transition-all duration-300 shadow-[4px_4px_0px_0px_var(--shadow-color)]"
                    >
                        <div className="relative">
                            <div className="text-bauhaus-dark mb-1 font-bold">Continue as Guest</div>
                            <div className="text-bauhaus-dark/70 text-sm">Quick access, no account needed</div>
                        </div>
                    </button>
                </div>
            </div>
        </div>
    );
}
