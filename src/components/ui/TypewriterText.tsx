'use client';

import { useState, useEffect } from 'react';

export function TypewriterText({
    text,
    className = '',
    speedDelay = 80,
    startDelay = 300,
}: {
    text: string;
    className?: string;
    speedDelay?: number;
    startDelay?: number;
}) {
    const [displayedText, setDisplayedText] = useState('');
    const [currentIndex, setCurrentIndex] = useState(0);
    const [started, setStarted] = useState(false);

    useEffect(() => {
        const startTimer = setTimeout(() => {
            setStarted(true);
        }, startDelay);

        return () => clearTimeout(startTimer);
    }, [startDelay]);

    useEffect(() => {
        if (!started) return;

        if (currentIndex < text.length) {
            const timeout = setTimeout(() => {
                setDisplayedText(prev => prev + text[currentIndex]);
                setCurrentIndex(prev => prev + 1);
            }, speedDelay);
            return () => clearTimeout(timeout);
        }
    }, [currentIndex, started, speedDelay, text]);

    return (
        <span className={className}>
            {displayedText}
            <span className="inline-block w-[3px] h-[1em] bg-yellow-400 align-text-bottom ml-1 animate-[pulse_1s_ease-in-out_infinite]" />
        </span>
    );
}
