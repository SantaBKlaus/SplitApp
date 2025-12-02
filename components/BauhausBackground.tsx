'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

const SHAPES = [
    { type: 'circle', color: 'bg-bauhaus-red', size: 120 },
    { type: 'square', color: 'bg-bauhaus-blue', size: 160 },
    { type: 'triangle', color: 'bg-bauhaus-yellow', size: 140 },
    { type: 'circle', color: 'bg-bauhaus-dark', size: 80 },
    { type: 'square', color: 'bg-bauhaus-red', size: 100 },
    { type: 'triangle', color: 'bg-bauhaus-blue', size: 180 },
    // Add a few more small shapes for depth
    { type: 'circle', color: 'bg-bauhaus-yellow', size: 60 },
    { type: 'square', color: 'bg-bauhaus-dark', size: 40 },
];

export default function BauhausBackground() {
    const [mounted, setMounted] = useState(false);
    const [windowSize, setWindowSize] = useState({ width: 1000, height: 1000 });

    useEffect(() => {
        setMounted(true);
        setWindowSize({
            width: window.innerWidth,
            height: window.innerHeight,
        });

        const handleResize = () => {
            setWindowSize({
                width: window.innerWidth,
                height: window.innerHeight,
            });
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    if (!mounted) return null;

    return (
        <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none opacity-[0.04] dark:opacity-[0.06]">
            {SHAPES.map((shape, i) => (
                <motion.div
                    key={i}
                    className={`absolute ${shape.color} ${shape.type === 'circle' ? 'rounded-full' : ''} backdrop-blur-sm`}
                    style={{
                        width: shape.size,
                        height: shape.size,
                        clipPath: shape.type === 'triangle' ? 'polygon(50% 0%, 0% 100%, 100% 100%)' : undefined,
                    }}
                    initial={{
                        x: Math.random() * windowSize.width,
                        y: Math.random() * windowSize.height,
                        rotate: Math.random() * 360,
                        scale: 0.8,
                    }}
                    animate={{
                        x: [
                            Math.random() * windowSize.width,
                            Math.random() * windowSize.width,
                            Math.random() * windowSize.width
                        ],
                        y: [
                            Math.random() * windowSize.height,
                            Math.random() * windowSize.height,
                            Math.random() * windowSize.height
                        ],
                        rotate: [0, 180, 360],
                        scale: [0.8, 1.1, 0.8],
                    }}
                    transition={{
                        duration: 30 + Math.random() * 30, // Slower, more relaxing movement
                        repeat: Infinity,
                        repeatType: "reverse",
                        ease: "linear",
                    }}
                />
            ))}
        </div>
    );
}
