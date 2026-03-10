"use client";

import { useEffect, useState } from "react";
import { checkSystemHealth } from "../../app/admin/actions";
import { Server, AlertCircle } from "lucide-react";

export function SystemStatus() {
    const [status, setStatus] = useState<'ok' | 'error' | 'loading'>('loading');
    const [ping, setPing] = useState<number>(0);

    const checkHealth = async () => {
        try {
            const result = await checkSystemHealth();
            setStatus(result.status as 'ok' | 'error');
            setPing(result.ping);
        } catch (error) {
            console.error("Failed to check system health:", error);
            setStatus('error');
            setPing(0);
        }
    };

    useEffect(() => {
        // Initial check immediately
        checkHealth();

        // Then check every 30 seconds
        const intervalId = setInterval(checkHealth, 30000);

        return () => clearInterval(intervalId);
    }, []);

    return (
        <div className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1.5 shadow-sm transition-all">
            <Server className="h-4 w-4 text-gray-500" />

            {status === 'loading' && (
                <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-gray-300 animate-pulse" />
                    <span className="text-xs font-medium text-gray-500">Checking DB...</span>
                </div>
            )}

            {status === 'ok' && (
                <div className="flex items-center gap-1.5">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </span>
                    <span className="text-xs font-semibold text-gray-700">
                        DB Online <span className="text-gray-400 font-mono font-normal">({ping}ms)</span>
                    </span>
                </div>
            )}

            {status === 'error' && (
                <div className="flex items-center gap-1.5 text-red-600">
                    <span className="h-2 w-2 rounded-full bg-red-500" />
                    <span className="text-xs font-semibold">DB Offline</span>
                    <AlertCircle className="h-3 w-3" />
                </div>
            )}
        </div>
    );
}
