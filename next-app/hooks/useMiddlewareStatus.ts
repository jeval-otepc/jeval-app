'use client';

import { useState, useEffect } from 'react';

interface MiddlewareStatus {
    jwtValid: boolean;
    checkTime: string;
}

export function useMiddlewareStatus() {
    const [middlewareStatus, setMiddlewareStatus] = useState<MiddlewareStatus | null>(null);

    useEffect(() => {
        const checkMiddlewareStatus = async () => {
            try {
                const jwtToken = document.cookie
                    .split(';')
                    .find((cookie) => cookie.trim().startsWith('jwt='));

                if (jwtToken) {
                    setMiddlewareStatus({
                        jwtValid: true,
                        checkTime: new Date().toLocaleTimeString('th-TH'),
                    });
                } else {
                    setMiddlewareStatus({
                        jwtValid: false,
                        checkTime: new Date().toLocaleTimeString('th-TH'),
                    });
                }
            } catch (err) {
                console.error('Failed to check middleware status:', err);
            }
        };

        checkMiddlewareStatus();
    }, []);

    return middlewareStatus;
}