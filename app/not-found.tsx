'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function NotFound() {
    const router = useRouter();

    useEffect(() => {
        router.replace('/');
    }, [router]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-background">
            <div className="animate-pulse text-foreground font-bold text-xl tracking-widest">
                REDIRECTING...
            </div>
        </div>
    );
}
