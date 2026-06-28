'use client';

import React from 'react';
import Image from 'next/image';

interface EvalHeroProps {
    title: string;
    subtitles?: string[];
    /** Center the text and drop the logo (used on the result page). */
    centered?: boolean;
    /** Show the OTEPC logo on the right (used on the form page). */
    showLogo?: boolean;
    /** Heading level for correct document outline. */
    as?: 'h1' | 'h2';
}

/**
 * The brand indigo header band shared by the eval form and the result page.
 * One place owns the brand color + spacing so the two screens stay in sync.
 */
export function EvalHero({
    title,
    subtitles = [],
    centered = false,
    showLogo = false,
    as: Heading = 'h1',
}: EvalHeroProps) {
    return (
        <div
            className={`bg-indigo-700 text-white rounded-t-lg p-8 ${centered ? 'text-center' : ''}`}
        >
            <div className={showLogo ? 'flex items-center justify-between' : ''}>
                <div>
                    <Heading className="text-3xl font-bold mb-2">{title}</Heading>
                    {subtitles.map((line, i) => (
                        <p key={i} className="text-indigo-100">
                            {line}
                        </p>
                    ))}
                </div>
                {showLogo && (
                    <div className="relative w-32 h-20">
                        <Image
                            src="/images/otepc-logo-002.png"
                            alt="OTEPC Logo"
                            fill
                            sizes="128px"
                            className="object-contain"
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
